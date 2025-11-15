import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { LicenseManager, LicenseData } from '../../premium/license.manager.ts';
import { randomBytes } from 'crypto';
import { validate as validateUuid } from 'uuid';

// Mock crypto.randomBytes
vi.mock('crypto', () => ({
  randomBytes: vi.fn(),
  createHmac: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue('mocked-hmac-digest')
  })
}));

// Mock uuid.validate
vi.mock('uuid', () => ({
  validate: vi.fn()
}));

describe('LicenseManager', () => {
  let licenseManager: LicenseManager;
  
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock behaviors
    (randomBytes as Mock)
      .mockImplementation((size: number) => {
        if (size === 16) return Buffer.from('abcdefghijklmnop');
        if (size === 32) return Buffer.from('abcdefghijklmnopqrstuvwxyz123456');
        return Buffer.from('test');
      });
    
    (validateUuid as Mock).mockReturnValue(true);
    
    // Mock process.env for testing
    (process as any).env = {
      LICENSE_SECRET_KEY: 'test-secret-key',
      LICENSE_DEFAULT_EXPIRATION_DAYS: '365',
      LICENSE_MAX_ACTIVATIONS: '5'
    };
    
    licenseManager = new LicenseManager();
  });

  describe('constructor', () => {
    it('should initialize with provided secret key', () => {
      const manager = new LicenseManager('custom-secret-key');
      expect((manager as any).secretKey).toBe('custom-secret-key');
    });

    it('should initialize with secret key from environment', () => {
      const manager = new LicenseManager();
      expect((manager as any).secretKey).toBe('test-secret-key');
    });

    it('should generate random secret key when none provided', () => {
      (process as any).env = {};
      const manager = new LicenseManager();
      expect((manager as any).secretKey).toBeDefined();
      expect((manager as any).secretKey.length).toBe(64); // 32 bytes hex encoded
    });

    it('should validate environment variables', () => {
      (process as any).env = {
        LICENSE_SECRET_KEY: 'short', // Too short
        LICENSE_DEFAULT_EXPIRATION_DAYS: '-1', // Negative
        LICENSE_MAX_ACTIVATIONS: '0' // Zero
      };
      
      expect(() => new LicenseManager()).toThrow('LICENSE_SECRET_KEY must be a string of at least 32 characters');
    });
  });

  describe('generateLicense', () => {
    it('should generate a valid license', () => {
      const license = licenseManager.generateLicense(
        'user-123',
        'product-456',
        ['feature1', 'feature2']
      );
      
      expect(license).toBeDefined();
      expect(license.id).toBe('6162636465666768696a6b6c6d6e6f70'); // hex of 'abcdefghijklmnop'
      expect(license.userId).toBe('user-123');
      expect(license.productId).toBe('product-456');
      expect(license.features).toEqual(['feature1', 'feature2']);
      expect(license.isActive).toBe(false);
      expect(license.activationCount).toBe(0);
      expect(license.createdAt).toBeInstanceOf(Date);
      expect(license.activationKey).toBe('mocked-hmac-digest');
    });

    it('should generate license with custom expiration date', () => {
      const customExpiry = new Date('2025-12-31');
      const license = licenseManager.generateLicense(
        'user-123',
        'product-456',
        ['feature1'],
        { expiresAt: customExpiry }
      );
      
      expect(license.expiresAt).toEqual(customExpiry);
    });

    it('should generate license with custom max activations', () => {
      const license = licenseManager.generateLicense(
        'user-123',
        'product-456',
        ['feature1'],
        { maxActivations: 10 }
      );
      
      expect(license.maxActivations).toBe(10);
    });

    it('should generate license with metadata', () => {
      const metadata = { company: 'Test Corp', department: 'Engineering' };
      const license = licenseManager.generateLicense(
        'user-123',
        'product-456',
        ['feature1'],
        { metadata }
      );
      
      expect(license.metadata).toEqual(metadata);
    });

    it('should use default expiration when none provided', () => {
      const license = licenseManager.generateLicense(
        'user-123',
        'product-456',
        ['feature1']
      );
      
      expect(license.expiresAt).toBeDefined();
      // Should be approximately 365 days from now
      const expectedExpiry = new Date();
      expectedExpiry.setDate(expectedExpiry.getDate() + 365);
      expect(Math.abs(license.expiresAt!.getTime() - expectedExpiry.getTime())).toBeLessThan(10000); // Within 10 seconds
    });

    it('should validate input parameters', () => {
      expect(() => licenseManager.generateLicense('', 'product', ['feature']))
        .toThrow('Valid userId is required');
        
      expect(() => licenseManager.generateLicense('user', '', ['feature']))
        .toThrow('Valid productId is required');
        
      expect(() => licenseManager.generateLicense('user', 'product', 'not-an-array' as any))
        .toThrow('Features must be an array');
    });

    it('should validate UUID format when applicable', () => {
      (validateUuid as Mock).mockReturnValue(false);
      
      expect(() => licenseManager.generateLicense('123e4567-e89b-12d3-a456-426614174000', 'product', ['feature']))
        .toThrow('userId must be a valid UUID if provided in UUID format');
    });
  });

  describe('validateLicense', () => {
    let license: LicenseData;
    
    beforeEach(() => {
      license = licenseManager.generateLicense('user-123', 'product-456', ['feature1']);
    });

    it('should validate active license successfully', () => {
      // Activate the license first
      licenseManager.activateLicense(license.id, license.activationKey);
      
      const result = licenseManager.validateLicense(license.id, license.activationKey);
      
      expect(result.isValid).toBe(true);
      expect(result.license).toEqual(license);
    });

    it('should reject validation for inactive license', () => {
      const result = licenseManager.validateLicense(license.id, license.activationKey);
      
      expect(result.isValid).toBe(false);
      expect(result.isActivated).toBe(false);
      expect(result.message).toBe('License is not activated');
    });

    it('should reject validation for expired license', () => {
      // Create an expired license
      const expiredLicense = licenseManager.generateLicense(
        'user-123',
        'product-456',
        ['feature1'],
        { expiresAt: new Date(Date.now() - 86400000) } // Yesterday
      );
      
      // Activate it
      licenseManager.activateLicense(expiredLicense.id, expiredLicense.activationKey);
      
      const result = licenseManager.validateLicense(expiredLicense.id, expiredLicense.activationKey);
      
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.message).toBe('License has expired');
    });

    it('should reject validation for invalid activation key', () => {
      // Activate the license first
      licenseManager.activateLicense(license.id, license.activationKey);
      
      const result = licenseManager.validateLicense(license.id, 'invalid-key');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid activation key');
    });

    it('should reject validation for non-existent license', () => {
      const result = licenseManager.validateLicense('non-existent-id', 'any-key');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('License not found');
    });
  });

  describe('activateLicense', () => {
    let license: LicenseData;
    
    beforeEach(() => {
      license = licenseManager.generateLicense('user-123', 'product-456', ['feature1']);
    });

    it('should activate license successfully', () => {
      const result = licenseManager.activateLicense(license.id, license.activationKey);
      
      expect(result.isValid).toBe(true);
      expect(result.license?.isActive).toBe(true);
      expect(result.license?.activationCount).toBe(1);
    });

    it('should increment activation count on successive activations', () => {
      // First activation
      licenseManager.activateLicense(license.id, license.activationKey);
      expect(license.activationCount).toBe(1);
      
      // Deactivate
      licenseManager.deactivateLicense(license.id);
      
      // Second activation
      licenseManager.activateLicense(license.id, license.activationKey);
      expect(license.activationCount).toBe(2);
    });

    it('should reject activation with invalid key', () => {
      const result = licenseManager.activateLicense(license.id, 'invalid-key');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid activation key');
      expect(license.isActive).toBe(false);
    });

    it('should reject activation for non-existent license', () => {
      const result = licenseManager.activateLicense('non-existent-id', 'any-key');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('License not found');
    });

    it('should reject activation when max activations reached', () => {
      // Generate a license with max 1 activation
      const limitedLicense = licenseManager.generateLicense(
        'user-123',
        'product-456',
        ['feature1'],
        { maxActivations: 1 }
      );
      
      // Activate once
      licenseManager.activateLicense(limitedLicense.id, limitedLicense.activationKey);
      
      // Try to activate again
      const result = licenseManager.activateLicense(limitedLicense.id, limitedLicense.activationKey);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Maximum activations reached');
    });

    it('should reject activation for expired license', () => {
      // Create an expired license
      const expiredLicense = licenseManager.generateLicense(
        'user-123',
        'product-456',
        ['feature1'],
        { expiresAt: new Date(Date.now() - 86400000) } // Yesterday
      );
      
      const result = licenseManager.activateLicense(expiredLicense.id, expiredLicense.activationKey);
      
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.message).toBe('License has expired');
    });
  });

  describe('deactivateLicense', () => {
    let license: LicenseData;
    
    beforeEach(() => {
      license = licenseManager.generateLicense('user-123', 'product-456', ['feature1']);
      licenseManager.activateLicense(license.id, license.activationKey);
    });

    it('should deactivate license successfully', () => {
      const result = licenseManager.deactivateLicense(license.id);
      
      expect(result).toBe(true);
      expect(license.isActive).toBe(false);
    });

    it('should return false for non-existent license', () => {
      const result = licenseManager.deactivateLicense('non-existent-id');
      
      expect(result).toBe(false);
    });
  });

  describe('getLicense', () => {
    let license: LicenseData;
    
    beforeEach(() => {
      license = licenseManager.generateLicense('user-123', 'product-456', ['feature1']);
    });

    it('should retrieve license successfully', () => {
      const retrieved = licenseManager.getLicense(license.id);
      
      expect(retrieved).toEqual(license);
    });

    it('should return undefined for non-existent license', () => {
      const retrieved = licenseManager.getLicense('non-existent-id');
      
      expect(retrieved).toBeUndefined();
    });
  });

  describe('revokeLicense', () => {
    let license: LicenseData;
    
    beforeEach(() => {
      license = licenseManager.generateLicense('user-123', 'product-456', ['feature1']);
    });

    it('should revoke license successfully', () => {
      const result = licenseManager.revokeLicense(license.id);
      
      expect(result).toBe(true);
      expect(licenseManager.getLicense(license.id)).toBeUndefined();
    });

    it('should return false for non-existent license', () => {
      const result = licenseManager.revokeLicense('non-existent-id');
      
      expect(result).toBe(false);
    });
  });

  describe('getUserLicenses', () => {
    beforeEach(() => {
      // Generate licenses for different users
      licenseManager.generateLicense('user-1', 'product-1', ['feature1']);
      licenseManager.generateLicense('user-1', 'product-2', ['feature2']);
      licenseManager.generateLicense('user-2', 'product-3', ['feature3']);
    });

    it('should retrieve all licenses for a user', () => {
      const userLicenses = licenseManager.getUserLicenses('user-1');
      
      expect(userLicenses).toHaveLength(2);
      expect(userLicenses.every(l => l.userId === 'user-1')).toBe(true);
    });

    it('should return empty array for user with no licenses', () => {
      const userLicenses = licenseManager.getUserLicenses('user-3');
      
      expect(userLicenses).toHaveLength(0);
    });
  });

  describe('updateLicenseMetadata', () => {
    let license: LicenseData;
    
    beforeEach(() => {
      license = licenseManager.generateLicense(
        'user-123',
        'product-456',
        ['feature1'],
        { metadata: { existing: 'value' } }
      );
    });

    it('should update license metadata successfully', () => {
      const result = licenseManager.updateLicenseMetadata(license.id, { newField: 'newValue' });
      
      expect(result).toBe(true);
      expect(license.metadata).toEqual({ existing: 'value', newField: 'newValue' });
    });

    it('should return false for non-existent license', () => {
      const result = licenseManager.updateLicenseMetadata('non-existent-id', { field: 'value' });
      
      expect(result).toBe(false);
    });
  });

  describe('private methods', () => {
    it('should generate activation key correctly', () => {
      const generateKeyMethod = (licenseManager as any).generateActivationKey;
      
      const key = generateKeyMethod.call(licenseManager, 'license-id', 'user-id', 'product-id');
      
      expect(key).toBe('mocked-hmac-digest');
    });

    it('should validate inputs correctly', () => {
      const validateInputsMethod = (licenseManager as any).validateInputs;
      
      expect(() => validateInputsMethod.call(licenseManager, '', 'product'))
        .toThrow('Valid userId is required');
        
      expect(() => validateInputsMethod.call(licenseManager, 'user', ''))
        .toThrow('Valid productId is required');
        
      expect(() => validateInputsMethod.call(licenseManager, '123-invalid-uuid', 'product'))
        .toThrow('userId must be a valid UUID if provided in UUID format');
    });
  });
});