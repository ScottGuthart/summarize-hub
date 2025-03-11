import { CreateWebWorkerMLCEngine, InitProgressReport, prebuiltAppConfig } from '@mlc-ai/web-llm';

let chat: any | null = null;
let isInitializing = false;

export type LoadingStatus = {
    state: 'loading' | 'ready' | 'error';
    message: string;
    progress?: number;
};

export type SummarizationCallbacks = {
    onLoadingUpdate: (status: LoadingStatus) => void;
    onSummarizationProgress: (current: number, total: number) => void;
};

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

        const worker = new Worker(
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
        onLoadingUpdate?.({
            state: 'error',
            message: error instanceof Error ? error.message : 'Failed to initialize LLM',
        });
        throw error;
    } finally {
        isInitializing = false;
    }
}

export async function summarizeArticle(
    content: string,
    callbacks?: SummarizationCallbacks
): Promise<{ summary: string; tags: string }> {
    try {
        const llm = await initializeLLM(callbacks?.onLoadingUpdate);

        // Generate summary
        callbacks?.onSummarizationProgress(1, 4);
        const summaryPrompt = `Summarize this text in 2 sentences. Respond with ONLY the summary, no introductory phrases:\n\n${content}`;
        callbacks?.onSummarizationProgress(2, 4);
        const summaryResponse = await llm.chat.completions.create({
            messages: [{ role: "user", content: summaryPrompt }],
            temperature: 0.1, // Lower temperature for more focused responses
            max_tokens: 150 // Limit response length
        });
        const summary = summaryResponse.choices[0].message.content.trim();

        // Generate tags
        callbacks?.onSummarizationProgress(3, 4);
        const tagsPrompt = `Extract 3-5 key topics as comma-separated tags. Respond with ONLY the tags, no introductory phrases:\n\n${content}`;
        callbacks?.onSummarizationProgress(4, 4);
        const tagsResponse = await llm.chat.completions.create({
            messages: [{ role: "user", content: tagsPrompt }],
            temperature: 0.1,
            max_tokens: 50
        });
        const tags = tagsResponse.choices[0].message.content.trim();

        return { summary, tags };
    } catch (error) {
        console.error('Error summarizing article:', error);
        callbacks?.onLoadingUpdate?.({
            state: 'error',
            message: 'Failed to generate summary and tags'
        });
        throw new Error('Failed to generate summary and tags');
    }
} 