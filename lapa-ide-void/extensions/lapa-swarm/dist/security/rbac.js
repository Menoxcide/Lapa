"use strict";
/**
 * Role-Based Access Control (RBAC) System for LAPA v1.2.2
 *
 * This module implements a comprehensive RBAC system for controlling agent
 * permissions and access to resources within the LAPA swarm. It integrates
 * with the consensus voting system and audit logging for security compliance.
 *
 * Phase 16: Security + RBAC + Red Teaming
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacSystem = exports.RBACSystem = void 0;
const audit_logger_ts_1 = require("../premium/audit.logger.ts");
const event_bus_ts_1 = require("../core/event-bus.ts");
/**
 * LAPA RBAC System
 */
class RBACSystem {
    roles = new Map();
    principals = new Map();
    aces = new Map(); // Resource ID -> ACEs
    config;
    vetoThreshold = 0.83; // 5/6 consensus for veto (83.3%)
    constructor(config = {}) {
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
    initializeDefaultRoles() {
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
    createRole(role) {
        // Resolve inherited permissions
        if (role.inherits && role.inherits.length > 0) {
            const inheritedPermissions = new Set(role.permissions);
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
            audit_logger_ts_1.auditLogger.logSecurityEvent('rbac.role.created', {
                roleId: role.id,
                roleName: role.name,
                permissionCount: role.permissions.size
            });
        }
    }
    /**
     * Gets a role by ID
     */
    getRole(roleId) {
        return this.roles.get(roleId);
    }
    /**
     * Registers a principal (user or agent)
     */
    registerPrincipal(principal) {
        // Validate roles exist
        for (const roleId of principal.roles) {
            if (!this.roles.has(roleId)) {
                throw new Error(`Role ${roleId} does not exist`);
            }
        }
        this.principals.set(principal.id, principal);
        if (this.config.enableAudit) {
            audit_logger_ts_1.auditLogger.logSecurityEvent('rbac.principal.registered', {
                principalId: principal.id,
                principalType: principal.type,
                roles: principal.roles
            });
        }
    }
    /**
     * Assigns a role to a principal
     */
    assignRole(principalId, roleId) {
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
                audit_logger_ts_1.auditLogger.logSecurityEvent('rbac.role.assigned', {
                    principalId,
                    roleId
                });
            }
        }
    }
    /**
     * Removes a role from a principal
     */
    removeRole(principalId, roleId) {
        const principal = this.principals.get(principalId);
        if (!principal) {
            throw new Error(`Principal ${principalId} not found`);
        }
        const index = principal.roles.indexOf(roleId);
        if (index > -1) {
            principal.roles.splice(index, 1);
            if (this.config.enableAudit) {
                audit_logger_ts_1.auditLogger.logSecurityEvent('rbac.role.removed', {
                    principalId,
                    roleId
                });
            }
        }
    }
    /**
     * Gets all permissions for a principal (from all roles)
     */
    getPrincipalPermissions(principal) {
        const permissions = new Set();
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
    hasPermission(principalId, permission) {
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
    async checkAccess(principalId, resourceId, resourceType, requiredPermission) {
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
        const hasAcePermission = resourceAces.some(ace => ace.principalId === principalId &&
            ace.resourceType === resourceType &&
            ace.permissions.has(requiredPermission));
        const allowed = hasRolePermission || hasAcePermission;
        // Log access check
        if (this.config.enableAudit) {
            await audit_logger_ts_1.auditLogger.logSecurityEvent('rbac.access.checked', {
                principalId,
                resourceId,
                resourceType,
                permission: requiredPermission,
                allowed
            });
        }
        // Emit event for veto mechanism
        if (this.config.enableVeto && allowed && this.isCriticalOperation(requiredPermission)) {
            event_bus_ts_1.eventBus.emit('rbac.critical.access', {
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
    isCriticalOperation(permission) {
        const criticalPermissions = [
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
    addAccessControlEntry(ace) {
        if (!this.aces.has(ace.resourceId)) {
            this.aces.set(ace.resourceId, []);
        }
        const resourceAces = this.aces.get(ace.resourceId);
        // Check if ACE already exists
        const existingIndex = resourceAces.findIndex(e => e.principalId === ace.principalId && e.resourceType === ace.resourceType);
        if (existingIndex > -1) {
            // Merge permissions
            ace.permissions.forEach(perm => resourceAces[existingIndex].permissions.add(perm));
        }
        else {
            resourceAces.push(ace);
        }
        if (this.config.enableAudit) {
            audit_logger_ts_1.auditLogger.logSecurityEvent('rbac.ace.added', {
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
    removeAccessControlEntry(principalId, resourceId, resourceType) {
        const resourceAces = this.aces.get(resourceId);
        if (!resourceAces) {
            return;
        }
        const index = resourceAces.findIndex(ace => ace.principalId === principalId && ace.resourceType === resourceType);
        if (index > -1) {
            resourceAces.splice(index, 1);
            if (this.config.enableAudit) {
                audit_logger_ts_1.auditLogger.logSecurityEvent('rbac.ace.removed', {
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
    getPrincipalsByRole(roleId) {
        return Array.from(this.principals.values()).filter(principal => principal.roles.includes(roleId));
    }
    /**
     * Gets all roles
     */
    getAllRoles() {
        return Array.from(this.roles.values());
    }
    /**
     * Gets all principals
     */
    getAllPrincipals() {
        return Array.from(this.principals.values());
    }
    /**
     * Validates a principal's access for a critical operation (for veto mechanism)
     */
    async validateCriticalAccess(principalId, resourceId, resourceType, permission, vetoVotes, totalVotes) {
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
exports.RBACSystem = RBACSystem;
// Export singleton instance
exports.rbacSystem = new RBACSystem();
//# sourceMappingURL=rbac.js.map