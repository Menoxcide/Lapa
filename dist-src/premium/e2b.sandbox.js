/**
 * E2B Sandbox Integration for LAPA Premium
 *
 * This module provides integration with E2B sandbox environments for
 * secure code execution and isolated computing tasks.
 */
// Import necessary modules
import { Sandbox } from '@e2b/sdk';
/**
 * E2B Sandbox Integration class
 */
export class E2BSandboxIntegration {
    constructor(apiKey, defaultTemplate) {
        this.apiKey = apiKey || process.env.E2B_API_KEY || '';
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
            const sandbox = await Sandbox.create(template || this.defaultTemplate, {
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
            const process = await sandbox.process.start({
                cmd: command,
            });
            const output = await process.wait();
            return {
                stdout: output.stdout,
                stderr: output.stderr,
                exitCode: output.exitCode,
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
            await sandbox.files.write(path, data);
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
            await sandbox.close();
        }
        catch (error) {
            console.error('Failed to close E2B sandbox:', error);
            throw error;
        }
    }
}
// Export singleton instance
export const e2bSandboxIntegration = new E2BSandboxIntegration();
//# sourceMappingURL=e2b.sandbox.js.map