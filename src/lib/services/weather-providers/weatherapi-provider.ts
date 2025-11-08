import { WeatherProvider, WeatherData, ForecastData } from './types';

/**
 * WeatherAPI.com Provider
 * Paid service with more detailed forecasts
 */
export class WeatherAPIProvider implements WeatherProvider {
  readonly name = 'WEATHERAPI';
  private apiKey: string | null;
  
  constructor() {
    this.apiKey = process.env.WEATHERAPI_API_KEY || null;
  }
  
  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'placeholder';
  }
  
  getCostPerCall(): number {
    // WeatherAPI.com pricing: ~$0.001 per call (varies by plan)
    return 0.001;
  }
  
  async getCurrentWeather(airportCode: string): Promise<WeatherData | null> {
    if (!this.isAvailable()) {
      return null;
    }
    
    try {
      // WeatherAPI.com uses location (lat/lon) or city name
      // For airports, we need to convert airport code to coordinates
      // For now, we'll use a simplified approach with airport code as query
      const url = `https://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=${airportCode}&aqi=no`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`WeatherAPI returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.current) {
        return null;
      }

      // Convert WeatherAPI.com format to our WeatherData format
      return this.convertWeatherAPIData(data, airportCode);
    } catch (error) {
      console.error('Error fetching WeatherAPI.com weather:', error);
      return null;
    }
  }
  
  async getForecast(airportCode: string): Promise<ForecastData | null> {
    if (!this.isAvailable()) {
      return null;
    }
    
    try {
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${this.apiKey}&q=${airportCode}&days=3&aqi=no&alerts=no`;
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (!data || !data.forecast) {
        return null;
      }

      // Convert WeatherAPI.com forecast to our format
      const forecasts = data.forecast.forecastday.map((day: any) => ({
        time: new Date(day.date),
        temperature: day.day.avgtemp_f,
        conditions: day.day.condition.text,
        wind: {
          direction: day.day.maxwind_dir || 0,
          speed: day.day.maxwind_mph * 0.868976, // Convert mph to knots
        },
        visibility: day.day.avgvis_miles || 10,
        ceiling: 10000, // WeatherAPI doesn't provide ceiling, use default
      }));

      return {
        location: airportCode,
        forecasts,
        source: 'WEATHERAPI',
      };
    } catch (error) {
      console.error('Error fetching WeatherAPI.com forecast:', error);
      return null;
    }
  }
  
  /**
   * Convert WeatherAPI.com response to our WeatherData format
   */
  private convertWeatherAPIData(data: any, airportCode: string): WeatherData {
    const current = data.current;
    
    // Convert wind speed from mph to knots
    const windSpeedKnots = (current.wind_mph || 0) * 0.868976;
    const windGustKnots = (current.gust_mph || 0) * 0.868976;
    
    // Estimate ceiling from cloud coverage
    // WeatherAPI doesn't provide exact ceiling, so we estimate
    let ceiling = 99999;
    if (current.cloud < 25) {
      ceiling = 10000;
    } else if (current.cloud < 50) {
      ceiling = 5000;
    } else if (current.cloud < 75) {
      ceiling = 3000;
    } else {
      ceiling = 1000;
    }
    
    // Convert visibility from miles (already in statute miles)
    const visibility = current.vis_miles || 10;
    
    // Determine conditions
    const conditions: string[] = [];
    const conditionText = (current.condition?.text || '').toUpperCase();
    if (conditionText.includes('RAIN')) conditions.push('RA');
    if (conditionText.includes('SNOW')) conditions.push('SN');
    if (conditionText.includes('THUNDER')) conditions.push('TS');
    if (conditionText.includes('SHOWER')) conditions.push('SH');
    
    return {
      station: airportCode,
      time: new Date(current.last_updated),
      wind: {
        direction: current.wind_degree || 0,
        speed: Math.round(windSpeedKnots),
        gust: windGustKnots > 0 ? Math.round(windGustKnots) : undefined,
        units: 'knots',
      },
      visibility: {
        value: visibility,
        units: 'statute miles',
      },
      clouds: [{
        cover: current.cloud < 25 ? 'FEW' : current.cloud < 50 ? 'SCT' : current.cloud < 75 ? 'BKN' : 'OVC',
        altitude: ceiling,
      }],
      temperature: current.temp_f,
      dewpoint: current.dewpoint_f || current.temp_f - 10,
      altimeter: current.pressure_in || 30.12,
      conditions: conditions.length > 0 ? conditions : undefined,
      source: 'WEATHERAPI',
    };
  }
}

