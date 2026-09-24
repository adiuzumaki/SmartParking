import sqlite3

# Replace with your actual database file name
DB_FILE = "database.db"

try:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Check table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in DB:", tables)

    # Replace 'parking_spots' with your actual table name if different
    cursor.execute("SELECT * FROM parking_spots;")
    spots = cursor.fetchall()

    if spots:
        print("Parking spots in DB:")
        for spot in spots:
            print(spot)
    else:
        print("No parking spots found in DB!")

except Exception as e:
    print("Error:", e)

finally:
    conn.close()
