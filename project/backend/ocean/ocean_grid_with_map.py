import json
import folium
from geopy.distance import geodesic

min_lat, max_lat = -10, 30         
min_lon, max_lon = 40, 120          
lat_step, lon_step = 0.5, 0.5       

def generate_ocean_grid():
    graph = {}

    grid_points = []
    for lat in range(int(min_lat * 10), int(max_lat * 10) + 1, int(lat_step * 10)):
        for lon in range(int(min_lon * 10), int(max_lon * 10) + 1, int(lon_step * 10)):
            grid_points.append((lat / 10, lon / 10))

    for point in grid_points:
        lat, lon = point
        neighbors = []
        
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
                graph[str(point)] = neighbors

    return graph, grid_points

def save_grid_and_map(graph, grid_points):
    with open('ocean_grid.json', 'w') as f:
        json.dump(graph, f, indent=2)

    print("Ocean grid and graph saved to 'ocean_grid.json'")

    map_center = [(min_lat + max_lat) / 2, (min_lon + max_lon) / 2]
    ocean_map = folium.Map(location=map_center, zoom_start=4)

    for lat, lon in grid_points:
        folium.CircleMarker(location=[lat, lon], radius=2, color='blue', fill=True).add_to(ocean_map)

    ocean_map.save('ocean_grid_map.html')
    print("Interactive map saved to 'ocean_grid_map.html'. Open this file in your browser to view the grid.")

def main():
    graph, grid_points = generate_ocean_grid()
    save_grid_and_map(graph, grid_points)

if __name__ == "__main__":
    main()
