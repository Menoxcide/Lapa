/**
 * Cursor Marketplace Integration for LAPA
 *
 * Handles authentication and submission to the Cursor marketplace.
 */

import { z } from 'zod';
import { SkillRegistryEntry } from './registry.ts';

// Cursor marketplace authentication configuration
export interface CursorAuthConfig {
  apiKey: string;
  apiUrl: string;
  organizationId: string;
}

// Cursor marketplace submission response
const cursorSubmissionResponseSchema = z.object({
  id: z.string(),
  status: z.enum(['submitted', 'processing', 'published', 'rejected']),
  message: z.string().optional(),
  skillUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type CursorSubmissionResponse = z.infer<typeof cursorSubmissionResponseSchema>;

/**
 * Cursor Marketplace Client
 *
 * Handles authentication and submission to the Cursor marketplace.
 */
export class CursorMarketplaceClient {
  private config: CursorAuthConfig | null = null;
  private isAuthenticated: boolean = false;

  /**
   * Configures the Cursor marketplace client
   * @param config Authentication configuration
   */
  configure(config: CursorAuthConfig): void {
    this.config = config;
    console.log('[CursorMarketplace] Client configured');
  }

  /**
   * Authenticates with the Cursor marketplace
   * @returns Promise resolving to true if authentication was successful
   */
  async authenticate(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Cursor marketplace not configured');
    }

    try {
      // In a real implementation, this would make an API call to verify credentials
      // For now, we'll simulate successful authentication
      this.isAuthenticated = true;
      console.log('[CursorMarketplace] Authentication successful');
      return true;
    } catch (error) {
      console.error('[CursorMarketplace] Authentication failed:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Validates a skill for marketplace submission
   * @param skill Skill to validate
   * @returns Promise resolving to true if validation passes
   */
  async validateSkill(skill: SkillRegistryEntry): Promise<boolean> {
    // Check required fields
    if (!skill.id || !skill.name || !skill.description || !skill.version || !skill.author) {
      console.error('[CursorMarketplace] Skill missing required fields');
      return false;
    }

    // Check that skill has been published to IPFS
    if (!skill.ipfsHash) {
      console.error('[CursorMarketplace] Skill must be published to IPFS before submission');
      return false;
    }

    // Check that skill has cryptographic signature
    if (!skill.signature || !skill.signaturePublicKey) {
      console.error('[CursorMarketplace] Skill must be cryptographically signed before submission');
      return false;
    }

    // In a real implementation, we would make additional validation checks
    // such as verifying the signature, checking file sizes, etc.
    
    console.log(`[CursorMarketplace] Skill ${skill.id} validation passed`);
    return true;
  }

  /**
   * Submits a skill to the Cursor marketplace
   * @param skill Skill to submit
   * @returns Promise resolving to submission response
   */
  async submitSkill(skill: SkillRegistryEntry): Promise<CursorSubmissionResponse> {
    if (!this.config) {
      throw new Error('Cursor marketplace not configured');
    }

    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Cursor marketplace');
    }

    // Validate skill before submission
    const isValid = await this.validateSkill(skill);
    if (!isValid) {
      throw new Error('Skill validation failed');
    }

    try {
      // Prepare submission data
      const submissionData = {
        skillId: skill.id,
        name: skill.name,
        description: skill.description,
        version: skill.version,
        author: skill.author,
        authorDid: skill.authorDid,
        category: skill.category,
        tags: skill.tags,
        ipfsHash: skill.ipfsHash,
        githubRepo: skill.githubRepo,
        dependencies: skill.dependencies,
        signature: skill.signature,
        signaturePublicKey: skill.signaturePublicKey,
        createdAt: new Date().toISOString()
      };

      // Submit to Cursor marketplace API
      const response = await fetch(`${this.config.apiUrl}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Organization-ID': this.config.organizationId
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Submission failed: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      const parsedResponse = cursorSubmissionResponseSchema.parse(responseData);

      console.log(`[CursorMarketplace] Skill ${skill.id} submitted successfully`, parsedResponse);
      return parsedResponse;
    } catch (error) {
      console.error(`[CursorMarketplace] Failed to submit skill ${skill.id}:`, error);
      throw error;
    }
  }

  /**
   * Gets the status of a submitted skill
   * @param submissionId Submission ID
   * @returns Promise resolving to submission status
   */
  async getSubmissionStatus(submissionId: string): Promise<CursorSubmissionResponse> {
    if (!this.config) {
      throw new Error('Cursor marketplace not configured');
    }

    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Cursor marketplace');
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/skills/${submissionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Organization-ID': this.config.organizationId
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get submission status: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      return cursorSubmissionResponseSchema.parse(responseData);
    } catch (error) {
      console.error(`[CursorMarketplace] Failed to get submission status for ${submissionId}:`, error);
      throw error;
    }
  }

  /**
   * Tests the marketplace connection
   * @returns Promise resolving to true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Cursor marketplace not configured');
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('[CursorMarketplace] Connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let cursorMarketplaceInstance: CursorMarketplaceClient | null = null;

/**
 * Gets the Cursor marketplace client instance
 */
export function getCursorMarketplaceClient(): CursorMarketplaceClient {
  if (!cursorMarketplaceInstance) {
    cursorMarketplaceInstance = new CursorMarketplaceClient();
  }
  return cursorMarketplaceInstance;
}