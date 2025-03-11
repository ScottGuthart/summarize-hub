'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TEMPLATE_COLUMNS, NUMERIC_COLUMNS } from '@/lib/constants';
import type { ArticleRow } from '@/lib/types';
import { StatusMessage } from './StatusMessage';
import * as XLSX from 'xlsx';
import { summarizeArticle } from '@/lib/summarize';

// Type declaration for canvas-datagrid
type CanvasDataGrid = any; // Using any for now since the library's types are not properly exported

export function ArticleGrid() {
    const gridRef = useRef<CanvasDataGrid>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<{ message: string; isError: boolean; persistent?: boolean } | null>(null);
    const [currentFileName, setCurrentFileName] = useState('articles');
    const [isGridInitialized, setIsGridInitialized] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);

    const createTemplateData = useCallback((): ArticleRow[] => {
        return [{
            "Article Content": "Paste your article text here...",
            "Author Name": "Enter author name",
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
                editable: true,
                allowColumnResizeFromCell: true,
                allowRowResizeFromCell: true,
                allowSorting: true,
                style: {
                    cellPaddingLeft: 8,
                    cellPaddingRight: 8
                }
            });

            gridRef.current.style.height = '500px';
            gridRef.current.style.width = '100%';

            // Event listeners
            gridRef.current.addEventListener('rendercell', (e: any) => {
                if (e.cell.header.name === 'Summary' || e.cell.header.name === 'Tags') {
                    e.ctx.fillStyle = '#888';
                }
            });

            gridRef.current.addEventListener('keydown', (e: any) => {
                if (e.key === 'Enter' && e.cell.rowIndex === gridRef.current.data.length - 1) {
                    const newRow = Object.fromEntries(
                        TEMPLATE_COLUMNS.map(col => [
                            col,
                            NUMERIC_COLUMNS.includes(col as any) ? 0 : ''
                        ])
                    ) as ArticleRow;
                    gridRef.current.data.push(newRow);
                    gridRef.current.selectCell(0, gridRef.current.data.length - 1);
                }
            });

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

        setCurrentFileName(file.name.split('.')[0]);
        const isCSV = file.name.toLowerCase().endsWith('.csv');

        try {
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
                return;
            }

            // Check for Article Content column
            const firstRow = jsonData[0] as Record<string, any>;
            const hasArticleContent = Object.keys(firstRow).some(key =>
                key.trim().toLowerCase() === 'article content'.toLowerCase()
            );

            if (!hasArticleContent) {
                showStatus('The "Article Content" column is required. Please use the template.', true);
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
        }
    }, [showStatus, initializeGrid, setCurrentFileName]);

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
        <div className="p-4">
            <div className="mb-4 flex gap-4">
                <input
                    type="file"
                    id="fileInput"
                    accept=".xlsx,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <label
                    htmlFor="fileInput"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
                >
                    Load File
                </label>
                <button
                    onClick={() => downloadTemplate()}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                >
                    Download Template
                </button>
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
                        } catch (error) {
                            console.error('Error during summarization:', error);
                            showStatus('Failed to summarize articles. Please try again.', true, false);
                        } finally {
                            setIsSummarizing(false);
                        }
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                    disabled={isSummarizing}
                >
                    {isSummarizing ? 'Summarizing...' : 'Summarize Articles'}
                </button>
                <button
                    onClick={() => exportFile('xlsx')}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                >
                    Export XLSX
                </button>
                <button
                    onClick={() => exportFile('csv')}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                >
                    Export CSV
                </button>
            </div>

            <div
                ref={gridContainerRef}
                className="w-full h-[500px] border border-gray-200 rounded"
            />

            {status && (
                <StatusMessage
                    message={status.message}
                    isError={status.isError}
                    persistent={status.persistent}
                />
            )}
        </div>
    );
} 