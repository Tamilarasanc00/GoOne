import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { StorageKeys, loadJSON, saveJSON } from './storage';

export type SyncAction = {
  id: string;
  type: 'ADD_PRODUCT' | 'BOOK_SERVICE' | 'UPDATE_PROFILE' | 'GENERIC_SYNC';
  payload: any;
  timestamp: number;
};

import { apiService } from './apiService';

class SyncService {
  private isConnected: boolean = false;
  private isSyncing: boolean = false;
  private unsubscribe: (() => void) | null = null;

  init() {
    this.unsubscribe = NetInfo.addEventListener(this.handleConnectivityChange);
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  private handleConnectivityChange = (state: NetInfoState) => {
    this.isConnected = !!state.isConnected && !!state.isInternetReachable;
    console.log(`[SyncService] Network Status Changed: Connected=${this.isConnected}`);
    
    if (this.isConnected) {
      this.processQueue();
    }
  };

  /**
   * Add an action to the offline queue
   */
  queueAction(type: SyncAction['type'], payload: any) {
    const queue = loadJSON<SyncAction[]>(StorageKeys.SYNC_QUEUE) || [];
    
    const newAction: SyncAction = {
      id: Math.random().toString(36).substring(2, 15),
      type,
      payload,
      timestamp: Date.now(),
    };
    
    queue.push(newAction);
    saveJSON(StorageKeys.SYNC_QUEUE, queue);
    console.log(`[SyncService] Action queued: ${type}`);

    // Attempt to sync immediately if we have a connection
    if (this.isConnected) {
      this.processQueue();
    }
  }

  /**
   * Process all queued actions when internet is available
   */
  private async processQueue() {
    if (this.isSyncing || !this.isConnected) return;

    const queue = loadJSON<SyncAction[]>(StorageKeys.SYNC_QUEUE) || [];
    if (queue.length === 0) return;

    this.isSyncing = true;
    console.log(`[SyncService] Starting sync for ${queue.length} items...`);

    const failedActions: SyncAction[] = [];

    for (const action of queue) {
      try {
        await this.syncAction(action);
        console.log(`[SyncService] Successfully synced action: ${action.type}`);
      } catch (error) {
        console.error(`[SyncService] Failed to sync action: ${action.type}`, error);
        failedActions.push(action); // Keep it in the queue for later
      }
    }

    // Save any actions that failed back to the queue
    saveJSON(StorageKeys.SYNC_QUEUE, failedActions);
    this.isSyncing = false;
    
    if (failedActions.length === 0) {
      console.log(`[SyncService] Sync queue fully cleared.`);
    } else {
      console.log(`[SyncService] Sync finished with ${failedActions.length} failures remaining.`);
    }
  }

  /**
   * Execute the actual sync logic for a single action
   */
  private async syncAction(action: SyncAction): Promise<void> {
    const { type, payload } = action;
    console.log(`[SyncService] Syncing action type: ${type}`);
    if (type === 'BOOK_SERVICE') {
      await apiService.bookings.create(payload);
    } else if (type === 'ADD_PRODUCT') {
      await apiService.products.create(payload);
    } else if (type === 'UPDATE_PROFILE') {
      await apiService.profile.completeProfile(payload);
    } else if (type === 'GENERIC_SYNC') {
      // no-op or custom sync action
    } else {
      throw new Error(`Unknown action type: ${type}`);
    }
  }
}

export const syncService = new SyncService();
