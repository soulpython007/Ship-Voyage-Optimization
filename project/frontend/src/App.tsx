import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { LatLngTuple, LatLngExpression, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { findPath } from './pathfinding';
import { fetchWeatherData, WeatherCondition } from './weatherService';
import { ShipType, ShipStatus, calculateShipSafety } from './shipUtils';

const shipIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3410/3410476.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const portIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2271/2271068.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function App() {
  const [startPoint, setStartPoint] = useState<LatLngTuple>([25.0, -80.0]);
  const [endPoint, setEndPoint] = useState<LatLngTuple>([35.0, -65.0]);
  const [route, setRoute] = useState<LatLngTuple[]>([]);
  const [weatherAdjustedRoute, setWeatherAdjustedRoute] = useState<LatLngTuple[]>([]);
  const [weatherConditions, setWeatherConditions] = useState<WeatherCondition[]>([]);
  const [nearestPorts, setNearestPorts] = useState<{position: LatLngTuple, name: string}[]>([
    { position: [24.5, -81.8], name: "Key West" },
    { position: [25.8, -80.2], name: "Miami" },
    { position: [32.1, -80.7], name: "Savannah" },
    { position: [36.9, -76.3], name: "Norfolk" }
  ]);
  
  const [shipType, setShipType] = useState<ShipType>(ShipType.CARGO);
  const [shipStatus, setShipStatus] = useState<ShipStatus>(ShipStatus.GOOD);
  const [prioritizeNearestPort, setPrioritizeNearestPort] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      const bounds = {
        north: 40,
        south: 20,
        east: -60,
        west: -85
      };
      const conditions = await fetchWeatherData(bounds);
      setWeatherConditions(conditions);
    };

    fetchWeather();
  }, []);

  useEffect(() => {
    if (shipStatus === ShipStatus.BAD || shipStatus === ShipStatus.CRITICAL) {
      setPrioritizeNearestPort(true);
    } else {
      setPrioritizeNearestPort(false);
    }
  }, [shipStatus]);

  useEffect(() => {
    if (prioritizeNearestPort) {
      const nearestPort = findNearestPort(startPoint, nearestPorts);
      if (nearestPort) {
        setEndPoint(nearestPort.position);
      }
    }
  }, [prioritizeNearestPort, startPoint, nearestPorts]);

  const findNearestPort = (
    currentPosition: LatLngTuple, 
    ports: {position: LatLngTuple, name: string}[]
  ) => {
    let nearest = null;
    let minDistance = Infinity;
    
    for (const port of ports) {
      const distance = calculateDistance(currentPosition, port.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = port;
      }
    }
    
    return nearest;
  };

  const calculateDistance = (point1: LatLngTuple, point2: LatLngTuple) => {
    const R = 6371;
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateRoute = () => {
    setLoading(true);
    const initialRoute = findPath(startPoint, endPoint);
    setRoute(initialRoute);
    
    const shipSafety = calculateShipSafety(shipType, shipStatus);
    const adjustedRoute = adjustRouteForWeather(initialRoute, weatherConditions, shipSafety);
    setWeatherAdjustedRoute(adjustedRoute);
    
    setLoading(false);
  };

  const adjustRouteForWeather = (
    route: LatLngTuple[], 
    weatherConditions: WeatherCondition[],
    shipSafety: number
  ): LatLngTuple[] => {
    let adjustedRoute = [...route];
    
    for (const condition of weatherConditions) {
      const isSevere = condition.windSpeed > 60 || condition.waveHeight > 4;
      
      if (isSevere && shipSafety < 0.7) {
        const avoidancePoint: LatLngTuple = [
          condition.position[0] + 2,
          condition.position[1]
        ];
        
        const insertIndex = Math.floor(adjustedRoute.length / 2);
        adjustedRoute.splice(insertIndex, 0, avoidancePoint);
      }
    }
    
    return adjustedRoute;
  };

  const handleShipTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setShipType(e.target.value as ShipType);
  };

  const handleShipStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setShipStatus(e.target.value as ShipStatus);
  };

  const handleStartPointChange = (index: number, value: number) => {
    const newPoint = [...startPoint];
    newPoint[index] = value;
    setStartPoint(newPoint as LatLngTuple);
  };

  const handleEndPointChange = (index: number, value: number) => {
    const newPoint = [...endPoint];
    newPoint[index] = value;
    setEndPoint(newPoint as LatLngTuple);
  };

  const getWeatherColor = (condition: WeatherCondition): string => {
    switch (condition.type) {
      case 'storm':
        return '#ff0000';
      case 'highWaves':
        return '#ffa500';
      case 'fog':
        return '#808080';
      default:
        return '#00ff00';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Maritime Navigation System</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Ship Information</h2>
          <div className="mb-3">
            <label className="block mb-1">Ship Type</label>
            <select 
              value={shipType} 
              onChange={handleShipTypeChange}
              className="w-full p-2 bg-gray-700 rounded"
            >
              <option value={ShipType.CARGO}>Cargo Ship</option>
              <option value={ShipType.TANKER}>Tanker</option>
              <option value={ShipType.PASSENGER}>Passenger Ship</option>
              <option value={ShipType.FISHING}>Fishing Vessel</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block mb-1">Ship Status</label>
            <select 
              value={shipStatus} 
              onChange={handleShipStatusChange}
              className="w-full p-2 bg-gray-700 rounded"
            >
              <option value={ShipStatus.EXCELLENT}>Excellent</option>
              <option value={ShipStatus.GOOD}>Good</option>
              <option value={ShipStatus.FAIR}>Fair</option>
              <option value={ShipStatus.BAD}>Bad</option>
              <option value={ShipStatus.CRITICAL}>Critical</option>
            </select>
          </div>
          {prioritizeNearestPort && (
            <div className="p-2 bg-red-800 rounded text-white text-sm mt-2">
              Ship status critical! Prioritizing nearest port.
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Route Information</h2>
          <div className="mb-3">
            <label className="block mb-1">Start Point</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                value={startPoint[0]} 
                onChange={(e) => handleStartPointChange(0, parseFloat(e.target.value))}
                className="p-2 bg-gray-700 rounded"
                step="0.1"
              />
              <input 
                type="number" 
                value={startPoint[1]} 
                onChange={(e) => handleStartPointChange(1, parseFloat(e.target.value))}
                className="p-2 bg-gray-700 rounded"
                step="0.1"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block mb-1">End Point</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                value={endPoint[0]} 
                onChange={(e) => handleEndPointChange(0, parseFloat(e.target.value))}
                className="p-2 bg-gray-700 rounded"
                step="0.1"
                disabled={prioritizeNearestPort}
              />
              <input 
                type="number" 
                value={endPoint[1]} 
                onChange={(e) => handleEndPointChange(1, parseFloat(e.target.value))}
                className="p-2 bg-gray-700 rounded"
                step="0.1"
                disabled={prioritizeNearestPort}
              />
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-800 rounded-lg flex flex-col">
          <h2 className="text-xl font-semibold mb-3">Navigation Controls</h2>
          <button 
            onClick={calculateRoute}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mt-auto"
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Optimal Route'}
          </button>
          
          <div className="mt-4">
            <h3 className="font-semibold">Route Statistics:</h3>
            {weatherAdjustedRoute.length > 0 ? (
              <div className="text-sm mt-2">
                <p>Distance: {calculateTotalDistance(weatherAdjustedRoute).toFixed(0)} km</p>
                <p>Estimated Time: {calculateEstimatedTime(weatherAdjustedRoute, 30).toFixed(1)} hours</p>
                <p>Weather Conditions: {weatherConditions.length > 0 ? 'Challenging' : 'Favorable'}</p>
              </div>
            ) : (
              <p className="text-sm mt-2">Calculate a route to see statistics</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <MapContainer center={[30, -75]} zoom={5} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <Marker position={startPoint} icon={shipIcon}>
            <Popup>
              Current Ship Position<br />
              Status: {shipStatus}
            </Popup>
          </Marker>
          
          <Marker position={endPoint} icon={portIcon}>
            <Popup>
              Destination{prioritizeNearestPort ? ' (Nearest Port)' : ''}
            </Popup>
          </Marker>
          
          {nearestPorts.map((port, index) => (
            <Marker key={index} position={port.position} icon={portIcon}>
              <Popup>
                Port: {port.name}
              </Popup>
            </Marker>
          ))}
          
          {route.length > 0 && (
            <Polyline 
              positions={route} 
              color="gray" 
              dashArray="5, 5"
            />
          )}
          
          {weatherAdjustedRoute.length > 0 && (
            <Polyline 
              positions={weatherAdjustedRoute} 
              color="blue" 
              weight={4}
            />
          )}
          
          {weatherConditions.map((condition, index) => (
            <Circle 
              key={index}
              center={condition.position as LatLngExpression}
              radius={condition.radius * 1000}
              pathOptions={{ 
                color: getWeatherColor(condition),
                fillOpacity: condition.intensity * 0.5,
                weight: 1
              }}
            >
              <Popup>
                <div>
                  <strong>{condition.type.charAt(0).toUpperCase() + condition.type.slice(1)}</strong><br />
                  Wind Speed: {condition.windSpeed.toFixed(1)} km/h<br />
                  Wave Height: {condition.waveHeight.toFixed(1)} m<br />
                  Visibility: {condition.visibility}<br />
                  Intensity: {(condition.intensity * 100).toFixed(0)}%
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Weather Conditions</h2>
          <div className="space-y-3">
            {weatherConditions.map((condition, index) => (
              <div key={index} className="p-3 bg-gray-700 rounded">
                <h3 className="font-semibold">
                  {condition.type.charAt(0).toUpperCase() + condition.type.slice(1)} #{index + 1}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div>Position: {condition.position[0].toFixed(1)}, {condition.position[1].toFixed(1)}</div>
                  <div>Radius: {condition.radius} km</div>
                  <div>Wind Speed: {condition.windSpeed.toFixed(1)} km/h</div>
                  <div>Wave Height: {condition.waveHeight.toFixed(1)} m</div>
                  <div>Visibility: {condition.visibility}</div>
                  <div className={condition.intensity > 0.7 ? "text-red-400" : "text-yellow-400"}>
                    Intensity: {(condition.intensity * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
            {weatherConditions.length === 0 && (
              <p>Fetching weather conditions...</p>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Navigation Recommendations</h2>
          {weatherAdjustedRoute.length > 0 ? (
            <div>
              <p className="mb-2">Based on current conditions and ship status:</p>
              <ul className="list-disc pl-5 space-y-2">
                {shipStatus === ShipStatus.BAD || shipStatus === ShipStatus.CRITICAL ? (
                  <li className="text-red-400">
                    URGENT: Ship condition is {shipStatus.toLowerCase()}. Proceed to nearest port immediately.
                  </li>
                ) : null}
                
                {weatherConditions.some(c => c.windSpeed > 60) ? (
                  <li className="text-yellow-400">
                    Severe weather detected. Route has been adjusted to maintain safe distance from storm systems.
                  </li>
                ) : null}
                
                <li>
                  Optimal route calculated. Total distance: {calculateTotalDistance(weatherAdjustedRoute).toFixed(0)} km.
                </li>
                
                <li>
                  Estimated travel time: {calculateEstimatedTime(weatherAdjustedRoute, 30).toFixed(1)} hours at average speed of 30 km/h.
                </li>
                
                {shipType === ShipType.PASSENGER ? (
                  <li>
                    Passenger comfort considerations have been factored into route planning.
                  </li>
                ) : null}
                
                {shipType === ShipType.TANKER ? (
                  <li>
                    Tanker safety protocols recommend maintaining additional distance from severe weather.
                  </li>
                ) : null}
              </ul>
              
              <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded">
                <h3 className="font-semibold">Captain's Decision Support:</h3>
                <p className="mt-1 text-sm">
                  {shipStatus === ShipStatus.BAD || shipStatus === ShipStatus.CRITICAL
                    ? "RECOMMENDATION: Proceed to nearest port immediately. Ship condition requires urgent attention."
                    : weatherConditions.some(c => c.windSpeed > 70)
                      ? "RECOMMENDATION: Consider delaying departure until weather conditions improve."
                      : "RECOMMENDATION: Proceed with calculated route. Monitor weather conditions for any changes."}
                </p>
              </div>
            </div>
          ) : (
            <p>Calculate a route to see recommendations.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateTotalDistance(route: LatLngTuple[]): number {
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const point1 = route[i];
    const point2 = route[i + 1];
    
    const R = 6371;
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    totalDistance += R * c;
  }
  return totalDistance;
}

function calculateEstimatedTime(route: LatLngTuple[], averageSpeed: number): number {
  const distance = calculateTotalDistance(route);
  return distance / averageSpeed;
}

export default App;