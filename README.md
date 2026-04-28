# team-docs-mcp

An [MCP](https://modelcontextprotocol.io/) (Model Context Protocol) server for **team documentation and knowledge bases**. It provides semantic search over your team's documentation, guidelines, best practices, and frequently-used information - all accessible as MCP tools through Claude and other MCP clients.

## Features

- **`search-documentation`** - Semantic similarity search over your team's documentation in the `docs/` folder
- **`list-indexed-files`** - Get a list of all indexed documentation files
- **`get-document-content`** - Read the full content of any documentation file
- **`get-documentation-guidelines`** - Get guidelines for creating well-structured documentation
- **`save-documentation`** - Save new documentation files and automatically index them
- **Local embeddings** - Uses [`@xenova/transformers`](https://github.com/xenova/transformers.js) for local semantic search - no external API calls required
- **Intelligent caching** - Embeddings are cached and only recomputed when documents change
- **Flexible configuration** - Customize chunk sizes, file types, and embedding models
- **Clean TypeScript architecture** - Easy to understand and extend

Perfect for making your team's knowledge searchable through AI assistants!

## Installation

```bash
git clone <repo-url> team-docs-mcp
cd team-docs-mcp
npm install
```

## Quick Start

1. Add your documentation files to the `docs/` folder (Markdown, text, JSON, HTML, CSV, etc.)
2. Run the server: `npm start`
3. Configure your MCP client to use this server
4. Start asking questions about your team's documentation!

## Configuration

All settings have sensible defaults and work out of the box. To customise, copy the example file and edit as needed:

```bash
cp .env.example .env
```

Every variable uses the `TEAM_DOCS_MCP_` prefix to avoid collisions:

| Variable                            | Default                          | Description                                |
| ----------------------------------- | -------------------------------- | ------------------------------------------ |
| `TEAM_DOCS_MCP_DOCS_DIR`            | `./docs`                         | Directory containing documents to index    |
| `TEAM_DOCS_MCP_INDEXED_DIR`         | `./docs/.cache`                  | Cache directory for computed embeddings    |
| `TEAM_DOCS_MCP_EMBEDDING_MODEL`     | `Xenova/all-MiniLM-L6-v2`        | Sentence-transformer model (ONNX)          |
| `TEAM_DOCS_MCP_ALLOWED_EXTENSIONS`  | `.md,.txt,.json,.html,.htm,.csv` | Comma-separated file extensions to include |
| `TEAM_DOCS_MCP_MAX_FILE_SIZE_BYTES` | `20971520` (20 MB)               | Files larger than this are skipped         |
| `TEAM_DOCS_MCP_CHUNK_SIZE_WORDS`    | `220`                            | Number of words per text chunk             |
| `TEAM_DOCS_MCP_CHUNK_OVERLAP_WORDS` | `40`                             | Word overlap between consecutive chunks    |

## Adding Documentation

Place your documentation files in the `docs/` directory:

```
docs/
  coding-standards.md
  deployment-guide.md
  api-conventions.md
  troubleshooting-tips.md
  team-processes.md
```

The server indexes all documents at startup. Embeddings are cached in `docs/.cache/` and only recomputed when the source file changes. **Restart the server after adding or updating documents.**

## Running

```bash
npm run start
```

### MCP Inspector

To test the tool interactively with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npm run inspect
```

## MCP Tools

### `search-documentation`

Semantic similarity search over indexed documents from the `docs/` folder.

| Parameter  | Type   | Required | Default | Description                               |
| ---------- | ------ | -------- | ------- | ----------------------------------------- |
| `query`    | string | ✅       | -       | Natural language search query             |
| `topK`     | number | -        | `5`     | Maximum number of results to return       |
| `minScore` | number | -        | `0.2`   | Minimum cosine similarity threshold (0–1) |

**Example queries:**

- "How do we handle database migrations?"
- "What are our coding standards for error handling?"
- "How to deploy to production?"
- "API authentication best practices"

### `list-indexed-files`

Get a list of all documentation files that have been indexed and are available for semantic search.

No parameters required.

**Returns:**

- List of indexed file paths
- Total file count
- Total chunk count
- Last indexing timestamp

### `get-document-content`

Read the complete content of a specific documentation file.

| Parameter  | Type   | Required | Description                                                    |
| ---------- | ------ | -------- | -------------------------------------------------------------- |
| `filePath` | string | ✅       | Relative path to the file (e.g., "guides/observer-pattern.md") |

**Returns:** Full content of the specified documentation file.

### `get-documentation-guidelines`

Get comprehensive guidelines for creating and formatting team documentation.

No parameters required.

**Returns:** Detailed guidelines covering file naming, structure, formatting, and best practices.

### `save-documentation`

Save a new documentation file to the docs folder. The file is automatically indexed for semantic search.

| Parameter   | Type   | Required | Description                                      |
| ----------- | ------ | -------- | ------------------------------------------------ |
| `filename`  | string | ✅       | Name of the markdown file (must end with .md)    |
| `content`   | string | ✅       | Markdown content to save                         |
| `subfolder` | string | -        | Optional subfolder within docs/ (e.g., "guides") |

**Returns:** Confirmation of saved file path and indexing status.

## Project Structure

```
server.ts                              # Entry point - wiring & startup
src/
  config.ts                            # Centralised configuration (env overrides)
  tool.ts                              # Abstract Tool<TInput> base class
  file-indexer.ts                      # Chunking, embedding, caching & search
  document-loader.ts                   # File discovery & reading
  logger.ts                            # Logging utility
  tools/
    search-documentation.ts            # Semantic search tool
    list-indexed-files.ts              # List all indexed files
    get-document-content.ts            # Read full file content
    get-documentation-guidelines.ts    # Get documentation guidelines
    save-documentation.ts              # Save and index new documentation
assets/
  documentation-guidelines.md          # Guidelines for creating documentation
docs/                                  # Your team's documentation (add files here!)
  .cache/                              # Cached embeddings (auto-generated)
```

## How It Works

1. **Startup**: `DocumentLoader` scans `docs/` for supported files
2. **Chunking**: `FileIndexer` splits each document into overlapping word chunks
3. **Embedding**: Each chunk is embedded using a local sentence-transformer model (runs via ONNX)
4. **Caching**: Embeddings are saved to `docs/.cache/` - unchanged files are skipped on restart
5. **Search**: When `search-documentation` is called, the query is embedded and ranked against all chunks by cosine similarity

## Use Cases

- **Onboarding**: Help new team members quickly find answers to common questions
- **Best Practices**: Make coding standards, conventions, and guidelines easily searchable
- **Troubleshooting**: Quick access to debugging guides and known issues
- **Process Documentation**: Find information about deployment, testing, and development workflows
- **API Documentation**: Search through API specs, usage examples, and integration guides
- **Institutional Knowledge**: Preserve and make searchable team decisions, architecture notes, and meeting summaries

## Configuring with Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "team-docs": {
      "command": "npx",
      "args": ["-y", "tsx", "/absolute/path/to/team-docs-mcp/server.ts"]
    }
  }
}
```

Restart Claude Desktop after updating the configuration.

## Sample Instructions for Copilot

To get the best results when using this MCP server with GitHub Copilot, create an instructions file:

`.github/copilot-instructions.md`

```markdown
# Team Docs MCP Server - Copilot Instructions

MCP server for team documentation and knowledge base. Provides semantic search over local docs.

## Tool Usage

Use the `search-documentation` tool to answer questions about:

- Team processes and workflows
- Coding standards and conventions
- Deployment and infrastructure
- API documentation and examples
- Troubleshooting guides
- Best practices and guidelines

Always search the documentation before making assumptions about team practices or standards.
```

## Extending the Server

The codebase is designed to be simple and extensible:

- **Add new tools**: Create new tool classes in `src/tools/` extending the `Tool` base class
- **Customize chunking**: Modify `FileIndexer` to change how documents are split
- **Different embedding models**: Change `EMBEDDING_MODEL` in config to use other sentence-transformers
- **Custom file types**: Add parsers in `DocumentLoader` for additional file formats

## License

MIT
