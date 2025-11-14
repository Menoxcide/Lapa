"use strict";
/**
 * Integration tests for Marketplace Registry
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const registry_ts_1 = require("../../marketplace/registry.ts");
const cursor_ts_1 = require("../../marketplace/cursor.ts");
// Mock the event bus
vitest_1.vi.mock('../../core/event-bus.ts', () => ({
    eventBus: {
        publish: vitest_1.vi.fn().mockResolvedValue(undefined)
    }
}));
// Mock Node.js built-in modules
vitest_1.vi.mock('fs', () => ({
    existsSync: vitest_1.vi.fn().mockReturnValue(false)
}));
vitest_1.vi.mock('fs/promises', () => ({
    readFile: vitest_1.vi.fn().mockResolvedValue(JSON.stringify({ skills: [], installed: [] })),
    writeFile: vitest_1.vi.fn().mockResolvedValue(undefined),
    mkdir: vitest_1.vi.fn().mockResolvedValue(undefined)
}));
vitest_1.vi.mock('path', () => ({
    join: vitest_1.vi.fn().mockImplementation((...args) => args.join('/'))
}));
// Mock crypto module
vitest_1.vi.mock('crypto', () => ({
    createVerify: vitest_1.vi.fn().mockReturnValue({
        update: vitest_1.vi.fn(),
        end: vitest_1.vi.fn(),
        verify: vitest_1.vi.fn().mockReturnValue(true)
    }),
    createPublicKey: vitest_1.vi.fn().mockReturnValue({}),
    createSign: vitest_1.vi.fn().mockReturnValue({
        update: vitest_1.vi.fn(),
        end: vitest_1.vi.fn(),
        sign: vitest_1.vi.fn().mockReturnValue('test-signature')
    }),
    randomBytes: vitest_1.vi.fn().mockReturnValue(Buffer.from('test'))
}));
// Mock the IPFS client
vitest_1.vi.mock('kubo-rpc-client', async () => {
    return {
        create: vitest_1.vi.fn().mockReturnValue({
            cat: vitest_1.vi.fn().mockImplementation(() => {
                return (async function* () {
                    yield Buffer.from(JSON.stringify({
                        skills: [],
                        signature: 'test-signature',
                        signaturePublicKey: 'test-public-key'
                    }));
                })();
            }),
            add: vitest_1.vi.fn().mockResolvedValue({
                cid: {
                    toString: vitest_1.vi.fn().mockReturnValue('QmTestHash')
                }
            })
        })
    };
});
(0, vitest_1.describe)('Marketplace Registry Integration', () => {
    let registry;
    (0, vitest_1.beforeEach)(() => {
        // Reset singleton instance
        registry_ts_1.getMarketplaceRegistry.instance = null;
        registry = (0, registry_ts_1.getMarketplaceRegistry)({
            registryPath: ':memory:',
            cachePath: ':memory:',
            enableOnChain: false,
            localCacheEnabled: false
        });
    });
    (0, vitest_1.it)('should initialize the marketplace registry', async () => {
        await (0, vitest_1.expect)(registry.initialize()).resolves.not.toThrow();
    });
    (0, vitest_1.it)('should register a new skill', async () => {
        const skill = {
            id: 'test-skill-1',
            name: 'Test Skill',
            description: 'A test skill for integration testing',
            version: '1.0.0',
            author: 'Test Author',
            category: 'test',
            tags: ['test', 'integration'],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await registry.registerSkill(skill);
        const retrievedSkill = await registry.getSkill('test-skill-1');
        (0, vitest_1.expect)(retrievedSkill).toBeDefined();
        (0, vitest_1.expect)(retrievedSkill?.id).toBe('test-skill-1');
        (0, vitest_1.expect)(retrievedSkill?.name).toBe('Test Skill');
    });
    (0, vitest_1.it)('should search skills by query', async () => {
        // Register multiple skills
        const skills = [
            {
                id: 'search-skill-1',
                name: 'JavaScript Formatter',
                description: 'Formats JavaScript code',
                version: '1.0.0',
                author: 'Test Author',
                category: 'code',
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
                category: 'code',
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
        (0, vitest_1.expect)(results).toHaveLength(1);
        (0, vitest_1.expect)(results[0].id).toBe('search-skill-1');
    });
    (0, vitest_1.it)('should install and uninstall skills', async () => {
        const skill = {
            id: 'install-skill-1',
            name: 'Installable Skill',
            description: 'A skill that can be installed',
            version: '1.0.0',
            author: 'Test Author',
            category: 'test',
            tags: ['install'],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await registry.registerSkill(skill);
        // Install the skill
        const installResult = await registry.installSkill('install-skill-1');
        (0, vitest_1.expect)(installResult).toBe(true);
        (0, vitest_1.expect)(registry.isInstalled('install-skill-1')).toBe(true);
        // Get installed skills
        const installedSkills = registry.getInstalledSkills();
        (0, vitest_1.expect)(installedSkills).toContain('install-skill-1');
        // Uninstall the skill
        const uninstallResult = await registry.uninstallSkill('install-skill-1');
        (0, vitest_1.expect)(uninstallResult).toBe(true);
        (0, vitest_1.expect)(registry.isInstalled('install-skill-1')).toBe(false);
    });
    (0, vitest_1.it)('should rate skills', async () => {
        const skill = {
            id: 'rate-skill-1',
            name: 'Rateable Skill',
            description: 'A skill that can be rated',
            version: '1.0.0',
            author: 'Test Author',
            category: 'test',
            tags: ['rate'],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await registry.registerSkill(skill);
        // Rate the skill
        const rateResult = await registry.rateSkill('rate-skill-1', 4.5);
        (0, vitest_1.expect)(rateResult).toBe(true);
        // Check the rating
        const ratedSkill = await registry.getSkill('rate-skill-1');
        (0, vitest_1.expect)(ratedSkill?.rating).toBe(4.5);
        (0, vitest_1.expect)(ratedSkill?.ratingCount).toBe(1);
    });
    (0, vitest_1.it)('should create DID documents', () => {
        const publicKeyBase58 = 'test-public-key-base58';
        const didDocument = registry.createDIDDocument('test-author', publicKeyBase58);
        (0, vitest_1.expect)(didDocument).toBeDefined();
        (0, vitest_1.expect)(didDocument.id).toBe('did:lapa:test-author');
        (0, vitest_1.expect)(didDocument.publicKey).toHaveLength(1);
        (0, vitest_1.expect)(didDocument.publicKey[0].publicKeyBase58).toBe(publicKeyBase58);
    });
    (0, vitest_1.it)('should sign and verify data', () => {
        // In a real test, we would generate actual keys
        // For this test, we'll just check that the methods exist
        (0, vitest_1.expect)(typeof registry.signData).toBe('function');
    });
});
(0, vitest_1.describe)('Cursor Marketplace Integration', () => {
    let client;
    (0, vitest_1.beforeEach)(() => {
        // Reset singleton instance
        cursor_ts_1.getCursorMarketplaceClient.instance = null;
        client = (0, cursor_ts_1.getCursorMarketplaceClient)();
    });
    (0, vitest_1.it)('should configure the client', () => {
        const config = {
            apiKey: 'test-api-key',
            apiUrl: 'https://api.cursor.sh',
            organizationId: 'test-org'
        };
        (0, vitest_1.expect)(() => client.configure(config)).not.toThrow();
    });
    (0, vitest_1.it)('should validate skills for submission', async () => {
        const validSkill = {
            id: 'valid-skill-1',
            name: 'Valid Skill',
            description: 'A valid skill for submission',
            version: '1.0.0',
            author: 'Test Author',
            category: 'test',
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
        (0, vitest_1.expect)(isValid).toBe(true);
    });
    (0, vitest_1.it)('should reject invalid skills for submission', async () => {
        const invalidSkill = {
            id: 'invalid-skill-1',
            name: 'Invalid Skill',
            description: 'Missing required fields',
            version: '1.0.0',
            // Missing author field
            category: 'test',
            tags: ['test'],
            installCount: 0,
            ratingCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        const isValid = await client.validateSkill(invalidSkill);
        (0, vitest_1.expect)(isValid).toBe(false);
    });
});
//# sourceMappingURL=registry.integration.test.js.map