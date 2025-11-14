"use strict";
/**
 * Vercel Blob Storage Integration for LAPA Premium
 *
 * This module provides integration with Vercel Blob storage for storing
 * and retrieving files in a scalable cloud storage solution.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.vercelBlobStorage = exports.VercelBlobStorage = void 0;
// Import necessary modules
const blob_1 = require("@vercel/blob");
const lru_cache_1 = require("lru-cache");
/**
 * Vercel Blob Storage class
 */
class VercelBlobStorage {
    token;
    lruCache;
    constructor(token, cacheSize = 1000) {
        this.token = token || process.env.BLOB_READ_WRITE_TOKEN || '';
        if (!this.token) {
            throw new Error('Vercel Blob read/write token is required');
        }
        // Initialize LRU cache for memory management
        this.lruCache = new lru_cache_1.LRUCache({
            max: cacheSize,
            ttl: 1000 * 60 * 60 // 1 hour TTL
        });
    }
    /**
     * Uploads a file to Vercel Blob storage
     * @param filename Name of the file
     * @param data File data as Buffer or string
     * @param options Upload options
     * @returns Uploaded blob information
     */
    async uploadFile(filename, data, options) {
        try {
            // Prepare options for the put command
            const putOptions = {
                contentType: options?.contentType,
                cacheControlMaxAge: options?.cacheControlMaxAge,
                addRandomSuffix: options?.addRandomSuffix ?? true,
                access: options?.access || 'public',
            };
            const blob = await (0, blob_1.put)(filename, data, putOptions);
            return blob;
        }
        catch (error) {
            console.error('Failed to upload file to Vercel Blob storage:', error);
            throw error;
        }
    }
    /**
     * Downloads a file from Vercel Blob storage
     * @param url URL of the blob to download
     * @param options Download options
     * @returns File content as Buffer or ReadableStream
     */
    async downloadFile(url, options) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
            }
            // Return stream if requested
            if (options?.stream) {
                // Convert to unknown first to avoid TypeScript error, then cast to ReadableStream
                return response.body;
            }
            // Return buffer by default
            const buffer = await response.arrayBuffer();
            return Buffer.from(buffer);
        }
        catch (error) {
            console.error('Failed to download file from Vercel Blob storage:', error);
            throw error;
        }
    }
    /**
     * Deletes a file from Vercel Blob storage
     * @param url URL of the blob to delete
     * @returns Deletion result
     */
    async deleteFile(url) {
        try {
            await (0, blob_1.del)(url);
        }
        catch (error) {
            console.error('Failed to delete file from Vercel Blob storage:', error);
            throw error;
        }
    }
    /**
     * Lists files in Vercel Blob storage with pagination
     * @param options Listing options
     * @returns List of blobs with pagination info
     */
    async listFiles(options) {
        try {
            const listOptions = {
                prefix: options?.prefix,
                limit: options?.limit,
                cursor: options?.cursor,
            };
            const result = await (0, blob_1.list)(listOptions);
            // Update LRU cache with accessed blobs
            for (const blob of result.blobs) {
                this.updateLRU(blob.url);
            }
            return {
                blobs: result.blobs,
                hasMore: result.hasMore,
                cursor: result.cursor,
            };
        }
        catch (error) {
            console.error('Failed to list files in Vercel Blob storage:', error);
            throw error;
        }
    }
    /**
     * Gets metadata for a file in Vercel Blob storage
     * @param url URL of the blob
     * @returns Blob metadata
     */
    async getFileMetadata(url) {
        try {
            const metadata = await (0, blob_1.head)(url);
            return metadata;
        }
        catch (error) {
            console.error('Failed to get file metadata from Vercel Blob storage:', error);
            throw error;
        }
    }
    /**
     * Updates LRU cache with accessed blob
     * @param url Blob URL
     */
    updateLRU(url) {
        // Add or update the blob in LRU cache
        this.lruCache.set(url, { lastAccessed: Date.now() });
    }
}
exports.VercelBlobStorage = VercelBlobStorage;
// Export singleton instance
exports.vercelBlobStorage = new VercelBlobStorage();
//# sourceMappingURL=blob.storage.js.map