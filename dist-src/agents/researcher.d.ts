/**
 * Researcher Agent for LAPA
 *
 * This module implements the Researcher agent with AI-Q search capabilities.
 * It supports both traditional text-based search and multimodal search using Nemotron-Vision.
 */
export interface ResearchResult {
    query: string;
    result: string;
    multimodal: boolean;
    timestamp: Date;
}
export interface ResearcherConfig {
    defaultModel: string;
    multimodalModel: string;
}
/**
 * Researcher Agent Class
 *
 * Implements research capabilities using NVIDIA AI-Q and Nemotron-Vision.
 */
export declare class Researcher {
    private config;
    constructor(config?: Partial<ResearcherConfig>);
    /**
     * Performs AI-Q search using either text-based or multimodal approaches
     * @param query Search query
     * @param multimodal Whether to use multimodal search (default: false)
     * @returns Research result
     */
    aiQSearch(query: string, multimodal?: boolean): Promise<ResearchResult>;
    /**
     * Performs text-based search using NVIDIA NIM
     * @param query Search query
     * @returns Search result
     */
    private performTextSearch;
    /**
     * Performs multimodal search using Nemotron-Vision
     * @param query Search query
     * @returns Search result
     */
    private performMultimodalSearch;
}
