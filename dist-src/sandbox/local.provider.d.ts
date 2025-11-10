/**
 * Local Sandbox Provider for LAPA MCP Integration
 *
 * This module implements the LocalSandboxProvider for MCP integration.
 * It provides local filesystem access, process execution, and sandboxed
 * tool execution capabilities.
 */
/**
 * Local Sandbox Provider class
 */
export declare class LocalSandboxProvider {
    private initialized;
    /**
     * Initializes the local sandbox environment
     */
    initialize(): Promise<void>;
    /**
     * Initializes the git server
     */
    private initializeGitServer;
    /**
     * Initializes the filesystem server
     */
    private initializeFilesystemServer;
    /**
     * Initializes the debug server
     */
    private initializeDebugServer;
    /**
     * Executes a command in the local sandbox
     * @param command Command to execute
     * @param args Command arguments
     * @returns Command execution result
     */
    executeCommand(command: string, args?: string[]): Promise<any>;
    /**
     * Lists files in a directory
     * @param path Directory path
     * @returns Array of file names
     */
    private listFiles;
    /**
     * Reads a file
     * @param path File path
     * @returns File content
     */
    private readFile;
    /**
     * Greps a file for a pattern
     * @param pattern Search pattern
     * @param path File path
     * @returns Matching lines
     */
    private grepFile;
    /**
     * Finds files matching a pattern
     * @param pattern Search pattern
     * @param basePath Base path to search from
     * @returns Matching file paths
     */
    private findFiles;
    /**
     * Executes a process
     * @param command Command to execute
     * @param args Command arguments
     * @returns Process execution result
     */
    private executeProcess;
}
export declare const localSandboxProvider: LocalSandboxProvider;
