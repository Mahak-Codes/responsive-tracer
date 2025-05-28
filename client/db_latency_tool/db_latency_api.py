from flask import Flask, jsonify
import sqlite3
import time

app = Flask(__name__)

def measure_db_latency():
    # Adjust the DB path and query as needed for your real DB
    start_total = time.time()
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    start_db = time.time()
    cursor.execute('SELECT 1')
    cursor.fetchall()
    end_db = time.time()
    conn.close()
    end_total = time.time()

    db_latency = (end_db - start_db) * 1000  # ms
    total_rtt = (end_total - start_total) * 1000  # ms
    non_db_latency = total_rtt - db_latency

    return {
        'timestamp': time.strftime('%X'),
        'rtt': round(total_rtt, 2),
        'dbLatency': round(db_latency, 2),
        'nonDbLatency': round(non_db_latency, 2)
    }

@app.route('/api/db-latency')
def db_latency():
    metrics = measure_db_latency()
    return jsonify(metrics)

if __name__ == '__main__':
    app.run(port=8001)