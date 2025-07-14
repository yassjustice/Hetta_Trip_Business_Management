const express = require('express');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Seed sample vendors (development only)
router.post('/vendors', auth, async (req, res) => {
  try {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Seeding not allowed in production' });
    }

    // Sample vendor data
    const sampleVendors = [
      {
        companyName: 'Sunrise Textiles Co.',
        businessType: 'Manufacturer',
        description: 'Leading manufacturer of cotton fabrics with 25+ years of experience in high-quality textile production.',
        contactPerson: {
          name: 'John Chen',
          position: 'Sales Manager',
          email: 'john.chen@sunrisetextiles.com',
          phone: '+86-138-0013-8000',
          whatsapp: '+86-138-0013-8000'
        },
        address: {
          street: '123 Industrial District',
          city: 'Guangzhou',
          state: 'Guangdong',
          country: 'China',
          zipCode: '510000'
        },
        website: 'https://www.sunrisetextiles.com',
        socialMedia: {
          linkedin: 'https://linkedin.com/company/sunrisetextiles',
          alibaba: 'https://sunrisetextiles.en.alibaba.com'
        },
        yearEstablished: 1998,
        numberOfEmployees: '201-500',
        certifications: ['GOTS', 'OEKO-TEX Standard 100', 'ISO 9001'],
        productCategories: ['Cotton Fabrics', 'Denim', 'Technical Textiles'],
        specializations: ['Organic Cotton', 'Sustainable Dyeing', 'Custom Weaving'],
        minimumOrderQuantity: {
          value: 1000,
          unit: 'meters'
        },
        priceRange: 'Mid-range',
        paymentTerms: ['T/T 30%', 'L/C at sight'],
        deliveryTime: {
          min: 15,
          max: 25,
          unit: 'days'
        },
        customization: 'Full Custom',
        samplePolicy: {
          free: false,
          cost: 50,
          refundable: true
        },
        qualityStandards: ['GOTS', 'OEKO-TEX'],
        sustainabilityPractices: ['Water recycling', 'Solar energy', 'Zero waste'],
        sourcingStatus: 'Approved',
        rating: {
          overall: 4.5,
          communication: 4.7,
          quality: 4.8,
          pricing: 4.2,
          delivery: 4.3
        },
        notes: 'Excellent quality and reliable delivery. Great partner for organic cotton projects.',
        tags: ['Organic', 'Sustainable', 'Reliable'],
        addedBy: req.user._id
      },
      {
        companyName: 'Mumbai Mills Pvt Ltd',
        businessType: 'Supplier',
        description: 'Premium silk and cotton fabric supplier specializing in traditional Indian textiles and modern blends.',
        contactPerson: {
          name: 'Priya Sharma',
          position: 'Export Manager',
          email: 'priya@mumbaimills.in',
          phone: '+91-98765-43210'
        },
        address: {
          street: '456 Textile Hub',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          zipCode: '400001'
        },
        website: 'https://www.mumbaimills.in',
        yearEstablished: 2005,
        numberOfEmployees: '51-200',
        certifications: ['GRS', 'OEKO-TEX Standard 100'],
        productCategories: ['Silk Fabrics', 'Cotton Fabrics', 'Wool Fabrics'],
        specializations: ['Hand-woven textiles', 'Block printing', 'Natural dyes'],
        minimumOrderQuantity: {
          value: 500,
          unit: 'meters'
        },
        priceRange: 'Premium',
        paymentTerms: ['T/T 50%', 'Western Union'],
        deliveryTime: {
          min: 20,
          max: 30,
          unit: 'days'
        },
        customization: 'OEM/ODM',
        samplePolicy: {
          free: true,
          cost: 0,
          refundable: false
        },
        qualityStandards: ['GRS', 'OEKO-TEX'],
        sourcingStatus: 'Under Evaluation',
        rating: {
          overall: 4.2,
          communication: 4.0,
          quality: 4.5,
          pricing: 3.8,
          delivery: 4.0
        },
        tags: ['Traditional', 'Handmade', 'Premium'],
        addedBy: req.user._id
      },
      {
        companyName: 'Vietnam Textile Solutions',
        businessType: 'Manufacturer',
        description: 'Modern manufacturing facility specializing in sportswear and technical textiles with advanced machinery.',
        contactPerson: {
          name: 'Nguyen Van Duc',
          position: 'Business Development',
          email: 'duc@vietnamtextile.vn',
          phone: '+84-909-123-456'
        },
        address: {
          street: '789 Industrial Zone B',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          country: 'Vietnam',
          zipCode: '70000'
        },
        website: 'https://www.vietnamtextile.vn',
        yearEstablished: 2010,
        numberOfEmployees: '201-500',
        certifications: ['WRAP', 'BSCI'],
        productCategories: ['Technical Textiles', 'Synthetic Fabrics', 'Knitted Fabrics'],
        specializations: ['Moisture-wicking', 'Anti-bacterial', 'UV protection'],
        minimumOrderQuantity: {
          value: 2000,
          unit: 'meters'
        },
        priceRange: 'Budget',
        paymentTerms: ['T/T 30%', 'D/P at sight'],
        deliveryTime: {
          min: 10,
          max: 20,
          unit: 'days'
        },
        customization: 'Limited',
        samplePolicy: {
          free: false,
          cost: 25,
          refundable: true
        },
        qualityStandards: ['WRAP', 'BSCI'],
        sourcingStatus: 'New Lead',
        rating: {
          overall: 3.8,
          communication: 4.0,
          quality: 3.5,
          pricing: 4.5,
          delivery: 3.8
        },
        tags: ['Technical', 'Sportswear', 'Fast delivery'],
        addedBy: req.user._id
      },
      {
        companyName: 'Turkish Luxe Fabrics',
        businessType: 'Wholesaler',
        description: 'High-end fabric wholesaler specializing in luxury textiles, cashmere, and designer fabrics.',
        contactPerson: {
          name: 'Mehmet Özkan',
          position: 'Sales Director',
          email: 'mehmet@turkishluxe.com.tr',
          phone: '+90-532-123-4567'
        },
        address: {
          street: 'Tekstil Sitesi A Blok',
          city: 'Istanbul',
          state: 'Istanbul',
          country: 'Turkey',
          zipCode: '34000'
        },
        website: 'https://www.turkishluxe.com.tr',
        yearEstablished: 1995,
        numberOfEmployees: '11-50',
        certifications: ['OEKO-TEX Standard 100', 'EU Ecolabel'],
        productCategories: ['Wool Fabrics', 'Silk Fabrics', 'Home Textiles'],
        specializations: ['Luxury fabrics', 'Cashmere', 'Designer collections'],
        minimumOrderQuantity: {
          value: 100,
          unit: 'meters'
        },
        priceRange: 'Luxury',
        paymentTerms: ['T/T 50%', 'L/C 90 days'],
        deliveryTime: {
          min: 7,
          max: 14,
          unit: 'days'
        },
        customization: 'Full Custom',
        samplePolicy: {
          free: true,
          cost: 0,
          refundable: false
        },
        qualityStandards: ['OEKO-TEX', 'EU Ecolabel'],
        sourcingStatus: 'Contacted',
        rating: {
          overall: 4.7,
          communication: 4.8,
          quality: 4.9,
          pricing: 3.5,
          delivery: 4.5
        },
        tags: ['Luxury', 'Designer', 'European quality'],
        addedBy: req.user._id
      },
      {
        companyName: 'Bangladesh Knits Ltd',
        businessType: 'Agent',
        description: 'Export agent connecting international buyers with top-tier Bangladeshi garment manufacturers.',
        contactPerson: {
          name: 'Rahman Ahmed',
          position: 'Export Agent',
          email: 'rahman@bdknits.com',
          phone: '+880-1711-123456'
        },
        address: {
          street: '321 Export Processing Zone',
          city: 'Dhaka',
          state: 'Dhaka',
          country: 'Bangladesh',
          zipCode: '1000'
        },
        yearEstablished: 2008,
        numberOfEmployees: '1-10',
        certifications: ['WRAP', 'SA8000'],
        productCategories: ['Knitted Fabrics', 'Garment Manufacturing'],
        specializations: ['T-shirts', 'Knitwear', 'Casual wear'],
        minimumOrderQuantity: {
          value: 5000,
          unit: 'pieces'
        },
        priceRange: 'Budget',
        paymentTerms: ['T/T 30%', 'L/C at sight'],
        deliveryTime: {
          min: 30,
          max: 45,
          unit: 'days'
        },
        customization: 'OEM/ODM',
        samplePolicy: {
          free: false,
          cost: 15,
          refundable: true
        },
        qualityStandards: ['WRAP', 'SA8000'],
        sourcingStatus: 'Sample Requested',
        rating: {
          overall: 4.0,
          communication: 4.2,
          quality: 3.8,
          pricing: 4.8,
          delivery: 3.5
        },
        tags: ['Garments', 'Cost-effective', 'Large capacity'],
        addedBy: req.user._id
      }
    ];

    // Clear existing vendors (development only)
    await Vendor.deleteMany({});

    // Insert sample vendors
    const vendors = await Vendor.insertMany(sampleVendors);

    res.json({
      message: `Successfully seeded ${vendors.length} sample vendors`,
      vendors: vendors.map(v => ({ id: v._id, companyName: v.companyName, sourcingStatus: v.sourcingStatus }))
    });

  } catch (error) {
    console.error('Seed vendors error:', error);
    res.status(500).json({ message: 'Error seeding vendors', error: error.message });
  }
});

module.exports = router;
