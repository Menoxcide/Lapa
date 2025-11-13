/**
 * Agent Wrappers for LAPA Core
 * 
 * This module exports specialized agent wrappers for the helix team patterns.
 */

export { HelixTeamAgentWrapper } from '../agent-tool.ts';
export { ResearcherAgentWrapper } from './researcher-wrapper.ts';
export { CoderAgentWrapper } from './coder-wrapper.ts';
export { TesterAgentWrapper } from './tester-wrapper.ts';

// Multimodal agent wrappers
export * from './multimodal';