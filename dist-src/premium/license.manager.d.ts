/**
 * License Management System for LAPA Premium
 *
 * This module provides license validation, activation, and management
 * for premium features in LAPA Core.
 */
/**
 * License data structure
 */
export interface LicenseData {
    id: string;
    userId: string;
    productId: string;
    activationKey: string;
    createdAt: Date;
    expiresAt?: Date;
    isActive: boolean;
    features: string[];
    maxActivations?: number;
    activationCount: number;
    metadata?: Record<string, any>;
}
/**
 * License validation result
 */
export interface LicenseValidationResult {
    isValid: boolean;
    isExpired?: boolean;
    isActivated?: boolean;
    message?: string;
    license?: LicenseData;
}
/**
 * License Management class
 */
export declare class LicenseManager {
    private secretKey;
    private licenses;
    private config;
    constructor(secretKey?: string, config?: any);
    /**
     * Validates required environment variables
     * @throws Error if validation fails
     */
    /**
     * Loads configuration from environment variables or config object
     * @returns Configuration object
     */
    private loadConfiguration;
    private validateEnvironmentVariables;
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
    private validateInputs;
    generateLicense(userId: string, productId: string, features: string[], options?: {
        expiresAt?: Date;
        maxActivations?: number;
        metadata?: Record<string, any>;
    }): LicenseData;
    /**
     * Validates a license
     * @param licenseId License ID
     * @param activationKey Activation key
     * @returns Validation result
     */
    validateLicense(licenseId: string, activationKey: string): LicenseValidationResult;
    /**
     * Activates a license
     * @param licenseId License ID
     * @param activationKey Activation key
     * @returns Activation result
     */
    activateLicense(licenseId: string, activationKey: string): LicenseValidationResult;
    /**
     * Deactivates a license
     * @param licenseId License ID
     * @returns Deactivation result
     */
    deactivateLicense(licenseId: string): boolean;
    /**
     * Gets license information
     * @param licenseId License ID
     * @returns License data
     */
    getLicense(licenseId: string): LicenseData | undefined;
    /**
     * Revokes a license
     * @param licenseId License ID
     * @returns Revocation result
     */
    revokeLicense(licenseId: string): boolean;
    /**
     * Lists licenses for a user
     * @param userId User ID
     * @returns List of licenses
     */
    getUserLicenses(userId: string): LicenseData[];
    /**
     * Updates license metadata
     * @param licenseId License ID
     * @param metadata Metadata to update
     * @returns Update result
     */
    updateLicenseMetadata(licenseId: string, metadata: Record<string, any>): boolean;
    /**
     * Generates an activation key for a license
     * @param licenseId License ID
     * @param userId User ID
     * @param productId Product ID
     * @returns Activation key
     */
    private generateActivationKey;
}
export declare const licenseManager: LicenseManager;
