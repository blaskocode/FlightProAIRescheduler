import { WeatherProvider, WeatherData, ForecastData } from './types';

/**
 * FAA Aviation Weather Center Provider
 * Free, official source for METAR data
 */
export class FAAProvider implements WeatherProvider {
  readonly name = 'FAA';
  
  isAvailable(): boolean {
    // FAA is always available (public API)
    return true;
  }
  
  getCostPerCall(): number {
    return 0; // Free
  }
  
  async getCurrentWeather(airportCode: string): Promise<WeatherData | null> {
    try {
      const url = `https://aviationweather.gov/api/data/metar?ids=${airportCode}&format=json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`FAA API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        return null;
      }

      const metar = data[0];
      const weatherData = this.parseMETAR(metar.rawOb || metar.rawText);
      
      if (weatherData) {
        weatherData.source = 'FAA';
      }
      
      return weatherData;
    } catch (error) {
      console.error('Error fetching FAA weather:', error);
      return null;
    }
  }
  
  async getForecast(airportCode: string): Promise<ForecastData | null> {
    // FAA TAF (Terminal Area Forecast) - simplified implementation
    // Full TAF parsing would be more complex
    try {
      const url = `https://aviationweather.gov/api/data/taf?ids=${airportCode}&format=json`;
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        return null;
      }

      // Simplified TAF parsing - would need full implementation
      return {
        location: airportCode,
        forecasts: [],
        source: 'FAA',
      };
    } catch (error) {
      console.error('Error fetching FAA forecast:', error);
      return null;
    }
  }
  
  /**
   * Parse METAR string into WeatherData
   */
  private parseMETAR(metarString: string): WeatherData | null {
    try {
      const parts = metarString.split(' ');
      
      // Extract station code
      const station = parts[0];
      
      // Extract wind (e.g., "18008KT" or "18008G15KT")
      const windMatch = metarString.match(/(\d{3})(\d{2,3})(G(\d{2,3}))?KT/);
      const wind = {
        direction: windMatch ? parseInt(windMatch[1]) : 0,
        speed: windMatch ? parseInt(windMatch[2]) : 0,
        gust: windMatch?.[4] ? parseInt(windMatch[4]) : undefined,
        units: 'knots' as const,
      };

      // Extract visibility (e.g., "10SM")
      const visMatch = metarString.match(/(\d+)(SM|M)/);
      const visibility = {
        value: visMatch ? parseInt(visMatch[1]) : 10,
        units: 'statute miles' as const,
      };

      // Extract clouds (e.g., "FEW250", "SCT1000", "BKN030")
      const cloudMatches = metarString.matchAll(/(FEW|SCT|BKN|OVC)(\d{3})/g);
      const clouds = Array.from(cloudMatches).map(match => ({
        cover: match[1],
        altitude: parseInt(match[2]) * 100, // Convert to feet
      }));

      // Extract temperature (e.g., "23/14")
      const tempMatch = metarString.match(/(\d{2})\/(\d{2})/);
      const temperature = tempMatch ? parseInt(tempMatch[1]) : 20;
      const dewpoint = tempMatch ? parseInt(tempMatch[2]) : 10;

      // Extract altimeter (e.g., "A3012")
      const altMatch = metarString.match(/A(\d{4})/);
      const altimeter = altMatch ? parseFloat(altMatch[1]) / 100 : 30.12;

      // Extract conditions
      const conditions: string[] = [];
      if (metarString.includes('RA')) conditions.push('RA');
      if (metarString.includes('SN')) conditions.push('SN');
      if (metarString.includes('TS')) conditions.push('TS');
      if (metarString.includes('SH')) conditions.push('SH');

      return {
        station,
        time: new Date(),
        wind,
        visibility,
        clouds: clouds.length > 0 ? clouds : [{ cover: 'CLR', altitude: 99999 }],
        temperature,
        dewpoint,
        altimeter,
        conditions: conditions.length > 0 ? conditions : undefined,
        source: 'FAA',
      };
    } catch (error) {
      console.error('Error parsing METAR:', error);
      return null;
    }
  }
}

