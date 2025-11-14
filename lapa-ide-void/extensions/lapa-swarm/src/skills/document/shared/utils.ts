/**
 * Shared Utilities for Document Skills
 */

import { readFile, writeFile, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { tmpdir } from 'os';

/**
 * Validates file exists and returns metadata
 */
export async function validateFile(filePath: string): Promise<{
  exists: boolean;
  size: number;
  extension: string;
  name: string;
}> {
  try {
    const stats = await stat(filePath);
    return {
      exists: true,
      size: stats.size,
      extension: extname(filePath),
      name: basename(filePath)
    };
  } catch {
    return {
      exists: false,
      size: 0,
      extension: extname(filePath),
      name: basename(filePath)
    };
  }
}

/**
 * Gets temporary directory for document operations
 */
export function getTempDir(): string {
  return join(tmpdir(), 'lapa-documents');
}

/**
 * Generates a temporary file path
 */
export function getTempFilePath(extension: string): string {
  const tempDir = getTempDir();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return join(tempDir, `doc-${timestamp}-${random}${extension}`);
}

/**
 * Reads file buffer
 */
export async function readFileBuffer(filePath: string): Promise<Buffer> {
  return await readFile(filePath);
}

/**
 * Writes file buffer
 */
export async function writeFileBuffer(filePath: string, buffer: Buffer): Promise<void> {
  await writeFile(filePath, buffer);
}

/**
 * Calculates word count from text
 */
export function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculates character count
 */
export function calculateCharacterCount(text: string): number {
  return text.length;
}

