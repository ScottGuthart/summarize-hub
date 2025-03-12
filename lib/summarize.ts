import { CreateWebWorkerMLCEngine, InitProgressReport, prebuiltAppConfig } from '@mlc-ai/web-llm';

let chat: any | null = null;
let isInitializing = false;
let worker: Worker | null = null;

export type LoadingStatus = {
    state: 'loading' | 'ready' | 'error';
    message: string;
    progress?: number;
};

export type SummarizationCallbacks = {
    onLoadingUpdate: (status: LoadingStatus) => void;
    onSummarizationProgress: (current: number, total: number) => void;
};

// Function to chunk text into smaller pieces
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
        onLoadingUpdate?.({
            state: 'loading',
            message: 'Initializing LLM engine...',
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
            console.log(`Loading model: ${report.text} (${progress}%)`);
            onLoadingUpdate?.({
                state: 'loading',
                message: report.text,
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
        onLoadingUpdate?.({
            state: 'error',
            message: error instanceof Error ? error.message : 'Failed to initialize LLM',
        });
        throw error;
    } finally {
        isInitializing = false;
    }
}

export async function cleanup() {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    chat = null;
    isInitializing = false;
}

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