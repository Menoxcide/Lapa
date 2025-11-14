"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactsBuilderTool = void 0;
// Artifacts Builder Tool for integration with the LAPA agent system
const agent_tool_ts_1 = require("../core/agent-tool.ts");
const artifacts_builder_ts_1 = require("./artifacts-builder.ts");
class ArtifactsBuilderTool extends agent_tool_ts_1.BaseAgentTool {
    artifactsBuilder;
    constructor(config) {
        super('artifacts-builder', 'code-generation', 'Specialized artifacts builder for React/Tailwind HTML generation', '1.0.0');
        // Create the artifacts builder with the provided configuration
        this.artifactsBuilder = new artifacts_builder_ts_1.ArtifactsBuilder(config);
    }
    /**
     * Execute the artifacts builder tool
     * @param context Execution context
     * @returns Promise resolving to execution result
     */
    async execute(context) {
        try {
            // Extract parameters
            const { action, ...params } = context.parameters;
            // Validate parameters
            if (!this.validateParameters(context.parameters)) {
                return {
                    success: false,
                    error: 'Invalid parameters: action is required',
                    executionTime: 0
                };
            }
            let result;
            const startTime = Date.now();
            // Execute the requested action
            switch (action) {
                case 'generateReactCodeFromDesign':
                    result = await this.handleGenerateReactCodeFromDesign(params);
                    break;
                case 'getTemplates':
                    result = this.artifactsBuilder.getTemplates();
                    break;
                case 'getTemplate':
                    result = this.artifactsBuilder.getTemplate(params.id);
                    break;
                case 'createTemplate':
                    this.artifactsBuilder.createTemplate(params.template);
                    result = { success: true };
                    break;
                case 'updateTemplate':
                    this.artifactsBuilder.updateTemplate(params.id, params.template);
                    result = { success: true };
                    break;
                case 'deleteTemplate':
                    this.artifactsBuilder.deleteTemplate(params.id);
                    result = { success: true };
                    break;
                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}`,
                        executionTime: 0
                    };
            }
            const executionTime = Date.now() - startTime;
            return {
                success: true,
                output: result,
                executionTime
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                executionTime: 0
            };
        }
    }
    /**
     * Validate tool parameters
     * @param params Parameters to validate
     * @returns Boolean indicating if parameters are valid
     */
    validateParameters(params) {
        return !!params.action && typeof params.action === 'string';
    }
    /**
     * Handle React code generation from design
     * @param params Parameters for code generation
     * @returns Generated code
     */
    async handleGenerateReactCodeFromDesign(params) {
        if (!params.imageData) {
            throw new Error('Image data is required for code generation');
        }
        // Convert base64 image data to buffer if needed
        let imageBuffer;
        if (typeof params.imageData === 'string') {
            imageBuffer = Buffer.from(params.imageData, 'base64');
        }
        else if (params.imageData instanceof Buffer) {
            imageBuffer = params.imageData;
        }
        else {
            throw new Error('Invalid image data format');
        }
        const options = {
            componentName: params.componentName,
            includeComments: params.includeComments,
            useTemplates: params.useTemplates
        };
        return await this.artifactsBuilder.generateReactCodeFromDesign(imageBuffer, options);
    }
}
exports.ArtifactsBuilderTool = ArtifactsBuilderTool;
//# sourceMappingURL=artifacts-builder-tool.js.map