import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FileText, Bot } from "lucide-react";
import { api } from "../api/client";

export default function Reports() {
  const [weekly, setWeekly] = useState<any>(null);
  const [aiReport, setAiReport] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    api.getWeeklyKpi().then((d: any) => setWeekly(d));
    api.getAgentLogs().then((d: any) => setLogs(d));
  }, []);

  const fetchAiReport = async () => {
    setLoadingAi(true);
    try {
      const d: any = await api.getWeeklyReport();
      setAiReport(d.report);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>

      {/* Weekly KPI */}
      {weekly && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Ingresos 7 días" value={`$${(weekly.revenue?.total_revenue || 0).toLocaleString("es-CL")}`} />
          <Metric label="Ventas" value={weekly.revenue?.num_sales || 0} />
          <Metric label="Ticket prom." value={`$${Math.round(weekly.revenue?.avg_sale || 0).toLocaleString("es-CL")}`} />
          <Metric label="Clientes activos" value={weekly.active_clients || 0} />
        </div>
      )}

      {/* Top products chart */}
      {weekly?.top_products?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-semibold text-gray-700 mb-4">Top productos (7 días)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekly.top_products}>
              <XAxis dataKey="product" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString("es-CL")}`} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Weekly Report */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <Bot className="text-indigo-500" size={18} /> Reporte semanal IA
          </div>
          <button
            onClick={fetchAiReport}
            disabled={loadingAi}
            className="text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg transition disabled:opacity-50"
          >
            {loadingAi ? "Generando..." : "Generar reporte"}
          </button>
        </div>
        {aiReport ? (
          <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">{aiReport}</pre>
        ) : (
          <p className="text-sm text-gray-400 italic">El asistente analiza tus datos de la semana y genera un reporte completo con recomendaciones.</p>
        )}
      </div>

      {/* Agent activity log */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <h2 className="font-semibold text-gray-700 px-4 py-3 border-b flex items-center gap-2">
            <FileText size={16} /> Actividad del agente
          </h2>
          <div className="divide-y max-h-64 overflow-y-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{log.type}</span>
                  <span className="text-xs text-gray-400">{log.created_at}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{log.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
