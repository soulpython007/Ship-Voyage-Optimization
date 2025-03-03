import requests
import folium
import time

# Sample ocean graph (you can replace this with a larger graph if needed)
graph = {
    (18.0, 72.0): [(18.0, 72.5), (18.5, 72.0)],
    (18.0, 72.5): [(18.0, 72.0), (18.5, 72.5)],
    (18.5, 72.0): [(18.0, 72.0), (18.5, 72.5)],
    (18.5, 72.5): [(18.0, 72.5), (18.5, 72.0), (19.0, 73.0)],
    (19.0, 73.0): [(18.5, 72.5), (19.5, 73.5)],
    (19.5, 73.5): [(19.0, 73.0), (20.0, 74.0)],
    (20.0, 74.0): [(19.5, 73.5), (20.5, 74.5)],
    (20.5, 74.5): [(20.0, 74.0)]
}

API_KEY = "4623c94be00951aeb0b90461ef0e69a0"

def fetch_wind_speed(lat, lon):
    url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    data = response.json()
    wind_speed = data['wind']['speed']
    return wind_speed

def heuristic(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5

def a_star(start, goal, graph, weather_data):
    from queue import PriorityQueue

    open_list = PriorityQueue()
    open_list.put((0, start))
    came_from = {}
    g_score = {node: float('inf') for node in graph}
    g_score[start] = 0

    while not open_list.empty():
        _, current = open_list.get()

        if current == goal:
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start)
            path.reverse()
            return path, g_score[goal]

        for neighbor in graph.get(current, []):
            wind_speed = weather_data.get(neighbor, 5.0)
            cost = 1 + (wind_speed / 10.0)

            tentative_g_score = g_score[current] + cost

            if tentative_g_score < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g_score
                f_score = tentative_g_score + heuristic(neighbor, goal)
                open_list.put((f_score, neighbor))

    return None, float('inf')

# Folium Map Functions

def create_map(start_port, end_port, path, emergency_port=None):
    ocean_map = folium.Map(location=start_port, zoom_start=6)

    folium.Marker(start_port, icon=folium.Icon(color="green"), popup="Start Port").add_to(ocean_map)
    folium.Marker(end_port, icon=folium.Icon(color="red"), popup="Destination Port").add_to(ocean_map)

    if emergency_port:
        folium.Marker(emergency_port, icon=folium.Icon(color="orange"), popup="Emergency Port").add_to(ocean_map)

    folium.PolyLine(path, color="blue", weight=2.5, opacity=0.8, tooltip="Planned Route").add_to(ocean_map)

    return ocean_map

def update_map(ocean_map, current_position, history):
    folium.PolyLine(history, color="green", weight=2, opacity=0.7, tooltip="Actual Route").add_to(ocean_map)
    folium.Marker(current_position, icon=folium.Icon(color="blue"), popup="Current Position").add_to(ocean_map)
    return ocean_map

# Optional: Emergency check (can be customized)
def check_for_emergency(position):
    # Dummy condition - Replace with real logic if needed
    return None

def main():
    start_port = (18.0, 72.0)
    end_port = (20.5, 74.5)

    print("Collecting weather data...")
    weather_data = {port: fetch_wind_speed(port[0], port[1]) for port in graph}
    print("Weather data collected.")

    print(f"Routing from {start_port} to {end_port}...")
    path, cost = a_star(start_port, end_port, graph, weather_data)

    if not path:
        print("No valid route found.")
        return

    print(f"Initial Path: {path}")
    print(f"Total Cost: {cost:.2f}")

    ocean_map = create_map(start_port, end_port, path)
    ocean_map.save("ocean_route.html")

    current_position = start_port
    history = [current_position]

    for next_position in path[1:]:
        print(f"🚢 Moving to: {next_position}")
        current_position = next_position
        history.append(current_position)

        emergency_port = check_for_emergency(current_position)

        if emergency_port:
            print(f"🛑 Emergency reroute to {emergency_port}")
            path, cost = a_star(current_position, emergency_port, graph, weather_data)
            history.append(emergency_port)

            ocean_map = create_map(start_port, end_port, history, emergency_port)
            ocean_map = update_map(ocean_map, current_position, history)
            ocean_map.save("ocean_route.html")
            print(f"📍 Map updated with emergency reroute to {emergency_port}")
            break

        ocean_map = update_map(ocean_map, current_position, history)
        ocean_map.save("ocean_route.html")

        print("📍 Map updated with current position")

        time.sleep(1)

    print("✅ Voyage completed.")
    print("🌍 Final map saved as 'ocean_route.html' - Open it in a browser to view.")

if __name__ == "__main__":
    main()
