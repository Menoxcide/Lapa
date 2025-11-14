/**
 * Security Module Index for LAPA v1.2.2
 * 
 * Phase 16: Security + RBAC + Red Teaming
 * 
 * This module exports all security-related components including RBAC,
 * red teaming, and hallucination detection systems.
 */

export * from './rbac.ts';
export * from './red-team.ts';
export * from './hallucination-check.ts';
export * from './integration.ts';

// Re-export singleton instances for convenience
export { rbacSystem } from './rbac.ts';
export { redTeamSystem } from './red-team.ts';
export { hallucinationCheckSystem } from './hallucination-check.ts';
export { securityIntegration } from './integration.ts';

