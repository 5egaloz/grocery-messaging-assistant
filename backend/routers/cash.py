from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_conn

router = APIRouter(prefix="/cash", tags=["cash"])


class OpenRegister(BaseModel):
    opening_amount: float = 0
    notes: Optional[str] = None


class CloseRegister(BaseModel):
    closing_amount: float
    notes: Optional[str] = None


@router.get("/status")
def get_status():
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM cash_register WHERE closed = 0 ORDER BY id DESC LIMIT 1"
        ).fetchone()
        return dict(row) if row else {"open": False}


@router.post("/open")
def open_register(data: OpenRegister):
    with get_conn() as conn:
        existing = conn.execute(
            "SELECT id FROM cash_register WHERE closed = 0"
        ).fetchone()
        if existing:
            raise HTTPException(400, "Ya hay una caja abierta")
        cur = conn.execute(
            "INSERT INTO cash_register (opening_amount, notes) VALUES (?, ?)",
            (data.opening_amount, data.notes)
        )
        return {"id": cur.lastrowid, "opening_amount": data.opening_amount}


@router.post("/close")
def close_register(data: CloseRegister):
    with get_conn() as conn:
        register = conn.execute(
            "SELECT * FROM cash_register WHERE closed = 0 ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if not register:
            raise HTTPException(400, "No hay caja abierta")

        expected = register["opening_amount"] + register["total_sales"]
        difference = data.closing_amount - expected

        conn.execute(
            """UPDATE cash_register
               SET closing_amount = ?, notes = ?, closed = 1
               WHERE id = ?""",
            (data.closing_amount, data.notes, register["id"])
        )
        return {
            "id": register["id"],
            "opening_amount": register["opening_amount"],
            "total_sales": register["total_sales"],
            "expected": expected,
            "closing_amount": data.closing_amount,
            "difference": round(difference, 2)
        }


@router.get("/history")
def get_history(limit: int = 30):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM cash_register ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


@router.get("/today/summary")
def today_summary():
    with get_conn() as conn:
        row = conn.execute("""
            SELECT
                cr.*,
                COUNT(s.id) as num_sales,
                COALESCE(AVG(s.total), 0) as avg_sale
            FROM cash_register cr
            LEFT JOIN sales s ON s.cash_register_id = cr.id
            WHERE date(cr.date) = date('now')
            GROUP BY cr.id
            ORDER BY cr.id DESC LIMIT 1
        """).fetchone()
        return dict(row) if row else {}
