"use strict";
/**
 * Local Sandbox Provider for LAPA MCP Integration
 *
 * This module implements the LocalSandboxProvider for MCP integration.
 * It provides local filesystem access, process execution, and sandboxed
 * tool execution capabilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.localSandboxProvider = exports.LocalSandboxProvider = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const child_process_1 = require("child_process");
// Sandbox configuration
const SANDBOX_DIR = '.lapa/sandbox';
const SANDBOX_SERVERS_DIR = (0, path_1.join)(SANDBOX_DIR, 'servers');
/**
 * Local Sandbox Provider class
 */
class LocalSandboxProvider {
    initialized = false;
    /**
     * Initializes the local sandbox environment
     */
    async initialize() {
        try {
            // Create sandbox directories
            await (0, promises_1.mkdir)(SANDBOX_DIR, { recursive: true });
            await (0, promises_1.mkdir)(SANDBOX_SERVERS_DIR, { recursive: true });
            // Initialize default servers
            await this.initializeGitServer();
            await this.initializeFilesystemServer();
            await this.initializeDebugServer();
            this.initialized = true;
            console.log('Local sandbox environment initialized');
        }
        catch (error) {
            console.error('Failed to initialize local sandbox:', error);
            throw error;
        }
    }
    /**
     * Initializes the git server
     */
    async initializeGitServer() {
        try {
            const gitServerPath = (0, path_1.join)(SANDBOX_SERVERS_DIR, 'git.ts');
            const gitServerContent = `
// Git Server Implementation
export const gitServer = {
    name: 'git',
    url: 'local://git',
    
    async execute(command: string, args: string[]): Promise<any> {
        // Git command execution logic would go here
        return { success: true, command, args };
    }
};
`;
            await (0, promises_1.writeFile)(gitServerPath, gitServerContent.trim());
            console.log('Git server initialized');
        }
        catch (error) {
            console.error('Failed to initialize git server:', error);
            throw error;
        }
    }
    /**
     * Initializes the filesystem server
     */
    async initializeFilesystemServer() {
        try {
            const fsServerPath = (0, path_1.join)(SANDBOX_SERVERS_DIR, 'fs.ts');
            const fsServerContent = `
// Filesystem Server Implementation
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

export const filesystemServer = {
    name: 'fs',
    url: 'local://fs',
    
    async execute(operation: string, path: string, data?: any): Promise<any> {
        switch (operation) {
            case 'read':
                return await readFile(path, 'utf-8');
            case 'write':
                await writeFile(path, data, 'utf-8');
                return { success: true };
            case 'list':
                return await readdir(path);
            case 'stat':
                return await stat(path);
            default:
                throw new Error('Unsupported operation: ' + operation);
        }
    }
};
`;
            await (0, promises_1.writeFile)(fsServerPath, fsServerContent.trim());
            console.log('Filesystem server initialized');
        }
        catch (error) {
            console.error('Failed to initialize filesystem server:', error);
            throw error;
        }
    }
    /**
     * Initializes the debug server
     */
    async initializeDebugServer() {
        try {
            const debugServerPath = (0, path_1.join)(SANDBOX_SERVERS_DIR, 'debug.ts');
            const debugServerContent = `
// Debug Server Implementation
export const debugServer = {
    name: 'debug',
    url: 'local://debugger',
    
    async execute(command: string, data?: any): Promise<any> {
        // Debug command execution logic would go here
        console.log('Debug command:', command, data);
        return { success: true, command, data };
    }
};
`;
            await (0, promises_1.writeFile)(debugServerPath, debugServerContent.trim());
            console.log('Debug server initialized');
        }
        catch (error) {
            console.error('Failed to initialize debug server:', error);
            throw error;
        }
    }
    /**
     * Executes a command in the local sandbox
     * @param command Command to execute
     * @param args Command arguments
     * @returns Command execution result
     */
    async executeCommand(command, args = []) {
        if (!this.initialized) {
            throw new Error('Sandbox not initialized. Call initialize() first.');
        }
        try {
            switch (command) {
                case 'ls':
                    return await this.listFiles(args[0] || '.');
                case 'cat':
                    return await this.readFile(args[0]);
                case 'grep':
                    return await this.grepFile(args[0], args[1]);
                case 'find':
                    return await this.findFiles(args[0], args[1]);
                case 'exec':
                    return await this.executeProcess(args[0], args.slice(1));
                default:
                    throw new Error('Unsupported command: ' + command);
            }
        }
        catch (error) {
            console.error('Failed to execute command ' + command + ':', error);
            throw error;
        }
    }
    /**
     * Lists files in a directory
     * @param path Directory path
     * @returns Array of file names
     */
    async listFiles(path) {
        try {
            return await (0, promises_1.readdir)(path);
        }
        catch (error) {
            console.error('Failed to list files in ' + path + ':', error);
            throw error;
        }
    }
    /**
     * Reads a file
     * @param path File path
     * @returns File content
     */
    async readFile(path) {
        try {
            return await (0, promises_1.readFile)(path, 'utf-8');
        }
        catch (error) {
            console.error('Failed to read file ' + path + ':', error);
            throw error;
        }
    }
    /**
     * Greps a file for a pattern
     * @param pattern Search pattern
     * @param path File path
     * @returns Matching lines
     */
    async grepFile(pattern, path) {
        try {
            const content = await (0, promises_1.readFile)(path, 'utf-8');
            const lines = content.split('\n');
            const matches = lines.filter(line => line.includes(pattern));
            return matches;
        }
        catch (error) {
            console.error('Failed to grep file ' + path + ':', error);
            throw error;
        }
    }
    /**
     * Finds files matching a pattern
     * @param pattern Search pattern
     * @param basePath Base path to search from
     * @returns Matching file paths
     */
    async findFiles(pattern, basePath = '.') {
        try {
            const matches = [];
            const files = await (0, promises_1.readdir)(basePath);
            for (const file of files) {
                const fullPath = (0, path_1.join)(basePath, file);
                const stats = await (0, promises_1.stat)(fullPath);
                if (stats.isDirectory()) {
                    const subMatches = await this.findFiles(pattern, fullPath);
                    matches.push(...subMatches);
                }
                else if (file.includes(pattern)) {
                    matches.push(fullPath);
                }
            }
            return matches;
        }
        catch (error) {
            console.error('Failed to find files with pattern ' + pattern + ':', error);
            throw error;
        }
    }
    /**
     * Executes a process
     * @param command Command to execute
     * @param args Command arguments
     * @returns Process execution result
     */
    async executeProcess(command, args) {
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)(command, args);
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('close', (exitCode) => {
                resolve({ stdout, stderr, exitCode: exitCode || 0 });
            });
            child.on('error', (error) => {
                reject(error);
            });
        });
    }
}
exports.LocalSandboxProvider = LocalSandboxProvider;
// Export singleton instance
exports.localSandboxProvider = new LocalSandboxProvider();
//# sourceMappingURL=local.provider.js.map