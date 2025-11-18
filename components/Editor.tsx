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

const EditorToolbar: React.FC = () => {
    const [showFontDropdown, setShowFontDropdown] = useState(false);
    const [showSizeDropdown, setShowSizeDropdown] = useState(false);
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

    useEffect(() => {
        const handleSelectionChange = () => {
            updateToolbarState();
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [updateToolbarState]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
                setShowFontDropdown(false);
            }
            if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
                setShowSizeDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    const handleFontChange = (font: { name: string, value: string }) => {
        format('fontName', font.value);
        setCurrentFont(font.name);
        setShowFontDropdown(false);
    };

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
    
    return (
        <div className="flex items-center space-x-1 p-2 border-b border-zinc-700 bg-zinc-800 flex-wrap">
            <button className="flex items-center space-x-1 p-2 hover:bg-zinc-700 rounded-md">
                <span>Inserir</span>
                <ChevronDownIcon className="w-4 h-4"/>
            </button>
            <button className="flex items-center space-x-1 p-2 hover:bg-zinc-700 rounded-md">
                <CheckIcon className="w-4 h-4 text-green-400"/>
            </button>
            <button className="p-2 hover:bg-zinc-700 rounded-md"><ArrowUturnLeftIcon className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-zinc-700 rounded-md"><ArrowUturnRightIcon className="w-5 h-5" /></button>
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
            <button className="p-2 hover:bg-zinc-700 rounded-md"><LinkIcon className="w-5 h-5" /></button>
            <button onClick={() => format('insertHTML', '<table style="width: 100%; border-collapse: collapse;"><tbody><tr><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td></tr><tr><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td><td style="border: 1px solid #52525b; padding: 8px;">&nbsp;</td></tr></tbody></table><p><br></p>')} title="Insert Table" className="p-2 hover:bg-zinc-700 rounded-md"><TableIcon className="w-5 h-5" /></button>

            <div className="h-6 border-l border-zinc-600 mx-2"></div>

            <button onClick={() => format('justifyLeft')} title="Align Left" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.justifyLeft ? 'bg-zinc-600' : ''}`}><AlignLeftIcon className="w-5 h-5" /></button>
            <button onClick={() => format('justifyCenter')} title="Align Center" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.justifyCenter ? 'bg-zinc-600' : ''}`}><AlignCenterIcon className="w-5 h-5" /></button>
            <button onClick={() => format('justifyRight')} title="Align Right" className={`p-2 hover:bg-zinc-700 rounded-md ${toolbarState.justifyRight ? 'bg-zinc-600' : ''}`}><AlignRightIcon className="w-5 h-5" /></button>

            <button className="p-2 hover:bg-zinc-700 rounded-md"><MoreIconHorizontal className="w-5 h-5" /></button>
        </div>
    );
}

const Editor: React.FC<{ 
    note: Note | null; 
    notebookPath: string[];
    onUpdateNote: (noteId: string, newContent: string) => void;
}> = ({ note, notebookPath, onUpdateNote }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && note && editorRef.current.innerHTML !== note.content) {
      editorRef.current.innerHTML = note.content;
    }
     else if (editorRef.current && !note) {
      editorRef.current.innerHTML = ''; // Clear editor if no note is selected
    }
  }, [note]);


  const handleContentChange = useCallback(() => {
    if (editorRef.current && note) {
      const newContent = editorRef.current.innerHTML;
      if (newContent !== note.content) {
        onUpdateNote(note.id, newContent);
      }
    }
  }, [note, onUpdateNote]);

  if (!note) {
    return (
        <div className="flex-1 flex flex-col h-full bg-zinc-900">
             <div className="p-2.5 border-b border-zinc-700 h-[45px]"></div>
             <EditorToolbar />
             <div className="flex-1 flex items-center justify-center text-zinc-500">
                 Selecione uma nota para visualizar ou criar uma nova.
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
                 <span className="text-zinc-100 font-semibold">{note.title}</span>
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
                Comece a escrever aqui...
            </div>
          )}
      </div>
    </div>
  );
};

export default Editor;