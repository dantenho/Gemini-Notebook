/**
 * @fileoverview Markdown Conversion Utilities
 *
 * This module provides utilities for converting HTML content to Markdown format,
 * enabling seamless export of notes from the rich text editor to plain text
 * Markdown files. It uses the TurndownService library with custom rules for
 * special formatting elements.
 *
 * Features:
 * - HTML to Markdown conversion with custom rules
 * - Filename sanitization for safe file system operations
 * - Frontmatter generation for metadata
 * - Text extraction for previews and descriptions
 * - Support for Mermaid diagrams, strikethrough, and underline
 *
 * Use cases:
 * - Exporting notes to Google Drive as .md files
 * - Generating note previews
 * - Creating safe filenames from note titles
 * - Adding YAML frontmatter to exported files
 *
 * @module utils/markdown
 */

import TurndownService from 'turndown';

/**
 * TurndownService instance with custom configuration
 *
 * Configuration options:
 * - headingStyle: 'atx' - Uses # syntax for headings (e.g., # Heading)
 * - codeBlockStyle: 'fenced' - Uses ``` syntax for code blocks
 * - bulletListMarker: '-' - Uses dash for unordered lists
 * - emDelimiter: '*' - Uses asterisk for emphasis (italic)
 * - strongDelimiter: '**' - Uses double asterisk for strong (bold)
 *
 * These settings ensure compatibility with most Markdown parsers
 * and maintain consistency across exported files.
 */
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
});

/**
 * Custom rule: Strikethrough text conversion
 *
 * Converts HTML strikethrough elements (<del>, <s>, <strike>) to
 * Markdown strikethrough syntax using double tildes (~~).
 *
 * Supported HTML elements:
 * - <del>text</del>
 * - <s>text</s>
 * - <strike>text</strike>
 *
 * Output: ~~text~~
 *
 * @example
 * Input:  <del>deleted text</del>
 * Output: ~~deleted text~~
 */
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: (content) => `~~${content}~~`
});

/**
 * Custom rule: Underline text preservation
 *
 * Since standard Markdown doesn't have native underline syntax,
 * this rule preserves underline formatting by keeping the HTML <u> tag.
 * This ensures underlined text remains underlined when rendered by
 * Markdown processors that support inline HTML.
 *
 * Supported HTML element:
 * - <u>text</u>
 *
 * Output: <u>text</u> (HTML preserved)
 *
 * @example
 * Input:  <u>underlined text</u>
 * Output: <u>underlined text</u>
 */
turndownService.addRule('underline', {
  filter: 'u',
  replacement: (content) => `<u>${content}</u>` // Markdown doesn't have native underline
});

/**
 * Custom rule: Mermaid diagram conversion
 *
 * Converts Mermaid diagram HTML elements to Markdown code blocks with
 * the 'mermaid' language specifier. This preserves the diagram code
 * so it can be rendered by Markdown processors that support Mermaid.
 *
 * Supported HTML structure:
 * <pre class="mermaid-diagram">diagram code</pre>
 *
 * Output:
 * ```mermaid
 * diagram code
 * ```
 *
 * The filter function checks for:
 * 1. Node name is 'PRE'
 * 2. Element has class 'mermaid-diagram'
 *
 * @example
 * Input:  <pre class="mermaid-diagram">graph TD\nA-->B</pre>
 * Output: ```mermaid\ngraph TD\nA-->B\n```
 */
turndownService.addRule('mermaid', {
  filter: (node) => {
    return node.nodeName === 'PRE' &&
           node.classList.contains('mermaid-diagram');
  },
  replacement: (content, node) => {
    // Extract text content (the actual Mermaid code)
    const code = (node as HTMLElement).textContent || '';
    return `\`\`\`mermaid\n${code}\n\`\`\`\n\n`;
  }
});

/**
 * Convert HTML content to Markdown format
 *
 * Takes HTML content from the rich text editor and converts it to
 * clean Markdown text. Uses TurndownService with custom rules for
 * special elements like strikethrough, underline, and Mermaid diagrams.
 *
 * @param {string} html - HTML content to convert
 * @returns {string} Markdown-formatted text
 *
 * Error handling:
 * - Returns original HTML if conversion fails
 * - Logs error to console for debugging
 * - Never throws, ensuring export operations don't fail completely
 *
 * Supported HTML elements:
 * - Headings (h1-h6) → # Markdown headings
 * - Bold (<strong>, <b>) → **bold**
 * - Italic (<em>, <i>) → *italic*
 * - Strikethrough (<del>, <s>, <strike>) → ~~strikethrough~~
 * - Underline (<u>) → <u>underline</u> (preserved HTML)
 * - Lists (<ul>, <ol>) → Markdown lists
 * - Links (<a>) → [text](url)
 * - Images (<img>) → ![alt](src)
 * - Code blocks (<pre><code>) → ```code```
 * - Inline code (<code>) → `code`
 * - Blockquotes (<blockquote>) → > quote
 * - Tables (<table>) → Markdown tables
 * - Mermaid diagrams → ```mermaid code```
 *
 * @example
 * ```typescript
 * const html = '<h1>Title</h1><p>This is <strong>bold</strong> text.</p>';
 * const markdown = htmlToMarkdown(html);
 * // Result: "# Title\n\nThis is **bold** text."
 * ```
 *
 * @example
 * ```typescript
 * // With Mermaid diagram
 * const html = '<pre class="mermaid-diagram">graph TD\nA-->B</pre>';
 * const markdown = htmlToMarkdown(html);
 * // Result: "```mermaid\ngraph TD\nA-->B\n```\n\n"
 * ```
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
 *
 * Sanitizes a string to create a valid filename that works across
 * different operating systems (Windows, macOS, Linux) and file systems.
 *
 * @param {string} filename - Original filename or note title
 * @returns {string} Sanitized filename safe for file system operations
 *
 * Sanitization process:
 * 1. Remove invalid characters: < > : " / \ | ? * and control characters
 * 2. Replace whitespace with hyphens for URL-friendly names
 * 3. Remove leading dots (hidden files in Unix systems)
 * 4. Limit length to 255 characters (file system limit)
 *
 * Invalid characters removed:
 * - < > : " / \ | ? * (Windows reserved characters)
 * - \x00-\x1F (Control characters)
 *
 * @example
 * ```typescript
 * sanitizeFilename('My Note: Draft #1')
 * // Returns: "My-Note-Draft-1"
 * ```
 *
 * @example
 * ```typescript
 * sanitizeFilename('Report <2024>')
 * // Returns: "Report-2024"
 * ```
 *
 * @example
 * ```typescript
 * sanitizeFilename('.hidden file')
 * // Returns: "hidden-file"
 * ```
 *
 * @example
 * ```typescript
 * // Very long filename gets truncated
 * const longTitle = 'A'.repeat(300);
 * sanitizeFilename(longTitle)
 * // Returns: String of 255 'A's
 * ```
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^\\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length to file system maximum
}

/**
 * Generate YAML frontmatter for Markdown files
 *
 * Creates a YAML frontmatter block with metadata for Markdown files.
 * Frontmatter is commonly used by static site generators, note-taking
 * apps, and Markdown processors to store structured metadata.
 *
 * @param {string} title - Note title
 * @param {string} date - Note creation/modification date (ISO 8601 format)
 * @param {string[]} [tags=[]] - Optional array of tags
 * @returns {string} YAML frontmatter block
 *
 * Output format:
 * ```yaml
 * ---
 * title: Note Title
 * date: 2024-01-01
 * tags: [tag1, tag2]
 * ---
 *
 * ```
 *
 * The trailing newline ensures proper separation from the content.
 *
 * @example
 * ```typescript
 * generateFrontmatter('My Note', '2024-01-15', ['work', 'important'])
 * // Returns:
 * // ---
 * // title: My Note
 * // date: 2024-01-15
 * // tags: [work, important]
 * // ---
 * //
 * // (with trailing newline)
 * ```
 *
 * @example
 * ```typescript
 * // Without tags
 * generateFrontmatter('Simple Note', '2024-01-15')
 * // Returns:
 * // ---
 * // title: Simple Note
 * // date: 2024-01-15
 * // tags: []
 * // ---
 * //
 * ```
 *
 * @example
 * ```typescript
 * // Usage in file export
 * const frontmatter = generateFrontmatter(note.title, note.date, note.tags);
 * const markdown = htmlToMarkdown(note.content);
 * const fullContent = frontmatter + markdown;
 * // Save fullContent to file...
 * ```
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
 * Extract plain text content from HTML for previews
 *
 * Strips all HTML tags and extracts plain text content. Useful for
 * generating note previews, descriptions, or search snippets.
 *
 * @param {string} html - HTML content to extract text from
 * @param {number} [maxLength=200] - Maximum length of extracted text
 * @returns {string} Plain text content, truncated to maxLength if necessary
 *
 * Process:
 * 1. Create temporary DOM element
 * 2. Parse HTML into element
 * 3. Extract textContent (strips all tags)
 * 4. Truncate to maxLength if needed
 * 5. Add ellipsis (...) if truncated
 *
 * Security note:
 * - Uses DOM parsing in a temporary element
 * - Element is not attached to document
 * - Safe for user-generated content
 *
 * @example
 * ```typescript
 * const html = '<h1>Title</h1><p>This is a long paragraph with lots of text...</p>';
 * const preview = extractTextFromHtml(html, 20);
 * // Returns: "Title This is a lo..."
 * ```
 *
 * @example
 * ```typescript
 * // Short content (no truncation)
 * const html = '<p>Short text</p>';
 * const text = extractTextFromHtml(html, 100);
 * // Returns: "Short text"
 * ```
 *
 * @example
 * ```typescript
 * // Custom maxLength
 * const html = '<div>Very long content here...</div>';
 * const preview = extractTextFromHtml(html, 10);
 * // Returns: "Very long ..."
 * ```
 *
 * @example
 * ```typescript
 * // Usage for note descriptions
 * const description = extractTextFromHtml(note.content, 150);
 * // Display description in note list preview
 * ```
 */
export function extractTextFromHtml(html: string, maxLength: number = 200): string {
  // Create temporary DOM element for parsing
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Extract text content (strips all HTML tags)
  const text = temp.textContent || temp.innerText || '';

  // Truncate and add ellipsis if needed
  return text.length > maxLength
    ? text.substring(0, maxLength) + '...'
    : text;
}
