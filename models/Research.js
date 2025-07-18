const mongoose = require('mongoose');

const researchSchema = new mongoose.Schema({
  // Research session information
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  
  // User who initiated the research
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Search parameters
  searchTerms: [{
    term: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed'],
      default: 'Pending'
    },
    results: [{
      url: String,
      title: String,
      description: String,
      source: { type: String, enum: ['Google', 'Bing', 'DuckDuckGo'] },
      rank: Number,
      fetchStatus: {
        type: String,
        enum: ['Pending', 'Fetched', 'Failed', 'Blocked'],
        default: 'Pending'
      },
      extractedData: {
        // Contact Information
        website: String,
        email: [String],
        phone: [String],
        whatsapp: String,
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          zipCode: String
        },
        
        // Business Information
        companyName: String,
        businessType: String,
        description: String,
        
        // Services and Products
        serviceTypes: [String],
        printingMethods: [String],
        productCategories: [String],
        
        // Pricing Information
        pricingModels: [String],
        priceRanges: [{
          service: String,
          minPrice: Number,
          maxPrice: Number,
          currency: String,
          unit: String,
          notes: String
        }],
        
        // Business Policies
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
            methods: [String],
            terms: String,
            advanceRequired: Number
          },
          shipping: {
            domestic: Boolean,
            international: Boolean,
            freeShipping: Boolean,
            freeShippingThreshold: Number
          },
          areaOfOperation: {
            countries: [String],
            global: Boolean
          }
        },
        
        // Capabilities
        minimumOrderQuantity: {
          value: Number,
          unit: String
        },
        productionCapacity: {
          dailyOutput: Number,
          monthlyOutput: Number,
          unit: String
        },
        
        // Quality and Reputation
        certifications: [String],
        reputation: {
          overallScore: Number,
          reviewCount: Number,
          trustScore: Number
        },
        
        // Technical Details
        equipment: [String],
        qualityStandards: [String],
        
        // Additional extracted text
        rawTextContent: String,
        keyPhrases: [String]
      },
      
      // Data quality and validation
      dataQuality: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
      },
      completenessScore: { type: Number, min: 0, max: 100 },
      needsValidation: { type: Boolean, default: true },
      validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      validatedAt: Date,
      
      // Import status
      importStatus: {
        type: String,
        enum: ['Pending', 'Imported', 'Rejected', 'Duplicate'],
        default: 'Pending'
      },
      importedVendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
      },
      
      // Error information
      error: {
        message: String,
        code: String,
        timestamp: Date
      },
      
      fetchedAt: Date,
      processedAt: Date
    }]
  }],
  
  // Overall session status
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  
  // Configuration used for this research
  config: {
    maxResultsPerTerm: { type: Number, default: 10 },
    searchEngines: [{ type: String, enum: ['Google', 'Bing', 'DuckDuckGo'] }],
    includeImages: { type: Boolean, default: false },
    fetchTimeout: { type: Number, default: 30000 }, // 30 seconds
    userAgent: String,
    respectRobotsTxt: { type: Boolean, default: true }
  },
  
  // Summary statistics
  summary: {
    totalSearchTerms: Number,
    totalResults: Number,
    successfulFetches: Number,
    failedFetches: Number,
    importedVendors: Number,
    duplicatesFound: Number,
    averageDataQuality: Number,
    processingTimeMs: Number
  },
  
  // Notes and user feedback
  notes: String,
  userFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    comments: String,
    improvementSuggestions: [String]
  }
  
}, {
  timestamps: true
});

// Indexes for performance
researchSchema.index({ sessionId: 1 });
researchSchema.index({ initiatedBy: 1 });
researchSchema.index({ status: 1 });
researchSchema.index({ 'searchTerms.term': 1 });
researchSchema.index({ createdAt: -1 });

// Virtual for completion percentage
researchSchema.virtual('completionPercentage').get(function() {
  if (!this.searchTerms || this.searchTerms.length === 0) return 0;
  
  const completedTerms = this.searchTerms.filter(term => 
    term.status === 'Completed' || term.status === 'Failed'
  ).length;
  
  return Math.round((completedTerms / this.searchTerms.length) * 100);
});

module.exports = mongoose.model('Research', researchSchema);
