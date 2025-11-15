/**
 * IRM4MLS Meta-Model for Multi-Level Agent Systems
 * 
 * Implements generic agent-based meta-model for multi-level systems
 * Based on: "A Methodology to Engineer and Validate Dynamic Multi-level Multi-agent Based Simulations"
 * 
 * Features:
 * - Multi-level agent modeling
 * - Level relationships and hierarchies
 * - Dynamic abstraction/refinement support
 * - Resource optimization
 */

import { Agent } from '../agents/moe-router.ts';
import { agl } from '../utils/agent-lightning-hooks.ts';

/**
 * Representation types for different abstraction levels
 */
export enum RepresentationType {
  DETAILED = 'detailed',      // Full detail, all properties
  AGGREGATED = 'aggregated',  // Aggregated properties
  ABSTRACT = 'abstract',      // Abstract representation
  MINIMAL = 'minimal'         // Minimal representation
}

/**
 * IRM4MLS Multi-Level Model
 */
export interface IRM4MLSModel {
  id: string;
  name: string;
  levels: Map<number, AgentLevel>;
  relationships: LevelRelationship[];
  abstractionRules: AbstractionRule[];
  refinementRules: RefinementRule[];
  metadata: ModelMetadata;
  createdAt: number;
  updatedAt: number;
}

/**
 * Agent level in multi-level hierarchy
 */
export interface AgentLevel {
  id: string;
  name: string;
  abstractionLevel: number; // 0 = most detailed, higher = more abstract
  agents: Map<string, AgentRepresentation>;
  properties: LevelProperties;
  representation: RepresentationType;
  resourceUsage: ResourceUsage;
}

/**
 * Agent representation at a specific level
 */
export interface AgentRepresentation {
  agentId: string;
  state: AgentState;
  representationType: RepresentationType;
  abstractedProperties: string[];
  detailedProperties: string[];
  lastUpdate: number;
  resourceUsage: ResourceUsage;
}

/**
 * Agent state information
 */
export interface AgentState {
  id: string;
  type: string;
  status: 'active' | 'idle' | 'abstracted' | 'refined';
  workload: number;
  capacity: number;
  currentTask?: string;
  metrics: Record<string, any>;
}

/**
 * Level properties
 */
export interface LevelProperties {
  granularity: 'fine' | 'medium' | 'coarse';
  updateFrequency: number; // milliseconds
  resourceLimit: ResourceUsage;
  abstractionThreshold: number;
  refinementThreshold: number;
}

/**
 * Resource usage metrics
 */
export interface ResourceUsage {
  memory: number; // bytes
  cpu: number; // percentage
  network: number; // bytes
  timestamp: number;
}

/**
 * Relationship between levels
 */
export interface LevelRelationship {
  id: string;
  parentLevel: number;
  childLevel: number;
  relationshipType: 'aggregation' | 'composition' | 'delegation';
  mappingRules: MappingRule[];
}

/**
 * Mapping rule for level relationships
 */
export interface MappingRule {
  sourceProperty: string;
  targetProperty: string;
  transformation: (value: any) => any;
}

/**
 * Abstraction rule
 */
export interface AbstractionRule {
  id: string;
  name: string;
  condition: AbstractionCondition;
  action: AbstractionAction;
  priority: number;
  enabled: boolean;
}

/**
 * Abstraction condition
 */
export interface AbstractionCondition {
  type: 'time' | 'resource' | 'performance' | 'priority' | 'custom';
  parameters: Record<string, unknown>;
  evaluator: (context: AbstractionContext) => Promise<boolean>;
}

/**
 * Abstraction action
 */
export interface AbstractionAction {
  type: 'aggregate' | 'simplify' | 'remove' | 'compress';
  targetLevel: number;
  parameters: Record<string, unknown>;
  executor: (context: AbstractionContext) => Promise<AbstractionResult>;
}

/**
 * Abstraction context
 */
export interface AbstractionContext {
  agent: AgentRepresentation;
  level: AgentLevel;
  model: IRM4MLSModel;
  systemState: Record<string, any>;
}

/**
 * Abstraction result
 */
export interface AbstractionResult {
  success: boolean;
  newRepresentation?: AgentRepresentation;
  resourceSavings?: ResourceUsage;
  informationPreserved: boolean;
  abstractionsApplied?: number;
  targetLevel?: number;
  error?: string;
}

/**
 * Refinement rule
 */
export interface RefinementRule {
  id: string;
  name: string;
  condition: RefinementCondition;
  action: RefinementAction;
  priority: number;
  enabled: boolean;
}

/**
 * Refinement condition
 */
export interface RefinementCondition {
  type: 'task' | 'criticality' | 'error' | 'performance' | 'custom';
  parameters: Record<string, unknown>;
  evaluator: (context: RefinementContext) => Promise<boolean>;
}

/**
 * Refinement action
 */
export interface RefinementAction {
  type: 'decompose' | 'expand' | 'restore' | 'enhance';
  targetLevel: number;
  parameters: Record<string, unknown>;
  executor: (context: RefinementContext) => Promise<RefinementResult>;
}

/**
 * Refinement context
 */
export interface RefinementContext {
  agent: AgentRepresentation;
  level: AgentLevel;
  model: IRM4MLSModel;
  systemState: Record<string, any>;
  trigger: string;
}

/**
 * Refinement result
 */
export interface RefinementResult {
  success: boolean;
  newRepresentation?: AgentRepresentation;
  resourceCost?: ResourceUsage;
  accuracyGained: number;
  refinementsApplied?: number;
  targetLevel?: number;
  error?: string;
}

/**
 * Model metadata
 */
export interface ModelMetadata {
  description?: string;
  version: string;
  author?: string;
  tags?: string[];
  configuration?: Record<string, any>;
}

/**
 * Model configuration for building
 */
export interface ModelConfig {
  id: string;
  name: string;
  levels: LevelConfig[];
  relationships: RelationshipConfig[];
  abstractionRules: AbstractionRule[];
  refinementRules: RefinementRule[];
  metadata?: Partial<ModelMetadata>;
}

/**
 * Level configuration
 */
export interface LevelConfig {
  id: string;
  name: string;
  abstractionLevel: number;
  representation?: RepresentationType;
  properties: Partial<LevelProperties>;
}

/**
 * Relationship configuration
 */
export interface RelationshipConfig {
  parentLevel: number;
  childLevel: number;
  relationshipType: 'aggregation' | 'composition' | 'delegation';
  mappingRules: MappingRule[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * IRM4MLS Model Builder
 */
export class IRM4MLSModelBuilder {
  private model: Partial<IRM4MLSModel>;
  
  constructor() {
    this.model = {
      levels: new Map(),
      relationships: [],
      abstractionRules: [],
      refinementRules: [],
      metadata: {
        version: '1.0.0'
      }
    };
  }
  
  /**
   * Creates multi-level model
   */
  async createModel(config: ModelConfig): Promise<IRM4MLSModel> {
    const spanId = agl.emitSpan('irm4mls.create_model', {
      modelId: config.id,
      levelCount: config.levels.length
    });

    try {
      this.model.id = config.id;
      this.model.name = config.name;
      this.model.metadata = {
        version: '1.0.0',
        ...config.metadata
      };
      this.model.createdAt = Date.now();
      this.model.updatedAt = Date.now();
      
      // Initialize levels
      for (const levelConfig of config.levels) {
        await this.addLevel(levelConfig);
      }
      
      // Define relationships
      for (const relationshipConfig of config.relationships) {
        await this.defineRelationship(relationshipConfig);
      }
      
      // Add abstraction rules
      this.model.abstractionRules = config.abstractionRules || [];
      
      // Add refinement rules
      this.model.refinementRules = config.refinementRules || [];
      
      // Validate model
      const validation = await this.validateModel(this.model as IRM4MLSModel);
      if (!validation.valid) {
        throw new Error(`Model validation failed: ${validation.errors.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Model validation warnings:', validation.warnings);
      }
      
      agl.endSpan(spanId, 'success', {
        levelCount: this.model.levels!.size,
        relationshipCount: this.model.relationships!.length
      });
      
      return this.model as IRM4MLSModel;
    } catch (error) {
      agl.endSpan(spanId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Adds level to model
   */
  async addLevel(levelConfig: LevelConfig): Promise<void> {
    const level: AgentLevel = {
      id: levelConfig.id,
      name: levelConfig.name,
      abstractionLevel: levelConfig.abstractionLevel,
      agents: new Map(),
      properties: {
        granularity: 'medium',
        updateFrequency: 1000,
        resourceLimit: {
          memory: 100 * 1024 * 1024, // 100MB default
          cpu: 50, // 50% default
          network: 10 * 1024 * 1024, // 10MB default
          timestamp: Date.now()
        },
        abstractionThreshold: 0.7,
        refinementThreshold: 0.3,
        ...levelConfig.properties
      },
      representation: levelConfig.representation || RepresentationType.DETAILED,
      resourceUsage: {
        memory: 0,
        cpu: 0,
        network: 0,
        timestamp: Date.now()
      }
    };
    
    this.model.levels!.set(levelConfig.abstractionLevel, level);
  }
  
  /**
   * Defines relationship between levels
   */
  async defineRelationship(relationshipConfig: RelationshipConfig): Promise<void> {
    const relationship: LevelRelationship = {
      id: `rel_${relationshipConfig.parentLevel}_${relationshipConfig.childLevel}`,
      parentLevel: relationshipConfig.parentLevel,
      childLevel: relationshipConfig.childLevel,
      relationshipType: relationshipConfig.relationshipType,
      mappingRules: relationshipConfig.mappingRules
    };
    
    this.model.relationships!.push(relationship);
  }
  
  /**
   * Validates model structure
   */
  async validateModel(model: IRM4MLSModel): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate levels
    if (model.levels.size === 0) {
      errors.push('Model must have at least one level');
    }
    
    // Validate level IDs are unique
    const levelIds = new Set<string>();
    for (const level of model.levels.values()) {
      if (levelIds.has(level.id)) {
        errors.push(`Duplicate level ID: ${level.id}`);
      }
      levelIds.add(level.id);
    }
    
    // Validate relationships
    for (const relationship of model.relationships) {
      if (!model.levels.has(relationship.parentLevel)) {
        errors.push(`Parent level ${relationship.parentLevel} not found`);
      }
      if (!model.levels.has(relationship.childLevel)) {
        errors.push(`Child level ${relationship.childLevel} not found`);
      }
      
      // Check for circular relationships
      if (relationship.parentLevel === relationship.childLevel) {
        errors.push(`Circular relationship detected: level ${relationship.parentLevel}`);
      }
    }
    
    // Validate abstraction/refinement rules
    for (const rule of model.abstractionRules) {
      if (!model.levels.has(rule.action.targetLevel)) {
        errors.push(`Abstraction rule ${rule.id}: target level ${rule.action.targetLevel} not found`);
      }
    }
    
    for (const rule of model.refinementRules) {
      if (!model.levels.has(rule.action.targetLevel)) {
        errors.push(`Refinement rule ${rule.id}: target level ${rule.action.targetLevel} not found`);
      }
    }
    
    // Warnings
    if (model.abstractionRules.length === 0) {
      warnings.push('No abstraction rules defined - dynamic abstraction will not work');
    }
    
    if (model.refinementRules.length === 0) {
      warnings.push('No refinement rules defined - dynamic refinement will not work');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Gets level number from level ID
   */
  private getLevelNumber(levelId: string): number {
    for (const [number, level] of this.model.levels!.entries()) {
      if (level.id === levelId) {
        return number;
      }
    }
    return -1;
  }
}

