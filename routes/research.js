const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Research = require('../models/Research');
const Vendor = require('../models/Vendor');
const { auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const AIServiceManager = require('../services/AIServiceManager');
// Research service imports
const WebSearchService = require('../services/WebSearchService');
const DataExtractionService = require('../services/DataExtractionService');

// Bulk autonomous extraction for a list of links
router.post('/bulk-extract', auth, [
  body('links').isArray({ min: 1, max: 50 }).withMessage('Links must be an array of 1-50 URLs'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { links, aiContext = {} } = req.body;
    const dataExtractionService = new DataExtractionService();
    const { results, csv } = await dataExtractionService.bulkExtract(links, aiContext);
    res.json({ vendors: results, csv });
  } catch (error) {
    console.error('Bulk autonomous extraction error:', error);
    res.status(500).json({ message: 'Bulk autonomous extraction failed', error: error.message });
  }
});

// Delete a research session
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    const research = await Research.findOne({
      _id: req.params.id,
      initiatedBy: req.user.id
    });
    if (!research) {
      return res.status(404).json({ message: 'Research session not found' });
    }
    await research.deleteOne();
    res.json({ message: 'Research session deleted successfully' });
  } catch (error) {
    console.error('Delete research session error:', error);
    res.status(500).json({ message: 'Server error while deleting research session' });
  }
});

// Create a new research session
router.post('/sessions', auth, [
  body('searchTerms')
    .isArray({ min: 1, max: 10 })
    .withMessage('Search terms must be an array with 1-10 items'),
  body('searchTerms.*')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Each search term must be 2-100 characters'),
  body('config.maxResultsPerTerm')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Max results per term must be 1-20'),
  body('config.searchEngines')
    .optional()
    .isArray()
    .withMessage('Search engines must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { searchTerms, config = {} } = req.body;
    const sessionId = uuidv4();

    // Intent analysis for each search term
    const aiService = new AIServiceManager();
    const analyzedTerms = [];
    for (const term of searchTerms) {
      const intentResult = await aiService.analyzeSearchIntent(term);
      analyzedTerms.push({
        term: term.trim(),
        status: 'Pending',
        results: [],
        aiIntent: intentResult.parsed || null,
        aiRaw: intentResult.result || null
      });
    }

    // Default configuration
    const defaultConfig = {
      maxResultsPerTerm: 10,
      searchEngines: ['Google', 'Bing', 'DuckDuckGo'],
      includeImages: false,
      fetchTimeout: 30000,
      respectRobotsTxt: true
    };

    const researchConfig = { ...defaultConfig, ...config };

    // --- Merged Link Extraction Detour ---
    // For each search term, fetch links from GoogleSearch API, ScrapingBee, and AI deep search, merge, and process via bulk extraction
    const WebSearchService = require('../services/WebSearchService');
    const DataExtractionService = require('../services/DataExtractionService');
    const webSearchService = new WebSearchService(researchConfig);
    const dataExtractionService = new DataExtractionService();
    let mergedLinks = [];
    for (const term of searchTerms) {
      // 1. Get links from GoogleSearch API and ScrapingBee
      let webLinks = [];
      try {
        webLinks = await webSearchService.search(term, researchConfig.maxResultsPerTerm);
      } catch (e) {
        webLinks = [];
      }
      // 2. Get links from AI deep search
      let aiLinks = [];
      try {
        aiLinks = await aiService.generateAISearchResults(term);
      } catch (e) {
        aiLinks = [];
      }
      // 3. Merge and deduplicate
      const allLinks = [...webLinks.map(l => l.url), ...aiLinks.map(l => l.website || l.url)].filter(Boolean);
      mergedLinks.push(...allLinks);
    }
    // Deduplicate mergedLinks
    mergedLinks = Array.from(new Set(mergedLinks));
    // 4. Bulk extract
    let bulkExtractResults = { results: [], csv: '' };
    if (mergedLinks.length > 0) {
      bulkExtractResults = await dataExtractionService.bulkExtract(mergedLinks, {});
    }
    // --- End Detour ---

    // Create research session
    const research = new Research({
      sessionId,
      initiatedBy: req.user.id,
      searchTerms: analyzedTerms,
      status: 'Pending',
      config: researchConfig,
      summary: {
        totalSearchTerms: searchTerms.length,
        totalResults: bulkExtractResults.results.length,
        successfulFetches: bulkExtractResults.results.filter(r => r.fetchStatus === 'Fetched').length,
        failedFetches: bulkExtractResults.results.filter(r => r.fetchStatus === 'Failed').length,
        importedVendors: 0,
        duplicatesFound: 0,
        averageDataQuality: 0,
        processingTimeMs: 0
      }
    });

    // Attach extracted results to first search term for now (can be distributed later)
    if (analyzedTerms.length > 0) {
      analyzedTerms[0].results = bulkExtractResults.results;
    }

    await research.save();

    // Start background processing (don't await - let it run async)
    processResearchSession(research._id).catch(error => {
      console.error('Background research processing failed:', error);
    });

    res.status(201).json({
      message: 'Research session created successfully',
      sessionId,
      researchId: research._id,
      status: 'Pending',
      ai: analyzedTerms.map(t => t.aiIntent)
    });

  } catch (error) {
    console.error('Create research session error:', error);
    res.status(500).json({ message: 'Server error while creating research session' });
  }
});

// Get all research sessions for the user
router.get('/sessions', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['Pending', 'Processing', 'Completed', 'Failed', 'Cancelled'])
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

    const filter = { initiatedBy: req.user.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const research = await Research.find(filter)
      .select('-searchTerms.results.extractedData.rawTextContent') // Exclude large text content
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('initiatedBy', 'name email');

    const total = await Research.countDocuments(filter);

    res.json({
      research,
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
    console.error('Get research sessions error:', error);
    res.status(500).json({ message: 'Server error while fetching research sessions' });
  }
});

// Get specific research session
router.get('/sessions/:id', auth, async (req, res) => {
  try {
    const research = await Research.findOne({
      _id: req.params.id,
      initiatedBy: req.user.id
    }).populate('initiatedBy', 'name email');

    if (!research) {
      return res.status(404).json({ message: 'Research session not found' });
    }

    res.json(research);

  } catch (error) {
    console.error('Get research session error:', error);
    res.status(500).json({ message: 'Server error while fetching research session' });
  }
});

// Import research results to vendor database
router.post('/sessions/:sessionId/import', auth, [
  body('resultIds')
    .isArray({ min: 1 })
    .withMessage('Result IDs must be a non-empty array'),
  body('overrides')
    .optional()
    .isObject()
    .withMessage('Overrides must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { resultIds, overrides = {} } = req.body;
    const sessionId = req.params.sessionId;

    const research = await Research.findOne({
      sessionId,
      initiatedBy: req.user.id
    });

    if (!research) {
      return res.status(404).json({ message: 'Research session not found' });
    }

    const importResults = [];
    let importedCount = 0;
    let duplicateCount = 0;

    // Process each result ID
    for (const resultId of resultIds) {
      const result = findResultInResearch(research, resultId);
      
      if (!result) {
        importResults.push({
          resultId,
          status: 'Not Found',
          message: 'Result not found in research session'
        });
        continue;
      }

      try {
        // Check for duplicates
        const existingVendor = await findDuplicateVendor(result.extractedData);
        
        if (existingVendor) {
          duplicateCount++;
          result.importStatus = 'Duplicate';
          importResults.push({
            resultId,
            status: 'Duplicate',
            message: 'Similar vendor already exists',
            existingVendorId: existingVendor._id
          });
          continue;
        }

        // Create vendor from research data
        const vendorData = mapResearchToVendor(result.extractedData, overrides[resultId]);
        vendorData.addedBy = req.user.id;
        
        // Mark as research-derived
        vendorData.researchData = {
          sourceUrl: result.url,
          extractedDate: result.fetchedAt,
          dataQuality: result.dataQuality,
          needsValidation: true,
          extractedFields: Object.keys(result.extractedData)
        };

        const vendor = new Vendor(vendorData);
        await vendor.save();

        // Update research result
        result.importStatus = 'Imported';
        result.importedVendorId = vendor._id;
        
        importedCount++;
        importResults.push({
          resultId,
          status: 'Imported',
          message: 'Successfully imported as new vendor',
          vendorId: vendor._id
        });

      } catch (error) {
        console.error('Import error for result:', resultId, error);
        result.importStatus = 'Failed';
        importResults.push({
          resultId,
          status: 'Failed',
          message: error.message
        });
      }
    }

    // Update research summary
    research.summary.importedVendors += importedCount;
    research.summary.duplicatesFound += duplicateCount;
    await research.save();

    res.json({
      message: `Import completed: ${importedCount} imported, ${duplicateCount} duplicates found`,
      importedCount,
      duplicateCount,
      results: importResults
    });

  } catch (error) {
    console.error('Import research results error:', error);
    res.status(500).json({ message: 'Server error while importing research results' });
  }
});

// Cancel research session
router.post('/sessions/:sessionId/cancel', auth, async (req, res) => {
  try {
    const research = await Research.findOneAndUpdate(
      {
        sessionId: req.params.sessionId,
        initiatedBy: req.user.id,
        status: { $in: ['Pending', 'Processing'] }
      },
      { status: 'Cancelled' },
      { new: true }
    );

    if (!research) {
      return res.status(404).json({ 
        message: 'Research session not found or cannot be cancelled' 
      });
    }

    res.json({
      message: 'Research session cancelled successfully',
      sessionId: research.sessionId
    });

  } catch (error) {
    console.error('Cancel research session error:', error);
    res.status(500).json({ message: 'Server error while cancelling research session' });
  }
});

// Update result validation status
router.patch('/sessions/:sessionId/results/:resultId/validate', auth, [
  body('validated').isBoolean().withMessage('Validated must be boolean'),
  body('overrides').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { validated, overrides = {} } = req.body;
    const { sessionId, resultId } = req.params;

    const research = await Research.findOne({
      sessionId,
      initiatedBy: req.user.id
    });

    if (!research) {
      return res.status(404).json({ message: 'Research session not found' });
    }

    const result = findResultInResearch(research, resultId);
    if (!result) {
      return res.status(404).json({ message: 'Research result not found' });
    }

    // Context-aware validation using AI intent (if available)
    let aiValidation = null;
    if (result && result.aiIntent && result.extractedData) {
      try {
        const aiService = new AIServiceManager();
        const prompt = `Validate the following extracted data for the given intent.\nIntent: ${JSON.stringify(result.aiIntent)}\nExtracted Data: ${JSON.stringify(result.extractedData)}`;
        const aiResult = await aiService.callAI(prompt, 'gemini');
        aiValidation = aiResult.result || null;
      } catch (e) {
        aiValidation = null;
      }
    }

    // Update validation status
    result.needsValidation = !validated;
    if (validated) {
      result.validatedBy = req.user.id;
      result.validatedAt = new Date();
    }

    // Apply any data overrides
    if (Object.keys(overrides).length > 0) {
      result.extractedData = { ...result.extractedData, ...overrides };
    }

    await research.save();

    res.json({
      message: 'Result validation updated successfully',
      result: {
        needsValidation: result.needsValidation,
        validatedAt: result.validatedAt,
        aiValidation
      }
    });
  } catch (error) {
    console.error('Update result validation error:', error);
    res.status(500).json({ message: 'Server error while updating validation' });
  }
});

// Helper functions

async function processResearchSession(researchId) {
  try {
    const research = await Research.findById(researchId);
    if (!research || research.status !== 'Pending') return;

    // AI-generated search results and service suggestions
    const aiService = new AIServiceManager();
    let aiSuggestions = [];
    try {
      aiSuggestions = await aiService.generateAISearchResults(research.searchTerms.map(t => t.term).join(', '));
    } catch (e) {
      aiSuggestions = [];
    }
    research.aiSuggestions = aiSuggestions;
    await research.save();

    const startTime = Date.now();
    research.status = 'Processing';
    await research.save();

    const webSearchService = new WebSearchService(research.config);
    const dataExtractionService = new DataExtractionService();

    for (let i = 0; i < research.searchTerms.length; i++) {
      const searchTerm = research.searchTerms[i];
      // Prepare AI context for extraction
      const aiContext = {
        intent: searchTerm.aiIntent?.intent || null,
        strategy: searchTerm.aiIntent?.searchStrategy || null,
        relevanceScore: searchTerm.aiIntent?.relevanceScore || null,
        validationContext: searchTerm.aiIntent?.validationContext || null,
        rationale: searchTerm.aiIntent?.rationale || null
      };
      // Generate AI extraction guide for this term
      let extractionGuide = null;
      try {
        const aiService = new AIServiceManager();
        extractionGuide = await aiService.generateExtractionGuide({ term: searchTerm.term, aiContext });
      } catch (guideError) {
        extractionGuide = null;
      }
      try {
        searchTerm.status = 'Processing';
        await research.save();

        // Perform web search
        const searchResults = await webSearchService.search(
          searchTerm.term,
          research.config.maxResultsPerTerm
        );

        // Process each search result using new extraction method
        for (const searchResult of searchResults) {
          try {
            const result = {
              url: searchResult.url,
              title: searchResult.title,
              description: searchResult.description,
              source: searchResult.source,
              rank: searchResult.rank,
              fetchStatus: 'Pending',
              extractedData: {},
              dataQuality: 'Medium',
              completenessScore: 0,
              needsValidation: true,
              fetchedAt: new Date()
            };

            // Use new extraction method (web+AI)
            const extracted = await dataExtractionService.extract({
              url: searchResult.url,
              aiContext,
              extractionGuide,
              mode: 'web+ai'
            });
            result.extractedData = extracted;
            result.fetchStatus = extracted.error ? 'Failed' : 'Fetched';
            result.completenessScore = calculateCompletenessScore(extracted);
            result.dataQuality = determineDataQuality(extracted, result.completenessScore);
            result.processedAt = new Date();

            // Surface AI guide, intent, rationale, and compliance
            result.aiExtractionGuide = extractionGuide;
            result.aiIntent = aiContext.intent || null;
            result.aiRationale = extracted.decisionRationale || '';
            // Compliance: does result match intent/guide?
            result.compliance = checkCompliance(extracted, extractionGuide, aiContext.intent);

            // Use AI-driven entity classification if available
            let entityType = extracted.entityType || 'unknown';
            let confidence = extracted.confidence || 0;
            let rationale = extracted.decisionRationale || '';

            // Fallback: If AI fails, infer from businessType
            if (entityType === 'unknown' && extracted.businessType) {
              const bt = extracted.businessType.toLowerCase();
              if (["manufacturer","supplier","factory","trading company"].includes(bt)) {
                entityType = 'vendor';
                confidence = 0.5;
                rationale += ' | Fallback: businessType indicates vendor.';
              }
            }
            result.aiEntityType = entityType;
            result.aiEntityConfidence = confidence;
            result.aiEntityRationale = rationale;

            // DEBUG: Log result before saving
            require('../services/debugLogger').logDebug('processResearchSession.result', result);

            if (["vendor","service_owner","small_business","reseller","printing_shop","factory","online_business","social_media_seller"].includes(result.aiEntityType)) {
              searchTerm.results.push(result);
              research.summary.successfulFetches++;
            }
            // Save after each result to ensure persistence
            await research.save();
          } catch (fetchError) {
            console.error('Fetch error for URL:', searchResult.url, fetchError);
            const failedResult = {
              url: searchResult.url,
              title: searchResult.title,
              description: searchResult.description,
              source: searchResult.source,
              rank: searchResult.rank,
              fetchStatus: 'Failed',
              error: {
                message: fetchError.message,
                code: fetchError.code,
                timestamp: new Date()
              },
              fetchedAt: new Date()
            };
            searchTerm.results.push(failedResult);
            research.summary.failedFetches++;
            await research.save();
          }
        }

        // Optionally: run AI-only extraction for additional results
        try {
          const aiOnlyResult = await dataExtractionService.extract({
            url: searchTerm.term, // or use a special AI-only context
            aiContext,
            extractionGuide,
            mode: 'ai-only'
          });
          if (aiOnlyResult && aiOnlyResult.entityType && ["vendor","service_owner","small_business","reseller","printing_shop","factory","online_business","social_media_seller"].includes(aiOnlyResult.entityType)) {
            searchTerm.results.push({
              url: aiOnlyResult.website || '',
              title: aiOnlyResult.companyName || '',
              description: aiOnlyResult.description || '',
              source: 'ai-only',
              rank: 0,
              fetchStatus: aiOnlyResult.error ? 'Failed' : 'Fetched',
              extractedData: aiOnlyResult,
              dataQuality: determineDataQuality(aiOnlyResult, calculateCompletenessScore(aiOnlyResult)),
              completenessScore: calculateCompletenessScore(aiOnlyResult),
              needsValidation: true,
              processedAt: new Date(),
              aiEntityType: aiOnlyResult.entityType,
              aiEntityConfidence: aiOnlyResult.confidence,
              aiEntityRationale: aiOnlyResult.decisionRationale
            });
            research.summary.successfulFetches++;
          }
        } catch (aiOnlyError) {
          // Log but do not fail session
        }

        searchTerm.status = 'Completed';
        research.summary.totalResults += searchTerm.results.length;

      } catch (searchError) {
        console.error('Search error for term:', searchTerm.term, searchError);
        searchTerm.status = 'Failed';
      }

      await research.save();
    }

    // Finalize research session
    research.status = 'Completed';
    research.summary.processingTimeMs = Date.now() - startTime;
    research.summary.averageDataQuality = calculateAverageDataQuality(research);
    
    await research.save();

  } catch (error) {
    console.error('Research processing error:', error);
    
    try {
      await Research.findByIdAndUpdate(researchId, { 
        status: 'Failed',
        error: {
          message: error.message,
          timestamp: new Date()
        }
      });
    } catch (updateError) {
      console.error('Failed to update research status:', updateError);
    }
  }
}

function findResultInResearch(research, resultId) {
  for (const searchTerm of research.searchTerms) {
    const result = searchTerm.results.find(r => r._id.toString() === resultId);
    if (result) return result;
  }
  return null;
}

async function findDuplicateVendor(extractedData) {
  const queries = [];
  
  // Check by company name
  if (extractedData.companyName) {
    queries.push({
      companyName: { $regex: extractedData.companyName, $options: 'i' }
    });
  }
  
  // Check by website
  if (extractedData.website) {
    queries.push({
      website: { $regex: extractedData.website.replace(/^https?:\/\//, ''), $options: 'i' }
    });
  }
  
  // Check by email
  if (extractedData.email && extractedData.email.length > 0) {
    queries.push({
      'contactPerson.email': { $in: extractedData.email }
    });
  }

  if (queries.length === 0) return null;

  return await Vendor.findOne({ $or: queries });
}

function mapResearchToVendor(extractedData, overrides = {}) {
  // Normalize extracted fields to arrays of strings if needed
  function normalizeStringArray(val) {
    // Helper to extract all string values from an object or array
    function extractStrings(obj) {
      if (typeof obj === 'string') return [obj];
      if (Array.isArray(obj)) return obj.flatMap(extractStrings);
      if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).flatMap(extractStrings);
      }
      return [];
    }

    if (Array.isArray(val)) {
      return val.flatMap(extractStrings).map(String);
    }
    if (typeof val === 'string') {
      // Try to parse JSON array or object
      try {
        const parsed = JSON.parse(val);
        return extractStrings(parsed).map(String);
      } catch (e) {
        // Not JSON, just return as single string
        return [val];
      }
    }
    if (typeof val === 'object' && val !== null) {
      return extractStrings(val).map(String);
    }
    return [];
  }

  const vendorData = {
    // Basic information
    companyName: extractedData.companyName || 'Unknown Company',
    businessType: extractedData.businessType || 'Supplier',
    description: extractedData.description || '',
    
    // Contact information
    contactPerson: {
      name: extractedData.contactPerson?.name || '',
      email: (Array.isArray(extractedData.email) ? extractedData.email[0] : extractedData.email) || '',
      phone: (Array.isArray(extractedData.phone) ? extractedData.phone[0] : extractedData.phone) || ''
    },
    
    // Address
    address: extractedData.address || {},
    website: extractedData.website || '',
    
    // Product and service information
    productCategories: normalizeStringArray(extractedData.productCategories),
    serviceTypes: normalizeStringArray(extractedData.serviceTypes),
    printingMethods: normalizeStringArray(extractedData.printingMethods),
    
    // Pricing
    pricingModels: normalizeStringArray(extractedData.pricingModels),
    priceRanges: normalizeStringArray(extractedData.priceRanges),
    
    // Business policies
    businessPolicies: extractedData.businessPolicies || {},
    
    // Capabilities
    minimumOrderQuantity: extractedData.minimumOrderQuantity || {},
    productionCapacity: extractedData.productionCapacity || {},
    
    // Quality and reputation
    reputation: extractedData.reputation || {},
    
    // Equipment
    equipment: extractedData.equipment ? extractedData.equipment.map(eq => ({
      type: eq,
      brand: '',
      model: '',
      quantity: 1,
      capabilities: []
    })) : [],
    
    // Status
    sourcingStatus: 'New Lead',
    
    // Default values
    yearEstablished: null,
    numberOfEmployees: null,
    priceRange: null,
    customization: null,
    
    // Sample policy
    samplePolicy: {
      available: extractedData.businessPolicies?.samples?.available || false,
      free: extractedData.businessPolicies?.samples?.free || false,
      cost: extractedData.businessPolicies?.samples?.cost || 0,
      refundable: false,
      turnaroundTime: extractedData.businessPolicies?.samples?.turnaroundTime || ''
    }
  };

  // Apply any user overrides
  return { ...vendorData, ...overrides };
}

function calculateCompletenessScore(extractedData) {
  const fields = [
    'companyName', 'businessType', 'description', 'website',
    'email', 'phone', 'address', 'serviceTypes', 'productCategories'
  ];
  
  let score = 0;
  for (const field of fields) {
    if (extractedData[field] && 
        (Array.isArray(extractedData[field]) ? extractedData[field].length > 0 : true)) {
      score += 10;
    }
  }
  
  return Math.min(score, 100);
}

function determineDataQuality(extractedData, completenessScore) {
  if (completenessScore >= 70) return 'High';
  if (completenessScore >= 40) return 'Medium';
  return 'Low';
}

function calculateAverageDataQuality(research) {
  let totalQuality = 0;
  let count = 0;
  
  const qualityMap = { 'Low': 1, 'Medium': 2, 'High': 3 };
  
  for (const searchTerm of research.searchTerms) {
    for (const result of searchTerm.results) {
      if (result.dataQuality) {
        totalQuality += qualityMap[result.dataQuality] || 0;
        count++;
      }
    }
  }
  
  return count > 0 ? totalQuality / count : 0;
}

// Compliance check utility
function checkCompliance(extracted, guide, intent) {
  // Example: check if extracted fields match guide selectors/keywords and intent
  if (!guide || !intent) return 'unknown';
  let matches = 0;
  if (guide.selectors && Array.isArray(guide.selectors)) {
    for (const sel of guide.selectors) {
      if (extracted.rawTextContent && extracted.rawTextContent.includes(sel)) matches++;
    }
  }
  if (guide.keywords && Array.isArray(guide.keywords)) {
    for (const kw of guide.keywords) {
      if (extracted.rawTextContent && extracted.rawTextContent.includes(kw)) matches++;
    }
  }
  // Intent match: check if businessType or description contains intent
  if (extracted.businessType && extracted.businessType.toLowerCase().includes(intent.toLowerCase())) matches++;
  if (extracted.description && extracted.description.toLowerCase().includes(intent.toLowerCase())) matches++;
  return matches > 0 ? 'compliant' : 'not_compliant';
}

module.exports = router;
