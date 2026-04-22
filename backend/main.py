from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import init_db
from routers import clients, inventory, sales, cash, messages, reports
from agent import (
    get_dashboard_insights, suggest_offers,
    generate_client_message, weekly_kpi_report, cash_closing_analysis
)

app = FastAPI(title="Grocery Store API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(cash.router)
app.include_router(messages.router)
app.include_router(reports.router)


@app.on_event("startup")
def startup():
    init_db()


# AI Agent endpoints
@app.get("/agent/insights")
def agent_insights():
    try:
        return {"insight": get_dashboard_insights()}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/agent/offers")
def agent_offers():
    try:
        return {"suggestions": suggest_offers()}
    except Exception as e:
        raise HTTPException(500, str(e))


class ClientMessageRequest(BaseModel):
    client_id: int


@app.post("/agent/message")
def agent_message(req: ClientMessageRequest):
    from database import get_conn
    with get_conn() as conn:
        client = conn.execute("SELECT * FROM clients WHERE id = ?", (req.client_id,)).fetchone()
        if not client:
            raise HTTPException(404, "Cliente no encontrado")
        purchases = conn.execute(
            "SELECT product, quantity, date FROM purchases WHERE client_id = ? ORDER BY date DESC LIMIT 20",
            (req.client_id,)
        ).fetchall()
        last_msg = conn.execute(
            "SELECT sent_at FROM messages WHERE client_id = ? ORDER BY sent_at DESC LIMIT 1",
            (req.client_id,)
        ).fetchone()

    client_data = {
        "nombre_cliente": client["name"],
        "telefono": client["phone"],
        "historial_compras": [dict(p) for p in purchases],
        "ultimo_mensaje_enviado": last_msg["sent_at"] if last_msg else None
    }
    try:
        msg = generate_client_message(client_data)
        return {"message": msg, "should_send": msg.strip() != "NO_ENVIAR"}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/agent/weekly-kpi")
def agent_weekly_kpi():
    try:
        return {"report": weekly_kpi_report()}
    except Exception as e:
        raise HTTPException(500, str(e))


class CashAnalysisRequest(BaseModel):
    opening_amount: float
    closing_amount: float
    total_sales: float
    difference: float


@app.post("/agent/cash-analysis")
def agent_cash_analysis(req: CashAnalysisRequest):
    try:
        return {"analysis": cash_closing_analysis(req.model_dump())}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
