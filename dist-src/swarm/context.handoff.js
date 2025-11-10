/**
 * Context Handoff Mechanism for LAPA Swarm Intelligence
 *
 * This module implements the context handoff mechanism for transferring
 * state and context between agents in the LAPA swarm. It ensures seamless
 * collaboration by preserving and transmitting relevant information.
 */
import { compressContext, decompressContext } from '../mcp/ctx-zip.integration';
// Context repository for storing handoff data
class ContextRepository {
    constructor() {
        this.contexts = new Map();
        this.metadata = new Map();
    }
    /**
     * Stores compressed context data
     * @param handoffId Unique handoff identifier
     * @param compressedData Compressed context buffer
     * @param metadata Additional metadata
     */
    storeContext(handoffId, compressedData, metadata) {
        this.contexts.set(handoffId, compressedData);
        this.metadata.set(handoffId, metadata);
        console.log(`Stored context for handoff: ${handoffId}`);
    }
    /**
     * Retrieves compressed context data
     * @param handoffId Unique handoff identifier
     * @returns Compressed context buffer or undefined if not found
     */
    getContext(handoffId) {
        return this.contexts.get(handoffId);
    }
    /**
     * Retrieves metadata for a handoff
     * @param handoffId Unique handoff identifier
     * @returns Metadata or undefined if not found
     */
    getMetadata(handoffId) {
        return this.metadata.get(handoffId);
    }
    /**
     * Removes context data (cleanup after successful transfer)
     * @param handoffId Unique handoff identifier
     */
    removeContext(handoffId) {
        this.contexts.delete(handoffId);
        this.metadata.delete(handoffId);
        console.log(`Removed context for handoff: ${handoffId}`);
    }
}
// Global context repository instance
const contextRepository = new ContextRepository();
/**
 * LAPA Context Handoff Manager
 */
export class ContextHandoffManager {
    constructor() {
        this.pendingHandoffs = new Map();
        this.handoffStatus = new Map();
    }
    /**
     * Initiates a context handoff between agents
     * @param request Handoff request details
     * @returns Promise that resolves with the handoff response
     */
    async initiateHandoff(request) {
        try {
            console.log(`Initiating context handoff from ${request.sourceAgentId} to ${request.targetAgentId}`);
            // Generate unique handoff ID
            const handoffId = this.generateHandoffId(request);
            // Update status
            this.updateHandoffStatus(handoffId, 'pending', 0);
            // Serialize context
            const contextString = JSON.stringify(request.context);
            // Compress context using ctx-zip
            const startTime = Date.now();
            const compressedData = await compressContext(contextString, {
                quality: this.getCompressionQuality(request.priority),
                preserveSemantic: true,
                contextType: 'agent_handoff'
            });
            const compressionTime = Date.now() - startTime;
            // Store compressed context
            const metadata = {
                sourceAgentId: request.sourceAgentId,
                targetAgentId: request.targetAgentId,
                taskId: request.taskId,
                priority: request.priority,
                compressionTime,
                originalSize: contextString.length,
                compressedSize: compressedData.length
            };
            contextRepository.storeContext(handoffId, compressedData, metadata);
            // Register pending handoff
            this.pendingHandoffs.set(handoffId, request);
            // Update status
            this.updateHandoffStatus(handoffId, 'transferring', 50);
            console.log(`Context handoff initiated: ${handoffId}`);
            return {
                success: true,
                handoffId,
                compressedSize: compressedData.length,
                transferTime: compressionTime
            };
        }
        catch (error) {
            console.error('Failed to initiate context handoff:', error);
            const handoffId = this.generateHandoffId(request);
            this.updateHandoffStatus(handoffId, 'failed', 0, error instanceof Error ? error.message : String(error));
            return {
                success: false,
                handoffId: handoffId,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Completes a context handoff by retrieving and decompressing the context
     * @param handoffId Unique handoff identifier
     * @param targetAgentId ID of the agent receiving the context
     * @returns Promise that resolves with the decompressed context
     */
    async completeHandoff(handoffId, targetAgentId) {
        try {
            console.log(`Completing context handoff: ${handoffId} for agent: ${targetAgentId}`);
            // Verify handoff exists and is for this agent
            const request = this.pendingHandoffs.get(handoffId);
            if (!request) {
                throw new Error(`Handoff ${handoffId} not found`);
            }
            if (request.targetAgentId !== targetAgentId) {
                throw new Error(`Handoff ${handoffId} is not intended for agent ${targetAgentId}`);
            }
            // Update status
            this.updateHandoffStatus(handoffId, 'transferring', 75);
            // Retrieve compressed context
            const compressedData = contextRepository.getContext(handoffId);
            if (!compressedData) {
                throw new Error(`Compressed context not found for handoff ${handoffId}`);
            }
            // Decompress context
            const startTime = Date.now();
            const contextString = await decompressContext(compressedData);
            const decompressionTime = Date.now() - startTime;
            // Parse context
            const context = JSON.parse(contextString);
            // Clean up
            contextRepository.removeContext(handoffId);
            this.pendingHandoffs.delete(handoffId);
            // Update status
            this.updateHandoffStatus(handoffId, 'completed', 100);
            console.log(`Context handoff completed: ${handoffId} in ${decompressionTime}ms`);
            return context;
        }
        catch (error) {
            console.error('Failed to complete context handoff:', error);
            this.updateHandoffStatus(handoffId, 'failed', 0, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    /**
     * Gets the status of a context handoff
     * @param handoffId Unique handoff identifier
     * @returns Handoff status or undefined if not found
     */
    getHandoffStatus(handoffId) {
        return this.handoffStatus.get(handoffId);
    }
    /**
     * Cancels a pending context handoff
     * @param handoffId Unique handoff identifier
     * @returns Boolean indicating success
     */
    cancelHandoff(handoffId) {
        try {
            const request = this.pendingHandoffs.get(handoffId);
            if (!request) {
                return false;
            }
            // Clean up
            contextRepository.removeContext(handoffId);
            this.pendingHandoffs.delete(handoffId);
            this.handoffStatus.delete(handoffId);
            console.log(`Cancelled context handoff: ${handoffId}`);
            return true;
        }
        catch (error) {
            console.error('Failed to cancel context handoff:', error);
            return false;
        }
    }
    /**
     * Generates a unique handoff ID
     * @param request Handoff request details
     * @returns Unique handoff identifier
     */
    generateHandoffId(request) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `handoff_${request.sourceAgentId}_${request.targetAgentId}_${timestamp}_${random}`;
    }
    /**
     * Updates the status of a handoff
     * @param handoffId Unique handoff identifier
     * @param status New status
     * @param progress Progress percentage (0-100)
     * @param error Optional error message
     */
    updateHandoffStatus(handoffId, status, progress, error) {
        const statusObj = {
            handoffId,
            status,
            progress: Math.max(0, Math.min(100, progress)),
            timestamp: new Date(),
            error
        };
        this.handoffStatus.set(handoffId, statusObj);
        // Log status changes
        if (status === 'completed') {
            console.log(`Handoff ${handoffId} completed successfully`);
        }
        else if (status === 'failed') {
            console.error(`Handoff ${handoffId} failed: ${error}`);
        }
    }
    /**
     * Determines compression quality based on priority
     * @param priority Handoff priority
     * @returns Compression quality value (1-10)
     */
    getCompressionQuality(priority) {
        switch (priority) {
            case 'high':
                return 6; // Less compression for faster transfer
            case 'medium':
                return 8; // Balanced compression
            case 'low':
                return 9; // More compression for smaller size
            default:
                return 8;
        }
    }
}
// Export singleton instance
export const contextHandoffManager = new ContextHandoffManager();
//# sourceMappingURL=context.handoff.js.map