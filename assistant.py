from datetime import datetime, date
from typing import Optional
import json


def days_since(fecha_str: str) -> int:
    fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
    return (date.today() - fecha).days


def evaluar_y_redactar(datos: dict) -> str:
    nombre = datos["nombre_cliente"]
    historial = datos["historial_compras"]
    ultimo_msg = datos.get("ultimo_mensaje_enviado")
    inventario = datos["inventario"]
    dueno = datos["nombre_dueño"]

    # PASO 1 — DECIDIR SI ENVIAR

    if ultimo_msg and days_since(ultimo_msg) < 5:
        return "NO_ENVIAR"

    if len(historial) < 3:
        return "NO_ENVIAR"

    productos_cliente = {c["producto"].lower() for c in historial}
    productos_inventario = {item["producto"].lower() for item in inventario}

    if not productos_cliente.intersection(productos_inventario) and \
       not any(
           any(pc in pi or pi in pc for pi in productos_inventario)
           for pc in productos_cliente
       ):
        return "NO_ENVIAR"

    # PASO 2 — DETERMINAR QUÉ DECIRLE

    # Frecuencia de compra por producto
    frecuencia: dict[str, list[str]] = {}
    for compra in historial:
        prod = compra["producto"].lower()
        frecuencia.setdefault(prod, []).append(compra["fecha"])

    # Productos que compra frecuente y podrían faltarle
    posiblemente_faltando = []
    for prod, fechas in frecuencia.items():
        if len(fechas) >= 2:
            ultima_compra = max(fechas)
            if days_since(ultima_compra) >= 14:
                posiblemente_faltando.append(prod)

    # Productos habituales con oferta
    con_oferta = []
    for item in inventario:
        if item.get("oferta") and item["producto"].lower() in frecuencia:
            con_oferta.append(item)

    # Ofertas que encajan con perfil (complementarios)
    ofertas_complementarias = []
    for item in inventario:
        if item.get("oferta") and item["producto"].lower() not in frecuencia:
            ofertas_complementarias.append(item)

    puntos: list[str] = []

    for prod in posiblemente_faltando:
        inv_match = next(
            (i for i in inventario if i["producto"].lower() == prod), None
        )
        if inv_match and len(puntos) < 3:
            precio_txt = f"a ${inv_match['precio']}" if inv_match.get("precio") else ""
            oferta_txt = " y está en oferta" if inv_match.get("oferta") else ""
            puntos.append(
                f"tenemos {inv_match['producto']} {precio_txt}{oferta_txt}"
            )

    for item in con_oferta:
        if len(puntos) < 3 and item["producto"] not in [p for p in puntos]:
            puntos.append(
                f"{item['producto']} está en oferta esta semana a ${item['precio']}"
            )

    for item in ofertas_complementarias[:1]:
        if len(puntos) < 3:
            puntos.append(
                f"también llegó {item['producto']} a ${item['precio']} que te puede interesar"
            )

    if not puntos:
        return "NO_ENVIAR"

    # PASO 3 — REDACTAR

    cuerpo = ", ".join(puntos[:-1])
    if len(puntos) > 1:
        cuerpo += f" y {puntos[-1]}"
    else:
        cuerpo = puntos[0]

    mensaje = (
        f"Hola {nombre}, cómo estás. "
        f"Pasaba a avisarte que {cuerpo}. "
        f"Cualquier cosa me avisas 🙂 — {dueno}"
    )

    return mensaje


if __name__ == "__main__":
    ejemplo = {
        "nombre_cliente": "María",
        "telefono": "+56912345678",
        "historial_compras": [
            {"producto": "Arroz 5kg", "cantidad": 1, "fecha": "2026-03-01"},
            {"producto": "Aceite", "cantidad": 2, "fecha": "2026-03-15"},
            {"producto": "Arroz 5kg", "cantidad": 1, "fecha": "2026-03-28"},
        ],
        "ultimo_mensaje_enviado": "2026-04-10",
        "inventario": [
            {"producto": "Arroz 5kg", "precio": 4990, "oferta": True, "stock": 20},
            {"producto": "Aceite", "precio": 2490, "oferta": False, "stock": 10},
            {"producto": "Fideos", "precio": 890, "oferta": True, "stock": 50},
        ],
        "nombre_dueño": "Don Pedro",
    }

    resultado = evaluar_y_redactar(ejemplo)
    print(resultado)
