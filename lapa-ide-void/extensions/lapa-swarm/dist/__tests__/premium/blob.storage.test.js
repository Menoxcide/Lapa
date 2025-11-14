"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const blob_storage_ts_1 = require("../../premium/blob.storage.ts");
const vitest_2 = require("vitest");
// Mock the @vercel/blob module
vitest_2.vi.mock('@vercel/blob', () => ({
    put: vitest_2.vi.fn(),
    del: vitest_2.vi.fn(),
    list: vitest_2.vi.fn(),
    head: vitest_2.vi.fn()
}));
(0, vitest_1.describe)('VercelBlobStorage', () => {
    let blobStorage;
    const mockToken = 'test-token-123';
    beforeEach(() => {
        // Clear all mocks before each test
        // All mocks are automatically cleared in vitest
        // Set environment variable for token
        process.env.BLOB_READ_WRITE_TOKEN = mockToken;
        blobStorage = new blob_storage_ts_1.VercelBlobStorage();
    });
    afterEach(() => {
        // Clean up environment variable
        delete process.env.BLOB_READ_WRITE_TOKEN;
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with environment variable token', () => {
            (0, vitest_1.expect)(blobStorage).toBeDefined();
        });
        (0, vitest_1.it)('should initialize with provided token', () => {
            const customStorage = new blob_storage_ts_1.VercelBlobStorage('custom-token');
            (0, vitest_1.expect)(customStorage).toBeDefined();
        });
        (0, vitest_1.it)('should throw error when no token is available', () => {
            // Remove environment variable
            delete process.env.BLOB_READ_WRITE_TOKEN;
            (0, vitest_1.expect)(() => new blob_storage_ts_1.VercelBlobStorage()).toThrow('Vercel Blob read/write token is required');
        });
    });
    (0, vitest_1.describe)('uploadFile', () => {
        (0, vitest_1.it)('should upload file successfully with default options', async () => {
            const mockBlob = {
                url: 'https://example.com/file.txt',
                pathname: 'file.txt',
                contentType: 'text/plain',
                contentDisposition: 'inline'
            };
            const { put } = require('@vercel/blob');
            put.mockResolvedValue(mockBlob);
            const result = await blobStorage.uploadFile('test.txt', 'file content');
            (0, vitest_1.expect)(result).toEqual(mockBlob);
            (0, vitest_1.expect)(put).toHaveBeenCalledWith('test.txt', 'file content', {
                addRandomSuffix: true,
                access: 'public'
            });
        });
        (0, vitest_1.it)('should upload file with custom options', async () => {
            const mockBlob = {
                url: 'https://example.com/data.json',
                pathname: 'data.json',
                contentType: 'application/json',
                contentDisposition: 'attachment'
            };
            const { put } = require('@vercel/blob');
            put.mockResolvedValue(mockBlob);
            const result = await blobStorage.uploadFile('data.json', '{"key": "value"}', {
                contentType: 'application/json',
                cacheControlMaxAge: 3600,
                addRandomSuffix: false,
                access: 'private'
            });
            (0, vitest_1.expect)(result).toEqual(mockBlob);
            (0, vitest_1.expect)(put).toHaveBeenCalledWith('data.json', '{"key": "value"}', {
                contentType: 'application/json',
                cacheControlMaxAge: 3600,
                addRandomSuffix: false,
                access: 'private'
            });
        });
        (0, vitest_1.it)('should handle upload errors gracefully', async () => {
            const { put } = require('@vercel/blob');
            put.mockRejectedValue(new Error('Upload failed'));
            await (0, vitest_1.expect)(blobStorage.uploadFile('test.txt', 'content'))
                .rejects.toThrow('Upload failed');
        });
        (0, vitest_1.it)('should upload Buffer data', async () => {
            const mockBlob = {
                url: 'https://example.com/buffer.bin',
                pathname: 'buffer.bin',
                contentType: 'application/octet-stream'
            };
            const { put } = require('@vercel/blob');
            put.mockResolvedValue(mockBlob);
            const buffer = Buffer.from('binary content');
            const result = await blobStorage.uploadFile('buffer.bin', buffer);
            (0, vitest_1.expect)(result).toEqual(mockBlob);
            (0, vitest_1.expect)(put).toHaveBeenCalledWith('buffer.bin', buffer, {
                addRandomSuffix: true,
                access: 'public'
            });
        });
    });
    (0, vitest_1.describe)('downloadFile', () => {
        (0, vitest_1.it)('should download file successfully', async () => {
            const fileContent = 'downloaded content';
            const buffer = Buffer.from(fileContent);
            // Mock global fetch
            global.fetch = vitest_2.vi.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(buffer.buffer)
            });
            const result = await blobStorage.downloadFile('https://example.com/file.txt');
            (0, vitest_1.expect)(result).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(result.toString()).toBe(fileContent);
            (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith('https://example.com/file.txt');
        });
        (0, vitest_1.it)('should handle download HTTP errors', async () => {
            // Mock global fetch with error response
            global.fetch = vitest_2.vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
            await (0, vitest_1.expect)(blobStorage.downloadFile('https://example.com/nonexistent.txt'))
                .rejects.toThrow('Failed to download file: 404 Not Found');
        });
        (0, vitest_1.it)('should handle network errors', async () => {
            global.fetch = vitest_2.vi.fn().mockRejectedValue(new Error('Network error'));
            await (0, vitest_1.expect)(blobStorage.downloadFile('https://example.com/file.txt'))
                .rejects.toThrow('Network error');
        });
    });
    (0, vitest_1.describe)('deleteFile', () => {
        (0, vitest_1.it)('should delete file successfully', async () => {
            const { del } = require('@vercel/blob');
            del.mockResolvedValue(undefined);
            await (0, vitest_1.expect)(blobStorage.deleteFile('https://example.com/file.txt'))
                .resolves.not.toThrow();
            (0, vitest_1.expect)(del).toHaveBeenCalledWith('https://example.com/file.txt');
        });
        (0, vitest_1.it)('should handle delete errors gracefully', async () => {
            const { del } = require('@vercel/blob');
            del.mockRejectedValue(new Error('Delete failed'));
            await (0, vitest_1.expect)(blobStorage.deleteFile('https://example.com/file.txt'))
                .rejects.toThrow('Delete failed');
        });
    });
    (0, vitest_1.describe)('listFiles', () => {
        (0, vitest_1.it)('should list files successfully', async () => {
            const mockBlobs = [
                {
                    url: 'https://example.com/file1.txt',
                    pathname: 'file1.txt',
                    contentType: 'text/plain',
                    contentDisposition: 'inline'
                },
                {
                    url: 'https://example.com/file2.jpg',
                    pathname: 'file2.jpg',
                    contentType: 'image/jpeg',
                    contentDisposition: 'inline'
                }
            ];
            const { list } = require('@vercel/blob');
            list.mockResolvedValue({ blobs: mockBlobs });
            const result = await blobStorage.listFiles();
            (0, vitest_1.expect)(result).toEqual(mockBlobs);
            (0, vitest_1.expect)(list).toHaveBeenCalledWith({});
        });
        (0, vitest_1.it)('should list files with options', async () => {
            const mockBlobs = [
                {
                    url: 'https://example.com/docs/readme.md',
                    pathname: 'docs/readme.md',
                    contentType: 'text/markdown'
                }
            ];
            const { list } = require('@vercel/blob');
            list.mockResolvedValue({ blobs: mockBlobs });
            const result = await blobStorage.listFiles({
                prefix: 'docs/',
                limit: 10,
                cursor: 'some-cursor'
            });
            (0, vitest_1.expect)(result).toEqual(mockBlobs);
            (0, vitest_1.expect)(list).toHaveBeenCalledWith({
                prefix: 'docs/',
                limit: 10,
                cursor: 'some-cursor'
            });
        });
        (0, vitest_1.it)('should handle list errors gracefully', async () => {
            const { list } = require('@vercel/blob');
            list.mockRejectedValue(new Error('List failed'));
            await (0, vitest_1.expect)(blobStorage.listFiles())
                .rejects.toThrow('List failed');
        });
    });
    (0, vitest_1.describe)('getFileMetadata', () => {
        (0, vitest_1.it)('should get file metadata successfully', async () => {
            const mockMetadata = {
                url: 'https://example.com/file.txt',
                pathname: 'file.txt',
                contentType: 'text/plain',
                contentDisposition: 'inline',
                size: 1024,
                uploadedAt: new Date()
            };
            const { head } = require('@vercel/blob');
            head.mockResolvedValue(mockMetadata);
            const result = await blobStorage.getFileMetadata('https://example.com/file.txt');
            (0, vitest_1.expect)(result).toEqual(mockMetadata);
            (0, vitest_1.expect)(head).toHaveBeenCalledWith('https://example.com/file.txt');
        });
        (0, vitest_1.it)('should handle metadata retrieval errors', async () => {
            const { head } = require('@vercel/blob');
            head.mockRejectedValue(new Error('Metadata retrieval failed'));
            await (0, vitest_1.expect)(blobStorage.getFileMetadata('https://example.com/file.txt'))
                .rejects.toThrow('Metadata retrieval failed');
        });
    });
});
//# sourceMappingURL=blob.storage.test.js.map