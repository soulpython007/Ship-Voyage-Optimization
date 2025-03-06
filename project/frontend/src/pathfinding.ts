import { LatLngTuple } from 'leaflet';
import PriorityQueue from 'priority-queue-typescript';

// Grid resolution for pathfinding (in degrees)
const GRID_RESOLUTION = 0.5;

// Convert lat/lng to grid coordinates
function latLngToGrid(point: LatLngTuple): [number, number] {
  return [
    Math.floor(point[0] / GRID_RESOLUTION),
    Math.floor(point[1] / GRID_RESOLUTION)
  ];
}

// Convert grid coordinates back to lat/lng
function gridToLatLng(grid: [number, number]): LatLngTuple {
  return [
    (grid[0] + 0.5) * GRID_RESOLUTION,
    (grid[1] + 0.5) * GRID_RESOLUTION
  ];
}

// Calculate heuristic (straight-line distance)
function heuristic(a: [number, number], b: [number, number]): number {
  return Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
}

// Get neighboring grid cells
function getNeighbors(grid: [number, number]): [number, number][] {
  const [x, y] = grid;
  return [
    [x+1, y], [x-1, y], [x, y+1], [x, y-1],
    [x+1, y+1], [x+1, y-1], [x-1, y+1], [x-1, y-1]
  ];
}

// A* pathfinding algorithm
export function findPath(start: LatLngTuple, end: LatLngTuple): LatLngTuple[] {
  const startGrid = latLngToGrid(start);
  const endGrid = latLngToGrid(end);
  
  // Priority queue for open set
  const openSet = new PriorityQueue<{
    grid: [number, number];
    priority: number;
  }>((a, b) => a.priority < b.priority);
  
  openSet.add({ grid: startGrid, priority: 0 });
  
  // Maps for tracking
  const cameFrom = new Map<string, [number, number]>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  
  // Initialize scores
  gScore.set(startGrid.toString(), 0);
  fScore.set(startGrid.toString(), heuristic(startGrid, endGrid));
  
  // Set of visited nodes
  const closedSet = new Set<string>();
  
  while (!openSet.isEmpty()) {
    const current = openSet.poll()!.grid;
    const currentKey = current.toString();
    
    // If we've reached the goal
    if (current[0] === endGrid[0] && current[1] === endGrid[1]) {
      return reconstructPath(cameFrom, current);
    }
    
    closedSet.add(currentKey);
    
    // Check all neighbors
    for (const neighbor of getNeighbors(current)) {
      const neighborKey = neighbor.toString();
      
      // Skip if already evaluated
      if (closedSet.has(neighborKey)) {
        continue;
      }
      
      // Calculate tentative gScore
      const tentativeGScore = (gScore.get(currentKey) || Infinity) + 
        (current[0] === neighbor[0] || current[1] === neighbor[1] ? 1 : 1.4); // Diagonal movement costs more
      
      // If this path is better than any previous one
      if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
        // Record this path
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, endGrid));
        
        // Add to open set if not already there
        openSet.add({
          grid: neighbor,
          priority: fScore.get(neighborKey) || Infinity
        });
      }
    }
  }
  
  // If we get here, no path was found
  // Return a straight line as fallback
  return [start, end];
}

// Reconstruct path from cameFrom map
function reconstructPath(
  cameFrom: Map<string, [number, number]>,
  current: [number, number]
): LatLngTuple[] {
  const path: LatLngTuple[] = [gridToLatLng(current)];
  let currentKey = current.toString();
  
  while (cameFrom.has(currentKey)) {
    current = cameFrom.get(currentKey)!;
    currentKey = current.toString();
    path.unshift(gridToLatLng(current));
  }
  
  return path;
}

// Function to adjust route based on obstacles (like bad weather)
export function adjustRouteForObstacles(
  route: LatLngTuple[],
  obstacles: { center: LatLngTuple, radius: number }[]
): LatLngTuple[] {
  // In a real implementation, this would be more sophisticated
  // For now, we'll just add waypoints to go around obstacles
  
  let adjustedRoute = [...route];
  
  for (const obstacle of obstacles) {
    // Find route segments that intersect with the obstacle
    for (let i = 0; i < adjustedRoute.length - 1; i++) {
      const point1 = adjustedRoute[i];
      const point2 = adjustedRoute[i + 1];
      
      // Check if this segment intersects with the obstacle
      if (segmentIntersectsObstacle(point1, point2, obstacle)) {
        // Calculate avoidance point
        const avoidancePoint = calculateAvoidancePoint(point1, point2, obstacle);
        
        // Insert avoidance point
        adjustedRoute.splice(i + 1, 0, avoidancePoint);
        
        // Skip ahead to avoid checking the new segments immediately
        i++;
      }
    }
  }
  
  return adjustedRoute;
}

// Check if a line segment intersects with an obstacle
function segmentIntersectsObstacle(
  point1: LatLngTuple,
  point2: LatLngTuple,
  obstacle: { center: LatLngTuple, radius: number }
): boolean {
  // Calculate closest point on line segment to obstacle center
  const closest = closestPointOnSegment(point1, point2, obstacle.center);
  
  // Calculate distance from closest point to obstacle center
  const distance = calculateDistance(closest, obstacle.center);
  
  // Convert obstacle radius from km to degrees (approximate)
  const radiusInDegrees = obstacle.radius / 111; // 1 degree is roughly 111 km
  
  // Check if distance is less than obstacle radius
  return distance < radiusInDegrees;
}

// Calculate closest point on a line segment to a point
function closestPointOnSegment(
  point1: LatLngTuple,
  point2: LatLngTuple,
  point: LatLngTuple
): LatLngTuple {
  const x1 = point1[1];
  const y1 = point1[0];
  const x2 = point2[1];
  const y2 = point2[0];
  const x = point[1];
  const y = point[0];
  
  // Calculate direction vector
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // Calculate squared length of line segment
  const lengthSquared = dx * dx + dy * dy;
  
  // If segment is a point, return it
  if (lengthSquared === 0) {
    return point1;
  }
  
  // Calculate projection of point onto line segment
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
  
  // Calculate closest point
  return [y1 + t * dy, x1 + t * dx];
}

// Calculate avoidance point to go around an obstacle
function calculateAvoidancePoint(
  point1: LatLngTuple,
  point2: LatLngTuple,
  obstacle: { center: LatLngTuple, radius: number }
): LatLngTuple {
  // Vector from point1 to point2
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  
  // Normalize
  const length = Math.sqrt(dx * dx + dy * dy);
  const ndx = dx / length;
  const ndy = dy / length;
  
  // Perpendicular vector
  const perpX = -ndy;
  const perpY = ndx;
  
  // Convert obstacle radius from km to degrees (approximate)
  const radiusInDegrees = obstacle.radius / 111 * 1.5; // Add 50% margin
  
  // Calculate midpoint of segment
  const midX = (point1[0] + point2[0]) / 2;
  const midY = (point1[1] + point2[1]) / 2;
  
  // Vector from obstacle center to midpoint
  const obstacleToMidX = midX - obstacle.center[0];
  const obstacleToMidY = midY - obstacle.center[1];
  
  // Determine which side to go around (dot product with perpendicular vector)
  const dotProduct = obstacleToMidX * perpX + obstacleToMidY * perpY;
  const sign = dotProduct >= 0 ? 1 : -1;
  
  // Calculate avoidance point
  return [
    midX + sign * perpX * radiusInDegrees,
    midY + sign * perpY * radiusInDegrees
  ];
}

// Calculate distance between two points
function calculateDistance(point1: LatLngTuple, point2: LatLngTuple): number {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  return Math.sqrt(dx * dx + dy * dy);
}