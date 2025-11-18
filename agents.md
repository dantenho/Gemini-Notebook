# Gemini Notebook - AI Agent Documentation

## 📋 Project Overview

**Gemini Notebook** is a hierarchical note-taking application built with React 18, TypeScript, and Tailwind CSS. It features a rich text editor with Mermaid.js diagram support, Google Drive synchronization, and a 4-level organizational structure.

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (dark theme)
- **Diagrams**: Mermaid.js v11.4+
- **Cloud Sync**: Google Drive API (OAuth 2.0)
- **Markdown**: TurndownService
- **Storage**: localStorage + Google Drive

### Key Features

1. **Hierarchical Organization**: Area → Stack → Notebook → Note
2. **Rich Text Editor**: Full formatting with toolbar
3. **Diagram Support**: 7 Mermaid.js diagram types
4. **Auto-sync**: 30-second debounce to Google Drive
5. **Performance**: Optimized with React.memo and useCallback
6. **Error Handling**: ErrorBoundary for graceful failures

---

## 🏗️ Architecture

### Directory Structure

```
/
├── components/
│   ├── NoteList.tsx           # Hierarchical tree view (React.memo)
│   ├── Editor.tsx             # Rich text editor (React.memo)
│   ├── MindmapGenerator.tsx   # Diagram creation modal
│   ├── SyncStatus.tsx         # Sync status indicator
│   ├── ErrorBoundary.tsx      # Error handling wrapper
│   └── ...
├── services/
│   └── googleDriveService.ts  # Google Drive integration
├── utils/
│   └── markdown.ts            # HTML ↔ Markdown conversion
├── config/
│   └── env.ts                 # Environment configuration
├── types.ts                   # TypeScript interfaces
├── constants.tsx              # Icon components
├── App.tsx                    # Main application (optimized)
└── index.tsx                  # Entry point with ErrorBoundary
```

### Data Flow

```
┌─────────────┐
│  App.tsx    │ ← Root state management
│  (State)    │
└──────┬──────┘
       │
  ┌────┴────────────────────┐
  │                         │
  ▼                         ▼
┌──────────┐           ┌────────┐
│ NoteList │           │ Editor │
│ (React.  │           │(React. │
│  memo)   │           │ memo)  │
└──────────┘           └────────┘
       │                    │
       │                    ▼
       │            ┌───────────────┐
       │            │ Mindmap       │
       │            │ Generator     │
       │            └───────────────┘
       │
       ▼
┌──────────────┐
│ SyncStatus   │
└──────────────┘
       │
       ▼
┌──────────────────┐
│ Google Drive     │
│ Service          │
└──────────────────┘
```

---

## 📦 Core Components

### 1. App.tsx (Main Component)

**Purpose**: Root component managing all application state.

**Key Responsibilities**:
- Manage notes and areas state
- Local storage persistence
- Auto-sync with 30s debounce
- CRUD operations for all hierarchy levels
- Performance optimizations

**State Management**:
```typescript
const [notes, setNotes] = useState<Note[]>([]);
const [areas, setAreas] = useState<Node[]>([]);
const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
```

**Performance Optimizations**:
- `useCallback` for all handlers
- `useMemo` for computed values (selectedNote, notebookPath)
- Debounced auto-sync
- React.memo for child components

**Auto-sync Implementation**:
```typescript
useEffect(() => {
  if (!isGoogleDriveAvailable() || !googleDriveService.getSyncStatus().isConnected) {
    return;
  }

  autoSyncTimerRef.current = setTimeout(() => {
    googleDriveService.syncAll(notes, areas).catch(console.error);
  }, config.app.autoSyncDelay); // 30000ms

  return () => clearTimeout(autoSyncTimerRef.current);
}, [notes, areas]);
```

### 2. NoteList.tsx (Navigation)

**Purpose**: Hierarchical tree view with expand/collapse.

**Structure**:
- `ConfirmDialog`: Reusable confirmation modal
- `NoteItem`: Individual note display
- `NotebookItem`: Notebook with notes list
- `StackItem`: Stack with notebooks
- `AreaItem`: Top-level area with stacks

**Features**:
- Expandable/collapsible nodes
- Add/remove at each level
- Confirmation dialogs for deletions
- Active note highlighting

**Performance**: Wrapped with `React.memo`

### 3. Editor.tsx (Rich Text Editing)

**Purpose**: ContentEditable-based rich text editor.

**Features**:
- 10 fonts, 15 sizes, 7 line heights
- 100 colors (50 text + 50 background)
- Lists, tables, alignment, indent
- Bold, italic, underline, strikethrough
- Subscript, superscript, blockquotes
- Inline code, code blocks
- Mermaid diagram insertion

**Toolbar Groups**:
1. **Basic**: Undo, redo, bold, italic, underline
2. **Lists**: Ordered, unordered, indent
3. **Format**: Fonts, sizes, colors
4. **Alignment**: Left, center, right, justify
5. **Insert**: Links, tables, diagrams

**Performance**: Wrapped with `React.memo`

**Content Persistence**:
```typescript
const handleContentChange = () => {
  if (editorRef.current && note) {
    onUpdateNote(note.id, editorRef.current.innerHTML);
  }
};
```

### 4. MindmapGenerator.tsx (Diagrams)

**Purpose**: Interactive Mermaid.js diagram creator.

**Supported Diagram Types**:
1. **Flowchart**: Process flows with decisions
2. **Mindmap**: Hierarchical idea structures
3. **Sequence**: Interaction between entities
4. **Class**: UML class diagrams
5. **State**: State machine diagrams
6. **ER**: Entity-relationship diagrams
7. **Gantt**: Project timelines

**Features**:
- Live preview with 500ms debounce
- Syntax error detection
- Pre-configured templates
- Code editor
- Dark theme optimized

**Rendering Process**:
```typescript
useEffect(() => {
  const renderDiagram = async () => {
    const { svg } = await mermaid.render(
      `mermaid-${Date.now()}`,
      mermaidCode
    );
    setPreview(svg);
  };

  const timer = setTimeout(renderDiagram, 500); // Debounce
  return () => clearTimeout(timer);
}, [mermaidCode]);
```

### 5. SyncStatus.tsx (Cloud Sync UI)

**Purpose**: Display sync status and manual sync button.

**Status Indicators**:
- 🔵 Syncing (spinner animation)
- ✅ Synced (with relative time)
- ❌ Error (with error message)

**Features**:
- Real-time status updates (1s poll)
- Manual sync button
- Relative time display ("2 minutes ago")
- Error tooltip

**Auto-update**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setSyncStatus(googleDriveService.getSyncStatus());
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

### 6. ErrorBoundary.tsx (Error Handling)

**Purpose**: Catch React errors and display fallback UI.

**Features**:
- Catches rendering errors
- Development mode details
- Retry functionality
- Page reload option
- User-friendly error messages

**Usage**:
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## 🔧 Services & Utilities

### googleDriveService.ts

**Purpose**: Complete Google Drive API integration.

**Key Methods**:
- `initialize(clientId, apiKey)`: Load Google API scripts
- `signIn()`: OAuth 2.0 authentication
- `signOut()`: Revoke access token
- `saveNote(note, areas)`: Save single note as .md
- `syncAll(notes, areas)`: Sync all notes
- `getSyncStatus()`: Get current sync state

**Folder Structure**:
```
Gemini-Notebook/
  └── Notes/
      └── [Area Name]/
          └── [Stack Name]/
              └── [Notebook Name]/
                  └── note-title.md
```

**File Format**:
```markdown
---
title: Note Title
date: 2024-01-01
tags: []
---

# Note Content

Markdown content here...
```

**Performance Optimization**:
- Folder ID caching to reduce API calls
- Deduplication of existing files

**Auth Flow**:
1. Load GAPI and GIS scripts
2. Initialize with credentials
3. Request user consent
4. Store access token
5. Set `isConnected = true`

### markdown.ts

**Purpose**: Convert HTML ↔ Markdown.

**Key Functions**:
- `htmlToMarkdown(html)`: Convert editor HTML to Markdown
- `sanitizeFilename(filename)`: Create safe filenames
- `generateFrontmatter(title, date, tags)`: Create YAML frontmatter
- `extractTextFromHtml(html, maxLength)`: Get plain text preview

**Custom Rules**:
- Strikethrough: `<del>` → `~~text~~`
- Underline: `<u>` → `<u>text</u>` (preserved)
- Mermaid: `<pre class="mermaid-diagram">` → ` ```mermaid\ncode\n``` `

**TurndownService Config**:
```typescript
{
  headingStyle: 'atx',        // # Headings
  codeBlockStyle: 'fenced',   // ```code```
  bulletListMarker: '-',      // - List items
  emDelimiter: '*',           // *italic*
  strongDelimiter: '**',      // **bold**
}
```

### config/env.ts

**Purpose**: Central environment configuration.

**Environment Variables**:
```bash
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_GOOGLE_API_KEY=your-api-key
VITE_AUTO_SYNC_DELAY=30000           # 30 seconds
VITE_DIAGRAM_RENDER_DELAY=500       # 500ms
```

**Usage**:
```typescript
import { config, isGoogleDriveAvailable } from './config/env';

if (isGoogleDriveAvailable()) {
  await googleDriveService.initialize(
    config.google.clientId,
    config.google.apiKey
  );
}
```

---

## 📝 Data Types

### Note

```typescript
interface Note {
  id: string;           // Unique identifier
  title: string;        // Note title
  description?: string; // Optional short description
  date: string;         // Date string (e.g., "May 15")
  imageUrl?: string;    // Optional cover image
  content: string;      // HTML content from editor
}
```

### Node (Hierarchical Structure)

```typescript
interface Node {
  id: string;                           // Unique identifier
  name: string;                         // Display name
  type: 'area' | 'stack' | 'notebook';  // Node type
  children?: Node[];                    // Child nodes
  noteIds?: string[];                   // Note IDs (notebooks only)
  description?: string;                 // Optional description
}
```

**Hierarchy**:
- **Area**: Top-level container (e.g., "Medicine")
  - **Stack**: Collection of notebooks (e.g., "Anatomy")
    - **Notebook**: Contains notes (e.g., "Basic Anatomy")
      - **Note**: Individual notes

---

## 🚀 Performance Optimizations

### 1. React.memo

All major components wrapped with `React.memo`:
- `NoteList`: Re-renders only when areas/notes/selectedId changes
- `Editor`: Re-renders only when note/path changes
- `SyncStatus`: Re-renders only when notes/areas change

### 2. useCallback

All event handlers memoized:
- `handleUpdateNote`, `handleUpdateTitle`
- `handleAddArea`, `handleAddStack`, `handleAddNotebook`, `handleAddNote`
- `handleRemoveStack`, `handleRemoveNotebook`, `handleRemoveNote`

### 3. useMemo

Expensive computations memoized:
- `selectedNote`: Find note by ID
- `selectedNotebook`: Find notebook containing note
- `notebookPath`: Calculate breadcrumb path

### 4. Debouncing

- **Auto-sync**: 30s debounce
- **Diagram rendering**: 500ms debounce
- Prevents excessive operations

### 5. Folder Caching (Google Drive)

```typescript
private folderCache: Map<string, string> = new Map();

async getOrCreateFolder(name: string, parentId?: string) {
  const cacheKey = `${parentId || 'root'}-${name}`;
  if (this.folderCache.has(cacheKey)) {
    return this.folderCache.get(cacheKey)!;
  }
  // ... create or find folder
  this.folderCache.set(cacheKey, folderId);
}
```

---

## 🔐 Security Best Practices

### 1. Environment Variables

- API keys stored in `.env` (gitignored)
- Never commit credentials
- Example file provided: `.env.example`

### 2. OAuth 2.0

- Secure Google Drive authentication
- Token stored only in memory
- User consent required

### 3. Input Sanitization

- Filename sanitization removes dangerous characters
- Prevents path traversal attacks
- 255-character limit enforced

### 4. Content Security

- DOM manipulation in temporary elements
- No direct eval() or Function()
- TurndownService for safe HTML parsing

---

## 🐛 Error Handling

### 1. ErrorBoundary

Catches React rendering errors:
- Displays fallback UI
- Logs to console
- Provides retry mechanism
- Shows details in dev mode

### 2. Try-Catch Blocks

All async operations wrapped:
- localStorage operations
- Google Drive API calls
- Mermaid rendering

### 3. User Feedback

- Sync errors shown in SyncStatus
- Console warnings for missing config
- Graceful degradation if Drive unavailable

### 4. Network Resilience

- Retry logic recommended for Drive API
- Offline mode with localStorage only
- Auto-reconnect on network restore

---

## 📚 Common Operations

### Adding a New Note

```typescript
// 1. Create note object
const newNote: Note = {
  id: `note-${Date.now()}`,
  title: 'New Note',
  description: '',
  date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
  content: '<h1>New Note</h1><p>Start writing here...</p>'
};

// 2. Add to notes array
setNotes(prev => [newNote, ...prev]);

// 3. Add noteId to notebook
const updateNode = (nodes: Node[]): Node[] => {
  return nodes.map(node => {
    if (node.id === notebookId) {
      return { ...node, noteIds: [newNote.id, ...(node.noteIds || [])] };
    }
    // Recurse for children...
  });
};
setAreas(updateNode(areas));

// 4. Select new note
setSelectedNoteId(newNote.id);

// 5. Auto-sync will trigger after 30s
```

### Syncing to Google Drive

```typescript
// Manual sync
await googleDriveService.syncAll(notes, areas);

// Auto-sync (automatic)
// Triggered 30 seconds after last change to notes or areas

// Single note sync
await googleDriveService.saveNote(note, areas);
```

### Creating a Diagram

```typescript
// 1. Open MindmapGenerator
setShowMindmapGenerator(true);

// 2. Select diagram type and edit code
const mermaidCode = `
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]
`;

// 3. Insert into editor
handleInsertMermaid(mermaidCode);

// Result: Diagram embedded in note content
```

---

## 🔄 State Update Patterns

### Immutable Updates

Always use functional updates:

```typescript
// ✅ Correct
setNotes(prev => prev.map(note =>
  note.id === noteId ? { ...note, content: newContent } : note
));

// ❌ Wrong
const note = notes.find(n => n.id === noteId);
note.content = newContent; // Mutates state
setNotes(notes);
```

### Recursive Tree Updates

```typescript
const updateNode = (nodes: Node[]): Node[] => {
  return nodes.map(node => {
    if (node.id === targetId) {
      return { ...node, /* updates */ };
    }
    if (node.children) {
      return { ...node, children: updateNode(node.children) };
    }
    return node;
  });
};
```

### Cascading Deletes

```typescript
// Collect all note IDs recursively
const noteIdsToRemove: string[] = [];
const collectNoteIds = (node: Node) => {
  if (node.noteIds) noteIdsToRemove.push(...node.noteIds);
  if (node.children) node.children.forEach(collectNoteIds);
};
collectNoteIds(stackToDelete);

// Remove all notes
setNotes(prev => prev.filter(note => !noteIdsToRemove.includes(note.id)));
```

---

## 🧪 Testing Guidelines

### Unit Tests (Recommended)

```typescript
// Test utility functions
describe('markdown utils', () => {
  it('should convert HTML to Markdown', () => {
    expect(htmlToMarkdown('<h1>Title</h1>')).toBe('# Title');
  });

  it('should sanitize filenames', () => {
    expect(sanitizeFilename('Note: Draft #1')).toBe('Note-Draft-1');
  });
});

// Test recursive functions
describe('findNodeById', () => {
  it('should find node in nested tree', () => {
    const result = findNodeById(areas, 'notebook-123');
    expect(result?.id).toBe('notebook-123');
  });
});
```

### Integration Tests

```typescript
// Test component interactions
it('should update note content on edit', () => {
  render(<Editor note={mockNote} onUpdateNote={handleUpdate} />);

  const editor = screen.getByRole('textbox');
  fireEvent.input(editor, { target: { innerHTML: '<p>New content</p>' } });

  expect(handleUpdate).toHaveBeenCalledWith(mockNote.id, '<p>New content</p>');
});
```

### E2E Tests (Recommended)

```typescript
// Test full workflows
it('should create and save note', async () => {
  // 1. Click "Add Note"
  // 2. Enter title and content
  // 3. Verify localStorage update
  // 4. Verify auto-sync triggers
});
```

---

## 🚧 Known Limitations

1. **No conflict resolution**: Last write wins on sync
2. **No offline queue**: Changes made offline won't sync automatically
3. **No version history**: Overwrite only, no previous versions
4. **No collaborative editing**: Single-user application
5. **Limited error recovery**: Some errors require page reload

---

## 🔮 Future Enhancements

### Planned Features

1. **Search**: Full-text search across all notes
2. **Tags**: Tagging system with filtering
3. **Templates**: Pre-configured note templates
4. **Export**: Download notes as .md, .pdf, .html
5. **Import**: Import from other note apps
6. **Keyboard shortcuts**: Productivity shortcuts
7. **Dark/Light mode**: Theme toggle
8. **Mobile responsive**: Touch-friendly UI
9. **Offline mode**: Service worker for offline
10. **Version history**: Track changes over time

### API Integrations (Planned)

- **Xmind API**: Mind map export
- **Ayoa API**: Mind map synchronization
- **Notion API**: Cross-platform sync
- **Obsidian**: Markdown file compatibility

---

## 📖 Developer Guide

### Getting Started

```bash
# 1. Clone repository
git clone https://github.com/user/gemini-notebook.git

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with your Google API credentials

# 4. Start development server
npm run dev

# 5. Build for production
npm run build
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (if configured)
- **Linting**: ESLint (if configured)
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: JSDoc for all functions and interfaces

### Git Workflow

```bash
# Feature branch
git checkout -b feature/new-feature

# Commit with descriptive messages
git commit -m "feat: Add search functionality"

# Push and create PR
git push origin feature/new-feature
```

### Commit Message Format

```
feat: Add new feature
fix: Fix bug in component
docs: Update documentation
style: Format code
refactor: Refactor component
perf: Improve performance
test: Add tests
chore: Update dependencies
```

---

## 🆘 Troubleshooting

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Google Drive Sync Issues

1. Check `.env` credentials
2. Verify OAuth consent screen configuration
3. Check browser console for API errors
4. Ensure redirect URI matches Google Cloud Console

### LocalStorage Full

```javascript
// Clear old data
localStorage.removeItem('gemini-notebook-notes-v2'); // Old version
localStorage.removeItem('gemini-notebook-areas-v2');

// Export important notes first!
```

### Mermaid Rendering Errors

- Check syntax with Mermaid Live Editor
- Ensure code block has correct class: `mermaid-diagram`
- Verify Mermaid version compatibility (v11.4+)

---

## 📞 Support

For AI agents working with this codebase:

1. **Read JSDoc comments**: All functions have detailed documentation
2. **Check types.ts**: Core interfaces defined there
3. **Follow patterns**: Use existing CRUD operations as templates
4. **Test changes**: Run `npm run build` before committing
5. **Performance**: Use React.memo, useCallback, useMemo for new components
6. **Security**: Never commit `.env`, always sanitize user input

---

## 📄 License

This project documentation is for internal development use.

---

**Last Updated**: 2025-01-18
**Version**: 3.0.0
**Maintained By**: Development Team
