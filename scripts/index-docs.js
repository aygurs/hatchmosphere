/**
 * index-docs.js
 *
 * One-time script to create the Azure AI Search index and upload
 * all knowledge documents from the docs/ folder.
 *
 * Usage:
 *   1. Fill in your Azure credentials in server/.env
 *   2. Run: node scripts/index-docs.js
 *
 * Required .env variables:
 *   AZURE_SEARCH_ENDPOINT=https://your-service.search.windows.net
 *   AZURE_SEARCH_API_KEY=your-admin-api-key
 *   AZURE_SEARCH_INDEX_NAME=hatchmosphere-knowledge
 */

const path = require('path');

require('../server/node_modules/dotenv').config({ path: path.join(__dirname, '../server/.env') });

const { SearchIndexClient, SearchClient, AzureKeyCredential } = require('../server/node_modules/@azure/search-documents');
const fs = require('fs');

const ENDPOINT   = process.env.AZURE_SEARCH_ENDPOINT;
const API_KEY    = process.env.AZURE_SEARCH_API_KEY;
const INDEX_NAME = process.env.AZURE_SEARCH_INDEX_NAME || 'hatchmosphere-knowledge';
const DOCS_DIR   = path.join(__dirname, '../docs');

// ---------------------------------------------------------------
// Index schema
// ---------------------------------------------------------------
const indexDefinition = {
  name: INDEX_NAME,
  fields: [
    { name: 'id',       type: 'Edm.String', key: true, filterable: true },
    { name: 'source',   type: 'Edm.String', filterable: true, facetable: true },
    { name: 'section',  type: 'Edm.String', filterable: true },
    { name: 'content',  type: 'Edm.String', searchable: true },
  ],
  semanticSearch: {
    configurations: [
      {
        name: 'default',
        prioritizedFields: {
          contentFields: [{ name: 'content' }],
          keywordsFields: [{ name: 'source' }, { name: 'section' }],
        },
      },
    ],
  },
};

// ---------------------------------------------------------------
// Parse a markdown file into chunks (one per heading section)
// ---------------------------------------------------------------
function parseMarkdown(filename, content) {
  const sections = content.split(/^## /m).filter(Boolean);
  const docs = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const lines = section.split('\n');
    const heading = lines[0].replace(/^# /, '').trim();
    const body = lines.slice(1).join('\n').trim();

    if (body.length < 20) continue; // skip near-empty sections

    docs.push({
      id:      `${path.basename(filename, '.md')}-${chunkIndex++}`,
      source:  filename,
      section: heading,
      content: `${heading}\n\n${body}`,
    });
  }

  return docs;
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function main() {
  if (!ENDPOINT || !API_KEY) {
    console.error('Missing AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_API_KEY in server/.env');
    process.exit(1);
  }

  const credential = new AzureKeyCredential(API_KEY);

  // 1. Create or recreate the index
  console.log(`Creating index "${INDEX_NAME}"...`);
  const indexClient = new SearchIndexClient(ENDPOINT, credential);
  try {
    await indexClient.deleteIndex(INDEX_NAME);
    console.log('Deleted existing index.');
  } catch {
    // Index didn't exist yet — that's fine
  }
  await indexClient.createIndex(indexDefinition);
  console.log('Index created.');

  // 2. Parse all markdown files
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
  const allDocs = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(DOCS_DIR, file), 'utf8');
    const chunks = parseMarkdown(file, content);
    console.log(`  ${file} → ${chunks.length} chunks`);
    allDocs.push(...chunks);
  }

  // 3. Upload documents
  console.log(`\nUploading ${allDocs.length} documents...`);
  const searchClient = new SearchClient(ENDPOINT, INDEX_NAME, credential);
  const result = await searchClient.uploadDocuments(allDocs);
  const succeeded = result.results.filter(r => r.succeeded).length;
  console.log(`Done. ${succeeded}/${allDocs.length} documents indexed successfully.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
