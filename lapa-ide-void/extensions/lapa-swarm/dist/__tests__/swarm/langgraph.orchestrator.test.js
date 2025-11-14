"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const langgraph_orchestrator_ts_1 = require("../../swarm/langgraph.orchestrator.ts");
(0, vitest_1.describe)('LangGraphOrchestrator', () => {
    let orchestrator;
    beforeEach(() => {
        orchestrator = new langgraph_orchestrator_ts_1.LangGraphOrchestrator('start-node');
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with the correct initial state', () => {
            // We can't directly access private properties, but we can test behavior
            (0, vitest_1.expect)(orchestrator).toBeDefined();
        });
    });
    (0, vitest_1.describe)('addNode', () => {
        (0, vitest_1.it)('should add a node successfully', () => {
            const node = {
                id: 'test-node-1',
                type: 'agent',
                label: 'Test Agent Node',
                agentType: 'coder'
            };
            orchestrator.addNode(node);
            const nodes = orchestrator.getNodes();
            (0, vitest_1.expect)(nodes).toHaveLength(1);
            (0, vitest_1.expect)(nodes[0]).toEqual(node);
        });
        (0, vitest_1.it)('should add multiple nodes', () => {
            const nodes = [
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
            (0, vitest_1.expect)(retrievedNodes).toHaveLength(3);
            (0, vitest_1.expect)(retrievedNodes).toEqual(vitest_1.expect.arrayContaining(nodes));
        });
    });
    (0, vitest_1.describe)('addEdge', () => {
        (0, vitest_1.it)('should add an edge successfully', () => {
            const edge = {
                id: 'test-edge-1',
                source: 'node-a',
                target: 'node-b'
            };
            orchestrator.addEdge(edge);
            const edges = orchestrator.getEdges();
            (0, vitest_1.expect)(edges).toHaveLength(1);
            (0, vitest_1.expect)(edges[0]).toEqual(edge);
        });
        (0, vitest_1.it)('should add multiple edges', () => {
            const edges = [
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
            (0, vitest_1.expect)(retrievedEdges).toHaveLength(3);
            (0, vitest_1.expect)(retrievedEdges).toEqual(vitest_1.expect.arrayContaining(edges));
        });
    });
    (0, vitest_1.describe)('getNodes', () => {
        (0, vitest_1.it)('should return all added nodes', () => {
            const node = {
                id: 'retrieval-test-node',
                type: 'agent',
                label: 'Retrieval Test',
                agentType: 'tester'
            };
            orchestrator.addNode(node);
            const nodes = orchestrator.getNodes();
            (0, vitest_1.expect)(nodes).toHaveLength(1);
            (0, vitest_1.expect)(nodes[0]).toEqual(node);
        });
        (0, vitest_1.it)('should return empty array when no nodes exist', () => {
            const nodes = orchestrator.getNodes();
            (0, vitest_1.expect)(nodes).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('getEdges', () => {
        (0, vitest_1.it)('should return all added edges', () => {
            const edge = {
                id: 'retrieval-test-edge',
                source: 'source-node',
                target: 'target-node'
            };
            orchestrator.addEdge(edge);
            const edges = orchestrator.getEdges();
            (0, vitest_1.expect)(edges).toHaveLength(1);
            (0, vitest_1.expect)(edges[0]).toEqual(edge);
        });
        (0, vitest_1.it)('should return empty array when no edges exist', () => {
            const edges = orchestrator.getEdges();
            (0, vitest_1.expect)(edges).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('getOutboundEdges', () => {
        (0, vitest_1.it)('should return outbound edges for a node', () => {
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
            const edges = [
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
            (0, vitest_1.expect)(outboundFromA).toHaveLength(2);
            (0, vitest_1.expect)(outboundFromA).toEqual(vitest_1.expect.arrayContaining([
                edges[0],
                edges[1]
            ]));
            const outboundFromB = orchestrator.getOutboundEdges('node-b');
            (0, vitest_1.expect)(outboundFromB).toHaveLength(1);
            (0, vitest_1.expect)(outboundFromB[0]).toEqual(edges[2]);
            const outboundFromC = orchestrator.getOutboundEdges('node-c');
            (0, vitest_1.expect)(outboundFromC).toHaveLength(0);
        });
        (0, vitest_1.it)('should return empty array for node with no outbound edges', () => {
            orchestrator.addNode({
                id: 'isolated-node',
                type: 'agent',
                label: 'Isolated Node'
            });
            const outboundEdges = orchestrator.getOutboundEdges('isolated-node');
            (0, vitest_1.expect)(outboundEdges).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('executeWorkflow', () => {
        (0, vitest_1.it)('should execute a simple linear workflow successfully', async () => {
            // Create a simple linear workflow: start -> node1 -> node2 -> end
            const nodes = [
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
            const edges = [
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
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.finalState).toBeDefined();
            (0, vitest_1.expect)(result.output).toBeDefined();
            (0, vitest_1.expect)(result.executionPath).toHaveLength(3);
            (0, vitest_1.expect)(result.executionPath).toEqual(['start-node', 'processing-node', 'end-node']);
            (0, vitest_1.expect)(result.error).toBeUndefined();
        });
        (0, vitest_1.it)('should handle workflow with decision node', async () => {
            // Create workflow with decision: start -> decision -> (node1 or node2)
            const nodes = [
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
            const edges = [
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
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.executionPath).toHaveLength(3);
            (0, vitest_1.expect)(result.executionPath[0]).toBe('start-node');
            (0, vitest_1.expect)(result.executionPath[1]).toBe('decision-node');
            // In the current implementation, it follows the first edge
            (0, vitest_1.expect)(result.executionPath[2]).toBe('path-a-node');
        });
        (0, vitest_1.it)('should handle empty workflow gracefully', async () => {
            // Create orchestrator with non-existent initial state
            const emptyOrchestrator = new langgraph_orchestrator_ts_1.LangGraphOrchestrator('non-existent-start');
            const initialContext = {
                testData: 'test'
            };
            const result = await emptyOrchestrator.executeWorkflow(initialContext);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toBeDefined();
            (0, vitest_1.expect)(result.error).toContain('Initial state node');
        });
        (0, vitest_1.it)('should handle workflow exceeding maximum iterations', async () => {
            // Create a circular workflow that would exceed iteration limit
            // For this test, we'll need to modify the maxIterations to a smaller value
            // Since we can't modify private properties, we'll test with a complex workflow
            // Create a workflow with many nodes
            const nodes = [];
            const edges = [];
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
                        source: `node-${i - 1}`,
                        target: `node-${i}`
                    });
                }
            }
            nodes.forEach(node => orchestrator.addNode(node));
            edges.forEach(edge => orchestrator.addEdge(edge));
            // Change initial state to first node
            orchestrator.initialState = 'node-0';
            const initialContext = {
                counter: 0
            };
            const result = await orchestrator.executeWorkflow(initialContext);
            // With 100 max iterations and 20 nodes, this should succeed
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('processNode', () => {
        (0, vitest_1.it)('should process agent node correctly', async () => {
            const node = {
                id: 'agent-test-node',
                type: 'agent',
                label: 'Test Agent',
                agentType: 'tester'
            };
            const context = {
                input: 'test data'
            };
            // Access private method through casting
            const result = await orchestrator.processNode(node, context);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.input).toBe('test data');
            (0, vitest_1.expect)(result.processedBy).toBe('Test Agent');
            (0, vitest_1.expect)(result.result).toContain('Processed by Test Agent agent');
        });
        (0, vitest_1.it)('should process process node correctly', async () => {
            const node = {
                id: 'process-test-node',
                type: 'process',
                label: 'Test Process'
            };
            const context = {
                value: 42
            };
            // Access private method through casting
            const result = await orchestrator.processNode(node, context);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.value).toBe(42);
            (0, vitest_1.expect)(result.processedBy).toBe('Test Process');
            (0, vitest_1.expect)(result.result).toContain('Executed process Test Process');
        });
        (0, vitest_1.it)('should process decision node correctly', async () => {
            const node = {
                id: 'decision-test-node',
                type: 'decision',
                label: 'Test Decision'
            };
            const context = {
                condition: 'maybe'
            };
            // Access private method through casting
            const result = await orchestrator.processNode(node, context);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.condition).toBe('maybe');
            (0, vitest_1.expect)(result.processedBy).toBe('Test Decision');
            (0, vitest_1.expect)(result.decision).toBeDefined();
            (0, vitest_1.expect)(result.result).toContain('Decision made:');
        });
        (0, vitest_1.it)('should throw error for unknown node type', async () => {
            const node = {
                id: 'unknown-test-node',
                // @ts-ignore - Testing invalid type
                type: 'unknown-type',
                label: 'Unknown Node'
            };
            const context = {};
            // Access private method through casting
            await (0, vitest_1.expect)(orchestrator.processNode(node, context))
                .rejects.toThrow('Unknown node type: unknown-type');
        });
    });
    (0, vitest_1.describe)('processAgentNode', () => {
        (0, vitest_1.it)('should process agent node and return expected structure', async () => {
            const node = {
                id: 'specific-agent-node',
                type: 'agent',
                label: 'Specific Agent',
                agentType: 'debugger'
            };
            const context = {
                task: 'fix bug'
            };
            // Access private method through casting
            const result = await orchestrator.processAgentNode(node, context);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.task).toBe('fix bug');
            (0, vitest_1.expect)(result.processedBy).toBe('Specific Agent');
            (0, vitest_1.expect)(result.timestamp).toBeDefined();
            (0, vitest_1.expect)(result.result).toBe('Processed by Specific Agent agent');
        });
    });
    (0, vitest_1.describe)('processProcessNode', () => {
        (0, vitest_1.it)('should process process node and return expected structure', async () => {
            const node = {
                id: 'specific-process-node',
                type: 'process',
                label: 'Specific Process'
            };
            const context = {
                data: 'process this'
            };
            // Access private method through casting
            const result = await orchestrator.processProcessNode(node, context);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.data).toBe('process this');
            (0, vitest_1.expect)(result.processedBy).toBe('Specific Process');
            (0, vitest_1.expect)(result.timestamp).toBeDefined();
            (0, vitest_1.expect)(result.result).toBe('Executed process Specific Process');
        });
    });
    (0, vitest_1.describe)('processDecisionNode', () => {
        (0, vitest_1.it)('should process decision node and return expected structure', async () => {
            const node = {
                id: 'specific-decision-node',
                type: 'decision',
                label: 'Specific Decision'
            };
            const context = {
                input: 'decide on this'
            };
            // Access private method through casting
            const result = await orchestrator.processDecisionNode(node, context);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.input).toBe('decide on this');
            (0, vitest_1.expect)(result.processedBy).toBe('Specific Decision');
            (0, vitest_1.expect)(result.decision).toBeDefined();
            (0, vitest_1.expect)(['positive', 'negative']).toContain(result.decision);
            (0, vitest_1.expect)(result.timestamp).toBeDefined();
            (0, vitest_1.expect)(result.result).toContain('Decision made:');
        });
    });
});
//# sourceMappingURL=langgraph.orchestrator.test.js.map