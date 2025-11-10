/**
 * File Handler Utility
 *
 * Utility functions for file handling operations in the RAG pipeline.
 */
import { promises as fs } from 'fs';
import { join, extname } from 'path';
export class FileHandler {
    constructor(config) {
        this.config = config;
    }
    /**
     * Validate a file for processing
     * @param filePath Path to the file
     * @returns File information
     */
    async validateFile(filePath) {
        try {
            // Check if file exists
            const stats = await fs.stat(filePath);
            // Check if it's a file (not a directory)
            if (!stats.isFile()) {
                throw new Error('Path is not a file');
            }
            // Check file size
            if (stats.size > this.config.maxFileSize) {
                throw new Error(`File size exceeds limit of ${this.config.maxFileSize} bytes`);
            }
            // Get file extension
            const ext = extname(filePath).toLowerCase().substring(1);
            // Check if file type is supported
            if (!this.config.supportedTypes.includes(ext)) {
                throw new Error(`Unsupported file type: ${ext}`);
            }
            // Get file name without extension
            const name = filePath.split('/').pop()?.split('.')[0] || 'unknown';
            return {
                path: filePath,
                name,
                type: ext,
                size: stats.size,
                stats
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`File validation failed: ${error.message}`);
            }
            throw new Error('File validation failed: Unknown error');
        }
    }
    /**
     * Create temporary directory if it doesn't exist
     */
    async ensureTempDir() {
        try {
            await fs.access(this.config.tempDir);
        }
        catch {
            // Directory doesn't exist, create it
            await fs.mkdir(this.config.tempDir, { recursive: true });
        }
    }
    /**
     * Copy file to temporary directory
     * @param filePath Path to the source file
     * @returns Path to the copied file in temporary directory
     */
    async copyToTemp(filePath) {
        await this.ensureTempDir();
        const fileInfo = await this.validateFile(filePath);
        const tempPath = join(this.config.tempDir, `${Date.now()}-${fileInfo.name}.${fileInfo.type}`);
        await fs.copyFile(filePath, tempPath);
        return tempPath;
    }
    /**
     * Clean up temporary files
     */
    async cleanupTemp() {
        try {
            const files = await fs.readdir(this.config.tempDir);
            for (const file of files) {
                const filePath = join(this.config.tempDir, file);
                await fs.unlink(filePath);
            }
        }
        catch (error) {
            // Ignore errors during cleanup
            console.warn('Warning: Failed to clean up temporary directory', error);
        }
    }
    /**
     * Update configuration
     * @param newConfig New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}
//# sourceMappingURL=file.handler.js.map