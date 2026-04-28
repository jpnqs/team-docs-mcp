import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pipeline } from '@xenova/transformers';
import { Logger } from './logger.js';
import { CHUNK_SIZE_WORDS as DEFAULT_CHUNK_SIZE, CHUNK_OVERLAP_WORDS as DEFAULT_CHUNK_OVERLAP } from './config.js';

// ── Types ────────────────────────────────────────────────────────────

export type IndexedChunk = {
    id: string;
    filePath: string;
    chunkIndex: number;
    startWord: number;
    endWord: number;
    text: string;
    embedding: number[];
};

export type SearchResult = {
    score: number;
    filePath: string;
    chunkIndex: number;
    wordRange: string;
    text: string;
};

/** A document that has already been loaded by the caller. */
export type DocumentInput = {
    /** Relative path used as the document identifier (e.g. "coding-standards.md"). */
    relativePath: string;
    /** Plain-text content of the document. */
    text: string;
    /** Source file modification time (epoch ms) - used for cache invalidation. */
    sourceModifiedMs: number;
};

// ── Helpers ──────────────────────────────────────────────────────────

function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    const length = Math.min(a.length, b.length);

    for (let index = 0; index < length; index += 1) {
        const valueA = a[index] ?? 0;
        const valueB = b[index] ?? 0;
        dotProduct += valueA * valueB;
        normA += valueA * valueA;
        normB += valueB * valueB;
    }

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── FileIndexer ──────────────────────────────────────────────────────

export class FileIndexer {
    private readonly embeddingModel: string;
    private readonly cacheDir: string;
    private readonly chunkSizeWords: number;
    private readonly chunkOverlapWords: number;

    private chunks: IndexedChunk[] = [];
    private _lastIndexedAt: string | null = null;
    private _indexedFileCount = 0;

    private embedderPromise: Promise<
        (input: string, options: { pooling: 'mean'; normalize: boolean }) => Promise<{ data: Float32Array | number[] }>
    > | null = null;

    constructor(options: {
        embeddingModel: string;
        cacheDir: string;
        chunkSizeWords?: number;
        chunkOverlapWords?: number;
    }) {
        this.embeddingModel = options.embeddingModel;
        this.cacheDir = options.cacheDir;
        this.chunkSizeWords = options.chunkSizeWords ?? DEFAULT_CHUNK_SIZE;
        this.chunkOverlapWords = options.chunkOverlapWords ?? DEFAULT_CHUNK_OVERLAP;
    }

    // ── Public getters ───────────────────────────────────────────────

    get lastIndexedAt(): string | null {
        return this._lastIndexedAt;
    }

    get indexedFileCount(): number {
        return this._indexedFileCount;
    }

    get totalChunks(): number {
        return this.chunks.length;
    }

    /**
     * Get the list of unique file paths that have been indexed.
     * 
     * @returns Array of file paths sorted alphabetically.
     */
    getIndexedFiles(): string[] {
        const uniqueFiles = new Set(this.chunks.map(chunk => chunk.filePath));
        return Array.from(uniqueFiles).sort();
    }

    // ── Embedding ────────────────────────────────────────────────────

    private async getEmbedder() {
        if (!this.embedderPromise) {
            this.embedderPromise = pipeline('feature-extraction', this.embeddingModel) as Promise<
                (input: string, options: { pooling: 'mean'; normalize: boolean }) => Promise<{ data: Float32Array | number[] }>
            >;
        }

        return this.embedderPromise;
    }

    private async embedText(text: string): Promise<number[]> {
        const embedder = await this.getEmbedder();
        const result = await embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(result.data);
    }

    // ── Chunking ─────────────────────────────────────────────────────

    private chunkText(text: string): Array<{ text: string; startWord: number; endWord: number }> {
        const cleaned = normalizeWhitespace(text);
        if (!cleaned) {
            return [];
        }

        const words = cleaned.split(' ');
        const safeChunkSize = Math.max(50, this.chunkSizeWords);
        const safeOverlap = Math.max(0, Math.min(this.chunkOverlapWords, safeChunkSize - 1));
        const step = safeChunkSize - safeOverlap;
        const output: Array<{ text: string; startWord: number; endWord: number }> = [];

        for (let start = 0; start < words.length; start += step) {
            const end = Math.min(words.length, start + safeChunkSize);
            const chunkWords = words.slice(start, end);
            if (chunkWords.length < 15) {
                continue;
            }

            output.push({
                text: chunkWords.join(' '),
                startWord: start,
                endWord: end,
            });

            if (end >= words.length) {
                break;
            }
        }

        return output;
    }

    // ── Cache ────────────────────────────────────────────────────────

    private getCacheFilePath(relativePath: string): string {
        const baseName = relativePath.replace(/\//g, '__');
        return path.join(this.cacheDir, `${baseName}.json`);
    }

    private async saveCachedChunks(relativePath: string, fileChunks: IndexedChunk[]): Promise<void> {
        await fs.mkdir(this.cacheDir, { recursive: true });
        const cachePath = this.getCacheFilePath(relativePath);
        await fs.writeFile(cachePath, JSON.stringify(fileChunks, null, 2), 'utf-8');
    }

    private async loadCachedChunks(relativePath: string, sourceModifiedMs: number): Promise<IndexedChunk[] | null> {
        const cachePath = this.getCacheFilePath(relativePath);
        try {
            const cacheStat = await fs.stat(cachePath);
            if (cacheStat.mtimeMs < sourceModifiedMs) {
                return null; // cache is stale
            }

            const raw = await fs.readFile(cachePath, 'utf-8');
            const parsed = JSON.parse(raw) as IndexedChunk[];
            if (!Array.isArray(parsed) || parsed.length === 0) {
                return null;
            }

            return parsed;
        } catch {
            return null; // cache file doesn't exist or is invalid
        }
    }

    // ── Index building ───────────────────────────────────────────────

    /**
     * Index an array of pre-loaded documents.
     *
     * File discovery and reading is the caller's responsibility - the
     * indexer only cares about the text content, a relative path for
     * identification / caching, and the source modification time.
     */
    async indexDocuments(documents: DocumentInput[]): Promise<void> {
        const log = new Logger('indexer');
        log.header('Documentation Indexer');
        log.info(`Received ${documents.length} document(s) to index`);

        for (const doc of documents) {
            log.stat('  File', doc.relativePath);
        }

        const nextChunks: IndexedChunk[] = [];
        let cachedCount = 0;
        const startTime = Date.now();

        for (const [fileIdx, doc] of documents.entries()) {
            // Try loading from cache first
            const cached = await this.loadCachedChunks(doc.relativePath, doc.sourceModifiedMs);
            if (cached) {
                nextChunks.push(...cached);
                cachedCount += 1;
                log.step(fileIdx + 1, documents.length, `Loaded ${doc.relativePath} from cache → ${cached.length} chunk(s)`);
                continue;
            }

            // No valid cache - chunk and embed from provided text
            const fileChunks = this.chunkText(doc.text);
            const fileIndexedChunks: IndexedChunk[] = [];

            for (const [chunkIndex, chunk] of fileChunks.entries()) {
                const embedding = await this.embedText(chunk.text);
                const indexedChunk: IndexedChunk = {
                    id: `${doc.relativePath}::${chunkIndex}`,
                    filePath: doc.relativePath,
                    chunkIndex,
                    startWord: chunk.startWord,
                    endWord: chunk.endWord,
                    text: chunk.text,
                    embedding,
                };
                fileIndexedChunks.push(indexedChunk);
            }

            nextChunks.push(...fileIndexedChunks);

            // Save to cache
            await this.saveCachedChunks(doc.relativePath, fileIndexedChunks);

            log.step(fileIdx + 1, documents.length, `Indexed ${doc.relativePath} → ${fileChunks.length} chunk(s), saved to cache`);
        }

        this.chunks = nextChunks;
        this._indexedFileCount = documents.length;
        this._lastIndexedAt = new Date().toISOString();
        const elapsed = Date.now() - startTime;

        log.success('Indexing complete!');
        log.stat('Files indexed', this._indexedFileCount);
        log.stat('Loaded from cache', cachedCount);
        log.stat('Freshly embedded', this._indexedFileCount - cachedCount);
        log.stat('Total chunks', this.chunks.length);
        log.stat('Embedding model', this.embeddingModel);
        log.stat('Cache directory', this.cacheDir);
        log.stat('Duration', elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(2)}s`);
    }
    /**
     * Re-index a single document and merge it into the existing index.
     * Used for adding new documentation files without full re-indexing.
     */
    async reindexDocument(doc: DocumentInput): Promise<void> {
        const log = new Logger('indexer');

        // Remove any existing chunks for this document
        this.chunks = this.chunks.filter(chunk => chunk.filePath !== doc.relativePath);

        // Check cache first
        const cached = await this.loadCachedChunks(doc.relativePath, doc.sourceModifiedMs);
        if (cached) {
            this.chunks.push(...cached);
            log.info(`Loaded ${doc.relativePath} from cache → ${cached.length} chunk(s)`);
            this._indexedFileCount = new Set(this.chunks.map(c => c.filePath)).size;
            this._lastIndexedAt = new Date().toISOString();
            return;
        }

        // Chunk and embed the document
        const fileChunks = this.chunkText(doc.text);
        const fileIndexedChunks: IndexedChunk[] = [];

        for (const [chunkIndex, chunk] of fileChunks.entries()) {
            const embedding = await this.embedText(chunk.text);
            const indexedChunk: IndexedChunk = {
                id: `${doc.relativePath}::${chunkIndex}`,
                filePath: doc.relativePath,
                chunkIndex,
                startWord: chunk.startWord,
                endWord: chunk.endWord,
                text: chunk.text,
                embedding,
            };
            fileIndexedChunks.push(indexedChunk);
        }

        this.chunks.push(...fileIndexedChunks);

        // Save to cache
        await this.saveCachedChunks(doc.relativePath, fileIndexedChunks);

        this._indexedFileCount = new Set(this.chunks.map(c => c.filePath)).size;
        this._lastIndexedAt = new Date().toISOString();

        log.success(`Indexed ${doc.relativePath} → ${fileChunks.length} chunk(s), saved to cache`);
    }
    // ── Search ───────────────────────────────────────────────────────

    /**
     * Perform a semantic search over the indexed chunks.
     *
     * @returns Ranked results above the minimum score threshold.
     */
    async search(query: string, topK = 5, minScore = 0.2): Promise<SearchResult[]> {
        if (this.chunks.length === 0) {
            return [];
        }

        const queryEmbedding = await this.embedText(query);
        const safeTopK = Math.max(1, Math.min(50, topK));
        const safeMinScore = Math.max(0, Math.min(1, minScore));

        return this.chunks
            .map((chunk) => ({
                score: cosineSimilarity(queryEmbedding, chunk.embedding),
                filePath: chunk.filePath,
                chunkIndex: chunk.chunkIndex,
                wordRange: `${chunk.startWord}-${chunk.endWord}`,
                text: chunk.text,
            }))
            .filter((item) => item.score >= safeMinScore)
            .sort((left, right) => right.score - left.score)
            .slice(0, safeTopK)
            .map((item) => ({
                ...item,
                score: Number(item.score.toFixed(4)),
            }));
    }
}
