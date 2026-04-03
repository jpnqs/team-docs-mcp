# Development Environment Setup

## Prerequisites

Before setting up the development environment, ensure you have:

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git** 2.x or higher
- **PostgreSQL** 14.x or higher (for local development)
- **VS Code** (recommended) or your preferred IDE

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourteam/project.git
cd project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your local settings:

```env
# Database
DATABASE_URL=postgresql://localhost:5432/myapp_dev
DATABASE_POOL_SIZE=10

# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your-local-secret-key
JWT_EXPIRY=15m

# External APIs
STRIPE_API_KEY=sk_test_...
SENDGRID_API_KEY=SG....

# Logging
LOG_LEVEL=debug
```

### 4. Database Setup

Create local database:

```bash
createdb myapp_dev
```

Run migrations:

```bash
npm run db:migrate
```

Seed development data:

```bash
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:3000`.

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

### Type Checking

```bash
# Run TypeScript type checking
npm run type-check
```

### Database Commands

```bash
# Create new migration
npm run db:migration:create -- migration-name

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback

# Reset database (caution!)
npm run db:reset
```

## IDE Setup

### VS Code Extensions

Install these recommended extensions:

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **GitLens** - Git integration
- **PostgreSQL** - Database management
- **REST Client** - API testing
- **Error Lens** - Inline error display

### VS Code Settings

The repository includes `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Debugging

Launch configuration (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL (macOS)
brew services restart postgresql

# Restart PostgreSQL (Linux)
sudo systemctl restart postgresql
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache

# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

## Docker Setup (Alternative)

For a containerized development environment:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose up -d --build
```

## Git Workflow

### Branch Naming

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Urgent production fixes
- `refactor/` - Code refactoring

Example: `feature/user-authentication`

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:

```
feat(auth): add JWT token refresh

Implement automatic token refresh when access token expires.
Refresh tokens are valid for 7 days.

Closes #123
```

### Pre-commit Hooks

The repository uses Husky for git hooks:

- **pre-commit**: Runs linter and formatter
- **commit-msg**: Validates commit message format
- **pre-push**: Runs tests

## Getting Help

- Check the [README.md](../README.md) for project overview
- Review [API Conventions](./api-conventions.md) for API guidelines
- Read [Coding Standards](./coding-standards.md) for code style
- Ask in #dev-help Slack channel
- Check existing GitHub issues

## Next Steps

After setup, review:

1. [Coding Standards](./coding-standards.md)
2. [API Conventions](./api-conventions.md)
3. [Testing Guide](./testing-guide.md)
4. [Deployment Guide](./deployment-guide.md)
