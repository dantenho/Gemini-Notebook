

export type Note = {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl?: string;
  content: string; // Content is now a single HTML string
};


export type Node = {
  id: string;
  name: string;
  type: 'space' | 'area' | 'stack' | 'notebook';
  children?: Node[];
  noteIds?: string[];
  description?: string;
};
