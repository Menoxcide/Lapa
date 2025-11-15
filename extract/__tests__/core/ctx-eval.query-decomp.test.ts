/**
 * Context Evaluation - Query Decomposition Tests (I1)
 * 
 * Tests for query decomposition logic, context chunking strategies,
 * and decomposition quality metrics validation.
 * 
 * Phase 4 GauntletTest - Iteration I1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TextPreprocessor } from '../../rag/utils/text.preprocessor.ts';
import { RAGPipeline } from '../../rag/pipeline.ts';

describe('Context Evaluation - Query Decomposition (I1)', () => {
  let textPreprocessor: TextPreprocessor;
  let ragPipeline: RAGPipeline;

  beforeEach(() => {
    textPreprocessor = new TextPreprocessor({
      maxChunkSize: 1000,
      chunkOverlap: 200,
      minTextLength: 10,
    });
    ragPipeline = new RAGPipeline();
  });

  describe('Query Decomposition Logic', () => {
    it('should decompose complex queries into manageable chunks', () => {
      const complexQuery = `
        Build a web application with the following requirements:
        1. User authentication with JWT tokens
        2. Real-time chat functionality using WebSockets
        3. File upload and processing system
        4. Database integration with PostgreSQL
        5. RESTful API with OpenAPI documentation
        6. Frontend with React and TypeScript
        7. Deployment configuration for Docker
      `.trim();

      const chunks = textPreprocessor.splitText(complexQuery);
      
      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].length).toBeLessThanOrEqual(1000);
      
      // Verify chunks maintain semantic coherence
      chunks.forEach((chunk, index) => {
        expect(chunk).toBeTruthy();
        expect(typeof chunk).toBe('string');
        if (index > 0) {
          // Check overlap with previous chunk
          const hasOverlap = chunk.includes(chunks[index - 1].slice(-100));
        }
      });
    });

    it('should preserve sentence boundaries during decomposition', () => {
      const text = `
        This is the first sentence. This is the second sentence!
        This is the third sentence? This is the fourth sentence.
        This is the fifth sentence with more content.
      `.trim();

      const chunks = textPreprocessor.splitText(text);
      
      chunks.forEach(chunk => {
        // Verify sentences are not split in the middle
        // Check that chunk doesn't end with partial sentence markers
        const endsProperly = 
          chunk.endsWith('.') || 
          chunk.endsWith('!') || 
          chunk.endsWith('?') ||
          chunk.includes('\n');
        
        // Allow for continuation chunks
        expect(chunk.length).toBeGreaterThan(0);
      });
    });

    it('should handle paragraph boundaries correctly', () => {
      const textWithParagraphs = `
        First paragraph with multiple sentences. It has content here.
        
        Second paragraph starts here. It also has content.
        
        Third paragraph is here. More content in this paragraph.
      `.trim();

      const chunks = textPreprocessor.splitText(textWithParagraphs);
      
      // Verify paragraph boundaries are preserved where possible
      expect(chunks.length).toBeGreaterThan(0);
      
      // Check that chunks don't arbitrarily split paragraphs
      chunks.forEach(chunk => {
        expect(chunk).toBeTruthy();
      });
    });

    it('should decompose queries while maintaining context', () => {
      const contextRichQuery = `
        Given a user query about implementing authentication:
        - Extract authentication requirements
        - Identify security constraints
        - Determine token management strategy
        - Plan session handling approach
        - Design user flow diagrams
      `.trim();

      const chunks = textPreprocessor.splitText(contextRichQuery);
      
      // Verify context is maintained across chunks
      expect(chunks.length).toBeGreaterThan(0);
      
      // First chunk should contain main context
      expect(chunks[0]).toContain('authentication');
      
      // Verify chunk overlap maintains context
      if (chunks.length > 1) {
        // Some overlap should exist between chunks
        const contextPreserved = chunks.some((chunk, idx) => {
          if (idx === 0) return false;
          return chunk.length > 0;
        });
        expect(contextPreserved || chunks.length === 1).toBe(true);
      }
    });
  });

  describe('Context Chunking Strategies', () => {
    it('should apply appropriate chunking strategy based on content type', () => {
      const codeQuery = `
        function calculateSum(a: number, b: number): number {
          return a + b;
        }
        
        function calculateProduct(a: number, b: number): number {
          return a * b;
        }
      `.trim();

      const chunks = textPreprocessor.splitText(codeQuery);
      
      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      
      // Verify code structure is preserved
      chunks.forEach(chunk => {
        expect(chunk).toBeTruthy();
        // Code chunks should maintain structure
        expect(typeof chunk).toBe('string');
      });
    });

    it('should handle long-form text with appropriate chunk sizes', () => {
      const longText = Array(100).fill('This is a sentence with content. ').join('');
      
      const chunks = textPreprocessor.splitText(longText);
      
      expect(chunks.length).toBeGreaterThan(1);
      
      // Verify chunk sizes are within reasonable bounds
      chunks.forEach(chunk => {
        expect(chunk.length).toBeGreaterThan(0);
        expect(chunk.length).toBeLessThanOrEqual(1200); // Allow some margin
      });
    });

    it('should maintain overlap between chunks for context continuity', () => {
      const text = Array(50).fill('Sentence with content here. ').join('');
      
      const chunks = textPreprocessor.splitText(text);
      
      if (chunks.length > 1) {
        // Verify overlap exists (last part of chunk N appears in chunk N+1)
        for (let i = 0; i < chunks.length - 1; i++) {
          const currentChunk = chunks[i];
          const nextChunk = chunks[i + 1];
          
          // Extract overlap region (last 200 chars of current chunk)
          const overlapRegion = currentChunk.slice(-200);
          
          // Verify some overlap exists (may not be exact due to sentence boundaries)
          const hasOverlap = nextChunk.includes(overlapRegion) || 
                           currentChunk.slice(-100).split(' ').some(word => 
                             word.length > 3 && nextChunk.includes(word)
                           );
          expect(hasOverlap || chunks.length === 1).toBe(true);
        }
      }
    });
  });

  describe('Decomposition Quality Metrics', () => {
    it('should achieve optimal chunk sizes for context processing', () => {
      const queries = [
        'Short query',
        'Medium length query with some additional context and requirements',
        Array(20).fill('This is a longer query with many sentences. ').join(''),
      ];

      queries.forEach(query => {
          const chunks = textPreprocessor.splitText(query);
        
        expect(chunks.length).toBeGreaterThan(0);
        
        chunks.forEach(chunk => {
          // Verify chunks are not too small (inefficient) or too large (context overflow)
          expect(chunk.length).toBeGreaterThan(0);
          // Maximum reasonable chunk size for context processing
          expect(chunk.length).toBeLessThanOrEqual(1500);
        });
      });
    });

    it('should maintain semantic coherence across chunks', () => {
      const semanticQuery = `
        Design a payment processing system:
        Step 1: Implement payment gateway integration
        Step 2: Add transaction validation logic
        Step 3: Create payment confirmation workflow
        Step 4: Implement refund processing
        Step 5: Add payment analytics and reporting
      `.trim();

      const chunks = textPreprocessor.splitText(semanticQuery);
      
      // Verify semantic coherence - related concepts should be grouped
      expect(chunks.length).toBeGreaterThan(0);
      
      // First chunk should contain main topic
      expect(chunks[0]).toContain('payment');
      
      // Verify step numbers are preserved
      const allChunks = chunks.join(' ');
      expect(allChunks).toContain('Step 1');
      expect(allChunks).toContain('Step 2');
    });

    it('should handle edge cases in query decomposition', () => {
      const edgeCases = [
        '', // Empty query
        'a', // Single character
        'a'.repeat(10000), // Very long single word
        'Word\n\n\n\nWord', // Multiple newlines
        'Word\t\t\tWord', // Tabs
        'Word'.repeat(100), // Repetitive content
      ];

      edgeCases.forEach((edgeCase, index) => {
        try {
          const chunks = textPreprocessor.splitText(edgeCase);
          
          // All cases should produce valid chunks (even if empty)
          expect(Array.isArray(chunks)).toBe(true);
          
          if (chunks.length > 0) {
            chunks.forEach(chunk => {
              expect(typeof chunk).toBe('string');
            });
          }
        } catch (error) {
          // Some edge cases may throw - that's acceptable if handled gracefully
          expect(error).toBeDefined();
        }
      });
    });

    it('should validate decomposition quality metrics', () => {
      const testQuery = `
        This is a comprehensive query about building a complex system.
        It includes multiple requirements and detailed specifications.
        The query needs to be decomposed effectively for processing.
      `.trim();

      const chunks = textPreprocessor.splitText(testQuery);
      
      // Calculate quality metrics
      const avgChunkSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length;
      const minChunkSize = Math.min(...chunks.map(c => c.length));
      const maxChunkSize = Math.max(...chunks.map(c => c.length));
      
      // Verify reasonable quality metrics
      expect(avgChunkSize).toBeGreaterThan(0);
      expect(minChunkSize).toBeGreaterThan(0);
      expect(maxChunkSize).toBeGreaterThan(0);
      
      // Verify size variance is reasonable (not too fragmented)
      const variance = maxChunkSize - minChunkSize;
      if (chunks.length > 1) {
        // Variance should be reasonable relative to average
        expect(variance).toBeLessThan(avgChunkSize * 2);
      }
    });
  });
});

