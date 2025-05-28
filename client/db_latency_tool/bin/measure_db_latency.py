import sqlite3
import time

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

cursor.execute('''
    CREATE TABLE students (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        marks INTEGER
    )
''')

students_data = [
    ('Alice', 85),
    ('Bob', 90),
    ('Charlie', 95),
    ('David', 88),
    ('Eve', 92)
]
cursor.executemany('INSERT INTO students (name, marks) VALUES (?, ?)', students_data)
conn.commit()

start_time = time.time()
cursor.execute('SELECT * FROM students WHERE marks > 90')
results = cursor.fetchall()
end_time = time.time()

latency_ms = (end_time - start_time) * 1000  # Convert to milliseconds

print(f"Query returned {len(results)} rows in {latency_ms:.2f} ms")

conn.close()
