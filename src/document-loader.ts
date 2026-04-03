import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Logger } from './logger.js';
import type { DocumentInput } from './file-indexer.js';

// ── Types ────────────────────────────────────────────────────────────

export type DocumentLoaderOptions = {
    /** Root directory to scan for documents. */
    docsDir: string;
    /** File extensions to include. */
    allowedExtensions: Set<string>;
    /** Maximum file size in bytes - files larger than this are skipped. */
    maxFileSizeBytes: number;
    /** Directory names to skip during traversal (e.g. cache dirs). */
    skipDirs?: Set<string>;
};

// ── DocumentLoader ───────────────────────────────────────────────────

export class DocumentLoader {
    private readonly docsDir: string;
    private readonly allowedExtensions: Set<string>;
    private readonly maxFileSizeBytes: number;
    private readonly skipDirs: Set<string>;

    constructor(options: DocumentLoaderOptions) {
        this.docsDir = options.docsDir;
        this.allowedExtensions = options.allowedExtensions;
        this.maxFileSizeBytes = options.maxFileSizeBytes;
        this.skipDirs = options.skipDirs ?? new Set(['.cache']);
    }

    // ── Public API ───────────────────────────────────────────────────

    /**
     * Discovers, reads, and returns all documents from the configured
     * docs directory, ready to be fed into a `FileIndexer`.
     */
    async loadDocuments(): Promise<DocumentInput[]> {
        const log = new Logger('loader');

        const docsStats = await fs.stat(this.docsDir).catch(() => null);
        if (!docsStats || !docsStats.isDirectory()) {
            log.warn(`Docs folder not found at ${this.docsDir}. Create it and restart to enable search.`);
            return [];
        }

        const files = await this.listFiles(this.docsDir);
        log.info(`Discovered ${files.length} document(s) in ${this.docsDir}`);

        const documents: DocumentInput[] = [];
        let skippedBySize = 0;

        for (const filePath of files) {
            const stats = await fs.stat(filePath);
            const relativePath = path.relative(this.docsDir, filePath).split(path.sep).join('/');

            if (stats.size > this.maxFileSizeBytes) {
                log.warn(`Skipped oversized file: ${relativePath} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
                skippedBySize += 1;
                continue;
            }

            const text = await this.readDocument(filePath);
            documents.push({
                relativePath,
                text,
                sourceModifiedMs: stats.mtimeMs,
            });
        }

        if (skippedBySize > 0) {
            log.stat('Skipped (oversized)', skippedBySize);
        }

        return documents;
    }

    // ── File discovery ───────────────────────────────────────────────

    private async listFiles(rootDir: string): Promise<string[]> {
        const filePaths: string[] = [];
        const stack = [rootDir];

        while (stack.length > 0) {
            const current = stack.pop();
            if (!current) {
                continue;
            }

            const entries = await fs.readdir(current, { withFileTypes: true });
            for (const entry of entries) {
                const resolved = path.join(current, entry.name);

                if (entry.isDirectory()) {
                    if (this.skipDirs.has(entry.name)) {
                        continue;
                    }

                    stack.push(resolved);
                    continue;
                }

                const extension = path.extname(entry.name).toLowerCase();
                if (this.allowedExtensions.has(extension)) {
                    filePaths.push(resolved);
                }
            }
        }

        return filePaths;
    }

    // ── File reading ─────────────────────────────────────────────────

    private async readDocument(filePath: string): Promise<string> {
        const extension = path.extname(filePath).toLowerCase();
        const raw = await fs.readFile(filePath, 'utf-8');

        if (extension === '.json') {
            try {
                return JSON.stringify(JSON.parse(raw), null, 2);
            } catch {
                return raw;
            }
        }

        if (extension === '.html' || extension === '.htm') {
            return raw
                .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                .replace(/<[^>]+>/g, ' ');
        }

        return raw;
    }
}
