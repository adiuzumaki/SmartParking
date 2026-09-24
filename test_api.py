import requests

# Replace with your backend URL
url = "http://127.0.0.1:5000/parking-spots"

try:
    response = requests.get(url)
    response.raise_for_status()  # will raise an error if status != 200
    data = response.json()
    print("Parking spots data received:")
    for spot in data:
        print(spot)
except requests.exceptions.RequestException as e:
    print("Error connecting to backend:", e)
