from fastapi import APIRouter
from pydantic import BaseModel
from database import get_conn

router = APIRouter(prefix="/messages", tags=["messages"])


class MessageIn(BaseModel):
    client_id: int
    content: str
    channel: str = "whatsapp"


@router.get("/")
def list_messages(limit: int = 50):
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT m.*, c.name as client_name, c.phone
            FROM messages m
            JOIN clients c ON c.id = m.client_id
            ORDER BY m.sent_at DESC LIMIT ?
        """, (limit,)).fetchall()
        return [dict(r) for r in rows]


@router.post("/")
def log_message(data: MessageIn):
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO messages (client_id, content, channel) VALUES (?, ?, ?)",
            (data.client_id, data.content, data.channel)
        )
        return {"id": cur.lastrowid, **data.model_dump()}


@router.get("/client/{client_id}")
def client_messages(client_id: int):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE client_id = ? ORDER BY sent_at DESC",
            (client_id,)
        ).fetchall()
        return [dict(r) for r in rows]
