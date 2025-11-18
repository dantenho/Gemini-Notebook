/**
 * @fileoverview Main Application Component
 *
 * The root component that manages all application state including notes,
 * hierarchical area structure, and synchronization with Google Drive.
 *
 * Features:
 * - Hierarchical note organization (Area → Stack → Notebook → Note)
 * - Local storage persistence
 * - Auto-sync with Google Drive (30s debounce)
 * - Real-time sync status display
 * - Performance optimizations with useMemo and useCallback
 *
 * @module App
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Note, Node } from './types';
import { NoteList } from './components/NoteList';
import Editor from './components/Editor';
import SyncStatus from './components/SyncStatus';
import { googleDriveService } from './services/googleDriveService';
import { config, isGoogleDriveAvailable } from './config/env';

/**
 * Local storage keys for persistence
 */
const LOCAL_STORAGE_NOTES_KEY = 'gemini-notebook-notes-v3';
const LOCAL_STORAGE_AREAS_KEY = 'gemini-notebook-areas-v3';

/**
 * Initial sample notes for new users
 */
const ALL_NOTES_INITIAL: Note[] = [
  {
    id: 'heart-failure',
    title: 'Heart Failure',
    description: 'The leading cause of death in Brazil and worldwide is of cardiovascular origin...',
    date: 'May 15',
    imageUrl: 'https://i.imgur.com/this-image-does-not-exist.png',
    content: `<h1>Insuficiência Cardíaca</h1><p>A maior causa de morte no Brasil e no mundo é de origem cardiovascular, que corresponde a cerca de 30% de todas as causas, sendo a insuficiência cardíaca a grande responsável pela maior parte desses óbitos. Há diversas medicações que se mostram eficientes na redução da mortalidade. Nesse contexto, assinale o fármaco que possui efeito benéfico na redução da mortalidade cardíaca.</p><p>A. Atenolol</p><p>B. Digoxina</p><p>C. Furosemida</p><p><strong>D. Dapagliflozina Correta</strong></p><h3>Comentário</h3><p>Esse talvez seja um dos tópicos mais cobrados em provas quando o assunto é insuficiência cardíaca. O tripé do tratamento da insuficiência cardíaca com fração de ejeção reduzida é: IECA, betabloqueador e espironolactona...</p>`
  },
  {
    id: 'hypertension-note',
    title: 'Hypertension Note',
    description: '2023 - A 64-year-old patient was referred to the cardiology outpatient clinic for adjustment of their...',
    date: 'Dec 28, 2024',
    content: '<h1>Hypertension</h1><p>Content of the note about hypertension...</p>'
  },
];

/**
 * Initial hierarchical structure: Area → Stack → Notebook → Note
 */
const AREAS_INITIAL: Node[] = [
  {
    id: 'medicina',
    name: 'Medicine',
    type: 'area',
    children: [
      {
        id: 'anatomia-stack',
        name: 'Anatomy',
        type: 'stack',
        children: [
          {
            id: 'anatomia-basica',
            name: 'Basic Anatomy',
            type: 'notebook',
            noteIds: ['heart-failure']
          },
          {
            id: 'anatomia-avancada',
            name: 'Advanced Anatomy',
            type: 'notebook',
            noteIds: ['hypertension-note']
          }
        ]
      }
    ]
  }
];

/**
 * Main Application Component
 *
 * Manages all state including notes, areas structure, selections, and sync.
 * Implements performance optimizations with memoization.
 *
 * @returns {JSX.Element} The application UI
 */
const App: React.FC = () => {
  // === STATE ===
  const [notes, setNotes] = useState<Note[]>([]);
  const [areas, setAreas] = useState<Node[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Refs for tracking lifecycle
  const isInitialLoad = useRef(true);
  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // === EFFECT: LOAD FROM LOCAL STORAGE ===

  /**
   * Effect: Load notes and areas from localStorage on initial render
   *
   * Runs once on component mount to restore saved state.
   * Falls back to initial sample data if no saved data exists.
   */
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
      const savedAreas = localStorage.getItem(LOCAL_STORAGE_AREAS_KEY);

      const allNotes = savedNotes ? JSON.parse(savedNotes) : ALL_NOTES_INITIAL;
      const allAreas = savedAreas ? JSON.parse(savedAreas) : AREAS_INITIAL;

      setNotes(allNotes);
      setAreas(allAreas);

      // Set initial selection to first note
      if (allNotes.length > 0) {
        setSelectedNoteId(allNotes[0].id);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      setNotes(ALL_NOTES_INITIAL);
      setAreas(AREAS_INITIAL);
    }
  }, []);

  // === EFFECT: SAVE TO LOCAL STORAGE ===

  /**
   * Effect: Save notes and areas to localStorage whenever they change
   *
   * Skips the initial load to avoid overwriting just-loaded data.
   * Implements persistence for all user changes.
   */
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notes));
      localStorage.setItem(LOCAL_STORAGE_AREAS_KEY, JSON.stringify(areas));
    } catch (error) {
      console.error("Failed to save data to localStorage:", error);
    }
  }, [notes, areas]);

  // === EFFECT: AUTO-SYNC TO GOOGLE DRIVE ===

  /**
   * Effect: Auto-sync to Google Drive after inactivity
   *
   * Implements 30-second debounce - sync starts 30 seconds after the
   * last change to notes or areas. Only syncs if Google Drive is available
   * and user is connected.
   *
   * Performance optimization:
   * - Debouncing prevents excessive sync operations
   * - Cleans up timer on unmount or before next sync
   */
  useEffect(() => {
    // Skip if not connected or no Google Drive credentials
    if (!isGoogleDriveAvailable() || !googleDriveService.getSyncStatus().isConnected) {
      return;
    }

    // Skip on initial load
    if (isInitialLoad.current) {
      return;
    }

    // Clear any existing timer
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
    }

    // Set new timer for auto-sync after configured delay (default 30s)
    autoSyncTimerRef.current = setTimeout(() => {
      if (notes.length > 0) {
        console.log('Auto-sync triggered');
        googleDriveService.syncAll(notes, areas).catch((error) => {
          console.error('Auto-sync failed:', error);
        });
      }
    }, config.app.autoSyncDelay);

    // Cleanup on unmount or before next effect
    return () => {
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current);
      }
    };
  }, [notes, areas]);

  // === UTILITY FUNCTIONS (MEMOIZED) ===

  /**
   * Recursively finds a node by its ID in the tree
   *
   * Memoized with useCallback to prevent recreation on every render.
   * Dependencies: areas (tree structure changes)
   *
   * @param {Node[]} nodes - Array of nodes to search
   * @param {string} id - Node ID to find
   * @returns {Node | null} Found node or null
   */
  const findNodeById = useCallback((nodes: Node[], id: string): Node | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  /**
   * Recursively finds the path to a node by its ID
   *
   * Returns array of node names from root to target.
   * Used for breadcrumb navigation.
   *
   * @param {Node[]} nodes - Array of nodes to search
   * @param {string} id - Node ID to find path for
   * @param {string[]} currentPath - Accumulated path (used in recursion)
   * @returns {string[]} Array of node names
   */
  const findPath = useCallback((nodes: Node[], id: string, currentPath: string[] = []): string[] => {
    for (const node of nodes) {
      const newPath = [...currentPath, node.name];
      if (node.id === id) return newPath;
      if (node.children) {
        const foundPath = findPath(node.children, id, newPath);
        if (foundPath.length > newPath.length) return foundPath;
      }
    }
    return currentPath;
  }, []);

  /**
   * Find notebook that contains a specific note
   *
   * @param {Node[]} nodes - Array of nodes to search
   * @param {string} noteId - Note ID to find
   * @returns {Node | null} Notebook node or null
   */
  const findNotebookForNote = useCallback((nodes: Node[], noteId: string): Node | null => {
    for (const node of nodes) {
      if (node.type === 'notebook' && node.noteIds?.includes(noteId)) {
        return node;
      }
      if (node.children) {
        const found = findNotebookForNote(node.children, noteId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // === NOTE MANAGEMENT ===

  /**
   * Update note content
   *
   * Optimized with useCallback to prevent recreation.
   *
   * @param {string} noteId - ID of note to update
   * @param {string} newContent - New HTML content
   */
  const handleUpdateNote = useCallback((noteId: string, newContent: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, content: newContent } : note
      )
    );
  }, []);

  /**
   * Update note title
   *
   * @param {string} noteId - ID of note to update
   * @param {string} newTitle - New title
   */
  const handleUpdateTitle = useCallback((noteId: string, newTitle: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, title: newTitle } : note
      )
    );
  }, []);

  // === AREA MANAGEMENT ===

  /**
   * Add new area to root level
   *
   * Creates a new area with default name and empty children.
   */
  const handleAddArea = useCallback(() => {
    const newArea: Node = {
      id: `area-${Date.now()}`,
      name: 'New Area',
      type: 'area',
      children: []
    };
    setAreas(prev => [...prev, newArea]);
  }, []);

  // === STACK MANAGEMENT ===

  /**
   * Add new stack to a specific area
   *
   * @param {string} areaId - ID of parent area
   */
  const handleAddStack = useCallback((areaId: string) => {
    const newStack: Node = {
      id: `stack-${Date.now()}`,
      name: 'New Stack',
      type: 'stack',
      children: []
    };

    const updateNode = (nodes: Node[]): Node[] => {
      return nodes.map(node => {
        if (node.id === areaId) {
          return { ...node, children: [...(node.children || []), newStack] };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    setAreas(updateNode(areas));
  }, [areas]);

  /**
   * Remove stack from a specific area
   *
   * Cascading delete: Removes all child notebooks and notes.
   *
   * @param {string} areaId - ID of parent area
   * @param {string} stackId - ID of stack to remove
   */
  const handleRemoveStack = useCallback((areaId: string, stackId: string) => {
    const stack = findNodeById(areas, stackId);
    if (!stack) return;

    // Collect all note IDs from all notebooks in this stack
    const noteIdsToRemove: string[] = [];
    const collectNoteIds = (node: Node) => {
      if (node.noteIds) {
        noteIdsToRemove.push(...node.noteIds);
      }
      if (node.children) {
        node.children.forEach(collectNoteIds);
      }
    };
    collectNoteIds(stack);

    // Remove notes
    setNotes(prev => prev.filter(note => !noteIdsToRemove.includes(note.id)));

    // Remove stack from tree
    const updateNode = (nodes: Node[]): Node[] => {
      return nodes.map(node => {
        if (node.id === areaId) {
          return { ...node, children: node.children?.filter(child => child.id !== stackId) || [] };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    setAreas(updateNode(areas));

    // Clear selection if needed
    if (noteIdsToRemove.includes(selectedNoteId || '')) {
      setSelectedNoteId(null);
    }
  }, [areas, selectedNoteId, findNodeById]);

  // === NOTEBOOK MANAGEMENT ===

  /**
   * Add new notebook to a specific stack
   *
   * @param {string} stackId - ID of parent stack
   */
  const handleAddNotebook = useCallback((stackId: string) => {
    const newNotebook: Node = {
      id: `notebook-${Date.now()}`,
      name: 'New Notebook',
      type: 'notebook',
      noteIds: []
    };

    const updateNode = (nodes: Node[]): Node[] => {
      return nodes.map(node => {
        if (node.id === stackId) {
          return { ...node, children: [...(node.children || []), newNotebook] };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    setAreas(updateNode(areas));
  }, [areas]);

  /**
   * Remove notebook from a specific stack
   *
   * Cascading delete: Removes all notes in the notebook.
   *
   * @param {string} stackId - ID of parent stack
   * @param {string} notebookId - ID of notebook to remove
   */
  const handleRemoveNotebook = useCallback((stackId: string, notebookId: string) => {
    const notebook = findNodeById(areas, notebookId);
    if (!notebook) return;

    // Get note IDs to remove
    const noteIdsToRemove = notebook.noteIds || [];

    // Remove notes
    setNotes(prev => prev.filter(note => !noteIdsToRemove.includes(note.id)));

    // Remove notebook from tree
    const updateNode = (nodes: Node[]): Node[] => {
      return nodes.map(node => {
        if (node.id === stackId) {
          return { ...node, children: node.children?.filter(child => child.id !== notebookId) || [] };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    setAreas(updateNode(areas));

    // Clear selection if needed
    if (noteIdsToRemove.includes(selectedNoteId || '')) {
      setSelectedNoteId(null);
    }
  }, [areas, selectedNoteId, findNodeById]);

  // === NOTE CRUD OPERATIONS ===

  /**
   * Add new note to a specific notebook
   *
   * Creates a note with default content and adds it to the beginning
   * of the notes list and notebook's noteIds.
   *
   * @param {string} notebookId - ID of parent notebook
   */
  const handleAddNote = useCallback((notebookId: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      description: '',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      content: '<h1>New Note</h1><p>Start writing here...</p>'
    };

    // Add note to notes list
    setNotes(prev => [newNote, ...prev]);

    // Add note ID to notebook
    const updateNode = (nodes: Node[]): Node[] => {
      return nodes.map(node => {
        if (node.id === notebookId) {
          return { ...node, noteIds: [newNote.id, ...(node.noteIds || [])] };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    setAreas(updateNode(areas));

    // Select the new note
    setSelectedNoteId(newNote.id);
  }, [areas]);

  /**
   * Remove note from a specific notebook
   *
   * @param {string} notebookId - ID of parent notebook
   * @param {string} noteId - ID of note to remove
   */
  const handleRemoveNote = useCallback((notebookId: string, noteId: string) => {
    // Remove note from notes list
    setNotes(prev => prev.filter(note => note.id !== noteId));

    // Remove note ID from notebook
    const updateNode = (nodes: Node[]): Node[] => {
      return nodes.map(node => {
        if (node.id === notebookId) {
          return { ...node, noteIds: node.noteIds?.filter(id => id !== noteId) || [] };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    setAreas(updateNode(areas));

    // Clear selection if this was the selected note
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
  }, [areas, selectedNoteId]);

  // === COMPUTED VALUES (MEMOIZED) ===

  /**
   * Get currently selected note
   *
   * Memoized to prevent recalculation on every render.
   * Only recalculates when notes array or selectedNoteId changes.
   */
  const selectedNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  /**
   * Get notebook and path for selected note
   *
   * Used for breadcrumb navigation in the editor.
   */
  const selectedNotebook = useMemo(() => {
    return selectedNoteId ? findNotebookForNote(areas, selectedNoteId) : null;
  }, [areas, selectedNoteId, findNotebookForNote]);

  const notebookPath = useMemo(() => {
    return selectedNotebook ? findPath(areas, selectedNotebook.id) : [];
  }, [areas, selectedNotebook, findPath]);

  // === RENDER ===

  return (
    <div className="flex h-screen flex-col font-sans bg-zinc-900 text-zinc-300">
      <div className="flex flex-1 overflow-hidden">
        <NoteList
          areas={areas}
          notes={notes}
          selectedNoteId={selectedNoteId}
          onSelectNote={setSelectedNoteId}
          onAddArea={handleAddArea}
          onAddStack={handleAddStack}
          onRemoveStack={handleRemoveStack}
          onAddNotebook={handleAddNotebook}
          onRemoveNotebook={handleRemoveNotebook}
          onAddNote={handleAddNote}
          onRemoveNote={handleRemoveNote}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Editor
            note={selectedNote}
            notebookPath={notebookPath}
            onUpdateNote={handleUpdateNote}
            onUpdateTitle={handleUpdateTitle}
          />
        </main>
      </div>

      {/* Sync Status Bar */}
      {isGoogleDriveAvailable() && (
        <SyncStatus
          notes={notes}
          areas={areas}
          onSyncComplete={() => console.log('Sync completed')}
        />
      )}
    </div>
  );
};

export default App;
