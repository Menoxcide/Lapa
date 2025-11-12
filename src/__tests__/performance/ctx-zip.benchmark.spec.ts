import { describe, it, expect } from "vitest";
import {
  compressContext,
  decompressContext,
  testCtxZipCompression
} from '../../mcp/ctx-zip.integration.ts';

describe('ctx-zip Performance Benchmarks', () => {
  describe('Compression Performance', () => {
    const testPayloads = [
      { name: 'Small', size: 100 },
      { name: 'Medium', size: 1000 },
      { name: 'Large', size: 10000 },
      { name: 'Extra Large', size: 100000 }
    ];

    testPayloads.forEach(({ name, size }) => {
      it(`should compress ${name} payload efficiently`, async () => {
        const payload = 'Test data payload. '.repeat(size);
        
        // Measure compression time
        const start = performance.now();
        const compressed = await compressContext(payload);
        const compressionTime = performance.now() - start;
        
        // Measure decompression time
        const decompStart = performance.now();
        const decompressed = await decompressContext(compressed);
        const decompressionTime = performance.now() - decompStart;
        
        // Verify correctness
        expect(decompressed).toBe(payload);
        
        // Verify compression ratio
        const compressionRatio = payload.length / compressed.length;
        const reductionPercentage = (1 - compressed.length / payload.length) * 100;
        
        console.log(`${name} Payload Benchmark:`);
        console.log(`  Original Size: ${payload.length} bytes`);
        console.log(`  Compressed Size: ${compressed.length} bytes`);
        console.log(`  Compression Ratio: ${compressionRatio.toFixed(2)}x`);
        console.log(`  Reduction: ${reductionPercentage.toFixed(2)}%`);
        console.log(`  Compression Time: ${compressionTime.toFixed(2)}ms`);
        console.log(`  Decompression Time: ${decompressionTime.toFixed(2)}ms`);
        
        // Performance assertions
        expect(compressionRatio).toBeGreaterThan(2); // At least 2x compression
        expect(reductionPercentage).toBeGreaterThan(50); // At least 50% reduction
        expect(compressionTime).toBeLessThan(1000); // Should compress within 1 second
        expect(decompressionTime).toBeLessThan(500); // Should decompress within 500ms
      });
    });
  });

  describe('Throughput Benchmarks', () => {
    it('should handle high throughput compression operations', async () => {
      const payload = 'High throughput test data. '.repeat(1000);
      const operationCount = 50;
      
      const start = performance.now();
      
      // Perform multiple compression operations
      const promises = [];
      for (let i = 0; i < operationCount; i++) {
        promises.push(compressContext(payload));
      }
      
      const results = await Promise.all(promises);
      const totalTime = performance.now() - start;
      const avgTimePerOperation = totalTime / operationCount;
      
      // Verify all operations succeeded
      expect(results).toHaveLength(operationCount);
      results.forEach(result => {
        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
      });
      
      console.log('Throughput Benchmark:');
      console.log(`  Operations: ${operationCount}`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Time per Operation: ${avgTimePerOperation.toFixed(2)}ms`);
      console.log(`  Operations per Second: ${(1000 / avgTimePerOperation).toFixed(2)}`);
      
      // Performance assertions
      expect(avgTimePerOperation).toBeLessThan(100); // Average < 100ms per operation
      expect(totalTime).toBeLessThan(5000); // Total < 5 seconds
    });
  });

  describe('Memory Efficiency', () => {
    it('should maintain memory efficiency with large payloads', async () => {
      // Create a very large payload
      const largePayload = 'Memory efficiency test. '.repeat(50000); // ~1MB payload
      
      // Get initial memory usage
      const initialMemory = process.memoryUsage();
      
      // Perform compression
      const compressed = await compressContext(largePayload);
      
      // Get memory usage after compression
      const compressionMemory = process.memoryUsage();
      
      // Perform decompression
      const decompressed = await decompressContext(compressed);
      
      // Get final memory usage
      const finalMemory = process.memoryUsage();
      
      // Verify correctness
      expect(decompressed).toBe(largePayload);
      
      // Calculate memory differences
      const compressionMemoryIncrease = 
        (compressionMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB
      const finalMemoryIncrease = 
        (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB
      
      console.log('Memory Efficiency Benchmark:');
      console.log(`  Payload Size: ${(largePayload.length / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Compressed Size: ${(compressed.length / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Memory During Compression: ${compressionMemoryIncrease.toFixed(2)}MB increase`);
      console.log(`  Memory After Decompression: ${finalMemoryIncrease.toFixed(2)}MB increase`);
      
      // Memory efficiency assertions
      // Compression should not use excessive memory
      expect(compressionMemoryIncrease).toBeLessThan(10); // Less than 10MB increase
      // Final state should be cleaned up
      expect(finalMemoryIncrease).toBeLessThan(5); // Less than 5MB increase after cleanup
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent compression and decompression', async () => {
      const payloads = [
        'Payload A. '.repeat(1000),
        'Payload B. '.repeat(2000),
        'Payload C. '.repeat(3000),
        'Payload D. '.repeat(4000),
        'Payload E. '.repeat(5000)
      ];
      
      const start = performance.now();
      
      // Create concurrent operations
      const compressionPromises = payloads.map(payload => compressContext(payload));
      const compressedResults = await Promise.all(compressionPromises);
      
      const decompressionPromises = compressedResults.map(compressed => decompressContext(compressed));
      const decompressedResults = await Promise.all(decompressionPromises);
      
      const totalTime = performance.now() - start;
      
      // Verify correctness
      expect(decompressedResults).toHaveLength(payloads.length);
      for (let i = 0; i < payloads.length; i++) {
        expect(decompressedResults[i]).toBe(payloads[i]);
      }
      
      console.log('Concurrent Operations Benchmark:');
      console.log(`  Concurrent Operations: ${payloads.length}`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Time per Operation: ${(totalTime / payloads.length).toFixed(2)}ms`);
      
      // Performance assertions
      expect(totalTime).toBeLessThan(2000); // All operations < 2 seconds
    });
  });

  describe('Edge Cases Performance', () => {
    it('should handle empty and minimal payloads efficiently', async () => {
      const testCases = [
        { name: 'Empty String', payload: '' },
        { name: 'Single Character', payload: 'A' },
        { name: 'Small JSON', payload: '{"a":1}' },
        { name: 'Repeated Characters', payload: 'AAAAAAAAAA' }
      ];
      
      for (const { name, payload } of testCases) {
        const start = performance.now();
        const compressed = await compressContext(payload);
        const compressionTime = performance.now() - start;
        
        const decompStart = performance.now();
        const decompressed = await decompressContext(compressed);
        const decompressionTime = performance.now() - decompStart;
        
        expect(decompressed).toBe(payload);
        
        console.log(`${name} Performance:`);
        console.log(`  Compression Time: ${compressionTime.toFixed(4)}ms`);
        console.log(`  Decompression Time: ${decompressionTime.toFixed(4)}ms`);
        
        // Even for small payloads, operations should be fast
        expect(compressionTime).toBeLessThan(50);
        expect(decompressionTime).toBeLessThan(50);
      }
    });

    it('should handle highly compressible data', async () => {
      // Create highly repetitive data that should compress very well
      const repetitiveData = 'This is a highly repetitive string. '.repeat(10000);
      
      const start = performance.now();
      const compressed = await compressContext(repetitiveData);
      const compressionTime = performance.now() - start;
      
      const decompStart = performance.now();
      const decompressed = await decompressContext(compressed);
      const decompressionTime = performance.now() - decompStart;
      
      // Verify correctness
      expect(decompressed).toBe(repetitiveData);
      
      // Verify excellent compression ratio
      const compressionRatio = repetitiveData.length / compressed.length;
      const reductionPercentage = (1 - compressed.length / repetitiveData.length) * 100;
      
      console.log('Highly Compressible Data Benchmark:');
      console.log(`  Original Size: ${repetitiveData.length} bytes`);
      console.log(`  Compressed Size: ${compressed.length} bytes`);
      console.log(`  Compression Ratio: ${compressionRatio.toFixed(2)}x`);
      console.log(`  Reduction: ${reductionPercentage.toFixed(2)}%`);
      console.log(`  Compression Time: ${compressionTime.toFixed(2)}ms`);
      console.log(`  Decompression Time: ${decompressionTime.toFixed(2)}ms`);
      
      // For highly repetitive data, we expect excellent compression
      expect(compressionRatio).toBeGreaterThan(10); // At least 10x compression
      expect(reductionPercentage).toBeGreaterThan(90); // At least 90% reduction
    });

    it('should handle poorly compressible data', async () => {
      // Create random data that is difficult to compress
      let randomData = '';
      for (let i = 0; i < 50000; i++) {
        randomData += String.fromCharCode(Math.floor(Math.random() * 256));
      }
      
      const start = performance.now();
      const compressed = await compressContext(randomData);
      const compressionTime = performance.now() - start;
      
      const decompStart = performance.now();
      const decompressed = await decompressContext(compressed);
      const decompressionTime = performance.now() - decompStart;
      
      // Verify correctness
      expect(decompressed).toBe(randomData);
      
      // For random data, compression should be minimal
      const compressionRatio = randomData.length / compressed.length;
      const reductionPercentage = (1 - compressed.length / randomData.length) * 100;
      
      console.log('Poorly Compressible Data Benchmark:');
      console.log(`  Original Size: ${randomData.length} bytes`);
      console.log(`  Compressed Size: ${compressed.length} bytes`);
      console.log(`  Compression Ratio: ${compressionRatio.toFixed(2)}x`);
      console.log(`  Reduction: ${reductionPercentage.toFixed(2)}%`);
      console.log(`  Compression Time: ${compressionTime.toFixed(2)}ms`);
      console.log(`  Decompression Time: ${decompressionTime.toFixed(2)}ms`);
      
      // For random data, we expect little to no compression
      expect(compressionRatio).toBeGreaterThan(0.8); // No more than 20% expansion
      expect(reductionPercentage).toBeGreaterThan(-20); // No more than 20% expansion
    });
  });

  describe('Long Running Stability', () => {
    it('should maintain performance over extended usage', async () => {
      const payload = 'Stability test payload. '.repeat(1000);
      const iterations = 1000;
      
      const times = [];
      let totalCompressedSize = 0;
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const compressed = await compressContext(payload);
        const time = performance.now() - start;
        
        times.push(time);
        totalCompressedSize += compressed.length;
        
        // Add a small delay to simulate real usage
        if (i % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
      
      // Calculate statistics
      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const totalTime = times.reduce((sum, t) => sum + t, 0);
      
      console.log('Long Running Stability Benchmark:');
      console.log(`  Iterations: ${iterations}`);
      console.log(`  Average Time: ${avgTime.toFixed(4)}ms`);
      console.log(`  Min Time: ${minTime.toFixed(4)}ms`);
      console.log(`  Max Time: ${maxTime.toFixed(4)}ms`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Compressed Size: ${(totalCompressedSize / iterations).toFixed(2)} bytes`);
      
      // Performance should remain stable
      expect(avgTime).toBeLessThan(50); // Average < 50ms
      expect(maxTime).toBeLessThan(200); // Max < 200ms (allowing for occasional GC)
      expect(minTime).toBeGreaterThan(0); // All times should be positive
    });
  });
});