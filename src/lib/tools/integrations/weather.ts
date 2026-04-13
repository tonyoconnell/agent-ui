import { z } from 'zod'
import { type Tool, toolRegistry } from '../registry'

/**
 * Weather Tool - Get current weather for a location using Open-Meteo API
 * https://open-meteo.com/en/docs
 *
 * No API key required! ✨
 *
 * Ontology mapping:
 * - Weather query = Event (type: 'data_fetched')
 * - Weather API = Thing (type: 'data_source')
 */
const weatherParams = z.object({
  location: z.string().describe('City name (e.g., "San Francisco", "London", "Tokyo")'),
})

async function getWeather(params: z.infer<typeof weatherParams>) {
  const { location } = params

  try {
    // Step 1: Geocode the location to get coordinates
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`

    const geocodeResponse = await fetch(geocodeUrl)
    const geocodeData = (await geocodeResponse.json()) as any

    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error(`Location "${location}" not found`)
    }

    const { latitude, longitude, name, country, admin1 } = geocodeData.results[0]
    const fullLocation = admin1 ? `${name}, ${admin1}, ${country}` : `${name}, ${country}`

    // Step 2: Get weather data for the coordinates
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`

    const weatherResponse = await fetch(weatherUrl)
    const weatherData = (await weatherResponse.json()) as any

    const current = weatherData.current

    // Map weather codes to descriptions
    // https://open-meteo.com/en/docs
    const weatherDescriptions: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    }

    const description = weatherDescriptions[current.weather_code] || 'Unknown'

    return {
      location: fullLocation,
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      description,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      coordinates: {
        latitude,
        longitude,
      },
    }
  } catch (error) {
    throw new Error(`Failed to fetch weather: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const weatherTool: Tool = {
  name: 'get_weather',
  description:
    'AUTOMATICALLY get current weather for any location worldwide. Returns temperature (°F), feels like, humidity, wind speed, and weather description. No API key needed - powered by Open-Meteo.',
  category: 'integration',
  parameters: weatherParams,
  execute: getWeather,
  cacheable: true,
  cacheTTL: 300000, // Cache for 5 minutes
}

toolRegistry.register(weatherTool)
