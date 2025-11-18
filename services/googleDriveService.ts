/**
 * @fileoverview Google Drive Synchronization Service
 *
 * This service provides complete Google Drive integration for the Gemini Notebook
 * application, enabling automatic cloud synchronization of notes in Markdown format.
 *
 * Features:
 * - OAuth 2.0 authentication with Google Identity Services
 * - Automatic folder hierarchy creation (Area → Stack → Notebook)
 * - Markdown file upload/update with frontmatter metadata
 * - Intelligent folder caching to minimize API calls
 * - Real-time sync status tracking
 * - Automatic deduplication of existing files
 *
 * Architecture:
 * The service maintains a hierarchical folder structure in Google Drive:
 * ```
 * Gemini-Notebook/
 *   └── Notes/
 *       └── [Area Name]/
 *           └── [Stack Name]/
 *               └── [Notebook Name]/
 *                   └── [note-title].md
 * ```
 *
 * @module services/googleDriveService
 */

import { Note, Node } from '../types';
import { htmlToMarkdown, sanitizeFilename, generateFrontmatter } from '../utils/markdown';

/**
 * Google Drive API OAuth 2.0 Scopes
 *
 * - drive.file: Access files created by this app
 * - drive.appdata: Access app-specific data folder
 */
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata'
];

/**
 * Google Drive API Discovery Documents
 * Required for initializing the GAPI client library
 */
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
];

/**
 * Root folder name in Google Drive
 * All application data is stored under this folder
 */
const ROOT_FOLDER_NAME = 'Gemini-Notebook';

/**
 * Notes subfolder name
 * Contains the hierarchical structure of areas, stacks, notebooks, and notes
 */
const NOTES_FOLDER_NAME = 'Notes';

/**
 * Synchronization status information
 * @interface SyncStatus
 */
interface SyncStatus {
  /** Whether user is authenticated and connected to Google Drive */
  isConnected: boolean;
  /** Timestamp of the last successful synchronization */
  lastSync: Date | null;
  /** Whether a sync operation is currently in progress */
  isSyncing: boolean;
  /** Error message from last sync attempt, if any */
  error: string | null;
}

/**
 * Google Drive Service Class
 *
 * Singleton service that manages all interactions with Google Drive API.
 * Handles authentication, folder management, and file synchronization.
 *
 * @class GoogleDriveService
 *
 * @example
 * ```typescript
 * // Initialize the service
 * await googleDriveService.initialize(clientId, apiKey);
 *
 * // Sign in user
 * await googleDriveService.signIn();
 *
 * // Sync a single note
 * await googleDriveService.saveNote(note, areas);
 *
 * // Sync all notes
 * await googleDriveService.syncAll(notes, areas);
 *
 * // Check sync status
 * const status = googleDriveService.getSyncStatus();
 * ```
 */
class GoogleDriveService {
  /** Flag indicating if Google API (GAPI) has been initialized */
  private gapiInited = false;

  /** Flag indicating if Google Identity Services (GIS) has been initialized */
  private gisInited = false;

  /** OAuth 2.0 token client for authentication */
  private tokenClient: any;

  /** Current OAuth access token */
  private accessToken: string | null = null;

  /** Current synchronization status */
  private syncStatus: SyncStatus = {
    isConnected: false,
    lastSync: null,
    isSyncing: false,
    error: null
  };

  /**
   * Folder ID cache for performance optimization
   *
   * Key format: "{parentId}-{folderName}" or "root-{folderName}"
   * Value: Google Drive folder ID
   *
   * This cache prevents redundant API calls when accessing the same
   * folders multiple times during a sync operation.
   */
  private folderCache: Map<string, string> = new Map();

  /**
   * Initialize Google API and Identity Services
   *
   * This method loads the necessary Google scripts and initializes both
   * the Google API (GAPI) client and Google Identity Services (GIS).
   *
   * @async
   * @param {string} clientId - OAuth 2.0 client ID from Google Cloud Console
   * @param {string} apiKey - API key from Google Cloud Console
   * @returns {Promise<void>} Resolves when both services are initialized
   * @throws {Error} If initialization fails
   *
   * @example
   * ```typescript
   * await googleDriveService.initialize(
   *   'your-client-id.apps.googleusercontent.com',
   *   'your-api-key'
   * );
   * ```
   */
  async initialize(clientId: string, apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load GAPI (Google API client library)
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => this.gapiLoaded(apiKey, resolve, reject);
      document.body.appendChild(gapiScript);

      // Load GIS (Google Identity Services)
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = () => this.gisLoaded(clientId);
      document.body.appendChild(gisScript);
    });
  }

  /**
   * GAPI initialization callback
   *
   * Called when the Google API script has loaded. Initializes the GAPI
   * client with the API key and discovery documents.
   *
   * @private
   * @async
   * @param {string} apiKey - API key for GAPI initialization
   * @param {() => void} resolve - Promise resolver called when initialization succeeds
   * @param {(err: any) => void} reject - Promise rejecter called when initialization fails
   * @returns {void}
   */
  private gapiLoaded(apiKey: string, resolve: () => void, reject: (err: any) => void) {
    (window as any).gapi.load('client', async () => {
      try {
        await (window as any).gapi.client.init({
          apiKey,
          discoveryDocs: DISCOVERY_DOCS,
        });
        this.gapiInited = true;
        // Only resolve when both GAPI and GIS are initialized
        if (this.gisInited) resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * GIS initialization callback
   *
   * Called when the Google Identity Services script has loaded.
   * Initializes the OAuth 2.0 token client for authentication.
   *
   * @private
   * @param {string} clientId - OAuth 2.0 client ID
   * @returns {void}
   */
  private gisLoaded(clientId: string) {
    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES.join(' '),
      callback: '', // Will be set dynamically during sign-in
    });
    this.gisInited = true;
  }

  /**
   * Sign in to Google account
   *
   * Initiates the OAuth 2.0 flow to authenticate the user and obtain
   * an access token. Shows Google's consent screen if necessary.
   *
   * @async
   * @returns {Promise<void>} Resolves when authentication succeeds
   * @throws {Error} If authentication fails or user denies consent
   *
   * @example
   * ```typescript
   * try {
   *   await googleDriveService.signIn();
   *   console.log('Successfully signed in');
   * } catch (error) {
   *   console.error('Sign-in failed:', error);
   * }
   * ```
   */
  async signIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Set callback for token response
        this.tokenClient.callback = async (response: any) => {
          if (response.error) {
            reject(response);
            return;
          }
          // Store access token and update status
          this.accessToken = response.access_token;
          this.syncStatus.isConnected = true;
          this.syncStatus.error = null;
          resolve();
        };

        // Request access token
        // Show consent screen if no token exists, otherwise use cached credentials
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
   *
   * Revokes the OAuth access token and clears all cached data.
   * User will need to re-authenticate to use Drive features again.
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * googleDriveService.signOut();
   * console.log('User signed out');
   * ```
   */
  signOut(): void {
    const token = (window as any).gapi.client.getToken();
    if (token !== null) {
      // Revoke access token
      (window as any).google.accounts.oauth2.revoke(token.access_token);
      (window as any).gapi.client.setToken('');
    }
    // Clear internal state
    this.accessToken = null;
    this.syncStatus.isConnected = false;
    this.folderCache.clear();
  }

  /**
   * Get or create a folder in Google Drive
   *
   * Searches for an existing folder with the given name and parent.
   * If not found, creates a new folder. Results are cached to improve
   * performance on subsequent calls.
   *
   * @private
   * @async
   * @param {string} folderName - Name of the folder to find or create
   * @param {string} [parentId] - Parent folder ID (omit for root-level folder)
   * @returns {Promise<string>} The folder's Google Drive ID
   * @throws {Error} If folder creation or search fails
   *
   * Performance optimization:
   * - Uses folderCache to avoid redundant API calls
   * - Cache key format: "{parentId}-{folderName}"
   * - Cache persists for the lifetime of the service instance
   */
  private async getOrCreateFolder(
    folderName: string,
    parentId?: string
  ): Promise<string> {
    // Check cache first
    const cacheKey = `${parentId || 'root'}-${folderName}`;
    if (this.folderCache.has(cacheKey)) {
      return this.folderCache.get(cacheKey)!;
    }

    try {
      // Build search query for existing folder
      const query = parentId
        ? `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
        : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      // Search for existing folder
      const response = await (window as any).gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      // Return existing folder ID if found
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

      // Cache and return new folder ID
      const folderId = createResponse.result.id;
      this.folderCache.set(cacheKey, folderId);
      return folderId;
    } catch (error) {
      console.error('Error getting/creating folder:', error);
      throw error;
    }
  }

  /**
   * Create complete folder structure based on note hierarchy
   *
   * Recursively creates the folder structure in Google Drive to match
   * the application's hierarchical organization:
   * Area → Stack → Notebook
   *
   * @private
   * @async
   * @param {Node[]} areas - Array of area nodes with nested children
   * @returns {Promise<Map<string, string>>} Map of node IDs to folder IDs
   * @throws {Error} If folder creation fails
   *
   * Process:
   * 1. Create root "Gemini-Notebook" folder
   * 2. Create "Notes" subfolder
   * 3. For each Area: Create folder under "Notes"
   * 4. For each Stack: Create folder under parent Area
   * 5. For each Notebook: Create folder under parent Stack
   *
   * @example
   * ```typescript
   * const folderMap = await this.createFolderStructure(areas);
   * // folderMap.get('notebook-123') → 'google-drive-folder-id-xyz'
   * ```
   */
  private async createFolderStructure(areas: Node[]): Promise<Map<string, string>> {
    const folderMap = new Map<string, string>();

    try {
      // Create root folder structure
      const rootFolderId = await this.getOrCreateFolder(ROOT_FOLDER_NAME);
      const notesFolderId = await this.getOrCreateFolder(NOTES_FOLDER_NAME, rootFolderId);

      // Process each area
      for (const area of areas) {
        if (area.type === 'area') {
          const areaFolderId = await this.getOrCreateFolder(area.name, notesFolderId);
          folderMap.set(area.id, areaFolderId);

          // Process stacks within area
          if (area.children) {
            for (const stack of area.children) {
              if (stack.type === 'stack') {
                const stackFolderId = await this.getOrCreateFolder(stack.name, areaFolderId);
                folderMap.set(stack.id, stackFolderId);

                // Process notebooks within stack
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
   * Find the notebook ID for a given note
   *
   * Traverses the hierarchical structure to find which notebook contains
   * the specified note ID.
   *
   * @private
   * @param {Node[]} areas - Array of area nodes to search
   * @param {string} noteId - ID of the note to locate
   * @returns {string | null} Notebook ID if found, null otherwise
   *
   * Search algorithm:
   * - Iterates through Areas → Stacks → Notebooks
   * - Checks each notebook's noteIds array
   * - Returns on first match
   * - Returns null if note is not found in any notebook
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
   * Save a single note to Google Drive as Markdown file
   *
   * Converts the note's HTML content to Markdown, adds frontmatter metadata,
   * and uploads the file to the appropriate folder in Google Drive.
   * Updates existing files if they already exist.
   *
   * @async
   * @param {Note} note - Note object to save
   * @param {Node[]} areas - Area hierarchy for folder structure
   * @returns {Promise<void>}
   * @throws {Error} If not connected or if upload fails
   *
   * Process:
   * 1. Find notebook containing this note
   * 2. Create/verify folder structure
   * 3. Convert HTML to Markdown with frontmatter
   * 4. Check if file already exists
   * 5. Update existing file or create new file
   * 6. Update sync status
   *
   * File format:
   * ```markdown
   * ---
   * title: Note Title
   * date: 2024-01-01
   * tags: []
   * ---
   *
   * [Markdown content here]
   * ```
   *
   * @example
   * ```typescript
   * await googleDriveService.saveNote(note, areas);
   * console.log('Note saved successfully');
   * ```
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

      // Create folder structure and get parent folder ID
      const folderMap = await this.createFolderStructure(areas);
      const parentFolderId = folderMap.get(notebookId);

      if (!parentFolderId) {
        console.warn('No folder found for notebook:', notebookId);
        return;
      }

      // Convert HTML to Markdown with frontmatter
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

      // Prepare file metadata
      const fileMetadata = {
        name: filename,
        mimeType: 'text/markdown',
        parents: [parentFolderId],
      };

      // Prepare multipart upload form
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

      // Update sync status
      this.syncStatus.lastSync = new Date();
      this.syncStatus.error = null;
    } catch (error) {
      console.error('Error saving note to Google Drive:', error);
      this.syncStatus.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Synchronize all notes to Google Drive
   *
   * Performs a complete sync of all notes in the application.
   * Sets isSyncing flag to prevent concurrent sync operations.
   *
   * @async
   * @param {Note[]} notes - Array of all notes to sync
   * @param {Node[]} areas - Area hierarchy for folder structure
   * @returns {Promise<void>}
   * @throws {Error} If not connected or if sync fails
   *
   * Process:
   * 1. Set isSyncing flag to true
   * 2. Iterate through all notes
   * 3. Save each note individually
   * 4. Update lastSync timestamp
   * 5. Clear isSyncing flag in finally block
   *
   * Error handling:
   * - Errors are logged but don't stop the entire sync
   * - Final error state is set if any note fails
   * - isSyncing is always cleared in finally block
   *
   * @example
   * ```typescript
   * try {
   *   await googleDriveService.syncAll(notes, areas);
   *   console.log('All notes synced successfully');
   * } catch (error) {
   *   console.error('Sync failed:', error);
   * }
   * ```
   */
  async syncAll(notes: Note[], areas: Node[]): Promise<void> {
    if (!this.syncStatus.isConnected) {
      throw new Error('Not connected to Google Drive');
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.error = null;

    try {
      // Save each note sequentially
      for (const note of notes) {
        await this.saveNote(note, areas);
      }
      this.syncStatus.lastSync = new Date();
    } catch (error) {
      console.error('Error syncing to Google Drive:', error);
      this.syncStatus.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      // Always clear syncing flag, even if errors occur
      this.syncStatus.isSyncing = false;
    }
  }

  /**
   * Get current synchronization status
   *
   * Returns a copy of the current sync status to prevent external mutations.
   *
   * @returns {SyncStatus} Current sync status object
   *
   * @example
   * ```typescript
   * const status = googleDriveService.getSyncStatus();
   * if (status.isConnected) {
   *   console.log('Connected to Google Drive');
   *   console.log('Last sync:', status.lastSync);
   * }
   * if (status.isSyncing) {
   *   console.log('Sync in progress...');
   * }
   * if (status.error) {
   *   console.error('Sync error:', status.error);
   * }
   * ```
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }
}

/**
 * Singleton instance of GoogleDriveService
 *
 * Use this exported instance throughout the application to ensure
 * consistent state and avoid multiple initialization.
 *
 * @example
 * ```typescript
 * import { googleDriveService } from './services/googleDriveService';
 *
 * await googleDriveService.initialize(clientId, apiKey);
 * await googleDriveService.signIn();
 * ```
 */
export const googleDriveService = new GoogleDriveService();

export default googleDriveService;
