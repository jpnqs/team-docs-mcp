import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Tool, type ToolConfig } from '../tool.js';
import type { FileIndexer } from '../file-indexer.js';

// This tool takes no arguments
type InputSchema = undefined;

export class ListIndexedFilesTool extends Tool<InputSchema> {
    readonly name = 'list-indexed-files';

    readonly definition: ToolConfig<InputSchema> = {
        title: 'List Indexed Files',
        description: 'Get a list of all documentation files that have been indexed and are available for semantic search.',
    };

    private readonly indexer: FileIndexer;

    constructor(indexer: FileIndexer) {
        super();
        this.indexer = indexer;
    }

    async execute(): Promise<CallToolResult> {
        this.log.toolStart(this.name, {});
        const start = Date.now();

        const files = this.indexer.getIndexedFiles();

        const response = {
            indexedFiles: files,
            fileCount: files.length,
            totalChunks: this.indexer.totalChunks,
            lastIndexedAt: this.indexer.lastIndexedAt,
        };

        this.log.toolEnd(this.name, Date.now() - start, `${files.length} file(s) indexed`);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(response, null, 2),
            }],
        };
    }
}
