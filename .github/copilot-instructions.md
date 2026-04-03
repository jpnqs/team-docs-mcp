# Team Docs MCP Server - Copilot Instructions

MCP server for team documentation and knowledge base. TypeScript, strict mode, stdio transport.

Documentation indexed from `docs/` at startup via semantic embeddings using local transformer models.

## Tool Usage

The server provides one primary tool:

| Tool                   | Purpose                                                                                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search-documentation` | Semantic search over team documentation. Use for finding team processes, coding standards, best practices, guides, troubleshooting tips, API docs, and any other knowledge in the docs/ folder. |

## When to Use

Always use the `search-documentation` tool when:

- User asks about team processes, workflows, or procedures
- Questions about coding standards, conventions, or style guides
- Looking for deployment, infrastructure, or operational guides
- Seeking troubleshooting steps or debugging information
- Need API documentation, usage examples, or integration patterns
- Asking about best practices or guidelines
- Any question that might be answered by team documentation

## Best Practices

1. **Always search first** - Don't assume or guess about team-specific practices
2. **Be specific** - Phrase queries as natural questions matching likely documentation language
3. **Check results** - Review the returned chunks for relevance before answering
4. **Adjust as needed** - If first search doesn't find good results, try rephrasing the query
5. **Top results matter most** - Focus on highest-scoring results for most relevant information

## Example Queries

Good query examples:

- "How do we handle database migrations?"
- "What are the deployment steps for production?"
- "API authentication best practices"
- "Error handling conventions"
- "How to set up the development environment?"
