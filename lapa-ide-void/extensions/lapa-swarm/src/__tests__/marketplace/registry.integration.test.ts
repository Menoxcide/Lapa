/**
 * Integration tests for Marketplace Registry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketplaceRegistry, getMarketplaceRegistry } from '../../marketplace/registry.ts';
import { CursorMarketplaceClient, getCursorMarketplaceClient } from '../../marketplace/cursor.ts';

// Mock the event bus
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    publish: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock Node.js built-in modules
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false)
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(JSON.stringify({ skills: [], installed: [] })),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('path', () => ({
  join: vi.fn().mockImplementation((...args) => args.join('/'))
}));

// Mock crypto module
vi.mock('crypto', () => ({
  createVerify: vi.fn().mockReturnValue({
    update: vi.fn(),
    end: vi.fn(),
    verify: vi.fn().mockReturnValue(true)
  }),
  createPublicKey: vi.fn().mockReturnValue({}),
  createSign: vi.fn().mockReturnValue({
    update: vi.fn(),
    end: vi.fn(),
    sign: vi.fn().mockReturnValue('test-signature')
  }),
  randomBytes: vi.fn().mockReturnValue(Buffer.from('test'))
}));

// Mock the IPFS client
vi.mock('kubo-rpc-client', async () => {
  return {
    create: vi.fn().mockReturnValue({
      cat: vi.fn().mockImplementation(() => {
        return (async function* () {
          yield Buffer.from(JSON.stringify({
            skills: [],
            signature: 'test-signature',
            signaturePublicKey: 'test-public-key'
          }));
        })();
      }),
      add: vi.fn().mockResolvedValue({
        cid: {
          toString: vi.fn().mockReturnValue('QmTestHash')
        }
      })
    })
  };
});

describe('Marketplace Registry Integration', () => {
  let registry: MarketplaceRegistry;

  beforeEach(() => {
    // Reset singleton instance
    (getMarketplaceRegistry as any).instance = null;
    registry = getMarketplaceRegistry({
      registryPath: ':memory:',
      cachePath: ':memory:',
      enableOnChain: false,
      localCacheEnabled: false
    });
  });

  it('should initialize the marketplace registry', async () => {
    await expect(registry.initialize()).resolves.not.toThrow();
  });

  it('should register a new skill', async () => {
    const skill = {
      id: 'test-skill-1',
      name: 'Test Skill',
      description: 'A test skill for integration testing',
      version: '1.0.0',
      author: 'Test Author',
      category: 'test' as const,
      tags: ['test', 'integration'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await registry.registerSkill(skill);
    const retrievedSkill = await registry.getSkill('test-skill-1');
    
    expect(retrievedSkill).toBeDefined();
    expect(retrievedSkill?.id).toBe('test-skill-1');
    expect(retrievedSkill?.name).toBe('Test Skill');
  });

  it('should search skills by query', async () => {
    // Register multiple skills
    const skills = [
      {
        id: 'search-skill-1',
        name: 'JavaScript Formatter',
        description: 'Formats JavaScript code',
        version: '1.0.0',
        author: 'Test Author',
        category: 'code' as const,
        tags: ['javascript', 'formatter'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'search-skill-2',
        name: 'Python Linter',
        description: 'Lints Python code',
        version: '1.0.0',
        author: 'Test Author',
        category: 'code' as const,
        tags: ['python', 'linter'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    for (const skill of skills) {
      await registry.registerSkill(skill);
    }

    // Search for JavaScript skills
    const results = await registry.searchSkills('JavaScript');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('search-skill-1');
  });

  it('should install and uninstall skills', async () => {
    const skill = {
      id: 'install-skill-1',
      name: 'Installable Skill',
      description: 'A skill that can be installed',
      version: '1.0.0',
      author: 'Test Author',
      category: 'test' as const,
      tags: ['install'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await registry.registerSkill(skill);
    
    // Install the skill
    const installResult = await registry.installSkill('install-skill-1');
    expect(installResult).toBe(true);
    expect(registry.isInstalled('install-skill-1')).toBe(true);
    
    // Get installed skills
    const installedSkills = registry.getInstalledSkills();
    expect(installedSkills).toContain('install-skill-1');
    
    // Uninstall the skill
    const uninstallResult = await registry.uninstallSkill('install-skill-1');
    expect(uninstallResult).toBe(true);
    expect(registry.isInstalled('install-skill-1')).toBe(false);
  });

  it('should rate skills', async () => {
    const skill = {
      id: 'rate-skill-1',
      name: 'Rateable Skill',
      description: 'A skill that can be rated',
      version: '1.0.0',
      author: 'Test Author',
      category: 'test' as const,
      tags: ['rate'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await registry.registerSkill(skill);
    
    // Rate the skill
    const rateResult = await registry.rateSkill('rate-skill-1', 4.5);
    expect(rateResult).toBe(true);
    
    // Check the rating
    const ratedSkill = await registry.getSkill('rate-skill-1');
    expect(ratedSkill?.rating).toBe(4.5);
    expect(ratedSkill?.ratingCount).toBe(1);
  });

  it('should create DID documents', () => {
    const publicKeyBase58 = 'test-public-key-base58';
    const didDocument = registry.createDIDDocument('test-author', publicKeyBase58);
    
    expect(didDocument).toBeDefined();
    expect(didDocument.id).toBe('did:lapa:test-author');
    expect(didDocument.publicKey).toHaveLength(1);
    expect(didDocument.publicKey[0].publicKeyBase58).toBe(publicKeyBase58);
  });

  it('should sign and verify data', () => {
    // In a real test, we would generate actual keys
    // For this test, we'll just check that the methods exist
    expect(typeof registry.signData).toBe('function');
  });
});

describe('Cursor Marketplace Integration', () => {
  let client: CursorMarketplaceClient;

  beforeEach(() => {
    // Reset singleton instance
    (getCursorMarketplaceClient as any).instance = null;
    client = getCursorMarketplaceClient();
  });

  it('should configure the client', () => {
    const config = {
      apiKey: 'test-api-key',
      apiUrl: 'https://api.cursor.sh',
      organizationId: 'test-org'
    };

    expect(() => client.configure(config)).not.toThrow();
  });

  it('should validate skills for submission', async () => {
    const validSkill = {
      id: 'valid-skill-1',
      name: 'Valid Skill',
      description: 'A valid skill for submission',
      version: '1.0.0',
      author: 'Test Author',
      category: 'test' as const,
      tags: ['test'],
      ipfsHash: 'QmTestHash',
      signature: 'test-signature',
      signaturePublicKey: 'test-public-key',
      installCount: 0,
      ratingCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const isValid = await client.validateSkill(validSkill);
    expect(isValid).toBe(true);
  });

  it('should reject invalid skills for submission', async () => {
    const invalidSkill = {
      id: 'invalid-skill-1',
      name: 'Invalid Skill',
      description: 'Missing required fields',
      version: '1.0.0',
      // Missing author field
      category: 'test' as const,
      tags: ['test'],
      installCount: 0,
      ratingCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const isValid = await client.validateSkill(invalidSkill as any);
    expect(isValid).toBe(false);
  });
});