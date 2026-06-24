'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function renderMarkdownContent(md: string) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {children}
          </tbody>
        ),
        th: ({ children }) => (
          <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{children}</td>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
            {children}
          </tr>
        ),
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-3 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 mb-3 text-gray-700 dark:text-gray-300">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-700 dark:text-gray-300">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
        ),
        code: ({ children }) => (
          <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-600 dark:text-gray-400 my-3">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-gray-200 dark:border-gray-700 my-6" />,
      }}
    >
      {md}
    </ReactMarkdown>
  );
}
