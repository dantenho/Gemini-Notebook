import { Note, Node } from '../types';
import { htmlToMarkdown, sanitizeFilename, generateFrontmatter } from '../utils/markdown';

// Google Drive API configuration
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata'
];

const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
];

// Folder names
const ROOT_FOLDER_NAME = 'Gemini-Notebook';
const NOTES_FOLDER_NAME = 'Notes';

interface SyncStatus {
  isConnected: boolean;
  lastSync: Date | null;
  isSyncing: boolean;
  error: string | null;
}

class GoogleDriveService {
  private gapiInited = false;
  private gisInited = false;
  private tokenClient: any;
  private accessToken: string | null = null;
  private syncStatus: SyncStatus = {
    isConnected: false,
    lastSync: null,
    isSyncing: false,
    error: null
  };
  private folderCache: Map<string, string> = new Map();

  /**
   * Initialize Google API and Identity Services
   */
  async initialize(clientId: string, apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load GAPI
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => this.gapiLoaded(apiKey, resolve, reject);
      document.body.appendChild(gapiScript);

      // Load GIS
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = () => this.gisLoaded(clientId);
      document.body.appendChild(gisScript);
    });
  }

  private gapiLoaded(apiKey: string, resolve: () => void, reject: (err: any) => void) {
    (window as any).gapi.load('client', async () => {
      try {
        await (window as any).gapi.client.init({
          apiKey,
          discoveryDocs: DISCOVERY_DOCS,
        });
        this.gapiInited = true;
        if (this.gisInited) resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private gisLoaded(clientId: string) {
    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES.join(' '),
      callback: '', // Will be set during sign-in
    });
    this.gisInited = true;
  }

  /**
   * Sign in to Google account
   */
  async signIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = async (response: any) => {
          if (response.error) {
            reject(response);
            return;
          }
          this.accessToken = response.access_token;
          this.syncStatus.isConnected = true;
          this.syncStatus.error = null;
          resolve();
        };

        if ((window as any).gapi.client.getToken() === null) {
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
          this.tokenClient.requestAccessToken({ prompt: '' });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sign out from Google account
   */
  signOut(): void {
    const token = (window as any).gapi.client.getToken();
    if (token !== null) {
      (window as any).google.accounts.oauth2.revoke(token.access_token);
      (window as any).gapi.client.setToken('');
    }
    this.accessToken = null;
    this.syncStatus.isConnected = false;
    this.folderCache.clear();
  }

  /**
   * Get or create a folder in Google Drive
   */
  private async getOrCreateFolder(
    folderName: string,
    parentId?: string
  ): Promise<string> {
    // Check cache
    const cacheKey = `${parentId || 'root'}-${folderName}`;
    if (this.folderCache.has(cacheKey)) {
      return this.folderCache.get(cacheKey)!;
    }

    try {
      // Search for existing folder
      const query = parentId
        ? `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
        : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const response = await (window as any).gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (response.result.files && response.result.files.length > 0) {
        const folderId = response.result.files[0].id;
        this.folderCache.set(cacheKey, folderId);
        return folderId;
      }

      // Create folder if it doesn't exist
      const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const createResponse = await (window as any).gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
      });

      const folderId = createResponse.result.id;
      this.folderCache.set(cacheKey, folderId);
      return folderId;
    } catch (error) {
      console.error('Error getting/creating folder:', error);
      throw error;
    }
  }

  /**
   * Create folder structure based on hierarchy (Area ’ Stack ’ Notebook)
   */
  private async createFolderStructure(areas: Node[]): Promise<Map<string, string>> {
    const folderMap = new Map<string, string>();

    try {
      // Create root folder
      const rootFolderId = await this.getOrCreateFolder(ROOT_FOLDER_NAME);
      const notesFolderId = await this.getOrCreateFolder(NOTES_FOLDER_NAME, rootFolderId);

      // Process each area
      for (const area of areas) {
        if (area.type === 'area') {
          const areaFolderId = await this.getOrCreateFolder(area.name, notesFolderId);
          folderMap.set(area.id, areaFolderId);

          // Process stacks
          if (area.children) {
            for (const stack of area.children) {
              if (stack.type === 'stack') {
                const stackFolderId = await this.getOrCreateFolder(stack.name, areaFolderId);
                folderMap.set(stack.id, stackFolderId);

                // Process notebooks
                if (stack.children) {
                  for (const notebook of stack.children) {
                    if (notebook.type === 'notebook') {
                      const notebookFolderId = await this.getOrCreateFolder(
                        notebook.name,
                        stackFolderId
                      );
                      folderMap.set(notebook.id, notebookFolderId);
                    }
                  }
                }
              }
            }
          }
        }
      }

      return folderMap;
    } catch (error) {
      console.error('Error creating folder structure:', error);
      throw error;
    }
  }

  /**
   * Find the notebook ID for a note
   */
  private findNotebookForNote(areas: Node[], noteId: string): string | null {
    for (const area of areas) {
      if (area.children) {
        for (const stack of area.children) {
          if (stack.children) {
            for (const notebook of stack.children) {
              if (notebook.noteIds?.includes(noteId)) {
                return notebook.id;
              }
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Save a note as Markdown file to Google Drive
   */
  async saveNote(note: Note, areas: Node[]): Promise<void> {
    if (!this.syncStatus.isConnected) {
      throw new Error('Not connected to Google Drive');
    }

    try {
      // Find notebook for this note
      const notebookId = this.findNotebookForNote(areas, note.id);
      if (!notebookId) {
        console.warn('No notebook found for note:', note.id);
        return;
      }

      // Create folder structure
      const folderMap = await this.createFolderStructure(areas);
      const parentFolderId = folderMap.get(notebookId);

      if (!parentFolderId) {
        console.warn('No folder found for notebook:', notebookId);
        return;
      }

      // Convert HTML to Markdown
      const markdown = htmlToMarkdown(note.content);
      const frontmatter = generateFrontmatter(note.title, note.date);
      const fullContent = frontmatter + markdown;

      // Create safe filename
      const filename = sanitizeFilename(note.title) + '.md';

      // Check if file already exists
      const query = `name='${filename}' and '${parentFolderId}' in parents and trashed=false`;
      const searchResponse = await (window as any).gapi.client.drive.files.list({
        q: query,
        fields: 'files(id)',
      });

      const fileMetadata = {
        name: filename,
        mimeType: 'text/markdown',
        parents: [parentFolderId],
      };

      const file = new Blob([fullContent], { type: 'text/markdown' });
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
      form.append('file', file);

      if (searchResponse.result.files && searchResponse.result.files.length > 0) {
        // Update existing file
        const fileId = searchResponse.result.files[0].id;
        await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
          {
            method: 'PATCH',
            headers: new Headers({ Authorization: `Bearer ${this.accessToken}` }),
            body: form,
          }
        );
      } else {
        // Create new file
        await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: new Headers({ Authorization: `Bearer ${this.accessToken}` }),
            body: form,
          }
        );
      }

      this.syncStatus.lastSync = new Date();
      this.syncStatus.error = null;
    } catch (error) {
      console.error('Error saving note to Google Drive:', error);
      this.syncStatus.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Sync all notes to Google Drive
   */
  async syncAll(notes: Note[], areas: Node[]): Promise<void> {
    if (!this.syncStatus.isConnected) {
      throw new Error('Not connected to Google Drive');
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.error = null;

    try {
      for (const note of notes) {
        await this.saveNote(note, areas);
      }
      this.syncStatus.lastSync = new Date();
    } catch (error) {
      console.error('Error syncing to Google Drive:', error);
      this.syncStatus.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
