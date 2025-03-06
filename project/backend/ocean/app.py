from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow frontend to call this API

# Sample route data (you would replace this with real logic later)
ROUTES = [
    {"id": 1, "name": "Pacific Route", "status": "Safe"},
    {"id": 2, "name": "Atlantic Route", "status": "Storm Warning"},
    {"id": 3, "name": "Indian Ocean Route", "status": "Clear"}
]

# Home route (just to test API is running)
@app.route('/')
def home():
    return jsonify({"message": "Ocean Routing API is running!"})


# API to get all ocean routes
@app.route('/api/routes', methods=['GET'])
def get_routes():
    return jsonify({"routes": ROUTES})


# API to get details of a specific route
@app.route('/api/routes/<int:route_id>', methods=['GET'])
def get_route_details(route_id):
    route = next((r for r in ROUTES if r["id"] == route_id), None)
    if route:
        return jsonify(route)
    else:
        return jsonify({"error": "Route not found"}), 404


# API to simulate weather prediction (basic example)
@app.route('/api/weather/<string:region>', methods=['GET'])
def get_weather(region):
    weather = {
        "Pacific": "Sunny",
        "Atlantic": "Stormy",
        "Indian Ocean": "Calm"
    }
    return jsonify({"region": region, "weather": weather.get(region, "Unknown")})


# Start the Flask server
if __name__ == '__main__':
    app.run(debug=True, port=5000)
