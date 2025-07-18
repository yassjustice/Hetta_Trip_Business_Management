const axios = require('axios');

class WebSearchService {
  constructor(config = {}) {
    this.config = {
      maxResultsPerTerm: config.maxResultsPerTerm || 10,
      searchEngines: ['Google'],
      timeout: config.fetchTimeout || 30000,
      userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    // API Keys from environment variables
    this.apiKeys = {
      google: {
        apiKey: process.env.GOOGLE_SEARCH_API_KEY,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID
      },
      scrapingbee: {
        apiKey: process.env.SCRAPINGBEE_API_KEY
      }
    };
  }

  async search(searchTerm, maxResults = null) {
    const limit = maxResults || this.config.maxResultsPerTerm;
    const results = [];

    // Search across enabled engines
    for (const engine of this.config.searchEngines) {
      try {
        const engineResults = await this.searchWithEngine(engine, searchTerm, limit);
        results.push(...engineResults);
      } catch (error) {
        console.error(`Search error with ${engine}:`, error.message);
        // Continue with other engines
      }
    }

    // Remove duplicates and limit results
    const uniqueResults = this.removeDuplicates(results);
    return uniqueResults.slice(0, limit);
  }

  async searchWithEngine(engine, searchTerm, maxResults) {
    const fs = require('fs');
    const path = require('path');
    const debugLogPath = path.join(__dirname, '../logs/debug-extraction-flow.log');
    function logFlow(entry) {
      const line = `[${new Date().toISOString()}] WebSearchService: ${typeof entry === 'string' ? entry : JSON.stringify(entry)}\n`;
      fs.appendFileSync(debugLogPath, line);
    }
    const flowEntry = { engine, searchTerm, maxResults, start: Date.now() };
    switch (engine.toLowerCase()) {
      case 'google':
        try {
          const results = await this.searchGoogle(searchTerm, maxResults);
          flowEntry.results = results;
          flowEntry.end = Date.now();
          flowEntry.durationMs = flowEntry.end - flowEntry.start;
          logFlow(flowEntry);
          return results;
        } catch (err) {
          flowEntry.error = err.message;
          flowEntry.end = Date.now();
          flowEntry.durationMs = flowEntry.end - flowEntry.start;
          logFlow(flowEntry);
          throw err;
        }
      default:
        flowEntry.error = `Unsupported search engine: ${engine}`;
        flowEntry.end = Date.now();
        flowEntry.durationMs = flowEntry.end - flowEntry.start;
        logFlow(flowEntry);
        throw new Error(`Unsupported search engine: ${engine}`);
    }
  }

  async searchGoogle(searchTerm, maxResults) {
    if (!this.apiKeys.google.apiKey || !this.apiKeys.google.cx) {
      console.warn('Google Search API key or CX not configured, skipping Google search');
      return [];
    }

    try {
      // Enhanced search query for textile/fashion suppliers
      const enhancedQuery = `${searchTerm} textile printing fashion supplier manufacturer`;
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.apiKeys.google.apiKey,
          cx: this.apiKeys.google.cx,
          q: enhancedQuery,
          num: Math.min(maxResults, 10), // Google allows max 10 per request
          safe: 'active'
        },
        timeout: this.config.timeout
      });

      return response.data.items?.map((item, index) => ({
        url: item.link,
        title: item.title,
        description: item.snippet,
        source: 'Google',
        rank: index + 1
      })) || [];

    } catch (error) {
      console.error('Google search error:', error.message);
      return [];
    }
  }

  // Bing and DuckDuckGo search methods removed

  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(result => {
      const url = new URL(result.url).hostname.toLowerCase();
      if (seen.has(url)) {
        return false;
      }
      seen.add(url);
      return true;
    });
  }

  // Method to validate and clean URLs
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  // Method to filter results by relevance to textile/fashion industry
  filterByRelevance(results) {
    const relevantKeywords = [
      'textile', 'fashion', 'printing', 'fabric', 'garment', 'apparel',
      'clothing', 'manufacturer', 'supplier', 'printing', 'embroidery',
      'screen print', 'dtg', 'dtf', 'heat press', 'vinyl', 'custom',
      'wholesale', 'bulk', 'production', 'design', 'merchandising'
    ];

    return results.filter(result => {
      const text = `${result.title} ${result.description}`.toLowerCase();
      return relevantKeywords.some(keyword => text.includes(keyword));
    });
  }

  // Method to enhance search terms for better results
  enhanceSearchTerm(searchTerm) {
    const enhancers = [
      'textile supplier',
      'fashion manufacturer',
      'printing services',
      'custom apparel',
      'bulk clothing'
    ];

    // Return enhanced variations of the search term
    return enhancers.map(enhancer => `${searchTerm} ${enhancer}`);
  }
}

module.exports = WebSearchService;
