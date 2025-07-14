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
    refundable: Boolean
  },
  
  // Quality & Compliance
  qualityStandards: [String],
  sustainabilityPractices: [String],
  
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
