import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { AnySchema, ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from './logger.js';

// ── Types ────────────────────────────────────────────────────────────

/** The config object passed to McpServer.registerTool. */
export type ToolConfig<InputArgs extends ZodRawShapeCompat | AnySchema | undefined> = {
    title?: string;
    description?: string;
    inputSchema?: InputArgs;
    outputSchema?: ZodRawShapeCompat | AnySchema;
    annotations?: ToolAnnotations;
    _meta?: Record<string, unknown>;
};

// ── Abstract base class ──────────────────────────────────────────────

/**
 * Base class for MCP tools.
 *
 * Separates the **definition** (name, title, description, schemas) from the
 * **implementation** (execute method). Each concrete tool overrides both.
 *
 * @template TInput - The Zod schema (or `undefined`) that describes the
 *                     tool's input. This is the same type argument you
 *                     would pass to `McpServer.registerTool`.
 */
export abstract class Tool<TInput extends ZodRawShapeCompat | AnySchema | undefined = undefined> {
    protected readonly log = new Logger('tool');

    /** Unique tool name (the first argument to `registerTool`). */
    abstract readonly name: string;

    /** Definition metadata passed as the config object to `registerTool`. */
    abstract readonly definition: ToolConfig<TInput>;

    /**
     * Implementation of the tool's logic.
     *
     * `args` will be the parsed/validated input when `TInput` is defined,
     * or `undefined` when the tool takes no arguments.
     */
    abstract execute(args: TInput extends undefined ? undefined : Record<string, unknown>, extra: unknown): Promise<CallToolResult>;

    /**
     * Registers this tool on the given McpServer instance.
     *
     * Wires up the definition and routes execution through `execute()`.
     */
    register(server: McpServer): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the MCP SDK uses complex generic overloads; we need to bridge with `any` here.
        server.registerTool(this.name, this.definition as any, (async (...callArgs: any[]) => {
            // When TInput is defined the SDK calls (args, extra); without it, just (extra).
            const args = callArgs.length > 1 ? callArgs[0] : undefined;
            const extra = callArgs.length > 1 ? callArgs[1] : callArgs[0];
            return this.execute(args, extra);
        }) as any);
    }
}
