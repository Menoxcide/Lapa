/**
 * Shared Types for Document Skills
 */

export interface DocumentOperation {
  type: 'read' | 'write' | 'extract' | 'convert' | 'modify';
  filePath?: string;
  content?: unknown;
  options?: Record<string, unknown>;
}

export interface DocumentResult {
  success: boolean;
  data?: unknown;
  filePath?: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    size?: number;
    format?: string;
  };
  error?: string;
}

export interface TextExtractionResult extends DocumentResult {
  text: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    characterCount?: number;
  };
}

export interface DocumentGenerationOptions {
  template?: string;
  data?: Record<string, unknown>;
  format?: 'docx' | 'pdf' | 'pptx' | 'xlsx';
  styles?: Record<string, unknown>;
}

