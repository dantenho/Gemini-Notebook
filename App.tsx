import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Note, Node } from './types';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import Editor from './components/Editor';

const LOCAL_STORAGE_NOTES_KEY = 'gemini-notebook-notes-v2';
const LOCAL_STORAGE_TREE_KEY = 'gemini-notebook-tree-v2';


const ALL_NOTES_INITIAL: Note[] = [
    {
        id: 'insuficiencia-cardiaca',
        title: 'Insuficiência Cardíaca',
        description: 'A maior causa de morte no Brasil e no mundo é de origem...',
        date: '15 de mai.',
        imageUrl: 'https://i.imgur.com/this-image-does-not-exist.png',
        content: `<h1>Insuficiência Cardíaca</h1><p>A maior causa de morte no Brasil e no mundo é de origem cardiovascular, que corresponde a cerca de 30% de todas as causas, sendo a insuficiência cardíaca a grande responsável pela maior parte desses óbitos. Há diversas medicações que se mostram eficientes na redução da mortalidade. Nesse contexto, assinale o fármaco que possui efeito benéfico na redução da mortalidade cardíaca.</p><p>A. Atenolol</p><p>B. Digoxina</p><p>C. Furosemida</p><p><strong>D. Dapagliflozina Correta</strong></p><h3>Comentário</h3><p>Esse talvez seja um dos tópicos mais cobrados em provas quando o assunto é insuficiência cardíaca. O tripé do tratamento da insuficiência cardíaca com fração de ejeção reduzida é: IECA, betabloqueador e espironolactona...</p>`
    },
    {
        id: 'hta',
        title: 'HTA',
        description: '2023 - Uma paciente de 64 anos foi encaminhada ao ambulatório de cardiologia para ajuste de seu...',
        date: '28 de dez. de 2024',
        content: '<h1>HTA</h1><p>Conteúdo da nota sobre HTA...</p>'
    },
    { id: 'bq1', title: 'Questão Banco 1', description: 'Descrição da questão 1', date: '1 Jan', content: 'Conteúdo da questão 1 do banco.' },
    { id: 'bio1', title: 'Enzimas', description: 'Tudo sobre enzimas', date: '2 Fev', content: 'Conteúdo sobre enzimas.' }
];

const NOTEBOOK_TREE_INITIAL: Node[] = [
  {
    id: 'spaces',
    name: 'Spaces',
    type: 'space',
    children: [
      {
        id: 'medicina',
        name: 'Medicina',
        type: 'space',
        children: [
          { 
            id: 'revalida', 
            name: '_Revalida', 
            type: 'notebook', 
            noteIds: ['insuficiencia-cardiaca', 'hta']
          },
          { 
            id: 'banco-questoes', 
            name: 'Banco de Questões', 
            type: 'notebook', 
            noteIds: ['bq1'] 
          },
          {
            id: 'bioquimica',
            name: 'Bioquímica',
            type: 'notebook',
            noteIds: ['bio1'],
            children: [
                { id: 'enzimas-notebook', name: 'Enzimas e Enzimas...', type: 'notebook', noteIds: [] },
            ]
          },
          { id: 'cardiologia', name: 'Cardiologia', type: 'notebook', noteIds: [] },
        ]
      }
    ]
  }
];


const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebookTree, setNotebookTree] = useState<Node[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  const isInitialLoad = useRef(true);

  // Load data from localStorage
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

  // Save data to localStorage
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

  const handleSelectNotebook = (notebookId: string) => {
      setSelectedNotebookId(notebookId);
      const notebook = findNodeById(notebookTree, notebookId);
      if (notebook && notebook.noteIds && notebook.noteIds.length > 0) {
          setSelectedNoteId(notebook.noteIds[0]);
      } else {
          setSelectedNoteId(null);
      }
  }

  const handleUpdateNote = useCallback((noteId: string, newContent: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId ? { ...note, content: newContent } : note
      )
    );
  }, []);

  const handleAddNote = () => {
    if (!selectedNotebookId) return;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Nova Nota',
      description: 'Sem descrição adicional.',
      date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
      content: '<h1>Nova Nota</h1><p>Comece a escrever aqui...</p>'
    };
    
    // Add note to the flat list
    setNotes(prev => [newNote, ...prev]);

    // Add note ID to the tree
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
            notebookTitle={selectedNotebook?.name || "Caderno"}
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