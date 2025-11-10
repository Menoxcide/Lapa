/**
 * AGENT.md Auto-Generator for LAPA
 *
 * This module automatically generates AGENT.md documentation files for LAPA agents.
 * It creates comprehensive documentation including agent capabilities, usage patterns,
 * and integration details.
 */
import { writeFile } from 'fs/promises';
import { join } from 'path';
/**
 * LAPA Agent Documentation Generator
 */
export class AgentDocumentationGenerator {
    constructor(options = {}) {
        this.outputPath = options.outputPath || '.';
    }
    /**
     * Generates documentation for a single agent
     * @param agent The agent to document
     * @param options Generation options
     * @returns Generated documentation content
     */
    generateAgentDocumentation(agent, options = {}) {
        const doc = this.createAgentDocumentation(agent);
        return this.formatDocumentation(doc, options);
    }
    /**
     * Generates documentation for multiple agents
     * @param agents Array of agents to document
     * @param options Generation options
     * @returns Generated documentation content
     */
    generateAgentsDocumentation(agents, options = {}) {
        let content = `# LAPA Agents Documentation\n\n`;
        if (options.includeTimestamp) {
            content += `*Generated on ${new Date().toISOString()}*\n\n`;
        }
        if (options.includeVersion) {
            content += `*Version: ${options.includeVersion}*\n\n`;
        }
        content += `## Overview\n`;
        content += `This document provides documentation for all agents in the LAPA swarm.\n\n`;
        content += `## Agent Summary\n`;
        content += `| Name | Type | Expertise Areas | Workload |\n`;
        content += `|------|------|----------------|----------|\n`;
        for (const agent of agents) {
            content += `| ${agent.name} | ${agent.type} | ${agent.expertise.join(', ')} | ${agent.workload}/${agent.capacity} |\n`;
        }
        content += `\n## Detailed Agent Documentation\n\n`;
        for (const agent of agents) {
            const doc = this.createAgentDocumentation(agent);
            content += this.formatSingleAgentDocumentation(doc, options);
        }
        return content;
    }
    /**
     * Saves agent documentation to a file
     * @param agent The agent to document
     * @param filename Output filename
     * @param options Generation options
     */
    async saveAgentDocumentation(agent, filename, options = {}) {
        const content = this.generateAgentDocumentation(agent, options);
        const outputPath = join(this.outputPath, filename);
        await writeFile(outputPath, content);
        console.log(`Agent documentation saved to ${outputPath}`);
    }
    /**
     * Saves documentation for multiple agents to a file
     * @param agents Array of agents to document
     * @param filename Output filename
     * @param options Generation options
     */
    async saveAgentsDocumentation(agents, filename, options = {}) {
        const content = this.generateAgentsDocumentation(agents, options);
        const outputPath = join(this.outputPath, filename);
        await writeFile(outputPath, content);
        console.log(`Agents documentation saved to ${outputPath}`);
    }
    /**
     * Creates structured documentation for an agent
     * @param agent The agent to document
     * @returns Structured documentation object
     */
    createAgentDocumentation(agent) {
        return {
            name: agent.name,
            type: agent.type,
            description: this.getAgentDescription(agent.type),
            capabilities: agent.expertise,
            usage: this.getAgentUsage(agent.type),
            integration: this.getAgentIntegration(agent.type),
            configuration: {
                id: agent.id,
                workload: agent.workload,
                capacity: agent.capacity
            }
        };
    }
    /**
     * Formats documentation as Markdown
     * @param doc Documentation object
     * @param options Generation options
     * @returns Formatted Markdown content
     */
    formatDocumentation(doc, options) {
        let content = `# ${doc.name} Agent\n\n`;
        if (options.includeTimestamp) {
            content += `*Generated on ${new Date().toISOString()}*\n\n`;
        }
        if (options.includeVersion) {
            content += `*Version: ${options.includeVersion}*\n\n`;
        }
        content += `## Overview\n`;
        content += `${doc.description}\n\n`;
        content += `## Type\n`;
        content += `${doc.type}\n\n`;
        content += `## Capabilities\n`;
        for (const capability of doc.capabilities) {
            content += `- ${capability}\n`;
        }
        content += `\n`;
        content += `## Usage\n`;
        content += `${doc.usage}\n\n`;
        content += `## Integration\n`;
        content += `${doc.integration}\n\n`;
        content += `## Configuration\n`;
        content += '```json\n';
        content += JSON.stringify(doc.configuration, null, 2);
        content += '\n```\n';
        return content;
    }
    /**
     * Formats single agent documentation as Markdown
     * @param doc Documentation object
     * @param options Generation options
     * @returns Formatted Markdown content
     */
    formatSingleAgentDocumentation(doc, _options) {
        let content = `### ${doc.name} (${doc.type})\n\n`;
        content += `#### Overview\n`;
        content += `${doc.description}\n\n`;
        content += `#### Capabilities\n`;
        for (const capability of doc.capabilities) {
            content += `- ${capability}\n`;
        }
        content += `\n`;
        content += `#### Usage\n`;
        content += `${doc.usage}\n\n`;
        content += `#### Integration\n`;
        content += `${doc.integration}\n\n`;
        content += `#### Configuration\n`;
        content += '```json\n';
        content += JSON.stringify(doc.configuration, null, 2);
        content += '\n```\n\n';
        return content;
    }
    /**
     * Gets agent description based on type
     * @param type Agent type
     * @returns Agent description
     */
    getAgentDescription(type) {
        const descriptions = {
            planner: 'The Planner agent is responsible for high-level task planning and decomposition. It breaks down complex problems into manageable subtasks and creates execution plans.',
            coder: 'The Coder agent specializes in code generation and implementation. It writes clean, efficient code based on specifications and requirements.',
            reviewer: 'The Reviewer agent focuses on code review and quality assurance. It analyzes code for potential issues, style violations, and best practice adherence.',
            debugger: 'The Debugger agent detects and fixes bugs in code. It identifies issues, diagnoses root causes, and implements solutions.',
            optimizer: 'The Optimizer agent improves code performance and efficiency. It analyzes bottlenecks and suggests optimizations.',
            tester: 'The Tester agent creates and executes tests to ensure code quality and reliability. It develops test cases and validates functionality.'
        };
        return descriptions[type] || 'General purpose agent with unspecified capabilities.';
    }
    /**
     * Gets agent usage instructions based on type
     * @param type Agent type
     * @returns Agent usage instructions
     */
    getAgentUsage(type) {
        const usage = {
            planner: 'Route high-level planning tasks and complex problem decomposition to this agent. It works best with abstract requirements that need structuring.',
            coder: 'Send code generation requests and implementation tasks to this agent. Provide clear specifications and requirements for best results.',
            reviewer: 'Assign code review tasks to this agent. It can analyze code quality, identify potential issues, and suggest improvements.',
            debugger: 'Route bug reports and debugging tasks to this agent. Provide error messages, code snippets, and reproduction steps for effective diagnosis.',
            optimizer: 'Send performance optimization requests to this agent. It can analyze code for inefficiencies and suggest improvements.',
            tester: 'Assign test creation and execution tasks to this agent. Provide functionality specifications for comprehensive test coverage.'
        };
        return usage[type] || 'This agent can handle general tasks within its expertise areas.';
    }
    /**
     * Gets agent integration details based on type
     * @param type Agent type
     * @returns Agent integration details
     */
    getAgentIntegration(type) {
        const integration = {
            planner: 'Integrates with the MoE router for task distribution and with the Coder agent for implementation planning.',
            coder: 'Integrates with the Planner agent for task specifications and with the Reviewer agent for code quality assurance.',
            reviewer: 'Integrates with the Coder agent for code review and with the Debugger agent for issue identification.',
            debugger: 'Integrates with the Coder agent for bug fixing and with the Reviewer agent for validation.',
            optimizer: 'Integrates with the Coder agent for performance improvements and with the Tester agent for validation.',
            tester: 'Integrates with the Coder agent for test creation and with the Debugger agent for bug reproduction.'
        };
        return integration[type] || 'Standard integration with the LAPA swarm through the MoE router.';
    }
}
// Export singleton instance
export const agentDocumentationGenerator = new AgentDocumentationGenerator();
//# sourceMappingURL=agent.md.generator.js.map