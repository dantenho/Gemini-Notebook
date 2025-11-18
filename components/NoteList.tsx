import React from 'react';
import { Note } from '../types';
import { ShareIcon } from '../constants';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  notebookTitle: string;
  onAddNote: () => void;
}

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

export const NoteList: React.FC<NoteListProps> = ({ notes, selectedNoteId, onSelectNote, notebookTitle, onAddNote }) => {
  return (
    <aside className="w-[320px] bg-zinc-800/50 border-r border-zinc-700/50 flex flex-col h-screen">
      <header className="p-4 border-b border-zinc-700/50 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-100">{notebookTitle}</h2>
          <div className="flex items-center space-x-2 text-zinc-400">
            <span className="text-base font-normal text-zinc-500 mr-2">{notes.length}</span>
            <button className="p-1 hover:bg-zinc-700 rounded"><ShareIcon className="w-5 h-5" /></button>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        {notes.map(note => (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={`p-4 border-b border-zinc-800 cursor-pointer ${selectedNoteId === note.id ? 'bg-blue-900/40' : 'hover:bg-zinc-700/50'}`}
          >
            <h3 className={`font-semibold mb-1 ${selectedNoteId === note.id ? 'text-blue-300' : 'text-zinc-100'}`}>{note.title}</h3>
            
            {note.imageUrl && <NoteImage src={note.imageUrl} alt={note.title} />}

            <p className="text-sm text-zinc-400 mt-1 mb-2 leading-relaxed line-clamp-2">{note.description}</p>
            <p className="text-xs text-zinc-500">{note.date}</p>
          </div>
        ))}
      </div>
      <footer className="p-2 border-t border-zinc-700/50 text-center text-xs text-zinc-400">
          <button onClick={onAddNote} className='w-full p-1.5 hover:bg-zinc-700 rounded-md'>Adicionar nova nota</button>
      </footer>
    </aside>
  );
};