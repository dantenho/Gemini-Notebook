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
  TableIcon,
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
            className="w-6 h-6 rounded border border-zinc-600 hover:border-zinc-400"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
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
};

/**
 * A toolbar component for the rich text editor with formatting options.
 */
const EditorToolbar: React.FC = () => {
    const [showFontDropdown, setShowFontDropdown] = useState(false);
    const [showSizeDropdown, setShowSizeDropdown] = useState(false);
    const [showInsertDropdown, setShowInsertDropdown] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showBgColorPicker, setShowBgColorPicker] = useState(false);
    const [currentFont, setCurrentFont] = useState('Sans Serif');
    const [currentSize, setCurrentSize] = useState(15);
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
    });


    const fontDropdownRef = useRef<HTMLDivElement>(null);
    const sizeDropdownRef = useRef<HTMLDivElement>(null);
    const insertDropdownRef = useRef<HTMLDivElement>(null);
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
            if (insertDropdownRef.current && !insertDropdownRef.current.contains(event.target as Node)) {
                setShowInsertDropdown(false);
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
     * @param {string} command - The command to execute (e.g., 'bold', 'italic').
     * @param {string | null} value - The value for the command, if any (e.g., a font name or URL).
     */
    const format = (command: string, value: string | null = null) => {
        document.execCommand(command, false, value);
        updateToolbarState();
    }

    const fonts = [
        { name: 'Sans Serif', value: 'Arial, Helvetica, sans-serif' },
        { name: 'Serif', value: "'Times New Roman', Times, serif" },
        { name: 'Monospace', value: "'Courier New', Courier, monospace" }
    ];

    const fontSizes = [12, 14, 15, 16, 18, 24, 32];

    /**
     * Handles changing the font family for the selected text.
     * @param font - The selected font object.
     */
    const handleFontChange = (font: { name: string, value: string }) => {
        format('fontName', font.value);
        setCurrentFont(font.name);
        setShowFontDropdown(false);
    };

    /**
     * Handles changing the font size for the selected text.
     * @param size - The selected font size.
     */
    const handleSizeChange = (size: number) => {
        let sizeValue = '3'; // Default to 12pt/16px
        if (size <= 12) sizeValue = '2';      // 10pt
        else if (size <= 16) sizeValue = '3'; // 12pt
        else if (size <= 18) sizeValue = '4'; // 14pt
        else if (size <= 24) sizeValue = '5'; // 18pt
        else if (size <= 32) sizeValue = '6'; // 24pt
        else sizeValue = '7';                 // 36pt

        format('fontSize', sizeValue);
        setCurrentSize(size);
        setShowSizeDropdown(false);
    };

    /**
     * Handles inserting a link.
     */
    const handleInsertLink = () => {
        const url = prompt('Enter the URL:');
        if (url) {
            format('createLink', url);
        }
    };

    /**
     * Handles inserting an image.
     */
    const handleInsertImage = () => {
        const url = prompt('Enter the image URL:');
        if (url) {
            format('insertImage', url);
        }
    };

    /**
     * Handles inserting a horizontal rule.
     */
    const handleInsertHR = () => {
        format('insertHorizontalRule', null);
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
            codeElement.style.padding = '2px 6px';
            codeElement.style.borderRadius = '3px';
            codeElement.style.fontFamily = 'monospace';
            range.deleteContents();
            range.insertNode(codeElement);
        }
    };

    /**
     * Handles undo action.
     */
    const handleUndo = () => {
        document.execCommand('undo', false);
    };

    /**
     * Handles redo action.
     */
    const handleRedo = () => {
        document.execCommand('redo', false);
    };
    
    return (
        <div className="flex items-center space-x-1 p-2 border-b border-zinc-700 bg-zinc-800 flex-wrap">
            {/* Insert Dropdown */}
            <div ref={insertDropdownRef} className="relative">
                <button
                    onClick={() => setShowInsertDropdown(prev => !prev)}
                    className="flex items-center space-x-1 p-2 hover:bg-zinc-700 rounded-md"
                >
                    <span>Insert</span>
                    <ChevronDownIcon className="w-4 h-4"/>
                </button>
                {showInsertDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10 w-48">
                        <button onClick={() => { handleInsertImage(); setShowInsertDropdown(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700">Image</button>
                        <button onClick={() => { handleInsertLink(); setShowInsertDropdown(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700">Link</button>
                        <button onClick={() => { handleInsertCode(); setShowInsertDropdown(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700">Code</button>
                        <button onClick={() => { handleInsertHR(); setShowInsertDropdown(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700">Horizontal Line</button>
                        <button onClick={() => { format('insertHTML', '<table style="width: 100%; border-collapse: collapse;"><tbody><tr><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td></tr><tr><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td></tr></tbody></table><p><br></p>'); setShowInsertDropdown(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700">Table</button>
                    </div>
                )}
            </div>
            <button onClick={() => format('formatBlock', '<h1>')} title="Format as Heading" className="flex items-center space-x-1 p-2 hover:bg-zinc-700 rounded-md">
                <span className="text-sm font-semibold">H</span>
            </button>
            <button onClick={handleUndo} title="Undo" className="p-2 hover:bg-zinc-700 rounded-md"><ArrowUturnLeftIcon className="w-5 h-5" /></button>
            <button onClick={handleRedo} title="Redo" className="p-2 hover:bg-zinc-700 rounded-md"><ArrowUturnRightIcon className="w-5 h-5" /></button>
            <div className="h-6 border-l border-zinc-600 mx-2"></div>

            {/* Font Family Dropdown */}
            <div ref={fontDropdownRef} className="relative">
                <button onClick={() => setShowFontDropdown(prev => !prev)} className="flex items-center space-x-1 p-2 hover:bg-zinc-700 rounded-md w-28 justify-between">
                    <span>{currentFont}</span>
                    <ChevronDownIcon className="w-4 h-4"/>
                </button>
                {showFontDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10 w-40">
                        {fonts.map(font => (
                            <button key={font.name} onClick={() => handleFontChange(font)} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700">
                                {font.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Font Size Dropdown */}
            <div ref={sizeDropdownRef} className="relative">
                 <button onClick={() => setShowSizeDropdown(prev => !prev)} className="flex items-center space-x-1 p-2 hover:bg-zinc-700 rounded-md w-16 justify-between">
                    <span>{currentSize}</span>
                    <ChevronDownIcon className="w-4 h-4"/>
                </button>
                {showSizeDropdown && (
                     <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10">
                        {fontSizes.map(size => (
                            <button key={size} onClick={() => handleSizeChange(size)} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700">
                                {size}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-6 border-l border-zinc-600 mx-2"></div>
            
            <button onClick={() => format('bold')} title="Bold" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.bold ? 'bg-zinc-600' : ''}`}><BoldIcon className="w-5 h-5" /></button>
            <button onClick={() => format('italic')} title="Italic" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.italic ? 'bg-zinc-600' : ''}`}><ItalicIcon className="w-5 h-5" /></button>
            <button onClick={() => format('underline')} title="Underline" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.underline ? 'bg-zinc-600' : ''}`}><UnderlineIcon className="w-5 h-5" /></button>
            <button onClick={() => format('strikeThrough')} title="Strikethrough" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.strikeThrough ? 'bg-zinc-600' : ''}`}><StrikethroughIcon className="w-5 h-5" /></button>

            <div className="h-6 border-l border-zinc-600 mx-2"></div>

            <button onClick={() => format('insertUnorderedList')} title="Bulleted List" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.unorderedList ? 'bg-zinc-600' : ''}`}><ListUnorderedIcon className="w-5 h-5" /></button>
            <button onClick={() => format('insertOrderedList')} title="Numbered List" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.orderedList ? 'bg-zinc-600' : ''}`}><ListOrderedIcon className="w-5 h-5" /></button>
            <button onClick={handleInsertLink} title="Insert Link" className="p-2 hover:bg-zinc-700 rounded-md"><LinkIcon className="w-5 h-5" /></button>
            <button onClick={() => format('insertHTML', '<table style="width: 100%; border-collapse: collapse;"><tbody><tr><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td></tr><tr><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td></tr></tbody></table><p><br></p>')} title="Insert Table" className="p-2 hover:bg-zinc-700 rounded-md"><TableIcon className="w-5 h-5" /></button>

            <div className="h-6 border-l border-zinc-600 mx-2"></div>

            <button onClick={() => format('justifyLeft')} title="Align Left" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.justifyLeft ? 'bg-zinc-600' : ''}`}><AlignLeftIcon className="w-5 h-5" /></button>
            <button onClick={() => format('justifyCenter')} title="Align Center" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.justifyCenter ? 'bg-zinc-600' : ''}`}><AlignCenterIcon className="w-5 h-5" /></button>
            <button onClick={() => format('justifyRight')} title="Align Right" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.justifyRight ? 'bg-zinc-600' : ''}`}><AlignRightIcon className="w-5 h-5" /></button>

            <div className="h-6 border-l border-zinc-600 mx-2"></div>

            {/* Text Color Picker */}
            <div ref={colorPickerRef} className="relative">
                <button
                    onClick={() => setShowColorPicker(prev => !prev)}
                    title="Text Color"
                    className="p-2 hover:bg-zinc-700 rounded-md flex items-center"
                >
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold">A</span>
                        <div className="w-5 h-0.5 bg-yellow-400 mt-0.5"></div>
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
                    className="p-2 hover:bg-zinc-700 rounded-md"
                >
                    <div className="w-5 h-5 border-2 border-zinc-400 rounded" style={{ background: 'linear-gradient(to bottom, transparent 50%, #fbbf24 50%)' }}></div>
                </button>
                {showBgColorPicker && (
                    <ColorPicker
                        onSelectColor={(color) => format('backColor', color)}
                        onClose={() => setShowBgColorPicker(false)}
                    />
                )}
            </div>

            <button onClick={() => format('removeFormat', null)} title="Clear Formatting" className="p-2 hover:bg-zinc-700 rounded-md text-xs font-semibold">Clear</button>
        </div>
    );
}

/**
 * The main rich text editor component.
 * @param {object} props - The component props.
 * @param {Note | null} props.note - The currently selected note to display.
 * @param {string[]} props.notebookPath - The breadcrumb path for the current notebook.
 * @param {(noteId: string, newContent: string) => void} props.onUpdateNote - Callback to update a note's content.
 * @param {(noteId: string, newTitle: string) => void} props.onUpdateTitle - Callback to update a note's title.
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
    // This effect synchronizes the editor's content with the selected note.
    // It only updates the innerHTML if the note's content is different,
    // preventing the cursor from jumping during typing.
    if (editorRef.current && note && editorRef.current.innerHTML !== note.content) {
      editorRef.current.innerHTML = note.content;
    }
     else if (editorRef.current && !note) {
      editorRef.current.innerHTML = ''; // Clear editor if no note is selected
    }

    // Update title value when note changes
    if (note) {
      setTitleValue(note.title);
    }
  }, [note]);

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);


  // Debounced content change handler could be an improvement here.
  const handleContentChange = useCallback(() => {
    // When the user types, this function is called.
    // It reads the editor's innerHTML and calls the onUpdateNote prop.
    if (editorRef.current && note) {
      const newContent = editorRef.current.innerHTML;
      if (newContent !== note.content) {
        onUpdateNote(note.id, newContent);
      }
    }
  }, [note, onUpdateNote]);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

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