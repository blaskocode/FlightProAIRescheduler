/**
 * Reschedule Suggestions Cache
 * 
 * Caches reschedule suggestions for offline viewing.
 */

interface CachedSuggestion {
  flightId: string;
  suggestions: any[];
  timestamp: number;
  expiresAt: number;
}

const CACHE_KEY = 'flightpro_reschedule_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export class RescheduleCache {
  private cache: Map<string, CachedSuggestion> = new Map();

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        // Load and filter expired entries
        for (const [flightId, cached] of Object.entries(data)) {
          const suggestion = cached as CachedSuggestion;
          if (suggestion.expiresAt > now) {
            this.cache.set(flightId, suggestion);
          }
        }
        
        // Save cleaned cache
        this.saveCache();
      }
    } catch (err) {
      console.error('Error loading reschedule cache:', err);
      this.cache.clear();
    }
  }

  private saveCache() {
    if (typeof window === 'undefined') return;
    
    try {
      const data: Record<string, CachedSuggestion> = {};
      for (const [flightId, cached] of this.cache.entries()) {
        data[flightId] = cached;
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving reschedule cache:', err);
    }
  }

  /**
   * Cache reschedule suggestions for a flight
   */
  set(flightId: string, suggestions: any[]) {
    const now = Date.now();
    this.cache.set(flightId, {
      flightId,
      suggestions,
      timestamp: now,
      expiresAt: now + CACHE_EXPIRY,
    });
    this.saveCache();
  }

  /**
   * Get cached suggestions for a flight
   */
  get(flightId: string): any[] | null {
    const cached = this.cache.get(flightId);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(flightId);
      this.saveCache();
      return null;
    }
    
    return cached.suggestions;
  }

  /**
   * Check if suggestions are cached for a flight
   */
  has(flightId: string): boolean {
    return this.get(flightId) !== null;
  }

  /**
   * Remove cached suggestions for a flight
   */
  remove(flightId: string) {
    this.cache.delete(flightId);
    this.saveCache();
  }

  /**
   * Clear all cached suggestions
   */
  clear() {
    this.cache.clear();
    this.saveCache();
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    for (const [flightId, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(flightId);
      }
    }
    this.saveCache();
  }
}

// Singleton instance
export const rescheduleCache = typeof window !== 'undefined' ? new RescheduleCache() : null;

