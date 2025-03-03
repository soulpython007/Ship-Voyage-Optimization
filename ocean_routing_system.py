import heapq
import requests

# Replace this with your OpenWeatherMap API Key
API_KEY = "4623c94be00951aeb0b90461ef0e69a0"

def heuristic(a, b):
    # Simple Euclidean distance as heuristic
    return ((a[0] - b[0])**2 + (a[1] - b[1])**2)**0.5

def fetch_wind_speed(lat, lon):
    """
    Fetches wind speed at given coordinates using OpenWeatherMap API.
    """
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        wind_speed = data['wind']['speed']
        return wind_speed
    except Exception as e:
        print(f"Failed to fetch weather for ({lat}, {lon}): {e}")
        return 5.0  # Default wind speed if fetch fails

def a_star(start, goal, graph, weather_data):
    """
    A* algorithm with weather-aware path cost adjustment.
    """
    open_set = []
    heapq.heappush(open_set, (0, start))

    came_from = {}
    g_score = {start: 0}

    while open_set:
        _, current = heapq.heappop(open_set)

        if current == goal:
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start)
            path.reverse()
            return path, g_score[goal]

        for neighbor in graph.get(current, []):
            distance = heuristic(current, neighbor)
            wind_speed = weather_data.get(neighbor, 5.0)  # Fallback if missing
            weather_penalty = 1 + (wind_speed / 10)  # Example formula - more wind = higher cost
            tentative_g_score = g_score[current] + (distance * weather_penalty)

            if tentative_g_score < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g_score
                f_score = tentative_g_score + heuristic(neighbor, goal)
                heapq.heappush(open_set, (f_score, neighbor))

    return None, float('inf')  # No valid path found

def main():
    start_port = (19.0, 73.0)
    end_port = (20.5, 74.5)

    graph = {
        (19.0, 73.0): [(19.5, 73.5), (19.0, 74.0)],
        (19.5, 73.5): [(20.0, 74.0)],
        (19.0, 74.0): [(20.0, 74.0)],
        (20.0, 74.0): [(20.5, 74.5)],
        (20.5, 74.5): []
    }

    # Collect real-time weather data for all ports in the graph
    weather_data = {}
    for port, neighbors in graph.items():
        lat, lon = port
        weather_data[port] = fetch_wind_speed(lat, lon)

    print("Collected real-time weather data:", weather_data)

    print(f"Routing from {start_port} to {end_port}")

    path, cost = a_star(start_port, end_port, graph, weather_data)

    if path:
        print(f"Optimal Path: {path}")
        print(f"Total Cost: {cost:.2f}")
    else:
        print("No valid path found")

if __name__ == "__main__":
    main()

# The ocean routing system now incorporates real-time weather data into the pathfinding algorithm.
# The fetch_weather function queries the OpenWeatherMap API to get the wind speed at a given latitude 
# and longitude.
# The collect_weather_data function retrieves wind speed data for all nodes in the ocean grid.
# The A* algorithm in the a_star function now considers wind speed as a cost factor when calculating
# the path.
# The main function demonstrates the usage of the ocean routing system by finding an optimal path from
# Mumbai to a destination port with consideration for wind speed.
# Run the ocean_routing_system.py script to see the output.