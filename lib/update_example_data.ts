const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonPath = path.join(process.cwd(), '2_articles.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Convert the data format
const articles = Object.keys(jsonData['Article Content']).map((key) => ({
    'Article Content': jsonData['Article Content'][key],
    'Author Name': jsonData['Author Name'][key],
    'Likes': jsonData['Likes'][key],
    'Shares': jsonData['Shares'][key],
    'Views': jsonData['Views'][key],
    'Summary': jsonData['Summary'][key] || '',
    'Tags': jsonData['Tags'][key] || ''
}));

// Write the updated example data
const outputPath = path.join(process.cwd(), 'lib/example-data.ts');
const outputContent = `import type { ArticleRow } from '@/lib/types';

export const EXAMPLE_ARTICLES: ArticleRow[] = ${JSON.stringify(articles, null, 4)};
`;

fs.writeFileSync(outputPath, outputContent);
console.log('Example data updated successfully!'); 