'use client';

import React from 'react';

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)|(\*(.+?)\*)/g;
  let last = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) parts.push(<strong key={key++} className="font-semibold text-gray-900 dark:text-white">{match[2]}</strong>);
    else if (match[3]) parts.push(<code key={key++} className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{match[4]}</code>);
    else if (match[5]) parts.push(<em key={key++}>{match[6]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function renderMarkdownContent(md: string): React.ReactNode {
  const lines = md.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === '') { i++; continue; }

    // Headings
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const content = parseInline(hMatch[2]);
      if (level === 1) nodes.push(<h1 key={key++} className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-3 first:mt-0">{content}</h1>);
      else if (level === 2) nodes.push(<h2 key={key++} className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3 first:mt-0">{content}</h2>);
      else nodes.push(<h3 key={key++} className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">{content}</h3>);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push(
        <blockquote key={key++} className="border-l-4 border-blue-400 pl-4 italic text-gray-600 dark:text-gray-400 my-3">
          {parseInline(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // HR
    if (/^[-*_]{3,}$/.test(line.trim())) {
      nodes.push(<hr key={key++} className="border-gray-200 dark:border-gray-700 my-6" />);
      i++; continue;
    }

    // Table
    if (line.includes('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      // filter separator rows (---|---)
      const rows = tableLines.filter(l => !l.match(/^\|?[\s\-:]+\|/));
      const parseRow = (l: string) =>
        l.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

      if (rows.length >= 1) {
        const [head, ...body] = rows;
        const headers = parseRow(head);
        nodes.push(
          <div key={key++} className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {headers.map((h, hi) => (
                    <th key={hi} className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs">
                      {parseInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {body.map((row, ri) => (
                  <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                    {parseRow(row).map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s/, ''));
        i++;
      }
      nodes.push(
        <ul key={key++} className="list-disc list-inside space-y-1 mb-3 text-gray-700 dark:text-gray-300">
          {items.map((item, ii) => <li key={ii} className="leading-relaxed">{parseInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      nodes.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 mb-3 text-gray-700 dark:text-gray-300">
          {items.map((item, ii) => <li key={ii} className="leading-relaxed">{parseInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^#{1,3}\s/) && !lines[i].includes('|') && !/^[-*+]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      nodes.push(
        <p key={key++} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
          {parseInline(paraLines.join(' '))}
        </p>
      );
    } else {
      i++;
    }
  }

  return <>{nodes}</>;
}
