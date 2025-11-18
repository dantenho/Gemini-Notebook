/**
 * @fileoverview Note List Component with Hierarchical Structure
 *
 * Displays a tree-view of areas, stacks, notebooks, and notes
 * with expand/collapse functionality and CRUD operations.
 *
 * Performance: Wrapped with React.memo to prevent unnecessary re-renders.
 *
 * @module components/NoteList
 */

import React, { useState } from 'react';
import { Note, Node } from '../types';
import { ShareIcon, ChevronRightIcon, ChevronDownIcon, PlusIcon, TrashIcon } from '../constants';

interface NoteListProps {
  areas: Node[];
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onAddArea: () => void;
  onAddStack: (areaId: string) => void;
  onRemoveStack: (areaId: string, stackId: string) => void;
  onAddNotebook: (stackId: string) => void;
  onRemoveNotebook: (stackId: string, notebookId: string) => void;
  onAddNote: (notebookId: string) => void;
  onRemoveNote: (notebookId: string, noteId: string) => void;
}

/**
 * A component that displays a fallback UI for broken or missing images.
 */
const NoteImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = React.useState(!src);

  React.useEffect(() => {
    setHasError(!src);
  }, [src]);

  if (hasError) {
    return (
      <div className="mt-2 mb-3 aspect-video flex flex-col items-center justify-center text-center bg-zinc-800 border border-zinc-700 rounded-md p-2">
        <p className="text-sm text-zinc-300 leading-tight">The image you are requesting does not exist or is no longer available.</p>
        <p className="text-xs text-zinc-500 mt-2">imgur.com</p>
      </div>
    );
  }

  return (
    <div className="mt-2 mb-3 relative aspect-video">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-md bg-zinc-700"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
};

/**
 * Confirmation dialog component
 */
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 border border-zinc-700" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Component to render a single note item
 */
const NoteItem: React.FC<{
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}> = ({ note, isSelected, onSelect, onRemove }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div
        className={`group relative p-3 border-b border-zinc-800 cursor-pointer ${
          isSelected ? 'bg-blue-900/40' : 'hover:bg-zinc-700/50'
        }`}
      >
        <div onClick={onSelect}>
          <h3 className={`font-semibold mb-1 ${isSelected ? 'text-blue-300' : 'text-zinc-100'}`}>
            {note.title}
          </h3>
          {note.imageUrl && <NoteImage src={note.imageUrl} alt={note.title} />}
          <p className="text-sm text-zinc-400 mt-1 mb-2 leading-relaxed line-clamp-2">
            {note.description}
          </p>
          <p className="text-xs text-zinc-500">{note.date}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(true);
          }}
          className="absolute top-3 right-3 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600/20 rounded transition-opacity"
          title="Remover nota"
        >
          <TrashIcon className="w-4 h-4 text-red-400" />
        </button>
      </div>
      <ConfirmDialog
        isOpen={showConfirm}
        title="Remover Nota"
        message={`Tem certeza que deseja remover a nota "${note.title}"?`}
        onConfirm={onRemove}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

/**
 * Component to render a notebook with its notes
 */
const NotebookItem: React.FC<{
  notebook: Node;
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onAddNote: () => void;
  onRemove: () => void;
  onRemoveNote: (noteId: string) => void;
}> = ({ notebook, notes, selectedNoteId, onSelectNote, onAddNote, onRemove, onRemoveNote }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const notesForNotebook = notes.filter(note => notebook.noteIds?.includes(note.id));

  return (
    <>
      <div className="border-l-2 border-zinc-700/50 ml-4 pl-2">
        <div className="flex items-center gap-2 p-2 hover:bg-zinc-700/30 rounded group">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          <span className="text-sm font-medium text-zinc-300 flex-1">{notebook.name}</span>
          <span className="text-xs text-zinc-500">{notesForNotebook.length}</span>
          <button
            onClick={onAddNote}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-green-600/20 rounded transition-opacity"
            title="Adicionar nota"
          >
            <PlusIcon className="w-3 h-3 text-green-400" />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600/20 rounded transition-opacity"
            title="Remover caderno"
          >
            <TrashIcon className="w-3 h-3 text-red-400" />
          </button>
        </div>
        {isExpanded && (
          <div className="ml-2">
            {notesForNotebook.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                isSelected={selectedNoteId === note.id}
                onSelect={() => onSelectNote(note.id)}
                onRemove={() => onRemoveNote(note.id)}
              />
            ))}
            {notesForNotebook.length === 0 && (
              <div className="p-4 text-xs text-zinc-500 text-center">
                Nenhuma nota. Clique em + para adicionar.
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={showConfirm}
        title="Remover Caderno"
        message={`Tem certeza que deseja remover o caderno "${notebook.name}" e todas as suas ${notesForNotebook.length} notas?`}
        onConfirm={onRemove}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

/**
 * Component to render a stack with its notebooks
 */
const StackItem: React.FC<{
  stack: Node;
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onAddNotebook: () => void;
  onRemove: () => void;
  onRemoveNotebook: (notebookId: string) => void;
  onAddNote: (notebookId: string) => void;
  onRemoveNote: (notebookId: string, noteId: string) => void;
}> = ({ stack, notes, selectedNoteId, onSelectNote, onAddNotebook, onRemove, onRemoveNotebook, onAddNote, onRemoveNote }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const notebooks = stack.children?.filter(child => child.type === 'notebook') || [];

  return (
    <>
      <div className="border-l-2 border-blue-700/30 ml-3 pl-2 my-1">
        <div className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded hover:bg-zinc-700/50 group">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-blue-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-blue-400" />
            )}
          </button>
          <span className="text-sm font-semibold text-blue-300 flex-1">{stack.name}</span>
          <button
            onClick={onAddNotebook}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-green-600/20 rounded transition-opacity"
            title="Adicionar caderno"
          >
            <PlusIcon className="w-3 h-3 text-green-400" />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600/20 rounded transition-opacity"
            title="Remover pilha"
          >
            <TrashIcon className="w-3 h-3 text-red-400" />
          </button>
        </div>
        {isExpanded && (
          <div className="mt-1">
            {notebooks.map(notebook => (
              <NotebookItem
                key={notebook.id}
                notebook={notebook}
                notes={notes}
                selectedNoteId={selectedNoteId}
                onSelectNote={onSelectNote}
                onAddNote={() => onAddNote(notebook.id)}
                onRemove={() => onRemoveNotebook(notebook.id)}
                onRemoveNote={(noteId) => onRemoveNote(notebook.id, noteId)}
              />
            ))}
            {notebooks.length === 0 && (
              <div className="p-3 text-xs text-zinc-500 text-center">
                Nenhum caderno. Clique em + para adicionar.
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={showConfirm}
        title="Remover Pilha de Cadernos"
        message={`Tem certeza que deseja remover a pilha "${stack.name}" com todos os seus ${notebooks.length} cadernos?`}
        onConfirm={onRemove}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

/**
 * Component to render an area with its stacks
 */
const AreaItem: React.FC<{
  area: Node;
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onAddStack: () => void;
  onRemoveStack: (stackId: string) => void;
  onAddNotebook: (stackId: string) => void;
  onRemoveNotebook: (stackId: string, notebookId: string) => void;
  onAddNote: (notebookId: string) => void;
  onRemoveNote: (notebookId: string, noteId: string) => void;
}> = ({ area, notes, selectedNoteId, onSelectNote, onAddStack, onRemoveStack, onAddNotebook, onRemoveNotebook, onAddNote, onRemoveNote }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const stacks = area.children?.filter(child => child.type === 'stack') || [];

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 p-2 bg-zinc-800/80 rounded-lg hover:bg-zinc-700/80 group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5"
        >
          {isExpanded ? (
            <ChevronDownIcon className="w-5 h-5 text-zinc-300" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-zinc-300" />
          )}
        </button>
        <span className="text-base font-bold text-zinc-100 flex-1">{area.name}</span>
        <button
          onClick={onAddStack}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-green-600/20 rounded transition-opacity"
          title="Adicionar pilha de cadernos"
        >
          <PlusIcon className="w-4 h-4 text-green-400" />
        </button>
      </div>
      {isExpanded && (
        <div className="mt-2 ml-2">
          {stacks.map(stack => (
            <StackItem
              key={stack.id}
              stack={stack}
              notes={notes}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
              onAddNotebook={() => onAddNotebook(stack.id)}
              onRemove={() => onRemoveStack(stack.id)}
              onRemoveNotebook={(notebookId) => onRemoveNotebook(stack.id, notebookId)}
              onAddNote={onAddNote}
              onRemoveNote={onRemoveNote}
            />
          ))}
          {stacks.length === 0 && (
            <div className="p-4 text-sm text-zinc-500 text-center">
              Nenhuma pilha de cadernos. Clique em + para adicionar.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * A component that displays a hierarchical list of areas, stacks, notebooks, and notes.
 * Wrapped with React.memo for performance optimization.
 */
const NoteListComponent: React.FC<NoteListProps> = ({
  areas,
  notes,
  selectedNoteId,
  onSelectNote,
  onAddArea,
  onAddStack,
  onRemoveStack,
  onAddNotebook,
  onRemoveNotebook,
  onAddNote,
  onRemoveNote,
}) => {
  return (
    <aside className="w-[380px] bg-zinc-800/50 border-r border-zinc-700/50 flex flex-col h-screen">
      <header className="p-4 border-b border-zinc-700/50 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-100">Áreas de Estudo</h2>
          <button
            onClick={onAddArea}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
            title="Criar nova área"
          >
            <PlusIcon className="w-5 h-5 text-green-400" />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-3">
        {areas.map(area => (
          <AreaItem
            key={area.id}
            area={area}
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={onSelectNote}
            onAddStack={() => onAddStack(area.id)}
            onRemoveStack={(stackId) => onRemoveStack(area.id, stackId)}
            onAddNotebook={onAddNotebook}
            onRemoveNotebook={onRemoveNotebook}
            onAddNote={onAddNote}
            onRemoveNote={onRemoveNote}
          />
        ))}
        {areas.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <p className="text-zinc-400 mb-4">Nenhuma área criada ainda.</p>
            <button
              onClick={onAddArea}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Criar Primeira Área
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

/**
 * Export memoized version to prevent unnecessary re-renders
 * Only re-renders when props actually change
 */
export const NoteList = React.memo(NoteListComponent);
