# LAPA Core Documentation

## Table of Contents
1. [Installation Guide](#installation-guide)
2. [NVIDIA NIM Configuration](#nvidia-nim-configuration)
3. [Model Selection Guide](#model-selection-guide)
4. [Account Management System](#account-management-system)
5. [Testing Guide](#testing-guide)
6. [Troubleshooting](#troubleshooting)

---

## Installation Guide

### Prerequisites
- **NVIDIA RTX GPU** (3060 or better recommended)
- **Docker Desktop** (for local NIM deployment)
- **Cursor IDE** (v1.0.0 or later)

### Step-by-Step Setup

#### 1. Install NVIDIA NIM Docker Container

**Option A: Automated Setup (Recommended)**
```bash
# From the lapa-core directory
npm run setup:nim
```

**Option B: Manual Docker Setup**
```bash
# Pull the NVIDIA NIM image
docker pull nvcr.io/nim:latest

# Start the NIM container
docker run -d --name lapa-nim -p 8000:8000 nvcr.io/nim:latest

# Verify NIM is running
docker ps
curl http://localhost:8000/health
```

#### 2. Install LAPA Extension in Cursor

**Method 1: Development Mode**
```bash
# Clone the repository
git clone https://github.com/lapa-ai/lapa.git
cd lapa/lapa-core

# Open in Cursor for extension development
cursor --extensionDevelopmentPath=.
```

**Method 2: Production Installation**
1. Download the `.vsix` extension file from [lapa.ai](https://lapa.ai)
2. In Cursor: `View → Command Palette → Extensions: Install from VSIX`
3. Select the downloaded `.vsix` file

#### 3. Activate LAPA Swarm
1. Open Cursor IDE
2. Click the **LAPA Swarm** icon in the activity bar
3. Click **"Start LAPA Swarm"** to begin your first autonomous coding session

---

## NVIDIA NIM Configuration

### Local NIM Setup

LAPA supports two NVIDIA NIM deployment modes:

#### Local Deployment (Free Tier)
- Runs entirely on your GPU
- No internet connection required
- Full privacy and data sovereignty

**Configuration File**: [`src/inference/nim.local.ts`](lapa-core/src/inference/nim.local.ts:1)

```typescript
// Default configuration
const NIM_DOCKER_IMAGE = 'nvcr.io/nim:latest';
const NIM_CONTAINER_NAME = 'lapa-nim';
const NIM_PORT = 8000;
```

**Start/Stop Commands**:
```typescript
import { startNIMContainer, stopNIMContainer } from './nim.local';

// Start NIM
await startNIMContainer();

// Stop NIM  
await stopNIMContainer();
```

#### Cloud NIM Setup (Premium Tier)
- Scalable cloud inference
- Access to larger models
- Enterprise-grade reliability

**Configuration File**: [`src/premium/cloud-nim.integration.ts`](lapa-core/src/premium/cloud-nim.integration.ts:1)

```typescript
// Environment variables required
process.env.CLOUD_NIM_API_KEY = 'your-api-key';
process.env.CLOUD_NIM_API_BASE = 'https://api.nim.cloud';
process.env.CLOUD_NIM_DEFAULT_MODEL = 'llama3-70b';
```

### Health Checking
```typescript
import { isNIMAvailable } from './nim.local';
import { cloudNIMIntegration } from './premium/cloud-nim.integration';

// Check local NIM
const localAvailable = await isNIMAvailable();

// Check cloud NIM  
const cloudHealthy = await cloudNIMIntegration.checkHealth();
```

---

## Model Selection Guide

LAPA uses Mixture of Experts (MoE) routing to select the best model for each task:

### Free Tier Models (2 Agents)
| Agent Role | Recommended Model | Use Case |
|------------|------------------|----------|
| **Coder** | `DeepSeek-Coder-V2` | Code generation and refactoring |
| **Reviewer** | `Mixtral-8x22B` | Code review and quality assurance |

### Premium Tier Models (5+ Agents)
| Agent Role | Recommended Model | Specialization |
|------------|------------------|---------------|
| **Architect** | `Nemotron-4-340B` | System design and planning |
| **Researcher** | `Gemma-2-27B` | Code search and documentation |
| **Coder** | `DeepSeek-Coder-V2` | Implementation and refactoring |
| **Tester** | `Llama-3.1-405B` | Test generation and validation |
| **Reviewer** | `Mixtral-8x22B` | Code quality and security |

### Model Configuration
**File**: [`src/agents/moe-router.ts`](lapa-core/src/agents/moe-router.ts:1)

```typescript
const modelConfigurations = {
  architect: {
    model: 'Nemotron-4-340B',
    expertise: ['system-design', 'architecture', 'planning'],
    temperature: 0.7
  },
  coder: {
    model: 'DeepSeek-Coder-V2', 
    expertise: ['implementation', 'refactoring', 'bug-fixes'],
    temperature: 0.3
  }
  // ... other agent configurations
};
```

---

## Account Management System

LAPA uses a freemium model with comprehensive license management:

### Free vs Premium Features

| Feature | Free Tier | Premium Tier |
|---------|-----------|--------------|
| **Agents** | 2 parallel agents | 5+ specialized agents |
| **NIM Access** | Local only | Local + Cloud scaling |
| **Context Compression** | Local storage | Vercel Blob storage |
| **Autonomous Swarm** | ❌ Manual prompts | ✅ Zero-prompt continuity |
| **Background Tasks** | ❌ | ✅ PRs, tests, docs |
| **Price** | **$0** | **$12/month** or **$99/year** |

### License Management

**Core File**: [`src/premium/license.manager.ts`](lapa-core/src/premium/license.manager.ts:1)

#### License Generation
```typescript
import { LicenseManager } from './premium/license.manager';

const licenseManager = new LicenseManager();

const license = licenseManager.generateLicense(
  'user@example.com',
  'prod_premium', 
  ['swarm', 'cloud-nim', 'vercel-blob'],
  {
    expiresAt: new Date('2025-12-31'),
    maxActivations: 3,
    metadata: { tier: 'professional' }
  }
);
```

#### License Validation
```typescript
const validation = licenseManager.validateLicense(
  license.id, 
  license.activationKey
);

if (validation.isValid && !validation.isExpired) {
  // Premium features unlocked
  await activatePremiumFeatures();
}
```

#### Payment Integration
**File**: [`src/premium/stripe.payment.ts`](lapa-core/src/premium/stripe.payment.ts:1)

```typescript
import { stripePaymentIntegration } from './premium/stripe.payment';

// Create customer and subscription
const customer = await stripePaymentIntegration.createCustomer(
  'user@example.com',
  'Premium User'
);

const subscription = await stripePaymentIntegration.createSubscription(
  customer.id,
  'price_premium_monthly'
);
```

### Team State Management
**File**: [`src/premium/team.state.ts`](lapa-core/src/premium/team.state.ts:1)

```typescript
import { teamStateManager } from './premium/team.state';

// Create team for collaborative work
const teamState = teamStateManager.createTeamState(
  'team-eng-123',
  ['user-1', 'user-2', 'user-3']
);

// Synchronize shared context
teamStateManager.updateSharedContext(
  'team-eng-123',
  'user-1',
  { project: 'LAPA Core', sprint: 'Sprint 5' }
);
```

---

## Testing Guide

### Spoofing Paid Accounts for Development

LAPA provides comprehensive testing utilities for premium features:

#### Mock License Generation
**Test File**: [`src/__tests__/integration/premium-features.test.ts`](lapa-core/src/__tests__/integration/premium-features.test.ts:216)

```typescript
// Generate test license with premium features
const testLicense = licenseManager.generateLicense(
  'test@example.com',
  'prod_premium',
  ['swarm', 'cloud-nim', 'vercel-blob'],
  { 
    tier: 'enterprise', 
    maxUsers: 100,
    // Bypass expiration for testing
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  }
);

// Activate the test license
const activation = licenseManager.activateLicense(
  testLicense.id, 
  testLicense.activationKey
);
```

#### Environment Variables for Testing
```bash
# Set testing environment
export LAPA_TEST_MODE=true
export LICENSE_SECRET_KEY=test-key-only-for-development
export STRIPE_SECRET_KEY=sk_test_placeholder
```

#### Premium Feature Testing Workflow
```typescript
describe('Premium Features Integration', () => {
  beforeEach(() => {
    // Setup test environment
    process.env.LAPA_TEST_MODE = 'true';
    
    // Mock external services
    jest.mock('@vercel/blob');
    jest.mock('stripe');
  });

  it('should enable premium features with valid license', async () => {
    // Generate and activate test license
    const license = generateTestLicense();
    
    // Verify premium features are accessible
    expect(await canAccessSwarm()).toBe(true);
    expect(await canUseCloudNIM()).toBe(true);
  });
});
```

### End-to-End Testing
**File**: [`src/__tests__/e2e/user-journey.test.ts`](lapa-core/src/__tests__/e2e/user-journey.test.ts:1)

```typescript
// Simulate complete user journey from free to premium
test('complete premium onboarding flow', async () => {
  // Start with free account
  await startFreeTier();
  
  // Upgrade to premium
  const license = await purchasePremiumSubscription();
  
  // Verify all premium features are active
  await verifyPremiumFeatures(license);
  
  // Test team collaboration
  await testTeamWorkflow();
});
```

---

## Troubleshooting

### Common Issues and Solutions

#### NIM Container Won't Start
**Problem**: Docker fails to start NVIDIA NIM container

**Solution**:
```bash
# Check Docker is running
docker --version

# Remove existing container and retry
docker stop lapa-nim
docker rm lapa-nim
docker run -d --name lapa-nim -p 8000:8000 nvcr.io/nim:latest

# Verify NVIDIA NGC access
docker login nvcr.io
```

#### License Validation Fails
**Problem**: Premium features not activating despite valid payment

**Solution**:
```typescript
// Check license status
const validation = licenseManager.validateLicense(licenseId, activationKey);

if (!validation.isValid) {
  console.error('License validation failed:', validation.message);
  
  // Common issues:
  // - License expired: Check expiresAt date
  // - Activation limit exceeded: Check maxActivations
  // - Invalid activation key: Regenerate license
}
```

#### Cloud NIM Connection Issues
**Problem**: Cannot connect to cloud NVIDIA NIM service

**Solution**:
```typescript
// Verify API configuration
const cloudNIM = new CloudNIMIntegration();

// Check health endpoint
const isHealthy = await cloudNIM.checkHealth();

if (!isHealthy) {
  // Verify environment variables
  console.log('API Key:', process.env.CLOUD_NIM_API_KEY);
  console.log('API Base:', process.env.CLOUD_NIM_API_BASE);
  
  // Check network connectivity
  await testNetworkConnectivity('api.nim.cloud');
}
```

#### Extension Not Loading in Cursor
**Problem**: LAPA extension doesn't appear in Cursor activity bar

**Solution**:
1. **Verify Installation**:
   ```bash
   # Check extension files exist
   ls -la lapa-core/cursor.json
   ls -la lapa-core/media/lapa-icon.svg
   ```

2. **Reload Cursor**: 
   - `View → Command Palette → Developer: Reload Window`

3. **Check Console Logs**:
   - `View → Command Palette → Developer: Toggle Developer Tools`
   - Look for LAPA-related errors

### Performance Optimization

#### GPU Memory Management
```typescript
// Monitor GPU usage during swarm operations
import { monitorGPUUsage } from './utils/gpu-monitor';

const gpuStats = await monitorGPUUsage();
if (gpuStats.memoryUsed > 0.8) {
  // Reduce model size or enable CPU fallback
  await switchToSmallerModels();
}
```

#### Context Compression Settings
**File**: [`src/mcp/ctx-zip.integration.ts`](lapa-core/src/mcp/ctx-zip.integration.ts:1)

```typescript
// Optimize compression for different payload sizes
const compressionConfig = {
  smallPayload: { threshold: 1000, ratio: 0.9 },
  mediumPayload: { threshold: 10000, ratio: 0.8 },
  largePayload: { threshold: 50000, ratio: 0.7 }
};
```

### Getting Help

- **Documentation**: [docs.lapa.ai](https://docs.lapa.ai)
- **Community**: [GitHub Discussions](https://github.com/lapa-ai/lapa/discussions)
- **Support**: [support@lapa.ai](mailto:support@lapa.ai)

For urgent issues, include your:
- LAPA version (`package.json` → `version`)
- System information (GPU model, Docker version)
- Error logs from Cursor developer console

---

## Version Information

This documentation covers **LAPA Core v0.1.0**. Check the [CHANGELOG.md](CHANGELOG.md) for updates and migration guides between versions.

**Last Updated**: November 2025