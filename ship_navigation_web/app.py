from flask import Flask, render_template, request, send_file
import sys
import os

# Add parent directory (ocean) to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ship_navigation import plan_route  # Core logic from Step 5
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/plan_route', methods=['POST'])
def plan_route_view():
    start_lat = float(request.form['start_lat'])
    start_lon = float(request.form['start_lon'])
    end_lat = float(request.form['end_lat'])
    end_lon = float(request.form['end_lon'])
    emergency = request.form.get('emergency') == 'on'

    start_port = (start_lat, start_lon)
    end_port = (end_lat, end_lon)

    map_file = plan_route(start_port, end_port, emergency)

    if map_file:
        return render_template('map.html', map_file=map_file)
    else:
        return "❌ No valid route found. Please check your coordinates or graph data.", 400

@app.route('/download_map')
def download_map():
    return send_file('ocean_route.html', as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
