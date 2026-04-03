# Deployment Guide

## Environments

We maintain three environments:

- **Development** (`dev`) - For active development and testing
- **Staging** (`staging`) - Pre-production environment for final validation
- **Production** (`prod`) - Live environment serving customers

## Deployment Process

### Prerequisites

1. All tests must pass
2. Code review approved
3. Changes merged to `main` branch
4. Release notes prepared

### Steps

#### 1. Prepare Release

```bash
# Update version
npm version patch  # or minor/major

# Create release tag
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

#### 2. Deploy to Staging

```bash
# Deploy using CI/CD
npm run deploy:staging

# Or manual deployment
./scripts/deploy.sh staging
```

#### 3. Validate Staging

- Run smoke tests
- Verify critical user flows
- Check monitoring dashboards
- Review error logs

#### 4. Deploy to Production

```bash
# Production deployment requires approval
npm run deploy:production

# Monitor deployment
npm run monitor:deployment
```

#### 5. Post-Deployment

- Monitor error rates
- Check performance metrics
- Verify key features working
- Update status page if needed

## Rollback Procedure

If issues are detected:

```bash
# Immediate rollback
npm run rollback:production

# Or specify version
npm run rollback:production -- --to=v1.2.2
```

## Environment Variables

### Required Variables

| Variable       | Description                | Example                  |
| -------------- | -------------------------- | ------------------------ |
| `DATABASE_URL` | Database connection string | `postgresql://...`       |
| `API_KEY`      | External API key           | `sk_live_...`            |
| `JWT_SECRET`   | Secret for JWT signing     | `random-secret-string`   |
| `LOG_LEVEL`    | Logging verbosity          | `info`, `debug`, `error` |

### Setting Variables

**Staging:**

```bash
heroku config:set API_KEY=xxx --app myapp-staging
```

**Production:**

```bash
heroku config:set API_KEY=xxx --app myapp-prod
```

## Database Migrations

### Running Migrations

**Staging:**

```bash
npm run migrate:staging
```

**Production:**

```bash
# Always backup first!
npm run backup:database
npm run migrate:production
```

### Migration Best Practices

- Always test migrations in staging first
- Create rollback scripts for destructive changes
- Avoid breaking changes when possible
- Run migrations during low-traffic periods

## Monitoring

### Key Metrics to Watch

- **Response Time**: Should be < 200ms for p95
- **Error Rate**: Should be < 1%
- **CPU Usage**: Should be < 70%
- **Memory Usage**: Should be < 80%

### Alerts

Critical alerts are sent to #alerts Slack channel:

- Production errors spike
- API downtime
- Database connection issues
- High memory usage

## Troubleshooting

### Common Issues

**Deployment Hangs**

```bash
# Check deployment status
heroku ps --app myapp-prod

# Restart dynos if needed
heroku restart --app myapp-prod
```

**Database Connection Errors**

```bash
# Verify connection string
heroku config:get DATABASE_URL --app myapp-prod

# Check database status
heroku pg:info --app myapp-prod
```

**Performance Degradation**

```bash
# Scale up dynos temporarily
heroku ps:scale web=3 --app myapp-prod

# Check for slow queries
npm run analyze:queries
```
