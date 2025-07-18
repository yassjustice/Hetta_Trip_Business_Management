const { logDebug } = require('./debugLogger');
const axios = require('axios');
const cheerio = require('cheerio');

class DataExtractionService {
  /**
   * Bulk autonomous extraction for a list of links
   * @param {Array<string>} links - List of URLs to extract
   * @param {Object} aiContext - AI context/prompt for extraction
   * @returns {Object} { results: [vendorObj], csv: string }
   */
  async bulkExtract(links = [], aiContext = {}) {
    const results = [];
    const fs = require('fs');
    const path = require('path');
    const debugLogPath = path.join(__dirname, '../logs/debug-extraction-flow.log');
    function logFlow(entry) {
      const line = `[${new Date().toISOString()}] ${typeof entry === 'string' ? entry : JSON.stringify(entry)}\n`;
      fs.appendFileSync(debugLogPath, line);
    }
    // Throttle requests to avoid rate limits
    const delay = ms => new Promise(res => setTimeout(res, ms));
    for (const url of links) {
      let vendorObj = {};
      let errorInfo = null;
      const flowEntry = { url, start: Date.now(), service: null, aiUsed: false, error: null };
      try {
        // Compose AI prompt for autonomous exploration
        const prompt = `For the website ${url}, visit homepage, about/company, services/products, contact, and any relevant subpages. Scrape and cross-reference info. Extract all business fields for vendor research. If a field is missing, use null, '', or []. Return a complete JSON object for the vendor.`;
        flowEntry.service = 'AIServiceManager.gemini';
        let aiResult = null;
        try {
          const AIServiceManager = require('./AIServiceManager');
          const aiManager = new AIServiceManager();
          // Try Gemini first
          aiResult = await aiManager.callAI(prompt, 'gemini');
          flowEntry.aiUsed = true;
          flowEntry.aiResult = aiResult.result || null;
          if (!aiResult.result && aiResult.error) {
            // Fallback to HuggingFace
            aiResult = await aiManager.callAI(prompt, 'huggingface');
            flowEntry.service = 'AIServiceManager.huggingface';
            flowEntry.aiResult = aiResult.result || null;
          }
          if (!aiResult.result && aiResult.error) {
            // Fallback to OpenRouter (stub, add real call if needed)
            // aiResult = await aiManager.callAI(prompt, 'openrouter');
            flowEntry.service = 'AIServiceManager.openrouter';
            flowEntry.aiResult = aiResult.result || null;
          }
          if (aiResult.result) {
            try {
              vendorObj = typeof aiResult.result === 'string' ? JSON.parse(aiResult.result) : aiResult.result;
              vendorObj.status = 'AI extracted';
            } catch (e) {
              const match = aiResult.result && typeof aiResult.result === 'string' ? aiResult.result.match(/\{[\s\S]*\}/) : null;
              if (match) {
                try { vendorObj = JSON.parse(match[0]); vendorObj.status = 'AI extracted'; } catch { vendorObj = {}; }
              }
            }
          } else if (aiResult.error) {
            errorInfo = { message: aiResult.error, code: aiResult.code || null };
            vendorObj.status = 'AI error';
          }
        } catch (aiErr) {
          flowEntry.error = aiErr.message;
          errorInfo = { message: aiErr.message };
          vendorObj.status = 'AI error';
        }
      } catch (err) {
        errorInfo = { message: err.message, code: err.code || null };
        flowEntry.error = err.message;
        vendorObj.status = 'Extraction error';
      }
      await delay(1000); // Throttle 1s per request
      // Fallbacks for missing fields
      vendorObj.companyName = vendorObj.companyName || vendorObj.name || (url ? (new URL(url).hostname.replace(/^www\./, '').split('.')[0]) : 'Unknown');
      vendorObj.website = vendorObj.website || url || '';
      vendorObj.serviceTypes = Array.isArray(vendorObj.serviceTypes) && vendorObj.serviceTypes.length > 0 ? vendorObj.serviceTypes : (vendorObj.services ? vendorObj.services : []);
      if (!Array.isArray(vendorObj.serviceTypes) || vendorObj.serviceTypes.length === 0) {
        // Fallback: extract keywords from rawTextContent
        if (vendorObj.rawTextContent) {
          const keywords = ['printing','print','screen print','sewing','shipping','logistics','design','pattern','blank apparel','tools','oven','tailoring','delivery','marketing','advertising','promotion'];
          vendorObj.serviceTypes = keywords.filter(k => vendorObj.rawTextContent.toLowerCase().includes(k));
        }
      }
      vendorObj.priceRanges = Array.isArray(vendorObj.priceRanges) && vendorObj.priceRanges.length > 0 ? vendorObj.priceRanges : [];
      if (vendorObj.priceRanges.length === 0 && vendorObj.rawTextContent) {
        // Fallback: extract price info from raw text
        const priceRegex = /(\d+[.,]?\d*)\s?(USD|EUR|€|\$)/gi;
        const matches = vendorObj.rawTextContent.match(priceRegex);
        if (matches) {
          vendorObj.priceRanges = matches.map(m => ({ service: 'General', minPrice: m, maxPrice: m, currency: '', unit: '', notes: m }));
        }
      }
      // Location fallback
      if (!vendorObj.address || (!vendorObj.address.city && !vendorObj.address.country)) {
        if (vendorObj.rawTextContent) {
          const cityCountryRegex = /([A-Z][a-zA-Z\s]+),\s*([A-Z][a-zA-Z\s]+)/;
          const match = vendorObj.rawTextContent.match(cityCountryRegex);
          if (match) {
            vendorObj.address = vendorObj.address || {};
            vendorObj.address.city = match[1];
            vendorObj.address.country = match[2];
          }
        }
        // Fallback: infer country from TLD
        if (!vendorObj.address || !vendorObj.address.country) {
          try {
            const tld = (new URL(url).hostname.split('.')).pop();
            const tldCountryMap = { pt: 'Portugal', ma: 'Morocco', fr: 'France', us: 'USA', uk: 'UK', cn: 'China', in: 'India' };
            vendorObj.address = vendorObj.address || {};
            vendorObj.address.country = tldCountryMap[tld] || '';
          } catch {}
        }
      }
      // Attach error info if present
      if (errorInfo) vendorObj.error = errorInfo;
      results.push(vendorObj);
      flowEntry.end = Date.now();
      flowEntry.durationMs = flowEntry.end - flowEntry.start;
      flowEntry.vendorObj = vendorObj;
      if (errorInfo) flowEntry.errorInfo = errorInfo;
      logFlow(flowEntry);
    }
    // Convert results to CSV
    const csv = this.toCSV(results);
    return { results, csv };
  }

  /**
   * Convert array of vendor objects to CSV string
   */
  toCSV(data) {
    if (!Array.isArray(data) || !data.length) return '';
    const fields = Object.keys(data[0]);
    const escape = v => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : Array.isArray(v) ? `"${v.join(';')}"` : v;
    const header = fields.join(',');
    const rows = data.map(obj => fields.map(f => escape(obj[f] ?? '')).join(','));
    return [header, ...rows].join('\n');
  }
  /**
   * Main extraction entrypoint supporting web, AI-guided, and AI-only modes.
   * @param {Object} params - { url, aiContext, extractionGuide, mode }
   * @returns {Object} Extraction result (web, AI, or merged)
   */
  async extract(params = {}) {
    const { url, aiContext = {}, extractionGuide = null, mode = 'web+ai' } = params;
    const logContext = { url, aiContext, extractionGuide, mode };
    try {
      let webResult = null;
      let aiResult = null;
      // AI-only mode: skip web extraction
      if (mode === 'ai-only') {
        const AIServiceManager = require('./AIServiceManager');
        const aiManager = new AIServiceManager();
        aiResult = await aiManager.generateAISearchResults({ url, aiContext, extractionGuide });
        logDebug('extract', { ...logContext, resultType: 'ai-only', aiResult });
        return { ...aiResult, source: 'ai-only' };
      }
      // Web extraction (with optional AI enrichment)
      webResult = await this.extractFromUrl(url, aiContext);
      // If extractionGuide is provided, use AI to further enrich/validate
      if (extractionGuide) {
        const AIServiceManager = require('./AIServiceManager');
        const aiManager = new AIServiceManager();
        aiResult = await aiManager.generateAISearchResults({ url, aiContext, extractionGuide, webResult });
        // Merge web and AI results (AI fields take precedence)
        const merged = { ...webResult, ...aiResult, source: 'web+ai' };
        logDebug('extract', { ...logContext, resultType: 'web+ai', merged });
        return merged;
      }
      // Default: return web extraction (with AI enrichment)
      logDebug('extract', { ...logContext, resultType: 'web', webResult });
      return { ...webResult, source: 'web' };
    } catch (error) {
      logDebug('extract', { ...logContext, error: error.message });
      return { error: error.message, url, mode };
    }
  }
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 30000,
      userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      maxContentLength: config.maxContentLength || 1000000, // 1MB
      followRedirects: config.followRedirects !== false
    };
  }

  /**
   * Legacy extraction method (web + AI enrichment)
   * @deprecated Use extract({ url, ... }) instead
   */
  async extractFromUrl(url, aiContext = {}) {
    try {
      console.log(`Extracting data from: ${url}`);
      // Fetch webpage content
      const response = await axios.get(url, {
        timeout: this.config.timeout,
        maxContentLength: this.config.maxContentLength,
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        maxRedirects: this.config.followRedirects ? 5 : 0
      });

      // Filter out non-HTML content
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('text/html')) {
        logDebug('extractFromUrl', {
          message: 'Skipped non-HTML content',
          url,
          contentType,
          aiContext
        });
        return { skipped: true, reason: 'Non-HTML content', url, contentType };
      }

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract structured data
      const extractedData = {
        // Basic company information
        companyName: this.extractCompanyName($, url),
        businessType: this.extractBusinessType($),
        description: this.extractDescription($),
        website: url,

        // Contact information
        email: this.extractEmails($),
        phone: this.extractPhones($),
        whatsapp: this.extractWhatsApp($),
        address: this.extractAddress($),
      };

      // Enrich with AI context (intent, entityType, rationale, etc.)
      let aiEnrichment = {
        aiIntent: 'unknown',
        entityType: 'unknown',
        confidence: 0,
        decisionRationale: 'AI enrichment unavailable',
        relevanceScore: 0,
        aiStrategy: 'default',
      };
      try {
        const AIServiceManager = require('./AIServiceManager');
        const aiManager = new AIServiceManager();
        aiEnrichment = await aiManager.classifyEntityType({
          ...extractedData,
          aiContext
        });
        // Ensure all fields are present
        aiEnrichment = {
          aiIntent: aiEnrichment.aiIntent || 'unknown',
          entityType: aiEnrichment.entityType || 'unknown',
          confidence: aiEnrichment.confidence || 0,
          decisionRationale: aiEnrichment.decisionRationale || 'No rationale',
          relevanceScore: aiEnrichment.relevanceScore || 0,
          aiStrategy: aiEnrichment.aiStrategy || 'default',
        };
      } catch (err) {
        // Fallback to defaults
        aiEnrichment.decisionRationale = 'AI enrichment error: ' + err.message;
      }

      // Add services, products, pricing, business policies, etc. to extractedData
      Object.assign(extractedData, {
        serviceTypes: this.extractServiceTypes($),
        printingMethods: this.extractPrintingMethods($),
        productCategories: this.extractProductCategories($),
        pricingModels: this.extractPricingModels($),
        priceRanges: this.extractPriceRanges($),
        businessPolicies: this.extractBusinessPolicies($),
        minimumOrderQuantity: this.extractMOQ($),
        productionCapacity: this.extractProductionCapacity($),
        certifications: this.extractCertifications($),
        reputation: this.extractReputation($),
        equipment: this.extractEquipment($),
        qualityStandards: this.extractQualityStandards($),
        rawTextContent: this.extractTextContent($),
        keyPhrases: this.extractKeyPhrases($)
      });

      // Merge AI context into extracted data
      const result = { ...extractedData, ...aiEnrichment };

      // Log extraction result
      logDebug('extractFromUrl', result);
      return result;

    } catch (error) {
      logDebug('extractFromUrl', {
        message: 'Error extracting data',
        url,
        error: error.message,
        aiContext
      });
      console.error(`Error extracting data from ${url}:`, error.message);
      throw new Error(`Failed to extract data: ${error.message}`);
    }
  }

  extractCompanyName($, url) {
    const selectors = [
      'h1.company-name',
      '.company-name',
      'h1.business-name',
      '.business-name',
      '.logo-text',
      'h1',
      'title'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }

    // Extract from URL as fallback
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '').split('.')[0];
    } catch (error) {
      return '';
    }
  }

  extractBusinessType($) {
    const keywords = {
      'Manufacturer': ['manufacturer', 'manufacturing', 'factory', 'production facility'],
      'Supplier': ['supplier', 'supply', 'wholesale', 'distributor'],
      'Agent': ['agent', 'representative', 'broker'],
      'Trading Company': ['trading', 'import', 'export', 'trader']
    };

    const text = $('body').text().toLowerCase();
    
    for (const [type, typeKeywords] of Object.entries(keywords)) {
      if (typeKeywords.some(keyword => text.includes(keyword))) {
        return type;
      }
    }

    return 'Supplier'; // Default
  }

  extractDescription($) {
    const selectors = [
      '.company-description',
      '.about-us',
      '.company-info',
      '.description',
      '.intro',
      'meta[name="description"]',
      '.hero-text',
      '.welcome-text'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.attr('content') || element.text();
        if (text && text.trim().length > 20) {
          return text.trim().substring(0, 500);
        }
      }
    }

    return '';
  }

  extractEmails($) {
    const emails = new Set();
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    // Extract from text content
    const text = $('body').text();
    const matches = text.match(emailRegex);
    if (matches) {
      matches.forEach(email => emails.add(email.toLowerCase()));
    }

    // Extract from mailto links
    $('a[href^="mailto:"]').each((i, el) => {
      const href = $(el).attr('href');
      const email = href.replace('mailto:', '').split('?')[0];
      if (email.includes('@')) {
        emails.add(email.toLowerCase());
      }
    });

    // Filter out common generic emails
    const genericEmails = ['info@', 'admin@', 'webmaster@', 'noreply@'];
    return Array.from(emails).filter(email => 
      !genericEmails.some(generic => email.startsWith(generic))
    );
  }

  extractPhones($) {
    const phones = new Set();
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    
    // Extract from text content
    const text = $('body').text();
    const matches = text.match(phoneRegex);
    if (matches) {
      matches.forEach(phone => phones.add(phone.trim()));
    }

    // Extract from tel links
    $('a[href^="tel:"]').each((i, el) => {
      const href = $(el).attr('href');
      const phone = href.replace('tel:', '');
      if (phone) {
        phones.add(phone);
      }
    });

    return Array.from(phones);
  }

  extractWhatsApp($) {
    const whatsappRegex = /(?:whatsapp|wa\.me).*?(\+?[0-9\s\-\(\)]{10,})/gi;
    const text = $('body').text();
    const matches = text.match(whatsappRegex);
    
    if (matches && matches.length > 0) {
      return matches[0];
    }

    // Check for WhatsApp links
    const whatsappLink = $('a[href*="wa.me"], a[href*="whatsapp"]').first();
    if (whatsappLink.length) {
      return whatsappLink.attr('href');
    }

    return '';
  }

  extractAddress($) {
    // Improved fuzzy city/country extraction with context validation
    const bodyText = $('body').text();
    const bodyTextLower = bodyText.toLowerCase();
    const validCountries = [
      'United States','USA','Canada','Mexico','Brazil','Argentina','United Kingdom','UK','France','Germany','Italy','Spain','Portugal','Netherlands','Belgium','Switzerland','Austria','Sweden','Norway','Denmark','Finland','Poland','Czech Republic','Russia','Turkey','China','Japan','South Korea','India','Pakistan','Bangladesh','Vietnam','Thailand','Indonesia','Malaysia','Singapore','Philippines','Australia','New Zealand','South Africa','Egypt','Morocco','Nigeria','Kenya','Ghana','Ethiopia','Saudi Arabia','UAE','Qatar','Israel','Jordan','Lebanon','Chile','Colombia','Peru','Venezuela','Uruguay','Paraguay','Bolivia','Ecuador','Guatemala','Honduras','El Salvador','Costa Rica','Panama','Cuba','Dominican Republic','Jamaica','Trinidad','Barbados','Bahamas','Iceland','Ireland','Romania','Hungary','Slovakia','Slovenia','Croatia','Serbia','Bulgaria','Greece','Cyprus','Ukraine','Belarus','Estonia','Latvia','Lithuania','Luxembourg','Liechtenstein','Malta','Monaco','San Marino','Andorra','Montenegro','Macedonia','Georgia','Armenia','Azerbaijan','Kazakhstan','Uzbekistan','Turkmenistan','Kyrgyzstan','Tajikistan','Mongolia','Cambodia','Laos','Myanmar','Nepal','Sri Lanka','Afghanistan','Iran','Iraq','Syria','Yemen','Oman','Bahrain','Kuwait','Palestine','Sudan','Libya','Tunisia','Algeria','Botswana','Namibia','Zimbabwe','Zambia','Mozambique','Angola','Cameroon','Ivory Coast','Senegal','Mali','Burkina Faso','Niger','Chad','Somalia','Uganda','Tanzania','Rwanda','Burundi','Malawi','Swaziland','Lesotho','Sierra Leone','Liberia','Congo','Gabon','Central African Republic','Guinea','Benin','Togo','Mauritania','Gambia','Equatorial Guinea','Djibouti','Eritrea','Seychelles','Comoros','Cape Verde','Sao Tome','Solomon Islands','Fiji','Papua New Guinea','Samoa','Tonga','Vanuatu','Kiribati','Micronesia','Palau','Marshall Islands','Nauru','Tuvalu','East Timor','Brunei','Bhutan','Maldives','Antigua','Saint Lucia','Saint Vincent','Grenada','Dominica','Saint Kitts','Saint Pierre','Montserrat','Anguilla','Aruba','Curacao','Bermuda','Cayman Islands','Gibraltar','Guernsey','Jersey','Isle of Man','Faroe Islands','Greenland','Martinique','Guadeloupe','Reunion','Mayotte','French Guiana','New Caledonia','French Polynesia','Wallis and Futuna','Saint Barthelemy','Saint Martin','Sint Maarten','Saint Helena','Ascension','Tristan da Cunha','Falkland Islands','South Georgia','South Sandwich Islands','British Virgin Islands','Turks and Caicos','Anguilla','Montserrat','Cayman Islands','Bermuda','Gibraltar','Pitcairn Islands','Tokelau','Niue','Cook Islands','Norfolk Island','Christmas Island','Cocos Islands','Heard Island','McDonald Islands','South Sudan'
    ];
    // Only match if preceded by context keywords
    const contextKeywords = ['address', 'location', 'city', 'country', 'headquarters', 'office', 'contact'];
    const contextRegex = new RegExp(`(?:${contextKeywords.join('|')})[\s:,-]{0,10}([A-Z][a-zA-Z\s]+),\s*([A-Z][a-zA-Z\s]+)`, 'g');
    let match;
    while ((match = contextRegex.exec(bodyText)) !== null) {
      if (match[1] && match[2] && match[1].length < 40 && match[2].length < 40) {
        const countryNorm = match[2].replace(/[^A-Za-z ]/g, '').trim();
        if (validCountries.some(c => c.toLowerCase() === countryNorm.toLowerCase())) {
          logDebug('extractAddress', {
            message: 'Fuzzy city/country extraction (context validated)',
            pattern: contextRegex.toString(),
            sample: match[0],
            result: { city: match[1], country: match[2] }
          });
          return { city: match[1], country: match[2] };
        }
      }
    }

    // 11. Try to extract from company/about/contact pages if main page fails
    // Look for links to about/contact/company pages
    const linkSelectors = ['a[href*="about"]', 'a[href*="contact"]', 'a[href*="company"]'];
    for (const selector of linkSelectors) {
      const link = $(selector).first();
      if (link.length) {
        const href = link.attr('href');
        if (href && typeof href === 'string' && !href.startsWith('#') && !href.startsWith('javascript')) {
          // Try to fetch and extract address from the linked page (sync for now)
          try {
            const axios = require('axios');
            const cheerio = require('cheerio');
            const baseUrl = (typeof window !== 'undefined' && window.location) ? window.location.origin : '';
            let fullUrl = href;
            if (href.startsWith('/')) {
              // Relative link
              if (baseUrl) fullUrl = baseUrl + href;
            } else if (!/^https?:\/\//i.test(href)) {
              // Possibly relative
              if (baseUrl) fullUrl = baseUrl + '/' + href;
            }
            // Fetch the page
            const res = axios.get(fullUrl, { timeout: 10000 });
            res.then(response => {
              const $linked = cheerio.load(response.data);
              // Try to extract address from linked page using same logic (recursive, but only one level)
              const linkedText = $linked('body').text();
              // Try fuzzy city/country again
              for (const pattern of fuzzyPatterns) {
                let match;
                while ((match = pattern.exec(linkedText)) !== null) {
                  if (match[1] && match[2] && match[1].length < 40 && match[2].length < 40) {
                    logDebug('extractAddress', {
                      message: 'Fuzzy city/country extraction (linked page)',
                      pattern: pattern.toString(),
                      sample: match[0],
                      result: { city: match[1], country: match[2] },
                      from: fullUrl
                    });
                    // Return result from linked page
                    return { city: match[1], country: match[2] };
                  }
                }
              }
            }).catch(() => {});
          } catch (e) {}
        }
      }
    }
    // Scalable debug logging: log all attempts, including partial/fuzzy matches
    let found = false;
    let address = {};
    let partials = [];
    // 1. Expanded selectors for more robust extraction
    const addressSelectors = [
      '.address', '.contact-address', '.location', '.company-address', '.office-address',
      '.location-info', '.address-block', '.contact-info', '.footer-address', '.company-info',
      'address', 'footer', '[class*="address"]', '[class*="location"]', '[id*="address"]', '[id*="location"]'
    ];
    for (const selector of addressSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const addressText = element.text().replace(/\s+/g, ' ').trim();
        // Skip if text is excessively long or contains >10 country names (likely dropdown/template)
        const countryCount = validCountries.filter(c => addressText.includes(c)).length;
        if (addressText.length > 1000 || countryCount > 10) {
          logDebug('extractAddress', {
            message: 'Skipped address selector (likely dropdown/template)',
            selector,
            sample: addressText.substring(0, 200),
            countryCount
          });
          continue;
        }
        if (addressText && addressText.length > 8) {
          const parsed = this.parseAddress(addressText);
          // Post-process: skip if parsed address is a long list or matches known dropdowns
          const parsedStr = JSON.stringify(parsed);
          if ((parsedStr.length > 200) || (countryCount > 5)) {
            logDebug('extractAddress', {
              message: 'Discarded parsed address (likely dropdown/template)',
              selector,
              sample: addressText.substring(0, 200),
              parsed
            });
            continue;
          }
          if (parsed && (parsed.street || parsed.city || parsed.country)) {
            found = true;
            logDebug('extractAddress', {
              message: 'Address extraction result (selector)',
              selector,
              sample: addressText,
              result: parsed
            });
            return parsed;
          } else if (parsed && (parsed.city || parsed.country)) {
            partials.push({ method: 'selector', selector, sample: addressText, result: parsed });
          }
        }
      }
    }

    // 2. JSON-LD deep search for PostalAddress
    // 2. JSON-LD deep search for PostalAddress
    const jsonLdBlocks = $('script[type="application/ld+json"]');
    jsonLdBlocks.each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        const findAddress = (obj) => {
          if (!obj) return null;
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const found = findAddress(item);
              if (found) return found;
            }
          } else if (typeof obj === 'object') {
            if (obj['@type'] === 'PostalAddress') {
              return {
                street: obj.streetAddress || '',
                city: obj.addressLocality || '',
                state: obj.addressRegion || '',
                country: obj.addressCountry || '',
                zipCode: obj.postalCode || ''
              };
            }
            for (const key in obj) {
              const found = findAddress(obj[key]);
              if (found) return found;
            }
          }
          return null;
        };
        const foundAddr = findAddress(json);
        if (foundAddr && (foundAddr.street || foundAddr.city || foundAddr.country)) {
          found = true;
          address = foundAddr;
          logDebug('extractAddress', {
            message: 'Address extraction result (JSON-LD)',
            sample: JSON.stringify(foundAddr),
            result: foundAddr
          });
          return false; // break .each
        } else if (foundAddr && (foundAddr.city || foundAddr.country)) {
          partials.push({ method: 'jsonld', sample: JSON.stringify(foundAddr), result: foundAddr });
        }
      } catch (e) {}
    });
    if (address && (address.street || address.city || address.country)) return address;

    // 3. Extract from schema.org microdata
    const streetAddress = $('[itemprop="streetAddress"]').text().trim();
    const city = $('[itemprop="addressLocality"]').text().trim();
    const state = $('[itemprop="addressRegion"]').text().trim();
    const country = $('[itemprop="addressCountry"]').text().trim();
    const zipCode = $('[itemprop="postalCode"]').text().trim();
    if (streetAddress || city || country) {
      found = true;
      const result = {
        street: streetAddress,
        city: city,
        state: state,
        country: country,
        zipCode: zipCode
      };
      logDebug('extractAddress', {
        message: 'Address extraction result (microdata)',
        sample: JSON.stringify(result),
        result
      });
      return result;
    }

    // 4. Open Graph & Twitter meta tags
    const ogLocation = $('meta[property="og:location"]').attr('content');
    const twitterLocation = $('meta[name="twitter:location"]').attr('content');
    if (ogLocation) {
      const parsed = this.parseAddress(ogLocation);
      if (parsed && (parsed.street || parsed.city || parsed.country)) {
        logDebug('extractAddress', {
          message: 'Address extraction result (og:location)',
          sample: ogLocation,
          result: parsed
        });
        return parsed;
      } else if (parsed && (parsed.city || parsed.country)) {
        partials.push({ method: 'og:location', sample: ogLocation, result: parsed });
      }
    }
    if (twitterLocation) {
      const parsed = this.parseAddress(twitterLocation);
      if (parsed && (parsed.street || parsed.city || parsed.country)) {
        logDebug('extractAddress', {
          message: 'Address extraction result (twitter:location)',
          sample: twitterLocation,
          result: parsed
        });
        return parsed;
      } else if (parsed && (parsed.city || parsed.country)) {
        partials.push({ method: 'twitter:location', sample: twitterLocation, result: parsed });
      }
    }
    // 5. Fallback: regex for address/city/country/postal in raw HTML and text
    const html = $.html();
    // Try to match common address patterns in text
    const addressPatterns = [
      /(?:Contact|Location|Address)\s*[:\-–]?\s*([\w\s,\-#\.]+\d{2,}[\w\s,\-#\.]*)/i, // e.g. Contact: 123 Main St, City
      /(\d{1,5}[^\n]{10,80}(?:city|state|country|zip|[A-Z][a-z]+,\s*[A-Z][a-z]+))/i,
      /([A-Z][a-z]+,\s*[A-Z][a-z]+,?\s*[A-Z]{2,})/i // City, State, Country
    ];
    for (const pattern of addressPatterns) {
      const match = bodyText.match(pattern) || html.match(pattern);
      if (match) {
        const parsed = this.parseAddress(match[0]);
        if (parsed && (parsed.street || parsed.city || parsed.country)) {
          logDebug('extractAddress', {
            message: 'Address extraction result (regex)',
            pattern: pattern.toString(),
            sample: match[0],
            result: parsed
          });
          return parsed;
        } else if (parsed && (parsed.city || parsed.country)) {
          partials.push({ method: 'regex', pattern: pattern.toString(), sample: match[0], result: parsed });
        }
      }
    }

    // 6. Try meta[name="address"]
    const metaAddress = $('meta[name="address"]').attr('content');
    if (metaAddress) {
      const parsed = this.parseAddress(metaAddress);
      if (parsed && (parsed.street || parsed.city || parsed.country)) {
        logDebug('extractAddress', {
          message: 'Address extraction result (meta[name="address"])',
          sample: metaAddress,
          result: parsed
        });
        return parsed;
      } else if (parsed && (parsed.city || parsed.country)) {
        partials.push({ method: 'meta[name="address"]', sample: metaAddress, result: parsed });
      }
    }

    // 7. Try footer as last resort
    const footerText = $('footer').text().replace(/\s+/g, ' ').trim();
    if (footerText && footerText.length > 8) {
      const parsed = this.parseAddress(footerText);
      if (parsed && (parsed.street || parsed.city || parsed.country)) {
        logDebug('extractAddress', {
          message: 'Address extraction result (footer)',
          sample: footerText,
          result: parsed
        });
        return parsed;
      } else if (parsed && (parsed.city || parsed.country)) {
        partials.push({ method: 'footer', sample: footerText, result: parsed });
      }
    }

    // 8. Try all meta tags for city/country
    const metaTags = $('meta');
    let metaCity = '', metaCountry = '';
    metaTags.each((i, el) => {
      const name = ($(el).attr('name') || '').toLowerCase();
      const content = $(el).attr('content') || '';
      if (!metaCity && name.includes('city')) metaCity = content;
      if (!metaCountry && name.includes('country')) metaCountry = content;
    });
    if (metaCity || metaCountry) {
      const result = { city: metaCity, country: metaCountry };
      logDebug('extractAddress', {
        message: 'Address extraction result (meta city/country)',
        sample: JSON.stringify(result),
        result
      });
      return result;
    }

    // 9. As a last fallback, scan all script tags for address-like data
    const scriptTags = $('script');
    for (let i = 0; i < scriptTags.length; i++) {
      const scriptText = $(scriptTags[i]).html();
      if (scriptText && /address|city|country|zip|postal/i.test(scriptText)) {
        const parsed = this.parseAddress(scriptText);
        if (parsed && (parsed.street || parsed.city || parsed.country)) {
          logDebug('extractAddress', {
            message: 'Address extraction result (script)',
            sample: scriptText.substring(0, 200),
            result: parsed
          });
          return parsed;
        } else if (parsed && (parsed.city || parsed.country)) {
          partials.push({ method: 'script', sample: scriptText.substring(0, 200), result: parsed });
        }
      }
    }

    const logUrl = $.root().find('base').attr('href') || '';
    const logSample = ($('body').text() || '').substring(0, 500);
    if (!found) {
      if (partials.length > 0) {
        logDebug('extractAddress', {
          message: 'Partial address/location matches',
          url: logUrl,
          sample: logSample,
          partials
        });
      } else {
        logDebug('extractAddress', {
          message: 'No address found',
          url: logUrl,
          sample: logSample
        });
      }
    }
    return address;
  }

  parseAddress(addressText) {
    // Simple address parsing - can be enhanced
    const lines = addressText.split('\n').map(line => line.trim()).filter(line => line);
    
    const address = {};
    
    if (lines.length >= 1) address.street = lines[0];
    if (lines.length >= 2) {
      const lastLine = lines[lines.length - 1];
      const parts = lastLine.split(',').map(part => part.trim());
      
      if (parts.length >= 2) {
        address.city = parts[0];
        address.country = parts[parts.length - 1];
        if (parts.length >= 3) {
          address.state = parts[1];
        }
      }
    }

    return address;
  }

  extractServiceTypes($) {
    const serviceKeywords = {
      'Printing': ['printing', 'print', 'screen print', 'digital print'],
      'Sewing': ['sewing', 'stitching', 'tailoring', 'garment construction'],
      'Shipping': ['shipping', 'logistics', 'delivery', 'fulfillment'],
      'Marketing': ['marketing', 'branding', 'advertising', 'promotion'],
      'Haute Couture': ['haute couture', 'high fashion', 'luxury fashion'],
      'Design': ['design', 'fashion design', 'graphic design', 'pattern'],
      'Blank Apparel Sales': ['blank apparel', 'wholesale clothing', 'plain garments'],
      'All-in-One Services': ['full service', 'end-to-end', 'complete solution'],
      'Printer/Machine Sales': ['printer sales', 'equipment sales', 'machinery'],
      'Equipment Sales': ['equipment', 'machinery', 'tools', 'supplies'],
      'Heat Press': ['heat press', 'heat transfer'],
      'Oven Equipment': ['oven', 'curing', 'drying equipment']
    };

    // Return flat array of found keywords for serviceTypes
    const result = this.extractByKeywords($, serviceKeywords);
    return Object.values(result).flat();
  }

  extractPrintingMethods($) {
    const methodKeywords = {
      'DTG': ['dtg', 'direct to garment', 'direct-to-garment'],
      'DTF': ['dtf', 'direct to film', 'direct-to-film'],
      'Screen Printing Plastisol': ['plastisol', 'screen print plastisol'],
      'Screen Printing Water-based': ['water-based', 'water based screen print'],
      'Screen Printing Silicone': ['silicone screen print', 'silicone ink'],
      'Screen Printing Suede': ['suede screen print', 'suede ink'],
      'Sublimation': ['sublimation', 'dye sublimation'],
      'Heat Transfer': ['heat transfer', 'heat press'],
      'Vinyl Cutting': ['vinyl cutting', 'vinyl decal', 'cut vinyl'],
      'Embroidery': ['embroidery', 'embroidered', 'stitching'],
      'Digital Printing': ['digital printing', 'digital print']
    };

    // Return flat array of found keywords for printingMethods
    const result = this.extractByKeywords($, methodKeywords);
    return Object.values(result).flat();
  }

  extractProductCategories($) {
    const categoryKeywords = {
      'Cotton Fabrics': ['cotton', 'cotton fabric', 'cotton textile'],
      'Silk Fabrics': ['silk', 'silk fabric'],
      'Wool Fabrics': ['wool', 'wool fabric'],
      'Synthetic Fabrics': ['synthetic', 'polyester', 'nylon', 'rayon'],
      'Denim': ['denim', 'jeans', 'denim fabric'],
      'Knitted Fabrics': ['knit', 'knitted', 'jersey'],
      'Technical Textiles': ['technical textile', 'performance fabric'],
      'Home Textiles': ['home textile', 'bedding', 'curtains'],
      'Garment Manufacturing': ['garment', 'clothing', 'apparel'],
      'Yarn': ['yarn', 'thread', 'fiber'],
      'Accessories': ['accessories', 'belts', 'hats', 'bags'],
      'Trims': ['trims', 'buttons', 'zippers', 'labels']
    };

    // Return flat array of found keywords for productCategories
    const result = this.extractByKeywords($, categoryKeywords);
    return Object.values(result).flat();
  }

  extractPricingModels($) {
    const pricingKeywords = {
      'Per Piece': ['per piece', 'each', 'per item', 'per unit'],
      'Per Design': ['per design', 'per artwork', 'per logo'],
      'Flat Rate': ['flat rate', 'fixed price', 'one price'],
      'Tiered Pricing': ['tiered', 'volume discount', 'quantity break'],
      'Bulk Discount': ['bulk discount', 'wholesale price', 'volume pricing'],
      'Custom Quote': ['custom quote', 'contact for pricing', 'quote']
    };
    // Return flat array of found keywords for pricingModels
    const result = this.extractByKeywords($, pricingKeywords);
    return Object.values(result).flat();
  }

  extractPriceRanges($) {
    let found = false;
    let priceRanges = [];
    // 1. Search for all major currency symbols and codes (strict)
    const currencySymbols = ['$', '€', '£', '¥', '₹', '₩', '₽', '₺', '₫', '฿', '₴', '₦', '₲', '₪', '₱', 'USD', 'EUR', 'GBP', 'INR', 'CNY', 'JPY', 'CAD', 'AUD', 'SGD', 'ZAR', 'BRL', 'RUB', 'TRY', 'MXN', 'PLN', 'SEK', 'NOK', 'DKK', 'CHF', 'HKD', 'TWD', 'THB', 'MYR', 'IDR', 'VND', 'PHP', 'KRW', 'NGN', 'GHS', 'UAH', 'KZT', 'CLP', 'COP', 'ARS', 'PEN', 'CZK', 'HUF', 'RON', 'ILS', 'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'MAD', 'TND', 'DZD', 'SDG', 'IQD', 'LYD', 'YER', 'SYP', 'MZN', 'AOA', 'ZMW', 'TZS', 'KES', 'UGX', 'RWF', 'BIF', 'MWK', 'MGA', 'XOF', 'XAF', 'XPF', 'XCD'];
    const currencySet = new Set(currencySymbols.map(s => s.toUpperCase()));
    // Build regex for currency codes/symbols only
    const currencyCodeRegex = currencySymbols.filter(s => s.length > 1).join('|');
    const currencySymbolRegex = currencySymbols.filter(s => s.length === 1).map(s => '\\' + s).join('');
    // Regex for price patterns (e.g. $10, 10 USD, €5, 5-10 EUR, from $10, per piece, etc.)
    const priceRegexes = [
      new RegExp(`([\\d,.]+)\\s*[-–]\\s*([\\d,.]+)\\s*(${currencyCodeRegex}|[${currencySymbolRegex}])\\b`, 'gi'), // 10-20 USD
      new RegExp(`([${currencySymbolRegex}])\\s*([\\d,.]+)\\s*(?:-|to)?\\s*([\\d,.]+)?`, 'g'), // $10, $10-20
      new RegExp(`([\\d,.]+)\\s*(${currencyCodeRegex}|[${currencySymbolRegex}])\\b`, 'gi'), // 10 USD
      new RegExp(`([${currencySymbolRegex}])\\s*([\\d,.]+)`, 'g'), // $10
      new RegExp(`from\\s*([${currencySymbolRegex}]?[\\d,.]+)\\b`, 'gi'), // from $10
      /([\d,.]+)\s*per\s*(piece|unit|item|kg|meter|yard|set|lot|dozen)/gi // 10 per piece
    ];
    // 2. Search in visible text only (ignore script/style/meta)
    let allText = '';
    ['body', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'p'].forEach(tag => {
      allText += ' ' + $(tag).not('script, style, meta').text();
    });

    // 2b. Explicitly extract prices from tables (cell-by-cell)
    const tableRows = $('table tr');
    tableRows.each((i, row) => {
      const cells = $(row).find('th,td');
      let rowTextArr = [];
      cells.each((j, cell) => {
        rowTextArr.push($(cell).text().trim());
      });
      // Try to find price/currency/unit in the row (adjacent cells)
      for (let k = 0; k < rowTextArr.length; k++) {
        let cell = rowTextArr[k];
        // Look for price in this cell
        let priceMatch = cell.match(/([\d,.]+)(?:\s*[-–]\s*([\d,.]+))?/);
        if (priceMatch) {
          let min = parseFloat(priceMatch[1].replace(/,/g, ''));
          let max = priceMatch[2] ? parseFloat(priceMatch[2].replace(/,/g, '')) : min;
          // Look for currency/unit in same or next cell
          let currency = '', unit = '';
          // Check for currency in this cell
          let currencyMatch = cell.match(new RegExp(`(${currencyCodeRegex}|[${currencySymbolRegex}])`, 'i'));
          if (currencyMatch) {
            currency = currencyMatch[1];
          } else if (rowTextArr[k+1]) {
            // Check next cell for currency
            let nextCell = rowTextArr[k+1];
            let nextCurrencyMatch = nextCell.match(new RegExp(`(${currencyCodeRegex}|[${currencySymbolRegex}])`, 'i'));
            if (nextCurrencyMatch) {
              currency = nextCurrencyMatch[1];
            }
            // Check for unit in next cell
            let unitMatch = nextCell.match(/(piece|unit|item|kg|meter|yard|set|lot|dozen)/i);
            if (unitMatch) unit = unitMatch[1];
          }
          // Only allow if currency is valid
          let currencyNorm = (currency || '').replace(/[^A-Za-z$€£¥₹₩₽₺₫฿₴₦₲₪₱]/g, '').toUpperCase();
          if (min && currencyNorm && currencySet.has(currencyNorm)) {
            priceRanges.push({
              service: 'General',
              minPrice: min,
              maxPrice: max,
              currency,
              unit,
              notes: `Table row: ${rowTextArr.join(' | ')}`
            });
            found = true;
          }
        }
      }
    });
    // 3. Search in JSON-LD for offers/price
    const jsonLdBlocks = $('script[type="application/ld+json"]');
    jsonLdBlocks.each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        const findOffers = (obj) => {
          if (!obj) return [];
          let found = [];
          if (Array.isArray(obj)) {
            for (const item of obj) found = found.concat(findOffers(item));
          } else if (typeof obj === 'object') {
            if (obj['@type'] === 'Offer' || obj['@type'] === 'AggregateOffer') {
              found.push({
                price: obj.price,
                priceCurrency: obj.priceCurrency,
                lowPrice: obj.lowPrice,
                highPrice: obj.highPrice,
                unit: obj.priceUnit || '',
                notes: JSON.stringify(obj)
              });
            }
            for (const key in obj) found = found.concat(findOffers(obj[key]));
          }
          return found;
        };
        const offers = findOffers(json);
        offers.forEach(offer => {
          // Only allow if currency is valid
          if ((offer.price || offer.lowPrice) && offer.priceCurrency && currencySet.has(String(offer.priceCurrency).toUpperCase())) {
            priceRanges.push({
              service: 'General',
              minPrice: offer.lowPrice ? parseFloat(offer.lowPrice) : parseFloat(offer.price),
              maxPrice: offer.highPrice ? parseFloat(offer.highPrice) : (offer.price ? parseFloat(offer.price) : undefined),
              currency: offer.priceCurrency,
              unit: offer.unit || '',
              notes: offer.notes
            });
            found = true;
          }
        });
      } catch (e) {}
    });
    // 4. Run all regexes on allText
    for (const regex of priceRegexes) {
      let match;
      while ((match = regex.exec(allText)) !== null) {
        let min = null, max = null, currency = '', unit = '', notes = match[0];
        if (match.length === 4 && match[1] && match[2] && match[3]) {
          min = parseFloat(match[1].replace(/,/g, ''));
          max = parseFloat(match[2].replace(/,/g, ''));
          currency = match[3];
        } else if (match.length === 3 && match[1] && match[2]) {
          if (/[$€£¥₹₩₽₺₫฿₴₦₲₪₱A-Z]{1,4}/.test(match[1])) {
            currency = match[1];
            min = parseFloat(match[2].replace(/,/g, ''));
          } else {
            min = parseFloat(match[1].replace(/,/g, ''));
            currency = match[2];
          }
        } else if (match.length === 2 && match[1]) {
          min = parseFloat(match[1].replace(/,/g, ''));
        }
        if (match.length >= 3 && /per/i.test(match[0])) {
          unit = match[2] || '';
        }
        // Only allow if currency is valid (case-insensitive)
        if (min !== null && !isNaN(min)) {
          let currencyNorm = (currency || '').replace(/[^A-Za-z$€£¥₹₩₽₺₫฿₴₦₲₪₱]/g, '').toUpperCase();
          if (currencyNorm && currencySet.has(currencyNorm)) {
            priceRanges.push({
              service: 'General',
              minPrice: min,
              maxPrice: max || min,
              currency,
              unit,
              notes
            });
            found = true;
          }
        }
      }
    }
    // 5. Fallback: scan for numbers near price/currency words (conservative)
    if (priceRanges.length === 0) {
      const fallbackRegex = /([\d,.]+)\s*(USD|EUR|GBP|INR|CNY|JPY|CAD|AUD|SGD|ZAR|BRL|RUB|TRY|MXN|PLN|SEK|NOK|DKK|CHF|HKD|TWD|THB|MYR|IDR|VND|PHP|KRW|NGN|GHS|UAH|KZT|CLP|COP|ARS|PEN|CZK|HUF|RON|ILS|SAR|AED|QAR|KWD|BHD|OMR|JOD|LBP|EGP|MAD|TND|DZD|SDG|IQD|LYD|YER|SYP|MZN|AOA|ZMW|TZS|KES|UGX|RWF|BIF|MWK|MGA|XOF|XAF|XPF|XCD|USD|EUR|GBP|INR|CNY|JPY|CAD|AUD|SGD|ZAR|BRL|RUB|TRY|MXN|PLN|SEK|NOK|DKK|CHF|HKD|TWD|THB|MYR|IDR|VND|PHP|KRW|NGN|GHS|UAH|KZT|CLP|COP|ARS|PEN|CZK|HUF|RON|ILS|SAR|AED|QAR|KWD|BHD|OMR|JOD|LBP|EGP|MAD|TND|DZD|SDG|IQD|LYD|YER|SYP|MZN|AOA|ZMW|TZS|KES|UGX|RWF|BIF|MWK|MGA|XOF|XAF|XPF|XCD|[$€£¥₹₩₽₺₫฿₴₦₲₪₱])\b/gi;
      let match;
      while ((match = fallbackRegex.exec(allText)) !== null) {
        let min = parseFloat(match[1].replace(/,/g, ''));
        let currency = match[2];
        let currencyNorm = (currency || '').replace(/[^A-Za-z$€£¥₹₩₽₺₫฿₴₦₲₪₱]/g, '').toUpperCase();
        if (!isNaN(min) && currencyNorm && currencySet.has(currencyNorm)) {
          priceRanges.push({
            service: 'General',
            minPrice: min,
            maxPrice: min,
            currency,
            unit: '',
            notes: match[0]
          });
          found = true;
        }
      }
    }
    const logUrl = $.root().find('base').attr('href') || '';
    const logSample = (allText || '').substring(0, 500);
    if (!found) {
      logDebug('extractPriceRanges', {
        message: 'No price found',
        url: logUrl,
        sample: logSample
      });
    } else {
      logDebug('extractPriceRanges', {
        message: 'Price extraction result',
        url: logUrl,
        sample: logSample,
        result: priceRanges
      });
    }
    // 6. Limit to first 10 found
    return priceRanges.slice(0, 10);
  }

  parsePriceRange(priceText) {
    const cleanPrice = priceText.replace(/[$,]/g, '');
    
    if (cleanPrice.includes('-')) {
      const [min, max] = cleanPrice.split('-').map(p => parseFloat(p.trim()));
      return {
        service: 'General',
        minPrice: min,
        maxPrice: max,
        currency: 'USD',
        unit: 'per item',
        notes: priceText
      };
    } else {
      const price = parseFloat(cleanPrice);
      return {
        service: 'General',
        minPrice: price,
        maxPrice: price,
        currency: 'USD',
        unit: 'per item',
        notes: priceText
      };
    }
  }

  extractBusinessPolicies($) {
    const policies = {};

    // Returns policy
    const returnsKeywords = ['return', 'refund', 'exchange'];
    if (this.textContainsKeywords($, returnsKeywords)) {
      policies.returns = {
        accepted: true,
        timeframe: this.extractTimeframe($, returnsKeywords),
        conditions: ''
      };
    }

    // Sample policy
    const sampleKeywords = ['sample', 'free sample', 'sample cost'];
    if (this.textContainsKeywords($, sampleKeywords)) {
      policies.samples = {
        available: true,
        free: this.textContainsKeywords($, ['free sample']),
        cost: 0,
        turnaroundTime: this.extractTimeframe($, sampleKeywords)
      };
    }

    // Payment methods
    const paymentMethods = this.extractPaymentMethods($);
    if (paymentMethods.length > 0) {
      policies.payment = {
        methods: paymentMethods,
        terms: '',
        advanceRequired: 0
      };
    }

    // Shipping policy
    const shippingKeywords = ['shipping', 'delivery', 'free shipping'];
    if (this.textContainsKeywords($, shippingKeywords)) {
      policies.shipping = {
        domestic: true,
        international: this.textContainsKeywords($, ['international', 'worldwide', 'global']),
        freeShipping: this.textContainsKeywords($, ['free shipping']),
        freeShippingThreshold: 0
      };
    }

    return policies;
  }

  extractPaymentMethods($) {
    const methods = [];
    const paymentKeywords = {
      'Credit Card': ['credit card', 'visa', 'mastercard', 'amex'],
      'PayPal': ['paypal'],
      'Bank Transfer': ['bank transfer', 'wire transfer', 'ach'],
      'Cash': ['cash', 'cod', 'cash on delivery'],
      'Check': ['check', 'cheque'],
      'Bitcoin': ['bitcoin', 'cryptocurrency', 'crypto']
    };

    for (const [method, keywords] of Object.entries(paymentKeywords)) {
      if (this.textContainsKeywords($, keywords)) {
        methods.push(method);
      }
    }

    return methods;
  }

  extractMOQ($) {
    const moqRegex = /(?:moq|minimum order|min order).*?(\d+)/gi;
    const text = $('body').text();
    const match = text.match(moqRegex);
    
    if (match) {
      const quantity = parseInt(match[0].match(/\d+/)[0]);
      return {
        value: quantity,
        unit: 'pieces'
      };
    }

    return {};
  }

  extractProductionCapacity($) {
    const capacityRegex = /(?:capacity|production|output).*?(\d+).*?(?:per|\/)\s*(day|week|month)/gi;
    const text = $('body').text();
    const match = text.match(capacityRegex);
    
    if (match) {
      const numbers = match[0].match(/\d+/g);
      const timeUnit = match[0].match(/(day|week|month)/i);
      
      if (numbers && timeUnit) {
        const capacity = parseInt(numbers[0]);
        const unit = timeUnit[0].toLowerCase();
        
        return {
          dailyOutput: unit === 'day' ? capacity : null,
          monthlyOutput: unit === 'month' ? capacity : null,
          unit: 'pieces'
        };
      }
    }

    return {};
  }

  extractCertifications($) {
    const certKeywords = [
      'iso', 'certified', 'certification', 'quality standard',
      'oeko-tex', 'gots', 'organic', 'sustainable'
    ];

    const certifications = [];
    const text = $('body').text().toLowerCase();

    certKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        certifications.push(keyword.toUpperCase());
      }
    });

    return [...new Set(certifications)]; // Remove duplicates
  }

  extractReputation($) {
    const reputation = {};

    // Look for review indicators
    const reviewRegex = /(\d+(?:\.\d+)?)\s*(?:stars?|\/5|out of 5)/gi;
    const text = $('body').text();
    const ratingMatch = text.match(reviewRegex);

    if (ratingMatch) {
      const rating = parseFloat(ratingMatch[0].match(/\d+(?:\.\d+)?/)[0]);
      reputation.overallScore = Math.min(rating, 10); // Normalize to 1-10
    }

    // Look for review count
    const reviewCountRegex = /(\d+)\s*(?:reviews?|ratings?)/gi;
    const countMatch = text.match(reviewCountRegex);

    if (countMatch) {
      reputation.reviewCount = parseInt(countMatch[0].match(/\d+/)[0]);
    }

    return reputation;
  }

  extractEquipment($) {
    const equipmentKeywords = [
      'heat press', 'printer', 'embroidery machine', 'cutting machine',
      'dtg printer', 'screen printing', 'sublimation printer', 'vinyl cutter'
    ];

    return this.extractByKeywords($, { equipment: equipmentKeywords }).equipment || [];
  }

  extractQualityStandards($) {
    const standardsKeywords = [
      'iso 9001', 'quality control', 'quality assurance', 'qc',
      'inspection', 'testing', 'standards', 'certification'
    ];

    return this.extractByKeywords($, { standards: standardsKeywords }).standards || [];
  }

  extractTextContent($) {
    // Remove script and style elements
    $('script, style').remove();
    
    // Get text content and clean it
    let text = $('body').text();
    text = text.replace(/\s+/g, ' ').trim();
    
    // Limit to first 5000 characters
    return text.substring(0, 5000);
  }

  extractKeyPhrases($) {
    const text = this.extractTextContent($);
    const phrases = [];

    // Extract textile/fashion related phrases
    const relevantPhrases = text.match(/\b(?:textile|fashion|printing|fabric|garment|apparel|clothing|custom|wholesale|manufacturing|supplier)[a-z\s]{2,30}\b/gi);
    
    if (relevantPhrases) {
      phrases.push(...relevantPhrases.slice(0, 10)); // Limit to 10 phrases
    }

    return [...new Set(phrases)]; // Remove duplicates
  }

  // Utility methods

  extractByKeywords($, keywordMap) {
    const result = {};
    const text = $('body').text().toLowerCase();

    for (const [category, keywords] of Object.entries(keywordMap)) {
      const foundKeywords = keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length > 0) {
        if (!result[category]) result[category] = [];
        result[category].push(...foundKeywords);
      }
    }

    // Remove duplicates and return
    for (const category in result) {
      result[category] = [...new Set(result[category])];
    }

    return result;
  }

  textContainsKeywords($, keywords) {
    const text = $('body').text().toLowerCase();
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  extractTimeframe($, contextKeywords) {
    const text = $('body').text().toLowerCase();
    const timeframeRegex = /(\d+)[-\s]*(days?|weeks?|months?|hours?)/gi;
    const matches = text.match(timeframeRegex);

    if (matches) {
      // Find timeframe near context keywords
      for (const keyword of contextKeywords) {
        const keywordIndex = text.indexOf(keyword.toLowerCase());
        if (keywordIndex !== -1) {
          // Look for timeframe within 200 characters of keyword
          const contextText = text.substring(
            Math.max(0, keywordIndex - 100),
            Math.min(text.length, keywordIndex + 100)
          );
          
          const contextMatch = contextText.match(timeframeRegex);
          if (contextMatch) {
            return contextMatch[0];
          }
        }
      }
      
      // Return first found timeframe if no context match
      return matches[0];
    }

    return '';
  }
}

module.exports = DataExtractionService;
