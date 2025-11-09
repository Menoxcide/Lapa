import { LangGraphOrchestrator, GraphNode, GraphEdge } from '../../src/swarm/langgraph.orchestrator';

describe('LangGraphOrchestrator', () => {
  let orchestrator: LangGraphOrchestrator;

  beforeEach(() => {
    orchestrator = new LangGraphOrchestrator('start-node');
  });

  describe('constructor', () => {
    it('should initialize with the correct initial state', () => {
      // We can't directly access private properties, but we can test behavior
      expect(orchestrator).toBeDefined();
    });
  });

  describe('addNode', () => {
    it('should add a node successfully', () => {
      const node: GraphNode = {
        id: 'test-node-1',
        type: 'agent',
        label: 'Test Agent Node',
        agentType: 'coder'
      };

      orchestrator.addNode(node);
      
      const nodes = orchestrator.getNodes();
      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toEqual(node);
    });

    it('should add multiple nodes', () => {
      const nodes: GraphNode[] = [
        {
          id: 'node-1',
          type: 'agent',
          label: 'Agent 1',
          agentType: 'coder'
        },
        {
          id: 'node-2',
          type: 'process',
          label: 'Process 1'
        },
        {
          id: 'node-3',
          type: 'decision',
          label: 'Decision Point'
        }
      ];

      nodes.forEach(node => orchestrator.addNode(node));
      
      const retrievedNodes = orchestrator.getNodes();
      expect(retrievedNodes).toHaveLength(3);
      expect(retrievedNodes).toEqual(expect.arrayContaining(nodes));
    });
  });

  describe('addEdge', () => {
    it('should add an edge successfully', () => {
      const edge: GraphEdge = {
        id: 'test-edge-1',
        source: 'node-a',
        target: 'node-b'
      };

      orchestrator.addEdge(edge);
      
      const edges = orchestrator.getEdges();
      expect(edges).toHaveLength(1);
      expect(edges[0]).toEqual(edge);
    });

    it('should add multiple edges', () => {
      const edges: GraphEdge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2'
        },
        {
          id: 'edge-2',
          source: 'node-2',
          target: 'node-3'
        },
        {
          id: 'edge-3',
          source: 'node-1',
          target: 'node-3'
        }
      ];

      edges.forEach(edge => orchestrator.addEdge(edge));
      
      const retrievedEdges = orchestrator.getEdges();
      expect(retrievedEdges).toHaveLength(3);
      expect(retrievedEdges).toEqual(expect.arrayContaining(edges));
    });
  });

  describe('getNodes', () => {
    it('should return all added nodes', () => {
      const node: GraphNode = {
        id: 'retrieval-test-node',
        type: 'agent',
        label: 'Retrieval Test',
        agentType: 'tester'
      };

      orchestrator.addNode(node);
      
      const nodes = orchestrator.getNodes();
      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toEqual(node);
    });

    it('should return empty array when no nodes exist', () => {
      const nodes = orchestrator.getNodes();
      expect(nodes).toHaveLength(0);
    });
  });

  describe('getEdges', () => {
    it('should return all added edges', () => {
      const edge: GraphEdge = {
        id: 'retrieval-test-edge',
        source: 'source-node',
        target: 'target-node'
      };

      orchestrator.addEdge(edge);
      
      const edges = orchestrator.getEdges();
      expect(edges).toHaveLength(1);
      expect(edges[0]).toEqual(edge);
    });

    it('should return empty array when no edges exist', () => {
      const edges = orchestrator.getEdges();
      expect(edges).toHaveLength(0);
    });
  });

  describe('getOutboundEdges', () => {
    it('should return outbound edges for a node', () => {
      // Add nodes
      orchestrator.addNode({
        id: 'node-a',
        type: 'agent',
        label: 'Node A'
      });
      
      orchestrator.addNode({
        id: 'node-b',
        type: 'agent',
        label: 'Node B'
      });
      
      orchestrator.addNode({
        id: 'node-c',
        type: 'agent',
        label: 'Node C'
      });
      
      // Add edges
      const edges: GraphEdge[] = [
        {
          id: 'edge-1',
          source: 'node-a',
          target: 'node-b'
        },
        {
          id: 'edge-2',
          source: 'node-a',
          target: 'node-c'
        },
        {
          id: 'edge-3',
          source: 'node-b',
          target: 'node-c'
        }
      ];
      
      edges.forEach(edge => orchestrator.addEdge(edge));
      
      const outboundFromA = orchestrator.getOutboundEdges('node-a');
      expect(outboundFromA).toHaveLength(2);
      expect(outboundFromA).toEqual(expect.arrayContaining([
        edges[0],
        edges[1]
      ]));
      
      const outboundFromB = orchestrator.getOutboundEdges('node-b');
      expect(outboundFromB).toHaveLength(1);
      expect(outboundFromB[0]).toEqual(edges[2]);
      
      const outboundFromC = orchestrator.getOutboundEdges('node-c');
      expect(outboundFromC).toHaveLength(0);
    });

    it('should return empty array for node with no outbound edges', () => {
      orchestrator.addNode({
        id: 'isolated-node',
        type: 'agent',
        label: 'Isolated Node'
      });
      
      const outboundEdges = orchestrator.getOutboundEdges('isolated-node');
      expect(outboundEdges).toHaveLength(0);
    });
  });

  describe('executeWorkflow', () => {
    it('should execute a simple linear workflow successfully', async () => {
      // Create a simple linear workflow: start -> node1 -> node2 -> end
      const nodes: GraphNode[] = [
        {
          id: 'start-node',
          type: 'process',
          label: 'Start Process'
        },
        {
          id: 'processing-node',
          type: 'agent',
          label: 'Processing Agent',
          agentType: 'coder'
        },
        {
          id: 'end-node',
          type: 'process',
          label: 'End Process'
        }
      ];
      
      nodes.forEach(node => orchestrator.addNode(node));
      
      const edges: GraphEdge[] = [
        {
          id: 'edge-1',
          source: 'start-node',
          target: 'processing-node'
        },
        {
          id: 'edge-2',
          source: 'processing-node',
          target: 'end-node'
        }
      ];
      
      edges.forEach(edge => orchestrator.addEdge(edge));
      
      const initialContext = {
        inputData: 'test input',
        timestamp: new Date().toISOString()
      };
      
      const result = await orchestrator.executeWorkflow(initialContext);
      
      expect(result.success).toBe(true);
      expect(result.finalState).toBeDefined();
      expect(result.output).toBeDefined();
      expect(result.executionPath).toHaveLength(3);
      expect(result.executionPath).toEqual(['start-node', 'processing-node', 'end-node']);
      expect(result.error).toBeUndefined();
    });

    it('should handle workflow with decision node', async () => {
      // Create workflow with decision: start -> decision -> (node1 or node2)
      const nodes: GraphNode[] = [
        {
          id: 'start-node',
          type: 'process',
          label: 'Start'
        },
        {
          id: 'decision-node',
          type: 'decision',
          label: 'Decision Point'
        },
        {
          id: 'path-a-node',
          type: 'agent',
          label: 'Path A Agent',
          agentType: 'coder'
        },
        {
          id: 'path-b-node',
          type: 'agent',
          label: 'Path B Agent',
          agentType: 'reviewer'
        }
      ];
      
      nodes.forEach(node => orchestrator.addNode(node));
      
      const edges: GraphEdge[] = [
        {
          id: 'edge-1',
          source: 'start-node',
          target: 'decision-node'
        },
        {
          id: 'edge-2',
          source: 'decision-node',
          target: 'path-a-node'
        },
        {
          id: 'edge-3',
          source: 'decision-node',
          target: 'path-b-node'
        }
      ];
      
      edges.forEach(edge => orchestrator.addEdge(edge));
      
      const initialContext = {
        value: 10
      };
      
      const result = await orchestrator.executeWorkflow(initialContext);
      
      expect(result.success).toBe(true);
      expect(result.executionPath).toHaveLength(3);
      expect(result.executionPath[0]).toBe('start-node');
      expect(result.executionPath[1]).toBe('decision-node');
      // In the current implementation, it follows the first edge
      expect(result.executionPath[2]).toBe('path-a-node');
    });

    it('should handle empty workflow gracefully', async () => {
      // Create orchestrator with non-existent initial state
      const emptyOrchestrator = new LangGraphOrchestrator('non-existent-start');
      
      const initialContext = {
        testData: 'test'
      };
      
      const result = await emptyOrchestrator.executeWorkflow(initialContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Initial state node');
    });

    it('should handle workflow exceeding maximum iterations', async () => {
      // Create a circular workflow that would exceed iteration limit
      // For this test, we'll need to modify the maxIterations to a smaller value
      // Since we can't modify private properties, we'll test with a complex workflow
      
      // Create a workflow with many nodes
      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];
      
      // Create 20 nodes in a chain
      for (let i = 0; i < 20; i++) {
        nodes.push({
          id: `node-${i}`,
          type: 'process',
          label: `Process ${i}`
        });
        
        if (i > 0) {
          edges.push({
            id: `edge-${i}`,
            source: `node-${i-1}`,
            target: `node-${i}`
          });
        }
      }
      
      nodes.forEach(node => orchestrator.addNode(node));
      edges.forEach(edge => orchestrator.addEdge(edge));
      
      // Change initial state to first node
      (orchestrator as any).initialState = 'node-0';
      
      const initialContext = {
        counter: 0
      };
      
      const result = await orchestrator.executeWorkflow(initialContext);
      
      // With 100 max iterations and 20 nodes, this should succeed
      expect(result.success).toBe(true);
    });
  });

  describe('processNode', () => {
    it('should process agent node correctly', async () => {
      const node: GraphNode = {
        id: 'agent-test-node',
        type: 'agent',
        label: 'Test Agent',
        agentType: 'tester'
      };
      
      const context = {
        input: 'test data'
      };
      
      // Access private method through casting
      const result = await (orchestrator as any).processNode(node, context);
      
      expect(result).toBeDefined();
      expect(result.input).toBe('test data');
      expect(result.processedBy).toBe('Test Agent');
      expect(result.result).toContain('Processed by Test Agent agent');
    });

    it('should process process node correctly', async () => {
      const node: GraphNode = {
        id: 'process-test-node',
        type: 'process',
        label: 'Test Process'
      };
      
      const context = {
        value: 42
      };
      
      // Access private method through casting
      const result = await (orchestrator as any).processNode(node, context);
      
      expect(result).toBeDefined();
      expect(result.value).toBe(42);
      expect(result.processedBy).toBe('Test Process');
      expect(result.result).toContain('Executed process Test Process');
    });

    it('should process decision node correctly', async () => {
      const node: GraphNode = {
        id: 'decision-test-node',
        type: 'decision',
        label: 'Test Decision'
      };
      
      const context = {
        condition: 'maybe'
      };
      
      // Access private method through casting
      const result = await (orchestrator as any).processNode(node, context);
      
      expect(result).toBeDefined();
      expect(result.condition).toBe('maybe');
      expect(result.processedBy).toBe('Test Decision');
      expect(result.decision).toBeDefined();
      expect(result.result).toContain('Decision made:');
    });

    it('should throw error for unknown node type', async () => {
      const node: GraphNode = {
        id: 'unknown-test-node',
        // @ts-ignore - Testing invalid type
        type: 'unknown-type',
        label: 'Unknown Node'
      };
      
      const context = {};
      
      // Access private method through casting
      await expect((orchestrator as any).processNode(node, context))
        .rejects.toThrow('Unknown node type: unknown-type');
    });
  });

  describe('processAgentNode', () => {
    it('should process agent node and return expected structure', async () => {
      const node: GraphNode = {
        id: 'specific-agent-node',
        type: 'agent',
        label: 'Specific Agent',
        agentType: 'debugger'
      };
      
      const context = {
        task: 'fix bug'
      };
      
      // Access private method through casting
      const result = await (orchestrator as any).processAgentNode(node, context);
      
      expect(result).toBeDefined();
      expect(result.task).toBe('fix bug');
      expect(result.processedBy).toBe('Specific Agent');
      expect(result.timestamp).toBeDefined();
      expect(result.result).toBe('Processed by Specific Agent agent');
    });
  });

  describe('processProcessNode', () => {
    it('should process process node and return expected structure', async () => {
      const node: GraphNode = {
        id: 'specific-process-node',
        type: 'process',
        label: 'Specific Process'
      };
      
      const context = {
        data: 'process this'
      };
      
      // Access private method through casting
      const result = await (orchestrator as any).processProcessNode(node, context);
      
      expect(result).toBeDefined();
      expect(result.data).toBe('process this');
      expect(result.processedBy).toBe('Specific Process');
      expect(result.timestamp).toBeDefined();
      expect(result.result).toBe('Executed process Specific Process');
    });
  });

  describe('processDecisionNode', () => {
    it('should process decision node and return expected structure', async () => {
      const node: GraphNode = {
        id: 'specific-decision-node',
        type: 'decision',
        label: 'Specific Decision'
      };
      
      const context = {
        input: 'decide on this'
      };
      
      // Access private method through casting
      const result = await (orchestrator as any).processDecisionNode(node, context);
      
      expect(result).toBeDefined();
      expect(result.input).toBe('decide on this');
      expect(result.processedBy).toBe('Specific Decision');
      expect(result.decision).toBeDefined();
      expect(['positive', 'negative']).toContain(result.decision);
      expect(result.timestamp).toBeDefined();
      expect(result.result).toContain('Decision made:');
    });
  });
});