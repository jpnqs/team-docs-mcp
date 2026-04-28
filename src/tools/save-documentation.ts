import { z } from 'zod';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Tool, type ToolConfig } from '../tool.js';
import type { FileIndexer, DocumentInput } from '../file-indexer.js';

const inputSchema = z.object({
    filename: z.string().describe('Name of the markdown file to save (e.g., "my-guide.md"). Must end with .md'),
    content: z.string().describe('Markdown content to save in the file'),
    subfolder: z.string().optional().describe('Optional subfolder within docs/ to save the file (e.g., "guides")'),
});

type InputSchema = typeof inputSchema;

export class SaveDocumentationTool extends Tool<InputSchema> {
    readonly name = 'save-documentation';

    readonly definition: ToolConfig<InputSchema> = {
        title: 'Save Documentation',
        description: 'Save a new documentation file as markdown in the docs folder. The file is automatically indexed for semantic search after saving.',
        inputSchema,
    };

    private readonly indexer: FileIndexer;
    private readonly docsDir: string;

    constructor(indexer: FileIndexer, docsDir: string) {
        super();
        this.indexer = indexer;
        this.docsDir = docsDir;
    }

    async execute(args: z.infer<InputSchema>): Promise<CallToolResult> {
        this.log.toolStart(this.name, { filename: args.filename, hasContent: !!args.content, subfolder: args.subfolder });
        const start = Date.now();

        try {
            // Validate filename
            if (!args.filename.endsWith('.md')) {
                throw new Error('Filename must end with .md');
            }

            // Prevent path traversal
            const safeName = path.basename(args.filename);
            if (safeName !== args.filename) {
                throw new Error('Filename cannot contain path separators');
            }

            // Validate subfolder if provided
            let relativePath = safeName;
            let targetDir = this.docsDir;

            if (args.subfolder) {
                const safeSubfolder = args.subfolder.replace(/\\/g, '/').split('/').filter(p => p && p !== '.' && p !== '..').join('/');
                if (!safeSubfolder) {
                    throw new Error('Invalid subfolder path');
                }
                relativePath = `${safeSubfolder}/${safeName}`;
                targetDir = path.join(this.docsDir, safeSubfolder);
            }

            // Ensure directory exists
            await fs.mkdir(targetDir, { recursive: true });

            // Write the file
            const filePath = path.join(targetDir, safeName);
            await fs.writeFile(filePath, args.content, 'utf-8');

            // Get file stats for indexing
            const stats = await fs.stat(filePath);

            // Create DocumentInput and re-index
            const document: DocumentInput = {
                relativePath,
                text: args.content,
                sourceModifiedMs: stats.mtimeMs,
            };

            await this.indexer.reindexDocument(document);

            const message = `Successfully saved and indexed ${relativePath}`;
            this.log.toolEnd(this.name, Date.now() - start, message);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        filePath: relativePath,
                        absolutePath: filePath,
                        message,
                        indexedChunks: this.indexer.totalChunks,
                        indexedFiles: this.indexer.indexedFileCount,
                    }, null, 2),
                }],
            };
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            this.log.toolError(this.name, Date.now() - start, error);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error,
                    }, null, 2),
                }],
                isError: true,
            };
        }
    }
}
