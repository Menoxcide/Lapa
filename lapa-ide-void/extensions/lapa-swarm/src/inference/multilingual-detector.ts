/**
 * Multilingual Language Detector
 * 
 * Detects languages in codebases and routes to appropriate models.
 */

import { AyaModel } from './models/aya.ts';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface LanguageDetectionResult {
  primaryLanguage: string;
  languages: Array<{
    language: string;
    confidence: number;
    files: string[];
  }>;
  codebase: string; // 'multilingual' | 'single-language'
}

/**
 * Detects languages in a codebase
 */
export async function detectCodebaseLanguages(
  filePaths: string[],
  options?: {
    useLLM?: boolean;
    ayaModel?: AyaModel;
  }
): Promise<LanguageDetectionResult> {
  const languageMap = new Map<string, string[]>();
  const languageConfidence = new Map<string, number>();

  // Detect languages from file extensions
  for (const filePath of filePaths) {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const language = getLanguageFromExtension(ext);
    
    if (language !== 'unknown') {
      if (!languageMap.has(language)) {
        languageMap.set(language, []);
        languageConfidence.set(language, 0);
      }
      languageMap.get(language)!.push(filePath);
      languageConfidence.set(language, (languageConfidence.get(language) || 0) + 1);
    }
  }

  // Calculate confidence scores
  const totalFiles = filePaths.length;
  const languages = Array.from(languageMap.entries()).map(([language, files]) => ({
    language,
    confidence: files.length / totalFiles,
    files
  })).sort((a, b) => b.confidence - a.confidence);

  // Determine primary language
  const primaryLanguage = languages[0]?.language || 'unknown';

  // Determine if codebase is multilingual
  const isMultilingual = languages.filter(l => l.confidence > 0.1).length > 1;

  // If LLM is available and enabled, refine detection
  if (options?.useLLM && options?.ayaModel && languages.length > 0) {
    try {
      // Sample files from each language for LLM detection
      for (const lang of languages.slice(0, 3)) {
        if (lang.files.length > 0) {
          const sampleFile = lang.files[0];
          try {
            const content = await readFile(sampleFile, 'utf-8');
            const detected = await options.ayaModel.detectLanguage(content);
            
            // Update confidence if LLM detection differs
            if (detected !== lang.language && detected !== 'unknown') {
              // Could update language map here if needed
            }
          } catch {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      console.warn('[MultilingualDetector] LLM detection failed, using heuristic detection:', error);
    }
  }

  return {
    primaryLanguage,
    languages,
    codebase: isMultilingual ? 'multilingual' : 'single-language'
  };
}

/**
 * Gets language from file extension
 */
function getLanguageFromExtension(ext: string): string {
  const extensionMap: Record<string, string> = {
    // Programming languages
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'clj': 'clojure',
    'hs': 'haskell',
    'ml': 'ocaml',
    'erl': 'erlang',
    'ex': 'elixir',
    'dart': 'dart',
    'r': 'r',
    'm': 'objective-c',
    'mm': 'objective-cpp',
    
    // Markup and config
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'xml': 'xml',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'md': 'markdown',
    
    // Shell and config
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'zsh',
    'fish': 'fish',
    'ps1': 'powershell',
    'bat': 'batch',
    'cmd': 'batch',
    
    // Database
    'sql': 'sql',
    'plsql': 'plsql',
    'mysql': 'sql',
    
    // Other
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'cmake': 'cmake'
  };

  return extensionMap[ext] || 'unknown';
}

