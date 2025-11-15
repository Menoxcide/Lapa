# Deployment Guide

This guide explains how to deploy the LAPA project using the integrated deployment workflow with GitHub operations.

## Overview

The deployment system uses:
- **DEPLOYMENT_WORKFLOW**: Orchestrates the deployment process through multiple agent stages
- **GITHUB_OPERATIONS**: Handles all GitHub-related operations (branches, tags, PRs, workflows)

## Deployment Workflow

The deployment follows this agent chain:

1. **VALIDATOR** - Pre-deployment validation
   - Validates configurations
   - Verifies system state
   - Checks compliance requirements
   - Validates dependencies
   - Verifies data integrity
   - Checks security compliance

2. **TEST** - Pre-deployment testing
   - Runs full test suite
   - Verifies all tests passing
   - Checks test coverage
   - Runs integration tests
   - Verifies no regressions
   - Runs smoke tests

3. **REVIEWER** - Deployment review
   - Reviews deployment readiness
   - Checks code quality
   - Verifies security
   - Reviews documentation
   - Checks rollback plan
   - Approves deployment

4. **DEPLOYER** - Deployment execution
   - Prepares deployment environment
   - Executes deployment
   - Monitors deployment process
   - Verifies deployment success
   - Runs post-deployment checks
   - Documents deployment

5. **INTEGRATOR** - Post-deployment integration check
   - Verifies integration health
   - Checks system connections
   - Monitors integration status
   - Verifies no integration issues
   - Documents integration status

## GitHub Operations

The GITHUB_OPERATIONS agent handles:

- **Branch Management**: Creates deployment branches (`deploy/staging-v1.0.0`, `deploy/production-v1.0.0`)
- **Tagging**: Creates version tags (`v1.0.0`)
- **Pull Requests**: Creates PRs for staging deployments
- **GitHub Actions**: Monitors workflow status
- **Commits**: Uses conventional commit format

## Usage

### Basic Deployment

Deploy to production:
```bash
npm run deploy:production
```

Deploy to staging:
```bash
npm run deploy:staging
```

Deploy with custom version:
```bash
npm run deploy production 1.2.3
```

Deploy without GitHub operations (local only):
```bash
npm run deploy:skip-github
```

### Direct Script Usage

```bash
# Production deployment
tsx scripts/deploy-with-github.ts production

# Staging deployment
tsx scripts/deploy-with-github.ts staging

# Custom version
tsx scripts/deploy-with-github.ts production 1.2.3

# Skip GitHub operations
tsx scripts/deploy-with-github.ts production --skip-github
```

## Prerequisites

1. **Git Repository**: Must be in a git repository
2. **GitHub CLI** (optional): For automated PR creation and workflow checks
   - Install: `brew install gh` (macOS) or `winget install GitHub.cli` (Windows)
   - Authenticate: `gh auth login`

3. **Node.js**: v18+ required
4. **Dependencies**: All npm dependencies installed (`npm install`)

## Deployment Process

### Step 1: Pre-Deployment

The system automatically:
- Creates a deployment branch (`deploy/{environment}-{version}`)
- Initializes GITHUB_OPERATIONS agent
- Prepares deployment context

### Step 2: Deployment Workflow

Executes the full agent chain:
- VALIDATOR → TEST → REVIEWER → DEPLOYER → INTEGRATOR

Each step has quality gates that must pass before proceeding.

### Step 3: GitHub Operations

After successful deployment:
- Commits changes with conventional commit format
- Pushes deployment branch
- Creates version tag
- Pushes tag to remote
- Creates PR (for staging deployments)
- Checks GitHub Actions status

### Step 4: Completion

The deployment completes with:
- Summary report
- Execution path
- Duration metrics
- Branch and tag information

## Quality Gates

Each step in the deployment workflow has quality gates:

- **VALIDATOR**: All validations must pass
- **TEST**: All tests must pass, coverage must be adequate
- **REVIEWER**: Deployment must be approved
- **DEPLOYER**: Deployment must be successful
- **INTEGRATOR**: Integration must be healthy

If any quality gate fails, the deployment stops and reports errors.

## Rollback Plan

The deployment includes a rollback plan:
- If deployment fails, rollback to previous version
- Use: `git checkout <previous-tag>`
- The rollback plan is included in the deployment context

## Environment Configuration

### Staging

- Creates PR for review
- Deploys to staging environment
- Tag: `v{version}`
- Branch: `deploy/staging-{version}`

### Production

- Direct deployment (no PR)
- Deploys to production environment
- Tag: `v{version}`
- Branch: `deploy/production-{version}`

## Troubleshooting

### Deployment Fails at VALIDATOR

- Check configuration files
- Verify system state
- Check compliance requirements
- Validate dependencies

### Deployment Fails at TEST

- Run tests manually: `npm test`
- Check test coverage: `npm run test:coverage`
- Fix failing tests
- Verify integration tests

### Deployment Fails at REVIEWER

- Review code quality issues
- Fix security vulnerabilities
- Update documentation
- Verify rollback plan

### Deployment Fails at DEPLOYER

- Check deployment environment
- Verify deployment configuration
- Check deployment logs
- Review post-deployment checks

### Deployment Fails at INTEGRATOR

- Check integration health
- Verify system connections
- Review integration logs
- Check integration status

### GitHub Operations Fail

- Verify git repository is initialized
- Check GitHub CLI is installed and authenticated
- Verify branch permissions
- Check network connectivity

## Best Practices

1. **Always test in staging first**: Deploy to staging before production
2. **Use semantic versioning**: Follow `MAJOR.MINOR.PATCH` format
3. **Review PRs**: Always review staging PRs before merging
4. **Monitor deployments**: Watch deployment logs and metrics
5. **Keep rollback plan ready**: Always have a rollback plan
6. **Use conventional commits**: Follow conventional commit format
7. **Tag releases**: Always tag production releases
8. **Document changes**: Update CHANGELOG.md with deployment notes

## Integration with CI/CD

The deployment script can be integrated with CI/CD pipelines:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]
      version:
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: npm run deploy ${{ inputs.environment }} ${{ inputs.version }}
```

## Monitoring

After deployment, monitor:
- Application health
- Integration status
- Error rates
- Performance metrics
- GitHub Actions workflows

## Support

For issues or questions:
- Check [DEPLOYMENT_WORKFLOW.md](workflows/DEPLOYMENT_WORKFLOW.md) for workflow details
- Check [GITHUB_OPERATIONS_PERSONA.md](personas/GITHUB_OPERATIONS_PERSONA.md) for GitHub operations
- Review deployment logs
- Check GitHub Actions logs

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0.0

