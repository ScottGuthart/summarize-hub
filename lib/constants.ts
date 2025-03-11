// Application-wide constants

// Add your constants here
export const APP_NAME = 'SummarizeHub';
export const APP_DESCRIPTION = 'Your AI-powered content summarization hub';

// You can add more constants as needed 
export const TEMPLATE_COLUMNS = [
    "Article Content",
    "Author Name",
    "Likes",
    "Shares",
    "Views",
    "Summary",
    "Tags"
] as const;

export const NUMERIC_COLUMNS = ['Likes', 'Shares', 'Views'] as const; 