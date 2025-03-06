from flask import Flask, request, jsonify
import requests
import random
from geopy.distance import geodesic

app = Flask(__name__)

API_KEY = "AIzaSyBSnKVCEplhV9-z_uPm6gv7Ay5RCX-LtlU"
WEATHER_API_KEY = "4623c94be00951aeb0b90461ef0e69a0"

def get_nearest_ports(location, radius=50000):
    url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={location[0]},{location[1]}&radius={radius}&type=port&key={API_KEY}"
    response = requests.get(url).json()
    return [(place["name"], (place["geometry"]["location"]["lat"], place["geometry"]["location"]["lng"])) for place in response.get("results", [])]

def fetch_weather_data(lat, lon):
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
    response = requests.get(url).json()
    wind_speed = response.get("wind", {}).get("speed", random.uniform(10, 30))
    wave_height = random.uniform(1, 5)  # Simulating wave height
    intensity = random.uniform(0, 100)  # Simulating intensity percentage
    return {"wind_speed": wind_speed, "wave_height": wave_height, "intensity": intensity}

@app.route("/get_emergency_port", methods=["POST"])
def get_emergency_port():
    data = request.json
    ship_location = data.get("location")  # (lat, lon)
    severity = data.get("severity", "medium")  # Severity level
    
    if not ship_location:
        return jsonify({"error": "Missing ship location"}), 400
    
    ports = get_nearest_ports(ship_location)
    if not ports:
        return jsonify({"error": "No nearby ports found"}), 404
    
    if severity == "high":
        emergency_port = min(ports, key=lambda p: geodesic(ship_location, p[1]).kilometers)
    elif severity == "medium":
        emergency_port = min(ports, key=lambda p: fetch_weather_data(*p[1])["wind_speed"])  # Choosing port with best conditions
    else:
        emergency_port = min(ports, key=lambda p: geodesic(ship_location, p[1]).kilometers)
    
    port_name, port_coords = emergency_port
    weather = fetch_weather_data(*port_coords)
    
    return jsonify({
        "port_name": port_name,
        "coordinates": port_coords,
        "weather": weather
    })

if __name__ == "__main__":
    app.run(debug=True)

