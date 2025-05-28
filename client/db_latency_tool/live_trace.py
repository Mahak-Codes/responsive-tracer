from playwright.sync_api import sync_playwright
import time
import argparse
from rich.live import Live
from rich.table import Table
from rich.console import Console
from rich.progress import BarColumn, Progress, TextColumn, TimeElapsedColumn
from rich import box



# ─────────────────────────────
# CLI Arguments
# ─────────────────────────────
parser = argparse.ArgumentParser(description="Live DB latency tracer")
parser.add_argument('--view', choices=['table', 'bar'], default='table', help="Display mode (default: table)")
args = parser.parse_args()

# ─────────────────────────────
# Globals
# ─────────────────────────────
console = Console()
results = []

# ─────────────────────────────
# Render Live Table
# ─────────────────────────────
def render_table():
    table = Table(title="Live DB Tracing Report", box=box.SIMPLE_HEAVY)
    table.add_column("Req #", justify="right")
    table.add_column("RTT (ms)", justify="right")
    table.add_column("DB (ms)", justify="right")
    table.add_column("Non-DB (ms)", justify="right")

    for row in results:
        db_latency = row['db_latency_ms']
        rtt = row['rtt_ms']

        db = f"{db_latency:.2f}" if db_latency is not None else "N/A"

        # If db_latency is None, show rtt as non_db, else use non_db_delay_ms
        if db_latency is None:
            non_db_value = rtt
        else:
            non_db_value = row['non_db_delay_ms']

        non_db = f"{non_db_value:.2f}" if non_db_value is not None else "N/A"

        table.add_row(
            str(row["request"]),
            f"{rtt:.2f}",
            db,
            non_db
        )

    return table


# ─────────────────────────────
# Render Bar View (last request)
# ─────────────────────────────
from rich.panel import Panel
def render_bar():
    if not results:
        return Panel("Waiting for DB interaction...")

    last = results[-1]
    rtt = last["rtt_ms"]
    db = last["db_latency_ms"]
    non_db = last["non_db_delay_ms"]

    bars = Table.grid()
    bars.add_column()
    bars.add_row(f"[bold]Request {last['request']}[/bold]")
    bars.add_row(f"[cyan]RTT:[/]     {'█' * int(rtt / 20)} {rtt:.2f} ms")

    if db is not None:
        bars.add_row(f"[green]DB:[/]      {'█' * int(db / 20)} {db:.2f} ms")
    else:
        bars.add_row(f"[green]DB:[/]      [italic dim]N/A[/]")

    # If no db latency, non-db = total RTT
    non_db_display = non_db if non_db is not None else rtt
    bars.add_row(f"[magenta]Non-DB:[/] {'█' * int(non_db_display / 20)} {non_db_display:.2f} ms")

    return bars



# ─────────────────────────────
# Main Tracing Function
# ─────────────────────────────
def trace_site(url):
    with sync_playwright() as p:
        browser = p.firefox.launch(headless=False)
        page = browser.new_page()

        with Live(render_table(), refresh_per_second=4, console=console) as live:

            def handle_response(response):
                if response.request.resource_type not in ("xhr", "fetch"):
                    return

                start = time.time()
                db_latency = None
                json_data = {}

                try:
                    content_type = response.headers.get("content-type", "")
                    if "application/json" in content_type:
                        json_data = response.json()
                        db_latency = json_data.get("db_latency_ms", None)
                except Exception as e:
                    console.print(f"[red]Failed to parse JSON from {response.url}[/red]: {e}")

                end = time.time()
                total_rtt = (end - start) * 1000

                results.append({
                    "request": len(results) + 1,
                    "url": response.url,
                    "rtt_ms": total_rtt,
                    "db_latency_ms": db_latency,
                    "non_db_delay_ms": (total_rtt - db_latency) if db_latency is not None else None
                })

                # Render view
                live.update(render_bar() if args.view == "bar" else render_table())

            # Attach the listener
            page.on("response", handle_response)

            # Launch the page and wait for user
            print(f"Opening {url}...")
            page.goto(url)
            print("Waiting for user interaction... (close window to stop)")
            try:
                page.wait_for_timeout(120_000)
            except:
                print("[i] Browser closed by user. Ending trace...")
            finally:
                browser.close()

            browser.close()

# ─────────────────────────────
# Entry Point
# ─────────────────────────────
if __name__ == "__main__":
    trace_site("http://localhost:8000/")