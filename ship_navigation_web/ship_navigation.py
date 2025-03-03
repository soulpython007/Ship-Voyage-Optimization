import folium
import heapq
import random
from geopy.distance import geodesic

# Example Graph - You should replace this with your actual graph
graph = {
    (19.0, 73.0): [(19.5, 73.2), (18.8, 72.5)],
    (19.5, 73.2): [(19.0, 73.0), (20.0, 74.0)],
    (18.8, 72.5): [(19.0, 73.0), (18.5, 72.0)],
    (20.0, 74.0): [(19.5, 73.2)],
    (18.5, 72.0): [(18.8, 72.5)]
}

# Emergency Port Example
emergency_ports = [
    (19.2, 73.0)  # Sample emergency port
]

def haversine(coord1, coord2):
    return geodesic(coord1, coord2).kilometers

def fetch_wind_speed(lat, lon):
    return random.uniform(10, 30)  # Mocked wind speed (replace if needed)

def a_star(start, goal, graph):
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
            return path[::-1]

        for neighbor in graph.get(current, []):
            tentative_g_score = g_score[current] + haversine(current, neighbor)
            if tentative_g_score < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g_score
                heapq.heappush(open_set, (tentative_g_score, neighbor))

    return None

def check_for_emergency():
    return random.choice(emergency_ports)

def create_map(start_port, end_port, path, emergency_port=None):
    ocean_map = folium.Map(location=start_port, zoom_start=7)
    folium.Marker(start_port, icon=folium.Icon(color="green"), popup="Start Port").add_to(ocean_map)
    folium.Marker(end_port, icon=folium.Icon(color="red"), popup="End Port").add_to(ocean_map)

    folium.PolyLine(path, color="blue", weight=2.5).add_to(ocean_map)

    if emergency_port:
        folium.Marker(emergency_port, icon=folium.Icon(color="orange"), popup="Emergency Port").add_to(ocean_map)

    ocean_map.save('ocean_route.html')
    return 'ocean_route.html'

def plan_route(start_port, end_port, trigger_emergency=False):
    if start_port not in graph or end_port not in graph:
        return None

    path = a_star(start_port, end_port, graph)

    if not path:
        return None

    emergency_port = None
    if trigger_emergency:
        emergency_port = check_for_emergency()
        path = path[:len(path) // 2] + [emergency_port] + path[len(path) // 2:]

    return create_map(start_port, end_port, path, emergency_port)
