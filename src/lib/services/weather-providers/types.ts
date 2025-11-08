/**
 * Weather Provider Types
 * Defines the interface for weather data providers
 */

export interface WeatherData {
  station: string;
  time: Date;
  wind: {
    direction: number;
    speed: number;
    gust?: number;
    units: 'knots';
  };
  visibility: {
    value: number;
    units: 'statute miles';
  };
  clouds: Array<{
    cover: string;
    altitude: number;
  }>;
  temperature: number;
  dewpoint: number;
  altimeter: number;
  conditions?: string[];
  source?: 'FAA' | 'WEATHERAPI';
}

export interface ForecastData {
  location: string;
  forecasts: Array<{
    time: Date;
    temperature: number;
    conditions: string;
    wind: {
      direction: number;
      speed: number;
    };
    visibility: number;
    ceiling: number;
  }>;
  source: 'FAA' | 'WEATHERAPI';
}

/**
 * Weather Provider Interface
 * All weather providers must implement this interface
 */
export interface WeatherProvider {
  /**
   * Get current weather for an airport
   */
  getCurrentWeather(airportCode: string): Promise<WeatherData | null>;
  
  /**
   * Get forecast for an airport
   */
  getForecast(airportCode: string): Promise<ForecastData | null>;
  
  /**
   * Provider name for identification
   */
  readonly name: string;
  
  /**
   * Whether this provider is available/configured
   */
  isAvailable(): boolean;
  
  /**
   * Cost per API call (for tracking)
   */
  getCostPerCall(): number;
}

