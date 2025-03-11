'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TEMPLATE_COLUMNS, NUMERIC_COLUMNS } from '@/lib/constants';
import type { ArticleRow } from '@/lib/types';
import { StatusMessage } from './StatusMessage';
import * as XLSX from 'xlsx';
import { summarizeArticle } from '@/lib/summarize';
import {
    DocumentArrowDownIcon,
    DocumentPlusIcon,
    CommandLineIcon,
    TableCellsIcon,
    DocumentTextIcon,
    ArrowUpTrayIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

// Type declaration for canvas-datagrid
type CanvasDataGrid = any; // Using any for now since the library's types are not properly exported

export function ArticleGrid() {
    const gridRef = useRef<CanvasDataGrid>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<{ message: string; isError: boolean; persistent?: boolean } | null>(null);
    const [currentFileName, setCurrentFileName] = useState('articles');
    const [isGridInitialized, setIsGridInitialized] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isProcessed, setIsProcessed] = useState(false);

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

    const showStatus = useCallback((message: string, isError = false, persistent = false) => {
        setStatus({ message, isError, persistent });
    }, []);

    const initializeGrid = useCallback(async (data: ArticleRow[]) => {
        if (typeof window === 'undefined') return;

        try {
            if (gridRef.current) {
                gridRef.current.parentNode.removeChild(gridRef.current);
                gridRef.current = null;
            }

            if (!gridContainerRef.current) return;

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
                    cellColor: '#374151', // Default text color
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }
            });

            gridRef.current.style.height = '500px';
            gridRef.current.style.width = '100%';

            setIsGridInitialized(true);
        } catch (error) {
            console.error('Error initializing grid:', error);
            showStatus('Error initializing grid component', true);
        }
    }, [showStatus]);

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            showStatus('Please select a file first.', true);
            return;
        }

        setStatus(null); // Clear any existing status messages
        setIsProcessed(false); // Reset processed state when new file is uploaded
        setCurrentFileName(file.name.split('.')[0]);
        const isCSV = file.name.toLowerCase().endsWith('.csv');

        try {
            // Clear the current grid data
            if (gridRef.current) {
                gridRef.current.data = [];
                gridRef.current.draw();
            }

            const data = await file.arrayBuffer();
            let jsonData;

            if (isCSV) {
                const csvText = new TextDecoder().decode(data);
                console.log('CSV Content:', csvText); // Debug raw CSV content
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

            console.log('Parsed Data:', jsonData); // Debug parsed data

            if (jsonData.length === 0) {
                showStatus('The uploaded file appears to be empty.', true);
                // Reset to template data if file is empty
                await initializeGrid(createTemplateData());
                return;
            }

            // Check for Article Content column
            const firstRow = jsonData[0] as Record<string, any>;
            const hasArticleContent = Object.keys(firstRow).some(key =>
                key.trim().toLowerCase() === 'article content'.toLowerCase()
            );

            if (!hasArticleContent) {
                showStatus('The "Article Content" column is required. Please use the template.', true);
                // Reset to template data if validation fails
                await initializeGrid(createTemplateData());
                return;
            }

            // Normalize data structure regardless of format
            jsonData = (jsonData as Record<string, any>[]).map((row, index) => {
                console.log(`Processing row ${index}:`, row);

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

                console.log(`Normalized row ${index}:`, normalizedRow);
                return normalizedRow;
            });

            console.log('Final Data:', jsonData);

            // Initialize grid with the new data
            await initializeGrid(jsonData as ArticleRow[]);
            showStatus('File loaded successfully!', false);
        } catch (error) {
            console.error('Error parsing file:', error);
            showStatus(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
            // Reset to template data on error
            await initializeGrid(createTemplateData());
        }

        // Reset the file input to allow selecting the same file again
        event.target.value = '';
    }, [showStatus, initializeGrid, setCurrentFileName, createTemplateData]);

    const downloadTemplate = useCallback(() => {
        const template = createTemplateData();
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'article_template.xlsx');
    }, [createTemplateData]);

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

    useEffect(() => {
        if (typeof window !== 'undefined' && !isGridInitialized) {
            initializeGrid(createTemplateData());
        }
    }, [initializeGrid, createTemplateData, isGridInitialized]);

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
                        </div>

                        {/* Right side - Processing Actions */}
                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                onClick={async () => {
                                    if (!gridRef.current?.data?.length) {
                                        showStatus('No articles to summarize', true);
                                        return;
                                    }

                                    try {
                                        setIsSummarizing(true);
                                        const data = [...gridRef.current.data];

                                        for (let i = 0; i < data.length; i++) {
                                            const row = data[i];
                                            if (!row['Article Content']) continue;

                                            const { summary, tags } = await summarizeArticle(
                                                row['Article Content'],
                                                {
                                                    onLoadingUpdate: (status) => {
                                                        if (status.state === 'loading') {
                                                            showStatus(`Loading model: ${status.message} (${Math.round(status.progress || 0)}%)`, false, true);
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
                                        }

                                        showStatus('Summarization complete!', false, false);
                                        setIsProcessed(true); // Set processed state to true after successful processing
                                    } catch (error) {
                                        console.error('Error during summarization:', error);
                                        showStatus('Failed to summarize articles. Please try again.', true, false);
                                    } finally {
                                        setIsSummarizing(false);
                                    }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                                disabled={isSummarizing || isProcessed}
                            >
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
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="p-6">
                    <div
                        ref={gridContainerRef}
                        className="w-full h-[500px] border border-gray-200 rounded-md overflow-hidden"
                    />
                </div>
            </div>

            {/* Status Message - Now rendered outside the main container */}
            {status && (
                <StatusMessage
                    message={status.message}
                    isError={status.isError}
                    persistent={status.persistent}
                    showProgress={status.message.includes('Loading model') ||
                        status.message.includes('Summarizing article') ||
                        status.message.includes('Model ready')}
                />
            )}
        </>
    );
} 