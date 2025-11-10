import { VercelBlobStorage } from '../../src/premium/blob.storage';
// Mock the @vercel/blob module
jest.mock('@vercel/blob', () => ({
    put: jest.fn(),
    del: jest.fn(),
    list: jest.fn(),
    head: jest.fn()
}));
describe('VercelBlobStorage', () => {
    let blobStorage;
    const mockToken = 'test-token-123';
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        // Set environment variable for token
        process.env.BLOB_READ_WRITE_TOKEN = mockToken;
        blobStorage = new VercelBlobStorage();
    });
    afterEach(() => {
        // Clean up environment variable
        delete process.env.BLOB_READ_WRITE_TOKEN;
    });
    describe('constructor', () => {
        it('should initialize with environment variable token', () => {
            expect(blobStorage).toBeDefined();
        });
        it('should initialize with provided token', () => {
            const customStorage = new VercelBlobStorage('custom-token');
            expect(customStorage).toBeDefined();
        });
        it('should throw error when no token is available', () => {
            // Remove environment variable
            delete process.env.BLOB_READ_WRITE_TOKEN;
            expect(() => new VercelBlobStorage()).toThrow('Vercel Blob read/write token is required');
        });
    });
    describe('uploadFile', () => {
        it('should upload file successfully with default options', async () => {
            const mockBlob = {
                url: 'https://example.com/file.txt',
                pathname: 'file.txt',
                contentType: 'text/plain',
                contentDisposition: 'inline'
            };
            const { put } = require('@vercel/blob');
            put.mockResolvedValue(mockBlob);
            const result = await blobStorage.uploadFile('test.txt', 'file content');
            expect(result).toEqual(mockBlob);
            expect(put).toHaveBeenCalledWith('test.txt', 'file content', {
                addRandomSuffix: true,
                access: 'public'
            });
        });
        it('should upload file with custom options', async () => {
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
            expect(result).toEqual(mockBlob);
            expect(put).toHaveBeenCalledWith('data.json', '{"key": "value"}', {
                contentType: 'application/json',
                cacheControlMaxAge: 3600,
                addRandomSuffix: false,
                access: 'private'
            });
        });
        it('should handle upload errors gracefully', async () => {
            const { put } = require('@vercel/blob');
            put.mockRejectedValue(new Error('Upload failed'));
            await expect(blobStorage.uploadFile('test.txt', 'content'))
                .rejects.toThrow('Upload failed');
        });
        it('should upload Buffer data', async () => {
            const mockBlob = {
                url: 'https://example.com/buffer.bin',
                pathname: 'buffer.bin',
                contentType: 'application/octet-stream'
            };
            const { put } = require('@vercel/blob');
            put.mockResolvedValue(mockBlob);
            const buffer = Buffer.from('binary content');
            const result = await blobStorage.uploadFile('buffer.bin', buffer);
            expect(result).toEqual(mockBlob);
            expect(put).toHaveBeenCalledWith('buffer.bin', buffer, {
                addRandomSuffix: true,
                access: 'public'
            });
        });
    });
    describe('downloadFile', () => {
        it('should download file successfully', async () => {
            const fileContent = 'downloaded content';
            const buffer = Buffer.from(fileContent);
            // Mock global fetch
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(buffer.buffer)
            });
            const result = await blobStorage.downloadFile('https://example.com/file.txt');
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toBe(fileContent);
            expect(global.fetch).toHaveBeenCalledWith('https://example.com/file.txt');
        });
        it('should handle download HTTP errors', async () => {
            // Mock global fetch with error response
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
            await expect(blobStorage.downloadFile('https://example.com/nonexistent.txt'))
                .rejects.toThrow('Failed to download file: 404 Not Found');
        });
        it('should handle network errors', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
            await expect(blobStorage.downloadFile('https://example.com/file.txt'))
                .rejects.toThrow('Network error');
        });
    });
    describe('deleteFile', () => {
        it('should delete file successfully', async () => {
            const { del } = require('@vercel/blob');
            del.mockResolvedValue(undefined);
            await expect(blobStorage.deleteFile('https://example.com/file.txt'))
                .resolves.not.toThrow();
            expect(del).toHaveBeenCalledWith('https://example.com/file.txt');
        });
        it('should handle delete errors gracefully', async () => {
            const { del } = require('@vercel/blob');
            del.mockRejectedValue(new Error('Delete failed'));
            await expect(blobStorage.deleteFile('https://example.com/file.txt'))
                .rejects.toThrow('Delete failed');
        });
    });
    describe('listFiles', () => {
        it('should list files successfully', async () => {
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
            expect(result).toEqual(mockBlobs);
            expect(list).toHaveBeenCalledWith({});
        });
        it('should list files with options', async () => {
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
                after: 'some-cursor'
            });
            expect(result).toEqual(mockBlobs);
            expect(list).toHaveBeenCalledWith({
                prefix: 'docs/',
                limit: 10,
                after: 'some-cursor'
            });
        });
        it('should handle list errors gracefully', async () => {
            const { list } = require('@vercel/blob');
            list.mockRejectedValue(new Error('List failed'));
            await expect(blobStorage.listFiles())
                .rejects.toThrow('List failed');
        });
    });
    describe('getFileMetadata', () => {
        it('should get file metadata successfully', async () => {
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
            expect(result).toEqual(mockMetadata);
            expect(head).toHaveBeenCalledWith('https://example.com/file.txt');
        });
        it('should handle metadata retrieval errors', async () => {
            const { head } = require('@vercel/blob');
            head.mockRejectedValue(new Error('Metadata retrieval failed'));
            await expect(blobStorage.getFileMetadata('https://example.com/file.txt'))
                .rejects.toThrow('Metadata retrieval failed');
        });
    });
});
//# sourceMappingURL=blob.storage.test.js.map