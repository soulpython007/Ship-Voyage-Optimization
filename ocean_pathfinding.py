import json
from geopy.distance import geodesic
import heapq

def load_graph():
    """Load the graph from ocean_grid.json"""
    with open('ocean_grid.json', 'r') as f:
        graph = json.load(f)
    return graph

def find_nearest_node(port, graph):
    """Find the nearest grid node to a given port"""
    min_distance = float('inf')
    nearest_node = None

    port_tuple = tuple(port)

    for node_str in graph.keys():
        node = eval(node_str)  # Convert string back to tuple (lat, lon)
        distance = geodesic(port_tuple, node).kilometers

        if distance < min_distance:
            min_distance = distance
            nearest_node = node

    return nearest_node

def heuristic(node, goal):
    """Haversine distance between two nodes as the heuristic"""
    return geodesic(node, goal).kilometers

def a_star(graph, start, goal):
    """A* pathfinding algorithm"""
    open_list = []
    heapq.heappush(open_list, (0, start))
    came_from = {}
    g_score = {start: 0}
    f_score = {start: heuristic(start, goal)}

    while open_list:
        _, current = heapq.heappop(open_list)

        if current == goal:
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start)
            path.reverse()
            return path, g_score[goal]

        for neighbor, distance in graph[str(current)]:
            neighbor = tuple(neighbor)

            tentative_g_score = g_score[current] + distance

            if neighbor not in g_score or tentative_g_score < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g_score
                f_score[neighbor] = tentative_g_score + heuristic(neighbor, goal)
                heapq.heappush(open_list, (f_score[neighbor], neighbor))

    raise ValueError("No valid path found")

def main():
    # Define start and end ports (raw port coordinates, replace with your actual ports)
    start_port = [18.9437, 72.8354]  # Mumbai Port
    end_port = [1.2644, 103.8408]    # Singapore Port

    # Load graph from the saved ocean grid
    graph = load_graph()

    # Find nearest grid nodes to the ports
    start_node = find_nearest_node(start_port, graph)
    end_node = find_nearest_node(end_port, graph)

    if not start_node or not end_node:
        raise ValueError("Start or End node could not be found on the grid!")

    print(f"Start Node (nearest): {start_node}")
    print(f"End Node (nearest): {end_node}")

    # Find path using A* algorithm
    path, cost = a_star(graph, start_node, end_node)

    print(f"Optimal Path: {path}")
    print(f"Total Cost (Distance in km): {cost:.2f} km")

if __name__ == "__main__":
    main()
# The main function loads the ocean grid from ocean_grid.json, finds the nearest grid nodes to 
# the start and end ports, and then uses the A* algorithm to find the optimal path between the
# two ports. The path is printed along with the total cost in kilometers.
# The ocean routing system now provides a more realistic and accurate pathfinding solution for
# ships navigating the ocean grid.
# The system can be further extended to include additional factors such as currents, waves, and
# other environmental conditions to enhance the accuracy of the routing system.
# This system can be integrated into maritime navigation software to assist ships in planning
# their routes efficiently and safely.
# The A* algorithm is a versatile and powerful tool for solving pathfinding problems in various
# domains, including maritime navigation, robotics, and video games.
# By incorporating real-world data and constraints into the algorithm, we can create more
# sophisticated and effective routing systems for complex environments.
# The ocean routing system demonstrates the practical application of pathfinding algorithms in
# solving real-world problems and optimizing transportation routes.
# The system can be further enhanced with additional features such as dynamic route updates,
# real-time weather alerts, and route optimization based on vessel characteristics and cargo
# requirements.

