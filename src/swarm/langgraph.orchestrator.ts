/**
 * LangGraph Orchestration for LAPA Swarm Intelligence
 * 
 * This module implements the LangGraph orchestration layer for coordinating
 * multiple agents in the LAPA swarm. It manages agent interactions, state
 * transitions, and workflow execution using a graph-based approach.
 */

import { z } from 'zod';

// Graph node representing an agent or process
export interface GraphNode {
  id: string;
  type: 'agent' | 'process' | 'decision';
  label: string;
  agentType?: string;
  metadata?: Record<string, any>;
}

// Graph edge representing a connection between nodes
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  metadata?: Record<string, any>;
}

// Workflow state
export interface WorkflowState {
  nodeId: string;
  context: Record<string, unknown>;
  history: Array<{
    nodeId: string;
    timestamp: Date;
    input?: unknown;
    output?: unknown;
  }>;
}

// Orchestration result
export interface OrchestrationResult {
  success: boolean;
  finalState: WorkflowState;
  output?: unknown;
  executionPath: string[];
  error?: string;
}

// Zod schema for GraphNode validation
const graphNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['agent', 'process', 'decision']),
  label: z.string(),
  agentType: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Zod schema for GraphEdge validation
const graphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  condition: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Zod schema for WorkflowState validation
const workflowStateSchema = z.object({
  nodeId: z.string(),
  context: z.record(z.unknown()),
  history: z.array(z.object({
    nodeId: z.string(),
    timestamp: z.date(),
    input: z.unknown().optional(),
    output: z.unknown().optional()
  }))
});

// Zod schema for validating state transitions
const stateTransitionSchema = z.object({
  fromNodeId: z.string(),
  toNodeId: z.string(),
  timestamp: z.date(),
  contextBefore: z.record(z.unknown()),
  contextAfter: z.record(z.unknown())
});

// Zod schema for OrchestrationResult validation
const orchestrationResultSchema = z.object({
  success: z.boolean(),
  finalState: workflowStateSchema, // Use the actual schema instead of z.any()
  output: z.unknown().optional(),
  executionPath: z.array(z.string()),
  error: z.string().optional()
});

/**
 * LAPA LangGraph Orchestrator
 */
export class LangGraphOrchestrator {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private initialState: string;
  
  constructor(initialState: string) {
    // Validate initial state is not empty
    if (!initialState || initialState.trim() === '') {
      throw new Error('Initial state cannot be empty');
    }
    this.initialState = initialState;
  }
  
  /**
   * Adds a node to the graph
   * @param node The node to add
   */
  addNode(node: GraphNode): void {
    // Validate node with Zod schema
    const validatedNode = graphNodeSchema.parse(node);
    this.nodes.set(validatedNode.id, validatedNode);
    console.log(`Added node: ${validatedNode.label} (${validatedNode.id})`);
  }
  
  /**
   * Adds an edge to the graph
   * @param edge The edge to add
   */
  addEdge(edge: GraphEdge): void {
    // Validate edge with Zod schema
    const validatedEdge = graphEdgeSchema.parse(edge);
    this.edges.set(validatedEdge.id, validatedEdge);
    console.log(`Added edge: ${validatedEdge.source} -> ${validatedEdge.target}`);
  }
  
  /**
   * Gets all nodes in the graph
   * @returns Array of nodes
   */
  getNodes(): GraphNode[] {
    // Validate all nodes conform to the schema before returning
    const nodes = Array.from(this.nodes.values());
    return nodes.map(node => graphNodeSchema.parse(node));
  }
  
  /**
   * Gets all edges in the graph
   * @returns Array of edges
   */
  getEdges(): GraphEdge[] {
    // Validate all edges conform to the schema before returning
    const edges = Array.from(this.edges.values());
    return edges.map(edge => graphEdgeSchema.parse(edge));
  }
  
  /**
   * Gets outbound edges for a node
   * @param nodeId The node ID
   * @returns Array of outbound edges
   */
  getOutboundEdges(nodeId: string): GraphEdge[] {
    const outboundEdges = Array.from(this.edges.values()).filter(edge => edge.source === nodeId);
    // Validate all outbound edges conform to the schema before returning
    return outboundEdges.map(edge => graphEdgeSchema.parse(edge));
  }
  
  /**
   * Executes the workflow starting from the initial state
   * @param initialContext Initial context for the workflow
   * @returns Promise that resolves with the orchestration result
   */
  async executeWorkflow(initialContext: Record<string, unknown>): Promise<OrchestrationResult> {
    try {
      const executionPath: string[] = [];
      let currentState: WorkflowState = {
        nodeId: this.initialState,
        context: { ...initialContext },
        history: []
      };
      
      // Validate initial state with Zod schema
      workflowStateSchema.parse(currentState);
      
      // Validate initial state exists
      if (!this.nodes.has(this.initialState)) {
        throw new Error(`Initial state node '${this.initialState}' not found in graph`);
      }
      
      // Validate that the initial state node is properly formed
      const initialNode = this.nodes.get(this.initialState);
      if (initialNode) {
        graphNodeSchema.parse(initialNode);
      }
      
      console.log(`Starting workflow execution from node: ${this.initialState}`);
      
      // Execute workflow until completion or max iterations
      const maxIterations = 100;
      let iterations = 0;
      
      while (iterations < maxIterations) {
        console.log(`Iteration ${iterations}: Processing node ${currentState.nodeId}`);
        
        const currentNode = this.nodes.get(currentState.nodeId);
        if (!currentNode) {
          throw new Error(`Node '${currentState.nodeId}' not found during execution`);
        }
        
        executionPath.push(currentState.nodeId);
        console.log(`Executing node: ${currentNode.label} (${currentNode.id})`);
        
        // Process node based on type
        const result = await this.processNode(currentNode, currentState.context);
        console.log(`Node ${currentNode.id} processed with result keys:`, Object.keys(result));
        
        // Update state history
        currentState.history.push({
          nodeId: currentState.nodeId,
          timestamp: new Date(),
          input: { ...currentState.context },
          output: result
        });
        
        // Validate updated state with Zod schema
        workflowStateSchema.parse(currentState);
        
        // Determine next node
        const outboundEdges = this.getOutboundEdges(currentState.nodeId);
        console.log(`Found ${outboundEdges.length} outbound edges from node ${currentState.nodeId}`);
        
        if (outboundEdges.length === 0) {
          // End of workflow
          console.log(`Workflow completed at node: ${currentNode.label}`);
          
          const finalResult: OrchestrationResult = {
            success: true,
            finalState: currentState,
            output: result,
            executionPath: executionPath,
            error: undefined
          };
          
          // Validate result with Zod schema
          return orchestrationResultSchema.parse(finalResult);
        }
        
        // For simplicity, we'll follow the first edge
        // In a real implementation, this would use conditions to select the appropriate edge
        const nextEdge = outboundEdges[0];
        console.log(`Following edge from ${nextEdge.source} to ${nextEdge.target}`);
        
        // Validate state transition
        const transition = {
          fromNodeId: currentState.nodeId,
          toNodeId: nextEdge.target,
          timestamp: new Date(),
          contextBefore: { ...currentState.context },
          contextAfter: { ...result }
        };
        stateTransitionSchema.parse(transition);
        
        currentState.nodeId = nextEdge.target;
        currentState.context = { ...result }; // Pass result as context to next node
        
        iterations++;
        console.log(`Completed iteration ${iterations}`);
      }
      
      throw new Error(`Workflow exceeded maximum iterations (${maxIterations})`);
    } catch (error) {
      console.error('Workflow execution failed:', error);
      
      const result: OrchestrationResult = {
        success: false,
        finalState: {
          nodeId: '',
          context: {},
          history: []
        },
        output: null,
        executionPath: [],
        error: error instanceof Error ? error.message : String(error)
      };
      
      // Validate result with Zod schema
      return orchestrationResultSchema.parse(result);
    }
  }
  
  /**
   * Processes a node based on its type
   * @param node The node to process
   * @param context Current context
   * @returns Promise that resolves with the processing result
   */
  private async processNode(node: GraphNode, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    switch (node.type) {
      case 'agent':
        return await this.processAgentNode(node, context);
      case 'process':
        return await this.processProcessNode(node, context);
      case 'decision':
        return await this.processDecisionNode(node, context);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }
  
  /**
   * Processes an agent node
   * @param node The agent node
   * @param context Current context
   * @returns Promise that resolves with the agent's output
   */
  private async processAgentNode(node: GraphNode, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    // In a real implementation, this would route to the appropriate agent
    // For simulation, we'll just return the context with some modifications
    console.log(`Processing agent node: ${node.label}`);
    
    // Simulate agent processing with reduced delay for testing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    return {
      ...context,
      processedBy: node.label,
      timestamp: new Date().toISOString(),
      result: `Processed by ${node.label} agent`
    };
  }
  
  /**
   * Processes a process node
   * @param node The process node
   * @param context Current context
   * @returns Promise that resolves with the process output
   */
  private async processProcessNode(node: GraphNode, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    console.log(`Processing process node: ${node.label}`);
    
    // Simulate process execution with reduced delay for testing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 25));
    
    return {
      ...context,
      processedBy: node.label,
      timestamp: new Date().toISOString(),
      result: `Executed process ${node.label}`
    };
  }
  
  /**
   * Processes a decision node
   * @param node The decision node
   * @param context Current context
   * @returns Promise that resolves with the decision output
   */
  private async processDecisionNode(node: GraphNode, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    console.log(`Processing decision node: ${node.label}`);
    
    // Simulate decision making with reduced delay for testing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 15));
    
    // For simulation, we'll make a random decision
    const decision = Math.random() > 0.5 ? 'positive' : 'negative';
    
    return {
      ...context,
      processedBy: node.label,
      decision,
      timestamp: new Date().toISOString(),
      result: `Decision made: ${decision}`
    };
  }
}

// Export singleton instance
export const langGraphOrchestrator = new LangGraphOrchestrator('start');