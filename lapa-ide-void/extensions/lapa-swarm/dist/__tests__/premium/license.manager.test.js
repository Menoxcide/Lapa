"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const license_manager_ts_1 = require("../../premium/license.manager.ts");
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
// Mock crypto.randomBytes
vitest_1.vi.mock('crypto', () => ({
    randomBytes: vitest_1.vi.fn(),
    createHmac: vitest_1.vi.fn().mockReturnValue({
        update: vitest_1.vi.fn().mockReturnThis(),
        digest: vitest_1.vi.fn().mockReturnValue('mocked-hmac-digest')
    })
}));
// Mock uuid.validate
vitest_1.vi.mock('uuid', () => ({
    validate: vitest_1.vi.fn()
}));
(0, vitest_1.describe)('LicenseManager', () => {
    let licenseManager;
    (0, vitest_1.beforeEach)(() => {
        // Clear all mocks before each test
        vitest_1.vi.clearAllMocks();
        // Setup default mock behaviors
        crypto_1.randomBytes
            .mockImplementation((size) => {
            if (size === 16)
                return Buffer.from('abcdefghijklmnop');
            if (size === 32)
                return Buffer.from('abcdefghijklmnopqrstuvwxyz123456');
            return Buffer.from('test');
        });
        uuid_1.validate.mockReturnValue(true);
        // Mock process.env for testing
        process.env = {
            LICENSE_SECRET_KEY: 'test-secret-key',
            LICENSE_DEFAULT_EXPIRATION_DAYS: '365',
            LICENSE_MAX_ACTIVATIONS: '5'
        };
        licenseManager = new license_manager_ts_1.LicenseManager();
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with provided secret key', () => {
            const manager = new license_manager_ts_1.LicenseManager('custom-secret-key');
            (0, vitest_1.expect)(manager.secretKey).toBe('custom-secret-key');
        });
        (0, vitest_1.it)('should initialize with secret key from environment', () => {
            const manager = new license_manager_ts_1.LicenseManager();
            (0, vitest_1.expect)(manager.secretKey).toBe('test-secret-key');
        });
        (0, vitest_1.it)('should generate random secret key when none provided', () => {
            process.env = {};
            const manager = new license_manager_ts_1.LicenseManager();
            (0, vitest_1.expect)(manager.secretKey).toBeDefined();
            (0, vitest_1.expect)(manager.secretKey.length).toBe(64); // 32 bytes hex encoded
        });
        (0, vitest_1.it)('should validate environment variables', () => {
            process.env = {
                LICENSE_SECRET_KEY: 'short', // Too short
                LICENSE_DEFAULT_EXPIRATION_DAYS: '-1', // Negative
                LICENSE_MAX_ACTIVATIONS: '0' // Zero
            };
            (0, vitest_1.expect)(() => new license_manager_ts_1.LicenseManager()).toThrow('LICENSE_SECRET_KEY must be a string of at least 32 characters');
        });
    });
    (0, vitest_1.describe)('generateLicense', () => {
        (0, vitest_1.it)('should generate a valid license', () => {
            const license = licenseManager.generateLicense('user-123', 'product-456', ['feature1', 'feature2']);
            (0, vitest_1.expect)(license).toBeDefined();
            (0, vitest_1.expect)(license.id).toBe('6162636465666768696a6b6c6d6e6f70'); // hex of 'abcdefghijklmnop'
            (0, vitest_1.expect)(license.userId).toBe('user-123');
            (0, vitest_1.expect)(license.productId).toBe('product-456');
            (0, vitest_1.expect)(license.features).toEqual(['feature1', 'feature2']);
            (0, vitest_1.expect)(license.isActive).toBe(false);
            (0, vitest_1.expect)(license.activationCount).toBe(0);
            (0, vitest_1.expect)(license.createdAt).toBeInstanceOf(Date);
            (0, vitest_1.expect)(license.activationKey).toBe('mocked-hmac-digest');
        });
        (0, vitest_1.it)('should generate license with custom expiration date', () => {
            const customExpiry = new Date('2025-12-31');
            const license = licenseManager.generateLicense('user-123', 'product-456', ['feature1'], { expiresAt: customExpiry });
            (0, vitest_1.expect)(license.expiresAt).toEqual(customExpiry);
        });
        (0, vitest_1.it)('should generate license with custom max activations', () => {
            const license = licenseManager.generateLicense('user-123', 'product-456', ['feature1'], { maxActivations: 10 });
            (0, vitest_1.expect)(license.maxActivations).toBe(10);
        });
        (0, vitest_1.it)('should generate license with metadata', () => {
            const metadata = { company: 'Test Corp', department: 'Engineering' };
            const license = licenseManager.generateLicense('user-123', 'product-456', ['feature1'], { metadata });
            (0, vitest_1.expect)(license.metadata).toEqual(metadata);
        });
        (0, vitest_1.it)('should use default expiration when none provided', () => {
            const license = licenseManager.generateLicense('user-123', 'product-456', ['feature1']);
            (0, vitest_1.expect)(license.expiresAt).toBeDefined();
            // Should be approximately 365 days from now
            const expectedExpiry = new Date();
            expectedExpiry.setDate(expectedExpiry.getDate() + 365);
            (0, vitest_1.expect)(Math.abs(license.expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(10000); // Within 10 seconds
        });
        (0, vitest_1.it)('should validate input parameters', () => {
            (0, vitest_1.expect)(() => licenseManager.generateLicense('', 'product', ['feature']))
                .toThrow('Valid userId is required');
            (0, vitest_1.expect)(() => licenseManager.generateLicense('user', '', ['feature']))
                .toThrow('Valid productId is required');
            (0, vitest_1.expect)(() => licenseManager.generateLicense('user', 'product', 'not-an-array'))
                .toThrow('Features must be an array');
        });
        (0, vitest_1.it)('should validate UUID format when applicable', () => {
            uuid_1.validate.mockReturnValue(false);
            (0, vitest_1.expect)(() => licenseManager.generateLicense('123e4567-e89b-12d3-a456-426614174000', 'product', ['feature']))
                .toThrow('userId must be a valid UUID if provided in UUID format');
        });
    });
    (0, vitest_1.describe)('validateLicense', () => {
        let license;
        (0, vitest_1.beforeEach)(() => {
            license = licenseManager.generateLicense('user-123', 'product-456', ['feature1']);
        });
        (0, vitest_1.it)('should validate active license successfully', () => {
            // Activate the license first
            licenseManager.activateLicense(license.id, license.activationKey);
            const result = licenseManager.validateLicense(license.id, license.activationKey);
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.license).toEqual(license);
        });
        (0, vitest_1.it)('should reject validation for inactive license', () => {
            const result = licenseManager.validateLicense(license.id, license.activationKey);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.isActivated).toBe(false);
            (0, vitest_1.expect)(result.message).toBe('License is not activated');
        });
        (0, vitest_1.it)('should reject validation for expired license', () => {
            // Create an expired license
            const expiredLicense = licenseManager.generateLicense('user-123', 'product-456', ['feature1'], { expiresAt: new Date(Date.now() - 86400000) } // Yesterday
            );
            // Activate it
            licenseManager.activateLicense(expiredLicense.id, expiredLicense.activationKey);
            const result = licenseManager.validateLicense(expiredLicense.id, expiredLicense.activationKey);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.isExpired).toBe(true);
            (0, vitest_1.expect)(result.message).toBe('License has expired');
        });
        (0, vitest_1.it)('should reject validation for invalid activation key', () => {
            // Activate the license first
            licenseManager.activateLicense(license.id, license.activationKey);
            const result = licenseManager.validateLicense(license.id, 'invalid-key');
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.message).toBe('Invalid activation key');
        });
        (0, vitest_1.it)('should reject validation for non-existent license', () => {
            const result = licenseManager.validateLicense('non-existent-id', 'any-key');
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.message).toBe('License not found');
        });
    });
    (0, vitest_1.describe)('activateLicense', () => {
        let license;
        (0, vitest_1.beforeEach)(() => {
            license = licenseManager.generateLicense('user-123', 'product-456', ['feature1']);
        });
        (0, vitest_1.it)('should activate license successfully', () => {
            const result = licenseManager.activateLicense(license.id, license.activationKey);
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.license?.isActive).toBe(true);
            (0, vitest_1.expect)(result.license?.activationCount).toBe(1);
        });
        (0, vitest_1.it)('should increment activation count on successive activations', () => {
            // First activation
            licenseManager.activateLicense(license.id, license.activationKey);
            (0, vitest_1.expect)(license.activationCount).toBe(1);
            // Deactivate
            licenseManager.deactivateLicense(license.id);
            // Second activation
            licenseManager.activateLicense(license.id, license.activationKey);
            (0, vitest_1.expect)(license.activationCount).toBe(2);
        });
        (0, vitest_1.it)('should reject activation with invalid key', () => {
            const result = licenseManager.activateLicense(license.id, 'invalid-key');
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.message).toBe('Invalid activation key');
            (0, vitest_1.expect)(license.isActive).toBe(false);
        });
        (0, vitest_1.it)('should reject activation for non-existent license', () => {
            const result = licenseManager.activateLicense('non-existent-id', 'any-key');
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.message).toBe('License not found');
        });
        (0, vitest_1.it)('should reject activation when max activations reached', () => {
            // Generate a license with max 1 activation
            const limitedLicense = licenseManager.generateLicense('user-123', 'product-456', ['feature1'], { maxActivations: 1 });
            // Activate once
            licenseManager.activateLicense(limitedLicense.id, limitedLicense.activationKey);
            // Try to activate again
            const result = licenseManager.activateLicense(limitedLicense.id, limitedLicense.activationKey);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.message).toBe('Maximum activations reached');
        });
        (0, vitest_1.it)('should reject activation for expired license', () => {
            // Create an expired license
            const expiredLicense = licenseManager.generateLicense('user-123', 'product-456', ['feature1'], { expiresAt: new Date(Date.now() - 86400000) } // Yesterday
            );
            const result = licenseManager.activateLicense(expiredLicense.id, expiredLicense.activationKey);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.isExpired).toBe(true);
            (0, vitest_1.expect)(result.message).toBe('License has expired');
        });
    });
    (0, vitest_1.describe)('deactivateLicense', () => {
        let license;
        (0, vitest_1.beforeEach)(() => {
            license = licenseManager.generateLicense('user-123', 'product-456', ['feature1']);
            licenseManager.activateLicense(license.id, license.activationKey);
        });
        (0, vitest_1.it)('should deactivate license successfully', () => {
            const result = licenseManager.deactivateLicense(license.id);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(license.isActive).toBe(false);
        });
        (0, vitest_1.it)('should return false for non-existent license', () => {
            const result = licenseManager.deactivateLicense('non-existent-id');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('getLicense', () => {
        let license;
        (0, vitest_1.beforeEach)(() => {
            license = licenseManager.generateLicense('user-123', 'product-456', ['feature1']);
        });
        (0, vitest_1.it)('should retrieve license successfully', () => {
            const retrieved = licenseManager.getLicense(license.id);
            (0, vitest_1.expect)(retrieved).toEqual(license);
        });
        (0, vitest_1.it)('should return undefined for non-existent license', () => {
            const retrieved = licenseManager.getLicense('non-existent-id');
            (0, vitest_1.expect)(retrieved).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('revokeLicense', () => {
        let license;
        (0, vitest_1.beforeEach)(() => {
            license = licenseManager.generateLicense('user-123', 'product-456', ['feature1']);
        });
        (0, vitest_1.it)('should revoke license successfully', () => {
            const result = licenseManager.revokeLicense(license.id);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(licenseManager.getLicense(license.id)).toBeUndefined();
        });
        (0, vitest_1.it)('should return false for non-existent license', () => {
            const result = licenseManager.revokeLicense('non-existent-id');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('getUserLicenses', () => {
        (0, vitest_1.beforeEach)(() => {
            // Generate licenses for different users
            licenseManager.generateLicense('user-1', 'product-1', ['feature1']);
            licenseManager.generateLicense('user-1', 'product-2', ['feature2']);
            licenseManager.generateLicense('user-2', 'product-3', ['feature3']);
        });
        (0, vitest_1.it)('should retrieve all licenses for a user', () => {
            const userLicenses = licenseManager.getUserLicenses('user-1');
            (0, vitest_1.expect)(userLicenses).toHaveLength(2);
            (0, vitest_1.expect)(userLicenses.every(l => l.userId === 'user-1')).toBe(true);
        });
        (0, vitest_1.it)('should return empty array for user with no licenses', () => {
            const userLicenses = licenseManager.getUserLicenses('user-3');
            (0, vitest_1.expect)(userLicenses).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('updateLicenseMetadata', () => {
        let license;
        (0, vitest_1.beforeEach)(() => {
            license = licenseManager.generateLicense('user-123', 'product-456', ['feature1'], { metadata: { existing: 'value' } });
        });
        (0, vitest_1.it)('should update license metadata successfully', () => {
            const result = licenseManager.updateLicenseMetadata(license.id, { newField: 'newValue' });
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(license.metadata).toEqual({ existing: 'value', newField: 'newValue' });
        });
        (0, vitest_1.it)('should return false for non-existent license', () => {
            const result = licenseManager.updateLicenseMetadata('non-existent-id', { field: 'value' });
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('private methods', () => {
        (0, vitest_1.it)('should generate activation key correctly', () => {
            const generateKeyMethod = licenseManager.generateActivationKey;
            const key = generateKeyMethod.call(licenseManager, 'license-id', 'user-id', 'product-id');
            (0, vitest_1.expect)(key).toBe('mocked-hmac-digest');
        });
        (0, vitest_1.it)('should validate inputs correctly', () => {
            const validateInputsMethod = licenseManager.validateInputs;
            (0, vitest_1.expect)(() => validateInputsMethod.call(licenseManager, '', 'product'))
                .toThrow('Valid userId is required');
            (0, vitest_1.expect)(() => validateInputsMethod.call(licenseManager, 'user', ''))
                .toThrow('Valid productId is required');
            (0, vitest_1.expect)(() => validateInputsMethod.call(licenseManager, '123-invalid-uuid', 'product'))
                .toThrow('userId must be a valid UUID if provided in UUID format');
        });
    });
});
//# sourceMappingURL=license.manager.test.js.map