"""
AI Agent using Claude API with prompt caching to minimize token usage.
- System prompt cached (store context + rules)
- Inventory snapshot cached per request batch
- Uses Haiku for routine tasks, Sonnet for complex analysis
"""
import os
import json
from datetime import date
import anthropic
from database import get_conn

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

HAIKU = "claude-haiku-4-5-20251001"
SONNET = "claude-sonnet-4-6"

SYSTEM_BASE = """Eres el asistente inteligente de una tienda de abarrotes de barrio.
Tu rol es ayudar al dueño a tomar mejores decisiones de negocio.

REGLAS:
- Sé conciso y práctico. El dueño no tiene tiempo para textos largos.
- Usa números concretos cuando estén disponibles.
- Tus sugerencias deben ser accionables hoy, no teorías.
- Nunca inventes datos que no estén en el contexto.
- Responde siempre en español, tono cercano pero profesional."""


def _get_store_context() -> dict:
    with get_conn() as conn:
        inventory = conn.execute(
            "SELECT product, price, stock, unit, on_sale, sale_price FROM inventory ORDER BY product"
        ).fetchall()
        today_sales = conn.execute("""
            SELECT SUM(total) as revenue, COUNT(*) as num_sales
            FROM sales WHERE date(date) = date('now')
        """).fetchone()
        cash = conn.execute(
            "SELECT * FROM cash_register WHERE closed = 0 ORDER BY id DESC LIMIT 1"
        ).fetchone()
        low_stock = conn.execute(
            "SELECT product, stock, unit FROM inventory WHERE stock <= 5"
        ).fetchall()

    return {
        "inventory": [dict(r) for r in inventory],
        "today": dict(today_sales) if today_sales else {},
        "cash_open": dict(cash) if cash else None,
        "low_stock": [dict(r) for r in low_stock],
        "date": date.today().isoformat()
    }


def _log(type_: str, content: str):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO agent_logs (type, content) VALUES (?, ?)",
            (type_, content)
        )


def get_dashboard_insights() -> str:
    """Fast daily insight using Haiku + caching."""
    ctx = _get_store_context()
    ctx_text = json.dumps(ctx, ensure_ascii=False)

    response = client.messages.create(
        model=HAIKU,
        max_tokens=400,
        system=[
            {
                "type": "text",
                "text": SYSTEM_BASE,
                "cache_control": {"type": "ephemeral"}
            }
        ],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"DATOS DE HOY:\n{ctx_text}",
                        "cache_control": {"type": "ephemeral"}
                    },
                    {
                        "type": "text",
                        "text": "Dame 3 observaciones clave del día (máximo 2 líneas cada una). Enfócate en lo urgente."
                    }
                ]
            }
        ]
    )
    result = response.content[0].text
    _log("dashboard", result)
    return result


def suggest_offers() -> str:
    """Suggest promotional offers based on inventory + sales patterns."""
    ctx = _get_store_context()

    with get_conn() as conn:
        slow_movers = conn.execute("""
            SELECT i.product, i.stock, i.price,
                   COALESCE(SUM(si.quantity), 0) as sold_7d
            FROM inventory i
            LEFT JOIN sale_items si ON si.product = i.product
            LEFT JOIN sales s ON s.id = si.sale_id AND date(s.date) >= date('now','-7 days')
            GROUP BY i.product
            HAVING i.stock > 10 AND sold_7d < 3
            ORDER BY i.stock DESC LIMIT 5
        """).fetchall()

    prompt_data = {
        "inventory": ctx["inventory"],
        "slow_movers": [dict(r) for r in slow_movers],
        "low_stock": ctx["low_stock"]
    }

    response = client.messages.create(
        model=HAIKU,
        max_tokens=350,
        system=[{"type": "text", "text": SYSTEM_BASE, "cache_control": {"type": "ephemeral"}}],
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": json.dumps(prompt_data, ensure_ascii=False),
                 "cache_control": {"type": "ephemeral"}},
                {"type": "text",
                 "text": "Sugiere 2-3 ofertas concretas para esta semana. Incluye precio sugerido y razón. Formato: producto | precio oferta | razón (1 línea)"}
            ]
        }]
    )
    result = response.content[0].text
    _log("offers", result)
    return result


def generate_client_message(client_data: dict) -> str:
    """Generate personalized message for a client. Uses Haiku."""
    with get_conn() as conn:
        inventory = conn.execute(
            "SELECT product, price, stock, on_sale, sale_price FROM inventory WHERE stock > 0"
        ).fetchall()

    ctx = {
        "client": client_data,
        "inventory": [dict(r) for r in inventory]
    }

    response = client.messages.create(
        model=HAIKU,
        max_tokens=200,
        system=[{"type": "text", "text": SYSTEM_BASE, "cache_control": {"type": "ephemeral"}}],
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": json.dumps(ctx, ensure_ascii=False),
                 "cache_control": {"type": "ephemeral"}},
                {"type": "text",
                 "text": """Redacta un mensaje WhatsApp para este cliente.
Tono: vecino de barrio, cercano. Máx 2 emojis. Máx 3 líneas.
Si no hay nada relevante responde solo: NO_ENVIAR
Nunca menciones que eres IA."""}
            ]
        }]
    )
    return response.content[0].text


def weekly_kpi_report() -> str:
    """Full weekly analysis. Uses Sonnet for depth."""
    with get_conn() as conn:
        sales_data = conn.execute("""
            SELECT date(s.date) as day,
                   SUM(s.total) as revenue,
                   COUNT(*) as num_sales
            FROM sales s
            WHERE date(s.date) >= date('now', '-7 days')
            GROUP BY day ORDER BY day
        """).fetchall()

        top_products = conn.execute("""
            SELECT si.product, SUM(si.quantity) as units, SUM(si.subtotal) as revenue
            FROM sale_items si JOIN sales s ON s.id = si.sale_id
            WHERE date(s.date) >= date('now', '-7 days')
            GROUP BY si.product ORDER BY revenue DESC LIMIT 10
        """).fetchall()

        client_activity = conn.execute("""
            SELECT COUNT(DISTINCT client_id) as active,
                   COUNT(*) as total_purchases
            FROM purchases WHERE date >= date('now', '-7 days')
        """).fetchone()

        cash_history = conn.execute("""
            SELECT date, opening_amount, closing_amount, total_sales,
                   (closing_amount - opening_amount - total_sales) as difference
            FROM cash_register
            WHERE date >= date('now', '-7 days') AND closed = 1
        """).fetchall()

    data = {
        "daily_sales": [dict(r) for r in sales_data],
        "top_products": [dict(r) for r in top_products],
        "client_activity": dict(client_activity),
        "cash_history": [dict(r) for r in cash_history]
    }

    response = client.messages.create(
        model=SONNET,
        max_tokens=800,
        system=[{"type": "text", "text": SYSTEM_BASE, "cache_control": {"type": "ephemeral"}}],
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": json.dumps(data, ensure_ascii=False),
                 "cache_control": {"type": "ephemeral"}},
                {"type": "text",
                 "text": """Genera el reporte KPI semanal con:
1. Resumen ejecutivo (2 líneas)
2. Métricas clave: ingresos, ventas, ticket promedio
3. Productos estrella y productos lentos
4. Análisis de caja: ¿cuadró bien?
5. Top 3 recomendaciones para la semana que viene"""}
            ]
        }]
    )
    result = response.content[0].text
    _log("weekly_kpi", result)
    return result


def cash_closing_analysis(closing_data: dict) -> str:
    """Analyze cash closing and flag anomalies. Uses Haiku."""
    response = client.messages.create(
        model=HAIKU,
        max_tokens=250,
        system=[{"type": "text", "text": SYSTEM_BASE, "cache_control": {"type": "ephemeral"}}],
        messages=[{
            "role": "user",
            "content": f"""Analiza este cierre de caja:
{json.dumps(closing_data, ensure_ascii=False)}

Dime: ¿cuadró bien? Si hay diferencia explica qué puede haberla causado. Máx 3 líneas."""
        }]
    )
    result = response.content[0].text
    _log("cash_closing", result)
    return result
