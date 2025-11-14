// Utility functions for handling multimodal context during handoffs
import { Buffer } from 'buffer';
import { MultimodalUtils } from './index.ts';

export class MultimodalContextHandler {
  /**
   * Prepares multimodal context for handoff by optimizing and serializing data
   * @param context The context to prepare
   * @returns Prepared context ready for serialization
   */
  static async prepareContextForHandoff(context: Record<string, any>): Promise<Record<string, any>> {
    const preparedContext: Record<string, any> = { ...context };
    
    // Handle image data optimization
    if (context.imageData) {
      try {
        // If imageData is a Buffer, optimize it
        if (context.imageData instanceof Buffer) {
          console.log(`[MultimodalContextHandler] Optimizing image buffer of size ${context.imageData.length} bytes`);
          preparedContext.imageData = await MultimodalUtils.optimizeImageBuffer(context.imageData);
        }
        // If imageData is a base64 string, convert to buffer, optimize, then back to base64
        else if (typeof context.imageData === 'string') {
          const imageBuffer = await MultimodalUtils.convertBase64ToBuffer(context.imageData);
          const optimizedBuffer = await MultimodalUtils.optimizeImageBuffer(imageBuffer);
          preparedContext.imageData = await MultimodalUtils.convertBufferToBase64(optimizedBuffer);
        }
      } catch (error) {
        console.warn('[MultimodalContextHandler] Failed to optimize image data:', error);
        // Keep original data if optimization fails
      }
    }
    
    // Handle audio data optimization
    if (context.audioData) {
      try {
        // If audioData is a Buffer, we might want to compress it
        if (context.audioData instanceof Buffer) {
          console.log(`[MultimodalContextHandler] Processing audio buffer of size ${context.audioData.length} bytes`);
          // In a real implementation, we might apply audio compression here
          // For now, we'll just validate the buffer
          const isValid = await MultimodalUtils.validateAudioBuffer(context.audioData);
          if (!isValid) {
            delete preparedContext.audioData;
            console.warn('[MultimodalContextHandler] Invalid audio data removed from context');
          }
        }
        // If audioData is a base64 string, validate it
        else if (typeof context.audioData === 'string') {
          const audioBuffer = await MultimodalUtils.convertBase64ToBuffer(context.audioData);
          const isValid = await MultimodalUtils.validateAudioBuffer(audioBuffer);
          if (!isValid) {
            delete preparedContext.audioData;
            console.warn('[MultimodalContextHandler] Invalid audio data removed from context');
          }
        }
      } catch (error) {
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
  static async restoreContextAfterHandoff(context: Record<string, any>): Promise<Record<string, any>> {
    const restoredContext: Record<string, any> = { ...context };
    
    // Remove metadata added for handoff
    delete restoredContext._multimodalMetadata;
    
    // Restore image data if it was base64 encoded
    if (context.imageData && typeof context.imageData === 'string') {
      try {
        restoredContext.imageData = await MultimodalUtils.convertBase64ToBuffer(context.imageData);
      } catch (error) {
        console.warn('[MultimodalContextHandler] Failed to restore image data:', error);
      }
    }
    
    // Restore audio data if it was base64 encoded
    if (context.audioData && typeof context.audioData === 'string') {
      try {
        restoredContext.audioData = await MultimodalUtils.convertBase64ToBuffer(context.audioData);
      } catch (error) {
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
  static async validateContext(context: Record<string, any>): Promise<boolean> {
    // Validate image data if present
    if (context.imageData) {
      try {
        const isValid = await MultimodalUtils.validateImageBuffer(context.imageData);
        if (!isValid) {
          console.warn('[MultimodalContextHandler] Invalid image data in context');
          return false;
        }
      } catch (error) {
        console.warn('[MultimodalContextHandler] Error validating image data:', error);
        return false;
      }
    }
    
    // Validate audio data if present
    if (context.audioData) {
      try {
        const isValid = await MultimodalUtils.validateAudioBuffer(context.audioData);
        if (!isValid) {
          console.warn('[MultimodalContextHandler] Invalid audio data in context');
          return false;
        }
      } catch (error) {
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
  static estimateContextSize(context: Record<string, any>): number {
    let size = 0;
    
    for (const [key, value] of Object.entries(context)) {
      // Skip metadata fields
      if (key.startsWith('_')) continue;
      
      if (value instanceof Buffer) {
        size += value.length;
      } else if (typeof value === 'string') {
        size += value.length * 2; // UTF-16 encoding
      } else if (typeof value === 'object' && value !== null) {
        size += JSON.stringify(value).length * 2;
      } else {
        size += String(value).length * 2;
      }
    }
    
    return size;
  }
}