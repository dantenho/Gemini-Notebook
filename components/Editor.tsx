import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Note } from '../types';
import {
  MoreIconHorizontal,
  ChevronRightIcon,
  ChevronDownIcon,
  CheckIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  ListOrderedIcon,
  ListUnorderedIcon,
  LinkIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  TableIcon,
  IndentIncreaseIcon,
  IndentDecreaseIcon,
  QuoteIcon,
  SubscriptIcon,
  SuperscriptIcon,
} from '../constants';

// Color picker component
const ColorPicker: React.FC<{ onSelectColor: (color: string) => void; onClose: () => void }> = ({ onSelectColor, onClose }) => {
  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  ];

  return (
    <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-20 p-2">
      <div className="grid grid-cols-10 gap-1 w-64">
        {colors.map(color => (
          <button
            key={color}
            onClick={() => {
              onSelectColor(color);
              onClose();
            }}
            className="w-6 h-6 rounded border border-zinc-600 hover:border-zinc-400 transition-colors"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};

// Table options component
const TableOptions: React.FC<{ onSelectTable: (rows: number, cols: number) => void; onClose: () => void }> = ({ onSelectTable, onClose }) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const maxRows = 8;
  const maxCols = 8;

  const handleCellClick = (row: number, col: number) => {
    onSelectTable(row + 1, col + 1);
    onClose();
  };

  return (
    <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-20 p-3">
      <div className="mb-2 text-xs text-zinc-400 text-center">
        {hoveredCell ? `${hoveredCell.row + 1} × ${hoveredCell.col + 1}` : 'Select table size'}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}>
        {Array.from({ length: maxRows * maxCols }).map((_, index) => {
          const row = Math.floor(index / maxCols);
          const col = index % maxCols;
          const isHighlighted = hoveredCell && row <= hoveredCell.row && col <= hoveredCell.col;

          return (
            <div
              key={index}
              className={`w-5 h-5 border border-zinc-600 cursor-pointer transition-colors ${
                isHighlighted ? 'bg-blue-600' : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
              onMouseEnter={() => setHoveredCell({ row, col })}
              onClick={() => handleCellClick(row, col)}
            />
          );
        })}
      </div>
    </div>
  );
};

type ToolbarState = {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikeThrough: boolean;
    orderedList: boolean;
    unorderedList: boolean;
    justifyLeft: boolean;
    justifyCenter: boolean;
    justifyRight: boolean;
    justifyFull: boolean;
    subscript: boolean;
    superscript: boolean;
};

/**
 * A comprehensive toolbar component for the rich text editor with extensive formatting options.
 */
const EditorToolbar: React.FC = () => {
    const [showFontDropdown, setShowFontDropdown] = useState(false);
    const [showSizeDropdown, setShowSizeDropdown] = useState(false);
    const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
    const [showLineHeightDropdown, setShowLineHeightDropdown] = useState(false);
    const [showInsertDropdown, setShowInsertDropdown] = useState(false);
    const [showTableOptions, setShowTableOptions] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showBgColorPicker, setShowBgColorPicker] = useState(false);
    const [currentFont, setCurrentFont] = useState('Arial');
    const [currentSize, setCurrentSize] = useState(16);
    const [currentLineHeight, setCurrentLineHeight] = useState(1.6);
    const [toolbarState, setToolbarState] = useState<ToolbarState>({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        orderedList: false,
        unorderedList: false,
        justifyLeft: true,
        justifyCenter: false,
        justifyRight: false,
        justifyFull: false,
        subscript: false,
        superscript: false,
    });

    const fontDropdownRef = useRef<HTMLDivElement>(null);
    const sizeDropdownRef = useRef<HTMLDivElement>(null);
    const headingDropdownRef = useRef<HTMLDivElement>(null);
    const lineHeightDropdownRef = useRef<HTMLDivElement>(null);
    const insertDropdownRef = useRef<HTMLDivElement>(null);
    const tableOptionsRef = useRef<HTMLDivElement>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);
    const bgColorPickerRef = useRef<HTMLDivElement>(null);

    /**
     * Queries the document for the current selection's command states and updates the toolbar UI.
     */
    const updateToolbarState = useCallback(() => {
        setToolbarState({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough'),
            orderedList: document.queryCommandState('insertOrderedList'),
            unorderedList: document.queryCommandState('insertUnorderedList'),
            justifyLeft: document.queryCommandState('justifyLeft'),
            justifyCenter: document.queryCommandState('justifyCenter'),
            justifyRight: document.queryCommandState('justifyRight'),
            justifyFull: document.queryCommandState('justifyFull'),
            subscript: document.queryCommandState('subscript'),
            superscript: document.queryCommandState('superscript'),
        });
    }, []);

    /**
     * Effect to listen for selection changes and update the toolbar state accordingly.
     */
    useEffect(() => {
        const handleSelectionChange = () => {
            updateToolbarState();
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [updateToolbarState]);

    /**
     * Effect to handle clicks outside of dropdowns to close them.
     */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
                setShowFontDropdown(false);
            }
            if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
                setShowSizeDropdown(false);
            }
            if (headingDropdownRef.current && !headingDropdownRef.current.contains(event.target as Node)) {
                setShowHeadingDropdown(false);
            }
            if (lineHeightDropdownRef.current && !lineHeightDropdownRef.current.contains(event.target as Node)) {
                setShowLineHeightDropdown(false);
            }
            if (insertDropdownRef.current && !insertDropdownRef.current.contains(event.target as Node)) {
                setShowInsertDropdown(false);
            }
            if (tableOptionsRef.current && !tableOptionsRef.current.contains(event.target as Node)) {
                setShowTableOptions(false);
            }
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setShowColorPicker(false);
            }
            if (bgColorPickerRef.current && !bgColorPickerRef.current.contains(event.target as Node)) {
                setShowBgColorPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    /**
     * Executes a document command to apply formatting to the selected text.
     */
    const format = (command: string, value: string | null = null) => {
        document.execCommand(command, false, value);
        updateToolbarState();
    }

    // Extended font list with web-safe and Google Fonts
    const fonts = [
        { name: 'Arial', value: 'Arial, Helvetica, sans-serif' },
        { name: 'Times New Roman', value: "'Times New Roman', Times, serif" },
        { name: 'Courier New', value: "'Courier New', Courier, monospace" },
        { name: 'Georgia', value: "Georgia, serif" },
        { name: 'Verdana', value: "Verdana, Geneva, sans-serif" },
        { name: 'Comic Sans', value: "'Comic Sans MS', cursive" },
        { name: 'Impact', value: "Impact, Charcoal, sans-serif" },
        { name: 'Trebuchet', value: "'Trebuchet MS', Helvetica, sans-serif" },
        { name: 'Palatino', value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
        { name: 'Garamond', value: "Garamond, serif" },
    ];

    // Extended font sizes
    const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96];

    // Line height options
    const lineHeights = [
        { name: 'Single', value: 1.0 },
        { name: '1.15', value: 1.15 },
        { name: '1.5', value: 1.5 },
        { name: '1.6', value: 1.6 },
        { name: 'Double', value: 2.0 },
        { name: '2.5', value: 2.5 },
        { name: '3.0', value: 3.0 },
    ];

    // Heading options
    const headings = [
        { name: 'Normal', tag: 'p' },
        { name: 'Heading 1', tag: 'h1' },
        { name: 'Heading 2', tag: 'h2' },
        { name: 'Heading 3', tag: 'h3' },
        { name: 'Heading 4', tag: 'h4' },
        { name: 'Heading 5', tag: 'h5' },
        { name: 'Heading 6', tag: 'h6' },
    ];

    /**
     * Handles changing the font family for the selected text.
     */
    const handleFontChange = (font: { name: string, value: string }) => {
        format('fontName', font.value);
        setCurrentFont(font.name);
        setShowFontDropdown(false);
    };

    /**
     * Handles changing the font size for the selected text.
     */
    const handleSizeChange = (size: number) => {
        // Use CSS style instead of deprecated font size
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.fontSize = `${size}px`;

            try {
                range.surroundContents(span);
            } catch {
                // If surroundContents fails, use insertHTML
                const selectedText = range.toString();
                format('insertHTML', `<span style="font-size: ${size}px">${selectedText}</span>`);
            }
        }
        setCurrentSize(size);
        setShowSizeDropdown(false);
    };

    /**
     * Handles changing heading format.
     */
    const handleHeadingChange = (tag: string) => {
        format('formatBlock', `<${tag}>`);
        setShowHeadingDropdown(false);
    };

    /**
     * Handles changing line height.
     */
    const handleLineHeightChange = (lineHeight: number) => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const parentElement = container.nodeType === Node.TEXT_NODE
                ? container.parentElement
                : container as HTMLElement;

            if (parentElement) {
                let blockElement = parentElement.closest('p, h1, h2, h3, h4, h5, h6, div, li');
                if (blockElement) {
                    (blockElement as HTMLElement).style.lineHeight = lineHeight.toString();
                }
            }
        }
        setCurrentLineHeight(lineHeight);
        setShowLineHeightDropdown(false);
    };

    /**
     * Handles inserting a link.
     */
    const handleInsertLink = () => {
        const url = prompt('Enter the URL:');
        if (url) {
            format('createLink', url);
        }
        setShowInsertDropdown(false);
    };

    /**
     * Handles inserting an image.
     */
    const handleInsertImage = () => {
        const url = prompt('Enter the image URL:');
        if (url) {
            format('insertImage', url);
        }
        setShowInsertDropdown(false);
    };

    /**
     * Handles inserting a horizontal rule.
     */
    const handleInsertHR = () => {
        format('insertHorizontalRule', null);
        setShowInsertDropdown(false);
    };

    /**
     * Handles inserting code block.
     */
    const handleInsertCode = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            const codeElement = document.createElement('code');
            codeElement.textContent = selectedText || 'code';
            codeElement.style.backgroundColor = '#27272a';
            codeElement.style.color = '#a1a1aa';
            codeElement.style.padding = '2px 6px';
            codeElement.style.borderRadius = '4px';
            codeElement.style.fontFamily = 'monospace';
            codeElement.style.fontSize = '0.9em';
            range.deleteContents();
            range.insertNode(codeElement);
        }
        setShowInsertDropdown(false);
    };

    /**
     * Handles inserting a blockquote.
     */
    const handleInsertBlockquote = () => {
        format('formatBlock', '<blockquote>');
        // Apply custom styling
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const blockquote = range.commonAncestorContainer.parentElement?.closest('blockquote') as HTMLElement;
            if (blockquote) {
                blockquote.style.borderLeft = '4px solid #3b82f6';
                blockquote.style.paddingLeft = '16px';
                blockquote.style.marginLeft = '0';
                blockquote.style.fontStyle = 'italic';
                blockquote.style.color = '#a1a1aa';
            }
        }
        setShowInsertDropdown(false);
    };

    /**
     * Handles inserting a table.
     */
    const handleInsertTable = (rows: number, cols: number) => {
        let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tbody>';

        for (let i = 0; i < rows; i++) {
            tableHTML += '<tr>';
            for (let j = 0; j < cols; j++) {
                tableHTML += '<td style="border: 1px solid #52525b; padding: 8px; min-width: 50px;">&nbsp;</td>';
            }
            tableHTML += '</tr>';
        }

        tableHTML += '</tbody></table><p><br></p>';
        format('insertHTML', tableHTML);
        setShowTableOptions(false);
    };

    /**
     * Handles undo/redo actions.
     */
    const handleUndo = () => document.execCommand('undo', false);
    const handleRedo = () => document.execCommand('redo', false);

    return (
        <div className="flex items-center space-x-1 p-2 border-b border-zinc-700 bg-zinc-800/50 flex-wrap gap-y-1">
            {/* Undo/Redo */}
            <button onClick={handleUndo} title="Undo (Ctrl+Z)" className="p-2 hover:bg-zinc-700 rounded-md transition-colors">
                <ArrowUturnLeftIcon className="w-4 h-4" />
            </button>
            <button onClick={handleRedo} title="Redo (Ctrl+Y)" className="p-2 hover:bg-zinc-700 rounded-md transition-colors">
                <ArrowUturnRightIcon className="w-4 h-4" />
            </button>

            <div className="h-6 border-l border-zinc-600 mx-1"></div>

            {/* Heading Dropdown */}
            <div ref={headingDropdownRef} className="relative">
                <button
                    onClick={() => setShowHeadingDropdown(prev => !prev)}
                    className="flex items-center space-x-1 px-2 py-1.5 hover:bg-zinc-700 rounded-md text-sm transition-colors"
                    title="Text Style"
                >
                    <span className="font-medium">¶</span>
                    <ChevronDownIcon className="w-3 h-3"/>
                </button>
                {showHeadingDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10 w-40">
                        {headings.map(heading => (
                            <button
                                key={heading.tag}
                                onClick={() => handleHeadingChange(heading.tag)}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors"
                            >
                                {heading.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Font Family Dropdown */}
            <div ref={fontDropdownRef} className="relative">
                <button
                    onClick={() => setShowFontDropdown(prev => !prev)}
                    className="flex items-center space-x-1 px-2 py-1.5 hover:bg-zinc-700 rounded-md w-32 justify-between text-sm transition-colors"
                    title="Font Family"
                >
                    <span className="truncate">{currentFont}</span>
                    <ChevronDownIcon className="w-3 h-3 flex-shrink-0"/>
                </button>
                {showFontDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10 w-48 max-h-64 overflow-y-auto">
                        {fonts.map(font => (
                            <button
                                key={font.name}
                                onClick={() => handleFontChange(font)}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors"
                                style={{ fontFamily: font.value }}
                            >
                                {font.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Font Size Dropdown */}
            <div ref={sizeDropdownRef} className="relative">
                <button
                    onClick={() => setShowSizeDropdown(prev => !prev)}
                    className="flex items-center space-x-1 px-2 py-1.5 hover:bg-zinc-700 rounded-md w-16 justify-between text-sm transition-colors"
                    title="Font Size"
                >
                    <span>{currentSize}</span>
                    <ChevronDownIcon className="w-3 h-3"/>
                </button>
                {showSizeDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                        {fontSizes.map(size => (
                            <button
                                key={size}
                                onClick={() => handleSizeChange(size)}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors"
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Line Height Dropdown */}
            <div ref={lineHeightDropdownRef} className="relative">
                <button
                    onClick={() => setShowLineHeightDropdown(prev => !prev)}
                    className="flex items-center space-x-1 px-2 py-1.5 hover:bg-zinc-700 rounded-md text-sm transition-colors"
                    title="Line Spacing"
                >
                    <span className="text-xs">⇅</span>
                    <ChevronDownIcon className="w-3 h-3"/>
                </button>
                {showLineHeightDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10 w-32">
                        {lineHeights.map(lh => (
                            <button
                                key={lh.value}
                                onClick={() => handleLineHeightChange(lh.value)}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors"
                            >
                                {lh.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-6 border-l border-zinc-600 mx-1"></div>

            {/* Text Formatting */}
            <button
                onClick={() => format('bold')}
                title="Bold (Ctrl+B)"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.bold ? 'bg-zinc-600' : ''}`}
            >
                <BoldIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => format('italic')}
                title="Italic (Ctrl+I)"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.italic ? 'bg-zinc-600' : ''}`}
            >
                <ItalicIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => format('underline')}
                title="Underline (Ctrl+U)"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.underline ? 'bg-zinc-600' : ''}`}
            >
                <UnderlineIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => format('strikeThrough')}
                title="Strikethrough"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.strikeThrough ? 'bg-zinc-600' : ''}`}
            >
                <StrikethroughIcon className="w-4 h-4" />
            </button>

            <div className="h-6 border-l border-zinc-600 mx-1"></div>

            {/* Text Color Picker */}
            <div ref={colorPickerRef} className="relative">
                <button
                    onClick={() => setShowColorPicker(prev => !prev)}
                    title="Text Color"
                    className="p-2 hover:bg-zinc-700 rounded-md flex items-center transition-colors"
                >
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold">A</span>
                        <div className="w-4 h-0.5 bg-blue-400 mt-0.5"></div>
                    </div>
                </button>
                {showColorPicker && (
                    <ColorPicker
                        onSelectColor={(color) => format('foreColor', color)}
                        onClose={() => setShowColorPicker(false)}
                    />
                )}
            </div>

            {/* Background Color Picker */}
            <div ref={bgColorPickerRef} className="relative">
                <button
                    onClick={() => setShowBgColorPicker(prev => !prev)}
                    title="Background Color"
                    className="p-2 hover:bg-zinc-700 rounded-md transition-colors"
                >
                    <div className="w-4 h-4 border-2 border-zinc-400 rounded" style={{ background: 'linear-gradient(to bottom, transparent 50%, #fbbf24 50%)' }}></div>
                </button>
                {showBgColorPicker && (
                    <ColorPicker
                        onSelectColor={(color) => format('backColor', color)}
                        onClose={() => setShowBgColorPicker(false)}
                    />
                )}
            </div>

            <div className="h-6 border-l border-zinc-600 mx-1"></div>

            {/* Lists */}
            <button
                onClick={() => format('insertUnorderedList')}
                title="Bulleted List"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.unorderedList ? 'bg-zinc-600' : ''}`}
            >
                <ListUnorderedIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => format('insertOrderedList')}
                title="Numbered List"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.orderedList ? 'bg-zinc-600' : ''}`}
            >
                <ListOrderedIcon className="w-4 h-4" />
            </button>

            {/* Indentation */}
            <button
                onClick={() => format('indent')}
                title="Increase Indent"
                className="p-2 hover:bg-zinc-700 rounded-md transition-colors"
            >
                <IndentIncreaseIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => format('outdent')}
                title="Decrease Indent"
                className="p-2 hover:bg-zinc-700 rounded-md transition-colors"
            >
                <IndentDecreaseIcon className="w-4 h-4" />
            </button>

            <div className="h-6 border-l border-zinc-600 mx-1"></div>

            {/* Alignment */}
            <button
                onClick={() => format('justifyLeft')}
                title="Align Left"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.justifyLeft ? 'bg-zinc-600' : ''}`}
            >
                <AlignLeftIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => format('justifyCenter')}
                title="Align Center"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.justifyCenter ? 'bg-zinc-600' : ''}`}
            >
                <AlignCenterIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => format('justifyRight')}
                title="Align Right"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.justifyRight ? 'bg-zinc-600' : ''}`}
            >
                <AlignRightIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => format('justifyFull')}
                title="Justify"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.justifyFull ? 'bg-zinc-600' : ''}`}
            >
                <AlignJustifyIcon className="w-4 h-4" />
            </button>

            <div className="h-6 border-l border-zinc-600 mx-1"></div>

            {/* Subscript/Superscript */}
            <button
                onClick={() => format('subscript')}
                title="Subscript"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.subscript ? 'bg-zinc-600' : ''}`}
            >
                <SubscriptIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => format('superscript')}
                title="Superscript"
                className={`p-2 hover:bg-zinc-700 rounded-md transition-colors ${toolbarState.superscript ? 'bg-zinc-600' : ''}`}
            >
                <SuperscriptIcon className="w-4 h-4" />
            </button>

            <div className="h-6 border-l border-zinc-600 mx-1"></div>

            {/* Insert Dropdown */}
            <div ref={insertDropdownRef} className="relative">
                <button
                    onClick={() => setShowInsertDropdown(prev => !prev)}
                    className="flex items-center space-x-1 px-2 py-1.5 hover:bg-zinc-700 rounded-md text-sm transition-colors"
                    title="Insert"
                >
                    <span>Insert</span>
                    <ChevronDownIcon className="w-3 h-3"/>
                </button>
                {showInsertDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10 w-48">
                        <button onClick={handleInsertLink} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors">
                            <LinkIcon className="w-4 h-4 inline mr-2" />Link
                        </button>
                        <button onClick={handleInsertImage} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors">
                            <span className="inline-block w-4 h-4 mr-2">🖼️</span>Image
                        </button>
                        <button onClick={() => { setShowInsertDropdown(false); setShowTableOptions(true); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors">
                            <TableIcon className="w-4 h-4 inline mr-2" />Table
                        </button>
                        <button onClick={handleInsertBlockquote} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors">
                            <QuoteIcon className="w-4 h-4 inline mr-2" />Quote
                        </button>
                        <button onClick={handleInsertCode} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors">
                            <span className="inline-block w-4 h-4 mr-2 font-mono text-xs">&lt;/&gt;</span>Code
                        </button>
                        <button onClick={handleInsertHR} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors">
                            <span className="inline-block w-4 h-4 mr-2">—</span>Horizontal Line
                        </button>
                    </div>
                )}
            </div>

            {/* Table Options */}
            <div ref={tableOptionsRef} className="relative">
                {showTableOptions && (
                    <TableOptions
                        onSelectTable={handleInsertTable}
                        onClose={() => setShowTableOptions(false)}
                    />
                )}
            </div>

            <div className="h-6 border-l border-zinc-600 mx-1"></div>

            <button
                onClick={() => format('removeFormat', null)}
                title="Clear Formatting"
                className="px-2 py-1.5 hover:bg-zinc-700 rounded-md text-xs font-semibold transition-colors"
            >
                Clear
            </button>
        </div>
    );
}

/**
 * The main rich text editor component.
 */
const Editor: React.FC<{
    note: Note | null;
    notebookPath: string[];
    onUpdateNote: (noteId: string, newContent: string) => void;
    onUpdateTitle?: (noteId: string, newTitle: string) => void;
}> = ({ note, notebookPath, onUpdateNote, onUpdateTitle }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && note && editorRef.current.innerHTML !== note.content) {
      editorRef.current.innerHTML = note.content;
    } else if (editorRef.current && !note) {
      editorRef.current.innerHTML = '';
    }

    if (note) {
      setTitleValue(note.title);
    }
  }, [note]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current && note) {
      const newContent = editorRef.current.innerHTML;
      if (newContent !== note.content) {
        onUpdateNote(note.id, newContent);
      }
    }
  }, [note, onUpdateNote]);

  const handleTitleClick = () => setIsEditingTitle(true);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (note && onUpdateTitle && titleValue.trim() !== '' && titleValue !== note.title) {
      onUpdateTitle(note.id, titleValue.trim());
    } else if (titleValue.trim() === '') {
      setTitleValue(note?.title || 'Untitled');
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setTitleValue(note?.title || '');
      setIsEditingTitle(false);
    }
  };

  if (!note) {
    return (
        <div className="flex-1 flex flex-col h-full bg-zinc-900">
             <div className="p-2.5 border-b border-zinc-700 h-[45px]"></div>
             <EditorToolbar />
             <div className="flex-1 flex items-center justify-center text-zinc-500">
                 Select a note to view or create a new one.
             </div>
        </div>
    );
  }

  const showPlaceholder = !note.content || note.content.replace(/<[^>]*>/g, '').trim().length === 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-900">
      <header className="p-2.5 border-b border-zinc-700 flex-shrink-0">
        <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-zinc-400">
                {notebookPath.map((part, index) => (
                    <React.Fragment key={index}>
                         {index > 0 && <ChevronRightIcon className="w-4 h-4 mx-1 text-zinc-600" />}
                        <span className={index === notebookPath.length - 1 ? "text-zinc-100" : ""}>{part}</span>
                    </React.Fragment>
                ))}
                 <ChevronRightIcon className="w-4 h-4 mx-1 text-zinc-600" />
                 {isEditingTitle ? (
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={titleValue}
                        onChange={handleTitleChange}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        className="bg-zinc-800 text-zinc-100 font-semibold px-2 py-1 rounded border border-zinc-600 focus:outline-none focus:border-blue-500"
                        style={{ minWidth: '150px' }}
                    />
                 ) : (
                    <span
                        onClick={handleTitleClick}
                        className="text-zinc-100 font-semibold cursor-pointer hover:bg-zinc-800 px-2 py-1 rounded"
                        title="Click to edit title"
                    >
                        {note.title}
                    </span>
                 )}
            </div>
            <div className="flex items-center space-x-2">
                <button className="p-1 text-zinc-400 hover:bg-zinc-700 rounded"><MoreIconHorizontal className="w-5 h-5" /></button>
            </div>
        </div>
      </header>
      <EditorToolbar />
      <div className="flex-1 overflow-y-auto relative">
          <div
            ref={editorRef}
            contentEditable={true}
            onInput={handleContentChange}
            className="prose prose-invert max-w-none w-full h-full p-8 md:p-12 lg:p-16 focus:outline-none text-zinc-300"
            style={{
                '--tw-prose-body': '#d4d4d8',
                '--tw-prose-headings': '#f4f4f5',
                '--tw-prose-bold': '#f4f4f5',
                '--tw-prose-bullets': '#71717a',
                '--tw-prose-a': '#60a5fa',
            } as React.CSSProperties}
          />
          {showPlaceholder && (
             <div className="absolute top-8 md:top-12 lg:top-16 left-8 md:left-12 lg:left-16 text-zinc-500 pointer-events-none">
                Start writing here...
            </div>
          )}
      </div>
    </div>
  );
};

export default Editor;
