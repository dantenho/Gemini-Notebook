import React, { useState } from 'react';
import { Node } from '../types';
import { ChevronRightIcon, ChevronDownIcon, NotebookIcon, NoteIcon } from '../constants';

interface SidebarProps {
  nodes: Node[];
  onSelectNotebook: (notebookId: string) => void;
  selectedNotebookId: string | null;
}

const ICONS_MAP: { [key: string]: React.FC<{className?: string}> } = {
    'space': NotebookIcon, // Using notebook icon for spaces for now
    'notebook': NotebookIcon,
};

const TreeNode: React.FC<{ node: Node; onSelectNotebook: (id: string) => void; level: number; selectedNotebookId: string | null }> = ({ node, onSelectNotebook, level, selectedNotebookId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon = ICONS_MAP[node.type] || NotebookIcon;

  const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if(node.children && node.children.length > 0){
          setIsExpanded(!isExpanded);
      }
  };
  
  const handleSelect = () => {
      if(node.type === 'notebook') {
          onSelectNotebook(node.id);
      }
  }

  const isSelected = node.type === 'notebook' && selectedNotebookId === node.id;

  return (
    <div>
      <div 
        className={`flex items-center p-1.5 rounded-md cursor-pointer ${isSelected ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
        style={{ paddingLeft: `${level * 1.25}rem` }}
        onClick={handleSelect}
      >
        <div onClick={handleToggle} className="p-0.5 rounded hover:bg-zinc-700 mr-1">
          {node.children && node.children.length > 0 ? (
            isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />
          ) : (
            <span className="w-4 h-4 inline-block"></span> // Placeholder for alignment
          )}
        </div>
        <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="truncate flex-1 text-sm">{node.name}</span>
      </div>
      {isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} onSelectNotebook={onSelectNotebook} level={level + 1} selectedNotebookId={selectedNotebookId} />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ nodes, onSelectNotebook, selectedNotebookId }) => {
  return (
    <aside className="w-[280px] bg-zinc-900/80 border-r border-zinc-800 flex flex-col h-screen p-2 text-zinc-300">
      <div className="flex-1 overflow-y-auto">
        {nodes.map(node => (
            <TreeNode key={node.id} node={node} onSelectNotebook={onSelectNotebook} level={0} selectedNotebookId={selectedNotebookId} />
        ))}
      </div>
    </aside>
  );
};