/**
 * E2B Sandbox Integration for LAPA Premium
 *
 * This module provides integration with E2B sandbox environments for
 * secure code execution and isolated computing tasks.
 */
import { Sandbox } from '@e2b/sdk';
/**
 * E2B Sandbox Integration class
 */
export declare class E2BSandboxIntegration {
    private apiKey;
    private defaultTemplate;
    constructor(apiKey?: string, defaultTemplate?: string);
    /**
     * Creates a new E2B sandbox instance
     * @param template Template to use for the sandbox
     * @param options Sandbox options
     * @returns Sandbox instance
     */
    createSandbox(template?: string, options?: any): Promise<Sandbox>;
    /**
     * Executes a command in an E2B sandbox
     * @param sandbox Sandbox instance
     * @param command Command to execute
     * @returns Command execution result
     */
    executeCommand(sandbox: Sandbox, command: string): Promise<any>;
    /**
     * Uploads a file to an E2B sandbox
     * @param sandbox Sandbox instance
     * @param path Path in the sandbox to upload to
     * @param data File data
     * @returns Upload result
     */
    uploadFile(sandbox: Sandbox, path: string, data: string | Buffer): Promise<void>;
    /**
     * Downloads a file from an E2B sandbox
     * @param sandbox Sandbox instance
     * @param path Path in the sandbox to download from
     * @returns File content
     */
    downloadFile(sandbox: Sandbox, path: string): Promise<string>;
    /**
     * Installs packages in an E2B sandbox
     * @param sandbox Sandbox instance
     * @param packages Packages to install
     * @param packageManager Package manager to use
     * @returns Installation result
     */
    installPackages(sandbox: Sandbox, packages: string[], packageManager?: 'npm' | 'pip' | 'apt'): Promise<any>;
    /**
     * Closes an E2B sandbox
     * @param sandbox Sandbox instance to close
     * @returns Close result
     */
    closeSandbox(sandbox: Sandbox): Promise<void>;
}
export declare const e2bSandboxIntegration: E2BSandboxIntegration;
