const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Project = require('../models/Project');
const Vendor = require('../models/Vendor');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get project statistics (must be before /:id route)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Project.aggregate([
      {
        $facet: {
          totalProjects: [{ $count: "count" }],
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          byCategory: [
            { $group: { _id: "$category", count: { $sum: 1 } } }
          ],
          byPriority: [
            { $group: { _id: "$priority", count: { $sum: 1 } } }
          ],
          recentProjects: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $project: { name: 1, status: 1, createdAt: 1, priority: 1 } }
          ]
        }
      }
    ]);

    res.json({
      total: stats[0].totalProjects[0]?.count || 0,
      byStatus: stats[0].byStatus,
      byCategory: stats[0].byCategory,
      byPriority: stats[0].byPriority,
      recentProjects: stats[0].recentProjects
    });

  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ message: 'Server error while fetching project statistics' });
  }
});

// Get all projects with filtering and pagination
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('status').optional().trim(),
  query('category').optional().trim(),
  query('priority').optional().trim()
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
      filter.$text = { $search: req.query.search };
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sort = { [sortField]: sortOrder };
    }

    const projects = await Project.find(filter)
      .populate('createdBy', 'name email')
      .populate('linkedVendors.vendor', 'companyName contactPerson.email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Project.countDocuments(filter);

    res.json({
      projects,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error while fetching projects' });
  }
});

// Get project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('linkedVendors.vendor', 'companyName contactPerson businessType address.country')
      .populate('team.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);

  } catch (error) {
    console.error('Get project error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error while fetching project' });
  }
});

// Create project
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('category').isIn([
    'Apparel', 'Home Textiles', 'Technical Textiles', 'Accessories',
    'Footwear', 'Bags & Luggage', 'Sportswear', 'Underwear',
    'Children\'s Wear', 'Formal Wear', 'Casual Wear', 'Other'
  ]).withMessage('Invalid project category'),
  body('targetMarket').optional().isIn(['Domestic', 'International', 'Both']).withMessage('Invalid target market'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const projectData = {
      ...req.body,
      createdBy: req.user._id
    };

    const project = new Project(projectData);
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Project created successfully',
      project: populatedProject
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error while creating project' });
  }
});

// Update project
router.put('/:id', auth, [
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('category').optional().isIn([
    'Apparel', 'Home Textiles', 'Technical Textiles', 'Accessories',
    'Footwear', 'Bags & Luggage', 'Sportswear', 'Underwear',
    'Children\'s Wear', 'Formal Wear', 'Casual Wear', 'Other'
  ]).withMessage('Invalid project category'),
  body('status').optional().isIn(['Planning', 'Sourcing', 'Sampling', 'Production', 'Delivery', 'Completed', 'Cancelled']).withMessage('Invalid status'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('linkedVendors.vendor', 'companyName contactPerson.email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      message: 'Project updated successfully',
      project
    });

  } catch (error) {
    console.error('Update project error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error while updating project' });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });

  } catch (error) {
    console.error('Delete project error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error while deleting project' });
  }
});

// Link vendor to project
router.post('/:id/vendors', auth, [
  body('vendorId').isMongoId().withMessage('Valid vendor ID is required'),
  body('status').optional().isIn(['Pending', 'Quoted', 'Approved', 'Rejected', 'Selected']).withMessage('Invalid vendor status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { vendorId, status = 'Pending' } = req.body;

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Check if project exists
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if vendor is already linked
    const isLinked = project.linkedVendors.some(
      link => link.vendor.toString() === vendorId
    );

    if (isLinked) {
      return res.status(400).json({ message: 'Vendor is already linked to this project' });
    }

    // Add vendor to project
    project.linkedVendors.push({
      vendor: vendorId,
      status
    });

    await project.save();

    const updatedProject = await Project.findById(req.params.id)
      .populate('linkedVendors.vendor', 'companyName contactPerson businessType');

    res.json({
      message: 'Vendor linked to project successfully',
      project: updatedProject
    });

  } catch (error) {
    console.error('Link vendor error:', error);
    res.status(500).json({ message: 'Server error while linking vendor' });
  }
});

// Update vendor status in project
router.put('/:id/vendors/:vendorId', auth, [
  body('status').isIn(['Pending', 'Quoted', 'Approved', 'Rejected', 'Selected']).withMessage('Invalid vendor status'),
  body('quote').optional().isObject().withMessage('Quote must be an object'),
  body('quote.price').optional().isNumeric().withMessage('Quote price must be a number'),
  body('quote.validUntil').optional().isISO8601().withMessage('Valid until date must be in ISO format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, quote } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const vendorLink = project.linkedVendors.find(
      link => link.vendor.toString() === req.params.vendorId
    );

    if (!vendorLink) {
      return res.status(404).json({ message: 'Vendor not linked to this project' });
    }

    // Update vendor status and quote if provided
    vendorLink.status = status;
    if (quote) {
      vendorLink.quote = { ...vendorLink.quote, ...quote };
    }

    await project.save();

    const updatedProject = await Project.findById(req.params.id)
      .populate('linkedVendors.vendor', 'companyName contactPerson businessType');

    res.json({
      message: 'Vendor status updated successfully',
      project: updatedProject
    });

  } catch (error) {
    console.error('Update vendor status error:', error);
    res.status(500).json({ message: 'Server error while updating vendor status' });
  }
});

// Remove vendor from project
router.delete('/:id/vendors/:vendorId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const initialLength = project.linkedVendors.length;
    project.linkedVendors = project.linkedVendors.filter(
      link => link.vendor.toString() !== req.params.vendorId
    );

    if (project.linkedVendors.length === initialLength) {
      return res.status(404).json({ message: 'Vendor not linked to this project' });
    }

    await project.save();

    res.json({ message: 'Vendor removed from project successfully' });

  } catch (error) {
    console.error('Remove vendor error:', error);
    res.status(500).json({ message: 'Server error while removing vendor' });
  }
});

module.exports = router;
