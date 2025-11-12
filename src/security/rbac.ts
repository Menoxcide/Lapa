/**
 * Role-Based Access Control (RBAC) System for LAPA v1.2.2
 * 
 * This module implements a comprehensive RBAC system for controlling agent
 * permissions and access to resources within the LAPA swarm. It integrates
 * with the consensus voting system and audit logging for security compliance.
 * 
 * Phase 16: Security + RBAC + Red Teaming
 */

import { auditLogger } from '../premium/audit.logger.ts';
import { eventBus } from '../core/event-bus.ts';

// Permission types
export type Permission = 
  | 'agent.create'
  | 'agent.delete'
  | 'agent.modify'
  | 'task.create'
  | 'task.execute'
  | 'task.delete'
  | 'handoff.initiate'
  | 'handoff.accept'
  | 'memory.read'
  | 'memory.write'
  | 'memory.delete'
  | 'consensus.vote'
  | 'consensus.veto'
  | 'security.audit'
  | 'security.redteam'
  | 'code.read'
  | 'code.write'
  | 'code.execute'
  | 'sandbox.create'
  | 'sandbox.destroy'
  | 'mcp.tool.invoke'
  | 'a2a.negotiate'
  | 'a2a.sync';

// Resource types
export type ResourceType = 
  | 'agent'
  | 'task'
  | 'handoff'
  | 'memory'
  | 'consensus'
  | 'code'
  | 'sandbox'
  | 'mcp'
  | 'a2a'
  | 'system';

// Role definition
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Set<Permission>;
  inherits?: string[]; // Role IDs to inherit permissions from
}

// User/Agent principal
export interface Principal {
  id: string;
  type: 'user' | 'agent' | 'system';
  roles: string[]; // Role IDs
  metadata?: Record<string, unknown>;
}

// Access control entry
export interface AccessControlEntry {
  principalId: string;
  resourceId: string;
  resourceType: ResourceType;
  permissions: Set<Permission>;
  conditions?: Record<string, unknown>; // Additional conditions for access
}

// Access check result
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
  grantedPermissions?: Permission[];
  role?: string;
}

// RBAC configuration
export interface RBACConfig {
  defaultRole?: string;
  strictMode?: boolean; // If true, deny by default
  enableAudit?: boolean;
  enableVeto?: boolean; // Enable veto mechanism for critical operations
}

/**
 * LAPA RBAC System
 */
export class RBACSystem {
  private roles: Map<string, Role> = new Map();
  private principals: Map<string, Principal> = new Map();
  private aces: Map<string, AccessControlEntry[]> = new Map(); // Resource ID -> ACEs
  private config: RBACConfig;
  private vetoThreshold: number = 0.83; // 5/6 consensus for veto (83.3%)

  constructor(config: RBACConfig = {}) {
    this.config = {
      defaultRole: 'viewer',
      strictMode: true,
      enableAudit: true,
      enableVeto: true,
      ...config
    };
    
    this.initializeDefaultRoles();
  }

  /**
   * Initializes default roles for the system
   */
  private initializeDefaultRoles(): void {
    // Viewer role - read-only access
    this.createRole({
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access to resources',
      permissions: new Set([
        'code.read',
        'memory.read',
        'task.create',
        'consensus.vote'
      ])
    });

    // Developer role - can create and modify code
    this.createRole({
      id: 'developer',
      name: 'Developer',
      description: 'Can create and modify code, execute tasks',
      permissions: new Set([
        'code.read',
        'code.write',
        'task.create',
        'task.execute',
        'handoff.initiate',
        'memory.read',
        'memory.write',
        'consensus.vote',
        'mcp.tool.invoke'
      ]),
      inherits: ['viewer']
    });

    // Architect role - full development access
    this.createRole({
      id: 'architect',
      name: 'Architect',
      description: 'Full development and design access',
      permissions: new Set([
        'agent.create',
        'agent.modify',
        'code.read',
        'code.write',
        'code.execute',
        'task.create',
        'task.execute',
        'task.delete',
        'handoff.initiate',
        'handoff.accept',
        'memory.read',
        'memory.write',
        'memory.delete',
        'consensus.vote',
        'consensus.veto',
        'mcp.tool.invoke',
        'a2a.negotiate',
        'a2a.sync',
        'sandbox.create'
      ]),
      inherits: ['developer']
    });

    // Reviewer role - can review and veto
    this.createRole({
      id: 'reviewer',
      name: 'Reviewer',
      description: 'Can review code and veto operations',
      permissions: new Set([
        'code.read',
        'task.create',
        'consensus.vote',
        'consensus.veto',
        'security.audit',
        'memory.read'
      ]),
      inherits: ['viewer']
    });

    // Security role - security operations
    this.createRole({
      id: 'security',
      name: 'Security',
      description: 'Security operations and red teaming',
      permissions: new Set([
        'security.audit',
        'security.redteam',
        'consensus.veto',
        'memory.read',
        'code.read',
        'agent.modify'
      ]),
      inherits: ['reviewer']
    });

    // Admin role - full system access
    this.createRole({
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access including agent management',
      permissions: new Set([
        'agent.create',
        'agent.delete',
        'agent.modify',
        'code.read',
        'code.write',
        'code.execute',
        'task.create',
        'task.execute',
        'task.delete',
        'handoff.initiate',
        'handoff.accept',
        'memory.read',
        'memory.write',
        'memory.delete',
        'consensus.vote',
        'consensus.veto',
        'security.audit',
        'security.redteam',
        'sandbox.create',
        'sandbox.destroy',
        'mcp.tool.invoke',
        'a2a.negotiate',
        'a2a.sync'
      ]),
      inherits: ['architect', 'security']
    });
  }

  /**
   * Creates a new role
   */
  createRole(role: Role): void {
    // Resolve inherited permissions
    if (role.inherits && role.inherits.length > 0) {
      const inheritedPermissions = new Set<Permission>(role.permissions);
      for (const inheritedRoleId of role.inherits) {
        const inheritedRole = this.roles.get(inheritedRoleId);
        if (inheritedRole) {
          inheritedRole.permissions.forEach(perm => inheritedPermissions.add(perm));
        }
      }
      role.permissions = inheritedPermissions;
    }

    this.roles.set(role.id, role);
    
    if (this.config.enableAudit) {
      auditLogger.logSecurityEvent('rbac.role.created', {
        roleId: role.id,
        roleName: role.name,
        permissionCount: role.permissions.size
      });
    }
  }

  /**
   * Gets a role by ID
   */
  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  /**
   * Registers a principal (user or agent)
   */
  registerPrincipal(principal: Principal): void {
    // Validate roles exist
    for (const roleId of principal.roles) {
      if (!this.roles.has(roleId)) {
        throw new Error(`Role ${roleId} does not exist`);
      }
    }

    this.principals.set(principal.id, principal);
    
    if (this.config.enableAudit) {
      auditLogger.logSecurityEvent('rbac.principal.registered', {
        principalId: principal.id,
        principalType: principal.type,
        roles: principal.roles
      });
    }
  }

  /**
   * Assigns a role to a principal
   */
  assignRole(principalId: string, roleId: string): void {
    const principal = this.principals.get(principalId);
    if (!principal) {
      throw new Error(`Principal ${principalId} not found`);
    }

    if (!this.roles.has(roleId)) {
      throw new Error(`Role ${roleId} does not exist`);
    }

    if (!principal.roles.includes(roleId)) {
      principal.roles.push(roleId);
      
      if (this.config.enableAudit) {
        auditLogger.logSecurityEvent('rbac.role.assigned', {
          principalId,
          roleId
        });
      }
    }
  }

  /**
   * Removes a role from a principal
   */
  removeRole(principalId: string, roleId: string): void {
    const principal = this.principals.get(principalId);
    if (!principal) {
      throw new Error(`Principal ${principalId} not found`);
    }

    const index = principal.roles.indexOf(roleId);
    if (index > -1) {
      principal.roles.splice(index, 1);
      
      if (this.config.enableAudit) {
        auditLogger.logSecurityEvent('rbac.role.removed', {
          principalId,
          roleId
        });
      }
    }
  }

  /**
   * Gets all permissions for a principal (from all roles)
   */
  private getPrincipalPermissions(principal: Principal): Set<Permission> {
    const permissions = new Set<Permission>();
    
    for (const roleId of principal.roles) {
      const role = this.roles.get(roleId);
      if (role) {
        role.permissions.forEach(perm => permissions.add(perm));
      }
    }

    return permissions;
  }

  /**
   * Checks if a principal has a specific permission
   */
  hasPermission(principalId: string, permission: Permission): boolean {
    const principal = this.principals.get(principalId);
    if (!principal) {
      return !this.config.strictMode; // Deny by default in strict mode
    }

    const permissions = this.getPrincipalPermissions(principal);
    return permissions.has(permission);
  }

  /**
   * Checks access to a resource
   */
  async checkAccess(
    principalId: string,
    resourceId: string,
    resourceType: ResourceType,
    requiredPermission: Permission
  ): Promise<AccessCheckResult> {
    const principal = this.principals.get(principalId);
    
    if (!principal) {
      return {
        allowed: !this.config.strictMode,
        reason: `Principal ${principalId} not found`,
        requiredPermissions: [requiredPermission]
      };
    }

    // Check role-based permissions
    const principalPermissions = this.getPrincipalPermissions(principal);
    const hasRolePermission = principalPermissions.has(requiredPermission);

    // Check resource-specific ACEs
    const resourceAces = this.aces.get(resourceId) || [];
    const hasAcePermission = resourceAces.some(ace => 
      ace.principalId === principalId &&
      ace.resourceType === resourceType &&
      ace.permissions.has(requiredPermission)
    );

    const allowed = hasRolePermission || hasAcePermission;

    // Log access check
    if (this.config.enableAudit) {
      await auditLogger.logSecurityEvent('rbac.access.checked', {
        principalId,
        resourceId,
        resourceType,
        permission: requiredPermission,
        allowed
      });
    }

    // Emit event for veto mechanism
    if (this.config.enableVeto && allowed && this.isCriticalOperation(requiredPermission)) {
      eventBus.emit('rbac.critical.access', {
        principalId,
        resourceId,
        resourceType,
        permission: requiredPermission,
        timestamp: Date.now()
      });
    }

    return {
      allowed,
      reason: allowed ? undefined : 'Insufficient permissions',
      requiredPermissions: [requiredPermission],
      grantedPermissions: allowed ? [requiredPermission] : [],
      role: principal.roles[0] // Return first role for context
    };
  }

  /**
   * Determines if an operation is critical and requires veto
   */
  private isCriticalOperation(permission: Permission): boolean {
    const criticalPermissions: Permission[] = [
      'agent.delete',
      'task.delete',
      'memory.delete',
      'sandbox.destroy',
      'consensus.veto',
      'security.redteam'
    ];
    return criticalPermissions.includes(permission);
  }

  /**
   * Adds an access control entry for a specific resource
   */
  addAccessControlEntry(ace: AccessControlEntry): void {
    if (!this.aces.has(ace.resourceId)) {
      this.aces.set(ace.resourceId, []);
    }
    
    const resourceAces = this.aces.get(ace.resourceId)!;
    
    // Check if ACE already exists
    const existingIndex = resourceAces.findIndex(
      e => e.principalId === ace.principalId && e.resourceType === ace.resourceType
    );

    if (existingIndex > -1) {
      // Merge permissions
      ace.permissions.forEach(perm => resourceAces[existingIndex].permissions.add(perm));
    } else {
      resourceAces.push(ace);
    }

    if (this.config.enableAudit) {
      auditLogger.logSecurityEvent('rbac.ace.added', {
        principalId: ace.principalId,
        resourceId: ace.resourceId,
        resourceType: ace.resourceType,
        permissionCount: ace.permissions.size
      });
    }
  }

  /**
   * Removes an access control entry
   */
  removeAccessControlEntry(principalId: string, resourceId: string, resourceType: ResourceType): void {
    const resourceAces = this.aces.get(resourceId);
    if (!resourceAces) {
      return;
    }

    const index = resourceAces.findIndex(
      ace => ace.principalId === principalId && ace.resourceType === resourceType
    );

    if (index > -1) {
      resourceAces.splice(index, 1);
      
      if (this.config.enableAudit) {
        auditLogger.logSecurityEvent('rbac.ace.removed', {
          principalId,
          resourceId,
          resourceType
        });
      }
    }
  }

  /**
   * Gets all principals with a specific role
   */
  getPrincipalsByRole(roleId: string): Principal[] {
    return Array.from(this.principals.values()).filter(
      principal => principal.roles.includes(roleId)
    );
  }

  /**
   * Gets all roles
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Gets all principals
   */
  getAllPrincipals(): Principal[] {
    return Array.from(this.principals.values());
  }

  /**
   * Validates a principal's access for a critical operation (for veto mechanism)
   */
  async validateCriticalAccess(
    principalId: string,
    resourceId: string,
    resourceType: ResourceType,
    permission: Permission,
    vetoVotes: number,
    totalVotes: number
  ): Promise<AccessCheckResult> {
    const basicCheck = await this.checkAccess(principalId, resourceId, resourceType, permission);
    
    if (!basicCheck.allowed) {
      return basicCheck;
    }

    // Check veto threshold (5/6 consensus = 83.3%)
    if (this.config.enableVeto && this.isCriticalOperation(permission)) {
      const vetoRatio = totalVotes > 0 ? vetoVotes / totalVotes : 0;
      
      if (vetoRatio >= this.vetoThreshold) {
        return {
          allowed: false,
          reason: `Veto threshold reached (${(vetoRatio * 100).toFixed(1)}% >= ${(this.vetoThreshold * 100).toFixed(1)}%)`,
          requiredPermissions: [permission]
        };
      }
    }

    return basicCheck;
  }
}

// Export singleton instance
export const rbacSystem = new RBACSystem();

