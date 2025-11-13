/**
 * Export Replay for LAPA v1.3.0-preview — Phase 21
 *
 * GIF + JSON session export functionality.
 * Features: html2canvas for GIF generation, JSON session state export, Share session links.
 */

import { eventBus } from '../core/event-bus.ts';
import html2canvas from 'html2canvas';
import GIF from 'gif.js';

// Session replay data
export interface SessionReplay {
  sessionId: string;
  startTime: number;
  endTime: number;
  tasks: Array<{
    id: string;
    timestamp: number;
    type: string;
    data: any;
  }>;
  agents: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  handoffs: Array<{
    id: string;
    from: string;
    to: string;
    timestamp: number;
    latency: number;
  }>;
  metadata: {
    version: string;
    exportTime: number;
  };
}

/**
 * Exports session as JSON
 */
export async function exportSessionJSON(sessionId: string): Promise<string> {
  try {
    // TODO: Load session data from Memori-Engine
    const replay: SessionReplay = {
      sessionId,
      startTime: Date.now() - 3600000, // 1 hour ago
      endTime: Date.now(),
      tasks: [],
      agents: [],
      handoffs: [],
      metadata: {
        version: '1.3.0-preview',
        exportTime: Date.now()
      }
    };

    const json = JSON.stringify(replay, null, 2);
    return json;
  } catch (error) {
    console.error('Failed to export session JSON:', error);
    throw error;
  }
}

/**
 * Expects session as GIF (using html2canvas)
 */
export async function exportSessionGIF(
  sessionId: string,
  canvasElement?: HTMLElement,
  options?: {
    fps?: number;
    duration?: number;
    width?: number;
    height?: number;
    quality?: number;
    workers?: number;
  }
): Promise<Blob> {
  try {
    // Default options
    const fps = options?.fps || 10;
    const duration = options?.duration || 5000; // 5 seconds
    const width = options?.width || 800;
    const height = options?.height || 600;
    const quality = options?.quality || 10;
    const workers = options?.workers || 2;
    
    // Element to capture (default to document.body if not provided)
    const element = canvasElement || document.body;
    
    // Create GIF encoder
    const gif = new GIF({
      workers: workers,
      quality: quality,
      width: width,
      height: height,
      workerScript: '/gif.worker.js' // Path to gif.worker.js
    });
    
    // Calculate number of frames
    const frameCount = Math.floor((duration / 1000) * fps);
    const delay = 1000 / fps;
    
    // Capture frames
    for (let i = 0; i < frameCount; i++) {
      // Wait for the next frame
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        width: width,
        height: height,
        scale: 1,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Add frame to GIF
      gif.addFrame(canvas, { delay: delay });
    }
    
    // Return a promise that resolves with the GIF blob
    return new Promise<Blob>((resolve, reject) => {
      gif.on('finished', (blob) => {
        resolve(blob);
      });
      
      gif.on('error', (error) => {
        reject(new Error(`GIF generation failed: ${error}`));
      });
      
      // Render the GIF
      gif.render();
    });
  } catch (error) {
    console.error('Failed to export session GIF:', error);
    throw new Error(`GIF export failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates shareable session link (WebRTC)
 */
export function generateShareLink(sessionId: string, baseUrl?: string): string {
  const url = baseUrl || window.location.origin;
  return `${url}/swarm/session/${sessionId}`;
}

/**
 * Exports session replay (both JSON and GIF)
 */
export async function exportSessionReplay(
  sessionId: string,
  options?: {
    includeGIF?: boolean;
    includeJSON?: boolean;
    gifOptions?: {
      fps?: number;
      duration?: number;
      width?: number;
      height?: number;
      quality?: number;
      workers?: number;
    };
  }
): Promise<{
  json?: string;
  gif?: Blob;
  shareLink?: string;
}> {
  const result: {
    json?: string;
    gif?: Blob;
    shareLink?: string;
  } = {};

  try {
    if (options?.includeJSON !== false) {
      result.json = await exportSessionJSON(sessionId);
    }

    if (options?.includeGIF) {
      // Get canvas element from SwarmView if available
      const canvasElement = document.querySelector('.swarm-canvas') as HTMLElement;
      result.gif = await exportSessionGIF(sessionId, canvasElement, options.gifOptions);
    }

    result.shareLink = generateShareLink(sessionId);

    eventBus.publish({
      id: `session-export-${Date.now()}`,
      type: 'session.exported',
      timestamp: Date.now(),
      source: 'export-replay',
      payload: {
        sessionId,
        formats: Object.keys(result)
      }
    } as any).catch(console.error);

    return result;
  } catch (error) {
    console.error('Failed to export session replay:', error);
    throw error;
  }
}

/**
 * Downloads session replay files
 */
export async function downloadSessionReplay(
  sessionId: string,
  formats: ('json' | 'gif')[] = ['json']
): Promise<void> {
  try {
    const replay = await exportSessionReplay(sessionId, {
      includeJSON: formats.includes('json'),
      includeGIF: formats.includes('gif')
    });

    // Download JSON
    if (replay.json) {
      const blob = new Blob([replay.json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lapa-session-${sessionId}-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }

    // Download GIF
    if (replay.gif) {
      const url = URL.createObjectURL(replay.gif);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lapa-session-${sessionId}-${Date.now()}.gif`;
      link.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Failed to download session replay:', error);
    throw error;
  }
}

