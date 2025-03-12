'use client';

import { ArticleGrid } from './components/ArticleGrid';
import {
  ComputerDesktopIcon,
  DocumentTextIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

function ScrollButton() {
  return (
    <button
      onClick={() => {
        document.getElementById('article-manager')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }}
      className="bg-white text-blue-900 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold text-lg transition-colors flex items-center gap-2 group"
    >
      Get Started
      <ArrowDownIcon className="w-5 h-5 group-hover:transform group-hover:translate-y-0.5 transition-transform" />
    </button>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-800 to-blue-900 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            SummarizeHub
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl">
            Secure, efficient article summarization powered by Google's Gemma 2B-IT. Process articles at scale with our browser-based solution.
          </p>
          <div className="bg-blue-700/30 rounded-lg p-6 max-w-3xl border border-blue-600/20">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheckIcon className="w-7 h-7" />
              <h2 className="text-xl font-semibold">Secure By Design</h2>
            </div>
            <p className="text-blue-100">All processing occurs within your browser, ensuring your data remains private and secure. No content is sent to external servers.</p>
          </div>
          <div className="mt-8 flex justify-end">
            <ScrollButton />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Info Section */}
        <div className="py-12">
          {/* Instructions Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Quick Start Guide</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-2xl mb-3">
                  <ArrowDownTrayIcon className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-800">Get Started</h3>
                <p className="text-gray-600">Download our spreadsheet template with the required columns.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-2xl mb-3">
                  <DocumentTextIcon className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-800">Add Content</h3>
                <p className="text-gray-600">Fill the template with articles (max 30,000 characters each). Required: "Article Content" field.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-2xl mb-3">
                  <ArrowUpTrayIcon className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-800">Upload</h3>
                <p className="text-gray-600">Import your completed spreadsheet through the secure interface.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-2xl mb-3">
                  <CommandLineIcon className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-800">Process</h3>
                <p className="text-gray-600">Generate concise summaries and relevant tags using AI analysis.</p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mb-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-900">Technical Requirements</h2>
            <ul className="space-y-3 text-blue-900">
              <li className="flex items-start">
                <CpuChipIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>First-time setup includes model download (1.2GB). Compatible with standard networks.</span>
              </li>
              <li className="flex items-start">
                <ComputerDesktopIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>Performance optimized for modern workstations. Recommended: 16GB RAM or higher.</span>
              </li>
              <li className="flex items-start">
                <DocumentTextIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>Articles per batch: Maximum 250. Article length: Maximum 30,000 characters (~4,000 words or 10 pages). File size: Maximum 10MB.</span>
              </li>
              <li className="flex items-start">
                <ArrowDownIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>Export results to standard formats (XLSX, CSV).</span>
              </li>
            </ul>
          </div>

          {/* Features Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-700" />
                  <h3 className="font-semibold text-gray-800">Data Security</h3>
                </div>
                <p className="text-gray-600">Local processing ensures privacy and security of all processed content.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <ChartBarIcon className="w-5 h-5 text-blue-700" />
                  <h3 className="font-semibold text-gray-800">Scalable Processing</h3>
                </div>
                <p className="text-gray-600">Handle multiple articles efficiently with support for common file formats.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <CpuChipIcon className="w-5 h-5 text-blue-700" />
                  <h3 className="font-semibold text-gray-800">Advanced Analysis</h3>
                </div>
                <p className="text-gray-600">Powered by Google's Gemma 2B-IT model for reliable content summarization.</p>
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
        <div id="article-manager" className="py-8">
          <ArticleGrid />
        </div>
      </div>
    </main>
  );
} 