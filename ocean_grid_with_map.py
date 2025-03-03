import json
import folium
from geopy.distance import geodesic

# Define grid parameters
min_lat, max_lat = -10, 30          # Adjust for your ocean area
min_lon, max_lon = 40, 120          # Adjust for your ocean area
lat_step, lon_step = 0.5, 0.5       # Grid resolution - smaller step = denser grid

def generate_ocean_grid():
    """Generate ocean grid and graph with edges (adjacency list)"""
    graph = {}

    # Create grid points
    grid_points = []
    for lat in range(int(min_lat * 10), int(max_lat * 10) + 1, int(lat_step * 10)):
        for lon in range(int(min_lon * 10), int(max_lon * 10) + 1, int(lon_step * 10)):
            grid_points.append((lat / 10, lon / 10))

    # Connect each point to its neighbors
    for point in grid_points:
        lat, lon = point
        neighbors = []

        # Possible movements (N, S, E, W, NE, NW, SE, SW)
        moves = [
            (0, lon_step), (0, -lon_step), 
            (lat_step, 0), (-lat_step, 0),
            (lat_step, lon_step), (lat_step, -lon_step),
            (-lat_step, lon_step), (-lat_step, -lon_step)
        ]

        for move in moves:
            neighbor = (lat + move[0], lon + move[1])

            if min_lat <= neighbor[0] <= max_lat and min_lon <= neighbor[1] <= max_lon:
                distance = geodesic(point, neighbor).kilometers
                neighbors.append((neighbor, distance))

        # Store in graph using clean format (tuple as string key)
        graph[str(point)] = neighbors

    return graph, grid_points

def save_grid_and_map(graph, grid_points):
    """Save graph to JSON and generate a map"""
    # Save graph to JSON
    with open('ocean_grid.json', 'w') as f:
        json.dump(graph, f, indent=2)

    print("Ocean grid and graph saved to 'ocean_grid.json'")

    # Create folium map centered at approximate middle of grid
    map_center = [(min_lat + max_lat) / 2, (min_lon + max_lon) / 2]
    ocean_map = folium.Map(location=map_center, zoom_start=4)

    # Add grid points to map
    for lat, lon in grid_points:
        folium.CircleMarker(location=[lat, lon], radius=2, color='blue', fill=True).add_to(ocean_map)

    ocean_map.save('ocean_grid_map.html')
    print("Interactive map saved to 'ocean_grid_map.html'. Open this file in your browser to view the grid.")

def main():
    graph, grid_points = generate_ocean_grid()
    save_grid_and_map(graph, grid_points)

if __name__ == "__main__":
    main()
# The ocean grid is generated with a resolution of 0.5 degrees in latitude and longitude, 
# covering an area from latitudes -10 to 30 and longitudes 40 to 120. 
# The grid points are connected to their neighboring points, 
# creating a graph with edges representing the distances between points. 
# The graph is saved to a JSON file named 'ocean_grid.json', 
# and an interactive map displaying the grid points is saved to 'ocean_grid_map.html'. 
# You can open the HTML file in your browser to visualize the grid.
