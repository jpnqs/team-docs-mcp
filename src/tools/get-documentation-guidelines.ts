import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Tool, type ToolConfig } from '../tool.js';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This tool takes no arguments
type InputSchema = undefined;

export class GetDocumentationGuidelinesTool extends Tool<InputSchema> {
    readonly name = 'get-documentation-guidelines';

    readonly definition: ToolConfig<InputSchema> = {
        title: 'Get Documentation Guidelines',
        description: 'Get comprehensive guidelines and instructions for creating and formatting team documentation files - always execute this tool before calling save-documentation to ensure the new file follows best practices for searchability and maintainability.',
    };

    async execute(): Promise<CallToolResult> {
        this.log.toolStart(this.name, {});
        const start = Date.now();

        try {
            // Read guidelines from the markdown file
            const guidelinesPath = path.join(__dirname, '..', '..', 'assets', 'documentation-guidelines.md');
            const guidelines = await fs.readFile(guidelinesPath, 'utf-8');

            this.log.toolEnd(this.name, Date.now() - start, 'Guidelines returned');

            return {
                content: [{
                    type: 'text',
                    text: guidelines,
                }],
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.log.toolEnd(this.name, Date.now() - start, `Error reading guidelines: ${errorMsg}`);

            return {
                content: [{
                    type: 'text',
                    text: `Error loading documentation guidelines: ${errorMsg}`,
                }],
                isError: true,
            };
        }
    }
}
