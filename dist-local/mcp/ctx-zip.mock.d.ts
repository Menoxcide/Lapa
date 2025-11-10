/**
 * Mock implementation of ctx-zip for LAPA
 *
 * This is a mock implementation to allow compilation and testing
 * since the actual ctx-zip package doesn't have the expected API.
 */
export type Buffer = any;
export declare function compress(context: string): Promise<Buffer>;
export declare function decompress(compressedContext: Buffer): Promise<string>;
