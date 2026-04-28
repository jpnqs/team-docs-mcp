import { z } from 'zod';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Tool, type ToolConfig } from '../tool.js';

const inputSchema = z.object({
    filePath: z.string().describe('Relative path to the documentation file (e.g., "coding-standards.md" or "guides/observer-pattern.md")'),
});

type InputSchema = typeof inputSchema;

export class GetDocumentContentTool extends Tool<InputSchema> {
    readonly name = 'get-document-content';

    readonly definition: ToolConfig<InputSchema> = {
        title: 'Get Document Content',
        description: 'Read the complete content of a specific documentation file. Use this when you need to read the full document after finding it through search.',
        inputSchema,
    };

    private readonly docsDir: string;

    constructor(docsDir: string) {
        super();
        this.docsDir = docsDir;
    }

    async execute(args: z.infer<InputSchema>): Promise<CallToolResult> {
        this.log.toolStart(this.name, { filePath: args.filePath });
        const start = Date.now();

        try {
            // Normalize the path and prevent directory traversal
            const normalizedPath = path.normalize(args.filePath).replace(/^(\.\.[\/\\])+/, '');
            const fullPath = path.join(this.docsDir, normalizedPath);

            // Security check: ensure the resolved path is within docsDir
            const resolvedPath = path.resolve(fullPath);
            const resolvedDocsDir = path.resolve(this.docsDir);

            if (!resolvedPath.startsWith(resolvedDocsDir)) {
                throw new Error('Invalid file path: cannot access files outside docs directory');
            }

            // Check if file exists
            const stats = await fs.stat(fullPath);

            if (!stats.isFile()) {
                throw new Error(`Path exists but is not a file: ${args.filePath}`);
            }

            // Read the file content
            const content = await fs.readFile(fullPath, 'utf-8');

            this.log.toolEnd(this.name, Date.now() - start, `Read ${content.length} characters from ${args.filePath}`);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        filePath: args.filePath,
                        content: content,
                        size: content.length,
                    }, null, 2),
                }],
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const isNotFound = errorMsg.includes('ENOENT') || errorMsg.includes('no such file');

            this.log.toolEnd(this.name, Date.now() - start, `Error: ${errorMsg}`);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        filePath: args.filePath,
                        error: isNotFound
                            ? `File not found: ${args.filePath}`
                            : `Error reading file: ${errorMsg}`,
                    }, null, 2),
                }],
                isError: true,
            };
        }
    }
}
