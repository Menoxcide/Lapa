"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const agent_md_generator_ts_1 = require("../../agents/agent.md.generator.ts");
const promises_1 = require("fs/promises");
// Mock fs/promises
vitest_1.vi.mock('fs/promises', () => ({
    writeFile: vitest_1.vi.fn()
}));
(0, vitest_1.describe)('AgentDocumentationGenerator', () => {
    let generator;
    let mockAgents;
    (0, vitest_1.beforeEach)(() => {
        generator = new agent_md_generator_ts_1.AgentDocumentationGenerator({ outputPath: '/test/output' });
        mockAgents = [
            {
                id: 'agent-1',
                type: 'coder',
                name: 'Code Generator',
                expertise: ['javascript', 'typescript', 'react'],
                workload: 2,
                capacity: 5
            },
            {
                id: 'agent-2',
                type: 'reviewer',
                name: 'Code Reviewer',
                expertise: ['code-review', 'best-practices', 'security'],
                workload: 1,
                capacity: 3
            }
        ];
        // Clear all mocks before each test
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with default output path', () => {
            const defaultGenerator = new agent_md_generator_ts_1.AgentDocumentationGenerator();
            // Default path should be '.'
            (0, vitest_1.expect)(defaultGenerator.outputPath).toBe('.');
        });
        (0, vitest_1.it)('should initialize with custom output path', () => {
            const customPath = '/custom/path';
            const customGenerator = new agent_md_generator_ts_1.AgentDocumentationGenerator({ outputPath: customPath });
            (0, vitest_1.expect)(customGenerator.outputPath).toBe(customPath);
        });
    });
    (0, vitest_1.describe)('generateAgentDocumentation', () => {
        (0, vitest_1.it)('should generate documentation for a single agent', () => {
            const result = generator.generateAgentDocumentation(mockAgents[0]);
            (0, vitest_1.expect)(result).toContain('# Code Generator Agent');
            (0, vitest_1.expect)(result).toContain('## Overview');
            (0, vitest_1.expect)(result).toContain('The Coder agent specializes in code generation and implementation');
            (0, vitest_1.expect)(result).toContain('## Type');
            (0, vitest_1.expect)(result).toContain('coder');
            (0, vitest_1.expect)(result).toContain('## Capabilities');
            (0, vitest_1.expect)(result).toContain('- javascript');
            (0, vitest_1.expect)(result).toContain('- typescript');
            (0, vitest_1.expect)(result).toContain('- react');
            (0, vitest_1.expect)(result).toContain('## Usage');
            (0, vitest_1.expect)(result).toContain('Send code generation requests and implementation tasks to this agent');
            (0, vitest_1.expect)(result).toContain('## Integration');
            (0, vitest_1.expect)(result).toContain('Integrates with the Planner agent for task specifications');
            (0, vitest_1.expect)(result).toContain('"id": "agent-1"');
            (0, vitest_1.expect)(result).toContain('"workload": 2');
            (0, vitest_1.expect)(result).toContain('"capacity": 5');
        });
        (0, vitest_1.it)('should include timestamp when option is enabled', () => {
            const options = { includeTimestamp: true };
            const result = generator.generateAgentDocumentation(mockAgents[0], options);
            (0, vitest_1.expect)(result).toMatch(/\*Generated on \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\*/);
        });
        (0, vitest_1.it)('should include version when option is provided', () => {
            const options = { includeVersion: '1.0.0' };
            const result = generator.generateAgentDocumentation(mockAgents[0], options);
            (0, vitest_1.expect)(result).toContain('*Version: 1.0.0*');
        });
        (0, vitest_1.it)('should handle unknown agent type gracefully', () => {
            const unknownAgent = {
                id: 'unknown-1',
                type: 'unknown',
                name: 'Unknown Agent',
                expertise: ['general'],
                workload: 0,
                capacity: 5
            };
            const result = generator.generateAgentDocumentation(unknownAgent);
            (0, vitest_1.expect)(result).toContain('# Unknown Agent Agent');
            (0, vitest_1.expect)(result).toContain('General purpose agent with unspecified capabilities.');
            (0, vitest_1.expect)(result).toContain('This agent can handle general tasks within its expertise areas.');
            (0, vitest_1.expect)(result).toContain('Standard integration with the LAPA swarm through the MoE router.');
        });
    });
    (0, vitest_1.describe)('generateAgentsDocumentation', () => {
        (0, vitest_1.it)('should generate documentation for multiple agents', () => {
            const result = generator.generateAgentsDocumentation(mockAgents);
            (0, vitest_1.expect)(result).toContain('# LAPA Agents Documentation');
            (0, vitest_1.expect)(result).toContain('## Overview');
            (0, vitest_1.expect)(result).toContain('## Agent Summary');
            (0, vitest_1.expect)(result).toContain('| Code Generator | coder | javascript, typescript, react | 2/5 |');
            (0, vitest_1.expect)(result).toContain('| Code Reviewer | reviewer | code-review, best-practices, security | 1/3 |');
            (0, vitest_1.expect)(result).toContain('## Detailed Agent Documentation');
            (0, vitest_1.expect)(result).toContain('### Code Generator (coder)');
            (0, vitest_1.expect)(result).toContain('### Code Reviewer (reviewer)');
        });
        (0, vitest_1.it)('should include timestamp when option is enabled', () => {
            const options = { includeTimestamp: true };
            const result = generator.generateAgentsDocumentation(mockAgents, options);
            (0, vitest_1.expect)(result).toMatch(/\*Generated on \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\*/);
        });
        (0, vitest_1.it)('should include version when option is provided', () => {
            const options = { includeVersion: '2.0.0' };
            const result = generator.generateAgentsDocumentation(mockAgents, options);
            (0, vitest_1.expect)(result).toContain('*Version: 2.0.0*');
        });
        (0, vitest_1.it)('should handle empty agents array', () => {
            const result = generator.generateAgentsDocumentation([]);
            (0, vitest_1.expect)(result).toContain('# LAPA Agents Documentation');
            (0, vitest_1.expect)(result).toContain('## Overview');
            (0, vitest_1.expect)(result).toContain('## Agent Summary');
            (0, vitest_1.expect)(result).toContain('## Detailed Agent Documentation');
            // Should not contain any agent details
            (0, vitest_1.expect)(result).not.toContain('###');
        });
    });
    (0, vitest_1.describe)('saveAgentDocumentation', () => {
        (0, vitest_1.it)('should save agent documentation to file', async () => {
            const filename = 'test-agent.md';
            await generator.saveAgentDocumentation(mockAgents[0], filename);
            (0, vitest_1.expect)(promises_1.writeFile).toHaveBeenCalledWith(`/test/output/${filename}`, vitest_1.expect.stringContaining('# Code Generator Agent'));
        });
        (0, vitest_1.it)('should log success message', async () => {
            const consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
            const filename = 'test-agent.md';
            await generator.saveAgentDocumentation(mockAgents[0], filename);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith(`Agent documentation saved to /test/output/${filename}`);
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('saveAgentsDocumentation', () => {
        (0, vitest_1.it)('should save multiple agents documentation to file', async () => {
            const filename = 'test-agents.md';
            await generator.saveAgentsDocumentation(mockAgents, filename);
            (0, vitest_1.expect)(promises_1.writeFile).toHaveBeenCalledWith(`/test/output/${filename}`, vitest_1.expect.stringContaining('# LAPA Agents Documentation'));
        });
        (0, vitest_1.it)('should log success message', async () => {
            const consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
            const filename = 'test-agents.md';
            await generator.saveAgentsDocumentation(mockAgents, filename);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith(`Agents documentation saved to /test/output/${filename}`);
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('private methods', () => {
        (0, vitest_1.it)('should create structured documentation for an agent', () => {
            const createDocMethod = generator.createAgentDocumentation;
            const result = createDocMethod.call(generator, mockAgents[0]);
            (0, vitest_1.expect)(result).toEqual({
                name: 'Code Generator',
                type: 'coder',
                description: 'The Coder agent specializes in code generation and implementation. It writes clean, efficient code based on specifications and requirements.',
                capabilities: ['javascript', 'typescript', 'react'],
                usage: 'Send code generation requests and implementation tasks to this agent. Provide clear specifications and requirements for best results.',
                integration: 'Integrates with the Planner agent for task specifications and with the Reviewer agent for code quality assurance.',
                configuration: {
                    id: 'agent-1',
                    workload: 2,
                    capacity: 5
                }
            });
        });
        (0, vitest_1.it)('should format documentation as Markdown', () => {
            const doc = {
                name: 'Test Agent',
                type: 'coder',
                description: 'Test description',
                capabilities: ['test-capability'],
                usage: 'Test usage',
                integration: 'Test integration',
                configuration: { id: 'test-1', workload: 1, capacity: 5 }
            };
            const formatMethod = generator.formatDocumentation;
            const result = formatMethod.call(generator, doc, {});
            (0, vitest_1.expect)(result).toContain('# Test Agent Agent');
            (0, vitest_1.expect)(result).toContain('## Overview');
            (0, vitest_1.expect)(result).toContain('Test description');
            (0, vitest_1.expect)(result).toContain('## Type');
            (0, vitest_1.expect)(result).toContain('coder');
            (0, vitest_1.expect)(result).toContain('## Capabilities');
            (0, vitest_1.expect)(result).toContain('- test-capability');
            (0, vitest_1.expect)(result).toContain('## Usage');
            (0, vitest_1.expect)(result).toContain('Test usage');
            (0, vitest_1.expect)(result).toContain('## Integration');
            (0, vitest_1.expect)(result).toContain('Test integration');
            (0, vitest_1.expect)(result).toContain('"id": "test-1"');
        });
        (0, vitest_1.it)('should format single agent documentation as Markdown', () => {
            const doc = {
                name: 'Test Agent',
                type: 'coder',
                description: 'Test description',
                capabilities: ['test-capability'],
                usage: 'Test usage',
                integration: 'Test integration',
                configuration: { id: 'test-1', workload: 1, capacity: 5 }
            };
            const formatMethod = generator.formatSingleAgentDocumentation;
            const result = formatMethod.call(generator, doc, {});
            (0, vitest_1.expect)(result).toContain('### Test Agent (coder)');
            (0, vitest_1.expect)(result).toContain('#### Overview');
            (0, vitest_1.expect)(result).toContain('Test description');
            (0, vitest_1.expect)(result).toContain('#### Capabilities');
            (0, vitest_1.expect)(result).toContain('- test-capability');
            (0, vitest_1.expect)(result).toContain('#### Usage');
            (0, vitest_1.expect)(result).toContain('Test usage');
            (0, vitest_1.expect)(result).toContain('#### Integration');
            (0, vitest_1.expect)(result).toContain('Test integration');
            (0, vitest_1.expect)(result).toContain('"id": "test-1"');
        });
        (0, vitest_1.it)('should get agent description based on type', () => {
            const getDescriptionMethod = generator.getAgentDescription;
            (0, vitest_1.expect)(getDescriptionMethod.call(generator, 'planner')).toContain('Planner agent is responsible for high-level task planning');
            (0, vitest_1.expect)(getDescriptionMethod.call(generator, 'coder')).toContain('Coder agent specializes in code generation');
            (0, vitest_1.expect)(getDescriptionMethod.call(generator, 'reviewer')).toContain('Reviewer agent focuses on code review');
            (0, vitest_1.expect)(getDescriptionMethod.call(generator, 'debugger')).toContain('Debugger agent detects and fixes bugs');
            (0, vitest_1.expect)(getDescriptionMethod.call(generator, 'optimizer')).toContain('Optimizer agent improves code performance');
            (0, vitest_1.expect)(getDescriptionMethod.call(generator, 'tester')).toContain('Tester agent creates and executes tests');
            (0, vitest_1.expect)(getDescriptionMethod.call(generator, 'unknown')).toBe('General purpose agent with unspecified capabilities.');
        });
        (0, vitest_1.it)('should get agent usage instructions based on type', () => {
            const getUsageMethod = generator.getAgentUsage;
            (0, vitest_1.expect)(getUsageMethod.call(generator, 'planner')).toContain('Route high-level planning tasks');
            (0, vitest_1.expect)(getUsageMethod.call(generator, 'coder')).toContain('Send code generation requests');
            (0, vitest_1.expect)(getUsageMethod.call(generator, 'reviewer')).toContain('Assign code review tasks');
            (0, vitest_1.expect)(getUsageMethod.call(generator, 'debugger')).toContain('Route bug reports and debugging tasks');
            (0, vitest_1.expect)(getUsageMethod.call(generator, 'optimizer')).toContain('Send performance optimization requests');
            (0, vitest_1.expect)(getUsageMethod.call(generator, 'tester')).toContain('Assign test creation and execution tasks');
            (0, vitest_1.expect)(getUsageMethod.call(generator, 'unknown')).toBe('This agent can handle general tasks within its expertise areas.');
        });
        (0, vitest_1.it)('should get agent integration details based on type', () => {
            const getIntegrationMethod = generator.getAgentIntegration;
            (0, vitest_1.expect)(getIntegrationMethod.call(generator, 'planner')).toContain('Integrates with the MoE router');
            (0, vitest_1.expect)(getIntegrationMethod.call(generator, 'coder')).toContain('Integrates with the Planner agent');
            (0, vitest_1.expect)(getIntegrationMethod.call(generator, 'reviewer')).toContain('Integrates with the Coder agent');
            (0, vitest_1.expect)(getIntegrationMethod.call(generator, 'debugger')).toContain('Integrates with the Coder agent for bug fixing');
            (0, vitest_1.expect)(getIntegrationMethod.call(generator, 'optimizer')).toContain('Integrates with the Coder agent for performance improvements');
            (0, vitest_1.expect)(getIntegrationMethod.call(generator, 'tester')).toContain('Integrates with the Coder agent for test creation');
            (0, vitest_1.expect)(getIntegrationMethod.call(generator, 'unknown')).toBe('Standard integration with the LAPA swarm through the MoE router.');
        });
    });
});
//# sourceMappingURL=agent.md.generator.test.js.map