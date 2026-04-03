import path from 'node:path';

// ── Helpers ──────────────────────────────────────────────────────────

function envInt(key: string, fallback: number): number {
    const raw = process.env[key];
    if (raw === undefined || raw === '') {
        return fallback;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function envString(key: string, fallback: string): string {
    const raw = process.env[key];
    return raw !== undefined && raw !== '' ? raw : fallback;
}

function envSet(key: string, fallback: Set<string>): Set<string> {
    const raw = process.env[key];
    if (raw === undefined || raw === '') {
        return fallback;
    }

    return new Set(
        raw.split(',').map((s) => s.trim()).filter(Boolean),
    );
}

// ── Default values ───────────────────────────────────────────────────

const DEFAULT_DOCS_DIR = path.resolve(process.cwd(), 'docs');
const DEFAULT_EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const DEFAULT_ALLOWED_EXTENSIONS = new Set(['.md', '.txt', '.json', '.html', '.htm', '.csv']);
const DEFAULT_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
const DEFAULT_CHUNK_SIZE_WORDS = 220;
const DEFAULT_CHUNK_OVERLAP_WORDS = 40;

// ── Exported config ──────────────────────────────────────────────────

const PREFIX = 'TEAM_DOCS_MCP_';

/** Resolved docs directory. Override with `TEAM_DOCS_MCP_DOCS_DIR`. */
export const DOCS_DIR = envString(`${PREFIX}DOCS_DIR`, DEFAULT_DOCS_DIR);

/** Directory where cached embeddings are stored. Override with `TEAM_DOCS_MCP_INDEXED_DIR`. */
export const INDEXED_DIR = envString(`${PREFIX}INDEXED_DIR`, path.join(DOCS_DIR, '.cache'));

/** Sentence-transformer model identifier. Override with `TEAM_DOCS_MCP_EMBEDDING_MODEL`. */
export const EMBEDDING_MODEL = envString(`${PREFIX}EMBEDDING_MODEL`, DEFAULT_EMBEDDING_MODEL);

/** Comma-separated list of allowed file extensions. Override with `TEAM_DOCS_MCP_ALLOWED_EXTENSIONS`. */
export const ALLOWED_EXTENSIONS = envSet(`${PREFIX}ALLOWED_EXTENSIONS`, DEFAULT_ALLOWED_EXTENSIONS);

/** Maximum document file size in bytes. Override with `TEAM_DOCS_MCP_MAX_FILE_SIZE_BYTES`. */
export const MAX_FILE_SIZE_BYTES = envInt(`${PREFIX}MAX_FILE_SIZE_BYTES`, DEFAULT_MAX_FILE_SIZE_BYTES);

/** Number of words per chunk. Override with `TEAM_DOCS_MCP_CHUNK_SIZE_WORDS`. */
export const CHUNK_SIZE_WORDS = envInt(`${PREFIX}CHUNK_SIZE_WORDS`, DEFAULT_CHUNK_SIZE_WORDS);

/** Overlap between consecutive chunks in words. Override with `TEAM_DOCS_MCP_CHUNK_OVERLAP_WORDS`. */
export const CHUNK_OVERLAP_WORDS = envInt(`${PREFIX}CHUNK_OVERLAP_WORDS`, DEFAULT_CHUNK_OVERLAP_WORDS);
