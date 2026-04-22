from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_conn

router = APIRouter(prefix="/sales", tags=["sales"])


class SaleItem(BaseModel):
    product: str
    quantity: float
    unit_price: float


class SaleIn(BaseModel):
    client_id: Optional[int] = None
    items: list[SaleItem]


@router.post("/")
def register_sale(data: SaleIn):
    with get_conn() as conn:
        # Get open cash register
        register = conn.execute(
            "SELECT id FROM cash_register WHERE closed = 0 ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if not register:
            raise HTTPException(400, "No hay caja abierta. Abre la caja primero.")

        total = sum(i.quantity * i.unit_price for i in data.items)

        sale_cur = conn.execute(
            "INSERT INTO sales (client_id, cash_register_id, total) VALUES (?, ?, ?)",
            (data.client_id, register["id"], total)
        )
        sale_id = sale_cur.lastrowid

        for item in data.items:
            subtotal = item.quantity * item.unit_price
            conn.execute(
                """INSERT INTO sale_items (sale_id, product, quantity, unit_price, subtotal)
                   VALUES (?, ?, ?, ?, ?)""",
                (sale_id, item.product, item.quantity, item.unit_price, subtotal)
            )
            conn.execute(
                "UPDATE inventory SET stock = stock - ? WHERE product = ?",
                (item.quantity, item.product)
            )
            if data.client_id:
                conn.execute(
                    """INSERT INTO purchases (client_id, product, quantity, price)
                       VALUES (?, ?, ?, ?)""",
                    (data.client_id, item.product, item.quantity, item.unit_price)
                )

        conn.execute(
            "UPDATE cash_register SET total_sales = total_sales + ? WHERE id = ?",
            (total, register["id"])
        )
        return {"sale_id": sale_id, "total": total}


@router.get("/today")
def today_sales():
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT s.*, c.name as client_name,
                   GROUP_CONCAT(si.product || ' x' || si.quantity) as items
            FROM sales s
            LEFT JOIN clients c ON c.id = s.client_id
            LEFT JOIN sale_items si ON si.sale_id = s.id
            WHERE date(s.date) = date('now')
            GROUP BY s.id ORDER BY s.date DESC
        """).fetchall()
        return [dict(r) for r in rows]


@router.get("/{sale_id}")
def get_sale(sale_id: int):
    with get_conn() as conn:
        sale = conn.execute("SELECT * FROM sales WHERE id = ?", (sale_id,)).fetchone()
        items = conn.execute(
            "SELECT * FROM sale_items WHERE sale_id = ?", (sale_id,)
        ).fetchall()
        return {**dict(sale), "items": [dict(i) for i in items]}
