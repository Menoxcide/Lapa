// Multimodal Benchmark Reporting Test Suite
import { VisionVoiceController } from '../../multimodal/vision-voice';
import { VisionAgent } from '../../multimodal/vision-agent';
import { VoiceAgent } from '../../multimodal/voice-agent';
import { MultimodalConfig } from '../../multimodal/types';
import { eventBus } from '../../core/event-bus';
import { BenchmarkSuiteV2, BenchmarkResult, PerformanceMetrics } from '../../observability/bench-v2';
import { PrometheusMetrics } from '../../observability/prometheus';
import { MultimodalEventPublisher } from '../../multimodal/utils/event-publisher';

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

// Benchmark Report Types
interface BenchmarkReport {
  testName: string;
  timestamp: number;
  duration: number;
  passed: boolean;
  metrics: Record<string, any>;
  details?: string;
}

interface ComprehensiveBenchmarkReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
    totalDuration: number;
    averageDuration: number;
  };
  performance: PerformanceMetrics;
  benchmarks: BenchmarkResult[];
  regressions: Array<{ benchmark: string; regression: string }>;
  prometheusMetrics: string;
  recommendations: string[];
}

// Benchmark Report Generator
class BenchmarkReportGenerator {
  private reports: BenchmarkReport[] = [];

  addReport(report: BenchmarkReport): void {
    this.reports.push(report);
  }

  generateComprehensiveReport(
    benchmarkSuite: BenchmarkSuiteV2,
    performance: PerformanceMetrics,
    regressions: Array<{ benchmark: string; regression: string }>,
    prometheusMetrics: string
  ): ComprehensiveBenchmarkReport {
    const benchmarkResults = benchmarkSuite.getResults();
    const passedTests = benchmarkResults.filter(r => r.success).length;
    const failedTests = benchmarkResults.filter(r => !r.success).length;
    const totalDuration = benchmarkResults.reduce((sum, r) => sum + r.duration, 0);
    
    const summary = {
      totalTests: benchmarkResults.length,
      passedTests,
      failedTests,
      passRate: benchmarkResults.length > 0 ? (passedTests / benchmarkResults.length) * 100 : 0,
      totalDuration,
      averageDuration: benchmarkResults.length > 0 ? totalDuration / benchmarkResults.length : 0
    };

    // Generate recommendations based on results
    const recommendations: string[] = [];
    
    // Check for performance issues
    if (performance.handoffLatency.average > 1000) {
      recommendations.push('High handoff latency detected. Consider optimizing agent handoff mechanisms.');
    }
    
    if (performance.memoryUsage.average > 500 * 1024 * 1024) {
      recommendations.push('High memory usage detected. Consider implementing more aggressive memory cleanup.');
    }
    
    if (performance.eventThroughput < 1000) {
      recommendations.push('Low event throughput detected. Consider optimizing event processing pipeline.');
    }
    
    // Check for failed benchmarks
    if (failedTests > 0) {
      recommendations.push(`There are ${failedTests} failed benchmarks that need attention.`);
    }
    
    // Check for regressions
    if (regressions.length > 0) {
      recommendations.push(`Performance regressions detected in ${regressions.length} benchmarks.`);
    }
    
    // Add general recommendations if everything looks good
    if (recommendations.length === 0) {
      recommendations.push('All benchmarks passed with good performance metrics. System is ready for production.');
    }

    return {
      summary,
      performance,
      benchmarks: benchmarkResults,
      regressions,
      prometheusMetrics,
      recommendations
    };
  }

  getReports(): BenchmarkReport[] {
    return [...this.reports];
  }

  clearReports(): void {
    this.reports = [];
  }
}

describe('Multimodal Benchmark Reporting', () => {
  let visionVoiceController: VisionVoiceController;
  let visionAgent: VisionAgent;
  let voiceAgent: VoiceAgent;
  let config: MultimodalConfig;
  let benchmarkSuite: BenchmarkSuiteV2;
  let prometheusMetrics: PrometheusMetrics;
  let reportGenerator: BenchmarkReportGenerator;

  beforeEach(() => {
    config = {
      visionModel: 'nemotron-vision',
      voiceModel: 'whisper',
      enableAudioProcessing: true,
      enableImageProcessing: true,
      modalityPriority: ['vision', 'voice'],
      fallbackStrategy: 'sequential'
    };

    visionVoiceController = new VisionVoiceController(config);
    visionAgent = new VisionAgent(config.visionModel);
    voiceAgent = new VoiceAgent();

    // Initialize Prometheus metrics
    prometheusMetrics = new PrometheusMetrics(
      {
        enabled: true,
        prefix: 'lapa_multimodal_'
      },
      eventBus
    );

    // Initialize benchmark suite
    benchmarkSuite = new BenchmarkSuiteV2({
      enabled: true,
      prometheusMetrics: prometheusMetrics,
      eventBus: eventBus,
      targetFidelity: 99.5,
      enableRegressionDetection: true,
      historicalTracking: true
    });

    reportGenerator = new BenchmarkReportGenerator();
  });

  afterEach(() => {
    vi.clearAllMocks();
    reportGenerator.clearReports();
  });

  describe('Benchmark Execution and Reporting', () => {
    it('should execute vision benchmarks and generate report', async () => {
      const startTime = Date.now();
      
      // Execute vision benchmarks
      const imageProcessingResult = await benchmarkSuite.runBenchmark(
        'vision_image_processing',
        'vision',
        async () => {
          const imageBuffer = Buffer.from('mock image data');
          await visionAgent.processImage(imageBuffer);
        }
      );

      const screenshotAnalysisResult = await benchmarkSuite.runBenchmark(
        'vision_screenshot_analysis',
        'vision',
        async () => {
          const screenshotBuffer = Buffer.from('mock screenshot data');
          await visionAgent.analyzeScreenshot(screenshotBuffer);
        }
      );

      const uiElementRecognitionResult = await benchmarkSuite.runBenchmark(
        'vision_ui_element_recognition',
        'vision',
        async () => {
          const imageBuffer = Buffer.from('mock ui image data');
          await visionAgent.recognizeUIElements(imageBuffer);
        }
      );

      const codeGenerationResult = await benchmarkSuite.runBenchmark(
        'vision_code_generation',
        'vision',
        async () => {
          const imageBuffer = Buffer.from('mock design image data');
          await visionAgent.generateCodeFromDesign(imageBuffer, 'react');
        }
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Add reports
      reportGenerator.addReport({
        testName: 'vision_image_processing',
        timestamp: Date.now(),
        duration: imageProcessingResult.duration,
        passed: imageProcessingResult.success,
        metrics: imageProcessingResult.metrics
      });

      reportGenerator.addReport({
        testName: 'vision_screenshot_analysis',
        timestamp: Date.now(),
        duration: screenshotAnalysisResult.duration,
        passed: screenshotAnalysisResult.success,
        metrics: screenshotAnalysisResult.metrics
      });

      reportGenerator.addReport({
        testName: 'vision_ui_element_recognition',
        timestamp: Date.now(),
        duration: uiElementRecognitionResult.duration,
        passed: uiElementRecognitionResult.success,
        metrics: uiElementRecognitionResult.metrics
      });

      reportGenerator.addReport({
        testName: 'vision_code_generation',
        timestamp: Date.now(),
        duration: codeGenerationResult.duration,
        passed: codeGenerationResult.success,
        metrics: codeGenerationResult.metrics
      });

      const reports = reportGenerator.getReports();
      
      expect(reports).toHaveLength(4);
      for (const report of reports) {
        expect(report.passed).toBe(true);
        expect(report.duration).toBeGreaterThan(0);
      }

      // Verify all vision benchmarks completed successfully
      expect(imageProcessingResult.success).toBe(true);
      expect(screenshotAnalysisResult.success).toBe(true);
      expect(uiElementRecognitionResult.success).toBe(true);
      expect(codeGenerationResult.success).toBe(true);
      
      // Verify execution time
      expect(executionTime).toBeGreaterThan(0);
    });

    it('should execute voice benchmarks and generate report', async () => {
      const startTime = Date.now();
      
      // Execute voice benchmarks
      const audioProcessingResult = await benchmarkSuite.runBenchmark(
        'voice_audio_processing',
        'voice',
        async () => {
          const audioBuffer = Buffer.from('mock audio data');
          await voiceAgent.processAudio(audioBuffer);
        }
      );

      const textToSpeechResult = await benchmarkSuite.runBenchmark(
        'voice_text_to_speech',
        'voice',
        async () => {
          const result = await voiceAgent.generateAudio('Hello, this is a test.');
          expect(result).toBeDefined();
        }
      );

      const voiceCommandResult = await benchmarkSuite.runBenchmark(
        'voice_command_execution',
        'voice',
        async () => {
          const command = {
            command: 'Hello, how are you?'
          };
          const result = await voiceAgent.executeVoiceCommand(command);
          expect(result).toBeDefined();
        }
      );

      const questionAnsweringResult = await benchmarkSuite.runBenchmark(
        'voice_question_answering',
        'voice',
        async () => {
          const question = {
            question: 'What is the weather like today?'
          };
          const result = await voiceAgent.askQuestion(question);
          expect(result).toBeDefined();
        }
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Add reports
      reportGenerator.addReport({
        testName: 'voice_audio_processing',
        timestamp: Date.now(),
        duration: audioProcessingResult.duration,
        passed: audioProcessingResult.success,
        metrics: audioProcessingResult.metrics
      });

      reportGenerator.addReport({
        testName: 'voice_text_to_speech',
        timestamp: Date.now(),
        duration: textToSpeechResult.duration,
        passed: textToSpeechResult.success,
        metrics: textToSpeechResult.metrics
      });

      reportGenerator.addReport({
        testName: 'voice_command_execution',
        timestamp: Date.now(),
        duration: voiceCommandResult.duration,
        passed: voiceCommandResult.success,
        metrics: voiceCommandResult.metrics
      });

      reportGenerator.addReport({
        testName: 'voice_question_answering',
        timestamp: Date.now(),
        duration: questionAnsweringResult.duration,
        passed: questionAnsweringResult.success,
        metrics: questionAnsweringResult.metrics
      });

      const reports = reportGenerator.getReports();
      
      expect(reports).toHaveLength(4);
      for (const report of reports) {
        expect(report.passed).toBe(true);
        expect(report.duration).toBeGreaterThan(0);
      }

      // Verify all voice benchmarks completed successfully
      expect(audioProcessingResult.success).toBe(true);
      expect(textToSpeechResult.success).toBe(true);
      expect(voiceCommandResult.success).toBe(true);
      expect(questionAnsweringResult.success).toBe(true);
      
      // Verify execution time
      expect(executionTime).toBeGreaterThan(0);
    });

    it('should execute multimodal coordination benchmarks and generate report', async () => {
      const startTime = Date.now();
      
      // Execute multimodal coordination benchmarks
      const multimodalInputResult = await benchmarkSuite.runBenchmark(
        'multimodal_input_processing',
        'coordination',
        async () => {
          const input = { image: Buffer.from('mock image data') };
          await visionVoiceController.processMultimodalInput(input);
        }
      );

      const parallelProcessingResult = await benchmarkSuite.runBenchmark(
        'multimodal_parallel_processing',
        'coordination',
        async () => {
          config.fallbackStrategy = 'parallel';
          const parallelController = new VisionVoiceController(config);
          const input = { image: Buffer.from('mock image data'), audio: Buffer.from('mock audio data') };
          await parallelController.processMultimodalInput(input);
        }
      );

      const contextPreservationResult = await benchmarkSuite.runBenchmark(
        'multimodal_context_preservation',
        'coordination',
        async () => {
          // Test context preservation by switching modalities
          visionVoiceController.setCurrentModality('vision');
          const currentModality1 = visionVoiceController.getCurrentModality();
          expect(currentModality1).toBe('vision');
          
          visionVoiceController.setCurrentModality('voice');
          const currentModality2 = visionVoiceController.getCurrentModality();
          expect(currentModality2).toBe('voice');
        }
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Add reports
      reportGenerator.addReport({
        testName: 'multimodal_input_processing',
        timestamp: Date.now(),
        duration: multimodalInputResult.duration,
        passed: multimodalInputResult.success,
        metrics: multimodalInputResult.metrics
      });

      reportGenerator.addReport({
        testName: 'multimodal_parallel_processing',
        timestamp: Date.now(),
        duration: parallelProcessingResult.duration,
        passed: parallelProcessingResult.success,
        metrics: parallelProcessingResult.metrics
      });

      reportGenerator.addReport({
        testName: 'multimodal_context_preservation',
        timestamp: Date.now(),
        duration: contextPreservationResult.duration,
        passed: contextPreservationResult.success,
        metrics: contextPreservationResult.metrics
      });

      const reports = reportGenerator.getReports();
      
      expect(reports).toHaveLength(3);
      for (const report of reports) {
        expect(report.passed).toBe(true);
        expect(report.duration).toBeGreaterThan(0);
      }

      // Verify all multimodal coordination benchmarks completed successfully
      expect(multimodalInputResult.success).toBe(true);
      expect(parallelProcessingResult.success).toBe(true);
      expect(contextPreservationResult.success).toBe(true);
      
      // Verify execution time
      expect(executionTime).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics Collection', () => {
    it('should collect and report performance metrics', async () => {
      // Run a few benchmarks to generate metrics
      await benchmarkSuite.runBenchmark('test_benchmark_1', 'test', async () => {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      await benchmarkSuite.runBenchmark('test_benchmark_2', 'test', async () => {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // Get performance metrics
      const performance = await benchmarkSuite.getPerformanceMetrics();
      
      // Verify performance metrics structure
      expect(performance).toBeDefined();
      expect(performance.handoffLatency).toBeDefined();
      expect(performance.memoryUsage).toBeDefined();
      expect(performance.compressionRatio).toBeDefined();
      expect(performance.eventThroughput).toBeDefined();
      expect(performance.taskCompletionRate).toBeDefined();
      expect(performance.overallFidelity).toBeDefined();
      
      // Verify specific metrics
      expect(performance.taskCompletionRate).toBeGreaterThanOrEqual(0);
      expect(performance.overallFidelity).toBeGreaterThanOrEqual(0);
    });

    it('should detect performance regressions', async () => {
      // Run benchmarks to establish baseline
      await benchmarkSuite.runBenchmark('regression_test_1', 'regression', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      await benchmarkSuite.runBenchmark('regression_test_2', 'regression', async () => {
        await new Promise(resolve => setTimeout(resolve, 15));
      });

      // Run more benchmarks to create historical data
      for (let i = 0; i < 5; i++) {
        await benchmarkSuite.runBenchmark(`historical_test_${i}`, 'historical', async () => {
          await new Promise(resolve => setTimeout(resolve, 5 + i));
        });
      }

      // Check for regressions
      const regressions = benchmarkSuite.detectRegressions();
      
      // Verify regressions structure
      expect(Array.isArray(regressions)).toBe(true);
      
      // Note: In a real scenario, we might have regressions, but in this test
      // environment with limited data, we expect an empty array
      expect(regressions).toBeDefined();
    });

    it('should export Prometheus metrics', async () => {
      // Run a benchmark to generate some metrics
      await benchmarkSuite.runBenchmark('prometheus_test', 'prometheus', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      });

      // Export Prometheus metrics
      const prometheusMetricsString = benchmarkSuite.exportPrometheusMetrics();
      
      // Verify Prometheus metrics format
      expect(typeof prometheusMetricsString).toBe('string');
      expect(prometheusMetricsString).toContain('# HELP');
      expect(prometheusMetricsString).toContain('# TYPE');
    });
  });

  describe('Comprehensive Benchmark Reporting', () => {
    it('should generate comprehensive benchmark report with pass/fail analysis', async () => {
      // Run comprehensive benchmark suite
      const benchmarkResults = await benchmarkSuite.runBenchmarkSuite();
      
      // Get performance metrics
      const performance = await benchmarkSuite.getPerformanceMetrics();
      
      // Check for regressions
      const regressions = benchmarkSuite.detectRegressions();
      
      // Export Prometheus metrics
      const prometheusMetricsString = benchmarkSuite.exportPrometheusMetrics();
      
      // Generate comprehensive report
      const comprehensiveReport = reportGenerator.generateComprehensiveReport(
        benchmarkSuite,
        performance,
        regressions,
        prometheusMetricsString
      );
      
      // Verify comprehensive report structure
      expect(comprehensiveReport.summary).toBeDefined();
      expect(comprehensiveReport.performance).toBeDefined();
      expect(comprehensiveReport.benchmarks).toBeDefined();
      expect(comprehensiveReport.regressions).toBeDefined();
      expect(comprehensiveReport.prometheusMetrics).toBeDefined();
      expect(comprehensiveReport.recommendations).toBeDefined();
      
      // Verify summary
      expect(comprehensiveReport.summary.totalTests).toBe(benchmarkResults.length);
      expect(comprehensiveReport.summary.passedTests).toBeGreaterThanOrEqual(0);
      expect(comprehensiveReport.summary.failedTests).toBeGreaterThanOrEqual(0);
      expect(comprehensiveReport.summary.passRate).toBeGreaterThanOrEqual(0);
      expect(comprehensiveReport.summary.totalDuration).toBeGreaterThanOrEqual(0);
      expect(comprehensiveReport.summary.averageDuration).toBeGreaterThanOrEqual(0);
      
      // Verify benchmarks
      expect(Array.isArray(comprehensiveReport.benchmarks)).toBe(true);
      expect(comprehensiveReport.benchmarks.length).toBe(benchmarkResults.length);
      
      // Verify regressions
      expect(Array.isArray(comprehensiveReport.regressions)).toBe(true);
      
      // Verify Prometheus metrics
      expect(typeof comprehensiveReport.prometheusMetrics).toBe('string');
      
      // Verify recommendations
      expect(Array.isArray(comprehensiveReport.recommendations)).toBe(true);
      expect(comprehensiveReport.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate appropriate recommendations based on benchmark results', async () => {
      // Run a simple benchmark
      await benchmarkSuite.runBenchmark('recommendation_test', 'recommendation', async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Get performance metrics
      const performance = await benchmarkSuite.getPerformanceMetrics();
      
      // Check for regressions
      const regressions = benchmarkSuite.detectRegressions();
      
      // Export Prometheus metrics
      const prometheusMetricsString = benchmarkSuite.exportPrometheusMetrics();
      
      // Generate comprehensive report
      const comprehensiveReport = reportGenerator.generateComprehensiveReport(
        benchmarkSuite,
        performance,
        regressions,
        prometheusMetricsString
      );
      
      // Verify recommendations exist
      expect(comprehensiveReport.recommendations).toBeDefined();
      expect(Array.isArray(comprehensiveReport.recommendations)).toBe(true);
      expect(comprehensiveReport.recommendations.length).toBeGreaterThan(0);
      
      // Verify recommendations content
      const recommendations = comprehensiveReport.recommendations;
      expect(recommendations.some(rec => rec.includes('ready for production'))).toBe(true);
    });
  });

  describe('Benchmark Report Validation', () => {
    it('should validate benchmark results meet pass/fail criteria', async () => {
      // Run a benchmark that should pass
      const passingBenchmark = await benchmarkSuite.runBenchmark(
        'validation_passing_test',
        'validation',
        async () => {
          // Simple operation that should succeed
          const result = 1 + 1;
          expect(result).toBe(2);
        }
      );
      
      // Verify benchmark passed
      expect(passingBenchmark.success).toBe(true);
      expect(passingBenchmark.error).toBeUndefined();
      
      // Run a benchmark that should fail
      const failingBenchmark = await benchmarkSuite.runBenchmark(
        'validation_failing_test',
        'validation',
        async () => {
          // Operation that should fail
          throw new Error('Intentional test failure');
        }
      );
      
      // Verify benchmark failed
      expect(failingBenchmark.success).toBe(false);
      expect(failingBenchmark.error).toBeDefined();
      expect(failingBenchmark.error).toBe('Intentional test failure');
    });

    it('should handle edge cases in benchmark reporting', async () => {
      // Run benchmark with very short execution time
      const quickBenchmark = await benchmarkSuite.runBenchmark(
        'edge_case_quick_test',
        'edge',
        async () => {
          // Very quick operation
          const x = 1;
        }
      );
      
      // Verify quick benchmark completed
      expect(quickBenchmark.success).toBe(true);
      expect(quickBenchmark.duration).toBeGreaterThanOrEqual(0);
      
      // Run benchmark with longer execution time
      const slowBenchmark = await benchmarkSuite.runBenchmark(
        'edge_case_slow_test',
        'edge',
        async () => {
          // Longer operation
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      );
      
      // Verify slow benchmark completed
      expect(slowBenchmark.success).toBe(true);
      expect(slowBenchmark.duration).toBeGreaterThanOrEqual(50);
      
      // Compare durations
      expect(slowBenchmark.duration).toBeGreaterThan(quickBenchmark.duration);
    });
  });
});