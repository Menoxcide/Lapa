import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentDocumentationGenerator, GenerationOptions } from '../../agents/agent.md.generator.ts';
import { Agent, AgentType } from '../../agents/moe-router.ts';
import { writeFile } from 'fs/promises';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn()
}));

describe('AgentDocumentationGenerator', () => {
  let generator: AgentDocumentationGenerator;
  let mockAgents: Agent[];

  beforeEach(() => {
    generator = new AgentDocumentationGenerator({ outputPath: '/test/output' });
    
    mockAgents = [
      {
        id: 'agent-1',
        type: 'coder' as AgentType,
        name: 'Code Generator',
        expertise: ['javascript', 'typescript', 'react'],
        workload: 2,
        capacity: 5
      },
      {
        id: 'agent-2',
        type: 'reviewer' as AgentType,
        name: 'Code Reviewer',
        expertise: ['code-review', 'best-practices', 'security'],
        workload: 1,
        capacity: 3
      }
    ];

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default output path', () => {
      const defaultGenerator = new AgentDocumentationGenerator();
      // Default path should be '.'
      expect((defaultGenerator as any).outputPath).toBe('.');
    });

    it('should initialize with custom output path', () => {
      const customPath = '/custom/path';
      const customGenerator = new AgentDocumentationGenerator({ outputPath: customPath });
      expect((customGenerator as any).outputPath).toBe(customPath);
    });
  });

  describe('generateAgentDocumentation', () => {
    it('should generate documentation for a single agent', () => {
      const result = generator.generateAgentDocumentation(mockAgents[0]);
      
      expect(result).toContain('# Code Generator Agent');
      expect(result).toContain('## Overview');
      expect(result).toContain('The Coder agent specializes in code generation and implementation');
      expect(result).toContain('## Type');
      expect(result).toContain('coder');
      expect(result).toContain('## Capabilities');
      expect(result).toContain('- javascript');
      expect(result).toContain('- typescript');
      expect(result).toContain('- react');
      expect(result).toContain('## Usage');
      expect(result).toContain('Send code generation requests and implementation tasks to this agent');
      expect(result).toContain('## Integration');
      expect(result).toContain('Integrates with the Planner agent for task specifications');
      expect(result).toContain('"id": "agent-1"');
      expect(result).toContain('"workload": 2');
      expect(result).toContain('"capacity": 5');
    });

    it('should include timestamp when option is enabled', () => {
      const options: GenerationOptions = { includeTimestamp: true };
      const result = generator.generateAgentDocumentation(mockAgents[0], options);
      
      expect(result).toMatch(/\*Generated on \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\*/);
    });

    it('should include version when option is provided', () => {
      const options: GenerationOptions = { includeVersion: '1.0.0' };
      const result = generator.generateAgentDocumentation(mockAgents[0], options);
      
      expect(result).toContain('*Version: 1.0.0*');
    });

    it('should handle unknown agent type gracefully', () => {
      const unknownAgent: Agent = {
        id: 'unknown-1',
        type: 'unknown' as AgentType,
        name: 'Unknown Agent',
        expertise: ['general'],
        workload: 0,
        capacity: 5
      };
      
      const result = generator.generateAgentDocumentation(unknownAgent);
      
      expect(result).toContain('# Unknown Agent Agent');
      expect(result).toContain('General purpose agent with unspecified capabilities.');
      expect(result).toContain('This agent can handle general tasks within its expertise areas.');
      expect(result).toContain('Standard integration with the LAPA swarm through the MoE router.');
    });
  });

  describe('generateAgentsDocumentation', () => {
    it('should generate documentation for multiple agents', () => {
      const result = generator.generateAgentsDocumentation(mockAgents);
      
      expect(result).toContain('# LAPA Agents Documentation');
      expect(result).toContain('## Overview');
      expect(result).toContain('## Agent Summary');
      expect(result).toContain('| Code Generator | coder | javascript, typescript, react | 2/5 |');
      expect(result).toContain('| Code Reviewer | reviewer | code-review, best-practices, security | 1/3 |');
      expect(result).toContain('## Detailed Agent Documentation');
      expect(result).toContain('### Code Generator (coder)');
      expect(result).toContain('### Code Reviewer (reviewer)');
    });

    it('should include timestamp when option is enabled', () => {
      const options: GenerationOptions = { includeTimestamp: true };
      const result = generator.generateAgentsDocumentation(mockAgents, options);
      
      expect(result).toMatch(/\*Generated on \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\*/);
    });

    it('should include version when option is provided', () => {
      const options: GenerationOptions = { includeVersion: '2.0.0' };
      const result = generator.generateAgentsDocumentation(mockAgents, options);
      
      expect(result).toContain('*Version: 2.0.0*');
    });

    it('should handle empty agents array', () => {
      const result = generator.generateAgentsDocumentation([]);
      
      expect(result).toContain('# LAPA Agents Documentation');
      expect(result).toContain('## Overview');
      expect(result).toContain('## Agent Summary');
      expect(result).toContain('## Detailed Agent Documentation');
      // Should not contain any agent details
      expect(result).not.toContain('###');
    });
  });

  describe('saveAgentDocumentation', () => {
    it('should save agent documentation to file', async () => {
      const filename = 'test-agent.md';
      
      await generator.saveAgentDocumentation(mockAgents[0], filename);
      
      expect(writeFile).toHaveBeenCalledWith(
        `/test/output/${filename}`,
        expect.stringContaining('# Code Generator Agent')
      );
    });

    it('should log success message', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const filename = 'test-agent.md';
      
      await generator.saveAgentDocumentation(mockAgents[0], filename);
      
      expect(consoleSpy).toHaveBeenCalledWith(`Agent documentation saved to /test/output/${filename}`);
      consoleSpy.mockRestore();
    });
  });

  describe('saveAgentsDocumentation', () => {
    it('should save multiple agents documentation to file', async () => {
      const filename = 'test-agents.md';
      
      await generator.saveAgentsDocumentation(mockAgents, filename);
      
      expect(writeFile).toHaveBeenCalledWith(
        `/test/output/${filename}`,
        expect.stringContaining('# LAPA Agents Documentation')
      );
    });

    it('should log success message', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const filename = 'test-agents.md';
      
      await generator.saveAgentsDocumentation(mockAgents, filename);
      
      expect(consoleSpy).toHaveBeenCalledWith(`Agents documentation saved to /test/output/${filename}`);
      consoleSpy.mockRestore();
    });
  });

  describe('private methods', () => {
    it('should create structured documentation for an agent', () => {
      const createDocMethod = (generator as any).createAgentDocumentation;
      const result = createDocMethod.call(generator, mockAgents[0]);
      
      expect(result).toEqual({
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

    it('should format documentation as Markdown', () => {
      const doc = {
        name: 'Test Agent',
        type: 'coder' as AgentType,
        description: 'Test description',
        capabilities: ['test-capability'],
        usage: 'Test usage',
        integration: 'Test integration',
        configuration: { id: 'test-1', workload: 1, capacity: 5 }
      };
      
      const formatMethod = (generator as any).formatDocumentation;
      const result = formatMethod.call(generator, doc, {});
      
      expect(result).toContain('# Test Agent Agent');
      expect(result).toContain('## Overview');
      expect(result).toContain('Test description');
      expect(result).toContain('## Type');
      expect(result).toContain('coder');
      expect(result).toContain('## Capabilities');
      expect(result).toContain('- test-capability');
      expect(result).toContain('## Usage');
      expect(result).toContain('Test usage');
      expect(result).toContain('## Integration');
      expect(result).toContain('Test integration');
      expect(result).toContain('"id": "test-1"');
    });

    it('should format single agent documentation as Markdown', () => {
      const doc = {
        name: 'Test Agent',
        type: 'coder' as AgentType,
        description: 'Test description',
        capabilities: ['test-capability'],
        usage: 'Test usage',
        integration: 'Test integration',
        configuration: { id: 'test-1', workload: 1, capacity: 5 }
      };
      
      const formatMethod = (generator as any).formatSingleAgentDocumentation;
      const result = formatMethod.call(generator, doc, {});
      
      expect(result).toContain('### Test Agent (coder)');
      expect(result).toContain('#### Overview');
      expect(result).toContain('Test description');
      expect(result).toContain('#### Capabilities');
      expect(result).toContain('- test-capability');
      expect(result).toContain('#### Usage');
      expect(result).toContain('Test usage');
      expect(result).toContain('#### Integration');
      expect(result).toContain('Test integration');
      expect(result).toContain('"id": "test-1"');
    });

    it('should get agent description based on type', () => {
      const getDescriptionMethod = (generator as any).getAgentDescription;
      
      expect(getDescriptionMethod.call(generator, 'planner')).toContain('Planner agent is responsible for high-level task planning');
      expect(getDescriptionMethod.call(generator, 'coder')).toContain('Coder agent specializes in code generation');
      expect(getDescriptionMethod.call(generator, 'reviewer')).toContain('Reviewer agent focuses on code review');
      expect(getDescriptionMethod.call(generator, 'debugger')).toContain('Debugger agent detects and fixes bugs');
      expect(getDescriptionMethod.call(generator, 'optimizer')).toContain('Optimizer agent improves code performance');
      expect(getDescriptionMethod.call(generator, 'tester')).toContain('Tester agent creates and executes tests');
      expect(getDescriptionMethod.call(generator, 'unknown')).toBe('General purpose agent with unspecified capabilities.');
    });

    it('should get agent usage instructions based on type', () => {
      const getUsageMethod = (generator as any).getAgentUsage;
      
      expect(getUsageMethod.call(generator, 'planner')).toContain('Route high-level planning tasks');
      expect(getUsageMethod.call(generator, 'coder')).toContain('Send code generation requests');
      expect(getUsageMethod.call(generator, 'reviewer')).toContain('Assign code review tasks');
      expect(getUsageMethod.call(generator, 'debugger')).toContain('Route bug reports and debugging tasks');
      expect(getUsageMethod.call(generator, 'optimizer')).toContain('Send performance optimization requests');
      expect(getUsageMethod.call(generator, 'tester')).toContain('Assign test creation and execution tasks');
      expect(getUsageMethod.call(generator, 'unknown')).toBe('This agent can handle general tasks within its expertise areas.');
    });

    it('should get agent integration details based on type', () => {
      const getIntegrationMethod = (generator as any).getAgentIntegration;
      
      expect(getIntegrationMethod.call(generator, 'planner')).toContain('Integrates with the MoE router');
      expect(getIntegrationMethod.call(generator, 'coder')).toContain('Integrates with the Planner agent');
      expect(getIntegrationMethod.call(generator, 'reviewer')).toContain('Integrates with the Coder agent');
      expect(getIntegrationMethod.call(generator, 'debugger')).toContain('Integrates with the Coder agent for bug fixing');
      expect(getIntegrationMethod.call(generator, 'optimizer')).toContain('Integrates with the Coder agent for performance improvements');
      expect(getIntegrationMethod.call(generator, 'tester')).toContain('Integrates with the Coder agent for test creation');
      expect(getIntegrationMethod.call(generator, 'unknown')).toBe('Standard integration with the LAPA swarm through the MoE router.');
    });
  });
});