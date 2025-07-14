const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Project Details
  category: {
    type: String,
    enum: [
      'Apparel', 'Home Textiles', 'Technical Textiles', 'Accessories',
      'Footwear', 'Bags & Luggage', 'Sportswear', 'Underwear',
      'Children\'s Wear', 'Formal Wear', 'Casual Wear', 'Other'
    ],
    required: true
  },
  
  targetMarket: {
    type: String,
    enum: ['Domestic', 'International', 'Both']
  },
  
  budget: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' }
  },
  
  timeline: {
    startDate: Date,
    endDate: Date,
    milestones: [{
      name: String,
      date: Date,
      completed: { type: Boolean, default: false }
    }]
  },
  
  // Requirements
  specifications: {
    fabric: String,
    colors: [String],
    sizes: [String],
    quantity: {
      min: Number,
      max: Number
    },
    packaging: String,
    labeling: String
  },
  
  // Linked Vendors
  linkedVendors: [{
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Quoted', 'Approved', 'Rejected', 'Selected'],
      default: 'Pending'
    },
    quote: {
      price: Number,
      currency: { type: String, default: 'USD' },
      validUntil: Date,
      notes: String,
      documents: [{
        name: String,
        url: String,
        uploadDate: { type: Date, default: Date.now }
      }]
    },
    addedDate: { type: Date, default: Date.now }
  }],
  
  // Project Status
  status: {
    type: String,
    enum: ['Planning', 'Sourcing', 'Sampling', 'Production', 'Delivery', 'Completed', 'Cancelled'],
    default: 'Planning'
  },
  
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  
  // Files & Documents
  documents: [{
    name: String,
    type: { type: String, enum: ['design', 'specification', 'sample', 'contract', 'other'] },
    url: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  
  notes: String,
  tags: [String],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Owner', 'Manager', 'Member', 'Viewer']
    }
  }]
  
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ name: 'text', description: 'text' });
projectSchema.index({ status: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Project', projectSchema);
