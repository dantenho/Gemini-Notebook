import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import mermaid from 'mermaid';
import { CheckIcon } from '../constants';

/**
 * @fileoverview Mindmap and Diagram Generator Component
 *
 * This component provides an interactive interface for creating various types
 * of diagrams using Mermaid.js library. It supports 7 different diagram types
 * with real-time preview and code editing capabilities.
 *
 * Features:
 * - 7 diagram types (Flowchart, Mindmap, Sequence, Class, State, ER, Gantt)
 * - Live preview with 500ms debounce
 * - Code editor with syntax validation
 * - Pre-configured templates for each diagram type
 * - Dark theme optimized for the editor
 * - Insert diagrams directly into notes
 *
 * @module components/MindmapGenerator
 */

// Initialize Mermaid with dark theme configuration
// This runs once when the module is loaded
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#fff',
    primaryBorderColor: '#1e40af',
    lineColor: '#60a5fa',
    secondaryColor: '#6366f1',
    tertiaryColor: '#8b5cf6',
    background: '#18181b',
    mainBkg: '#27272a',
    secondBkg: '#3f3f46',
    textColor: '#e4e4e7',
    fontSize: '14px',
  }
});

/**
 * Supported diagram types
 * @typedef {'flowchart' | 'mindmap' | 'sequence' | 'class' | 'state' | 'er' | 'gantt'} DiagramType
 */
type DiagramType = 'flowchart' | 'mindmap' | 'sequence' | 'class' | 'state' | 'er' | 'gantt';

/**
 * Props for the MindmapGenerator component
 * @interface MindmapGeneratorProps
 */
interface MindmapGeneratorProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Current note content (for future context-aware generation) */
  content: string;
  /** Callback to insert generated Mermaid code into the editor */
  onInsert: (mermaidCode: string) => void;
}

/**
 * Configuration for each diagram type
 * @interface DiagramConfig
 */
interface DiagramConfig {
  type: DiagramType;
  name: string;
  description: string;
  template: string;
}

/**
 * Available diagram types with their configurations
 * Memoized as a constant to prevent recreation on each render
 */
const DIAGRAM_TYPES: DiagramConfig[] = [
  {
    type: 'flowchart',
    name: 'Flowchart',
    description: 'Process flow and decision diagrams',
    template: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E`
  },
  {
    type: 'mindmap',
    name: 'Mind Map',
    description: 'Hierarchical idea structure',
    template: `mindmap
  root((Central Idea))
    Topic 1
      Subtopic 1.1
      Subtopic 1.2
    Topic 2
      Subtopic 2.1
      Subtopic 2.2
    Topic 3`
  },
  {
    type: 'sequence',
    name: 'Sequence Diagram',
    description: 'Object interactions over time',
    template: `sequenceDiagram
    participant A as User
    participant B as System
    A->>B: Request data
    B->>B: Process
    B->>A: Return result`
  },
  {
    type: 'class',
    name: 'Class Diagram',
    description: 'Object-oriented class structure',
    template: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog`
  },
  {
    type: 'state',
    name: 'State Diagram',
    description: 'State machine and transitions',
    template: `stateDiagram-v2
    [*] --> Inactive
    Inactive --> Active: start
    Active --> Paused: pause
    Paused --> Active: resume
    Active --> [*]: finish`
  },
  {
    type: 'er',
    name: 'ER Diagram',
    description: 'Entity-relationship model',
    template: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ITEM : contains
    PRODUCT ||--o{ ITEM : "ordered in"`
  },
  {
    type: 'gantt',
    name: 'Gantt Chart',
    description: 'Project timeline and schedule',
    template: `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1      :a1, 2024-01-01, 30d
    Task 2      :after a1, 20d
    section Phase 2
    Task 3      :2024-02-01, 25d`
  }
];

/**
 * MindmapGenerator Component
 *
 * A modal-based diagram generator that allows users to:
 * 1. Select a diagram type
 * 2. Edit Mermaid code with live preview
 * 3. Insert the generated diagram into their note
 *
 * @component
 * @example
 * ```tsx
 * <MindmapGenerator
 *   isOpen={showGenerator}
 *   onClose={() => setShowGenerator(false)}
 *   content={noteContent}
 *   onInsert={(code) => insertIntoEditor(code)}
 * />
 * ```
 */
export const MindmapGenerator: React.FC<MindmapGeneratorProps> = ({
  isOpen,
  onClose,
  content,
  onInsert
}) => {
  // State management
  const [selectedType, setSelectedType] = useState<DiagramType | null>(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  /**
   * Effect: Load template when diagram type is selected
   * Optimized to only run when selectedType changes
   */
  useEffect(() => {
    if (selectedType) {
      const template = DIAGRAM_TYPES.find(d => d.type === selectedType)?.template || '';
      setMermaidCode(template);
      setError(''); // Clear previous errors
    }
  }, [selectedType]);

  /**
   * Effect: Render diagram with debounce
   *
   * Performance optimization:
   * - Uses 500ms debounce to prevent excessive re-renders
   * - Only renders when mermaidCode changes
   * - Cleans up previous render attempts
   * - Catches and displays rendering errors
   */
  useEffect(() => {
    /**
     * Async function to render the Mermaid diagram
     *
     * @async
     * @function renderDiagram
     * @returns {Promise<void>}
     *
     * Process:
     * 1. Validates mermaidCode and previewRef existence
     * 2. Generates unique ID for this render
     * 3. Calls mermaid.render() with code
     * 4. Updates preview SVG on success
     * 5. Displays error message on failure
     */
    const renderDiagram = async () => {
      if (!mermaidCode || !previewRef.current) return;

      try {
        setError('');
        const id = `mermaid-${Date.now()}`; // Unique ID to prevent conflicts
        const { svg } = await mermaid.render(id, mermaidCode);
        setPreview(svg);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Rendering error: ${errorMessage}`);
        setPreview('');
      }
    };

    // Debounce: Wait 500ms after last code change before rendering
    const debounceTimer = setTimeout(renderDiagram, 500);

    // Cleanup: Cancel pending render if code changes again
    return () => clearTimeout(debounceTimer);
  }, [mermaidCode]);

  /**
   * Handle diagram insertion into editor
   *
   * @callback handleInsert
   * @returns {void}
   *
   * Validates that:
   * - Code is not empty
   * - No rendering errors exist
   * Then calls parent's onInsert callback and closes modal
   */
  const handleInsert = useCallback(() => {
    if (mermaidCode && !error) {
      onInsert(mermaidCode);
      onClose();
    }
  }, [mermaidCode, error, onInsert, onClose]);

  /**
   * Handle back button click
   *
   * @callback handleBack
   * @returns {void}
   *
   * Resets state to return to diagram type selection
   */
  const handleBack = useCallback(() => {
    setSelectedType(null);
    setMermaidCode('');
    setError('');
    setPreview('');
  }, []);

  /**
   * Handle code input changes
   *
   * @callback handleCodeChange
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - Change event
   * @returns {void}
   *
   * Optimized with useCallback to prevent unnecessary re-renders
   */
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMermaidCode(e.target.value);
  }, []);

  // Early return if modal is not open (performance optimization)
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagram-generator-title"
    >
      <div
        className="bg-zinc-800 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col border border-zinc-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            {selectedType && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-zinc-700 rounded-md transition-colors"
                aria-label="Go back to diagram selection"
              >
                ←
              </button>
            )}
            <h2 id="diagram-generator-title" className="text-xl font-bold text-zinc-100">
              {selectedType ? 'Create Diagram' : 'Mindmap & Diagram Generator'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-700 rounded-md transition-colors text-zinc-400 hover:text-zinc-200"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {!selectedType ? (
            // Diagram type selection grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DIAGRAM_TYPES.map((diagram) => (
                <button
                  key={diagram.type}
                  onClick={() => setSelectedType(diagram.type)}
                  className="p-6 bg-zinc-900/50 border border-zinc-700 rounded-lg hover:bg-zinc-700/50 hover:border-blue-500 transition-all text-left group"
                  aria-label={`Select ${diagram.name}`}
                >
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-blue-400 transition-colors">
                    {diagram.name}
                  </h3>
                  <p className="text-sm text-zinc-400">{diagram.description}</p>
                  <div className="mt-4 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to start →
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Editor and preview
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Code editor */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Mermaid Code
                  </label>
                  <a
                    href="https://mermaid.js.org/intro/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Documentation →
                  </a>
                </div>
                <textarea
                  value={mermaidCode}
                  onChange={handleCodeChange}
                  className="flex-1 bg-zinc-900 text-zinc-300 font-mono text-sm p-4 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Enter Mermaid code here..."
                  spellCheck={false}
                  aria-label="Mermaid code editor"
                />
                {error && (
                  <div
                    className="mt-2 p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400"
                    role="alert"
                  >
                    {error}
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-zinc-300 mb-2">
                  Preview
                </label>
                <div
                  ref={previewRef}
                  className="flex-1 bg-zinc-900 rounded-lg border border-zinc-700 p-4 overflow-auto flex items-center justify-center"
                  aria-live="polite"
                  aria-label="Diagram preview"
                >
                  {preview ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: preview }}
                      className="mermaid-preview"
                    />
                  ) : (
                    <div className="text-zinc-500 text-center">
                      {error ? 'Fix errors in code' : 'Waiting for code...'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - only show when editing */}
        {selectedType && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              disabled={!mermaidCode || !!error}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label="Insert diagram into note"
            >
              <CheckIcon className="w-4 h-4" />
              Insert Diagram
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindmapGenerator;
