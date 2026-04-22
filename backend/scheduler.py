"""
Scheduled tasks: daily summary, weekly KPI, automatic client messages.
Run with: python scheduler.py
"""
import time
import schedule
from datetime import datetime
from agent import get_dashboard_insights, weekly_kpi_report, generate_client_message
from database import get_conn


def daily_summary():
    print(f"[{datetime.now()}] Running daily summary...")
    insight = get_dashboard_insights()
    print(insight)


def weekly_kpi():
    if datetime.now().weekday() == 0:  # Monday
        print(f"[{datetime.now()}] Running weekly KPI...")
        report = weekly_kpi_report()
        print(report)


def auto_messages():
    """Check all clients and send messages to eligible ones."""
    with get_conn() as conn:
        clients = conn.execute("""
            SELECT c.id, c.name, c.phone,
                   MAX(m.sent_at) as last_message,
                   COUNT(p.id) as purchase_count
            FROM clients c
            LEFT JOIN messages m ON m.client_id = c.id
            LEFT JOIN purchases p ON p.client_id = c.id
            GROUP BY c.id
            HAVING purchase_count >= 3
               AND (last_message IS NULL OR julianday('now') - julianday(last_message) >= 5)
        """).fetchall()

        purchases_by_client = {}
        for c in clients:
            rows = conn.execute(
                "SELECT product, quantity, date FROM purchases WHERE client_id = ? ORDER BY date DESC LIMIT 20",
                (c["id"],)
            ).fetchall()
            purchases_by_client[c["id"]] = [dict(r) for r in rows]

    for client in clients:
        client_data = {
            "nombre_cliente": client["name"],
            "telefono": client["phone"],
            "historial_compras": purchases_by_client.get(client["id"], []),
            "ultimo_mensaje_enviado": client["last_message"]
        }
        msg = generate_client_message(client_data)
        if msg.strip() != "NO_ENVIAR":
            with get_conn() as conn:
                conn.execute(
                    "INSERT INTO messages (client_id, content, channel) VALUES (?, ?, 'whatsapp')",
                    (client["id"], msg)
                )
            print(f"Message queued for {client['name']}: {msg[:60]}...")


schedule.every().day.at("08:00").do(daily_summary)
schedule.every().day.at("09:00").do(auto_messages)
schedule.every().monday.at("07:00").do(weekly_kpi)

if __name__ == "__main__":
    print("Scheduler running...")
    daily_summary()
    while True:
        schedule.run_pending()
        time.sleep(60)
