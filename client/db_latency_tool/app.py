from flask import Flask, jsonify
import psycopg2
import time

# ───────────────────────────────────────
# OpenTelemetry Instrumentation
# ───────────────────────────────────────
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor

# Initialize tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)
trace.get_tracer_provider().add_span_processor(
    SimpleSpanProcessor(ConsoleSpanExporter())
)

# ───────────────────────────────────────
# Flask App Setup
# ───────────────────────────────────────
app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)
Psycopg2Instrumentor().instrument()

# PostgreSQL connection config
DB_CONFIG = {
    "dbname": "testtable",
    "user": "sharanya",
    "password": "feel",
    "host": "localhost",
    "port": "5432"
}

# Ensure the database and table exist
def init_db():
    conn = psycopg2.connect(**DB_CONFIG)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER
        )
    ''')
    conn.commit()

    # Insert dummy data if empty
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        users = [("Alice", 24), ("Bob", 30), ("Charlie", 22)]
        c.executemany("INSERT INTO users (name, age) VALUES (%s, %s)", users)
        conn.commit()

    conn.close()

@app.route('/api/fetch-users', methods=['GET'])
def fetch_users():
    with tracer.start_as_current_span("fetch_users_logic"):
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        start = time.time()
        cursor.execute("SELECT * FROM users")
        rows = cursor.fetchall()
        end = time.time()

        db_latency_ms = round((end - start) * 1000, 2)

        users = [{"id": row[0], "name": row[1], "age": row[2]} for row in rows]

        conn.close()
        return jsonify({
            "data": users,
            "db_latency_ms": db_latency_ms
        })

@app.route('/api/fetch-products')
def fetch_products():
    with tracer.start_as_current_span("fetch_products_logic"):
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        start = time.time()
        cursor.execute("SELECT * FROM users LIMIT 5")  # Example query, adjust as needed
        rows = cursor.fetchall()
        end = time.time()
        latency = round((end - start) * 1000, 2)
        products = [{"id": row[0], "name": row[1], "age": row[2]} for row in rows]
        conn.close()
        return jsonify({"data": products, "db_latency_ms": latency})

@app.route('/api/non-db')
def nondb():
    return jsonify({"data": ["X", "Y", "Z"]})

# ───────────────────────────────────────
# Entry point
# ───────────────────────────────────────
if __name__ == '__main__':
    init_db()
    app.run(debug=True)
