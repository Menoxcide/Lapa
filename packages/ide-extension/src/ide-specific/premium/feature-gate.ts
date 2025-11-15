/**
 * Feature Gate System for LAPA-VOID
 * 
 * Provides premium feature gating based on license validation.
 * Free tier features are always available, premium features require valid license.
 */

import { LicenseManager, LicenseData, LicenseValidationResult } from './license.manager';
import { join } from 'path';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';

/**
 * Premium feature identifiers
 */
export enum PremiumFeature {
  FULL_HELIX = 'full_helix',           // 16-agent Helix system
  CLOUD_INFERENCE = 'cloud_inference', // Cloud inference scaling
  ADVANCED_MEMORY = 'advanced_memory', // 99.5% recall memory
  E2B_SANDBOX = 'e2b_sandbox',         // E2B sandbox access
  TEAM_COLLAB = 'team_collab',         // Multi-user collaboration
  CLOUD_NIM = 'cloud_nim',             // Cloud NIM integration
  ADVANCED_OBS = 'advanced_obs',       // Full observability suite
  PREMIUM_SKILLS = 'premium_skills',   // Premium skills access
  BLOB_STORAGE = 'blob_storage',       // Vercel Blob storage
  TEAM_STATE = 'team_state',           // Team state sync
  AUDIT_LOGGING = 'audit_logging',     // Audit logging
}

/**
 * Free tier limits
 */
export const FREE_TIER_LIMITS = {
  MAX_AGENTS: 4,
  MAX_MEMORY_RECALL: 0.85, // 85% recall for free tier
  CLOUD_INFERENCE: false,
  E2B_SANDBOX: false,
  TEAM_COLLAB: false,
} as const;

/**
 * Feature Gate Manager
 */
export class FeatureGate {
  private static instance: FeatureGate;
  private licenseManager: LicenseManager;
  private licensePath: string;
  private cachedLicense: LicenseData | null = null;
  private cacheValidUntil: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Initialize license manager
    const secretKey = process.env.LICENSE_SECRET_KEY || this.getDefaultSecretKey();
    this.licenseManager = new LicenseManager(secretKey);
    
    // Set license storage path: ~/.lapa/licenses/
    const homeDir = homedir();
    this.licensePath = join(homeDir, '.lapa', 'licenses', 'lapa-void.license');
    
    // Ensure license directory exists
    const licenseDir = join(homeDir, '.lapa', 'licenses');
    if (!existsSync(licenseDir)) {
      mkdirSync(licenseDir, { recursive: true });
    }
    
    // Load license on initialization
    this.loadLicense();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FeatureGate {
    if (!FeatureGate.instance) {
      FeatureGate.instance = new FeatureGate();
    }
    return FeatureGate.instance;
  }

  /**
   * Get default secret key (for local validation)
   */
  private getDefaultSecretKey(): string {
    // Generate a consistent secret key for local validation
    // In production, this should come from environment variable
    return 'lapa-void-default-secret-key-change-in-production';
  }

  /**
   * Load license from disk
   */
  private loadLicense(): void {
    try {
      if (existsSync(this.licensePath)) {
        const licenseData = JSON.parse(readFileSync(this.licensePath, 'utf-8'));
        this.cachedLicense = licenseData;
        this.cacheValidUntil = Date.now() + this.CACHE_TTL;
      }
    } catch (error) {
      console.warn('[FeatureGate] Failed to load license:', error);
      this.cachedLicense = null;
    }
  }

  /**
   * Save license to disk
   */
  private saveLicense(license: LicenseData): void {
    try {
      const licenseDir = join(homedir(), '.lapa', 'licenses');
      if (!existsSync(licenseDir)) {
        mkdirSync(licenseDir, { recursive: true });
      }
      writeFileSync(this.licensePath, JSON.stringify(license, null, 2));
      this.cachedLicense = license;
      this.cacheValidUntil = Date.now() + this.CACHE_TTL;
    } catch (error) {
      console.error('[FeatureGate] Failed to save license:', error);
    }
  }

  /**
   * Validate license
   */
  private validateLicense(): LicenseValidationResult {
    // Check cache first
    if (this.cachedLicense && Date.now() < this.cacheValidUntil) {
      // Validate cached license
      const result = this.licenseManager.validateLicense(
        this.cachedLicense.id,
        this.cachedLicense.activationKey
      );
      if (result.isValid) {
        return result;
      }
    }

    // Load from disk
    this.loadLicense();
    
    if (!this.cachedLicense) {
      return {
        isValid: false,
        message: 'No license found',
      };
    }

    // Validate license
    const result = this.licenseManager.validateLicense(
      this.cachedLicense.id,
      this.cachedLicense.activationKey
    );

    return result;
  }

  /**
   * Check if a premium feature is enabled
   */
  public isPremiumFeatureEnabled(feature: PremiumFeature): boolean {
    // Free tier features are always enabled
    // Premium features require valid license
    
    const validation = this.validateLicense();
    
    if (!validation.isValid || !validation.license) {
      return false;
    }

    // Check if feature is in license features list
    return validation.license.features.includes(feature) || 
           validation.license.features.includes('all');
  }

  /**
   * Check if user has premium license
   */
  public hasPremiumLicense(): boolean {
    const validation = this.validateLicense();
    return validation.isValid === true && validation.license !== undefined;
  }

  /**
   * Get maximum agents allowed (free: 4, pro: 16)
   */
  public getMaxAgents(): number {
    if (this.isPremiumFeatureEnabled(PremiumFeature.FULL_HELIX)) {
      return 16;
    }
    return FREE_TIER_LIMITS.MAX_AGENTS;
  }

  /**
   * Check if cloud inference is enabled
   */
  public isCloudInferenceEnabled(): boolean {
    return this.isPremiumFeatureEnabled(PremiumFeature.CLOUD_INFERENCE);
  }

  /**
   * Check if advanced memory is enabled
   */
  public isAdvancedMemoryEnabled(): boolean {
    return this.isPremiumFeatureEnabled(PremiumFeature.ADVANCED_MEMORY);
  }

  /**
   * Get memory recall target (free: 85%, pro: 99.5%)
   */
  public getMemoryRecallTarget(): number {
    if (this.isAdvancedMemoryEnabled()) {
      return 0.995; // 99.5% for premium
    }
    return FREE_TIER_LIMITS.MAX_MEMORY_RECALL;
  }

  /**
   * Check if E2B sandbox is enabled
   */
  public isE2BSandboxEnabled(): boolean {
    return this.isPremiumFeatureEnabled(PremiumFeature.E2B_SANDBOX);
  }

  /**
   * Check if team collaboration is enabled
   */
  public isTeamCollabEnabled(): boolean {
    return this.isPremiumFeatureEnabled(PremiumFeature.TEAM_COLLAB);
  }

  /**
   * Activate license from activation key
   */
  public async activateLicense(licenseId: string, activationKey: string): Promise<boolean> {
    try {
      const validation = this.licenseManager.validateLicense(licenseId, activationKey);
      
      if (validation.isValid && validation.license) {
        // Activate license
        const activation = this.licenseManager.activateLicense(licenseId, activationKey);
        
        if (activation.isActivated && activation.license) {
          // Save to disk
          this.saveLicense(activation.license);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[FeatureGate] Failed to activate license:', error);
      return false;
    }
  }

  /**
   * Get license information (without sensitive data)
   */
  public getLicenseInfo(): {
    hasLicense: boolean;
    isActive: boolean;
    expiresAt?: Date;
    features: string[];
  } {
    const validation = this.validateLicense();
    
    if (!validation.isValid || !validation.license) {
      return {
        hasLicense: false,
        isActive: false,
        features: [],
      };
    }

    return {
      hasLicense: true,
      isActive: validation.license.isActive,
      expiresAt: validation.license.expiresAt,
      features: validation.license.features,
    };
  }

  /**
   * Clear license cache (force reload)
   */
  public clearCache(): void {
    this.cachedLicense = null;
    this.cacheValidUntil = 0;
    this.loadLicense();
  }
}

/**
 * Export singleton instance getter
 */
export const featureGate = FeatureGate.getInstance();

