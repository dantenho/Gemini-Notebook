import TurndownService from 'turndown';

// Initialize Turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
});

// Add custom rules for better conversion
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: (content) => `~~${content}~~`
});

turndownService.addRule('underline', {
  filter: 'u',
  replacement: (content) => `<u>${content}</u>` // Markdown doesn't have native underline
});

turndownService.addRule('mermaid', {
  filter: (node) => {
    return node.nodeName === 'PRE' &&
           node.classList.contains('mermaid-diagram');
  },
  replacement: (content, node) => {
    const code = (node as HTMLElement).textContent || '';
    return `\`\`\`mermaid\n${code}\n\`\`\`\n\n`;
  }
});

/**
 * Convert HTML content to Markdown format
 */
export function htmlToMarkdown(html: string): string {
  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    return html; // Return original HTML if conversion fails
  }
}

/**
 * Create a safe filename from a string
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}

/**
 * Generate frontmatter for Markdown files
 */
export function generateFrontmatter(title: string, date: string, tags: string[] = []): string {
  return `---
title: ${title}
date: ${date}
tags: [${tags.join(', ')}]
---

`;
}

/**
 * Extract text content from HTML (for note descriptions)
 */
export function extractTextFromHtml(html: string, maxLength: number = 200): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const text = temp.textContent || temp.innerText || '';
  return text.length > maxLength
    ? text.substring(0, maxLength) + '...'
    : text;
}
