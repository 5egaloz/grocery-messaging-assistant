from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_conn

router = APIRouter(prefix="/clients", tags=["clients"])


class ClientIn(BaseModel):
    name: str
    phone: str


@router.get("/")
def list_clients():
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT c.*,
                   COUNT(p.id) as purchase_count,
                   MAX(p.date) as last_purchase,
                   COALESCE(SUM(p.price * p.quantity), 0) as total_spent
            FROM clients c
            LEFT JOIN purchases p ON p.client_id = c.id
            GROUP BY c.id ORDER BY c.name
        """).fetchall()
        return [dict(r) for r in rows]


@router.post("/")
def create_client(data: ClientIn):
    with get_conn() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO clients (name, phone) VALUES (?, ?)",
                (data.name, data.phone)
            )
            return {"id": cur.lastrowid, **data.model_dump()}
        except Exception:
            raise HTTPException(400, "El teléfono ya está registrado")


@router.get("/{client_id}/purchases")
def get_purchases(client_id: int):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM purchases WHERE client_id = ? ORDER BY date DESC",
            (client_id,)
        ).fetchall()
        return [dict(r) for r in rows]


@router.delete("/{client_id}")
def delete_client(client_id: int):
    with get_conn() as conn:
        conn.execute("DELETE FROM clients WHERE id = ?", (client_id,))
        return {"ok": True}
