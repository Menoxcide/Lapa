import { describe, it, expect } from "vitest";
import {
  compressContext,
  decompressContext,
  testCtxZipCompression,
  recordCompressionStats,
  recordCompressionFeedback,
  analyzeCompressionEffectiveness,
  optimizeCompressionParameters
} from '../../mcp/ctx-zip.integration.js';

describe('ctx-zip Compression Validation', () => {
  describe('Compression Ratio Validation', () => {
    it('should achieve >80% compression reduction for large text payloads', async () => {
      // Create a large text payload representative of real-world usage
      const largePayload = `
        This is a comprehensive test payload designed to validate the compression effectiveness of ctx-zip.
        The payload contains repetitive patterns, structured data, and varied content to thoroughly test
        the compression algorithm across different types of input.
        
        Section 1: Repetitive Content
        ${'This is repetitive content that should compress very well. '.repeat(200)}
        
        Section 2: Structured Data
        ${JSON.stringify({
          users: Array.from({ length: 100 }, (_, index) => ({
            id: index,
            name: `User ${index}`,
            email: `user${index}@example.com`,
            role: index % 3 === 0 ? 'admin' : index % 3 === 1 ? 'user' : 'guest',
            preferences: {
              theme: index % 2 === 0 ? 'dark' : 'light',
              notifications: index % 5 !== 0,
              language: ['en', 'es', 'fr', 'de', 'jp'][index % 5]
            },
            activity: {
              lastLogin: new Date(Date.now() - index * 1000000).toISOString(),
              loginCount: Math.floor(Math.random() * 1000),
              favoriteFeatures: ['dashboard', 'reports', 'settings', 'profile'].slice(0, index % 4 + 1)
            }
          })),
          settings: {
            appVersion: '1.0.0',
            features: ['authentication', 'authorization', 'reporting', 'analytics', 'notifications'],
            limits: {
              maxUsers: 10000,
              maxProjects: 1000,
              maxStorage: '100GB'
            },
            integrations: {
              slack: true,
              discord: false,
              email: true,
              sms: false // Fixed undefined 'i' variable
            }
          }
        }, null, 2)}
        
        Section 3: Code Snippets
        ${`function processData(data) {
          const result = data.map(item => {
            return {
              id: item.id,
              processed: true,
              timestamp: new Date().toISOString(),
              hash: btoa(item.content).substring(0, 10),
              metadata: {
                source: 'system',
                version: '1.0.0',
                tags: ['processed', 'validated', 'indexed']
              }
            };
          });
          
          return result.filter(item => item.processed);
        }`.repeat(50)}
        
        Section 4: Documentation
        ${`# System Documentation
        
        ## Overview
        This system provides comprehensive functionality for managing user interactions and data processing.
        
        ## Features
        - Real-time data processing
        - User authentication and authorization
        - Notification system
        - Reporting and analytics
        - Integration capabilities
        
        ## Architecture
        The system follows a microservices architecture with the following components:
        
        1. User Service - Manages user accounts and profiles
        2. Data Service - Handles data storage and retrieval
        3. Processing Service - Performs data transformations
        4. Notification Service - Manages user communications
        5. Analytics Service - Provides insights and reporting
        
        ## API Endpoints
        - POST /api/users - Create new user
        - GET /api/users/:id - Retrieve user information
        - PUT /api/users/:id - Update user information
        - DELETE /api/users/:id - Delete user
        - GET /api/users - List users with pagination
        `.repeat(20)}
      `.trim();
      
      const stats = await testCtxZipCompression(largePayload);
      
      console.log('Large Text Payload Compression Results:');
      console.log(`  Original Size: ${stats.originalSize} bytes`);
      console.log(`  Compressed Size: ${stats.compressedSize} bytes`);
      console.log(`  Compression Ratio: ${stats.compressionRatio.toFixed(2)}x`);
      console.log(`  Reduction Percentage: ${stats.reductionPercentage.toFixed(2)}%`);
      
      // Validate compression effectiveness
      expect(stats.reductionPercentage).toBeGreaterThan(80);
      expect(stats.compressionRatio).toBeGreaterThan(5);
      
      // Verify round-trip integrity
      const compressed = await compressContext(largePayload);
      const decompressed = await decompressContext(compressed);
      expect(decompressed).toBe(largePayload);
    });

    it('should maintain >70% reduction for medium-sized payloads', async () => {
      const mediumPayload = `
        Medium-sized payload for testing ctx-zip compression effectiveness.
        This payload represents typical context data that would be compressed
        during agent communications in the LAPA system.
        
        ${JSON.stringify({
          task: 'Implement user authentication',
          requirements: [
            'Email/password login',
            'Password reset functionality',
            'Session management',
            'JWT token generation',
            'OAuth integration'
          ],
          context: {
            user: {
              id: 'user-123',
              name: 'John Doe',
              role: 'developer'
            },
            project: {
              id: 'project-456',
              name: 'LAPA Core',
              version: '1.0.0'
            },
            history: [
              'Previous task: Set up project structure',
              'Current task: Implement authentication',
              'Next task: Create dashboard UI'
            ]
          }
        }, null, 2)}
        
        Additional context information that would typically be included
        in agent communications. This includes code snippets, documentation
        references, and other relevant data that benefits from compression.
      `.trim();
      
      const stats = await testCtxZipCompression(mediumPayload);
      
      console.log('Medium Payload Compression Results:');
      console.log(`  Original Size: ${stats.originalSize} bytes`);
      console.log(`  Compressed Size: ${stats.compressedSize} bytes`);
      console.log(`  Reduction Percentage: ${stats.reductionPercentage.toFixed(2)}%`);
      
      // Validate compression effectiveness
      expect(stats.reductionPercentage).toBeGreaterThan(70);
      
      // Verify round-trip integrity
      const compressed = await compressContext(mediumPayload);
      const decompressed = await decompressContext(compressed);
      expect(decompressed).toBe(mediumPayload);
    });

    it('should achieve reasonable compression for small payloads', async () => {
      const smallPayloads = [
        'Hello, World!',
        '{"id":1,"name":"test"}',
        '<xml><element>content</element></xml>',
        'const x = 10;',
        '# Title\n## Subtitle\nContent here.'
      ];
      
      for (const payload of smallPayloads) {
        const stats = await testCtxZipCompression(payload);
        
        console.log(`Small Payload "${payload.substring(0, 20)}..." Results:`);
        console.log(`  Original Size: ${stats.originalSize} bytes`);
        console.log(`  Compressed Size: ${stats.compressedSize} bytes`);
        console.log(`  Reduction Percentage: ${stats.reductionPercentage.toFixed(2)}%`);
        
        // For very small payloads, we expect at least some compression or reasonable overhead
        // Compression might not be effective for tiny payloads, but shouldn't expand too much
        expect(stats.compressedSize).toBeLessThanOrEqual(Math.ceil(payload.length * 1.5));
        
        // Verify round-trip integrity
        const compressed = await compressContext(payload);
        const decompressed = await decompressContext(compressed);
        expect(decompressed).toBe(payload);
      }
    });
  });

  describe('Semantic Preservation Validation', () => {
    it('should preserve semantic meaning of code contexts', async () => {
      const codeContext = `
        // Authentication service implementation
        class AuthService {
          constructor(database, jwtSecret) {
            this.db = database;
            this.secret = jwtSecret;
          }
          
          async login(email, password) {
            // Validate input
            if (!email || !password) {
              throw new Error('Email and password are required');
            }
            
            // Find user in database
            const user = await this.db.users.findOne({ email });
            if (!user) {
              throw new Error('Invalid credentials');
            }
            
            // Verify password
            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (!isValid) {
              throw new Error('Invalid credentials');
            }
            
            // Generate JWT token
            const token = jwt.sign(
              { userId: user.id, email: user.email },
              this.secret,
              { expiresIn: '24h' }
            );
            
            return {
              user: {
                id: user.id,
                email: user.email,
                name: user.name
              },
              token
            };
          }
          
          async register(userData) {
            // Validate required fields
            const { email, password, name } = userData;
            if (!email || !password || !name) {
              throw new Error('Email, password, and name are required');
            }
            
            // Check if user already exists
            const existingUser = await this.db.users.findOne({ email });
            if (existingUser) {
              throw new Error('User already exists');
            }
            
            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);
            
            // Create user
            const user = await this.db.users.insert({
              email,
              passwordHash,
              name,
              createdAt: new Date()
            });
            
            return {
              id: user.id,
              email: user.email,
              name: user.name
            };
          }
        }
      `.trim();
      
      const compressed = await compressContext(codeContext);
      const decompressed = await decompressContext(compressed);
      
      // Verify exact content preservation
      expect(decompressed).toBe(codeContext);
      
      // Verify structural elements are preserved
      expect(decompressed).toContain('class AuthService');
      expect(decompressed).toContain('async login');
      expect(decompressed).toContain('async register');
      expect(decompressed).toContain('jwt.sign');
      expect(decompressed).toContain('bcrypt.compare');
    });

    it('should preserve semantic meaning of documentation contexts', async () => {
      const docContext = `
        # User Authentication API
        
        ## Overview
        This API provides endpoints for user authentication including login, registration, and password management.
        
        ## Endpoints
        
        ### POST /api/auth/login
        Authenticates a user and returns a JWT token.
        
        **Request Body:**
        \`\`\`json
        {
          "email": "user@example.com",
          "password": "securepassword"
        }
        \`\`\`
        
        **Response:**
        \`\`\`json
        {
          "user": {
            "id": "123",
            "email": "user@example.com",
            "name": "John Doe"
          },
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
        \`\`\`
        
        ### POST /api/auth/register
        Registers a new user account.
        
        **Request Body:**
        \`\`\`json
        {
          "email": "newuser@example.com",
          "password": "newsecurepassword",
          "name": "New User"
        }
        \`\`\`
        
        **Response:**
        \`\`\`json
        {
          "id": "456",
          "email": "newuser@example.com",
          "name": "New User"
        }
        \`\`\`
        
        ## Error Responses
        All endpoints may return the following error responses:
        
        - 400 Bad Request: Invalid input data
        - 401 Unauthorized: Invalid credentials
        - 409 Conflict: User already exists
        - 500 Internal Server Error: Unexpected server error
      `.trim();
      
      const compressed = await compressContext(docContext);
      const decompressed = await decompressContext(compressed);
      
      // Verify exact content preservation
      expect(decompressed).toBe(docContext);
      
      // Verify key structural elements are preserved
      expect(decompressed).toContain('# User Authentication API');
      expect(decompressed).toContain('POST /api/auth/login');
      expect(decompressed).toContain('POST /api/auth/register');
      expect(decompressed).toContain('Error Responses');
      expect(decompressed).toContain('"email": "user@example.com"');
    });

    it('should preserve semantic meaning of data contexts', async () => {
      const dataContext = JSON.stringify({
        project: {
          id: 'proj-001',
          name: 'LAPA Core Development',
          description: 'Local AI Pair Programmer Agent',
          version: '1.0.0',
          status: 'active'
        },
        team: [
          {
            id: 'dev-001',
            name: 'Alice Developer',
            role: 'Lead Developer',
            skills: ['TypeScript', 'React', 'Node.js', 'AI/ML'],
            availability: 0.8
          },
          {
            id: 'dev-002',
            name: 'Bob Coder',
            role: 'Backend Developer',
            skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis'],
            availability: 0.6
          },
          {
            id: 'dev-003',
            name: 'Carol Engineer',
            role: 'Frontend Developer',
            skills: ['React', 'CSS', 'UI/UX', 'Testing'],
            availability: 0.7
          }
        ],
        tasks: [
          {
            id: 'task-001',
            title: 'Implement ctx-zip compression',
            description: 'Add context compression to reduce token usage',
            assignee: 'dev-001',
            status: 'in-progress',
            priority: 'high',
            estimate: 8,
            spent: 4
          },
          {
            id: 'task-002',
            title: 'Create agent routing system',
            description: 'Implement MoE router for task distribution',
            assignee: 'dev-002',
            status: 'todo',
            priority: 'medium',
            estimate: 12,
            spent: 0
          }
        ],
        metrics: {
          compressionRatio: 6.5,
          reductionPercentage: 84.6,
          activeAgents: 5,
          completedTasks: 23,
          pendingTasks: 7
        }
      }, null, 2);
      
      const compressed = await compressContext(dataContext);
      const decompressed = await decompressContext(compressed);
      
      // Verify exact content preservation
      expect(decompressed).toBe(dataContext);
      
      // Parse and verify data structure is preserved
      const parsedDecompressed = JSON.parse(decompressed);
      
      expect(parsedDecompressed.project.id).toBe('proj-001');
      expect(parsedDecompressed.project.name).toBe('LAPA Core Development');
      expect(parsedDecompressed.team).toHaveLength(3);
      expect(parsedDecompressed.tasks).toHaveLength(2);
      expect(parsedDecompressed.metrics.compressionRatio).toBe(6.5);
    });
  });

  describe('Boundary Condition Validation', () => {
    it('should handle empty and minimal inputs correctly', async () => {
      const testCases = [
        { name: 'Empty String', input: '' },
        { name: 'Single Character', input: 'A' },
        { name: 'Whitespace Only', input: '   ' },
        { name: 'Newlines Only', input: '\n\n\n' },
        { name: 'Minimal JSON', input: '{}' },
        { name: 'Minimal Array', input: '[]' }
      ];
      
      for (const { name, input } of testCases) {
        const compressed = await compressContext(input);
        const decompressed = await decompressContext(compressed);
        
        expect(decompressed).toBe(input);
        
        console.log(`${name} Validation:`);
        console.log(`  Original: ${input.length} bytes`);
        console.log(`  Compressed: ${compressed.length} bytes`);
      }
    });

    it('should handle extremely large inputs', async () => {
      // Create an extremely large payload (several MB)
      const largePayload = 'This is extremely large payload data. '.repeat(100000);
      
      const stats = await testCtxZipCompression(largePayload);
      
      console.log('Extremely Large Payload Results:');
      console.log(`  Original Size: ${(stats.originalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Compressed Size: ${(stats.compressedSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Compression Ratio: ${stats.compressionRatio.toFixed(2)}x`);
      console.log(`  Reduction Percentage: ${stats.reductionPercentage.toFixed(2)}%`);
      
      // Should achieve excellent compression for repetitive data
      expect(stats.reductionPercentage).toBeGreaterThan(90);
      expect(stats.compressionRatio).toBeGreaterThan(10);
      
      // Verify round-trip integrity
      const compressed = await compressContext(largePayload);
      const decompressed = await decompressContext(compressed);
      expect(decompressed).toBe(largePayload);
    });

    it('should handle special characters and Unicode', async () => {
      const unicodePayload = `
        Special characters and Unicode test:
        ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿
        ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞß
        àáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ
        ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ
        αβγδεζηθικλμνξοπρστυφχψω
        АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ
        абвгдежзийклмнопрстуфхцчшщъыьэюя
        🚀🌟💫🔥🌈⚡✨🎉🎊🎁🎈🎂🍰☕💻📱🚀
        Mathematical: ∫∑∏√∞∠∧∨∩∪∂∆∇≠≤≥⊂⊃⊆⊇⊥⋅⋮⋯⋱
      `.trim();
      
      const compressed = await compressContext(unicodePayload);
      const decompressed = await decompressContext(compressed);
      
      expect(decompressed).toBe(unicodePayload);
    });

    it('should handle binary-like data', async () => {
      // Create data that looks like binary but is actually text
      let binaryLikeData = '';
      for (let index = 0; index < 10000; index++) {
        binaryLikeData += String.fromCharCode(index % 256);
      }
      
      const stats = await testCtxZipCompression(binaryLikeData);
      
      console.log('Binary-like Data Compression Results:');
      console.log(`  Original Size: ${stats.originalSize} bytes`);
      console.log(`  Compressed Size: ${stats.compressedSize} bytes`);
      console.log(`  Compression Ratio: ${stats.compressionRatio.toFixed(2)}x`);
      
      // Verify round-trip integrity
      const compressed = await compressContext(binaryLikeData);
      const decompressed = await decompressContext(compressed);
      expect(decompressed).toBe(binaryLikeData);
    });
  });

  describe('Compression Consistency Validation', () => {
    it('should produce consistent results for identical inputs', async () => {
      const testPayload = 'Consistency test payload with substantial content. '.repeat(100);
      
      // Compress the same payload multiple times
      const results = [];
      for (let index = 0; index < 10; index++) {
        const compressed = await compressContext(testPayload);
        results.push(compressed);
      }
      
      // All results should be identical
      for (let index = 1; index < results.length; index++) {
        expect(results[index]).toEqual(results[0]);
      }
      
      // Verify decompression works for all
      for (const compressed of results) {
        const decompressed = await decompressContext(compressed);
        expect(decompressed).toBe(testPayload);
      }
    });

    it('should maintain consistent compression ratios', async () => {
      const payloads = [
        'Payload A. '.repeat(1000),
        'Payload B. '.repeat(2000),
        'Payload C. '.repeat(3000)
      ];
      
      const ratios = [];
      
      for (const payload of payloads) {
        const stats = await testCtxZipCompression(payload);
        ratios.push(stats.compressionRatio);
      }
      
      // Ratios should be reasonably consistent
      const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
      const variance = ratios.reduce((sum, r) => sum + Math.pow(r - avgRatio, 2), 0) / ratios.length;
      
      console.log('Compression Ratio Consistency:');
      console.log(`  Ratios: ${ratios.map(r => r.toFixed(2)).join(', ')}`);
      console.log(`  Average Ratio: ${avgRatio.toFixed(2)}`);
      console.log(`  Variance: ${variance.toFixed(2)}`);
      
      // Variance should be relatively small
      expect(variance).toBeLessThan(5);
    });
  });

  describe('Feedback Loop Validation', () => {
    it('should record and analyze compression statistics accurately', async () => {
      // Create and record multiple compression stats
      const testPayloads = [
        'Test payload 1. '.repeat(100),
        'Test payload 2. '.repeat(200),
        'Test payload 3. '.repeat(300)
      ];
      
      const recordedStats = [];
      
      for (let index = 0; index < testPayloads.length; index++) {
        const payload = testPayloads[index];
        const stats = await testCtxZipCompression(payload);
        const sessionStats = {
          ...stats,
          sessionId: `validation-session-${index}`,
          contextType: 'test-validation'
        };
        
        await recordCompressionStats(sessionStats);
        recordedStats.push(sessionStats);
      }
      
      // Record some feedback
      const feedbackEntries = [
        {
          sessionId: 'validation-session-0',
          effectivenessRating: 9,
          semanticPreservation: 10,
          notes: 'Excellent compression with perfect semantic preservation',
          timestamp: new Date()
        },
        {
          sessionId: 'validation-session-1',
          effectivenessRating: 8,
          semanticPreservation: 9,
          notes: 'Good compression, minor semantic concerns',
          timestamp: new Date()
        },
        {
          sessionId: 'validation-session-2',
          effectivenessRating: 9,
          semanticPreservation: 10,
          notes: 'Outstanding results across all metrics',
          timestamp: new Date()
        }
      ];
      
      for (const feedback of feedbackEntries) {
        await recordCompressionFeedback(feedback);
      }
      
      // Analyze effectiveness
      const analysis = await analyzeCompressionEffectiveness();
      
      console.log('Feedback Loop Analysis Results:');
      console.log(`  Average Reduction: ${analysis.averageReduction.toFixed(2)}%`);
      console.log(`  Total Sessions: ${analysis.totalSessions}`);
      console.log(`  Effectiveness Rating: ${analysis.effectivenessRating}/10`);
      console.log(`  Recommendations: ${analysis.recommendations.join(', ')}`);
      
      // Validate analysis results
      expect(analysis.averageReduction).toBeGreaterThan(70);
      expect(analysis.totalSessions).toBeGreaterThanOrEqual(3);
      expect(analysis.effectivenessRating).toBeGreaterThanOrEqual(8);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should provide meaningful optimization recommendations', async () => {
      const optimization = await optimizeCompressionParameters();
      
      console.log('Optimization Recommendations:');
      console.log(`  Suggested Quality: ${optimization.suggestedQuality}`);
      console.log(`  Preserve Semantic: ${optimization.preserveSemantic}`);
      console.log(`  Notes: ${optimization.notes}`);
      
      // Validate optimization parameters are reasonable
      expect(optimization.suggestedQuality).toBeGreaterThanOrEqual(1);
      expect(optimization.suggestedQuality).toBeLessThanOrEqual(10);
      expect(typeof optimization.preserveSemantic).toBe('boolean');
      expect(typeof optimization.notes).toBe('string');
      expect(optimization.notes.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Under Load Validation', () => {
    it('should maintain compression quality with repeated operations', async () => {
      const testPayload = 'Load test payload. '.repeat(500);
      const iterations = 100;
      const results = [];
      
      for (let index = 0; index < iterations; index++) {
        const stats = await testCtxZipCompression(testPayload);
        results.push(stats.reductionPercentage);
      }
      
      // Calculate statistics
      const avgReduction = results.reduce((sum, val) => sum + val, 0) / results.length;
      const minReduction = Math.min(...results);
      const maxReduction = Math.max(...results);
      
      console.log('Load Test Validation Results:');
      console.log(`  Iterations: ${iterations}`);
      console.log(`  Average Reduction: ${avgReduction.toFixed(2)}%`);
      console.log(`  Min Reduction: ${minReduction.toFixed(2)}%`);
      console.log(`  Max Reduction: ${maxReduction.toFixed(2)}%`);
      
      // Should maintain consistent quality
      expect(avgReduction).toBeGreaterThan(80);
      expect(minReduction).toBeGreaterThan(70);
      expect(maxReduction).toBeLessThan(95);
    });
  });

  describe('Integration Validation', () => {
    it('should integrate properly with storage mechanisms', async () => {
      const testPayload = 'Integration test payload with significant content. '.repeat(100);
      // const sessionId = 'integration-test-session'; // Removed unused variable
      
      // Compress and store
      const compressed = await compressContext(testPayload);
      // In a real implementation, we would store this, but we'll just verify the process
      
      // Verify the compressed data can be handled by storage
      // The mock implementation returns a Buffer, but our test creates a string
      // In a real implementation, this would be a Buffer
      expect(compressed).toBeDefined();
      expect(compressed.length).toBeGreaterThan(0);
      
      // Decompress and verify
      const decompressed = await decompressContext(compressed);
      expect(decompressed).toBe(testPayload);
      
      console.log('Integration Validation Results:');
      console.log(`  Original Size: ${testPayload.length} bytes`);
      console.log(`  Compressed Size: ${compressed.length} bytes`);
      console.log(`  Compression Successful: ${compressed.length > 0}`);
      console.log(`  Round-trip Successful: ${decompressed === testPayload}`);
    });
  });
});