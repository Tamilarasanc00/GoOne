import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { StorageKeys, loadJSON, saveJSON } from './storage';

export type SyncAction = {
  id: string;
  type: 'ADD_PRODUCT' | 'BOOK_SERVICE' | 'UPDATE_PROFILE' | 'GENERIC_SYNC';
  payload: any;
  timestamp: number;
};

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
    return new Promise((resolve, reject) => {
      // Mock API call latency
      setTimeout(() => {
        // In a real app, this would use axios or fetch to hit the backend endpoint
        // e.g. await api.post('/sync', action.payload);
        resolve();
      }, 500);
    });
  }
}

export const syncService = new SyncService();
