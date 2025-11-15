/**
 * Convention System Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConventionSystem,
  Convention,
  ConventionContext,
  ConventionAction,
  AgentAction
} from '../../coordination/conventions.ts';

describe('ConventionSystem', () => {
  let conventionSystem: ConventionSystem;
  let testConvention: Convention;

  beforeEach(() => {
    conventionSystem = new ConventionSystem();

    testConvention = {
      id: 'conv-1',
      name: 'Task Signaling',
      type: 'signaling',
      description: 'Signal task availability',
      actionSpace: [
        {
          id: 'action-1',
          name: 'Signal Task',
          conventionId: 'conv-1',
          parameters: {},
          execution: async (context) => ({
            success: true,
            action: 'signal',
            coordination: {
              type: 'task_available',
              sender: context.agentId,
              receivers: [],
              content: {}
            },
            communicationReduction: 0.5,
            cooperationImprovement: 0.7
          })
        }
      ],
      conditions: [
        {
          type: 'state',
          evaluator: async (context) => true
        }
      ],
      effects: [],
      priority: 1
    };
  });

  it('should register convention', async () => {
    await conventionSystem.registerConvention(testConvention);
    
    // Convention should be registered (no direct getter, but execution should work)
    const context: ConventionContext = {
      agentId: 'agent-1',
      systemState: {},
      otherAgents: [],
      communicationConstraints: {
        bandwidth: 1000,
        latency: 100,
        frequency: 10
      },
      partialObservability: {
        visibleAgents: [],
        visibleTasks: [],
        informationQuality: 0.8
      }
    };

    const result = await conventionSystem.executeConvention(
      'conv-1',
      'action-1',
      context
    );

    expect(result.success).toBe(true);
  });

  it('should execute convention action', async () => {
    await conventionSystem.registerConvention(testConvention);

    const context: ConventionContext = {
      agentId: 'agent-1',
      systemState: {},
      otherAgents: [],
      communicationConstraints: {
        bandwidth: 1000,
        latency: 100,
        frequency: 10
      },
      partialObservability: {
        visibleAgents: [],
        visibleTasks: [],
        informationQuality: 0.8
      }
    };

    const result = await conventionSystem.executeConvention(
      'conv-1',
      'action-1',
      context
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.communicationReduction).toBeGreaterThanOrEqual(0);
    expect(result.cooperationImprovement).toBeGreaterThanOrEqual(0);
  });

  it('should augment action space', () => {
    const baseActions: AgentAction[] = [
      {
        id: 'base-1',
        name: 'Base Action',
        type: 'base',
        parameters: {}
      }
    ];

    const augmented = conventionSystem.augmentActionSpace(
      baseActions,
      [testConvention]
    );

    expect(augmented.baseActions.length).toBe(1);
    expect(augmented.conventionActions.length).toBe(1);
    expect(augmented.totalActions.length).toBe(2);
    expect(augmented.totalActions.some(a => a.type === 'convention')).toBe(true);
  });
});

