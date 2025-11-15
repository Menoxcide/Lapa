/**
 * IRM4MLS Meta-Model Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  IRM4MLSModelBuilder,
  RepresentationType,
  ModelConfig
} from '../../modeling/irm4mls-meta-model.ts';

describe('IRM4MLSModelBuilder', () => {
  let builder: IRM4MLSModelBuilder;

  beforeEach(() => {
    builder = new IRM4MLSModelBuilder();
  });

  it('should create multi-level model', async () => {
    const config: ModelConfig = {
      id: 'test-model',
      name: 'Test Model',
      levels: [
        {
          id: 'level-0',
          name: 'Detail Level',
          abstractionLevel: 0,
          representation: RepresentationType.DETAILED,
          properties: {
            granularity: 'fine',
            updateFrequency: 100,
            abstractionThreshold: 0.7,
            refinementThreshold: 0.3
          }
        },
        {
          id: 'level-1',
          name: 'Aggregate Level',
          abstractionLevel: 1,
          representation: RepresentationType.AGGREGATED,
          properties: {
            granularity: 'medium',
            updateFrequency: 1000,
            abstractionThreshold: 0.7,
            refinementThreshold: 0.3
          }
        }
      ],
      relationships: [
        {
          parentLevel: 1,
          childLevel: 0,
          relationshipType: 'aggregation',
          mappingRules: []
        }
      ],
      abstractionRules: [],
      refinementRules: []
    };

    const model = await builder.createModel(config);

    expect(model).toBeDefined();
    expect(model.id).toBe('test-model');
    expect(model.levels.size).toBe(2);
    expect(model.relationships.length).toBe(1);
  });

  it('should validate model structure', async () => {
    const config: ModelConfig = {
      id: 'invalid-model',
      name: 'Invalid Model',
      levels: [],
      relationships: [],
      abstractionRules: [],
      refinementRules: []
    };

    await expect(builder.createModel(config)).rejects.toThrow();
  });

  it('should add level to model', async () => {
    const config: ModelConfig = {
      id: 'test-model',
      name: 'Test Model',
      levels: [
        {
          id: 'level-0',
          name: 'Level 0',
          abstractionLevel: 0,
          properties: {}
        }
      ],
      relationships: [],
      abstractionRules: [],
      refinementRules: []
    };

    const model = await builder.createModel(config);
    expect(model.levels.has(0)).toBe(true);
  });
});

