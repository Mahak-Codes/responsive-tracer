import argparse
import requests
import time
import csv
import matplotlib.pyplot as plt

# Setup CLI
# Loop N times:
    # Record start time
    # Send GET request
    # Record end time
    # Extract db_latency_ms from JSON
    # Calculate RTT and Non-DB delay
# Print results


# trace_db.py

def main():
    parser = argparse.ArgumentParser(
        description="Trace DB latency from a backend API that returns 'db_latency_ms'."
    )
    
    parser.add_argument(
        '--url', type=str, required=True,
        help='API endpoint to test (e.g. http://localhost:5000/api/fetch-users)'
    )
    
    parser.add_argument(
        '--repeat', type=int, default=1,
        help='Number of times to call the API (default: 1)'
    )
    
    parser.add_argument(
        '--output', type=str, default=None,
        help='Optional: save results to CSV file'
    )
    
    args = parser.parse_args()

    # Debug print
    print(f"[✓] URL: {args.url}")
    print(f"[✓] Repeats: {args.repeat}")
    if args.output:
        print(f"[✓] Output file: {args.output}")

    results = []


    for i in range(args.repeat):
        print(f"\nRequest {i + 1}:")

        try:
            start = time.time()
            response = requests.get(args.url)
            end = time.time()

            total_rtt = (end - start) * 1000  # ms
            data = response.json()

            db_latency = data.get("db_latency_ms", None)

            if db_latency is not None:
                non_db = total_rtt - db_latency
                print(f"  Total RTT: {total_rtt:.2f} ms")
                print(f"  DB Latency (server): {db_latency:.2f} ms")
                print(f"  Non-DB Delay: {non_db:.2f} ms")
                results.append({
                    "request": i + 1,
                    "rtt_ms": round(total_rtt, 2),
                    "db_latency_ms": round(db_latency, 2) if db_latency else None,
                    "non_db_delay_ms": round(non_db, 2) if db_latency else None
                })

            else:
                print("  ❌ 'db_latency_ms' not found in response!")

        except Exception as e:
            print(f"  ❌ Request failed: {e}")


    if args.output:
        with open(args.output, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["request", "rtt_ms", "db_latency_ms", "non_db_delay_ms"])
            writer.writeheader()
            writer.writerows(results)
        print(f"\n✅ Results written to {args.output}")

    

    rtt = [row["rtt_ms"] for row in results]
    db = [row["db_latency_ms"] for row in results]
    non_db = [row["non_db_delay_ms"] for row in results]
    x = [row["request"] for row in results]

    plt.figure(figsize=(10, 6))
    plt.plot(x, rtt, label="Total RTT", marker="o")
    plt.plot(x, db, label="DB Latency", marker="o")
    plt.plot(x, non_db, label="Non-DB Delay", marker="o")
    plt.xlabel("Request #")
    plt.ylabel("Latency (ms)")
    plt.title("Latency Tracing Report")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()




if __name__ == "__main__":
    main()
