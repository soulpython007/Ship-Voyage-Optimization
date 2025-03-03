import requests

OPENWEATHER_API_KEY = '4623c94be00951aeb0b90461ef0e69a0'

lat, lon = 19.0, 73.0  # Example coordinates (Mumbai)

url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"

response = requests.get(url)

if response.status_code == 200:
    print("Weather data fetched successfully!")
    print(response.json())
else:
    print(f"Failed to fetch weather. Status code: {response.status_code}")
    print(response.text)
