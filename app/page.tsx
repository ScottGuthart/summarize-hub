import { ArticleGrid } from './components/ArticleGrid';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-700 to-purple-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            SummarizeHub
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl">
            Privacy-focused article summarization using Gemma 2B-IT. Process your articles in bulk and generate AI summaries & tags directly in your browser.
          </p>
          <div className="bg-purple-600/30 rounded-lg p-4 max-w-3xl">
            <h2 className="text-lg font-semibold mb-2">🔒 Privacy First</h2>
            <p>All processing happens in your browser - no data is sent to external servers. The AI model runs locally for complete privacy.</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Info Section */}
        <div className="py-12">
          {/* Instructions Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">How to Use SummarizeHub</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-2xl mb-2">1️⃣</div>
                <h3 className="font-semibold mb-2 text-gray-800">Get Template</h3>
                <p className="text-gray-600">Start by downloading our template file with the required columns.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-2xl mb-2">2️⃣</div>
                <h3 className="font-semibold mb-2 text-gray-800">Fill Template</h3>
                <p className="text-gray-600">Add your articles to the template. The "Article Content" column is required.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-2xl mb-2">3️⃣</div>
                <h3 className="font-semibold mb-2 text-gray-800">Upload File</h3>
                <p className="text-gray-600">Upload your filled template using the "Choose File" button.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-2xl mb-2">4️⃣</div>
                <h3 className="font-semibold mb-2 text-gray-800">Process Articles</h3>
                <p className="text-gray-600">Click "Process Articles" to generate AI summaries and tags for all articles.</p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mb-12 bg-yellow-50 border border-yellow-100 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-800">Important Notes</h2>
            <ul className="space-y-2 text-yellow-800">
              <li className="flex items-start">
                <span className="mr-2">⚡️</span>
                <span>First use requires downloading the AI model (~1.2GB). This is a one-time process.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">💻</span>
                <span>Processing happens entirely in your browser. Performance depends on your device.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📝</span>
                <span>Each article is processed individually. You can track progress in real-time.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">💾</span>
                <span>Export your results anytime in Excel or CSV format.</span>
              </li>
            </ul>
          </div>

          {/* Features Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-2 text-gray-800">🚀 Browser-Based Processing</h3>
                <p className="text-gray-600">No server required. Everything runs locally in your browser for maximum privacy.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-2 text-gray-800">📊 Bulk Processing</h3>
                <p className="text-gray-600">Process multiple articles at once using CSV or XLSX files.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-2 text-gray-800">🤖 Advanced AI</h3>
                <p className="text-gray-600">Powered by Google's Gemma 2B-IT model for high-quality summaries.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative py-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300"></div>
          </div>
        </div>

        {/* Article Manager */}
        <div className="py-8">
          <ArticleGrid />
        </div>
      </div>
    </main>
  );
} 