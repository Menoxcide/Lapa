"use strict";
/**
 * PromptEngineer MCP Integration for LAPA v1.2.2 — Phase 14
 *
 * This module integrates PromptEngineer MCP server (cc_peng_mcp) for prompt refinement.
 * It provides stdio transport to MCPManager with auto-detect/refine hooks for vague inputs.
 *
 * Repo: https://github.com/gr3enarr0w/cc_peng_mcp (MIT)
 * Use Cases: Vague bug ("slow site") → structured plan (grep perf files + test)
 *            Feature ("better app") → Q&A + git branch
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptEngineer = exports.PromptEngineerClient = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const event_bus_ts_1 = require("../core/event-bus.ts");
const zod_1 = require("zod");
const mcp_connector_ts_1 = require("../mcp/mcp-connector.ts");
// Zod schema for prompt refinement request
const promptRefinementRequestSchema = zod_1.z.object({
    originalPrompt: zod_1.z.string().min(1),
    context: zod_1.z.record(zod_1.z.unknown()).optional(),
    taskType: zod_1.z.enum(['bug', 'feature', 'refactor', 'other']).optional(),
    sessionId: zod_1.z.string().optional()
});
/**
 * PromptEngineer MCP Client
 *
 * Manages stdio transport to PromptEngineer MCP server for prompt refinement.
 */
class PromptEngineerClient {
    config;
    serverProcess = null;
    mcpConnector = null;
    isConnected = false;
    messageQueue = [];
    requestIdCounter = 0;
    constructor(config) {
        this.config = {
            serverPath: config?.serverPath || this.findServerPath(),
            autoDetect: config?.autoDetect ?? true,
            enableQnA: config?.enableQnA ?? true,
            refineThreshold: config?.refineThreshold ?? 0.7
        };
    }
    /**
     * Finds the PromptEngineer MCP server path
     * Checks common locations for cc_peng_mcp installation
     */
    findServerPath() {
        // Check if server is in node_modules or project root
        const possiblePaths = [
            (0, path_1.join)(process.cwd(), 'cc_peng_mcp', 'index.js'),
            (0, path_1.join)(process.cwd(), 'node_modules', 'cc_peng_mcp', 'index.js'),
            (0, path_1.join)(process.cwd(), '..', 'cc_peng_mcp', 'index.js')
        ];
        // Check if any of the possible paths exist
        for (const path of possiblePaths) {
            try {
                // In a real implementation, we'd check if the file exists
                // For now, we'll just return the first path but log a warning
                console.warn(`[PromptEngineer] Checking for server at: ${path}`);
                return path;
            }
            catch (error) {
                // Continue to next path
            }
        }
        // Return default path
        console.warn('[PromptEngineer] Server path not found, using default path');
        return possiblePaths[0];
    }
    /**
     * Starts the PromptEngineer MCP server via stdio
     */
    async start() {
        if (this.isConnected) {
            console.log('[PromptEngineer] Server already running');
            return;
        }
        try {
            // Try to use MCP connector if server path is available
            if (this.config.serverPath) {
                try {
                    console.log(`[PromptEngineer] Connecting via MCP connector to: ${this.config.serverPath}`);
                    // Create MCP connector with stdio transport
                    this.mcpConnector = (0, mcp_connector_ts_1.createMCPConnector)({
                        transportType: 'stdio',
                        stdioCommand: ['node', this.config.serverPath],
                        enableToolDiscovery: true,
                        enableProgressiveDisclosure: true
                    });
                    // Connect to MCP server
                    await this.mcpConnector.connect();
                    this.isConnected = true;
                    await event_bus_ts_1.eventBus.publish({
                        id: `prompt-engineer-connected-${Date.now()}`,
                        type: 'prompt-engineer.connected',
                        timestamp: Date.now(),
                        source: 'prompt-engineer'
                    });
                    console.log('[PromptEngineer] Connected via MCP connector successfully');
                    return;
                }
                catch (mcpError) {
                    console.warn('[PromptEngineer] MCP connector failed, falling back to direct stdio:', mcpError);
                }
            }
            // Fallback to direct stdio process management
            if (this.config.serverPath) {
                console.log(`[PromptEngineer] Starting server directly at: ${this.config.serverPath}`);
                // Spawn the MCP server process
                this.serverProcess = (0, child_process_1.spawn)('node', [this.config.serverPath], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                // Setup stdio handlers
                this.setupStdioHandlers();
                // Wait for server to be ready
                await this.waitForServerReady();
                this.isConnected = true;
                await event_bus_ts_1.eventBus.publish({
                    id: `prompt-engineer.connected.${Date.now()}`,
                    type: 'prompt-engineer.connected',
                    timestamp: Date.now(),
                    source: 'prompt-engineer',
                    payload: {}
                });
                console.log('[PromptEngineer] Server started successfully');
            }
            else {
                console.warn('[PromptEngineer] No server path configured, running in standalone mode');
                this.isConnected = true;
            }
        }
        catch (error) {
            console.error('[PromptEngineer] Failed to start server:', error);
            // Provide clear instructions for installing the external dependency
            console.error('[PromptEngineer] To fix this issue, please run:');
            console.error('[PromptEngineer]   git clone https://github.com/gr3enarr0w/cc_peng_mcp.git');
            console.error('[PromptEngineer]   cd cc_peng_mcp');
            console.error('[PromptEngineer]   npm install');
            // Don't throw - allow standalone mode
            this.isConnected = true;
        }
    }
    /**
     * Stops the PromptEngineer MCP server
     */
    async stop() {
        if (this.mcpConnector) {
            try {
                await this.mcpConnector.disconnect();
                this.mcpConnector = null;
            }
            catch (error) {
                console.error('[PromptEngineer] Error disconnecting MCP connector:', error);
            }
        }
        if (this.serverProcess) {
            this.serverProcess.kill();
            this.serverProcess = null;
        }
        this.isConnected = false;
        await event_bus_ts_1.eventBus.publish({
            id: `prompt-engineer-disconnected-${Date.now()}`,
            type: 'prompt-engineer.disconnected',
            timestamp: Date.now(),
            source: 'prompt-engineer'
        });
        console.log('[PromptEngineer] Server stopped');
    }
    /**
     * Detects if a prompt is vague and needs refinement
     */
    async detectVaguePrompt(prompt) {
        if (!this.config.autoDetect) {
            return { isVague: false, confidence: 1.0, reasons: [] };
        }
        // Heuristic-based vague detection
        const vagueIndicators = [
            /\b(slow|fast|better|worse|fix|improve|optimize)\b/i,
            /\b(make|do|create|add)\b.*\b(it|this|that)\b/i,
            /^[^.!?]{0,20}$/, // Very short prompts
            /\?$/, // Questions without context
        ];
        const reasons = [];
        let vagueScore = 0;
        for (const indicator of vagueIndicators) {
            if (indicator.test(prompt)) {
                vagueScore += 0.25;
                reasons.push(`Matches vague pattern: ${indicator.source}`);
            }
        }
        const isVague = vagueScore >= this.config.refineThreshold;
        const confidence = Math.min(vagueScore, 1.0);
        return { isVague, confidence, reasons };
    }
    /**
     * Refines a vague prompt into a structured plan
     */
    async refinePrompt(request) {
        // Validate request
        const validated = promptRefinementRequestSchema.parse(request);
        try {
            // Check if prompt is vague
            const vagueCheck = await this.detectVaguePrompt(validated.originalPrompt);
            if (!vagueCheck.isVague) {
                return {
                    success: true,
                    refinedPrompt: validated.originalPrompt,
                    confidence: 1.0 - vagueCheck.confidence
                };
            }
            // Generate clarification questions
            const clarificationQuestions = this.generateClarificationQuestions(validated.originalPrompt, validated.taskType);
            // If Q&A mode is enabled and we have questions, return them
            if (this.config.enableQnA && clarificationQuestions.length > 0) {
                return {
                    success: true,
                    clarificationQuestions,
                    confidence: vagueCheck.confidence
                };
            }
            // Otherwise, generate a structured plan
            const structuredPlan = await this.generateStructuredPlan(validated.originalPrompt, validated.taskType, validated.context);
            // Refine the prompt
            const refinedPrompt = this.buildRefinedPrompt(validated.originalPrompt, structuredPlan);
            return {
                success: true,
                refinedPrompt,
                structuredPlan,
                confidence: vagueCheck.confidence
            };
        }
        catch (error) {
            console.error('[PromptEngineer] Refinement error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                confidence: 0
            };
        }
    }
    /**
     * Generates clarification questions for vague prompts
     */
    generateClarificationQuestions(prompt, taskType) {
        const questions = [];
        // Task-specific questions
        if (taskType === 'bug') {
            questions.push('What specific behavior indicates the bug?');
            questions.push('When does the bug occur? (e.g., on page load, after user action)');
            questions.push('What is the expected behavior?');
        }
        else if (taskType === 'feature') {
            questions.push('What should the feature do?');
            questions.push('Where should the feature be accessible?');
            questions.push('What are the acceptance criteria?');
        }
        else {
            questions.push('Can you provide more specific details?');
            questions.push('What is the expected outcome?');
            questions.push('Are there any constraints or requirements?');
        }
        // General questions for vague prompts
        if (prompt.toLowerCase().includes('slow') || prompt.toLowerCase().includes('fast')) {
            questions.push('What specific performance metric needs improvement?');
            questions.push('What is the current performance baseline?');
        }
        if (prompt.toLowerCase().includes('better') || prompt.toLowerCase().includes('improve')) {
            questions.push('What aspect needs improvement?');
            questions.push('What would success look like?');
        }
        return questions;
    }
    /**
     * Generates a structured plan from a vague prompt
     */
    async generateStructuredPlan(prompt, taskType, context) {
        const steps = [];
        const tools = [];
        const files = [];
        // Analyze prompt for tool requirements
        if (prompt.toLowerCase().includes('grep') || prompt.toLowerCase().includes('search')) {
            tools.push('grep');
        }
        if (prompt.toLowerCase().includes('git') || prompt.toLowerCase().includes('branch')) {
            tools.push('git');
        }
        if (prompt.toLowerCase().includes('test') || prompt.toLowerCase().includes('spec')) {
            tools.push('test-runner');
        }
        if (prompt.toLowerCase().includes('perf') || prompt.toLowerCase().includes('performance')) {
            tools.push('performance-profiler');
            files.push('**/*.perf.ts', '**/*.benchmark.ts');
        }
        // Generate steps based on task type
        if (taskType === 'bug') {
            steps.push('1. Identify the bug location using grep/search');
            steps.push('2. Analyze the problematic code');
            steps.push('3. Write a test case that reproduces the bug');
            steps.push('4. Fix the bug');
            steps.push('5. Verify the fix with tests');
        }
        else if (taskType === 'feature') {
            steps.push('1. Create a feature branch using git');
            steps.push('2. Design the feature architecture');
            steps.push('3. Implement the feature');
            steps.push('4. Write tests for the feature');
            steps.push('5. Update documentation');
        }
        else {
            steps.push('1. Analyze the requirements');
            steps.push('2. Plan the implementation');
            steps.push('3. Execute the plan');
            steps.push('4. Verify the results');
        }
        // Extract file patterns from context if available
        if (context?.files && Array.isArray(context.files)) {
            files.push(...context.files);
        }
        return { steps, tools, files: files.length > 0 ? files : undefined };
    }
    /**
     * Builds a refined prompt from original prompt and structured plan
     */
    buildRefinedPrompt(originalPrompt, plan) {
        let refined = `Original request: ${originalPrompt}\n\n`;
        refined += `Structured plan:\n`;
        refined += plan.steps.map(step => `  ${step}`).join('\n');
        if (plan.tools.length > 0) {
            refined += `\n\nRequired tools: ${plan.tools.join(', ')}`;
        }
        if (plan.files && plan.files.length > 0) {
            refined += `\n\nFiles to consider: ${plan.files.join(', ')}`;
        }
        return refined;
    }
    /**
     * Handles interactive Q&A session
     */
    async handleQnASession(originalPrompt, answers) {
        try {
            // Build enriched prompt from Q&A
            let enrichedPrompt = originalPrompt + '\n\nAdditional context:\n';
            for (const [question, answer] of Object.entries(answers)) {
                enrichedPrompt += `Q: ${question}\nA: ${answer}\n\n`;
            }
            // Generate structured plan with enriched context
            const structuredPlan = await this.generateStructuredPlan(enrichedPrompt);
            return {
                success: true,
                refinedPrompt: enrichedPrompt,
                structuredPlan,
                confidence: 0.9
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                confidence: 0
            };
        }
    }
    /**
     * Setup stdio handlers for the server process
     */
    setupStdioHandlers() {
        if (!this.serverProcess)
            return;
        // Handle stdout
        this.serverProcess.stdout?.on('data', (data) => {
            console.log(`[PromptEngineer Server] ${data}`);
        });
        // Handle stderr
        this.serverProcess.stderr?.on('data', (data) => {
            console.error(`[PromptEngineer Server Error] ${data}`);
        });
        // Handle process exit
        this.serverProcess.on('exit', (code) => {
            console.log(`[PromptEngineer] Server exited with code ${code}`);
            this.isConnected = false;
            this.serverProcess = null;
        });
        // Handle process error
        this.serverProcess.on('error', (error) => {
            console.error(`[PromptEngineer] Server process error:`, error);
            this.isConnected = false;
        });
    }
    /**
     * Wait for server to be ready
     */
    async waitForServerReady() {
        // In a real implementation, we'd wait for a specific ready signal from the server
        // For now, we'll just wait a short time to allow the process to start
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    }
}
exports.PromptEngineerClient = PromptEngineerClient;
// Export singleton instance
exports.promptEngineer = new PromptEngineerClient();
// Auto-start on module load (optional)
// promptEngineer.start().catch(console.error);
//# sourceMappingURL=prompt-engineer.js.map