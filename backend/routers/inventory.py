from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_conn

router = APIRouter(prefix="/inventory", tags=["inventory"])


class ProductIn(BaseModel):
    product: str
    price: float
    stock: float
    unit: str = "unidad"
    on_sale: bool = False
    sale_price: Optional[float] = None


class StockUpdate(BaseModel):
    quantity: float


@router.get("/")
def list_inventory():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM inventory ORDER BY product"
        ).fetchall()
        return [dict(r) for r in rows]


@router.post("/")
def add_product(data: ProductIn):
    with get_conn() as conn:
        try:
            cur = conn.execute(
                """INSERT INTO inventory (product, price, stock, unit, on_sale, sale_price)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (data.product, data.price, data.stock, data.unit,
                 int(data.on_sale), data.sale_price)
            )
            return {"id": cur.lastrowid, **data.model_dump()}
        except Exception:
            raise HTTPException(400, "El producto ya existe")


@router.put("/{product_id}")
def update_product(product_id: int, data: ProductIn):
    with get_conn() as conn:
        conn.execute(
            """UPDATE inventory SET product=?, price=?, stock=?, unit=?,
               on_sale=?, sale_price=?, updated_at=datetime('now')
               WHERE id=?""",
            (data.product, data.price, data.stock, data.unit,
             int(data.on_sale), data.sale_price, product_id)
        )
        return {"id": product_id, **data.model_dump()}


@router.patch("/{product_id}/stock")
def adjust_stock(product_id: int, update: StockUpdate):
    with get_conn() as conn:
        conn.execute(
            "UPDATE inventory SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?",
            (update.quantity, product_id)
        )
        row = conn.execute("SELECT * FROM inventory WHERE id = ?", (product_id,)).fetchone()
        return dict(row)


@router.delete("/{product_id}")
def delete_product(product_id: int):
    with get_conn() as conn:
        conn.execute("DELETE FROM inventory WHERE id = ?", (product_id,))
        return {"ok": True}


@router.get("/alerts")
def low_stock_alerts(threshold: float = 5):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM inventory WHERE stock <= ? ORDER BY stock",
            (threshold,)
        ).fetchall()
        return [dict(r) for r in rows]
