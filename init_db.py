import sqlite3

conn = sqlite3.connect("parking.db")
c = conn.cursor()

# Parking table
c.execute("""
CREATE TABLE IF NOT EXISTS parking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL,
    longitude REAL,
    type TEXT,
    availability TEXT
)
""")

# Users table
c.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)
""")

# Sample data
c.execute("INSERT INTO parking (latitude, longitude, type, availability) VALUES (37.7749, -122.4194, 'free', 'available')")
c.execute("INSERT INTO parking (latitude, longitude, type, availability) VALUES (37.7750, -122.4183, 'paid', 'occupied')")

conn.commit()
conn.close()
from flask import Flask, request, jsonify, session
import sqlite3