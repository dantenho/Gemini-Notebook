import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Note, Node } from './types';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import Editor from './components/Editor';

const LOCAL_STORAGE_NOTES_KEY = 'gemini-notebook-notes-v3';
const LOCAL_STORAGE_AREAS_KEY = 'gemini-notebook-areas-v3';

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

// Nova estrutura hierárquica: Área → Pilha → Caderno → Nota
const AREAS_INITIAL: Node[] = [
  {
    id: 'medicina',
    name: 'Medicina',
    type: 'area',
    children: [
      {
        id: 'anatomia-stack',
        name: 'Anatomia',
        type: 'stack',
        children: [
          {
            id: 'anatomia-basica',
            name: 'Anatomia Básica',
            type: 'notebook',
            noteIds: ['heart-failure']
          },
          {
            id: 'anatomia-avancada',
            name: 'Anatomia Avançada',
            type: 'notebook',
            noteIds: ['hypertension-note']
          }
        ]
      }
    ]
  }
];

/**
 * The main application component. Manages all state including notes, areas structure, and selections.
 */
const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [areas, setAreas] = useState<Node[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const isInitialLoad = useRef(true);

  /**
   * Effect to load notes and areas from localStorage on initial render.
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

  /**
   * Effect to save notes and areas to localStorage whenever they change.
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

  /**
   * Recursively finds a node by its ID in the tree.
   */
  const findNodeById = (nodes: Node[], id: string): Node | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  /**
   * Recursively finds the path to a node by its ID.
   */
  const findPath = (nodes: Node[], id: string, currentPath: string[] = []): string[] => {
    for (const node of nodes) {
      const newPath = [...currentPath, node.name];
      if (node.id === id) return newPath;
      if (node.children) {
        const foundPath = findPath(node.children, id, newPath);
        if (foundPath.length > newPath.length) return foundPath;
      }
    }
    return currentPath;
  };

  /**
   * Callback to update the content of a specific note.
   */
  const handleUpdateNote = useCallback((noteId: string, newContent: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, content: newContent } : note
      )
    );
  }, []);

  /**
   * Callback to update the title of a specific note.
   */
  const handleUpdateTitle = useCallback((noteId: string, newTitle: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, title: newTitle } : note
      )
    );
  }, []);

  // === ÁREA MANAGEMENT ===

  /**
   * Adds a new area to the root level.
   */
  const handleAddArea = () => {
    const newArea: Node = {
      id: `area-${Date.now()}`,
      name: 'Nova Área',
      type: 'area',
      children: []
    };
    setAreas(prev => [...prev, newArea]);
  };

  // === STACK MANAGEMENT ===

  /**
   * Adds a new stack to a specific area.
   */
  const handleAddStack = (areaId: string) => {
    const newStack: Node = {
      id: `stack-${Date.now()}`,
      name: 'Nova Pilha',
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
  };

  /**
   * Removes a stack from a specific area.
   */
  const handleRemoveStack = (areaId: string, stackId: string) => {
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
  };

  // === NOTEBOOK MANAGEMENT ===

  /**
   * Adds a new notebook to a specific stack.
   */
  const handleAddNotebook = (stackId: string) => {
    const newNotebook: Node = {
      id: `notebook-${Date.now()}`,
      name: 'Novo Caderno',
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
  };

  /**
   * Removes a notebook from a specific stack.
   */
  const handleRemoveNotebook = (stackId: string, notebookId: string) => {
    const notebook = findNodeById(areas, notebookId);
    if (!notebook || !notebook.noteIds) return;

    // Remove all notes in this notebook
    setNotes(prev => prev.filter(note => !notebook.noteIds?.includes(note.id)));

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
    if (notebook.noteIds.includes(selectedNoteId || '')) {
      setSelectedNoteId(null);
    }
  };

  // === NOTE MANAGEMENT ===

  /**
   * Adds a new note to a specific notebook.
   */
  const handleAddNote = (notebookId: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Nova Nota',
      description: 'Sem descrição adicional.',
      date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
      content: '<h1>Nova Nota</h1><p>Comece a escrever aqui...</p>'
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
  };

  /**
   * Removes a note from a specific notebook.
   */
  const handleRemoveNote = (notebookId: string, noteId: string) => {
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
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;

  // Find notebook path for breadcrumb
  const findNotebookForNote = (nodes: Node[], noteId: string): Node | null => {
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
  };

  const selectedNotebook = selectedNoteId ? findNotebookForNote(areas, selectedNoteId) : null;
  const notebookPath = selectedNotebook ? findPath(areas, selectedNotebook.id) : [];

  return (
    <div className="flex h-screen font-sans bg-zinc-900 text-zinc-300">
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
      <main className="flex-1 flex flex-col">
        <Editor
          note={selectedNote}
          notebookPath={notebookPath}
          onUpdateNote={handleUpdateNote}
          onUpdateTitle={handleUpdateTitle}
        />
      </main>
    </div>
  );
};

export default App;
