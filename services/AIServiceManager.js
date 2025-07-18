// services/AIServiceManager.js
// AI Service Manager for Trip-Tex Research AI Upgrade
// Manages API keys, load balancing, and AI-powered research methods

class AIServiceManager {
  constructor() {
    // Load Gemini keys from GEMINI_API_KEY, GEMINI_API_KEY2, ..., GEMINI_API_KEY6
    this.geminiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY2,
      process.env.GEMINI_API_KEY3,
      process.env.GEMINI_API_KEY4,
      process.env.GEMINI_API_KEY5,
      process.env.GEMINI_API_KEY6
    ].filter(Boolean);
    // HuggingFace and OpenRouter keys
    this.huggingfaceKey = process.env.HUGGING_FACE_AI_TOKEN || process.env.HUGGINGFACE_API_KEY || '';
    this.openrouterKey = process.env.OPENROUTER_API_KEY || '';
    this.currentGeminiIndex = 0;
    this.requestQueue = [];
    this.rateLimiter = new Map();
  }

  // Round-robin Gemini key selection
  getNextGeminiKey() {
    if (!this.geminiKeys.length) return null;
    const key = this.geminiKeys[this.currentGeminiIndex];
    this.currentGeminiIndex = (this.currentGeminiIndex + 1) % this.geminiKeys.length;
    return key;
  }

  // Fallback chain: Gemini → OpenRouter → HuggingFace
  async callAI(prompt, provider = 'gemini') {
    // Implements Gemini API call, fallback to stub for others
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    const debugLogPath = path.join(__dirname, '../logs/debug-extraction-flow.log');
    function logFlow(entry) {
      const line = `[${new Date().toISOString()}] AIServiceManager: ${typeof entry === 'string' ? entry : JSON.stringify(entry)}\n`;
      fs.appendFileSync(debugLogPath, line);
    }
    const flowEntry = { provider, prompt, start: Date.now() };
    if (provider === 'gemini') {
      const key = this.getNextGeminiKey();
      if (!key) {
        flowEntry.error = 'No Gemini API key configured';
        flowEntry.end = Date.now();
        flowEntry.durationMs = flowEntry.end - flowEntry.start;
        logFlow(flowEntry);
        return { provider, error: 'No Gemini API key configured', result: null };
      }
      // Try models in order: base, fallback
      const geminiModels = [
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro-latest'
      ];
      let response = null;
      let text = null;
      let lastError = null;
      for (const model of geminiModels) {
        try {
          flowEntry.model = model;
          response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
            },
            {
              params: { key },
              timeout: 15000
            }
          );
          text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
          flowEntry.result = text;
          flowEntry.response = response.data;
          flowEntry.end = Date.now();
          flowEntry.durationMs = flowEntry.end - flowEntry.start;
          logFlow(flowEntry);
          return { provider, prompt, result: text, model };
        } catch (err) {
          lastError = err;
          flowEntry.error = err.message;
          flowEntry.response = err.response?.data || null;
        }
      }
      flowEntry.end = Date.now();
      flowEntry.durationMs = flowEntry.end - flowEntry.start;
      logFlow(flowEntry);
      return { provider, error: lastError ? lastError.message : 'Unknown Gemini error', result: null };
    }
    // Fallback: OpenRouter/HuggingFace stub
    if (provider === 'huggingface') {
      // Example for Mistral-7B-Instruct-v0.1
      try {
        const hfToken = process.env.HUGGING_FACE_AI_TOKEN;
        const hfModel = 'mistralai/Mistral-7B-Instruct-v0.1';
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${hfModel}`,
          { inputs: prompt },
          {
            headers: { Authorization: `Bearer ${hfToken}` },
            timeout: 15000
          }
        );
        flowEntry.result = response.data;
        flowEntry.end = Date.now();
        flowEntry.durationMs = flowEntry.end - flowEntry.start;
        logFlow(flowEntry);
        return { provider, prompt, result: response.data };
      } catch (err) {
        flowEntry.error = err.message;
        flowEntry.response = err.response?.data || null;
        flowEntry.end = Date.now();
        flowEntry.durationMs = flowEntry.end - flowEntry.start;
        logFlow(flowEntry);
        return { provider, error: err.message, result: null };
      }
    }
    // OpenRouter fallback can be added here similarly
    flowEntry.result = null;
    flowEntry.end = Date.now();
    flowEntry.durationMs = flowEntry.end - flowEntry.start;
    logFlow(flowEntry);
    return { provider, prompt, result: null };
  }

  // Analyze search intent using AI
  async analyzeSearchIntent(searchTerm) {
    const prompt = `Analyze this search term and classify the user's intent: "${searchTerm}"
Context: This is for a B2B research platform finding vendors/suppliers.
Return JSON with:\n- intent: primary intent category\n- confidence: 0-1 confidence score\n- keywords: key terms that indicate this intent\n- searchStrategy: recommended search approach`;
    const aiResult = await this.callAI(prompt, 'gemini');
    // Attempt to parse JSON from result
    let parsed = null;
    if (aiResult.result) {
      try {
        parsed = JSON.parse(aiResult.result);
      } catch (e) {
        // Try to extract JSON from text if not pure JSON
        const match = aiResult.result.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
        }
      }
    }
    return { ...aiResult, parsed };
  }

  // Contextualize results using AI
  async contextualizeResults(results, searchIntent) {
    const prompt = `Contextualize these results for intent: ${searchIntent}\nResults: ${JSON.stringify(results)}`;
    return await this.callAI(prompt, 'gemini');
  }

  // Extract deep data from a URL using AI
  async extractDeepData(url, context) {
    const prompt = `Extract relevant business data from this webpage: ${url}\nContext: ${JSON.stringify(context)}`;
    return await this.callAI(prompt, 'gemini');
  }

  // Classify and tag a result as vendor/service owner/small business/etc. using AI
  async classifyEntityType(result) {
    const prompt = `Classify the following entity for B2B research.\nTitle: ${result.title || ''}\nDescription: ${result.description || ''}\nExtracted Data: ${JSON.stringify(result.extractedData || result)}\n\nReturn JSON with:\n- entityType: one of [vendor, service_owner, small_business, reseller, printing_shop, factory, online_business, social_media_seller, unknown]\n- aiIntent: user intent\n- confidence: 0-1\n- decisionRationale: short explanation\n- relevanceScore: 0-1\n- aiStrategy: extraction approach`;
    const aiResult = await this.callAI(prompt, 'gemini');
    let parsed = {
      entityType: 'unknown',
      aiIntent: 'unknown',
      confidence: 0,
      decisionRationale: 'No rationale',
      relevanceScore: 0,
      aiStrategy: 'default'
    };
    if (aiResult.result) {
      try {
        const aiParsed = JSON.parse(aiResult.result);
        parsed = {
          entityType: aiParsed.entityType || 'unknown',
          aiIntent: aiParsed.aiIntent || 'unknown',
          confidence: aiParsed.confidence || 0,
          decisionRationale: aiParsed.decisionRationale || aiParsed.rationale || 'No rationale',
          relevanceScore: aiParsed.relevanceScore || 0,
          aiStrategy: aiParsed.aiStrategy || 'default'
        };
      } catch (e) {
        const match = aiResult.result.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const aiParsed = JSON.parse(match[0]);
            parsed = {
              entityType: aiParsed.entityType || 'unknown',
              aiIntent: aiParsed.aiIntent || 'unknown',
              confidence: aiParsed.confidence || 0,
              decisionRationale: aiParsed.decisionRationale || aiParsed.rationale || 'No rationale',
              relevanceScore: aiParsed.relevanceScore || 0,
              aiStrategy: aiParsed.aiStrategy || 'default'
            };
          } catch { /* fallback to defaults */ }
        }
      }
    }
    return parsed;
  }

  // Generate AI-powered search results for a search term
  async generateAISearchResults(searchTerm) {
    const prompt = `Suggest 5 relevant vendors, manufacturers, or service owners for: "${searchTerm}". Return JSON array with: [{ companyName, website, description, businessType, location }]`;
    const aiResult = await this.callAI(prompt, 'gemini');
    let results = [];
    if (aiResult.result) {
      try {
        results = JSON.parse(aiResult.result);
      } catch (e) {
        // Try to extract JSON from text if not pure JSON
        const match = aiResult.result.match(/\[.*\]/s);
        if (match) {
          try { results = JSON.parse(match[0]); } catch { results = []; }
        }
      }
    }
    return results;
  }

  // Generate AI extraction guide for a given URL and search term
  async generateExtractionGuide(url, searchTerm) {
    const prompt = `Given the URL: ${url} and search term: "${searchTerm}", suggest the best HTML selectors, keywords, and page sections to extract company name, contact info, and business details. Return JSON: { selectors: [], keywords: [], sections: [] }`;
    const aiResult = await this.callAI(prompt, 'gemini');
    let guide = { selectors: [], keywords: [], sections: [] };
    if (aiResult.result) {
      try {
        guide = JSON.parse(aiResult.result);
      } catch (e) {
        const match = aiResult.result.match(/\{[\s\S]*\}/);
        if (match) {
          try { guide = JSON.parse(match[0]); } catch { guide = { selectors: [], keywords: [], sections: [] }; }
        }
      }
    }
    return guide;
  }
}

module.exports = AIServiceManager;
