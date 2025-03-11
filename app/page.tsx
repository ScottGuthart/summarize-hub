import { ArticleGrid } from './components/ArticleGrid';

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Article Manager</h1>
      <ArticleGrid />
    </main>
  );
} 