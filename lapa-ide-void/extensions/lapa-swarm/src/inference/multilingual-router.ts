/**
 * Multilingual Router
 * 
 * Routes tasks to appropriate models based on language detection.
 */

import { AyaModel } from './models/aya.ts';
import { CommandRModel } from './models/command-r.ts';
import { detectCodebaseLanguages, LanguageDetectionResult } from './multilingual-detector.ts';
import { InferenceManager } from './manager.ts';
import { MoERouter } from '../agents/moe-router.ts';

export interface MultilingualRoutingOptions {
  preferLocal?: boolean;
  useCommandRForLongContext?: boolean;
  ayaApiKey?: string;
  commandRApiKey?: string;
  maxContextLength?: number;
}

/**
 * Routes task to appropriate model based on language
 */
export async function routeToMultilingualModel(
  task: {
    description: string;
    context?: string;
    filePaths?: string[];
  },
  options: MultilingualRoutingOptions = {}
): Promise<{
  model: 'aya' | 'command-r' | 'ollama' | 'nim';
  reason: string;
  detectedLanguages: LanguageDetectionResult;
}> {
  const {
    preferLocal = true,
    useCommandRForLongContext = true,
    maxContextLength = 32000
  } = options;

  // Detect languages in codebase
  let detectedLanguages: LanguageDetectionResult;
  
  if (task.filePaths && task.filePaths.length > 0) {
    detectedLanguages = await detectCodebaseLanguages(task.filePaths, {
      useLLM: false // Use heuristic for speed
    });
  } else {
    // Fallback: single language assumed
    detectedLanguages = {
      primaryLanguage: 'unknown',
      languages: [],
      codebase: 'single-language'
    };
  }

  // Determine if multilingual
  const isMultilingual = detectedLanguages.codebase === 'multilingual';
  const contextLength = (task.context?.length || 0) + (task.description?.length || 0);

  // Routing logic
  if (isMultilingual) {
    // Multilingual codebase - prefer Aya or Command-R
    if (useCommandRForLongContext && contextLength > maxContextLength) {
      // Long context needed - use Command-R
      if (options.commandRApiKey) {
        return {
          model: 'command-r',
          reason: 'Multilingual codebase with long context - Command-R optimized for long-context multilingual understanding',
          detectedLanguages
        };
      }
    }

    // Use Aya for multilingual tasks
    if (options.ayaApiKey) {
      return {
        model: 'aya',
        reason: 'Multilingual codebase detected - Aya optimized for multilingual code understanding',
        detectedLanguages
      };
    }

    // Fallback to local if API keys not available
    return {
      model: preferLocal ? 'ollama' : 'nim',
      reason: 'Multilingual codebase detected but Aya/Command-R not configured - using local model',
      detectedLanguages
    };
  }

  // Single language codebase
  if (useCommandRForLongContext && contextLength > maxContextLength) {
    // Long context needed
    if (options.commandRApiKey) {
      return {
        model: 'command-r',
        reason: 'Long context codebase analysis - Command-R optimized for long-context understanding',
        detectedLanguages
      };
    }
  }

  // Default: use local model
  return {
    model: preferLocal ? 'ollama' : 'nim',
    reason: 'Single language codebase - using local model',
    detectedLanguages
  };
}

/**
 * Integrates multilingual routing with MoE Router
 */
export function integrateMultilingualRouting(
  moeRouter: MoERouter,
  options: {
    ayaApiKey?: string;
    commandRApiKey?: string;
  }
): void {
  // In production, would extend MoE Router to consider language in routing
  // For now, this is a placeholder for integration
  console.log('[MultilingualRouter] Integration with MoE Router configured');
}

