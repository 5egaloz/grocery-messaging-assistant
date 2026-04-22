import { useEffect, useState } from "react";
import { DollarSign, Lock, Unlock, Bot } from "lucide-react";
import { api } from "../api/client";

export default function Cash() {
  const [status, setStatus] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [openAmount, setOpenAmount] = useState("");
  const [closeAmount, setCloseAmount] = useState("");
  const [closeResult, setCloseResult] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const load = async () => {
    const [s, h, sum] = await Promise.all([
      api.getCashStatus() as any,
      api.getCashHistory() as any,
      api.getTodaySummary() as any,
    ]);
    setStatus(s);
    setHistory(h);
    setSummary(sum);
  };

  useEffect(() => { load(); }, []);

  const open = async () => {
    await api.openCash({ opening_amount: +openAmount });
    setOpenAmount("");
    load();
  };

  const close = async () => {
    const result: any = await api.closeCash({ closing_amount: +closeAmount });
    setCloseResult(result);
    setCloseAmount("");
    load();

    setLoadingAi(true);
    try {
      const d: any = await api.analyzeCash(result);
      setAiAnalysis(d.analysis);
    } finally {
      setLoadingAi(false);
    }
  };

  const isOpen = status && status.id && !status.closed;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Caja</h1>

      {/* Status */}
      <div className={`rounded-xl border p-5 flex items-center gap-4 ${isOpen ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
        {isOpen ? <Unlock className="text-green-500" size={28} /> : <Lock className="text-gray-400" size={28} />}
        <div>
          <p className="font-semibold text-gray-800">{isOpen ? "Caja abierta" : "Caja cerrada"}</p>
          {isOpen && (
            <p className="text-sm text-gray-500">
              Apertura: ${(status.opening_amount || 0).toLocaleString("es-CL")} ·
              Ventas del día: ${(status.total_sales || 0).toLocaleString("es-CL")}
            </p>
          )}
        </div>
      </div>

      {/* Open / Close */}
      {!isOpen ? (
        <div className="bg-white rounded-xl shadow-sm border p-4 flex gap-3">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1"
            placeholder="Monto de apertura"
            type="number"
            value={openAmount}
            onChange={e => setOpenAmount(e.target.value)}
          />
          <button onClick={open} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
            <Unlock size={16} /> Abrir caja
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-4 flex gap-3">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1"
            placeholder="Monto al cierre (efectivo contado)"
            type="number"
            value={closeAmount}
            onChange={e => setCloseAmount(e.target.value)}
          />
          <button onClick={close} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 flex items-center gap-2">
            <Lock size={16} /> Cerrar caja
          </button>
        </div>
      )}

      {/* Close result */}
      {closeResult && (
        <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
          <h2 className="font-semibold text-gray-700">Resumen de cierre</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Metric label="Apertura" value={`$${closeResult.opening_amount?.toLocaleString("es-CL")}`} />
            <Metric label="Ventas" value={`$${closeResult.total_sales?.toLocaleString("es-CL")}`} />
            <Metric label="Esperado" value={`$${closeResult.expected?.toLocaleString("es-CL")}`} />
            <Metric
              label="Diferencia"
              value={`${closeResult.difference >= 0 ? "+" : ""}$${closeResult.difference?.toLocaleString("es-CL")}`}
              alert={Math.abs(closeResult.difference) > 0}
            />
          </div>

          {aiAnalysis && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex gap-2">
              <Bot size={18} className="text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-indigo-800">{aiAnalysis}</p>
            </div>
          )}
          {loadingAi && <p className="text-sm text-gray-400 italic">Analizando con IA...</p>}
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <h2 className="font-semibold text-gray-700 px-4 py-3 border-b">Historial de caja</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2">Fecha</th>
              <th className="text-right px-4 py-2">Apertura</th>
              <th className="text-right px-4 py-2">Ventas</th>
              <th className="text-right px-4 py-2">Cierre</th>
              <th className="text-center px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {history.map((r: any) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-gray-600">{r.date}</td>
                <td className="px-4 py-2 text-right">${(r.opening_amount || 0).toLocaleString("es-CL")}</td>
                <td className="px-4 py-2 text-right">${(r.total_sales || 0).toLocaleString("es-CL")}</td>
                <td className="px-4 py-2 text-right">{r.closing_amount ? `$${r.closing_amount.toLocaleString("es-CL")}` : "—"}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.closed ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                    {r.closed ? "Cerrada" : "Abierta"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`font-semibold text-lg ${alert ? "text-amber-600" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}
