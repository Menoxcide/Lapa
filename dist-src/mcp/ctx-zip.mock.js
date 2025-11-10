/**
 * Mock implementation of ctx-zip for LAPA
 *
 * This is a mock implementation to allow compilation and testing
 * since the actual ctx-zip package doesn't have the expected API.
 */
// Mock compress function
export async function compress(context) {
    // Simple mock implementation that just converts string to buffer
    // In a real implementation, this would do actual compression
    return Promise.resolve(context);
}
// Mock decompress function
export async function decompress(compressedContext) {
    // Simple mock implementation that just converts buffer to string
    // In a real implementation, this would do actual decompression
    return Promise.resolve(compressedContext);
}
//# sourceMappingURL=ctx-zip.mock.js.map