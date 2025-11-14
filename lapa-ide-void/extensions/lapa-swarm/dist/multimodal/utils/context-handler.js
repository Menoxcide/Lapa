"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultimodalContextHandler = void 0;
// Utility functions for handling multimodal context during handoffs
const buffer_1 = require("buffer");
const index_ts_1 = require("./index.ts");
class MultimodalContextHandler {
    /**
     * Prepares multimodal context for handoff by optimizing and serializing data
     * @param context The context to prepare
     * @returns Prepared context ready for serialization
     */
    static async prepareContextForHandoff(context) {
        const preparedContext = { ...context };
        // Handle image data optimization
        if (context.imageData) {
            try {
                // If imageData is a Buffer, optimize it
                if (context.imageData instanceof buffer_1.Buffer) {
                    console.log(`[MultimodalContextHandler] Optimizing image buffer of size ${context.imageData.length} bytes`);
                    preparedContext.imageData = await index_ts_1.MultimodalUtils.optimizeImageBuffer(context.imageData);
                }
                // If imageData is a base64 string, convert to buffer, optimize, then back to base64
                else if (typeof context.imageData === 'string') {
                    const imageBuffer = await index_ts_1.MultimodalUtils.convertBase64ToBuffer(context.imageData);
                    const optimizedBuffer = await index_ts_1.MultimodalUtils.optimizeImageBuffer(imageBuffer);
                    preparedContext.imageData = await index_ts_1.MultimodalUtils.convertBufferToBase64(optimizedBuffer);
                }
            }
            catch (error) {
                console.warn('[MultimodalContextHandler] Failed to optimize image data:', error);
                // Keep original data if optimization fails
            }
        }
        // Handle audio data optimization
        if (context.audioData) {
            try {
                // If audioData is a Buffer, we might want to compress it
                if (context.audioData instanceof buffer_1.Buffer) {
                    console.log(`[MultimodalContextHandler] Processing audio buffer of size ${context.audioData.length} bytes`);
                    // In a real implementation, we might apply audio compression here
                    // For now, we'll just validate the buffer
                    const isValid = await index_ts_1.MultimodalUtils.validateAudioBuffer(context.audioData);
                    if (!isValid) {
                        delete preparedContext.audioData;
                        console.warn('[MultimodalContextHandler] Invalid audio data removed from context');
                    }
                }
                // If audioData is a base64 string, validate it
                else if (typeof context.audioData === 'string') {
                    const audioBuffer = await index_ts_1.MultimodalUtils.convertBase64ToBuffer(context.audioData);
                    const isValid = await index_ts_1.MultimodalUtils.validateAudioBuffer(audioBuffer);
                    if (!isValid) {
                        delete preparedContext.audioData;
                        console.warn('[MultimodalContextHandler] Invalid audio data removed from context');
                    }
                }
            }
            catch (error) {
                console.warn('[MultimodalContextHandler] Failed to process audio data:', error);
                // Remove invalid audio data
                delete preparedContext.audioData;
            }
        }
        // Add metadata about the context
        preparedContext._multimodalMetadata = {
            hasImageData: !!context.imageData,
            hasAudioData: !!context.audioData,
            timestamp: Date.now(),
            contextSize: JSON.stringify(preparedContext).length
        };
        return preparedContext;
    }
    /**
     * Restores multimodal context after handoff
     * @param context The context to restore
     * @returns Restored context with proper data types
     */
    static async restoreContextAfterHandoff(context) {
        const restoredContext = { ...context };
        // Remove metadata added for handoff
        delete restoredContext._multimodalMetadata;
        // Restore image data if it was base64 encoded
        if (context.imageData && typeof context.imageData === 'string') {
            try {
                restoredContext.imageData = await index_ts_1.MultimodalUtils.convertBase64ToBuffer(context.imageData);
            }
            catch (error) {
                console.warn('[MultimodalContextHandler] Failed to restore image data:', error);
            }
        }
        // Restore audio data if it was base64 encoded
        if (context.audioData && typeof context.audioData === 'string') {
            try {
                restoredContext.audioData = await index_ts_1.MultimodalUtils.convertBase64ToBuffer(context.audioData);
            }
            catch (error) {
                console.warn('[MultimodalContextHandler] Failed to restore audio data:', error);
            }
        }
        return restoredContext;
    }
    /**
     * Validates multimodal context data
     * @param context The context to validate
     * @returns Boolean indicating if context is valid
     */
    static async validateContext(context) {
        // Validate image data if present
        if (context.imageData) {
            try {
                const isValid = await index_ts_1.MultimodalUtils.validateImageBuffer(context.imageData);
                if (!isValid) {
                    console.warn('[MultimodalContextHandler] Invalid image data in context');
                    return false;
                }
            }
            catch (error) {
                console.warn('[MultimodalContextHandler] Error validating image data:', error);
                return false;
            }
        }
        // Validate audio data if present
        if (context.audioData) {
            try {
                const isValid = await index_ts_1.MultimodalUtils.validateAudioBuffer(context.audioData);
                if (!isValid) {
                    console.warn('[MultimodalContextHandler] Invalid audio data in context');
                    return false;
                }
            }
            catch (error) {
                console.warn('[MultimodalContextHandler] Error validating audio data:', error);
                return false;
            }
        }
        return true;
    }
    /**
     * Estimates the size of multimodal context for compression optimization
     * @param context The context to measure
     * @returns Estimated size in bytes
     */
    static estimateContextSize(context) {
        let size = 0;
        for (const [key, value] of Object.entries(context)) {
            // Skip metadata fields
            if (key.startsWith('_'))
                continue;
            if (value instanceof buffer_1.Buffer) {
                size += value.length;
            }
            else if (typeof value === 'string') {
                size += value.length * 2; // UTF-16 encoding
            }
            else if (typeof value === 'object' && value !== null) {
                size += JSON.stringify(value).length * 2;
            }
            else {
                size += String(value).length * 2;
            }
        }
        return size;
    }
}
exports.MultimodalContextHandler = MultimodalContextHandler;
//# sourceMappingURL=context-handler.js.map