from fastapi import APIRouter
from database import get_conn

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/kpi/weekly")
def weekly_kpi():
    with get_conn() as conn:
        sales = conn.execute("""
            SELECT
                SUM(total) as total_revenue,
                COUNT(*) as num_sales,
                AVG(total) as avg_sale
            FROM sales
            WHERE date >= date('now', '-7 days')
        """).fetchone()

        top_products = conn.execute("""
            SELECT product, SUM(quantity) as units_sold, SUM(subtotal) as revenue
            FROM sale_items si
            JOIN sales s ON s.id = si.sale_id
            WHERE date(s.date) >= date('now', '-7 days')
            GROUP BY product ORDER BY revenue DESC LIMIT 5
        """).fetchall()

        active_clients = conn.execute("""
            SELECT COUNT(DISTINCT client_id) as count
            FROM purchases WHERE date >= date('now', '-7 days')
        """).fetchone()

        low_stock = conn.execute(
            "SELECT COUNT(*) as count FROM inventory WHERE stock <= 5"
        ).fetchone()

        return {
            "period": "7 días",
            "revenue": dict(sales),
            "top_products": [dict(r) for r in top_products],
            "active_clients": dict(active_clients)["count"],
            "low_stock_alerts": dict(low_stock)["count"]
        }


@router.get("/kpi/daily")
def daily_kpi():
    with get_conn() as conn:
        row = conn.execute("""
            SELECT
                SUM(s.total) as total_revenue,
                COUNT(s.id) as num_sales,
                COUNT(DISTINCT s.client_id) as unique_clients
            FROM sales s
            WHERE date(s.date) = date('now')
        """).fetchone()

        top_today = conn.execute("""
            SELECT si.product, SUM(si.quantity) as units, SUM(si.subtotal) as revenue
            FROM sale_items si
            JOIN sales s ON s.id = si.sale_id
            WHERE date(s.date) = date('now')
            GROUP BY si.product ORDER BY revenue DESC LIMIT 3
        """).fetchall()

        return {
            "today": dict(row),
            "top_products": [dict(r) for r in top_today]
        }


@router.get("/agent-logs")
def agent_logs(limit: int = 20):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
