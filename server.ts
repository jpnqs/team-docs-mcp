import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Logger } from './src/logger.js';
import { FileIndexer } from './src/file-indexer.js';
import { DocumentLoader } from './src/document-loader.js';
import { SearchDocumentationTool } from './src/tools/search-documentation.js';
import { SaveDocumentationTool } from './src/tools/save-documentation.js';
import { GetDocumentationGuidelinesTool } from './src/tools/get-documentation-guidelines.js';
import { ListIndexedFilesTool } from './src/tools/list-indexed-files.js';
import { GetDocumentContentTool } from './src/tools/get-document-content.js';
import {
    DOCS_DIR,
    INDEXED_DIR,
    EMBEDDING_MODEL,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    CHUNK_SIZE_WORDS,
    CHUNK_OVERLAP_WORDS,
} from './src/config.js';

const indexer = new FileIndexer({
    embeddingModel: EMBEDDING_MODEL,
    cacheDir: INDEXED_DIR,
    chunkSizeWords: CHUNK_SIZE_WORDS,
    chunkOverlapWords: CHUNK_OVERLAP_WORDS,
});

const loader = new DocumentLoader({
    docsDir: DOCS_DIR,
    allowedExtensions: ALLOWED_EXTENSIONS,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
});

const server = new McpServer({
    name: 'team-docs-mcp',
    version: '1.0.0',
    description: 'MCP Server for semantic search over team documentation and knowledge base.'
});

const tools = [
    new SearchDocumentationTool(indexer),
    new SaveDocumentationTool(indexer, DOCS_DIR),
    new GetDocumentationGuidelinesTool(),
    new ListIndexedFilesTool(indexer),
    new GetDocumentContentTool(DOCS_DIR),
];

for (const tool of tools) {
    tool.register(server);
}

async function main() {
    const mainLog = new Logger('server');
    mainLog.header('Team Docs MCP Server v1.0.0');
    mainLog.info('Starting up...');

    const documents = await loader.loadDocuments();
    await indexer.indexDocuments(documents);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    mainLog.success('Server connected and ready for requests');
}

main().catch((error) => {
    const errorLog = new Logger('server');
    errorLog.error('Fatal error in main()', { error: String(error) });
    process.exit(1);
});
