/**
 * @fileoverview Sync Status Component
 *
 * Displays the current synchronization status with Google Drive,
 * including sync progress, last sync time, and error messages.
 *
 * Features:
 * - Real-time sync status indicator
 * - Manual sync button
 * - Last sync timestamp with relative time
 * - Error notifications with details
 * - Connection status indicator
 * - Animated spinner during sync
 *
 * @module components/SyncStatus
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  CloudSyncIcon,
  SpinnerIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '../constants';
import { googleDriveService } from '../services/googleDriveService';
import { Note, Node } from '../types';

/**
 * Props for the SyncStatus component
 * @interface SyncStatusProps
 */
interface SyncStatusProps {
  /** Array of all notes to sync */
  notes: Note[];
  /** Area hierarchy for folder structure */
  areas: Node[];
  /** Optional callback when sync completes successfully */
  onSyncComplete?: () => void;
}

/**
 * SyncStatus Component
 *
 * Displays sync status and provides manual sync button.
 * Updates every second to show relative time for last sync.
 *
 * @param {SyncStatusProps} props - Component props
 * @returns {JSX.Element} SyncStatus component
 *
 * @example
 * ```tsx
 * <SyncStatus
 *   notes={notes}
 *   areas={areas}
 *   onSyncComplete={() => console.log('Sync done!')}
 * />
 * ```
 */
export const SyncStatus: React.FC<SyncStatusProps> = ({
  notes,
  areas,
  onSyncComplete
}) => {
  // Get initial sync status
  const [syncStatus, setSyncStatus] = useState(googleDriveService.getSyncStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  /**
   * Update sync status from service
   * Called periodically to refresh the UI
   */
  const updateSyncStatus = useCallback(() => {
    setSyncStatus(googleDriveService.getSyncStatus());
  }, []);

  /**
   * Effect: Poll sync status every second
   *
   * This ensures the UI stays in sync with the service state
   * and the relative time ("2 minutes ago") updates correctly.
   */
  useEffect(() => {
    const interval = setInterval(updateSyncStatus, 1000);
    return () => clearInterval(interval);
  }, [updateSyncStatus]);

  /**
   * Handle manual sync button click
   *
   * Triggers a full sync of all notes to Google Drive.
   * Shows loading state during sync operation.
   *
   * @async
   */
  const handleManualSync = useCallback(async () => {
    if (!syncStatus.isConnected || isManualSyncing || syncStatus.isSyncing) {
      return;
    }

    setIsManualSyncing(true);
    try {
      await googleDriveService.syncAll(notes, areas);
      updateSyncStatus();
      onSyncComplete?.();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  }, [notes, areas, syncStatus.isConnected, isManualSyncing, syncStatus.isSyncing, updateSyncStatus, onSyncComplete]);

  /**
   * Format last sync time as relative time
   *
   * @param {Date | null} lastSync - Last sync timestamp
   * @returns {string} Relative time string (e.g., "2 minutes ago")
   */
  const getRelativeTime = (lastSync: Date | null): string => {
    if (!lastSync) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  };

  // Don't render if not connected
  if (!syncStatus.isConnected) {
    return null;
  }

  const isSyncing = syncStatus.isSyncing || isManualSyncing;
  const hasError = syncStatus.error !== null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800 border-t border-zinc-700">
      {/* Status Icon */}
      <div className="flex items-center gap-2">
        {isSyncing ? (
          <SpinnerIcon className="w-4 h-4 text-blue-400 animate-spin" />
        ) : hasError ? (
          <ExclamationCircleIcon className="w-4 h-4 text-red-400" />
        ) : (
          <CheckCircleIcon className="w-4 h-4 text-green-400" />
        )}

        {/* Status Text */}
        <span className="text-sm text-zinc-300">
          {isSyncing ? (
            'Syncing...'
          ) : hasError ? (
            'Sync failed'
          ) : (
            <>Last sync: {getRelativeTime(syncStatus.lastSync)}</>
          )}
        </span>
      </div>

      {/* Error Message */}
      {hasError && (
        <span
          className="text-xs text-red-400 truncate max-w-xs"
          title={syncStatus.error || undefined}
        >
          {syncStatus.error}
        </span>
      )}

      {/* Manual Sync Button */}
      <button
        onClick={handleManualSync}
        disabled={isSyncing}
        className={`
          ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md
          text-sm font-medium transition-colors
          ${isSyncing
            ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
          }
        `}
        title="Sync all notes to Google Drive"
        aria-label="Manual sync"
      >
        <CloudSyncIcon className="w-4 h-4" />
        <span>Sync Now</span>
      </button>
    </div>
  );
};

export default SyncStatus;
