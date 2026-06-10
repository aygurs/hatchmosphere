// ============================================================
// Foundry IQ / Azure AI Search Service
// ============================================================
//
// Retrieves relevant knowledge snippets from Azure AI Search
// using semantic search based on creature type and sensor reading.
//
// Required .env variables in server/.env:
//   AZURE_SEARCH_ENDPOINT=https://your-service.search.windows.net
//   AZURE_SEARCH_API_KEY=your-api-key
//   AZURE_SEARCH_INDEX_NAME=hatchmosphere-knowledge
//
// If any of those are missing, falls back to the local mock data.
// ============================================================

const mockKnowledge = require('../data/mockKnowledge');

let searchClient = null;

function getSearchClient() {
  if (searchClient) return searchClient;

  const endpoint  = process.env.AZURE_SEARCH_ENDPOINT;
  const apiKey    = process.env.AZURE_SEARCH_API_KEY;
  const indexName = process.env.AZURE_SEARCH_INDEX_NAME || 'hatchmosphere-knowledge';

  if (!endpoint || !apiKey) return null;

  try {
    const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');
    searchClient = new SearchClient(endpoint, indexName, new AzureKeyCredential(apiKey));
    console.log('[FoundryIQ] Connected to Azure AI Search.');
  } catch {
    console.warn('[FoundryIQ] @azure/search-documents not installed — using mock data.');
    return null;
  }

  return searchClient;
}

/**
 * Retrieve relevant knowledge snippets for a given sensor reading and creature type.
 * Uses Azure AI Search when credentials are available; falls back to mock data.
 *
 * @param {object} reading      - The latest sensor reading from the ESP8266
 * @param {string} creatureType - The creature type determined from the reading
 * @returns {Promise<Array>}    - Array of knowledge snippet objects
 */
async function retrieveKnowledge(reading, creatureType) {
  const client = getSearchClient();

  if (client) {
    try {
      const query = `${creatureType} creature hatching environment incubation`;
      console.log(`[FoundryIQ] Searching: "${query}"`);
      
      const searchResults = await client.search(query, {
        top: 4,
        queryType: 'semantic',
        semanticSearchOptions: { configurationName: 'default' },
        select: ['id', 'source', 'section', 'content'],
      });

      const snippets = [];
      for await (const result of searchResults.results) {
        snippets.push(result.document);
      }

      if (snippets.length > 0) {
        console.log(`[FoundryIQ] Retrieved ${snippets.length} snippets from Azure AI Search`);
        return snippets;
      }
      console.warn('[FoundryIQ] Search returned no results — falling back to mock data.');
    } catch (err) {
      console.error('[FoundryIQ] Search error — falling back to mock data:', err.message);
    }
  }

  // Fallback: local mock knowledge
  console.log('[FoundryIQ] Using mock knowledge (Azure not configured)');
  const type = creatureType.toLowerCase();
  const relevant = mockKnowledge.filter((snippet) => {
    const content = snippet.content.toLowerCase();
    return (
      content.includes(type) ||
      content.includes('incubation') ||
      content.includes('hatch') ||
      content.includes('biome')
    );
  });
  const results = relevant.slice(0, 4);
  if (results.length < 2) {
    results.push(...mockKnowledge.slice(0, 2 - results.length));
  }
  return results;
}

/**
 * Extract unique source file names from a list of knowledge snippets.
 * @param {Array} snippets
 * @returns {string[]}
 */
function extractSourceNames(snippets) {
  return [...new Set(snippets.map((s) => s.source))];
}

module.exports = { retrieveKnowledge, extractSourceNames };
