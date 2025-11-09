/**
 * Vercel Blob Storage Integration for LAPA Premium
 * 
 * This module provides integration with Vercel Blob storage for storing
 * and retrieving files in a scalable cloud storage solution.
 */

// Import necessary modules
import { put, del, list, head } from '@vercel/blob';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { LRUCache } from 'lru-cache';

/**
 * Vercel Blob Storage class
 */
export class VercelBlobStorage {
    private token: string;
    private lruCache: LRUCache<string, any>;
    
    constructor(token?: string, cacheSize: number = 1000) {
        this.token = token || process.env.BLOB_READ_WRITE_TOKEN || '';
        
        if (!this.token) {
            throw new Error('Vercel Blob read/write token is required');
        }
        
        // Initialize LRU cache for memory management
        this.lruCache = new LRUCache<string, any>({
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
    /**
     * Uploads a file to Vercel Blob storage with streaming support
     * @param filename Name of the file
     * @param data File data as Buffer, string, or ReadableStream
     * @param options Upload options
     * @returns Uploaded blob information
     */
    async uploadFile(
        filename: string,
        data: Buffer | string | NodeJS.ReadableStream,
        options?: {
            contentType?: string;
            cacheControlMaxAge?: number;
            addRandomSuffix?: boolean;
            access?: 'public' | 'private';
            onProgress?: (progress: number) => void;
        }
    ): Promise<any> {
        try {
            // Handle streaming uploads
            if (typeof data === 'object' && data !== null && 'pipe' in data) {
                // For streaming uploads, we need to buffer the data first
                // In a more advanced implementation, we could use a multipart upload
                const chunks: Buffer[] = [];
                for await (const chunk of data) {
                    chunks.push(chunk);
                }
                data = Buffer.concat(chunks);
            }
            
            const blob = await put(filename, data, {
                contentType: options?.contentType,
                cacheControlMaxAge: options?.cacheControlMaxAge,
                addRandomSuffix: options?.addRandomSuffix ?? true,
                access: options?.access || 'public',
            });
            
            return blob;
        } catch (error) {
            console.error('Failed to upload file to Vercel Blob storage:', error);
            throw error;
        }
    }
    
    /**
     * Downloads a file from Vercel Blob storage
     * @param url URL of the blob to download
     * @returns File content as Buffer
     */
    /**
     * Downloads a file from Vercel Blob storage with streaming support
     * @param url URL of the blob to download
     * @param options Download options
     * @returns File content as Buffer or ReadableStream
     */
    async downloadFile(
        url: string,
        options?: {
            stream?: boolean;
            onProgress?: (loaded: number, total: number) => void;
        }
    ): Promise<Buffer | NodeJS.ReadableStream> {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
            }
            
            // Return stream if requested
            if (options?.stream) {
                return response.body as NodeJS.ReadableStream;
            }
            
            // Return buffer by default
            const buffer = await response.arrayBuffer();
            return Buffer.from(buffer);
        } catch (error) {
            console.error('Failed to download file from Vercel Blob storage:', error);
            throw error;
        }
    }
    
    /**
     * Deletes a file from Vercel Blob storage
     * @param url URL of the blob to delete
     * @returns Deletion result
     */
    async deleteFile(url: string): Promise<void> {
        try {
            await del(url);
        } catch (error) {
            console.error('Failed to delete file from Vercel Blob storage:', error);
            throw error;
        }
    }
    
    /**
     * Lists files in Vercel Blob storage
     * @param options Listing options
     * @returns List of blobs
     */
    /**
     * Lists files in Vercel Blob storage with pagination
     * @param options Listing options
     * @returns List of blobs with pagination info
     */
    /**
     * Lists files in Vercel Blob storage with pagination and LRU eviction
     * @param options Listing options
     * @returns List of blobs with pagination info
     */
    async listFiles(options?: {
        prefix?: string;
        limit?: number;
        after?: string;
    }): Promise<{ blobs: any[]; hasMore: boolean; nextAfter?: string }> {
        try {
            const result = await list({
                prefix: options?.prefix,
                limit: options?.limit,
                after: options?.after,
            });
            
            // Update LRU cache with accessed blobs
            for (const blob of result.blobs) {
                this.updateLRU(blob.url);
            }
            
            return {
                blobs: result.blobs,
                hasMore: result.hasMore,
                nextAfter: result.nextAfter,
            };
        } catch (error) {
            console.error('Failed to list files in Vercel Blob storage:', error);
            throw error;
        }
    }
    
    /**
     * Gets metadata for a file in Vercel Blob storage
     * @param url URL of the blob
     * @returns Blob metadata
     */
    async getFileMetadata(url: string): Promise<any> {
        try {
            const metadata = await head(url);
            return metadata;
        } catch (error) {
            console.error('Failed to get file metadata from Vercel Blob storage:', error);
            throw error;
        }
    }
    
    /**
     * Updates LRU cache with accessed blob
     * @param url Blob URL
     */
    private updateLRU(url: string): void {
        // Add or update the blob in LRU cache
        this.lruCache.set(url, { lastAccessed: Date.now() });
    }
}

// Export singleton instance
export const vercelBlobStorage = new VercelBlobStorage();