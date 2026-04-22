# Sistema de Gestión — Tienda de Abarrotes

Panel de administración completo con agente IA integrado para tiendas de barrio.

## Funcionalidades

- **Dashboard** — ventas del día, stock bajo, análisis IA en tiempo real
- **Ventas** — registro de ventas con descuento automático de inventario
- **Clientes** — historial de compras, generación de mensajes personalizados por IA
- **Inventario** — control de stock, ofertas, alertas automáticas
- **Caja** — apertura, cierre, cuadre y análisis IA de diferencias
- **Mensajes** — generación y registro de mensajes WhatsApp por cliente
- **Reportes** — KPIs semanales, gráficos, reporte narrativo semanal por IA

## Agente IA

Usa la API de Anthropic con **prompt caching** para minimizar el uso de tokens:

| Tarea | Modelo | Tokens aprox. |
|---|---|---|
| Análisis diario | Haiku | ~300 |
| Sugerencia de ofertas | Haiku | ~350 |
| Mensaje por cliente | Haiku | ~200 |
| Análisis cierre de caja | Haiku | ~250 |
| Reporte semanal KPI | Sonnet | ~800 |

El sistema prompt y los datos de inventario se cachean entre llamadas consecutivas.

## Instalación

### Backend

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
# Editar .env con tu ANTHROPIC_API_KEY
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Scheduler (mensajes y reportes automáticos)

```bash
cd backend
python scheduler.py
```

## Estructura

```
├── backend/
│   ├── main.py          # API FastAPI
│   ├── agent.py         # Agente IA (Claude API + caching)
│   ├── database.py      # SQLite
│   ├── scheduler.py     # Tareas automáticas
│   └── routers/         # Endpoints por módulo
└── frontend/
    └── src/
        ├── pages/       # Dashboard, Clientes, Inventario, Caja, Ventas, Mensajes, Reportes
        └── api/         # Cliente HTTP
```
