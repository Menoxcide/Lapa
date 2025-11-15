/**
 * FAQ Generator
 * 
 * Specialized FAQ generation from agent communications using LLM when available.
 */

import { Communication } from './report-generator.ts';

export interface FAQGenerationOptions {
  minOccurrences?: number;
  useLLM?: boolean;
  llmModel?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  occurrences: number;
  agents: string[];
  lastAsked: Date;
}

/**
 * Generates FAQ items from communications using pattern matching or LLM
 */
export async function generateFAQItems(
  communications: Communication[],
  options: FAQGenerationOptions = {}
): Promise<FAQItem[]> {
  const minOccurrences = options.minOccurrences || 2;
  const useLLM = options.useLLM ?? false;

  // Extract potential Q&A pairs
  const qaPairs = new Map<string, {
    question: string;
    answers: Array<{ answer: string; agent?: string; timestamp: Date }>;
    lastAsked: Date;
  }>();

  // Pattern matching for questions
  for (let i = 0; i < communications.length - 1; i++) {
    const comm1 = communications[i];
    const comm2 = communications[i + 1];

    // Simple heuristics: questions often end with '?' or contain question words
    if (comm1.content.includes('?') || /^(what|how|why|when|where|who|which|can|could|should|will|would)/i.test(comm1.content.trim())) {
      const questionKey = comm1.content.trim().toLowerCase();
      
      if (!qaPairs.has(questionKey)) {
        qaPairs.set(questionKey, {
          question: comm1.content,
          answers: [],
          lastAsked: comm1.timestamp
        });
      }

      const pair = qaPairs.get(questionKey)!;
      pair.answers.push({
        answer: comm2.content,
        agent: comm2.agent,
        timestamp: comm2.timestamp
      });

      if (comm1.timestamp > pair.lastAsked) {
        pair.lastAsked = comm1.timestamp;
      }
    }
  }

  // Filter by minimum occurrences and convert to FAQ items
  const faqItems: FAQItem[] = [];

  for (const [key, pair] of qaPairs.entries()) {
    if (pair.answers.length >= minOccurrences) {
      // Group similar answers
      const uniqueAnswers = new Map<string, Array<{ agent?: string; timestamp: Date }>>();
      
      for (const answer of pair.answers) {
        const answerKey = answer.answer.trim().toLowerCase().substring(0, 100);
        if (!uniqueAnswers.has(answerKey)) {
          uniqueAnswers.set(answerKey, []);
        }
        uniqueAnswers.get(answerKey)!.push({
          agent: answer.agent,
          timestamp: answer.timestamp
        });
      }

      // Use most common answer
      let bestAnswer = pair.answers[0].answer;
      let maxOccurrences = 0;

      for (const [answerKey, occurrences] of uniqueAnswers.entries()) {
        if (occurrences.length > maxOccurrences) {
          maxOccurrences = occurrences.length;
          const firstOccurrence = pair.answers.find(a =>
            a.answer.trim().toLowerCase().substring(0, 100) === answerKey
          );
          if (firstOccurrence) {
            bestAnswer = firstOccurrence.answer;
          }
        }
      }

      const agents = Array.from(new Set(pair.answers.map(a => a.agent).filter(Boolean))) as string[];

      faqItems.push({
        question: pair.question,
        answer: bestAnswer,
        occurrences: pair.answers.length,
        agents,
        lastAsked: pair.lastAsked
      });
    }
  }

  // Sort by occurrences (most common first)
  faqItems.sort((a, b) => b.occurrences - a.occurrences);

  // If LLM is enabled, refine FAQ using LLM
  if (useLLM && faqItems.length > 0) {
    // In production, would call LLM to refine questions and answers
    // For now, return as-is
  }

  return faqItems;
}

