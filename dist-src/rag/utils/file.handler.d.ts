/**
 * File Handler Utility
 *
 * Utility functions for file handling operations in the RAG pipeline.
 */
import { Stats } from 'fs';
interface FileHandlingConfig {
    supportedTypes: string[];
    maxFileSize: number;
    tempDir: string;
}
interface FileInfo {
    path: string;
    name: string;
    type: string;
    size: number;
    stats: Stats;
}
export declare class FileHandler {
    private config;
    constructor(config: FileHandlingConfig);
    /**
     * Validate a file for processing
     * @param filePath Path to the file
     * @returns File information
     */
    validateFile(filePath: string): Promise<FileInfo>;
    /**
     * Create temporary directory if it doesn't exist
     */
    ensureTempDir(): Promise<void>;
    /**
     * Copy file to temporary directory
     * @param filePath Path to the source file
     * @returns Path to the copied file in temporary directory
     */
    copyToTemp(filePath: string): Promise<string>;
    /**
     * Clean up temporary files
     */
    cleanupTemp(): Promise<void>;
    /**
     * Update configuration
     * @param newConfig New configuration
     */
    updateConfig(newConfig: Partial<FileHandlingConfig>): void;
}
export {};
