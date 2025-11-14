"use strict";
/**
 * Export Replay for LAPA v1.3.0-preview — Phase 21
 *
 * GIF + JSON session export functionality.
 * Features: html2canvas for GIF generation, JSON session state export, Share session links.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportSessionJSON = exportSessionJSON;
exports.exportSessionGIF = exportSessionGIF;
exports.generateShareLink = generateShareLink;
exports.exportSessionReplay = exportSessionReplay;
exports.downloadSessionReplay = downloadSessionReplay;
const event_bus_ts_1 = require("../core/event-bus.ts");
const html2canvas_1 = __importDefault(require("html2canvas"));
const gif_js_1 = __importDefault(require("gif.js"));
/**
 * Exports session as JSON
 */
async function exportSessionJSON(sessionId) {
    try {
        // TODO: Load session data from Memori-Engine
        const replay = {
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
    }
    catch (error) {
        console.error('Failed to export session JSON:', error);
        throw error;
    }
}
/**
 * Expects session as GIF (using html2canvas)
 */
async function exportSessionGIF(sessionId, canvasElement, options) {
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
        // @ts-ignore
        // @ts-expect-error
        const gif = new gif_js_1.default({
            workers,
            quality,
            width,
            height,
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
            const canvas = await (0, html2canvas_1.default)(element, {
                width: width,
                height: height,
                scale: 1,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            // Get data URL
            const dataUrl = canvas.toDataURL('image/png');
            // Create image from data URL to get ImageData
            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) {
                throw new Error('Failed to get temp canvas context');
            }
            tempCtx.drawImage(img, 0, 0, width, height);
            const imageData = tempCtx.getImageData(0, 0, width, height);
            // Add frame to GIF
            gif.addFrame(imageData, { delay: delay });
        }
        // Return a promise that resolves with the GIF blob
        return new Promise((resolve, reject) => {
            gif.on('finished', () => resolve(gif.blob));
            gif.on('error', () => reject(new Error('')));
            // Render the GIF
            gif.render();
        });
    }
    catch (error) {
        console.error('Failed to export session GIF:', error);
        throw new Error(`GIF export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Generates shareable session link (WebRTC)
 */
function generateShareLink(sessionId, baseUrl) {
    const url = baseUrl || window.location.origin;
    return `${url}/swarm/session/${sessionId}`;
}
/**
 * Exports session replay (both JSON and GIF)
 */
async function exportSessionReplay(sessionId, options) {
    const result = {};
    try {
        if (options?.includeJSON !== false) {
            result.json = await exportSessionJSON(sessionId);
        }
        if (options?.includeGIF) {
            // Get canvas element from SwarmView if available
            const canvasElement = document.querySelector('.swarm-canvas');
            result.gif = await exportSessionGIF(sessionId, canvasElement, options.gifOptions);
        }
        result.shareLink = generateShareLink(sessionId);
        event_bus_ts_1.eventBus.publish({
            id: `session-export-${Date.now()}`,
            type: 'session.exported',
            timestamp: Date.now(),
            source: 'export-replay',
            payload: {
                sessionId,
                formats: Object.keys(result)
            }
        }).catch(console.error);
        return result;
    }
    catch (error) {
        console.error('Failed to export session replay:', error);
        throw error;
    }
}
/**
 * Downloads session replay files
 */
async function downloadSessionReplay(sessionId, formats = ['json']) {
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
    }
    catch (error) {
        console.error('Failed to download session replay:', error);
        throw error;
    }
}
//# sourceMappingURL=export-replay.js.map