/**
 * ArticleGrid Component
 * 
 * A complex data grid component that handles article management, processing, and visualization.
 * Features include:
 * - File upload/download (XLSX/CSV support)
 * - Batch article processing
 * - Real-time progress tracking
 * - Export functionality
 * - Example data loading
 * - Cache management
 * 
 * Technical details:
 * - Uses canvas-datagrid for efficient data rendering
 * - Supports up to 250 articles per batch
 * - Maximum file size: 10MB
 * - Maximum article length: 30,000 characters
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TEMPLATE_COLUMNS, NUMERIC_COLUMNS } from '@/lib/constants';
import type { ArticleRow } from '@/lib/types';
import { StatusMessage } from './StatusMessage';
import * as XLSX from 'xlsx';
import { summarizeArticle, cleanup } from '@/lib/summarize';
import { EXAMPLE_ARTICLES } from '@/lib/example-data';
import {
    DocumentArrowDownIcon,
    DocumentPlusIcon,
    CommandLineIcon,
    TableCellsIcon,
    DocumentTextIcon,
    BeakerIcon
} from '@heroicons/react/24/outline';

// Type declaration for canvas-datagrid (TODO: Add proper types when available)
type CanvasDataGrid = any;

export function ArticleGrid() {
    // Refs for managing grid and container elements
    const gridRef = useRef<CanvasDataGrid>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);

    // State management for UI and processing
    const [status, setStatus] = useState<{ message: string; isError: boolean; persistent?: boolean } | null>(null);
    const [currentFileName, setCurrentFileName] = useState('articles');
    const [isGridInitialized, setIsGridInitialized] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isProcessed, setIsProcessed] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [isFirstVisit, setIsFirstVisit] = useState(true);
    const [hasData, setHasData] = useState(false);
    const [shouldHighlightProcess, setShouldHighlightProcess] = useState(false);

    /**
     * Check if this is the user's first visit and set up local storage
     */
    useEffect(() => {
        const hasVisited = localStorage.getItem('hasVisitedBefore');
        if (hasVisited) {
            setIsFirstVisit(false);
        } else {
            localStorage.setItem('hasVisitedBefore', 'true');
        }
    }, []);

    /**
     * Formats processing time into a human-readable string
     * @param milliseconds - Time elapsed in milliseconds
     * @returns Formatted time string (e.g., "2 minutes, 30 seconds")
     */
    const formatElapsedTime = (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        const parts = [];
        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);

        return parts.join(', ');
    };

    /**
     * Creates a template data structure for new article uploads
     * @returns An array with a single empty article row
     */
    const createTemplateData = useCallback((): ArticleRow[] => {
        return [{
            "Article Content": "",
            "Author Name": "",
            "Likes": 0,
            "Shares": 0,
            "Views": 0,
            "Summary": "Will be auto-generated",
            "Tags": "Will be auto-generated"
        }];
    }, []);

    /**
     * Displays status messages to the user
     * @param message - The message to display
     * @param isError - Whether this is an error message
     * @param persistent - Whether the message should persist
     */
    const showStatus = useCallback((message: string, isError = false, persistent = false) => {
        // Special handling for WebGPU error
        if (message.includes('WebGPU is not supported')) {
            const browserName = navigator.userAgent.includes('Chrome') ? 'Chrome' :
                navigator.userAgent.includes('Firefox') ? 'Firefox' :
                    'your browser';

            const chromeInstructions = `
• Open Chrome settings
• Search for "WebGPU"
• Enable "WebGPU" flag
• Restart Chrome`;

            const firefoxInstructions = `
• Open Firefox settings
• Search for "WebGPU"
• Set "dom.webgpu.enabled" to true
• Restart Firefox`;

            const instructions = browserName === 'Chrome' ? chromeInstructions :
                browserName === 'Firefox' ? firefoxInstructions :
                    'Please use Chrome or Firefox with WebGPU enabled.';

            setStatus({
                message: `⚠️ WebGPU Support Required

This application requires WebGPU, which is not currently enabled in ${browserName}.

To enable WebGPU:
${instructions}

Note: WebGPU is a new technology and may not be available in all browsers.`,
                isError: true,
                persistent: true
            });
            return;
        }

        setStatus({ message, isError, persistent });
    }, []);

    /**
     * Checks if the current data is just the template
     * @param data - The data to check
     * @returns True if the data matches the empty template
     */
    const isTemplateData = useCallback((data: ArticleRow[]) => {
        return data.length === 1 &&
            data[0]["Article Content"] === "" &&
            data[0]["Author Name"] === "";
    }, []);

    /**
     * Initializes the canvas-datagrid with the provided data
     * Handles grid setup, styling, and resize observers
     * @param data - The data to display in the grid
     */
    const initializeGrid = useCallback(async (data: ArticleRow[]) => {
        if (typeof window === 'undefined') return;

        try {
            // Clean up existing grid if it exists
            if (gridRef.current?.cleanup) {
                gridRef.current.cleanup();
            }
            if (gridRef.current) {
                gridRef.current.parentNode.removeChild(gridRef.current);
                gridRef.current = null;
            }

            // Set hasData based on the data we're about to load
            const shouldShowData = data.length > 0 && !isTemplateData(data);
            setHasData(shouldShowData);
            if (shouldShowData) {
                setShouldHighlightProcess(true);
            }

            // If we shouldn't show data, return early
            if (!shouldShowData) return;

            // Wait for next tick to ensure container is mounted
            await new Promise(resolve => setTimeout(resolve, 50));

            if (!gridContainerRef.current) {
                console.error('Grid container not found');
                return;
            }

            const canvasDatagrid = (await import('canvas-datagrid')).default;

            gridRef.current = canvasDatagrid({
                parentNode: gridContainerRef.current,
                data,
                allowColumnReordering: true,
                allowRowReordering: false,
                editable: false,
                allowColumnResizeFromCell: true,
                allowRowResizeFromCell: false,
                allowSorting: true,
                style: {
                    cellPaddingLeft: 8,
                    cellPaddingRight: 8,
                    columnHeaderBackgroundColor: '#f8fafc',
                    columnHeaderColor: '#1e3a8a',
                    cellColor: '#374151',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }
            });

            // Force a resize and draw after initialization
            gridRef.current.resize();
            gridRef.current.draw();

            // Set up resize observer
            const resizeObserver = new ResizeObserver(() => {
                if (gridRef.current) {
                    gridRef.current.resize();
                    gridRef.current.draw();
                }
            });

            resizeObserver.observe(gridContainerRef.current);

            // Store cleanup function
            gridRef.current.cleanup = () => {
                resizeObserver.disconnect();
            };

            setIsGridInitialized(true);
        } catch (error) {
            console.error('Error initializing grid:', error);
            showStatus('Error initializing grid component', true);
            setHasData(false);
        }
    }, [showStatus, isTemplateData]);

    /**
     * Handles file selection and upload
     * - Validates file size and format
     * - Processes CSV and XLSX files
     * - Normalizes data structure
     * - Initializes grid with uploaded data
     */
    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            showStatus('Please select a file first.', true);
            return;
        }

        // File size validation (10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > MAX_FILE_SIZE) {
            showStatus(`File size exceeds 10MB limit. Please split your data into smaller batches.`, true);
            event.target.value = '';
            setHasData(false);
            return;
        }

        setStatus(null); // Clear any existing status messages
        setIsProcessed(false); // Reset processed state when new file is uploaded
        setCurrentFileName(file.name.split('.')[0]);
        const isCSV = file.name.toLowerCase().endsWith('.csv');

        try {
            // Clear the current grid data and hasData state
            setHasData(false);
            if (gridRef.current) {
                gridRef.current.data = [];
                gridRef.current.draw();
            }

            const data = await file.arrayBuffer();
            let jsonData;

            if (isCSV) {
                const csvText = new TextDecoder().decode(data);
                const workbook = XLSX.read(csvText, {
                    type: 'string',
                    raw: false
                });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false
                });
            } else {
                const workbook = XLSX.read(data);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false
                });
            }

            if (jsonData.length === 0) {
                showStatus('The uploaded file appears to be empty.', true);
                return;
            }

            // Row count validation (250 articles limit)
            const MAX_ROWS = 250;
            if (jsonData.length > MAX_ROWS) {
                showStatus(`File contains more than ${MAX_ROWS} articles. Please split your data into smaller batches.`, true);
                return;
            }

            // Check for Article Content column and validate content length
            const firstRow = jsonData[0] as Record<string, any>;
            const hasArticleContent = Object.keys(firstRow).some(key =>
                key.trim().toLowerCase() === 'article content'.toLowerCase()
            );

            if (!hasArticleContent) {
                showStatus('The "Article Content" column is required. Please use the template.', true);
                return;
            }

            // Normalize data structure regardless of format
            jsonData = (jsonData as Record<string, any>[]).map((row) => {
                // Start with a template object containing all required columns with default values
                const normalizedRow: Record<string, any> = {
                    "Article Content": "",
                    "Author Name": "",
                    "Likes": 0,
                    "Shares": 0,
                    "Views": 0,
                    "Summary": "",
                    "Tags": ""
                };

                // Override defaults with any values from the file
                Object.entries(row).forEach(([key, value]) => {
                    const normalizedKey = TEMPLATE_COLUMNS.find(
                        col => col.toLowerCase() === key.trim().toLowerCase()
                    );
                    if (normalizedKey) {
                        // Convert empty strings to defaults for numeric columns
                        if (NUMERIC_COLUMNS.includes(normalizedKey as any) && (value === "" || value === undefined || value === null)) {
                            normalizedRow[normalizedKey] = 0;
                        } else {
                            normalizedRow[normalizedKey] = value || normalizedRow[normalizedKey];
                        }
                    }
                });

                return normalizedRow;
            });

            await initializeGrid(jsonData as ArticleRow[]);
            showStatus('File loaded successfully!', false);
        } catch (error) {
            console.error('Error parsing file:', error);
            showStatus(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
            setHasData(false);
        }

        // Reset the file input to allow selecting the same file again
        event.target.value = '';
    }, [showStatus, initializeGrid, setCurrentFileName]);

    /**
     * Downloads an empty template file for users to fill
     */
    const downloadTemplate = useCallback(() => {
        const template = createTemplateData();
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'article_template.xlsx');
    }, [createTemplateData]);

    /**
     * Exports the current grid data to XLSX or CSV format
     * @param type - The export format ('xlsx' or 'csv')
     */
    const exportFile = useCallback((type: 'xlsx' | 'csv') => {
        if (!gridRef.current?.data) {
            showStatus('No data to export', true);
            return;
        }

        const ws = XLSX.utils.json_to_sheet(gridRef.current.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Articles');

        const filename = `${currentFileName}.${type}`;
        if (type === 'xlsx') {
            XLSX.writeFile(wb, filename);
        } else {
            XLSX.writeFile(wb, filename, { bookType: 'csv' });
        }
    }, [currentFileName, showStatus]);

    /**
     * Loads example data for demonstration purposes
     * Useful for first-time users to understand the system
     */
    const loadExampleData = useCallback(async () => {
        try {
            // Clear the current grid data and hasData state
            setHasData(false);
            if (gridRef.current) {
                gridRef.current.data = [];
                gridRef.current.draw();
            }

            await initializeGrid(EXAMPLE_ARTICLES);
            setCurrentFileName('example_articles');
            setIsProcessed(false);
            showStatus('Example data loaded successfully!', false);

            // Set hasVisitedBefore in localStorage and update state
            localStorage.setItem('hasVisitedBefore', 'true');
            setIsFirstVisit(false);
        } catch (error) {
            console.error('Error loading example data:', error);
            showStatus('Error loading example data. Please try again.', true);
            setHasData(false);
        }
    }, [showStatus, initializeGrid]);

    /**
     * Checks if WebGPU is available in the current environment
     * @returns Promise<boolean> indicating if WebGPU is supported
     */
    const checkWebGPUSupport = useCallback(async (): Promise<boolean> => {
        try {
            if (!navigator.gpu) {
                throw new Error('WebGPU is not supported');
            }
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                throw new Error('WebGPU adapter not found');
            }
            return true;
        } catch (error) {
            const browserName = navigator.userAgent.includes('Chrome') ? 'Chrome' :
                navigator.userAgent.includes('Firefox') ? 'Firefox' :
                    'your browser';

            const chromeInstructions = `
1. Copy and paste this into your Chrome address bar: chrome://flags/#enable-unsafe-webgpu
2. Set "WebGPU" to "Enabled"
3. Click "Restart" at the bottom of the screen
4. Return to this page and try again`;

            const firefoxInstructions = `
1. Copy and paste this into your Firefox address bar: about:config
2. Search for "dom.webgpu.enabled"
3. Set it to "true"
4. Restart Firefox
5. Return to this page and try again`;

            const instructions = browserName === 'Chrome' ? chromeInstructions :
                browserName === 'Firefox' ? firefoxInstructions :
                    'Please use Chrome or Firefox with WebGPU enabled.';

            showStatus(`⚠️ WebGPU Support Required

This application requires WebGPU, which is not currently enabled in ${browserName}.

To enable WebGPU:
${instructions}

Note: WebGPU is a new technology. For best results, use the latest version of Chrome.`, true, true);
            return false;
        }
    }, [showStatus]);

    // Initialize grid on component mount
    useEffect(() => {
        if (typeof window !== 'undefined' && !isGridInitialized) {
            // Don't initialize with template data on first load
            setIsGridInitialized(true);
        }
    }, [initializeGrid, createTemplateData, isGridInitialized]);

    // Cleanup resources on component unmount
    useEffect(() => {
        return () => {
            if (gridRef.current?.cleanup) {
                gridRef.current.cleanup();
            }
            cleanup();
        };
    }, []);

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header */}
                <div className="border-b border-gray-200">
                    <div className="px-6 py-5">
                        <h2 className="text-xl font-semibold text-gray-800">Article Manager</h2>
                        <p className="text-sm text-gray-500 mt-1">Upload, edit, and process your articles</p>
                    </div>

                    {/* Action Bar */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-3">
                        {/* Left side - File Actions */}
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                id="fileInput"
                                accept=".xlsx,.csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <label
                                htmlFor="fileInput"
                                className="bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-md border border-gray-300 flex items-center gap-2 transition-all cursor-pointer text-sm font-medium"
                            >
                                <DocumentPlusIcon className="w-5 h-5" />
                                Choose File
                            </label>
                            <button
                                onClick={() => downloadTemplate()}
                                className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-all"
                            >
                                <DocumentArrowDownIcon className="w-5 h-5" />
                                Get Template
                            </button>
                            <button
                                onClick={loadExampleData}
                                className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-all relative"
                            >
                                <BeakerIcon className={`w-5 h-5 [transform-origin:50%_60%] ${isFirstVisit ? 'animate-[swoosh_2s_ease-in-out_infinite]' : ''}`} />
                                {isFirstVisit && (
                                    <div className="absolute inset-0 bg-blue-400/20 animate-pulse rounded-md" />
                                )}
                                <style jsx global>{`
                                    @keyframes swoosh {
                                        0% {
                                            transform: rotate(0deg);
                                            filter: drop-shadow(0 0 2px #60a5fa);
                                        }
                                        25% {
                                            transform: rotate(-12deg);
                                            filter: drop-shadow(0 0 4px #60a5fa);
                                        }
                                        75% {
                                            transform: rotate(12deg);
                                            filter: drop-shadow(0 0 4px #60a5fa);
                                        }
                                        100% {
                                            transform: rotate(0deg);
                                            filter: drop-shadow(0 0 2px #60a5fa);
                                        }
                                    }
                                `}</style>
                                Load Example Data
                            </button>
                        </div>

                        {/* Right side - Processing Actions */}
                        <div className="flex items-center gap-3 ml-auto">
                            {hasData && (
                                <>
                                    <button
                                        onClick={async () => {
                                            setShouldHighlightProcess(false);
                                            if (!gridRef.current?.data?.length) {
                                                showStatus('No articles to summarize', true);
                                                return;
                                            }

                                            // Check WebGPU support before proceeding
                                            const isWebGPUSupported = await checkWebGPUSupport();
                                            if (!isWebGPUSupported) {
                                                return;
                                            }

                                            try {
                                                setIsSummarizing(true);
                                                const data = [...gridRef.current.data];
                                                let errorCount = 0;
                                                const processingStartTime = Date.now();

                                                for (let i = 0; i < data.length; i++) {
                                                    const row = data[i];
                                                    if (!row['Article Content']) continue;

                                                    try {
                                                        const { summary, tags } = await summarizeArticle(
                                                            row['Article Content'],
                                                            {
                                                                onLoadingUpdate: (status) => {
                                                                    if (status.state === 'loading') {
                                                                        // Don't modify the message if it already contains "first time setup"
                                                                        showStatus(status.message, false, true);
                                                                    } else if (status.state === 'ready') {
                                                                        showStatus('Model ready, starting summarization...', false, true);
                                                                    } else if (status.state === 'error') {
                                                                        showStatus(status.message, true, false);
                                                                    }
                                                                },
                                                                onSummarizationProgress: (current, total) => {
                                                                    showStatus(`Summarizing article ${i + 1} of ${data.length}...`, false, true);
                                                                }
                                                            }
                                                        );

                                                        data[i] = {
                                                            ...row,
                                                            Summary: summary,
                                                            Tags: tags
                                                        };

                                                        if (gridRef.current) {
                                                            gridRef.current.data = data;
                                                            gridRef.current.draw();
                                                        }
                                                    } catch (error) {
                                                        console.error(`Error processing article ${i + 1}:`, error);
                                                        errorCount++;
                                                        // Mark the failed article
                                                        data[i] = {
                                                            ...row,
                                                            Summary: "Error: Processing failed",
                                                            Tags: "Error: Processing failed"
                                                        };
                                                        if (gridRef.current) {
                                                            gridRef.current.data = data;
                                                            gridRef.current.draw();
                                                        }
                                                        // Continue with next article
                                                        continue;
                                                    }
                                                }

                                                const elapsedTime = Date.now() - processingStartTime;
                                                const statusMessage = errorCount > 0
                                                    ? `Processing complete with ${errorCount} error(s). Total time: ${formatElapsedTime(elapsedTime)}`
                                                    : `Summarization complete! Total processing time: ${formatElapsedTime(elapsedTime)}`;
                                                showStatus(statusMessage, errorCount > 0, false);
                                                setIsProcessed(true);
                                            } catch (error) {
                                                console.error('Error during summarization:', error);
                                                showStatus('Failed to summarize articles. Please try again.', true, false);
                                                await cleanup(); // Cleanup on error
                                            } finally {
                                                setIsSummarizing(false);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors relative
                                            ${(isSummarizing || isProcessed)
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                        disabled={isSummarizing || isProcessed}
                                    >
                                        {shouldHighlightProcess && !isSummarizing && !isProcessed && (
                                            <>
                                                <div className="absolute inset-0 rounded-md animate-[process-glow_2s_ease-in-out_infinite]" />
                                                <div className="absolute inset-0 rounded-md animate-[process-glow_2s_ease-in-out_infinite] delay-[700ms]" />
                                            </>
                                        )}
                                        <style jsx global>{`
                                            @keyframes process-glow {
                                                0% {
                                                    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
                                                }
                                                50% {
                                                    box-shadow: 0 0 8px 6px rgba(37, 99, 235, 0);
                                                }
                                                100% {
                                                    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
                                                }
                                            }
                                        `}</style>
                                        <CommandLineIcon className="w-5 h-5" />
                                        {isSummarizing ? 'Processing...' : isProcessed ? 'Processing Complete' : 'Process Articles'}
                                    </button>

                                    <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
                                        <span className="text-sm text-gray-500">Export as:</span>
                                        <button
                                            onClick={() => exportFile('xlsx')}
                                            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-all inline-flex items-center gap-2 text-sm"
                                            title="Export as Excel Spreadsheet"
                                        >
                                            <TableCellsIcon className="w-5 h-5" />
                                            <span className="font-medium">Excel</span>
                                        </button>
                                        <button
                                            onClick={() => exportFile('csv')}
                                            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-all inline-flex items-center gap-2 text-sm"
                                            title="Export as CSV File"
                                        >
                                            <DocumentTextIcon className="w-5 h-5" />
                                            <span className="font-medium">CSV</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Grid or Placeholder */}
                <div className="p-6">
                    {hasData ? (
                        <div
                            ref={gridContainerRef}
                            className="w-full h-[500px] border border-gray-200 rounded-md overflow-auto"
                            style={{ position: 'relative' }}
                        />
                    ) : (
                        <div className="w-full h-[500px] border border-gray-200 rounded-md overflow-hidden flex flex-col items-center justify-center text-gray-500">
                            <DocumentPlusIcon className="w-12 h-12 mb-4" />
                            <p className="text-lg font-medium mb-2">No Data Loaded</p>
                            <p className="text-sm flex items-center gap-2">
                                <label
                                    htmlFor="fileInput"
                                    className="text-blue-600 hover:text-blue-800 cursor-pointer transition-colors font-medium"
                                >
                                    Upload a file
                                </label>
                                <span>or</span>
                                <button
                                    onClick={loadExampleData}
                                    className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                                >
                                    load example data
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Message - Now rendered outside the main container */}
            {status && (
                <StatusMessage
                    message={status.message}
                    isError={status.isError}
                    persistent={status.persistent}
                    showProgress={status.message.includes('Loading AI model') ||
                        status.message.includes('first time setup') ||
                        status.message.includes('Summarizing article') ||
                        status.message.includes('Model ready')}
                />
            )}

            {/* Cache Control Footer */}
            <div className="mt-8 flex justify-center">
                <button
                    onClick={async () => {
                        try {
                            // Clear localStorage flag
                            localStorage.removeItem('modelLoadAttempted');

                            // Clear all caches
                            const cacheKeys = await caches.keys();
                            await Promise.all(
                                cacheKeys.map(key => caches.delete(key))
                            );

                            // Run cleanup
                            await cleanup();

                            showStatus('Model cache cleared successfully. The model will need to be downloaded again on next use.', false);
                        } catch (error) {
                            console.error('Error clearing cache:', error);
                            showStatus('Failed to clear model cache', true);
                        }
                    }}
                    disabled={isSummarizing}
                    className={`text-xs transition-colors py-2 px-3 rounded-md ${isSummarizing
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    Clear Model Cache
                </button>
            </div>
        </>
    );
} 