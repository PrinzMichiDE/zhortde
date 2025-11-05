'use client';

import { useState } from 'react';
import { ClipboardIcon, CheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface PasteDisplayProps {
  slug: string;
  content: string;
  syntaxHighlightingLanguage: string | null;
  isPublic: boolean;
  createdAt: Date;
}

export function PasteDisplay({
  slug,
  content,
  syntaxHighlightingLanguage,
  isPublic,
  createdAt,
}: PasteDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Paste: {slug}</h1>
            {syntaxHighlightingLanguage && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {syntaxHighlightingLanguage}
              </span>
            )}
            {!isPublic && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Privat
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <a
              href={`/p/${slug}/raw`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5" />
              <span>Raw</span>
            </a>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-5 w-5" />
                  <span>Kopiert!</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-5 w-5" />
                  <span>Kopieren</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="p-6">
          {syntaxHighlightingLanguage ? (
            <SyntaxHighlighter
              language={syntaxHighlightingLanguage}
              style={vs}
              showLineNumbers
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: '#f9fafb',
                fontSize: '0.875rem',
              }}
            >
              {content}
            </SyntaxHighlighter>
          ) : (
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
              <code className="text-sm font-mono text-gray-800">{content}</code>
            </pre>
          )}
        </div>
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-sm text-gray-500">
          Erstellt am: {new Date(createdAt).toLocaleString('de-DE')}
        </div>
      </div>
    </div>
  );
}

