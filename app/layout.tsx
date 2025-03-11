import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SummarizeHub - AI Article Summarization',
  description: 'Privacy-focused article summarization tool using Gemma 2B-IT. Process articles in bulk via CSV/XLSX and generate AI summaries & tags directly in your browser - no server or API keys required.',
  keywords: ['article summarization', 'AI summarizer', 'privacy-focused', 'browser-based LLM', 'Gemma 2B-IT', 'bulk processing', 'CSV', 'XLSX'],
  authors: [{ name: 'Scott Guthart' }],
  metadataBase: new URL('https://summarize-hub.vercel.app'),
  openGraph: {
    title: 'SummarizeHub - AI Article Summarization',
    description: 'Privacy-focused article summarization tool using Gemma 2B-IT. Process articles in bulk via CSV/XLSX and generate AI summaries & tags directly in your browser.',
    type: 'website',
    images: [
      {
        url: '/assets/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'SummarizeHub - Privacy-focused AI Article Summarization',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SummarizeHub - AI Article Summarization',
    description: 'Privacy-focused article summarization tool using Gemma 2B-IT. Process articles in bulk via CSV/XLSX and generate AI summaries & tags directly in your browser.',
    images: ['/assets/og-image.svg'],
  },
  icons: {
    icon: [
      { url: '/assets/icon.svg' },
      { url: '/assets/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/assets/icon.svg',
    apple: '/assets/icon.svg',
    other: {
      rel: 'mask-icon',
      url: '/assets/icon.svg',
      color: '#6D28D9',
    },
  },
  themeColor: '#6D28D9',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        {children}
      </body>
    </html>
  );
}
