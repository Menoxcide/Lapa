/**
 * Vercel Blob Storage Integration for LAPA Premium
 *
 * This module provides integration with Vercel Blob storage for storing
 * and retrieving files in a scalable cloud storage solution.
 */
/**
 * Vercel Blob Storage class
 */
export declare class VercelBlobStorage {
    private token;
    private lruCache;
    constructor(token?: string, cacheSize?: number);
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
    uploadFile(filename: string, data: Buffer | string | NodeJS.ReadableStream, options?: {
        contentType?: string;
        cacheControlMaxAge?: number;
        addRandomSuffix?: boolean;
        access?: 'public' | 'private';
        onProgress?: (progress: number) => void;
    }): Promise<any>;
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
    downloadFile(url: string, options?: {
        stream?: boolean;
        onProgress?: (loaded: number, total: number) => void;
    }): Promise<Buffer | NodeJS.ReadableStream>;
    /**
     * Deletes a file from Vercel Blob storage
     * @param url URL of the blob to delete
     * @returns Deletion result
     */
    deleteFile(url: string): Promise<void>;
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
    listFiles(options?: {
        prefix?: string;
        limit?: number;
        after?: string;
    }): Promise<{
        blobs: any[];
        hasMore: boolean;
        nextAfter?: string;
    }>;
    /**
     * Gets metadata for a file in Vercel Blob storage
     * @param url URL of the blob
     * @returns Blob metadata
     */
    getFileMetadata(url: string): Promise<any>;
    /**
     * Updates LRU cache with accessed blob
     * @param url Blob URL
     */
    private updateLRU;
}
export declare const vercelBlobStorage: VercelBlobStorage;
