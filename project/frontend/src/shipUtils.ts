export enum ShipType {
  CARGO = 'cargo',
  TANKER = 'tanker',
  PASSENGER = 'passenger',
  FISHING = 'fishing'
}

export enum ShipStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  BAD = 'bad',
  CRITICAL = 'critical'
}

// Calculate ship safety factor (0-1) based on type and status
export function calculateShipSafety(type: ShipType, status: ShipStatus): number {
  // Base safety values for ship types
  const typeFactors: Record<ShipType, number> = {
    [ShipType.CARGO]: 0.8,
    [ShipType.TANKER]: 0.7,
    [ShipType.PASSENGER]: 0.9,
    [ShipType.FISHING]: 0.6
  };
  
  // Status modifiers
  const statusFactors: Record<ShipStatus, number> = {
    [ShipStatus.EXCELLENT]: 1.0,
    [ShipStatus.GOOD]: 0.9,
    [ShipStatus.FAIR]: 0.7,
    [ShipStatus.BAD]: 0.4,
    [ShipStatus.CRITICAL]: 0.2
  };
  
  // Calculate combined safety factor
  const safety = typeFactors[type] * statusFactors[status];
  
  // Normalize to 0-1 range
  return Math.min(Math.max(safety, 0), 1);
}

// Calculate maximum safe wind speed for a ship
export function calculateMaxSafeWindSpeed(type: ShipType, status: ShipStatus): number {
  const safety = calculateShipSafety(type, status);
  
  // Base maximum wind speeds by ship type (in km/h)
  const baseMaxWindSpeeds: Record<ShipType, number> = {
    [ShipType.CARGO]: 80,
    [ShipType.TANKER]: 70,
    [ShipType.PASSENGER]: 60,
    [ShipType.FISHING]: 50
  };
  
  // Adjust based on safety factor
  return baseMaxWindSpeeds[type] * safety;
}

// Calculate maximum safe wave height for a ship
export function calculateMaxSafeWaveHeight(type: ShipType, status: ShipStatus): number {
  const safety = calculateShipSafety(type, status);
  
  // Base maximum wave heights by ship type (in meters)
  const baseMaxWaveHeights: Record<ShipType, number> = {
    [ShipType.CARGO]: 7,
    [ShipType.TANKER]: 6,
    [ShipType.PASSENGER]: 5,
    [ShipType.FISHING]: 4
  };
  
  // Adjust based on safety factor
  return baseMaxWaveHeights[type] * safety;
}

// Determine if a ship can safely navigate through specific weather conditions
export function canNavigateSafely(
  type: ShipType,
  status: ShipStatus,
  windSpeed: number,
  waveHeight: number
): boolean {
  const maxSafeWindSpeed = calculateMaxSafeWindSpeed(type, status);
  const maxSafeWaveHeight = calculateMaxSafeWaveHeight(type, status);
  
  return windSpeed <= maxSafeWindSpeed && waveHeight <= maxSafeWaveHeight;
}

// Calculate ship speed based on weather conditions
export function calculateShipSpeed(
  type: ShipType,
  baseSpeed: number,
  windSpeed: number,
  waveHeight: number
): number {
  // Base speed reduction factors
  let speedFactor = 1.0;
  
  // Reduce speed based on wind
  if (windSpeed > 40) {
    speedFactor -= 0.1 * ((windSpeed - 40) / 10);
  }
  
  // Reduce speed based on waves
  if (waveHeight > 2) {
    speedFactor -= 0.15 * ((waveHeight - 2) / 1);
  }
  
  // Ship type specific adjustments
  if (type === ShipType.PASSENGER) {
    // Passenger ships slow down more in rough conditions for comfort
    speedFactor -= 0.05;
  } else if (type === ShipType.FISHING) {
    // Fishing vessels are more affected by waves
    speedFactor -= 0.05 * waveHeight;
  }
  
  // Ensure factor doesn't go below 0.3 (30% of base speed)
  speedFactor = Math.max(speedFactor, 0.3);
  
  return baseSpeed * speedFactor;
}

// Calculate fuel consumption based on ship type, speed, and weather
export function calculateFuelConsumption(
  type: ShipType,
  speed: number,
  windSpeed: number,
  waveHeight: number
): number {
  // Base consumption rates by ship type (arbitrary units)
  const baseConsumption: Record<ShipType, number> = {
    [ShipType.CARGO]: 100,
    [ShipType.TANKER]: 120,
    [ShipType.PASSENGER]: 90,
    [ShipType.FISHING]: 60
  };
  
  // Speed factor (consumption increases with square of speed)
  const speedFactor = (speed / 20) ** 2;
  
  // Weather factors
  const windFactor = 1 + (windSpeed / 100);
  const waveFactor = 1 + (waveHeight / 5);
  
  return baseConsumption[type] * speedFactor * windFactor * waveFactor;
}