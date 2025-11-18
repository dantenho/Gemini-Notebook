import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Note, Node } from './types';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import Editor from './components/Editor';

const LOCAL_STORAGE_NOTES_KEY = 'gemini-notebook-notes-v2';
const LOCAL_STORAGE_TREE_KEY = 'gemini-notebook-tree-v2';


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
    { id: 'bq1', title: 'Question Bank 1', description: 'Description for question 1', date: 'Jan 1', content: 'Content for question 1 from the bank.' },
    { id: 'bio1', title: 'Enzymes', description: 'Everything about enzymes', date: 'Feb 2', content: 'Content about enzymes.' }
];

const NOTEBOOK_TREE_INITIAL: Node[] = [
  {
    id: 'spaces',
    name: 'Spaces',
    type: 'space',
    children: [
      {
        id: 'medicina',
        name: 'Medicine',
        type: 'space',
        children: [
          { 
            id: 'revalida', 
            name: '_Revalida', 
            type: 'notebook', 
            noteIds: ['heart-failure', 'hypertension-note']
          },
          { 
            id: 'banco-questoes', 
            name: 'Question Bank', 
            type: 'notebook', 
            noteIds: ['bq1'] 
          },
          {
            id: 'bioquimica',
            name: 'Biochemistry',
            type: 'notebook',
            noteIds: ['bio1'],
            children: [
                { id: 'enzymes-notebook', name: 'Enzymes & Co.', type: 'notebook', noteIds: [] },
            ]
          },
          { id: 'cardiologia', name: 'Cardiology', type: 'notebook', noteIds: [] },
        ]
      }
    ]
  }
];


/**
 * The main application component. Manages all state including notes, notebook structure, and selections.
 */
const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebookTree, setNotebookTree] = useState<Node[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  const isInitialLoad = useRef(true);

  /**
   * Effect to load notes and notebook tree from localStorage on initial render.
   * Falls back to initial mock data if localStorage is empty.
   */
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
      const savedTree = localStorage.getItem(LOCAL_STORAGE_TREE_KEY);

      const allNotes = savedNotes ? JSON.parse(savedNotes) : ALL_NOTES_INITIAL;
      const tree = savedTree ? JSON.parse(savedTree) : NOTEBOOK_TREE_INITIAL;

      setNotes(allNotes);
      setNotebookTree(tree);

      // Set initial selection
      const firstNotebook = findFirstNotebook(tree);
      if (firstNotebook) {
        setSelectedNotebookId(firstNotebook.id);
        if (firstNotebook.noteIds && firstNotebook.noteIds.length > 0) {
          setSelectedNoteId(firstNotebook.noteIds[0]);
        }
      }

    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      setNotes(ALL_NOTES_INITIAL);
      setNotebookTree(NOTEBOOK_TREE_INITIAL);
    }
  }, []);

  /**
   * Effect to save notes and notebook tree to localStorage whenever they change.
   * Skips the initial render to avoid overwriting loaded data.
   */
  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notes));
      localStorage.setItem(LOCAL_STORAGE_TREE_KEY, JSON.stringify(notebookTree));
    } catch (error) {
      console.error("Failed to save data to localStorage:", error);
    }
  }, [notes, notebookTree]);

  /**
   * Recursively finds the first notebook in the tree that has notes.
   * @param nodes - The array of nodes to search through.
   * @returns The first notebook node found, or null.
   */
  const findFirstNotebook = (nodes: Node[]): Node | null => {
      for(const node of nodes) {
          if (node.type === 'notebook' && node.noteIds && node.noteIds.length > 0) return node;
          if (node.children) {
              const found = findFirstNotebook(node.children);
              if (found) return found;
          }
      }
      return null;
  }
  
  /**
   * Recursively finds a node by its ID in the tree.
   * @param nodes - The array of nodes to search through.
   * @param id - The ID of the node to find.
   * @returns The found node, or null.
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
  }
  
  /**
   * Recursively finds the path (an array of names) to a node by its ID.
   * @param nodes - The array of nodes to search through.
   * @param id - The ID of the node to find the path for.
   * @param currentPath - The current path being built.
   * @returns An array of strings representing the path to the node.
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
  }

  /**
   * Handles selecting a notebook from the sidebar.
   * @param notebookId - The ID of the selected notebook.
   */
  const handleSelectNotebook = (notebookId: string) => {
      setSelectedNotebookId(notebookId);
      const notebook = findNodeById(notebookTree, notebookId);
      if (notebook && notebook.noteIds && notebook.noteIds.length > 0) {
          setSelectedNoteId(notebook.noteIds[0]);
      } else {
          setSelectedNoteId(null);
      }
  }

  /**
   * Callback to update the content of a specific note.
   * @param noteId - The ID of the note to update.
   * @param newContent - The new HTML content for the note.
   */
  const handleUpdateNote = useCallback((noteId: string, newContent: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId ? { ...note, content: newContent } : note
      )
    );
  }, []);

  /**
   * Handles creating a new note in the currently selected notebook.
   */
  const handleAddNote = () => {
    if (!selectedNotebookId) return;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      description: 'No additional description.',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      content: '<h1>New Note</h1><p>Start writing here...</p>'
    };
    
    // 1. Add the new note to the global notes list
    setNotes(prev => [newNote, ...prev]);

    // 2. Add the new note's ID to the noteIds array of the selected notebook in the tree
    const updateTree = (nodes: Node[]): Node[] => {
        return nodes.map(node => {
            if (node.id === selectedNotebookId) {
                return { ...node, noteIds: [newNote.id, ...(node.noteIds || [])] };
            }
            if (node.children) {
                return { ...node, children: updateTree(node.children) };
            }
            return node;
        });
    };
    setNotebookTree(updateTree(notebookTree));

    // 3. Select the new note
    setSelectedNoteId(newNote.id);
  };
  
  const selectedNotebook = selectedNotebookId ? findNodeById(notebookTree, selectedNotebookId) : null;
  const notesForSelectedNotebook = notes.filter(note => selectedNotebook?.noteIds?.includes(note.id));
  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;
  const notebookPath = selectedNotebookId ? findPath(notebookTree, selectedNotebookId) : [];


  return (
    <div className="flex h-screen font-sans bg-zinc-900 text-zinc-300">
        <Sidebar 
            nodes={notebookTree} 
            onSelectNotebook={handleSelectNotebook}
            selectedNotebookId={selectedNotebookId}
        />
        <NoteList
            notes={notesForSelectedNotebook}
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
            notebookTitle={selectedNotebook?.name || "Notebook"}
            onAddNote={handleAddNote}
        />
        <main className="flex-1 flex flex-col">
            <Editor 
                note={selectedNote} 
                notebookPath={notebookPath}
                onUpdateNote={handleUpdateNote}
            />
        </main>
    </div>
  );
};

export default App;