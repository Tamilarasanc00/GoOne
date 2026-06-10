import { io, Socket } from 'socket.io-client';
import { storage, StorageKeys, loadJSON } from './storage';
import { BASE_URL } from '../config/apiConfig';

const SOCKET_URL = BASE_URL;

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  connect() {
    if (this.socket?.connected) return;

    // We assume the JWT is stored in MMKV under a key like APP_JWT_TOKEN
    // Note: You will need to make sure authController sets this token upon login!
    const token = storage.getString('APP_JWT_TOKEN');
    
    if (!token) {
      console.log('[SocketClient] Cannot connect: No JWT found');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('[SocketClient] Connected to backend');
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketClient] Disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.error(`[SocketClient] Connect error: ${err.message}`);
    });

    // Re-register all listeners globally attached
    this.setupGlobalListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (payload: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: (payload: any) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter((cb) => cb !== callback));
    }
    
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, payload: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, payload);
    } else {
      console.warn(`[SocketClient] Cannot emit '${event}': Not connected`);
    }
  }

  private setupGlobalListeners() {
    if (!this.socket) return;
    
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(cb => {
        this.socket?.on(event, cb);
      });
    });
  }
}

export const socketClient = new SocketClient();
