/**
 * LangGraph Orchestration for LAPA Swarm Intelligence
 *
 * This module implements the LangGraph orchestration layer for coordinating
 * multiple agents in the LAPA swarm. It manages agent interactions, state
 * transitions, and workflow execution using a graph-based approach.
 */
export interface GraphNode {
    id: string;
    type: 'agent' | 'process' | 'decision';
    label: string;
    agentType?: string;
    metadata?: Record<string, any>;
}
export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    condition?: string;
    metadata?: Record<string, any>;
}
export interface WorkflowState {
    nodeId: string;
    context: Record<string, any>;
    history: Array<{
        nodeId: string;
        timestamp: Date;
        input: any;
        output: any;
    }>;
}
export interface OrchestrationResult {
    success: boolean;
    finalState: WorkflowState;
    output: any;
    executionPath: string[];
    error?: string;
}
/**
 * LAPA LangGraph Orchestrator
 */
export declare class LangGraphOrchestrator {
    private nodes;
    private edges;
    private initialState;
    constructor(initialState: string);
    /**
     * Adds a node to the graph
     * @param node The node to add
     */
    addNode(node: GraphNode): void;
    /**
     * Adds an edge to the graph
     * @param edge The edge to add
     */
    addEdge(edge: GraphEdge): void;
    /**
     * Gets all nodes in the graph
     * @returns Array of nodes
     */
    getNodes(): GraphNode[];
    /**
     * Gets all edges in the graph
     * @returns Array of edges
     */
    getEdges(): GraphEdge[];
    /**
     * Gets outbound edges for a node
     * @param nodeId The node ID
     * @returns Array of outbound edges
     */
    getOutboundEdges(nodeId: string): GraphEdge[];
    /**
     * Executes the workflow starting from the initial state
     * @param initialContext Initial context for the workflow
     * @returns Promise that resolves with the orchestration result
     */
    executeWorkflow(initialContext: Record<string, any>): Promise<OrchestrationResult>;
    /**
     * Processes a node based on its type
     * @param node The node to process
     * @param context Current context
     * @returns Promise that resolves with the processing result
     */
    private processNode;
    /**
     * Processes an agent node
     * @param node The agent node
     * @param context Current context
     * @returns Promise that resolves with the agent's output
     */
    private processAgentNode;
    /**
     * Processes a process node
     * @param node The process node
     * @param context Current context
     * @returns Promise that resolves with the process output
     */
    private processProcessNode;
    /**
     * Processes a decision node
     * @param node The decision node
     * @param context Current context
     * @returns Promise that resolves with the decision output
     */
    private processDecisionNode;
}
export declare const langGraphOrchestrator: LangGraphOrchestrator;
