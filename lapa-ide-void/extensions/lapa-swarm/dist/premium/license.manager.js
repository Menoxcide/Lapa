"use strict";
/**
 * License Management System for LAPA Premium
 *
 * This module provides license validation, activation, and management
 * for premium features in LAPA Core.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.licenseManager = exports.LicenseManager = void 0;
// Import necessary modules
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
/**
 * License Management class
 */
class LicenseManager {
    secretKey;
    licenses;
    config;
    constructor(secretKey, config) {
        // Load configuration
        this.config = config || this.loadConfiguration();
        // Validate environment variables
        this.validateEnvironmentVariables();
        this.secretKey = secretKey || process.env.LICENSE_SECRET_KEY || (0, crypto_1.randomBytes)(32).toString('hex');
        this.licenses = new Map();
    }
    /**
     * Validates required environment variables
     * @throws Error if validation fails
     */
    /**
     * Loads configuration from environment variables or config object
     * @returns Configuration object
     */
    loadConfiguration() {
        return {
            secretKey: process.env.LICENSE_SECRET_KEY,
            defaultExpirationDays: process.env.LICENSE_DEFAULT_EXPIRATION_DAYS
                ? parseInt(process.env.LICENSE_DEFAULT_EXPIRATION_DAYS, 10)
                : 365,
            maxActivations: process.env.LICENSE_MAX_ACTIVATIONS
                ? parseInt(process.env.LICENSE_MAX_ACTIVATIONS, 10)
                : 5,
        };
    }
    validateEnvironmentVariables() {
        // Validate LICENSE_SECRET_KEY if provided
        if (process.env.LICENSE_SECRET_KEY) {
            if (typeof process.env.LICENSE_SECRET_KEY !== 'string' || process.env.LICENSE_SECRET_KEY.length < 32) {
                throw new Error('LICENSE_SECRET_KEY must be a string of at least 32 characters');
            }
        }
        // Validate LICENSE_DEFAULT_EXPIRATION_DAYS if provided
        if (process.env.LICENSE_DEFAULT_EXPIRATION_DAYS) {
            const days = parseInt(process.env.LICENSE_DEFAULT_EXPIRATION_DAYS, 10);
            if (isNaN(days) || days <= 0) {
                throw new Error('LICENSE_DEFAULT_EXPIRATION_DAYS must be a positive integer');
            }
        }
        // Validate LICENSE_MAX_ACTIVATIONS if provided
        if (process.env.LICENSE_MAX_ACTIVATIONS) {
            const maxActivations = parseInt(process.env.LICENSE_MAX_ACTIVATIONS, 10);
            if (isNaN(maxActivations) || maxActivations <= 0) {
                throw new Error('LICENSE_MAX_ACTIVATIONS must be a positive integer');
            }
        }
    }
    /**
     * Generates a new license
     * @param userId User ID
     * @param productId Product ID
     * @param features Features included in the license
     * @param options License options
     * @returns Generated license data
     */
    /**
     * Validates input parameters for license generation
     * @param userId User ID
     * @param productId Product ID
     * @throws Error if validation fails
     */
    validateInputs(userId, productId) {
        if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
            throw new Error('Valid userId is required');
        }
        if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
            throw new Error('Valid productId is required');
        }
        // Additional validation for UUID format if applicable
        if (userId.length === 36 && !(0, uuid_1.validate)(userId)) {
            throw new Error('userId must be a valid UUID if provided in UUID format');
        }
    }
    generateLicense(userId, productId, features, options) {
        try {
            // Validate inputs
            this.validateInputs(userId, productId);
            // Validate features array
            if (!Array.isArray(features)) {
                throw new Error('Features must be an array');
            }
            const id = (0, crypto_1.randomBytes)(16).toString('hex');
            const activationKey = this.generateActivationKey(id, userId, productId);
            // Set default expiration if not provided
            let expiresAt = options?.expiresAt;
            if (!expiresAt && this.config.defaultExpirationDays) {
                expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + this.config.defaultExpirationDays);
            }
            // Set default max activations if not provided
            const maxActivations = options?.maxActivations || this.config.maxActivations;
            const license = {
                id,
                userId,
                productId,
                activationKey,
                createdAt: new Date(),
                expiresAt,
                isActive: false,
                features,
                maxActivations,
                activationCount: 0,
                metadata: options?.metadata,
            };
            this.licenses.set(id, license);
            return license;
        }
        catch (error) {
            console.error('Failed to generate license:', error);
            throw error;
        }
    }
    /**
     * Validates a license
     * @param licenseId License ID
     * @param activationKey Activation key
     * @returns Validation result
     */
    validateLicense(licenseId, activationKey) {
        try {
            const license = this.licenses.get(licenseId);
            if (!license) {
                return {
                    isValid: false,
                    message: 'License not found',
                };
            }
            // Check if license is active
            if (!license.isActive) {
                return {
                    isValid: false,
                    isActivated: false,
                    message: 'License is not activated',
                };
            }
            // Check expiration
            if (license.expiresAt && new Date() > license.expiresAt) {
                return {
                    isValid: false,
                    isExpired: true,
                    message: 'License has expired',
                };
            }
            // Verify activation key
            const expectedKey = this.generateActivationKey(license.id, license.userId, license.productId);
            if (activationKey !== expectedKey) {
                return {
                    isValid: false,
                    message: 'Invalid activation key',
                };
            }
            return {
                isValid: true,
                license,
            };
        }
        catch (error) {
            console.error('Failed to validate license:', error);
            return {
                isValid: false,
                message: 'Validation error occurred',
            };
        }
    }
    /**
     * Activates a license
     * @param licenseId License ID
     * @param activationKey Activation key
     * @returns Activation result
     */
    activateLicense(licenseId, activationKey) {
        try {
            const license = this.licenses.get(licenseId);
            if (!license) {
                return {
                    isValid: false,
                    message: 'License not found',
                };
            }
            // Verify activation key
            const expectedKey = this.generateActivationKey(license.id, license.userId, license.productId);
            if (activationKey !== expectedKey) {
                return {
                    isValid: false,
                    message: 'Invalid activation key',
                };
            }
            // Check activation limit
            if (license.maxActivations && license.activationCount >= license.maxActivations) {
                return {
                    isValid: false,
                    message: 'Maximum activations reached',
                };
            }
            // Check expiration
            if (license.expiresAt && new Date() > license.expiresAt) {
                return {
                    isValid: false,
                    isExpired: true,
                    message: 'License has expired',
                };
            }
            // Activate license
            license.isActive = true;
            license.activationCount++;
            return {
                isValid: true,
                license,
            };
        }
        catch (error) {
            console.error('Failed to activate license:', error);
            return {
                isValid: false,
                message: 'Activation error occurred',
            };
        }
    }
    /**
     * Deactivates a license
     * @param licenseId License ID
     * @returns Deactivation result
     */
    deactivateLicense(licenseId) {
        try {
            const license = this.licenses.get(licenseId);
            if (!license) {
                return false;
            }
            license.isActive = false;
            return true;
        }
        catch (error) {
            console.error('Failed to deactivate license:', error);
            return false;
        }
    }
    /**
     * Gets license information
     * @param licenseId License ID
     * @returns License data
     */
    getLicense(licenseId) {
        try {
            return this.licenses.get(licenseId);
        }
        catch (error) {
            console.error('Failed to get license:', error);
            return undefined;
        }
    }
    /**
     * Revokes a license
     * @param licenseId License ID
     * @returns Revocation result
     */
    revokeLicense(licenseId) {
        try {
            return this.licenses.delete(licenseId);
        }
        catch (error) {
            console.error('Failed to revoke license:', error);
            return false;
        }
    }
    /**
     * Lists licenses for a user
     * @param userId User ID
     * @returns List of licenses
     */
    getUserLicenses(userId) {
        try {
            const userLicenses = [];
            for (const license of this.licenses.values()) {
                if (license.userId === userId) {
                    userLicenses.push(license);
                }
            }
            return userLicenses;
        }
        catch (error) {
            console.error('Failed to get user licenses:', error);
            return [];
        }
    }
    /**
     * Updates license metadata
     * @param licenseId License ID
     * @param metadata Metadata to update
     * @returns Update result
     */
    updateLicenseMetadata(licenseId, metadata) {
        try {
            const license = this.licenses.get(licenseId);
            if (!license) {
                return false;
            }
            license.metadata = { ...license.metadata, ...metadata };
            return true;
        }
        catch (error) {
            console.error('Failed to update license metadata:', error);
            return false;
        }
    }
    /**
     * Generates an activation key for a license
     * @param licenseId License ID
     * @param userId User ID
     * @param productId Product ID
     * @returns Activation key
     */
    generateActivationKey(licenseId, userId, productId) {
        // Validate inputs before generating key
        if (!licenseId || typeof licenseId !== 'string' || licenseId.trim().length === 0) {
            throw new Error('Valid licenseId is required');
        }
        this.validateInputs(userId, productId);
        const data = `${licenseId}:${userId}:${productId}`;
        return (0, crypto_1.createHmac)('sha256', this.secretKey)
            .update(data)
            .digest('hex');
    }
}
exports.LicenseManager = LicenseManager;
// Export singleton instance
exports.licenseManager = new LicenseManager();
//# sourceMappingURL=license.manager.js.map