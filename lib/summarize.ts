/**
 * This module provides article summarization functionality using the Gemma 2B-IT language model.
 * The summarization process runs entirely in the browser using Web Workers for better performance.
 */

import { CreateWebWorkerMLCEngine, InitProgressReport, prebuiltAppConfig } from '@mlc-ai/web-llm';

// Global state management for the LLM instance
let chat: any | null = null;
let isInitializing = false;
let worker: Worker | null = null;

/**
 * Represents the current loading state of the language model
 * @property state - Current state of the model: 'loading', 'ready', or 'error'
 * @property message - User-friendly status message
 * @property progress - Optional loading progress (0-100)
 */
export type LoadingStatus = {
    state: 'loading' | 'ready' | 'error';
    message: string;
    progress?: number;
};

/**
 * Callback functions for monitoring the summarization process
 * @property onLoadingUpdate - Called when the model's loading status changes
 * @property onSummarizationProgress - Called to report progress during summarization
 */
export type SummarizationCallbacks = {
    onLoadingUpdate: (status: LoadingStatus) => void;
    onSummarizationProgress: (current: number, total: number) => void;
};

/**
 * Splits long text into smaller chunks for processing while preserving sentence boundaries.
 * This prevents the model from exceeding its context window and ensures natural text breaks.
 * 
 * @param text - The input text to be chunked
 * @param maxChunkSize - Maximum size of each chunk (default: 10,000 characters)
 * @returns Array of text chunks
 */
function chunkText(text: string, maxChunkSize: number = 10_000): string[] {
    // If text is short enough, return it as a single chunk
    if (text.length <= maxChunkSize) {
        return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= maxChunkSize) {
            currentChunk += sentence;
        } else {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Initializes the language model for summarization.
 * - Handles first-time model downloads (~1.2GB)
 * - Manages Web Worker lifecycle
 * - Implements caching for faster subsequent loads
 * - Provides progress updates during initialization
 * 
 * @param onLoadingUpdate - Optional callback for loading status updates
 * @returns Initialized LLM instance
 */
export async function initializeLLM(onLoadingUpdate?: (status: LoadingStatus) => void): Promise<any> {
    if (chat) return chat;
    if (isInitializing) {
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return chat;
    }

    try {
        isInitializing = true;

        // Use localStorage as a fallback for tracking first-time loads
        let isModelCached = localStorage.getItem('modelLoadAttempted') === 'true';
        console.log('Initial model cache state:', { isModelCached });

        const firstTimeMessage = 'Loading AI model (first time setup - downloading ~1.2GB, this may take a few minutes)';
        const regularMessage = 'Loading AI model';
        const currentMessage = isModelCached ? regularMessage : firstTimeMessage;

        onLoadingUpdate?.({
            state: 'loading',
            message: currentMessage,
            progress: 0
        });

        // Cleanup any existing worker
        if (worker) {
            worker.terminate();
            worker = null;
            chat = null;
        }

        // Create new worker
        worker = new Worker(
            new URL('./worker.ts', import.meta.url),
            { type: 'module' }
        );

        const progressCallback = (report: InitProgressReport) => {
            const progress = report.progress * 100;
            const progressMessage = isModelCached
                ? `${regularMessage} (${Math.round(progress)}%)`
                : `${firstTimeMessage} - ${Math.round(progress)}%`;

            console.log('Progress update:', {
                isModelCached,
                reportText: report.text,
                progress,
                message: progressMessage
            });

            onLoadingUpdate?.({
                state: 'loading',
                message: progressMessage,
                progress
            });
        };

        chat = await CreateWebWorkerMLCEngine(
            worker,
            "gemma-2-2b-it-q4f16_1-MLC",
            {
                initProgressCallback: progressCallback,
                logLevel: "INFO",
                appConfig: prebuiltAppConfig
            }
        );

        // Mark that we've attempted to load the model
        localStorage.setItem('modelLoadAttempted', 'true');

        console.log('Model initialization complete:', { isModelCached });
        onLoadingUpdate?.({
            state: 'ready',
            message: 'Model loaded successfully',
            progress: 100
        });

        return chat;
    } catch (error) {
        console.error('Error initializing LLM:', error);
        // Cleanup on error
        if (worker) {
            worker.terminate();
            worker = null;
            chat = null;
        }
        // Clear the model load flag if there was an error
        localStorage.removeItem('modelLoadAttempted');
        onLoadingUpdate?.({
            state: 'error',
            message: error instanceof Error ? error.message : 'Failed to initialize LLM',
        });
        throw error;
    } finally {
        isInitializing = false;
    }
}

/**
 * Cleans up resources by terminating the Web Worker and resetting state.
 * Should be called when summarization is complete or on error.
 */
export async function cleanup() {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    chat = null;
    isInitializing = false;
}

/**
 * Main function for article summarization. Processes articles in chunks if needed,
 * generates summaries and relevant tags using the language model.
 * 
 * Features:
 * - Handles articles up to 30,000 characters
 * - Splits long articles into chunks while preserving context
 * - Combines chunk summaries for coherent final output
 * - Generates relevant tags based on the content
 * - Provides progress updates during processing
 * 
 * @param content - The article text to summarize
 * @param callbacks - Optional callbacks for progress monitoring
 * @returns Object containing the summary and generated tags
 */
export async function summarizeArticle(
    content: string,
    callbacks?: SummarizationCallbacks
): Promise<{ summary: string; tags: string }> {
    try {
        // Check article length
        const MAX_ARTICLE_LENGTH = 30_000;
        if (content.length > MAX_ARTICLE_LENGTH) {
            const message = `Article is too long (${content.length} characters). Maximum allowed length is ${MAX_ARTICLE_LENGTH} characters.`;
            console.log('Article length validation:', message);
            callbacks?.onLoadingUpdate?.({
                state: 'error',
                message
            });
            return {
                summary: "Error: " + message,
                tags: "Error: Article too long"
            };
        }

        const llm = await initializeLLM(callbacks?.onLoadingUpdate);

        // Split content into chunks if it's too long
        const chunks = chunkText(content);
        if (chunks.length > 1) {
            console.log(`Article needed chunking: Split into ${chunks.length} chunks (total length: ${content.length} characters)`);
            console.log('First 100 chars of article:', content.slice(0, 100) + '...');
        }
        const summaries: string[] = [];

        // Generate summary for each chunk
        for (let i = 0; i < chunks.length; i++) {
            callbacks?.onSummarizationProgress(i + 1, chunks.length * 2);
            const chunkPrompt = `Summarize this text in 1-2 sentences. Respond with ONLY the summary, no introductory phrases:\n\n${chunks[i]}`;
            try {
                const chunkResponse = await llm.chat.completions.create({
                    messages: [{ role: "user", content: chunkPrompt }],
                    temperature: 0.1,
                    max_tokens: 150
                });
                summaries.push(chunkResponse.choices[0].message.content.trim());
            } catch (error: any) {
                if (error.message?.includes('ContextWindowSizeExceededError')) {
                    const message = 'Article is too long for processing. Please try with a shorter article.';
                    console.log('Context window exceeded:', message);
                    callbacks?.onLoadingUpdate?.({
                        state: 'error',
                        message
                    });
                    return {
                        summary: "Error: " + message,
                        tags: "Error: Context window exceeded"
                    };
                }
                throw error; // Re-throw other errors
            }
        }

        // If we have multiple summaries, combine them
        let finalSummary = '';
        if (summaries.length > 1) {
            const combinedSummary = summaries.join(' ');
            const finalPrompt = `Combine these summaries into a coherent 2-sentence summary. Respond with ONLY the summary:\n\n${combinedSummary}`;
            const finalResponse = await llm.chat.completions.create({
                messages: [{ role: "user", content: finalPrompt }],
                temperature: 0.1,
                max_tokens: 150
            });
            finalSummary = finalResponse.choices[0].message.content.trim();
        } else {
            finalSummary = summaries[0];
        }

        // Generate tags from the final summary for consistency
        callbacks?.onSummarizationProgress(chunks.length * 2, chunks.length * 2);
        const tagsPrompt = `Extract 3-5 key topics as comma-separated tags from this summary. Respond with ONLY the tags:\n\n${finalSummary}`;
        const tagsResponse = await llm.chat.completions.create({
            messages: [{ role: "user", content: tagsPrompt }],
            temperature: 0.1,
            max_tokens: 50
        });
        const tags = tagsResponse.choices[0].message.content.trim();

        return { summary: finalSummary, tags };
    } catch (error: any) {
        // Only log as error if it's not a validation error
        if (!error.message?.includes('Article is too long') && !error.message?.includes('Context window exceeded')) {
            console.error('Error summarizing article:', error);
        }
        // Cleanup on error to ensure fresh state
        await cleanup();
        callbacks?.onLoadingUpdate?.({
            state: 'error',
            message: error.message || 'Failed to generate summary and tags'
        });
        throw error;
    }
} 