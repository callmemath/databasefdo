/**
 * normative-xml.ts
 *
 * Shared utility for rendering normative topic content from a simple XML format.
 *
 * XML Schema:
 * -----------
 * <doc>
 *   <heading>Titolo</heading>
 *   <para>Testo paragrafo.</para>
 *   <entries>
 *     <entry name="Codice 0">Descrizione del codice.</entry>
 *     <entry name="Codice 1">Altra descrizione.</entry>
 *   </entries>
 *   <steps>
 *     <step title="1. Fase">
 *       <item>Voce elenco</item>
 *       <item>Altra voce</item>
 *     </step>
 *   </steps>
 *   <table cols="Colonna1,Colonna2,Colonna3">
 *     <row>Valore A|Valore B|Valore C</row>
 *     <row>Valore D|Valore E|Valore F</row>
 *   </table>
 * </doc>
 *
 * Elements:
 *   <heading>   → <h3> section heading
 *   <para>      → <p> paragraph
 *   <entries>   → list of named entry cards (code/description pairs)
 *   <steps>     → numbered/titled steps, each with bullet items
 *   <table>     → table with header columns from `cols` attribute, rows split by "|"
 *
 * Usage:
 *   import { renderXmlContent } from '@/lib/normative-xml';
 *   // Inside a 'use client' component:
 *   return <div>{renderXmlContent(topic.content)}</div>;
 */

import React from 'react';

export function renderXmlContent(xml: string): React.ReactNode {
  if (!xml || !xml.trim()) return null;

  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(xml.trim(), 'application/xml');
    // DOMParser does not throw — check for a parseerror element instead
    const parseError = doc.querySelector('parseerror');
    if (parseError) {
      throw new Error(parseError.textContent ?? 'XML parse error');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return React.createElement(
      'pre',
      { className: 'text-red-500 text-xs whitespace-pre-wrap' },
      `XML parse error: ${message}`
    );
  }

  const docEl = doc.documentElement;
  if (docEl.tagName !== 'doc') {
    return React.createElement(
      'pre',
      { className: 'text-red-500 text-xs' },
      'XML root element must be <doc>'
    );
  }

  const nodes: React.ReactNode[] = [];
  let keyCounter = 0;

  for (const child of Array.from(docEl.children)) {
    const key = keyCounter++;

    switch (child.tagName) {
      case 'heading': {
        nodes.push(
          React.createElement(
            'h3',
            {
              key,
              className:
                'text-lg font-semibold mb-3 text-gray-900 dark:text-white',
            },
            child.textContent ?? ''
          )
        );
        break;
      }

      case 'para': {
        nodes.push(
          React.createElement(
            'p',
            {
              key,
              className: 'mb-4 text-gray-700 dark:text-gray-300',
            },
            child.textContent ?? ''
          )
        );
        break;
      }

      case 'entries': {
        const entryCards = Array.from(child.children)
          .filter((e) => e.tagName === 'entry')
          .map((entry, i) => {
            const name = entry.getAttribute('name') ?? '';
            const text = entry.textContent ?? '';
            return React.createElement(
              'div',
              {
                key: i,
                className:
                  'p-3 border border-gray-200 dark:border-gray-700 rounded-md',
              },
              React.createElement(
                'div',
                {
                  className: 'font-medium text-gray-900 dark:text-white',
                },
                name
              ),
              React.createElement(
                'div',
                {
                  className: 'text-sm text-gray-600 dark:text-gray-400',
                },
                text
              )
            );
          });

        nodes.push(
          React.createElement(
            'div',
            { key, className: 'space-y-3' },
            ...entryCards
          )
        );
        break;
      }

      case 'steps': {
        const stepDivs = Array.from(child.children)
          .filter((s) => s.tagName === 'step')
          .map((step, i) => {
            const title = step.getAttribute('title') ?? '';
            const items = Array.from(step.children)
              .filter((el) => el.tagName === 'item')
              .map((item, j) =>
                React.createElement('li', { key: j }, item.textContent ?? '')
              );

            return React.createElement(
              'div',
              { key: i, className: 'mb-4' },
              React.createElement(
                'h4',
                {
                  className:
                    'font-medium text-blue-700 dark:text-blue-400 mb-2',
                },
                title
              ),
              React.createElement(
                'ul',
                {
                  className:
                    'list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300',
                },
                ...items
              )
            );
          });

        nodes.push(React.createElement('div', { key }, ...stepDivs));
        break;
      }

      case 'table': {
        const colsAttr = child.getAttribute('cols') ?? '';
        const cols = colsAttr
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);

        const theadCells = cols.map((col, i) =>
          React.createElement(
            'th',
            {
              key: i,
              className:
                'px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
            },
            col
          )
        );

        const rows = Array.from(child.children)
          .filter((r) => r.tagName === 'row')
          .map((row, ri) => {
            const cells = (row.textContent ?? '')
              .split('|')
              .map((cell, ci) =>
                React.createElement(
                  'td',
                  {
                    key: ci,
                    className: 'px-4 py-2 text-gray-900 dark:text-white',
                  },
                  cell.trim()
                )
              );
            return React.createElement(
              'tr',
              {
                key: ri,
                className:
                  ri % 2 === 0
                    ? 'bg-white dark:bg-gray-900'
                    : 'bg-gray-50 dark:bg-gray-800/50',
              },
              ...cells
            );
          });

        nodes.push(
          React.createElement(
            'div',
            { key, className: 'overflow-x-auto' },
            React.createElement(
              'table',
              {
                className:
                  'min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm',
              },
              React.createElement(
                'thead',
                { className: 'bg-gray-50 dark:bg-gray-800' },
                React.createElement('tr', {}, ...theadCells)
              ),
              React.createElement(
                'tbody',
                {
                  className:
                    'divide-y divide-gray-100 dark:divide-gray-800',
                },
                ...rows
              )
            )
          )
        );
        break;
      }

      default:
        // Unknown element — skip silently
        break;
    }
  }

  return nodes.length > 0 ? nodes : null;
}
