import folium
import heapq
import random
import time
from geopy.distance import geodesic

# Coastal graph - Ports along western Indian coast (Mumbai to Goa region)
graph = {
    (18.95, 72.82): [(19.0, 72.8), (18.9, 72.85)],  # Mumbai Port
    (19.0, 72.8): [(18.95, 72.82), (19.1, 72.7)],
    (19.1, 72.7): [(19.0, 72.8), (19.5, 72.5)],
    (19.5, 72.5): [(19.1, 72.7), (20.0, 72.3)],
    (20.0, 72.3): [(19.5, 72.5), (20.5, 72.1)],
    (20.5, 72.1): [(20.0, 72.3), (20.9, 72.0)],  # Closer to Goa
    (20.9, 72.0): [(20.5, 72.1)],
    (18.9, 72.85): [(18.95, 72.82)],  # Alternate port
}

# Sample emergency ports (optional)
emergency_ports = [
    (19.2, 72.8),  # Emergency port near Mumbai
    (20.2, 72.2)   # Emergency port near Goa
]

def haversine(coord1, coord2):
    return geodesic(coord1, coord2).kilometers

def fetch_wind_speed(lat, lon):
    return random.uniform(10, 30)

def a_star(start, goal, graph, weather_data):
    open_set = []
    heapq.heappush(open_set, (0, start))
    came_from = {}
    g_score = {node: float('inf') for node in graph}
    g_score[start] = 0

    while open_set:
        _, current = heapq.heappop(open_set)

        if current == goal:
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start)
            return path[::-1], g_score[goal]

        for neighbor in graph[current]:
            tentative_g_score = g_score[current] + haversine(current, neighbor) + (weather_data.get(neighbor, 0) / 10)
            if tentative_g_score < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g_score
                heapq.heappush(open_set, (tentative_g_score, neighbor))

    return None, float('inf')

def check_for_emergency(current_position):
    for port in emergency_ports:
        if haversine(current_position, port) < 5:  # Within 5 km
            return port
    return None

def create_map(start_port, end_port, path, emergency_port=None):
    ocean_map = folium.Map(location=start_port, zoom_start=7)

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

def main():
    start_port = (18.95, 72.82)  # Mumbai Port
    end_port = (20.5, 72.1)      # Near Goa

    weather_data = {port: fetch_wind_speed(port[0], port[1]) for port in graph}

    print(f"🚢 Planning initial route from {start_port} to {end_port}")

    path, cost = a_star(start_port, end_port, graph, weather_data)

    if not path:
        print("❌ No valid initial route found.")
        return

    print(f"✅ Initial Path: {path}")
    print(f"📏 Initial Cost (distance): {cost:.2f} km")

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
            history.extend(path[1:])

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
    print("🌍 Final map saved as 'ocean_route.html' - Open in browser to view.")

if __name__ == "__main__":
    main()
