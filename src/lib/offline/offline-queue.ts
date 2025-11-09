/**
 * Offline Action Queue
 * 
 * Queues actions when offline and syncs when connection is restored.
 */

interface QueuedAction {
  id: string;
  type: 'reschedule' | 'override' | 'squawk' | 'other';
  endpoint: string;
  method: string;
  body: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'flightpro_offline_queue';
const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 50;

export class OfflineQueue {
  private queue: QueuedAction[] = [];

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (err) {
      console.error('Error loading offline queue:', err);
      this.queue = [];
    }
  }

  private saveQueue() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (err) {
      console.error('Error saving offline queue:', err);
    }
  }

  /**
   * Add an action to the queue
   */
  enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): string {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest action
      this.queue.shift();
    }

    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedAction);
    this.saveQueue();
    
    return queuedAction.id;
  }

  /**
   * Process all queued actions
   */
  async processQueue(): Promise<{ succeeded: number; failed: number }> {
    if (this.queue.length === 0) {
      return { succeeded: 0, failed: 0 };
    }

    const results = { succeeded: 0, failed: 0 };
    const remaining: QueuedAction[] = [];

    for (const action of this.queue) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            ...action.headers,
          },
          body: JSON.stringify(action.body),
        });

        if (response.ok) {
          results.succeeded++;
        } else {
          // Retry if not exceeded max retries
          if (action.retries < MAX_RETRIES) {
            action.retries++;
            remaining.push(action);
          } else {
            results.failed++;
            console.error(`Failed to process queued action after ${MAX_RETRIES} retries:`, action);
          }
        }
      } catch (err) {
        // Retry if not exceeded max retries
        if (action.retries < MAX_RETRIES) {
          action.retries++;
          remaining.push(action);
        } else {
          results.failed++;
          console.error(`Error processing queued action after ${MAX_RETRIES} retries:`, err);
        }
      }
    }

    this.queue = remaining;
    this.saveQueue();

    return results;
  }

  /**
   * Get all queued actions
   */
  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Remove a specific action by ID
   */
  remove(id: string) {
    this.queue = this.queue.filter((action) => action.id !== id);
    this.saveQueue();
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }
}

// Singleton instance
export const offlineQueue = typeof window !== 'undefined' ? new OfflineQueue() : null;

