import { describe, it, expect } from "vitest";
// Simple test to verify local handoff functionality

// Use the dist-local directory for imports
import { LocalHandoffSystem } from '../../orchestrator/handoffs.local.ts';

describe('Simple Local Handoff Test', () => {
  it('should create LocalHandoffSystem instance', () => {
    const handoffSystem = new LocalHandoffSystem();
    expect(handoffSystem).toBeDefined();
  });

  it('should register a local agent', () => {
    const handoffSystem = new LocalHandoffSystem();
    const mockAgent = {
      id: 'test-agent-1',
      name: 'Test Agent',
      model: 'llama3.1',
      type: 'ollama' as const
    };
    
    handoffSystem.registerLocalAgent(mockAgent);
    // If we get here without error, the test passes
    expect(true).toBe(true);
  });
});