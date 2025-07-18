const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Vendor = require('../models/Vendor');
const { auth } = require('../middleware/auth');

const multer = require('multer');
const upload = multer();
const { parse: csvParse } = require('csv-parse/sync');

const router = express.Router();

// Get vendor statistics (must be before /:id route)

// Bulk import vendors from CSV text
router.post('/bulk-import', auth, async (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ message: 'CSV data required' });
    const records = csvParse(csv, { columns: true, skip_empty_lines: true, delimiter: ',' });
    const vendors = records.map(row => ({
      companyName: row.companyName,
      businessType: row.businessType,
      description: row.description,
      contactPerson: {
        name: row['contactPerson.name'],
        email: row['contactPerson.email'],
        phone: row['contactPerson.phone']
      },
      address: {
        street: row['address.street'],
        city: row['address.city'],
        state: row['address.state'],
        country: row['address.country']
      },
      website: row.website,
      serviceTypes: row.serviceTypes?.split(';').map(s => s.trim()).filter(Boolean) || [],
      productCategories: row.productCategories?.split(';').map(s => s.trim()).filter(Boolean) || [],
      printingMethods: row.printingMethods?.split(';').map(s => s.trim()).filter(Boolean) || [],
      pricingModels: row.pricingModels?.split(';').map(s => s.trim()).filter(Boolean) || [],
      minimumOrderQuantity: row.moq ? { value: Number(row.moq), unit: 'pieces' } : undefined,
      priceRange: row.priceRange || undefined,
      certifications: [
        {
          name: row['certifications.name'],
          issuedBy: row['certifications.issuedBy'],
          validUntil: row['certifications.validUntil'] ? new Date(row['certifications.validUntil']) : undefined,
          verified: row['certifications.verified'] === 'true' || row['certifications.verified'] === true
        }
      ],
      sourcingStatus: row.status || undefined,
      rating: row.rating ? { overall: Number(row.rating) } : undefined,
      addedBy: req.user?._id
    }));
    const created = await Vendor.insertMany(vendors);
    res.json({ success: true, count: created.length });
  } catch (err) {
    console.error('Bulk import error:', err);
    res.status(500).json({ message: 'Bulk import failed', error: err.message });
  }
});

// Bulk import vendors from uploaded file
router.post('/bulk-import-file', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File required' });
    const csv = req.file.buffer.toString('utf8');
    const records = csvParse(csv, { columns: true, skip_empty_lines: true, delimiter: ',' });
    const vendors = records.map(row => ({
      companyName: row.companyName,
      businessType: row.businessType,
      description: row.description,
      email: row.email,
      phone: row.phone,
      website: row.website,
      address: { raw: row.address },
      serviceTypes: row.serviceTypes?.split(';').map(s => s.trim()).filter(Boolean) || [],
      productCategories: row.productCategories?.split(';').map(s => s.trim()).filter(Boolean) || [],
      pricingModels: row.pricingModels?.split(';').map(s => s.trim()).filter(Boolean) || [],
      certifications: row.certifications?.split(';').map(s => s.trim()).filter(Boolean) || []
    }));
    const created = await Vendor.insertMany(vendors);
    res.json({ success: true, count: created.length });
  } catch (err) {
    console.error('Bulk import file error:', err);
    res.status(500).json({ message: 'Bulk import file failed', error: err.message });
  }
});
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Vendor.aggregate([
      {
        $facet: {
          totalVendors: [{ $count: "count" }],
          byBusinessType: [
            { $group: { _id: "$businessType", count: { $sum: 1 } } }
          ],
          bySourceStatus: [
            { $group: { _id: "$sourcingStatus", count: { $sum: 1 } } }
          ],
          byCountry: [
            { $group: { _id: "$address.country", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          recentlyAdded: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $project: { companyName: 1, createdAt: 1, sourcingStatus: 1 } }
          ]
        }
      }
    ]);

    res.json({
      total: stats[0].totalVendors[0]?.count || 0,
      byBusinessType: stats[0].byBusinessType,
      bySourceStatus: stats[0].bySourceStatus,
      byCountry: stats[0].byCountry,
      recentlyAdded: stats[0].recentlyAdded
    });

  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ message: 'Server error while fetching vendor statistics' });
  }
});

// Get all vendors with filtering and pagination
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('country').optional().trim(),
  query('productCategory').optional().trim(),
  query('sourcingStatus').optional().trim(),
  query('businessType').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      // Enhanced search - search across multiple fields
      filter.$or = [
        { companyName: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'contactPerson.name': { $regex: searchTerm, $options: 'i' } },
        { 'contactPerson.email': { $regex: searchTerm, $options: 'i' } },
        { 'address.city': { $regex: searchTerm, $options: 'i' } },
        { 'address.country': { $regex: searchTerm, $options: 'i' } },
        { specializations: { $in: [new RegExp(searchTerm, 'i')] } },
        { productCategories: { $in: [new RegExp(searchTerm, 'i')] } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } },
        { businessType: { $regex: searchTerm, $options: 'i' } },
        { sourcingStatus: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (req.query.country) {
      filter['address.country'] = new RegExp(req.query.country, 'i');
    }
    
    if (req.query.productCategory) {
      filter.productCategories = { $in: [new RegExp(req.query.productCategory, 'i')] };
    }
    
    if (req.query.sourcingStatus) {
      filter.sourcingStatus = req.query.sourcingStatus;
    }
    
    if (req.query.businessType) {
      filter.businessType = req.query.businessType;
    }

    // Add additional filters
    if (req.query.priceRange) {
      filter.priceRange = req.query.priceRange;
    }

    if (req.query.yearEstablished) {
      const year = parseInt(req.query.yearEstablished);
      if (!isNaN(year)) {
        filter.yearEstablished = year;
      }
    }

    if (req.query.minRating) {
      const rating = parseFloat(req.query.minRating);
      if (!isNaN(rating)) {
        filter['rating.overall'] = { $gte: rating };
      }
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sort = { [sortField]: sortOrder };
    }

    const vendors = await Vendor.find(filter)
      .populate('addedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Vendor.countDocuments(filter);

    res.json({
      vendors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
        limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Server error while fetching vendors' });
  }
});

// Get vendor by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('addedBy', 'name email');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(vendor);

  } catch (error) {
    console.error('Get vendor error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.status(500).json({ message: 'Server error while fetching vendor' });
  }
});

// Create vendor
router.post('/', auth, [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('businessType').isIn(['Manufacturer', 'Supplier', 'Wholesaler', 'Agent', 'Trading Company']).withMessage('Invalid business type'),
  body('contactPerson.name').trim().notEmpty().withMessage('Contact person name is required'),
  body('contactPerson.email').isEmail().normalizeEmail().withMessage('Valid contact email is required'),
  body('address.country').trim().notEmpty().withMessage('Country is required')
  // Removed productCategories requirement for flexible saving
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Clean up empty enum fields to prevent validation errors
    const vendorData = {
      ...req.body,
      addedBy: req.user._id
    };

    // Handle enum fields - set to null if empty
    if (vendorData.numberOfEmployees === '') {
      vendorData.numberOfEmployees = null;
    }
    if (vendorData.priceRange === '') {
      vendorData.priceRange = null;
    }
    if (vendorData.customization === '') {
      vendorData.customization = null;
    }

    const vendor = new Vendor(vendorData);
    await vendor.save();

    const populatedVendor = await Vendor.findById(vendor._id)
      .populate('addedBy', 'name email');

    res.status(201).json({
      message: 'Vendor created successfully',
      vendor: populatedVendor
    });

  } catch (error) {
    console.error('Create vendor error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Vendor with this information already exists' });
    }
    res.status(500).json({ message: 'Server error while creating vendor' });
  }
});

// Update vendor
router.put('/:id', auth, [
  body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('businessType').optional().isIn(['Manufacturer', 'Supplier', 'Wholesaler', 'Agent', 'Trading Company']).withMessage('Invalid business type'),
  body('contactPerson.name').optional().trim().notEmpty().withMessage('Contact person name cannot be empty'),
  body('contactPerson.email').optional().isEmail().normalizeEmail().withMessage('Valid contact email is required'),
  body('address.country').optional().trim().notEmpty().withMessage('Country cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Clean up empty enum fields to prevent validation errors
    const updateData = { ...req.body, updatedAt: Date.now() };
    
    // Handle enum fields - set to null if empty
    if (updateData.numberOfEmployees === '') {
      updateData.numberOfEmployees = null;
    }
    if (updateData.priceRange === '') {
      updateData.priceRange = null;
    }
    if (updateData.customization === '') {
      updateData.customization = null;
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('addedBy', 'name email');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({
      message: 'Vendor updated successfully',
      vendor
    });

  } catch (error) {
    console.error('Update vendor error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.status(500).json({ message: 'Server error while updating vendor' });
  }
});

// Delete vendor
router.delete('/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({ message: 'Vendor deleted successfully' });

  } catch (error) {
    console.error('Delete vendor error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.status(500).json({ message: 'Server error while deleting vendor' });
  }
});

// Update vendor rating
router.put('/:id/rating', auth, [
  body('overall').optional().isFloat({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('communication').optional().isFloat({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
  body('quality').optional().isFloat({ min: 1, max: 5 }).withMessage('Quality rating must be between 1 and 5'),
  body('pricing').optional().isFloat({ min: 1, max: 5 }).withMessage('Pricing rating must be between 1 and 5'),
  body('delivery').optional().isFloat({ min: 1, max: 5 }).withMessage('Delivery rating must be between 1 and 5')
], async (req, res) => {
  try {
    console.log('Rating update request:', {
      vendorId: req.params.id,
      body: req.body,
      user: req.user?._id
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Validate that at least one rating field is provided
    const ratingFields = ['overall', 'communication', 'quality', 'pricing', 'delivery'];
    const providedFields = ratingFields.filter(field => req.body[field] !== undefined);
    
    if (providedFields.length === 0) {
      return res.status(400).json({ 
        message: 'At least one rating field must be provided',
        validFields: ratingFields
      });
    }

    // Calculate overall rating if individual ratings are provided
    const currentVendor = await Vendor.findById(req.params.id);
    if (!currentVendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Merge with existing rating
    const existingRating = currentVendor.rating || {};
    const ratingData = { ...existingRating, ...req.body };
    
    const individualRatings = ['communication', 'quality', 'pricing', 'delivery'].filter(key => 
      ratingData[key] !== undefined && ratingData[key] !== null
    );
    
    if (individualRatings.length > 0 && !req.body.overall) {
      const sum = individualRatings.reduce((total, key) => total + ratingData[key], 0);
      ratingData.overall = Math.round((sum / individualRatings.length) * 10) / 10; // Round to 1 decimal
    }

    console.log('Processed rating data:', ratingData);

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { rating: ratingData },
      { new: true, runValidators: true }
    );

    console.log('Rating updated successfully:', vendor.rating);

    res.json({
      message: 'Vendor rating updated successfully',
      rating: vendor.rating
    });

  } catch (error) {
    console.error('Update rating error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.status(500).json({ message: 'Server error while updating rating' });
  }
});

module.exports = router;
