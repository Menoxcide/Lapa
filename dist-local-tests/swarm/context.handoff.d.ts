/**
 * Context Handoff Mechanism for LAPA Swarm Intelligence
 *
 * This module implements the context handoff mechanism for transferring
 * state and context between agents in the LAPA swarm. It ensures seamless
 * collaboration by preserving and transmitting relevant information.
 */
export interface ContextHandoffRequest {
    sourceAgentId: string;
    targetAgentId: string;
    taskId: string;
    context: Record<string, any>;
    priority: 'low' | 'medium' | 'high';
    deadline?: Date;
}
export interface ContextHandoffResponse {
    success: boolean;
    handoffId: string;
    compressedSize?: number;
    transferTime?: number;
    error?: string;
}
export interface HandoffStatus {
    handoffId: string;
    status: 'pending' | 'transferring' | 'completed' | 'failed';
    progress: number;
    timestamp: Date;
    error?: string;
}
/**
 * LAPA Context Handoff Manager
 */
export declare class ContextHandoffManager {
    private pendingHandoffs;
    private handoffStatus;
    /**
     * Initiates a context handoff between agents
     * @param request Handoff request details
     * @returns Promise that resolves with the handoff response
     */
    initiateHandoff(request: ContextHandoffRequest): Promise<ContextHandoffResponse>;
    /**
     * Completes a context handoff by retrieving and decompressing the context
     * @param handoffId Unique handoff identifier
     * @param targetAgentId ID of the agent receiving the context
     * @returns Promise that resolves with the decompressed context
     */
    completeHandoff(handoffId: string, targetAgentId: string): Promise<Record<string, any>>;
    /**
     * Gets the status of a context handoff
     * @param handoffId Unique handoff identifier
     * @returns Handoff status or undefined if not found
     */
    getHandoffStatus(handoffId: string): HandoffStatus | undefined;
    /**
     * Cancels a pending context handoff
     * @param handoffId Unique handoff identifier
     * @returns Boolean indicating success
     */
    cancelHandoff(handoffId: string): boolean;
    /**
     * Generates a unique handoff ID
     * @param request Handoff request details
     * @returns Unique handoff identifier
     */
    private generateHandoffId;
    /**
     * Updates the status of a handoff
     * @param handoffId Unique handoff identifier
     * @param status New status
     * @param progress Progress percentage (0-100)
     * @param error Optional error message
     */
    private updateHandoffStatus;
    /**
     * Determines compression quality based on priority
     * @param priority Handoff priority
     * @returns Compression quality value (1-10)
     */
    private getCompressionQuality;
}
export declare const contextHandoffManager: ContextHandoffManager;
