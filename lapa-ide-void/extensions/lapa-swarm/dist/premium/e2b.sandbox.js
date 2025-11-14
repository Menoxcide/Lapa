"use strict";
/**
 * E2B Sandbox Integration for LAPA Premium
 *
 * This module provides integration with E2B sandbox environments for
 * secure code execution and isolated computing tasks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.e2bSandboxIntegration = exports.E2BSandboxIntegration = void 0;
// Import necessary modules
const code_interpreter_1 = require("@e2b/code-interpreter");
/**
 * E2B Sandbox Integration class
 */
class E2BSandboxIntegration {
    apiKey;
    defaultTemplate;
    constructor(apiKey, defaultTemplate) {
        // Handle both Node.js and browser environments
        const envApiKey = typeof process !== 'undefined' && process.env ? process.env.E2B_API_KEY : undefined;
        this.apiKey = apiKey || envApiKey || '';
        this.defaultTemplate = defaultTemplate || 'base';
        if (!this.apiKey) {
            throw new Error('E2B API key is required');
        }
    }
    /**
     * Creates a new E2B sandbox instance
     * @param template Template to use for the sandbox
     * @param options Sandbox options
     * @returns Sandbox instance
     */
    async createSandbox(template, options) {
        try {
            const sandbox = await code_interpreter_1.Sandbox.create({
                template: template || this.defaultTemplate,
                apiKey: this.apiKey,
                ...options
            });
            return sandbox;
        }
        catch (error) {
            console.error('Failed to create E2B sandbox:', error);
            throw error;
        }
    }
    /**
     * Executes a command in an E2B sandbox
     * @param sandbox Sandbox instance
     * @param command Command to execute
     * @returns Command execution result
     */
    async executeCommand(sandbox, command) {
        try {
            // Use the correct API to run commands in foreground mode
            const result = await sandbox.commands.run(command);
            return {
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode,
            };
        }
        catch (error) {
            console.error('Failed to execute command in E2B sandbox:', error);
            throw error;
        }
    }
    /**
     * Uploads a file to an E2B sandbox
     * @param sandbox Sandbox instance
     * @param path Path in the sandbox to upload to
     * @param data File data
     * @returns Upload result
     */
    async uploadFile(sandbox, path, data) {
        try {
            // Convert Buffer to a format compatible with E2B
            if (Buffer.isBuffer(data)) {
                // Convert Buffer to string - this should work for most cases
                await sandbox.files.write(path, data.toString('utf8'));
            }
            else {
                await sandbox.files.write(path, data);
            }
        }
        catch (error) {
            console.error('Failed to upload file to E2B sandbox:', error);
            throw error;
        }
    }
    /**
     * Downloads a file from an E2B sandbox
     * @param sandbox Sandbox instance
     * @param path Path in the sandbox to download from
     * @returns File content
     */
    async downloadFile(sandbox, path) {
        try {
            const content = await sandbox.files.read(path);
            return content;
        }
        catch (error) {
            console.error('Failed to download file from E2B sandbox:', error);
            throw error;
        }
    }
    /**
     * Installs packages in an E2B sandbox
     * @param sandbox Sandbox instance
     * @param packages Packages to install
     * @param packageManager Package manager to use
     * @returns Installation result
     */
    async installPackages(sandbox, packages, packageManager = 'npm') {
        try {
            let command;
            switch (packageManager) {
                case 'npm':
                    command = `npm install ${packages.join(' ')}`;
                    break;
                case 'pip':
                    command = `pip install ${packages.join(' ')}`;
                    break;
                case 'apt':
                    command = `apt-get update && apt-get install -y ${packages.join(' ')}`;
                    break;
                default:
                    throw new Error(`Unsupported package manager: ${packageManager}`);
            }
            return await this.executeCommand(sandbox, command);
        }
        catch (error) {
            console.error('Failed to install packages in E2B sandbox:', error);
            throw error;
        }
    }
    /**
     * Closes an E2B sandbox
     * @param sandbox Sandbox instance to close
     * @returns Close result
     */
    async closeSandbox(sandbox) {
        try {
            // Use the correct method to kill/stop the sandbox
            await sandbox.kill();
        }
        catch (error) {
            console.error('Failed to close E2B sandbox:', error);
            throw error;
        }
    }
}
exports.E2BSandboxIntegration = E2BSandboxIntegration;
// Export singleton instance
exports.e2bSandboxIntegration = new E2BSandboxIntegration();
//# sourceMappingURL=e2b.sandbox.js.map