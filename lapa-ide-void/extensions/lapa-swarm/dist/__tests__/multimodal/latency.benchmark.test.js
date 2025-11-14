"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Multimodal Latency Benchmark Test Suite
const vision_voice_1 = require("../../multimodal/vision-voice");
const vision_agent_1 = require("../../multimodal/vision-agent");
const voice_agent_1 = require("../../multimodal/voice-agent");
const event_bus_1 = require("../../core/event-bus");
const bench_v2_1 = require("../../observability/bench-v2");
const prometheus_1 = require("../../observability/prometheus");
// Mock the event bus
vi.mock('../../core/event-bus', () => ({
    eventBus: {
        publish: vi.fn()
    }
}));
// Mock NIM inference requests
vi.mock('../../inference/nim.local', () => ({
    sendNemotronVisionInferenceRequest: vi.fn().mockResolvedValue('Mocked vision result'),
    sendNIMInferenceRequest: vi.fn().mockResolvedValue('Mocked voice result')
}));
describe('Multimodal Latency Benchmarking', () => {
    let visionVoiceController;
    let visionAgent;
    let voiceAgent;
    let config;
    let benchmarkSuite;
    let prometheusMetrics;
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
        visionAgent = new vision_agent_1.VisionAgent(config.visionModel);
        voiceAgent = new voice_agent_1.VoiceAgent();
        // Initialize Prometheus metrics
        prometheusMetrics = new prometheus_1.PrometheusMetrics({
            enabled: true,
            prefix: 'lapa_multimodal_'
        }, event_bus_1.eventBus);
        // Initialize benchmark suite
        benchmarkSuite = new bench_v2_1.BenchmarkSuiteV2({
            enabled: true,
            prometheusMetrics: prometheusMetrics,
            eventBus: event_bus_1.eventBus,
            targetFidelity: 99.5,
            enableRegressionDetection: true,
            historicalTracking: true
        });
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    describe('Vision Agent Latency Benchmarks', () => {
        it('should measure image processing latency under 2 seconds', async () => {
            const imageBuffer = Buffer.from('mock image data');
            const startTime = Date.now();
            const result = await visionAgent.processImage(imageBuffer);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(result).toBe('Mocked vision result');
            expect(processingTime).toBeLessThan(2000); // Less than 2 seconds
            // Verify event was published with processing time
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'vision.image.processed',
                payload: expect.objectContaining({
                    processingTime: expect.any(Number)
                })
            }));
            // Record benchmark result
            const benchmarkResult = {
                name: 'vision_image_processing',
                category: 'vision',
                duration: processingTime,
                success: true,
                metrics: {
                    imageSize: imageBuffer.length,
                    resultLength: result.length,
                    processingTime
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_vision_processing_duration_seconds', processingTime / 1000, {
                    operation: 'image_processing'
                });
                prometheusMetrics.incrementCounter('multimodal_vision_operations_total', {
                    operation: 'image_processing',
                    status: 'success'
                });
            }
        });
        it('should measure screenshot analysis latency under 2 seconds', async () => {
            const screenshotBuffer = Buffer.from('mock screenshot data');
            const startTime = Date.now();
            const result = await visionAgent.analyzeScreenshot(screenshotBuffer);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(result).toBeDefined();
            expect(processingTime).toBeLessThan(2000); // Less than 2 seconds
            // Record benchmark result
            const benchmarkResult = {
                name: 'vision_screenshot_analysis',
                category: 'vision',
                duration: processingTime,
                success: true,
                metrics: {
                    imageSize: screenshotBuffer.length,
                    processingTime
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_vision_processing_duration_seconds', processingTime / 1000, {
                    operation: 'screenshot_analysis'
                });
                prometheusMetrics.incrementCounter('multimodal_vision_operations_total', {
                    operation: 'screenshot_analysis',
                    status: 'success'
                });
            }
        });
        it('should measure UI element recognition latency under 2 seconds', async () => {
            const imageBuffer = Buffer.from('mock ui image data');
            const startTime = Date.now();
            const result = await visionAgent.recognizeUIElements(imageBuffer);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(processingTime).toBeLessThan(2000); // Less than 2 seconds
            // Record benchmark result
            const benchmarkResult = {
                name: 'vision_ui_element_recognition',
                category: 'vision',
                duration: processingTime,
                success: true,
                metrics: {
                    imageSize: imageBuffer.length,
                    elementCount: result.length,
                    processingTime
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_vision_processing_duration_seconds', processingTime / 1000, {
                    operation: 'ui_element_recognition'
                });
                prometheusMetrics.incrementCounter('multimodal_vision_operations_total', {
                    operation: 'ui_element_recognition',
                    status: 'success'
                });
            }
        });
        it('should measure code generation latency under 3 seconds', async () => {
            const imageBuffer = Buffer.from('mock design image data');
            const startTime = Date.now();
            const result = await visionAgent.generateCodeFromDesign(imageBuffer, 'react');
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(result).toBe('Mocked vision result');
            expect(processingTime).toBeLessThan(3000); // Less than 3 seconds
            // Record benchmark result
            const benchmarkResult = {
                name: 'vision_code_generation',
                category: 'vision',
                duration: processingTime,
                success: true,
                metrics: {
                    imageSize: imageBuffer.length,
                    framework: 'react',
                    codeLength: result.length,
                    processingTime
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_vision_processing_duration_seconds', processingTime / 1000, {
                    operation: 'code_generation'
                });
                prometheusMetrics.incrementCounter('multimodal_vision_operations_total', {
                    operation: 'code_generation',
                    status: 'success'
                });
            }
        });
    });
    describe('Voice Agent Latency Benchmarks', () => {
        it('should measure audio processing latency under 1 second', async () => {
            const audioBuffer = Buffer.from('mock audio data');
            const startTime = Date.now();
            const result = await voiceAgent.processAudio(audioBuffer);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(typeof result).toBe('string');
            expect(processingTime).toBeLessThan(1000); // Less than 1 second
            // Verify event was published with processing time
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'voice.audio.processed',
                payload: expect.objectContaining({
                    processingTime: expect.any(Number)
                })
            }));
            // Record benchmark result
            const benchmarkResult = {
                name: 'voice_audio_processing',
                category: 'voice',
                duration: processingTime,
                success: true,
                metrics: {
                    audioLength: audioBuffer.length,
                    textLength: result.length,
                    processingTime
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_voice_processing_duration_seconds', processingTime / 1000, {
                    operation: 'audio_processing'
                });
                prometheusMetrics.incrementCounter('multimodal_voice_operations_total', {
                    operation: 'audio_processing',
                    status: 'success'
                });
            }
        });
        it('should measure text-to-speech generation latency under 1 second', async () => {
            const text = 'Hello, this is a test.';
            const startTime = Date.now();
            const result = await voiceAgent.generateAudio(text);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(result).toBeDefined();
            expect(processingTime).toBeLessThan(1000); // Less than 1 second
            // Record benchmark result
            const benchmarkResult = {
                name: 'voice_text_to_speech',
                category: 'voice',
                duration: processingTime,
                success: true,
                metrics: {
                    textLength: text.length,
                    audioLength: result.length,
                    processingTime
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_voice_processing_duration_seconds', processingTime / 1000, {
                    operation: 'text_to_speech'
                });
                prometheusMetrics.incrementCounter('multimodal_voice_operations_total', {
                    operation: 'text_to_speech',
                    status: 'success'
                });
            }
        });
        it('should measure voice command execution latency under 500ms', async () => {
            const command = 'Hello, how are you?';
            const startTime = Date.now();
            const result = await voiceAgent.executeVoiceCommand(command);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(result).toBeDefined();
            expect(processingTime).toBeLessThan(500); // Less than 500ms
            // Record benchmark result
            const benchmarkResult = {
                name: 'voice_command_execution',
                category: 'voice',
                duration: processingTime,
                success: true,
                metrics: {
                    commandLength: command.length,
                    processingTime
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_voice_processing_duration_seconds', processingTime / 1000, {
                    operation: 'command_execution'
                });
                prometheusMetrics.incrementCounter('multimodal_voice_operations_total', {
                    operation: 'command_execution',
                    status: 'success'
                });
            }
        });
        it('should measure question answering latency under 1 second', async () => {
            const question = 'What is the weather like today?';
            const startTime = Date.now();
            const result = await voiceAgent.askQuestion(question);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(result).toBeDefined();
            expect(processingTime).toBeLessThan(1000); // Less than 1 second
            // Record benchmark result
            const benchmarkResult = {
                name: 'voice_question_answering',
                category: 'voice',
                duration: processingTime,
                success: true,
                metrics: {
                    questionLength: question.length,
                    processingTime
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_voice_processing_duration_seconds', processingTime / 1000, {
                    operation: 'question_answering'
                });
                prometheusMetrics.incrementCounter('multimodal_voice_operations_total', {
                    operation: 'question_answering',
                    status: 'success'
                });
            }
        });
    });
    describe('Multimodal Coordination Latency Benchmarks', () => {
        it('should measure multimodal input processing latency under 3 seconds', async () => {
            const input = { image: Buffer.from('mock image data') };
            // Mock individual processing methods
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue('Processed image description');
            const startTime = Date.now();
            const result = await visionVoiceController.processMultimodalInput(input);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(result.text).toBe('Processed image description');
            expect(processingTime).toBeLessThan(3000); // Less than 3 seconds
            expect(mockProcessImage).toHaveBeenCalledWith(input.image);
            // Verify events were published
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'multimodal.processing.started'
            }));
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'multimodal.processing.completed',
                payload: expect.objectContaining({
                    processingTime: expect.any(Number)
                })
            }));
            // Record benchmark result
            const benchmarkResult = {
                name: 'multimodal_input_processing',
                category: 'coordination',
                duration: processingTime,
                success: true,
                metrics: {
                    inputTypes: 'image',
                    processingTime
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_coordination_duration_seconds', processingTime / 1000, {
                    operation: 'input_processing'
                });
                prometheusMetrics.incrementCounter('multimodal_coordination_operations_total', {
                    operation: 'input_processing',
                    status: 'success'
                });
            }
        });
        it('should measure parallel multimodal processing latency under 3 seconds', async () => {
            config.fallbackStrategy = 'parallel';
            const parallelController = new vision_voice_1.VisionVoiceController(config);
            const input = { image: Buffer.from('mock image data'), audio: Buffer.from('mock audio data') };
            // Mock processing methods
            const mockProcessImage = vi.spyOn(parallelController, 'processImage')
                .mockResolvedValue('Processed image');
            const mockProcessAudio = vi.spyOn(parallelController, 'processAudio')
                .mockResolvedValue('Processed audio');
            const startTime = Date.now();
            const result = await parallelController.processMultimodalInput(input);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(result.text).toContain('[VISION] Processed image');
            expect(result.text).toContain('[AUDIO] Processed audio');
            expect(processingTime).toBeLessThan(3000); // Less than 3 seconds
            expect(mockProcessImage).toHaveBeenCalledWith(input.image);
            expect(mockProcessAudio).toHaveBeenCalledWith(input.audio);
            // Record benchmark result
            const benchmarkResult = {
                name: 'multimodal_parallel_processing',
                category: 'coordination',
                duration: processingTime,
                success: true,
                metrics: {
                    inputTypes: 'image,audio',
                    processingTime
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_coordination_duration_seconds', processingTime / 1000, {
                    operation: 'parallel_processing'
                });
                prometheusMetrics.incrementCounter('multimodal_coordination_operations_total', {
                    operation: 'parallel_processing',
                    status: 'success'
                });
            }
        });
    });
    describe('Regression Detection', () => {
        it('should detect performance regressions', async () => {
            // Run a series of benchmarks to establish baseline
            const results = [];
            // Run vision benchmarks
            results.push(await benchmarkSuite.runBenchmark('vision_image_processing_baseline', 'vision', async () => {
                const imageBuffer = Buffer.from('mock image data');
                await visionAgent.processImage(imageBuffer);
            }));
            results.push(await benchmarkSuite.runBenchmark('vision_screenshot_analysis_baseline', 'vision', async () => {
                const screenshotBuffer = Buffer.from('mock screenshot data');
                await visionAgent.analyzeScreenshot(screenshotBuffer);
            }));
            // Run voice benchmarks
            results.push(await benchmarkSuite.runBenchmark('voice_audio_processing_baseline', 'voice', async () => {
                const audioBuffer = Buffer.from('mock audio data');
                await voiceAgent.processAudio(audioBuffer);
            }));
            results.push(await benchmarkSuite.runBenchmark('voice_command_execution_baseline', 'voice', async () => {
                const command = 'Hello, how are you?';
                await voiceAgent.executeVoiceCommand(command);
            }));
            // Run coordination benchmarks
            results.push(await benchmarkSuite.runBenchmark('multimodal_input_processing_baseline', 'coordination', async () => {
                const input = { image: Buffer.from('mock image data') };
                await visionVoiceController.processMultimodalInput(input);
            }));
            // Check for regressions
            const regressions = benchmarkSuite.detectRegressions();
            expect(regressions).toBeDefined();
            expect(Array.isArray(regressions)).toBe(true);
        });
    });
    describe('Load Testing', () => {
        it('should maintain acceptable latency under moderate load', async () => {
            const input = { image: Buffer.from('mock image data') };
            // Mock processing to have a consistent delay
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockImplementation(async () => {
                // Simulate processing delay
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'Processed image';
            });
            // Process multiple inputs sequentially
            const startTime = Date.now();
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(visionVoiceController.processMultimodalInput(input));
            }
            const results = await Promise.all(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTimePerRequest = totalTime / 10;
            expect(results).toHaveLength(10);
            expect(avgTimePerRequest).toBeLessThan(100); // Should average less than 100ms per request
            expect(mockProcessImage).toHaveBeenCalledTimes(10);
            // Record benchmark result
            const benchmarkResult = {
                name: 'multimodal_load_test_sequential',
                category: 'load',
                duration: avgTimePerRequest,
                throughput: 1000 / avgTimePerRequest,
                success: true,
                metrics: {
                    requests: 10,
                    totalTime,
                    avgTimePerRequest
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_load_test_duration_seconds', avgTimePerRequest / 1000, {
                    test_type: 'sequential'
                });
                prometheusMetrics.setGauge('multimodal_load_test_throughput', 1000 / avgTimePerRequest, {
                    test_type: 'sequential'
                });
            }
        });
        it('should handle concurrent multimodal processing efficiently', async () => {
            // Create multiple inputs
            const inputs = [
                { image: Buffer.from('mock image data 1') },
                { audio: Buffer.from('mock audio data 1') },
                { image: Buffer.from('mock image data 2'), audio: Buffer.from('mock audio data 2') }
            ];
            // Mock processing methods
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue('Processed image');
            const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
                .mockResolvedValue('Processed audio');
            // Process all inputs concurrently
            const startTime = Date.now();
            const results = await Promise.all(inputs.map(input => visionVoiceController.processMultimodalInput(input)));
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            expect(results).toHaveLength(3);
            expect(mockProcessImage).toHaveBeenCalledTimes(2); // Two image inputs
            expect(mockProcessAudio).toHaveBeenCalledTimes(2); // Two audio inputs
            // Record benchmark result
            const benchmarkResult = {
                name: 'multimodal_concurrent_processing',
                category: 'load',
                duration: totalTime,
                success: true,
                metrics: {
                    concurrentRequests: inputs.length,
                    totalTime
                },
                timestamp: Date.now()
            };
            // Report to Prometheus
            if (prometheusMetrics) {
                prometheusMetrics.observeHistogram('multimodal_load_test_duration_seconds', totalTime / 1000, {
                    test_type: 'concurrent'
                });
                prometheusMetrics.incrementCounter('multimodal_concurrent_requests_total', {
                    status: 'success'
                });
            }
        });
    });
});
//# sourceMappingURL=latency.benchmark.test.js.map