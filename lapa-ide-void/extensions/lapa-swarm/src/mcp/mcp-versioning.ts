/**
 * MCP Tool Versioning System for LAPA v1.0.0
 * 
 * This module provides comprehensive tool versioning for MCP servers:
 * - Tool version tracking and management
 * - Backward compatibility support
 * - Deprecation mechanism
 * - Migration utilities
 * - Version discovery in tool list
 * 
 * Phase: MCP Tool Management
 */

import { eventBus } from '../core/event-bus.ts';
import { z } from 'zod';
import type { LAPAEvent } from '../core/types/event-types.ts';

// Semantic versioning pattern: MAJOR.MINOR.PATCH
const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9-]+))?(?:\+([a-zA-Z0-9-]+))?$/;

// Tool version
export interface ToolVersion {
  version: string; // Semantic version (e.g., "1.0.0")
  releasedAt: number; // Timestamp
  deprecated?: boolean;
  deprecatedAt?: number;
  deprecatedReason?: string;
  replacement?: string; // Replacement tool name
  migrationGuide?: string; // URL or markdown guide
  breakingChanges?: string[]; // List of breaking changes
  compatibility: {
    minServerVersion?: string;
    maxServerVersion?: string;
    requiredPermissions?: string[];
  };
}

// Tool version metadata
export interface ToolVersionMetadata {
  toolName: string;
  serverName: string;
  currentVersion: string;
  versions: Map<string, ToolVersion>; // version -> ToolVersion
  defaultVersion: string; // Default version to use if not specified
  stableVersions: string[]; // Stable versions (non-prerelease)
  latestVersion: string;
  latestStableVersion: string;
}

// Deprecation info
export interface ToolDeprecationInfo {
  toolName: string;
  version: string;
  deprecated: boolean;
  deprecatedAt?: number;
  deprecatedReason?: string;
  replacement?: string;
  migrationGuide?: string;
  sunsetDate?: number; // Date when tool will be removed
}

// Migration result
export interface ToolMigrationResult {
  success: boolean;
  toolName: string;
  fromVersion: string;
  toVersion: string;
  migrated: boolean;
  data?: Record<string, unknown>;
  warnings?: string[];
  errors?: string[];
}

// Version compatibility check result
export interface VersionCompatibilityResult {
  compatible: boolean;
  toolName: string;
  requestedVersion: string;
  availableVersions: string[];
  recommendedVersion?: string;
  warnings?: string[];
  errors?: string[];
}

/**
 * MCP Tool Version Manager
 * 
 * Provides comprehensive tool versioning, deprecation, and migration support.
 */
export class MCPToolVersionManager {
  private toolVersions: Map<string, ToolVersionMetadata> = new Map(); // toolName -> metadata
  private deprecationCache: Map<string, ToolDeprecationInfo> = new Map();
  private migrationStrategies: Map<string, (args: Record<string, unknown>, fromVersion: string, toVersion: string) => Promise<ToolMigrationResult>> = new Map();

  /**
   * Register a tool version
   */
  registerToolVersion(
    serverName: string,
    toolName: string,
    version: string,
    versionInfo: Omit<ToolVersion, 'version'>
  ): void {
    const key = `${serverName}:${toolName}`;
    
    if (!this.toolVersions.has(key)) {
      this.toolVersions.set(key, {
        toolName,
        serverName,
        currentVersion: version,
        versions: new Map(),
        defaultVersion: version,
        stableVersions: [],
        latestVersion: version,
        latestStableVersion: version
      });
    }

    const metadata = this.toolVersions.get(key)!;
    metadata.versions.set(version, {
      version,
      ...versionInfo
    });

    // Update latest version
    const versions = Array.from(metadata.versions.keys()).sort(this.compareVersions);
    metadata.latestVersion = versions[versions.length - 1];

    // Update stable versions
    const stableVersions = versions.filter(v => !this.isPrerelease(v));
    if (stableVersions.length > 0) {
      metadata.latestStableVersion = stableVersions[stableVersions.length - 1];
      metadata.stableVersions = stableVersions;
    }

    // Update default version to latest stable if not set
    if (!metadata.defaultVersion || this.isPrerelease(metadata.defaultVersion)) {
      metadata.defaultVersion = metadata.latestStableVersion;
    }

    // Update deprecation cache
    if (versionInfo.deprecated) {
      this.deprecationCache.set(`${key}:${version}`, {
        toolName,
        version,
        deprecated: true,
        deprecatedAt: versionInfo.deprecatedAt,
        deprecatedReason: versionInfo.deprecatedReason,
        replacement: versionInfo.replacement,
        migrationGuide: versionInfo.migrationGuide,
        sunsetDate: versionInfo.deprecatedAt ? versionInfo.deprecatedAt + (90 * 24 * 60 * 60 * 1000) : undefined // 90 days default
      });
    }
  }

  /**
   * Get tool version metadata
   */
  getToolVersionMetadata(serverName: string, toolName: string): ToolVersionMetadata | undefined {
    return this.toolVersions.get(`${serverName}:${toolName}`);
  }

  /**
   * Get available versions for a tool
   */
  getAvailableVersions(serverName: string, toolName: string): string[] {
    const metadata = this.getToolVersionMetadata(serverName, toolName);
    if (!metadata) {
      return [];
    }
    return Array.from(metadata.versions.keys()).sort(this.compareVersions);
  }

  /**
   * Get recommended version for a tool
   */
  getRecommendedVersion(serverName: string, toolName: string, preferStable: boolean = true): string | undefined {
    const metadata = this.getToolVersionMetadata(serverName, toolName);
    if (!metadata) {
      return undefined;
    }

    if (preferStable) {
      return metadata.latestStableVersion;
    }
    return metadata.latestVersion;
  }

  /**
   * Check version compatibility
   */
  checkVersionCompatibility(
    serverName: string,
    toolName: string,
    requestedVersion: string,
    serverVersion?: string
  ): VersionCompatibilityResult {
    const metadata = this.getToolVersionMetadata(serverName, toolName);
    
    if (!metadata) {
      return {
        compatible: false,
        toolName,
        requestedVersion,
        availableVersions: [],
        errors: [`Tool '${toolName}' not found in server '${serverName}'`]
      };
    }

    const availableVersions = this.getAvailableVersions(serverName, toolName);
    
    if (!availableVersions.includes(requestedVersion)) {
      const recommended = this.getRecommendedVersion(serverName, toolName, true);
      return {
        compatible: false,
        toolName,
        requestedVersion,
        availableVersions,
        recommendedVersion: recommended,
        errors: [`Version '${requestedVersion}' not available. Available versions: ${availableVersions.join(', ')}`],
        warnings: recommended ? [`Recommended version: ${recommended}`] : undefined
      };
    }

    const versionInfo = metadata.versions.get(requestedVersion);
    const warnings: string[] = [];

    // Check deprecation
    if (versionInfo?.deprecated) {
      warnings.push(`Version '${requestedVersion}' is deprecated`);
      if (versionInfo.deprecatedReason) {
        warnings.push(`Reason: ${versionInfo.deprecatedReason}`);
      }
      if (versionInfo.replacement) {
        warnings.push(`Use '${versionInfo.replacement}' instead`);
      }
    }

    // Check server version compatibility
    if (serverVersion && versionInfo?.compatibility) {
      if (versionInfo.compatibility.minServerVersion) {
        if (this.compareVersions(serverVersion, versionInfo.compatibility.minServerVersion) < 0) {
          return {
            compatible: false,
            toolName,
            requestedVersion,
            availableVersions,
            errors: [`Server version '${serverVersion}' is below minimum required '${versionInfo.compatibility.minServerVersion}'`]
          };
        }
      }

      if (versionInfo.compatibility.maxServerVersion) {
        if (this.compareVersions(serverVersion, versionInfo.compatibility.maxServerVersion) > 0) {
          warnings.push(`Server version '${serverVersion}' is above maximum tested '${versionInfo.compatibility.maxServerVersion}'`);
        }
      }
    }

    return {
      compatible: true,
      toolName,
      requestedVersion,
      availableVersions,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Get deprecation info for a tool version
   */
  getDeprecationInfo(serverName: string, toolName: string, version?: string): ToolDeprecationInfo | undefined {
    const metadata = this.getToolVersionMetadata(serverName, toolName);
    if (!metadata) {
      return undefined;
    }

    const versionToCheck = version || metadata.defaultVersion;
    const versionInfo = metadata.versions.get(versionToCheck);
    
    if (!versionInfo?.deprecated) {
      return {
        toolName,
        version: versionToCheck,
        deprecated: false
      };
    }

    return {
      toolName,
      version: versionToCheck,
      deprecated: true,
      deprecatedAt: versionInfo.deprecatedAt,
      deprecatedReason: versionInfo.deprecatedReason,
      replacement: versionInfo.replacement,
      migrationGuide: versionInfo.migrationGuide,
      sunsetDate: versionInfo.deprecatedAt ? versionInfo.deprecatedAt + (90 * 24 * 60 * 60 * 1000) : undefined
    };
  }

  /**
   * Deprecate a tool version
   */
  deprecateToolVersion(
    serverName: string,
    toolName: string,
    version: string,
    reason?: string,
    replacement?: string,
    migrationGuide?: string
  ): void {
    const metadata = this.getToolVersionMetadata(serverName, toolName);
    if (!metadata) {
      throw new Error(`Tool '${toolName}' not found in server '${serverName}'`);
    }

    const versionInfo = metadata.versions.get(version);
    if (!versionInfo) {
      throw new Error(`Version '${version}' not found for tool '${toolName}'`);
    }

    versionInfo.deprecated = true;
    versionInfo.deprecatedAt = Date.now();
    versionInfo.deprecatedReason = reason;
    versionInfo.replacement = replacement;
    versionInfo.migrationGuide = migrationGuide;

    // Update deprecation cache
    const key = `${serverName}:${toolName}:${version}`;
    this.deprecationCache.set(key, {
      toolName,
      version,
      deprecated: true,
      deprecatedAt: versionInfo.deprecatedAt,
      deprecatedReason: reason,
      replacement,
      migrationGuide,
      sunsetDate: versionInfo.deprecatedAt + (90 * 24 * 60 * 60 * 1000)
    });

    // Publish deprecation event
    eventBus.publish({
      id: `mcp-tool-deprecated-${Date.now()}`,
      type: 'mcp.tool.deprecated',
      timestamp: Date.now(),
      source: 'mcp-versioning',
      payload: {
        serverName,
        toolName,
        version,
        reason,
        replacement,
        migrationGuide
      }
    } as LAPAEvent).catch(console.error);
  }

  /**
   * Register a migration strategy for tool version upgrade
   */
  registerMigrationStrategy(
    serverName: string,
    toolName: string,
    fromVersion: string,
    toVersion: string,
    strategy: (args: Record<string, unknown>, fromVersion: string, toVersion: string) => Promise<ToolMigrationResult>
  ): void {
    const key = `${serverName}:${toolName}:${fromVersion}:${toVersion}`;
    this.migrationStrategies.set(key, strategy);
  }

  /**
   * Migrate tool arguments from one version to another
   */
  async migrateToolArguments(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>,
    fromVersion: string,
    toVersion: string
  ): Promise<ToolMigrationResult> {
    const key = `${serverName}:${toolName}:${fromVersion}:${toVersion}`;
    const strategy = this.migrationStrategies.get(key);

    if (!strategy) {
      // No migration strategy - return unchanged args
      return {
        success: true,
        toolName,
        fromVersion,
        toVersion,
        migrated: false,
        data: args,
        warnings: [`No migration strategy found. Arguments unchanged.`]
      };
    }

    try {
      const result = await strategy(args, fromVersion, toVersion);
      
      // Publish migration event
      await eventBus.publish({
        id: `mcp-tool-migrated-${Date.now()}`,
        type: 'mcp.tool.migrated',
        timestamp: Date.now(),
        source: 'mcp-versioning',
        payload: {
          serverName,
          toolName,
          fromVersion,
          toVersion,
          success: result.success,
          warnings: result.warnings,
          errors: result.errors
        }
      } as LAPAEvent).catch(console.error);

      return result;
    } catch (error) {
      return {
        success: false,
        toolName,
        fromVersion,
        toVersion,
        migrated: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Get tool list with version information
   */
  getToolListWithVersions(serverName: string): Array<{
    name: string;
    description: string;
    versions: string[];
    defaultVersion: string;
    latestVersion: string;
    latestStableVersion: string;
    deprecated: boolean;
    deprecationInfo?: ToolDeprecationInfo;
  }> {
    const tools: Array<{
      name: string;
      description: string;
      versions: string[];
      defaultVersion: string;
      latestVersion: string;
      latestStableVersion: string;
      deprecated: boolean;
      deprecationInfo?: ToolDeprecationInfo;
    }> = [];

    for (const [key, metadata] of this.toolVersions) {
      if (metadata.serverName !== serverName) {
        continue;
      }

      const latestVersionInfo = metadata.versions.get(metadata.latestVersion);
      const deprecationInfo = this.getDeprecationInfo(serverName, metadata.toolName);

      tools.push({
        name: metadata.toolName,
        description: '', // Could be extended with tool descriptions
        versions: Array.from(metadata.versions.keys()).sort(this.compareVersions),
        defaultVersion: metadata.defaultVersion,
        latestVersion: metadata.latestVersion,
        latestStableVersion: metadata.latestStableVersion,
        deprecated: latestVersionInfo?.deprecated || false,
        deprecationInfo
      });
    }

    return tools;
  }

  // Private helper methods

  /**
   * Compare two semantic versions
   * Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parse1 = this.parseVersion(v1);
    const parse2 = this.parseVersion(v2);

    if (!parse1 || !parse2) {
      // Fallback to string comparison if parsing fails
      return v1.localeCompare(v2);
    }

    // Compare major version
    if (parse1.major !== parse2.major) {
      return parse1.major - parse2.major;
    }

    // Compare minor version
    if (parse1.minor !== parse2.minor) {
      return parse1.minor - parse2.minor;
    }

    // Compare patch version
    if (parse1.patch !== parse2.patch) {
      return parse1.patch - parse2.patch;
    }

    // Compare prerelease
    if (parse1.prerelease && !parse2.prerelease) {
      return -1; // Prerelease is less than stable
    }
    if (!parse1.prerelease && parse2.prerelease) {
      return 1; // Stable is greater than prerelease
    }
    if (parse1.prerelease && parse2.prerelease) {
      return parse1.prerelease.localeCompare(parse2.prerelease);
    }

    // Compare build
    if (parse1.build && parse2.build) {
      return parse1.build.localeCompare(parse2.build);
    }

    return 0;
  }

  /**
   * Parse semantic version
   */
  private parseVersion(version: string): {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
  } | null {
    const match = version.match(SEMVER_PATTERN);
    if (!match) {
      return null;
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5]
    };
  }

  /**
   * Check if version is prerelease
   */
  private isPrerelease(version: string): boolean {
    const parsed = this.parseVersion(version);
    return parsed?.prerelease !== undefined;
  }
}

// Export singleton instance
export const mcpToolVersionManager = new MCPToolVersionManager();

