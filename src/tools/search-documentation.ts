import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Tool, type ToolConfig } from '../tool.js';
import type { FileIndexer } from '../file-indexer.js';

const inputSchema = z.object({
    query: z.string().describe('Natural language query for documentation search'),
    topK: z.number().optional().default(5).describe('Max number of matching chunks to return'),
    minScore: z.number().optional().default(0.2).describe('Minimum cosine similarity threshold between 0 and 1'),
});

type InputSchema = typeof inputSchema;

export class SearchDocumentationTool extends Tool<InputSchema> {
    readonly name = 'search-documentation';

    readonly definition: ToolConfig<InputSchema> = {
        title: 'Search Documentation',
        description: 'Semantic similarity search over local documents indexed from the docs folder at startup.',
        inputSchema,
    };

    private readonly indexer: FileIndexer;

    constructor(indexer: FileIndexer) {
        super();
        this.indexer = indexer;
    }

    async execute(args: z.infer<InputSchema>): Promise<CallToolResult> {
        this.log.toolStart(this.name, { query: args.query, topK: args.topK, minScore: args.minScore });
        const start = Date.now();

        if (this.indexer.totalChunks === 0) {
            this.log.toolError(this.name, Date.now() - start, 'No indexed content available');
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        query: args.query,
                        indexedFiles: this.indexer.indexedFileCount,
                        indexedChunks: this.indexer.totalChunks,
                        lastIndexedAt: this.indexer.lastIndexedAt,
                        message: 'No indexed content found. Add files to docs/ and restart the MCP server.',
                    }, null, 2),
                }],
                isError: true,
            };
        }

        try {
            const results = await this.indexer.search(args.query, args.topK, args.minScore);

            const topScore = results.length > 0 ? results[0]?.score ?? 0 : 0;
            this.log.toolEnd(this.name, Date.now() - start, `${results.length} result(s), top score: ${topScore}`);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        query: args.query,
                        indexedFiles: this.indexer.indexedFileCount,
                        indexedChunks: this.indexer.totalChunks,
                        lastIndexedAt: this.indexer.lastIndexedAt,
                        resultCount: results.length,
                        results,
                    }, null, 2),
                }],
            };
        } catch (err) {
            this.log.toolError(this.name, Date.now() - start, String(err));
            throw err;
        }
    }
}
