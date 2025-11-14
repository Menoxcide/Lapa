"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextPreservationManager = void 0;
/**
 * Context Preservation Manager for LAPA v1.2 Phase 10
 * Ensures context integrity during handoffs with serialization and checksum validation
 */
class ContextPreservationManager {
    eventBus;
    contextStore;
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.contextStore = new Map();
    }
    /**
     * Serialize and preserve context for handoff
     * @param handoffId Unique identifier for the handoff
     * @param context Context to preserve
     * @returns Promise that resolves when context is preserved
     */
    async preserveContext(handoffId, context) {
        try {
            // Serialize context
            const serializedContext = this.serializeContext(context);
            // Generate checksum for integrity verification
            const checksum = this.generateChecksum(serializedContext);
            // Store context with metadata
            this.contextStore.set(handoffId, {
                serializedData: serializedContext,
                checksum,
                timestamp: Date.now(),
                size: serializedContext.length
            });
            // Publish preservation event
            await this.eventBus.publish({
                id: `context-preserved-${handoffId}`,
                type: 'context.preserved',
                timestamp: Date.now(),
                source: 'context-preservation-manager',
                payload: {
                    handoffId,
                    contextSize: serializedContext.length,
                    checksum
                }
            });
            console.log(`Context preserved for handoff ${handoffId}, size: ${serializedContext.length} bytes`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Publish preservation failure event
            await this.eventBus.publish({
                id: `context-preservation-failed-${handoffId}`,
                type: 'context.preservation.failed',
                timestamp: Date.now(),
                source: 'context-preservation-manager',
                payload: {
                    handoffId,
                    error: errorMessage
                }
            });
            throw new Error(`Failed to preserve context for handoff ${handoffId}: ${errorMessage}`);
        }
    }
    /**
     * Restore and validate context after handoff
     * @param handoffId Unique identifier for the handoff
     * @returns Promise that resolves with the restored context
     */
    async restoreContext(handoffId) {
        try {
            // Retrieve preserved context
            const preservedContext = this.contextStore.get(handoffId);
            if (!preservedContext) {
                throw new Error(`No preserved context found for handoff ${handoffId}`);
            }
            // Validate checksum
            const calculatedChecksum = this.generateChecksum(preservedContext.serializedData);
            if (calculatedChecksum !== preservedContext.checksum) {
                throw new Error(`Context integrity check failed for handoff ${handoffId}. Expected: ${preservedContext.checksum}, Got: ${calculatedChecksum}`);
            }
            // Deserialize context
            const restoredContext = this.deserializeContext(preservedContext.serializedData);
            // Publish restoration event
            await this.eventBus.publish({
                id: `context-restored-${handoffId}`,
                type: 'context.restored',
                timestamp: Date.now(),
                source: 'context-preservation-manager',
                payload: {
                    handoffId,
                    contextSize: preservedContext.size,
                    restorationTime: Date.now() - preservedContext.timestamp
                }
            });
            // Clean up stored context
            this.contextStore.delete(handoffId);
            console.log(`Context restored for handoff ${handoffId}, size: ${preservedContext.size} bytes`);
            return restoredContext;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Publish restoration failure event
            await this.eventBus.publish({
                id: `context-restoration-failed-${handoffId}`,
                type: 'context.restoration.failed',
                timestamp: Date.now(),
                source: 'context-preservation-manager',
                payload: {
                    handoffId,
                    error: errorMessage
                }
            });
            throw new Error(`Failed to restore context for handoff ${handoffId}: ${errorMessage}`);
        }
    }
    /**
     * Rollback context to previous state
     * @param handoffId Unique identifier for the handoff
     * @returns Promise that resolves when rollback is complete
     */
    async rollbackContext(handoffId) {
        try {
            // For this implementation, we simply remove the preserved context
            // In a more sophisticated implementation, we might restore from a backup
            this.contextStore.delete(handoffId);
            // Publish rollback event
            await this.eventBus.publish({
                id: `context-rollback-${handoffId}`,
                type: 'context.rollback',
                timestamp: Date.now(),
                source: 'context-preservation-manager',
                payload: {
                    handoffId
                }
            });
            console.log(`Context rolled back for handoff ${handoffId}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Publish rollback failure event
            await this.eventBus.publish({
                id: `context-rollback-failed-${handoffId}`,
                type: 'context.rollback.failed',
                timestamp: Date.now(),
                source: 'context-preservation-manager',
                payload: {
                    handoffId,
                    error: errorMessage
                }
            });
            throw new Error(`Failed to rollback context for handoff ${handoffId}: ${errorMessage}`);
        }
    }
    /**
     * Serialize context to string
     * @param context Context to serialize
     * @returns Serialized context string
     */
    serializeContext(context) {
        try {
            return JSON.stringify(context);
        }
        catch (error) {
            throw new Error(`Failed to serialize context: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Deserialize context from string
     * @param serializedContext Serialized context string
     * @returns Deserialized context
     */
    deserializeContext(serializedContext) {
        try {
            return JSON.parse(serializedContext);
        }
        catch (error) {
            throw new Error(`Failed to deserialize context: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Generate checksum for data integrity verification
     * @param data Data to generate checksum for
     * @returns Checksum string
     */
    generateChecksum(data) {
        // Simple checksum implementation (in production, use a cryptographic hash)
        let checksum = 0;
        for (let i = 0; i < data.length; i++) {
            checksum = ((checksum << 5) - checksum + data.charCodeAt(i)) & 0xffffffff;
        }
        return checksum.toString(16);
    }
    /**
     * Get context preservation statistics
     * @returns Context preservation statistics
     */
    getStatistics() {
        let totalSize = 0;
        let oldestTimestamp = Infinity;
        let newestTimestamp = 0;
        for (const context of this.contextStore.values()) {
            totalSize += context.size;
            oldestTimestamp = Math.min(oldestTimestamp, context.timestamp);
            newestTimestamp = Math.max(newestTimestamp, context.timestamp);
        }
        return {
            preservedContexts: this.contextStore.size,
            totalSize,
            oldestContextAge: this.contextStore.size > 0 ? Date.now() - oldestTimestamp : 0,
            newestContextAge: this.contextStore.size > 0 ? Date.now() - newestTimestamp : 0
        };
    }
}
exports.ContextPreservationManager = ContextPreservationManager;
//# sourceMappingURL=context-preservation.js.map