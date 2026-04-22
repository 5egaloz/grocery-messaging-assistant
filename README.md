# Grocery Messaging Assistant

Asistente autónomo de mensajería para tienda de abarrotes de barrio.

Analiza el historial de compras de cada cliente y el inventario disponible para decidir si vale la pena enviar un mensaje y, si corresponde, lo redacta de forma cercana y personalizada.

## Cómo funciona

**Paso 1 — Decide si enviar:**
- No envía si el cliente recibió un mensaje hace menos de 5 días
- No envía si tiene menos de 3 compras registradas
- No envía si el inventario no tiene nada relacionado con su perfil

**Paso 2 — Determina qué decirle** (en orden de prioridad):
1. Productos que compra frecuentemente y podrían estarle faltando
2. Productos habituales que están en oferta
3. Ofertas que complementan su perfil

**Paso 3 — Redacta el mensaje:**
- Tono cercano, de barrio
- Máximo 2 emojis
- Firmado con el nombre del dueño

## Uso

```python
from assistant import evaluar_y_redactar

datos = {
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

resultado = evaluar_y_redactar(datos)
print(resultado)
```

**Salida posible:**
```
Hola María, cómo estás. Pasaba a avisarte que tenemos Arroz 5kg a $4990 y está en oferta. Cualquier cosa me avisas 🙂 — Don Pedro
```

Si no corresponde enviar:
```
NO_ENVIAR
```

## Estructura del input

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre_cliente` | string | Nombre del cliente |
| `telefono` | string | Número de contacto |
| `historial_compras` | lista | `{producto, cantidad, fecha}` |
| `ultimo_mensaje_enviado` | string \| null | Fecha del último mensaje enviado (`YYYY-MM-DD`) |
| `inventario` | lista | `{producto, precio, oferta, stock}` |
| `nombre_dueño` | string | Nombre con el que se firma |

## Requisitos

Python 3.10+. Sin dependencias externas.
