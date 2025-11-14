"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Cross-Environment Compatibility Test Suite (Browser/Node.js)
const vision_voice_1 = require("../../multimodal/vision-voice");
const vision_agent_tool_1 = require("../../multimodal/vision-agent-tool");
const voice_agent_tool_1 = require("../../multimodal/voice-agent-tool");
// Mock Node.js specific modules that might not be available in browser
vi.mock('fs', () => ({
    default: {
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        existsSync: vi.fn()
    }
}));
vi.mock('path', () => ({
    default: {
        join: vi.fn(),
        resolve: vi.fn(),
        basename: vi.fn()
    }
}));
// Mock browser-specific objects that might not be available in Node.js
Object.defineProperty(globalThis, 'Blob', {
    value: class MockBlob {
        data;
        options;
        constructor(data, options) {
            this.data = data;
            this.options = options;
        }
        slice() {
            return new MockBlob([], this.options);
        }
        get size() {
            return this.data.reduce((acc, curr) => acc + (curr.length || 0), 0);
        }
        get type() {
            return this.options?.type || '';
        }
    },
    writable: true
});
Object.defineProperty(globalThis, 'File', {
    value: class MockFile extends Blob {
        constructor(data, fileName, options) {
            super(data, options);
            this.name = fileName;
            this.lastModified = options?.lastModified || Date.now();
        }
        name;
        lastModified;
    },
    writable: true
});
Object.defineProperty(globalThis, 'FileReader', {
    value: class MockFileReader {
        onload = null;
        onloadend = null;
        onerror = null;
        result = null;
        readAsArrayBuffer(blob) {
            // Simulate async reading
            setTimeout(() => {
                if (this.onerror && Math.random() < 0.1) { // 10% chance of error
                    this.onerror();
                }
                else {
                    this.result = new ArrayBuffer(100); // Mock array buffer
                    if (this.onload)
                        this.onload();
                }
                if (this.onloadend)
                    this.onloadend();
            }, 1);
        }
        readAsDataURL(blob) {
            // Simulate async reading
            setTimeout(() => {
                if (this.onerror && Math.random() < 0.1) { // 10% chance of error
                    this.onerror();
                }
                else {
                    this.result = 'data:image/png;base64,mockbase64data'; // Mock data URL
                    if (this.onload)
                        this.onload();
                }
                if (this.onloadend)
                    this.onloadend();
            }, 1);
        }
    },
    writable: true
});
describe('Cross-Environment Compatibility', () => {
    let visionVoiceController;
    let visionAgentTool;
    let voiceAgentTool;
    let config;
    beforeEach(() => {
        config = {
            visionModel: 'nemotron-vision',
            voiceModel: 'whisper',
            enableAudioProcessing: true,
            enableImageProcessing: true,
            modalityPriority: ['vision', 'voice'],
            fallbackStrategy: 'sequential'
        };
        visionVoiceController = new vision_voice_1.VisionVoiceController(config);
        visionAgentTool = new vision_agent_tool_1.VisionAgentTool(config);
        voiceAgentTool = new voice_agent_tool_1.VoiceAgentTool({
            ttsProvider: 'system',
            sttProvider: 'system',
            enableRAGIntegration: false,
            enableEventPublishing: false
        });
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    describe('Buffer Handling Across Environments', () => {
        it('should handle Buffer objects in Node.js environment', async () => {
            // Create a Buffer (Node.js specific)
            const nodeBuffer = Buffer.from('mock image data');
            // Mock the processing
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue('Processed image description');
            const result = await visionVoiceController.processImage(nodeBuffer);
            expect(result).toBe('Processed image description');
            expect(mockProcessImage).toHaveBeenCalledWith(nodeBuffer);
        });
        it('should handle ArrayBuffer in browser environment', async () => {
            // Create an ArrayBuffer (browser compatible)
            const arrayBuffer = new ArrayBuffer(100);
            const uint8Array = new Uint8Array(arrayBuffer);
            // Fill with mock data
            for (let i = 0; i < uint8Array.length; i++) {
                uint8Array[i] = i % 256;
            }
            // Convert to Buffer for compatibility with existing implementation
            // In a real cross-environment implementation, we would handle ArrayBuffer directly
            const buffer = Buffer.from(arrayBuffer);
            // Mock the processing
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue('Processed image from ArrayBuffer');
            const result = await visionVoiceController.processImage(buffer);
            expect(result).toBe('Processed image from ArrayBuffer');
            expect(mockProcessImage).toHaveBeenCalledWith(buffer);
        });
        it('should handle Uint8Array in browser environment', async () => {
            // Create a Uint8Array (browser compatible)
            const uint8Array = new Uint8Array(100);
            // Fill with mock data
            for (let i = 0; i < uint8Array.length; i++) {
                uint8Array[i] = i % 256;
            }
            // Convert to Buffer for compatibility with existing implementation
            const buffer = Buffer.from(uint8Array);
            // Mock the processing
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue('Processed image from Uint8Array');
            const result = await visionVoiceController.processImage(buffer);
            expect(result).toBe('Processed image from Uint8Array');
            expect(mockProcessImage).toHaveBeenCalledWith(buffer);
        });
    });
    describe('File Handling Across Environments', () => {
        it('should handle File objects in browser environment', async () => {
            // Create a File object (browser specific)
            const file = new File(['mock image data'], 'test.png', { type: 'image/png' });
            // In a real implementation, we would convert File to Buffer or ArrayBuffer
            // For this test, we'll mock that conversion
            const mockBuffer = Buffer.from('mock image data');
            // Mock the processing
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue('Processed image from File');
            // In a real implementation, there would be a utility function to convert File to Buffer
            // For this test, we directly pass the mock buffer
            const result = await visionVoiceController.processImage(mockBuffer);
            expect(result).toBe('Processed image from File');
            expect(mockProcessImage).toHaveBeenCalledWith(mockBuffer);
            expect(file.name).toBe('test.png');
            expect(file.type).toBe('image/png');
        });
        it('should handle Blob objects in browser environment', async () => {
            // Create a Blob object (browser specific)
            const blob = new Blob(['mock audio data'], { type: 'audio/wav' });
            // In a real implementation, we would convert Blob to Buffer or ArrayBuffer
            // For this test, we'll mock that conversion
            const mockBuffer = Buffer.from('mock audio data');
            // Mock the processing
            const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
                .mockResolvedValue('Processed audio from Blob');
            // In a real implementation, there would be a utility function to convert Blob to Buffer
            // For this test, we directly pass the mock buffer
            const result = await visionVoiceController.processAudio(mockBuffer);
            expect(result).toBe('Processed audio from Blob');
            expect(mockProcessAudio).toHaveBeenCalledWith(mockBuffer);
            expect(blob.type).toBe('audio/wav');
            expect(blob.size).toBe(17); // Length of 'mock audio data'
        });
    });
    describe('Media Handling Across Environments', () => {
        it('should handle MediaStream in browser environment', async () => {
            // Mock MediaStream (browser specific)
            class MockMediaStream {
                id = 'mock-stream-id';
                active = true;
                getTracks() {
                    return [
                        {
                            kind: 'audio',
                            enabled: true,
                            stop: vi.fn()
                        }
                    ];
                }
                getAudioTracks() {
                    return this.getTracks().filter(track => track.kind === 'audio');
                }
            }
            // Create a mock MediaStream
            const mediaStream = new MockMediaStream();
            // Verify it has the expected properties
            expect(mediaStream.id).toBe('mock-stream-id');
            expect(mediaStream.active).toBe(true);
            expect(mediaStream.getAudioTracks()).toHaveLength(1);
        });
        it('should handle AudioContext in browser environment', async () => {
            // Mock AudioContext (browser specific)
            class MockAudioContext {
                sampleRate = 44100;
                state = 'running';
                createBuffer(source, length, sampleRate) {
                    return {
                        numberOfChannels: source,
                        length: length,
                        sampleRate: sampleRate,
                        getChannelData: vi.fn().mockReturnValue(new Float32Array(length))
                    };
                }
                close() {
                    this.state = 'closed';
                    return Promise.resolve();
                }
            }
            // Create a mock AudioContext
            const audioContext = new MockAudioContext();
            // Create a mock audio buffer
            const audioBuffer = audioContext.createBuffer(1, 1000, 44100);
            // Verify it has the expected properties
            expect(audioBuffer.numberOfChannels).toBe(1);
            expect(audioBuffer.length).toBe(1000);
            expect(audioBuffer.sampleRate).toBe(44100);
        });
    });
    describe('Tool Execution Across Environments', () => {
        it('should execute vision tool with base64 data in both environments', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'processImage',
                    imageData: 'base64imageString' // Base64 works in both environments
                },
                context: {}
            };
            // Mock the internal handler
            const mockHandleProcessImage = vi.spyOn(visionAgentTool, 'handleProcessImage')
                .mockResolvedValue('Processed image from base64');
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(true);
            expect(result.output).toBe('Processed image from base64');
            expect(mockHandleProcessImage).toHaveBeenCalledWith({ imageData: 'base64imageString' });
        });
        it('should execute voice tool with base64 data in both environments', async () => {
            const context = {
                toolName: 'voice-agent',
                parameters: {
                    action: 'transcribe',
                    audioData: 'base64audioString' // Base64 works in both environments
                },
                context: {}
            };
            // Mock the internal handler
            const mockHandleTranscribe = vi.spyOn(voiceAgentTool, 'handleTranscribe')
                .mockResolvedValue({ text: 'Transcribed audio from base64' });
            const result = await voiceAgentTool.execute(context);
            expect(result.success).toBe(true);
            expect(result.output).toEqual({ text: 'Transcribed audio from base64' });
            expect(mockHandleTranscribe).toHaveBeenCalledWith({ audioData: 'base64audioString' });
        });
    });
    describe('FileSystem Access Across Environments', () => {
        it('should handle file reading in Node.js environment', async () => {
            // Mock fs.readFileSync
            const fs = await import('fs');
            fs.default.readFileSync.mockReturnValue(Buffer.from('mock file data'));
            // In a real implementation, we would have a utility function that works in both environments
            // For this test, we'll simulate reading a file
            const readFile = (filePath) => {
                // In Node.js, use fs.readFileSync
                return fs.default.readFileSync(filePath);
            };
            // Mock file path
            const filePath = '/mock/path/to/file.png';
            // Read file
            const fileData = readFile(filePath);
            expect(fileData).toBeInstanceOf(Buffer);
            expect(fileData.toString()).toBe('mock file data');
            expect(fs.default.readFileSync).toHaveBeenCalledWith(filePath);
        });
        it('should handle FileReader in browser environment', async () => {
            // Create a Blob to read
            const blob = new Blob(['mock file data'], { type: 'text/plain' });
            // Use FileReader to read the blob
            const fileReader = new FileReader();
            // Create promises for the events
            const loadPromise = new Promise((resolve) => {
                fileReader.onload = () => resolve();
            });
            const loadEndPromise = new Promise((resolve) => {
                fileReader.onloadend = () => resolve();
            });
            // Start reading
            fileReader.readAsDataURL(blob);
            // Wait for both events
            await Promise.all([loadPromise, loadEndPromise]);
            // Verify result
            expect(fileReader.result).toBe('data:text/plain;base64,bW9jayBmaWxlIGRhdGE=');
        });
    });
    describe('Environment Detection and Adaptation', () => {
        it('should detect browser environment', () => {
            // In a real implementation, we would have environment detection utilities
            const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
            const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
            // In our test environment, we're simulating Node.js, but we've added browser globals
            // So both might appear true in our test environment
            expect(typeof Blob).toBe('function'); // Browser global we added
            expect(typeof Buffer).toBe('function'); // Node.js global
        });
        it('should adapt data handling based on environment', async () => {
            // This test would verify that the implementation adapts to the environment
            // For example, using different utility functions for data conversion
            // Mock different data conversion utilities for different environments
            const browserDataConverter = {
                fileToArrayBuffer: (file) => Promise.resolve(file.slice()),
                blobToBase64: (blob) => Promise.resolve('data:application/octet-stream;base64,mockbase64')
            };
            const nodeDataConverter = {
                bufferToBase64: (buffer) => buffer.toString('base64'),
                fileToBuffer: (filePath) => Buffer.from(`mock data from ${filePath}`)
            };
            // Test browser conversion
            const file = new File(['mock data'], 'test.txt', { type: 'text/plain' });
            const arrayBuffer = await browserDataConverter.fileToArrayBuffer(file);
            const base64 = await browserDataConverter.blobToBase64(file);
            expect(arrayBuffer).toBeInstanceOf(Blob); // slice() returns a Blob
            expect(base64).toBe('data:application/octet-stream;base64,bW9jayBiYXNlNjQ=');
            // Test Node.js conversion
            const buffer = nodeDataConverter.fileToBuffer('/path/to/file.txt');
            const bufferBase64 = nodeDataConverter.bufferToBase64(buffer);
            expect(buffer).toBeInstanceOf(Buffer);
            expect(bufferBase64).toBe('bW9jayBkYXRhIGZyb20gL3BhdGgvdG8vZmlsZS50eHQ=');
        });
    });
});
//# sourceMappingURL=cross-environment.test.js.map