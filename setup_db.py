import os
import sqlite3

# Path to your database (make sure it matches your Flask app)
DB_FILE = os.path.join(os.path.dirname(__file__), "database.db")

# Delete old DB if it exists
if os.path.exists(DB_FILE):
    os.remove(DB_FILE)

# Create new database
conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

# Create parking_spots table
cursor.execute("""
CREATE TABLE parking_spots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    type TEXT DEFAULT 'regular'
)
""")

# Insert sample parking spots
sample_spots = [
    ("Spot 1", -37.787, 175.279, "regular"),
    ("Spot 2", -37.788, 175.280, "disabled"),
    ("Spot 3", -37.789, 175.281, "regular"),
    ("Spot 4", -37.790, 175.282, "regular"),
    ("Spot 5", -37.791, 175.283, "disabled")
]

cursor.executemany(
    "INSERT INTO parking_spots (name, latitude, longitude, type) VALUES (?, ?, ?, ?)",
    sample_spots
)

conn.commit()
conn.close()

print("✅ Fresh database created with sample parking spots!")
