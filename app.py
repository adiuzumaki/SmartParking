from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import os, sqlite3, requests

app = Flask(__name__)
CORS(app)

# ===== Environment Variables =====
API_TOKEN = os.environ.get("API_TOKEN", "mysecrettoken123")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

# ===== Auth Helper =====
def require_token():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        abort(401, description="Missing token")
    token = auth.split(" ")[1]
    if token != API_TOKEN:
        abort(401, description="Invalid token")

# ===== Parking Spots =====
def get_spots_from_db_or_mock(lat=None, lng=None, radius_km=5, type_filter="all"):
    db_path = os.path.join(os.path.dirname(__file__), "parking.db")
    spots = []
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            query = "SELECT id, name, latitude, longitude, type, availability FROM spots"
            params = []
            if type_filter.lower() != "all":
                query += " WHERE type = ?"
                params.append(type_filter)
            cur.execute(query, params)
            for r in cur.fetchall():
                spots.append({
                    "id": r[0],
                    "name": r[1],
                    "latitude": r[2],
                    "longitude": r[3],
                    "type": r[4],
                    "availability": r[5]
                })
            conn.close()
            return spots
        except Exception as e:
            app.logger.warning(e)

    # Mock data fallback
    return [
        {"id": 1, "name": "East St Carpark", "latitude": -37.7875, "longitude": 175.2800, "type": "on-street", "availability": "available"},
        {"id": 2, "name": "Garden Mall Lot", "latitude": -37.7868, "longitude": 175.2790, "type": "off-street", "availability": "occupied"},
        {"id": 3, "name": "Riverside Park", "latitude": -37.7886, "longitude": 175.2815, "type": "on-street", "availability": "available"},
    ]

# ===== LOGIN =====
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if username == "admin" and password == "admin123":
        return jsonify({"token": API_TOKEN, "user": "admin"})

    return jsonify({"error": "Invalid credentials"}), 401

# ===== GET PARKING =====
@app.route("/get_parking_spots")
def get_parking_spots():
    require_token()
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)
    radius = request.args.get("radius", default=5.0, type=float)
    type_filter = request.args.get("type", default="all")
    spots = get_spots_from_db_or_mock(lat, lng, radius, type_filter)
    return jsonify(spots)

# ===== PROXY ENDPOINTS =====
@app.route("/proxy/place/autocomplete")
def proxy_autocomplete():
    query = request.args.get("input")
    if not query: return jsonify({"predictions": []})
    r = requests.get("https://maps.googleapis.com/maps/api/place/autocomplete/json",
                     params={"input": query, "key": GOOGLE_API_KEY, "types": "geocode"})
    return (r.content, r.status_code, r.headers.items())

@app.route("/proxy/place/details")
def proxy_details():
    place_id = request.args.get("place_id")
    r = requests.get("https://maps.googleapis.com/maps/api/place/details/json",
                     params={"place_id": place_id, "key": GOOGLE_API_KEY})
    return (r.content, r.status_code, r.headers.items())

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
