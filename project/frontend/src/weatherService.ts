import axios from 'axios';
import { LatLngTuple } from 'leaflet';

export interface WeatherCondition {
  position: LatLngTuple;
  radius: number; // in km
  type: 'storm' | 'highWaves' | 'fog' | 'normal';
  windSpeed: number; // in km/h
  waveHeight: number; // in meters
  visibility: 'low' | 'moderate' | 'high';
  intensity: number; // 0-1 scale
}

// Convert wind speed from m/s to km/h
const msToKmh = (ms: number) => ms * 3.6;

// Calculate weather phenomenon radius based on intensity
const calculateRadius = (intensity: number): number => {
  // Base radius of 50km, scaled by intensity (0-1)
  return 50 + (intensity * 150);
};

// Determine weather type based on conditions
const determineWeatherType = (
  windSpeed: number,
  rain: number | undefined,
  clouds: number
): WeatherCondition['type'] => {
  if (windSpeed > 15) return 'storm';
  if (rain && rain > 5) return 'highWaves';
  if (clouds > 80) return 'fog';
  return 'normal';
};

// Determine visibility based on conditions
const determineVisibility = (
  clouds: number,
  rain: number | undefined
): WeatherCondition['visibility'] => {
  if (clouds > 80 || (rain && rain > 10)) return 'low';
  if (clouds > 50 || (rain && rain > 5)) return 'moderate';
  return 'high';
};

// Calculate intensity based on weather parameters
const calculateIntensity = (
  windSpeed: number,
  rain: number | undefined,
  clouds: number
): number => {
  let intensity = 0;
  
  // Wind contribution (0-0.4)
  intensity += Math.min(windSpeed / 30, 0.4);
  
  // Rain contribution (0-0.4)
  if (rain) {
    intensity += Math.min(rain / 25, 0.4);
  }
  
  // Cloud contribution (0-0.2)
  intensity += (clouds / 100) * 0.2;
  
  return Math.min(intensity, 1);
};

// Calculate distance between two points in kilometers
const calculateDistanceInKm = (point1: LatLngTuple, point2: LatLngTuple): number => {
  const R = 6371; // Earth's radius in kilometers
  const lat1 = point1[0] * Math.PI / 180;
  const lat2 = point2[0] * Math.PI / 180;
  const dLat = (point2[0] - point1[0]) * Math.PI / 180;
  const dLon = (point2[1] - point1[1]) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1) * Math.cos(lat2) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Merge nearby weather conditions
const mergeWeatherConditions = (conditions: WeatherCondition[]): WeatherCondition[] => {
  if (conditions.length <= 1) return conditions;

  const merged: WeatherCondition[] = [];
  const used = new Set<number>();

  for (let i = 0; i < conditions.length; i++) {
    if (used.has(i)) continue;

    let current = conditions[i];
    let mergedCount = 1;
    let totalWindSpeed = current.windSpeed;
    let totalWaveHeight = current.waveHeight;
    let maxIntensity = current.intensity;
    let centerLat = current.position[0];
    let centerLon = current.position[1];
    let maxRadius = current.radius;

    // Find nearby conditions to merge
    for (let j = i + 1; j < conditions.length; j++) {
      if (used.has(j)) continue;

      const other = conditions[j];
      const distance = calculateDistanceInKm(current.position, other.position);
      
      // Merge if distance is less than the sum of their radii plus a buffer
      if (distance < (current.radius + other.radius + 100)) {
        used.add(j);
        mergedCount++;
        totalWindSpeed += other.windSpeed;
        totalWaveHeight += other.waveHeight;
        maxIntensity = Math.max(maxIntensity, other.intensity);
        centerLat += other.position[0];
        centerLon += other.position[1];
        maxRadius = Math.max(maxRadius, other.radius);
      }
    }

    if (mergedCount > 1) {
      // Create merged weather condition
      merged.push({
        position: [centerLat / mergedCount, centerLon / mergedCount],
        radius: maxRadius * Math.sqrt(mergedCount), // Scale radius based on number of merged conditions
        type: current.type,
        windSpeed: totalWindSpeed / mergedCount,
        waveHeight: totalWaveHeight / mergedCount,
        visibility: current.visibility,
        intensity: maxIntensity
      });
    } else {
      merged.push(current);
    }
  }

  return merged;
};

export async function fetchWeatherData(
  bounds: { north: number; south: number; east: number; west: number }
): Promise<WeatherCondition[]> {
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!API_KEY) {
    console.error('OpenWeather API key not found in environment variables');
    return [];
  }

  try {
    // Calculate grid points within bounds
    const gridSize = 2; // degrees
    const conditions: WeatherCondition[] = [];
    
    for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
      for (let lon = bounds.west; lon <= bounds.east; lon += gridSize) {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        const data = response.data;
        const windSpeed = msToKmh(data.wind.speed);
        const rain = data.rain?.['1h'] || data.rain?.['3h'];
        const clouds = data.clouds.all;
        
        const waveHeight = Math.min((windSpeed / 10) + (rain ? rain / 5 : 0), 10);
        const intensity = calculateIntensity(windSpeed, rain, clouds);
        
        if (intensity > 0.2) {
          conditions.push({
            position: [lat, lon],
            radius: calculateRadius(intensity),
            type: determineWeatherType(windSpeed, rain, clouds),
            windSpeed: windSpeed,
            waveHeight: waveHeight,
            visibility: determineVisibility(clouds, rain),
            intensity: intensity
          });
        }
      }
    }

    // Merge nearby weather conditions before returning
    return mergeWeatherConditions(conditions);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return [];
  }
}

// Helper functions for route calculations
export function isRouteAffectedByWeather(
  point1: LatLngTuple,
  point2: LatLngTuple,
  weatherConditions: WeatherCondition[]
): boolean {
  for (const condition of weatherConditions) {
    if (
      isPointInWeatherCondition(point1, condition) ||
      isPointInWeatherCondition(point2, condition) ||
      doesLineIntersectCircle(point1, point2, condition.position, condition.radius / 111)
    ) {
      return true;
    }
  }
  return false;
}

function isPointInWeatherCondition(
  point: LatLngTuple,
  condition: WeatherCondition
): boolean {
  const distance = calculateDistance(point, condition.position);
  return distance < condition.radius / 111;
}

function calculateDistance(point1: LatLngTuple, point2: LatLngTuple): number {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function doesLineIntersectCircle(
  point1: LatLngTuple,
  point2: LatLngTuple,
  circleCenter: LatLngTuple,
  circleRadius: number
): boolean {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  const cx = circleCenter[0] - point1[0];
  const cy = circleCenter[1] - point1[1];
  const lengthSquared = dx * dx + dy * dy;
  const dot = cx * dx + cy * dy;
  const projection = dot / lengthSquared;
  
  let closestX, closestY;
  
  if (projection < 0) {
    closestX = point1[0];
    closestY = point1[1];
  } else if (projection > 1) {
    closestX = point2[0];
    closestY = point2[1];
  } else {
    closestX = point1[0] + projection * dx;
    closestY = point1[1] + projection * dy;
  }
  
  const distanceX = closestX - circleCenter[0];
  const distanceY = closestY - circleCenter[1];
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;
  
  return distanceSquared < circleRadius * circleRadius;
}

export function getWeatherSeverityAtPoint(
  point: LatLngTuple,
  weatherConditions: WeatherCondition[]
): number {
  let maxSeverity = 0;
  
  for (const condition of weatherConditions) {
    const distance = calculateDistance(point, condition.position);
    const radiusInDegrees = condition.radius / 111;
    
    if (distance < radiusInDegrees) {
      const depthFactor = 1 - (distance / radiusInDegrees);
      maxSeverity = Math.max(maxSeverity, condition.intensity * depthFactor);
    }
  }
  
  return maxSeverity;
}