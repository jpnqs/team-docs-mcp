# Team Documentation Guidelines

## Overview

Team documentation should be clear, searchable, and maintainable. Follow these guidelines when creating new documentation files.

## File Naming Conventions

- **Use lowercase with hyphens**: `deployment-guide.md`, `api-conventions.md`
- **Be descriptive**: Names should clearly indicate the content
- **Always use .md extension**: All documentation must be Markdown files
- **Avoid special characters**: Stick to alphanumeric characters and hyphens

## Document Structure

### Required Sections

Every documentation file should include:

1. **Title (H1)**: A clear, concise title at the top

   ```markdown
   # Deployment Guide
   ```

2. **Overview**: Brief description of what the document covers (2-3 sentences)

3. **Main Content**: Organized with clear headings (H2, H3)

4. **Examples**: Include practical examples where applicable

### Recommended Sections (as appropriate)

- **Prerequisites**: What's needed before following the guide
- **Step-by-Step Instructions**: Numbered lists for processes
- **Troubleshooting**: Common issues and solutions
- **Related Documentation**: Links to other relevant docs
- **Last Updated**: Date of last significant update

## Formatting Guidelines

### Headings

- Use ATX-style headings (`#` syntax)
- One H1 per document (the title)
- Use H2 for major sections
- Use H3 and H4 for subsections
- Leave a blank line before and after headings

### Code Blocks

Always specify the language for syntax highlighting:

````markdown
```typescript
export function example() {
  return "code here";
}
```
````

````

### Lists

- **Unordered lists**: Use `-` for consistency
- **Ordered lists**: Use `1.`, `2.`, etc.
- Indent nested lists with 2 spaces

### Links

- Use descriptive link text: `[deployment guide](deployment-guide.md)`
- Link to other docs using relative paths
- Use absolute URLs for external resources

### Emphasis

- **Bold** (`**text**`): For important terms, actions, or UI elements
- *Italic* (`*text*`): For emphasis or introducing new terms
- `Code` (`` `code` ``): For inline code, filenames, or commands

### Tables

Use tables for structured data:

```markdown
| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |
````

## Content Guidelines

### Writing Style

- **Be concise**: Get to the point quickly
- **Use active voice**: "Run the command" vs "The command should be run"
- **Write for searchability**: Include terms users might search for
- **Be specific**: Avoid vague descriptions

### Technical Content

- **Include context**: Explain _why_, not just _how_
- **Provide examples**: Real-world examples help understanding
- **Keep it current**: Update docs when processes change
- **Test instructions**: Ensure all steps actually work

### Organization

- **Group related content**: Keep similar topics together
- **Use consistent terminology**: Don't alternate between synonyms
- **Create separate docs for distinct topics**: Don't cram everything into one file
- **Use subfolders for categories**: Organize related docs in subdirectories

## Subfolder Structure

Organize documentation into logical subfolders:

- `guides/` - How-to guides and tutorials
- `api/` - API documentation and references
- `processes/` - Team processes and workflows
- `troubleshooting/` - Problem-solving and debugging guides
- `architecture/` - System design and architecture docs

## Searchability Tips

To make documentation easily discoverable through semantic search:

1. **Include common questions**: Write sections that answer likely questions
2. **Use natural language**: Write how people talk about the topic
3. **Add synonyms**: Mention alternative terms users might search for
4. **Create comprehensive content**: More context helps search accuracy
5. **Use descriptive headings**: Headings are weighted in search

## Maintenance

- **Review regularly**: Check docs quarterly for accuracy
- **Update after changes**: Modify docs when processes change
- **Archive outdated content**: Move obsolete docs to an `archive/` folder
- **Add last-updated dates**: Help readers assess freshness

## Examples

### Good Document Title and Opening

```markdown
# Database Migration Guide

This guide explains how to create, test, and deploy database migrations in our application. It covers both development and production environments.

## Prerequisites

- Access to the database
- Installed migration tool (`migrate-cli`)
- Understanding of SQL
```

### Good Step-by-Step Instructions

````markdown
## Running a Migration

1. **Create the migration file**:
   ```bash
   npm run migration:create -- add-user-roles
   ```
````

2. **Edit the migration** in `migrations/YYYYMMDD_add-user-roles.sql`

3. **Test locally**:

   ```bash
   npm run migration:up
   ```

4. **Verify the changes** in your local database

````

## Using the save-documentation Tool

When you're ready to save your documentation:

```json
{
  "filename": "my-guide.md",
  "content": "# My Guide\n\nContent here...",
  "subfolder": "guides"
}
````

The file will be automatically indexed for semantic search after saving.
