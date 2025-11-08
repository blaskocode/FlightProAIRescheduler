import { WeatherProvider, WeatherData, ForecastData } from './types';
import { FAAProvider } from './faa-provider';
import { WeatherAPIProvider } from './weatherapi-provider';
import { prisma } from '@/lib/prisma';

/**
 * Weather Provider Adapter
 * Manages multiple weather providers with fallback logic
 */
export class WeatherProviderAdapter {
  private providers: WeatherProvider[];
  private faaProvider: FAAProvider;
  private weatherAPIProvider: WeatherAPIProvider;
  private costTracking: Map<string, number> = new Map();
  
  constructor() {
    this.faaProvider = new FAAProvider();
    this.weatherAPIProvider = new WeatherAPIProvider();
    this.providers = [this.faaProvider, this.weatherAPIProvider];
  }
  
  /**
   * Get current weather with fallback logic and caching
   * Tries providers in order: WeatherAPI (if enabled) → FAA → cached data
   */
  async getCurrentWeather(
    airportCode: string,
    schoolId?: string
  ): Promise<WeatherData | null> {
    // Use cached weather service
    const { getCachedWeather } = await import('../weather-cache-service');
    
    return getCachedWeather(airportCode, async () => {
      return this.getCurrentWeatherUncached(airportCode, schoolId);
    });
  }

  /**
   * Get current weather without caching (internal method)
   */
  private async getCurrentWeatherUncached(
    airportCode: string,
    schoolId?: string
  ): Promise<WeatherData | null> {
    // Check if WeatherAPI.com is enabled for this school
    let useWeatherAPI = false;
    if (schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { weatherApiEnabled: true },
      });
      useWeatherAPI = school?.weatherApiEnabled || false;
    }
    
    // Try WeatherAPI first if enabled
    if (useWeatherAPI && this.weatherAPIProvider.isAvailable()) {
      const weather = await this.weatherAPIProvider.getCurrentWeather(airportCode);
      if (weather) {
        this.trackCost('WEATHERAPI', this.weatherAPIProvider.getCostPerCall());
        return weather;
      }
      // Fall through to FAA if WeatherAPI fails
    }
    
    // Try FAA (always available)
    const weather = await this.faaProvider.getCurrentWeather(airportCode);
    if (weather) {
      this.trackCost('FAA', this.faaProvider.getCostPerCall());
      return weather;
    }
    
    return null;
  }
  
  /**
   * Get forecast with fallback logic
   */
  async getForecast(
    airportCode: string,
    schoolId?: string
  ): Promise<ForecastData | null> {
    let useWeatherAPI = false;
    if (schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { weatherApiEnabled: true },
      });
      useWeatherAPI = school?.weatherApiEnabled || false;
    }
    
    // Try WeatherAPI first if enabled
    if (useWeatherAPI && this.weatherAPIProvider.isAvailable()) {
      const forecast = await this.weatherAPIProvider.getForecast(airportCode);
      if (forecast) {
        this.trackCost('WEATHERAPI', this.weatherAPIProvider.getCostPerCall());
        return forecast;
      }
    }
    
    // Try FAA
    const forecast = await this.faaProvider.getForecast(airportCode);
    if (forecast) {
      this.trackCost('FAA', this.faaProvider.getCostPerCall());
      return forecast;
    }
    
    return null;
  }
  
  /**
   * Track API costs
   */
  private trackCost(provider: string, cost: number): void {
    const current = this.costTracking.get(provider) || 0;
    this.costTracking.set(provider, current + cost);
  }
  
  /**
   * Get total costs for a provider
   */
  getCosts(provider?: string): Map<string, number> {
    if (provider) {
      const cost = this.costTracking.get(provider) || 0;
      return new Map([[provider, cost]]);
    }
    return new Map(this.costTracking);
  }
  
  /**
   * Reset cost tracking
   */
  resetCosts(): void {
    this.costTracking.clear();
  }
}

// Singleton instance
let adapterInstance: WeatherProviderAdapter | null = null;

export function getWeatherAdapter(): WeatherProviderAdapter {
  if (!adapterInstance) {
    adapterInstance = new WeatherProviderAdapter();
  }
  return adapterInstance;
}

