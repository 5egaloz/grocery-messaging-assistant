import { useEffect, useState } from "react";
import { TrendingUp, Users, Package, AlertTriangle, Bot, Lightbulb } from "lucide-react";
import { api } from "../api/client";

interface KpiData {
  today: { total_revenue: number; num_sales: number; unique_clients: number };
  top_products: { product: string; units: number; revenue: number }[];
}

export default function Dashboard() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [insight, setInsight] = useState<string>("");
  const [offers, setOffers] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);

  useEffect(() => {
    api.getDailyKpi().then((d: any) => setKpi(d));
    api.getLowStock().then((d: any) => setLowStock(d));
  }, []);

  const fetchInsight = async () => {
    setLoadingInsight(true);
    try {
      const d: any = await api.getInsights();
      setInsight(d.insight);
    } finally {
      setLoadingInsight(false);
    }
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const d: any = await api.getOffers();
      setOffers(d.suggestions);
    } finally {
      setLoadingOffers(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard del día</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp className="text-green-500" />}
          label="Ventas hoy"
          value={`$${(kpi?.today?.total_revenue || 0).toLocaleString("es-CL")}`}
          sub={`${kpi?.today?.num_sales || 0} transacciones`}
        />
        <StatCard
          icon={<Users className="text-blue-500" />}
          label="Clientes hoy"
          value={String(kpi?.today?.unique_clients || 0)}
          sub="clientes atendidos"
        />
        <StatCard
          icon={<Package className="text-purple-500" />}
          label="Stock bajo"
          value={String(lowStock.length)}
          sub="productos por reponer"
          alert={lowStock.length > 0}
        />
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
            <AlertTriangle size={18} /> Stock bajo
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p: any) => (
              <span key={p.id} className="bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full">
                {p.product} — {p.stock} {p.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Agent Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AgentCard
          icon={<Bot className="text-indigo-500" />}
          title="Análisis del día"
          content={insight}
          loading={loadingInsight}
          onFetch={fetchInsight}
          buttonLabel="Analizar"
        />
        <AgentCard
          icon={<Lightbulb className="text-yellow-500" />}
          title="Sugerencias de ofertas"
          content={offers}
          loading={loadingOffers}
          onFetch={fetchOffers}
          buttonLabel="Sugerir ofertas"
        />
      </div>

      {/* Top products */}
      {kpi?.top_products && kpi.top_products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Más vendido hoy</h2>
          <div className="space-y-2">
            {kpi.top_products.map((p, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b last:border-0">
                <span className="text-gray-700">{p.product}</span>
                <span className="text-sm font-medium text-gray-500">
                  {p.units} unid. · ${p.revenue.toLocaleString("es-CL")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, alert }: any) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 flex items-start gap-4 ${alert ? "border-amber-300" : ""}`}>
      <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
}

function AgentCard({ icon, title, content, loading, onFetch, buttonLabel }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          {icon} {title}
        </div>
        <button
          onClick={onFetch}
          disabled={loading}
          className="text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Consultando IA..." : buttonLabel}
        </button>
      </div>
      {content ? (
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{content}</p>
      ) : (
        <p className="text-sm text-gray-400 italic">Haz clic para consultar al asistente</p>
      )}
    </div>
  );
}
