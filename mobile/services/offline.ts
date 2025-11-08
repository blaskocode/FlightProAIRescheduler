import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

/**
 * Store data for offline access
 */
export async function storeOffline(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error storing offline data:', error);
  }
}

/**
 * Retrieve offline data
 */
export async function getOffline<T>(key: string): Promise<T | null> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving offline data:', error);
    return null;
  }
}

/**
 * Queue API request for when online
 */
export async function queueRequest(
  endpoint: string,
  method: string,
  body: any
): Promise<void> {
  const queue = await getOffline<Array<{ endpoint: string; method: string; body: any }>>('request-queue') || [];
  queue.push({ endpoint, method, body });
  await storeOffline('request-queue', queue);
}

/**
 * Process queued requests when online
 */
export async function processQueuedRequests(): Promise<void> {
  const isConnected = await isOnline();
  if (!isConnected) return;

  const queue = await getOffline<Array<{ endpoint: string; method: string; body: any; timestamp: number }>>('request-queue') || [];
  
  for (const request of queue) {
    try {
      // Process request
      // Note: Would need auth token here
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}${request.endpoint}`, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request.body),
      });
    } catch (error) {
      console.error('Error processing queued request:', error);
    }
  }

  // Clear queue after processing
  await AsyncStorage.removeItem('request-queue');
}

