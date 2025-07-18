const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  // Basic Information
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['Manufacturer', 'Supplier', 'Wholesaler', 'Agent', 'Trading Company'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Contact Information
  contactPerson: {
    name: { type: String, required: true },
    position: String,
    email: { type: String, required: true },
    phone: String,
    whatsapp: String
  },
  
  address: {
    street: String,
    city: String,
    state: String,
    country: { type: String, required: true },
    zipCode: String
  },
  
  website: String,
  socialMedia: {
    linkedin: String,
    facebook: String,
    instagram: String,
    alibaba: String
  },
  
  // Business Details
  yearEstablished: Number,
  numberOfEmployees: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    default: null
  },
  certifications: [String],
  
  // Product & Service Information
  productCategories: [{
    type: String,
    enum: [
      'Cotton Fabrics', 'Silk Fabrics', 'Wool Fabrics', 'Synthetic Fabrics',
      'Denim', 'Knitted Fabrics', 'Technical Textiles', 'Home Textiles',
      'Garment Manufacturing', 'Yarn', 'Accessories', 'Trims'
    ]
  }],
  
  specializations: [String],
  
  // Expanded service types from research data
  serviceTypes: [{
    type: String,
    enum: [
      'Printing', 'Sewing', 'Shipping', 'Marketing', 'Haute Couture',
      'Design', 'Blank Apparel Sales', 'All-in-One Services', 
      'Printer/Machine Sales', 'Equipment Sales', 'Heat Press',
      'Oven Equipment', 'Consulting', 'Pattern Making', 'Sampling'
    ]
  }],
  
  // Printing methods for printing services
  printingMethods: [{
    type: String,
    enum: [
      'DTG', 'DTF', 'Screen Printing Plastisol', 'Screen Printing Water-based',
      'Screen Printing Silicone', 'Screen Printing Suede', 'Sublimation',
      'Heat Transfer', 'Vinyl Cutting', 'Embroidery', 'Digital Printing'
    ]
  }],
  
  // Pricing models and structure
  pricingModels: [{
    type: String,
    enum: ['Per Piece', 'Per Design', 'Flat Rate', 'Tiered Pricing', 'Bulk Discount', 'Custom Quote']
  }],
  
  priceRanges: [{
    service: String,
    minPrice: Number,
    maxPrice: Number,
    currency: { type: String, default: 'USD' },
    unit: String, // per piece, per design, etc.
    notes: String
  }],
  minimumOrderQuantity: {
    value: Number,
    unit: String
  },
  
  // Pricing & Terms
  priceRange: {
    type: String,
    enum: ['Budget', 'Mid-range', 'Premium', 'Luxury'],
    default: null
  },
  paymentTerms: [String],
  deliveryTime: {
    min: Number,
    max: Number,
    unit: { type: String, default: 'days' }
  },
  
  // Capabilities
  customization: {
    type: String,
    enum: ['None', 'Limited', 'Full Custom', 'OEM/ODM'],
    default: null
  },
  samplePolicy: {
    free: Boolean,
    cost: Number,
    refundable: Boolean,
    available: Boolean,
    turnaroundTime: String
  },
  
  // Enhanced business policies from research
  businessPolicies: {
    returns: {
      accepted: Boolean,
      timeframe: String,
      conditions: String
    },
    samples: {
      available: Boolean,
      cost: Number,
      free: Boolean,
      turnaroundTime: String
    },
    payment: {
      methods: [String], // Credit Card, PayPal, Bank Transfer, etc.
      terms: String,
      advanceRequired: Number // percentage
    },
    shipping: {
      domestic: Boolean,
      international: Boolean,
      freeShipping: Boolean,
      freeShippingThreshold: Number,
      shippingCost: String
    },
    areaOfOperation: {
      countries: [String],
      global: Boolean,
      regions: [String]
    }
  },
  
  // Production capacity and capabilities
  productionCapacity: {
    dailyOutput: Number,
    monthlyOutput: Number,
    unit: String,
    scalability: String
  },
  
  // Equipment and machinery
  equipment: [{
    type: String,
    brand: String,
    model: String,
    quantity: Number,
    capabilities: [String]
  }],
  
  // Quality & Compliance
  qualityStandards: [String],
  sustainabilityPractices: [String],
  
  // Reputation and reviews from research
  reputation: {
    overallScore: Number, // 1-10
    reviewCount: Number,
    trustScore: Number, // 1-10
    verificationStatus: {
      type: String,
      enum: ['Unverified', 'Basic', 'Verified', 'Premium'],
      default: 'Unverified'
    }
  },
  
  // Social proof and certifications
  certifications: [{
    name: String,
    issuedBy: String,
    validUntil: Date,
    verified: Boolean
  }],
  
  // Research metadata
  researchData: {
    sourceUrl: String,
    extractedDate: Date,
    dataQuality: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    needsValidation: { type: Boolean, default: false },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validatedAt: Date,
    extractedFields: [String] // List of fields that were auto-extracted
  },
  
  // Files & Documents
  documents: [{
    name: String,
    type: { type: String, enum: ['catalog', 'certificate', 'sample', 'quote', 'other'] },
    url: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  
  // Status & Tracking
  sourcingStatus: {
    type: String,
    enum: ['New Lead', 'Contacted', 'Sample Requested', 'Under Evaluation', 'Approved', 'Rejected'],
    default: 'New Lead'
  },
  
  rating: {
    overall: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    quality: { type: Number, min: 1, max: 5 },
    pricing: { type: Number, min: 1, max: 5 },
    delivery: { type: Number, min: 1, max: 5 }
  },
  
  notes: String,
  tags: [String],
  
  // Metadata
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastContact: Date,
  
}, {
  timestamps: true
});

// Indexes for better search performance
vendorSchema.index({ companyName: 'text', description: 'text', specializations: 'text' });
vendorSchema.index({ productCategories: 1 });
vendorSchema.index({ 'address.country': 1 });
vendorSchema.index({ sourcingStatus: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
