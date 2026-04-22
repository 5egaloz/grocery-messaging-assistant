import { useEffect, useState } from "react";
import { UserPlus, Trash2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../api/client";

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [generating, setGenerating] = useState<number | null>(null);

  const load = () => api.getClients().then((d: any) => setClients(d));
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    await api.createClient(form);
    setForm({ name: "", phone: "" });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar cliente?")) return;
    await api.deleteClient(id);
    load();
  };

  const toggleExpand = async (id: number) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    const d: any = await api.getClientPurchases(id);
    setPurchases(d);
  };

  const generateMsg = async (id: number) => {
    setGenerating(id);
    try {
      const d: any = await api.generateMessage(id);
      setMessages(prev => ({ ...prev, [id]: d.message }));
      if (d.should_send) {
        await api.logMessage({ client_id: id, content: d.message });
      }
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>

      <form onSubmit={add} className="bg-white rounded-xl shadow-sm border p-4 flex gap-3 flex-wrap">
        <input
          className="border rounded-lg px-3 py-2 flex-1 min-w-40 text-sm"
          placeholder="Nombre"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <input
          className="border rounded-lg px-3 py-2 flex-1 min-w-40 text-sm"
          placeholder="+56912345678"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-indigo-700">
          <UserPlus size={16} /> Agregar
        </button>
      </form>

      <div className="space-y-2">
        {clients.map((c: any) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-800">{c.name}</p>
                <p className="text-sm text-gray-500">{c.phone} · {c.purchase_count} compras · ${(c.total_spent || 0).toLocaleString("es-CL")}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => generateMsg(c.id)}
                  disabled={generating === c.id}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
                  title="Generar mensaje IA"
                >
                  {generating === c.id ? "..." : <MessageSquare size={18} />}
                </button>
                <button onClick={() => toggleExpand(c.id)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
                  {expanded === c.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <button onClick={() => remove(c.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {messages[c.id] && (
              <div className="mx-4 mb-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800 whitespace-pre-wrap">
                {messages[c.id]}
              </div>
            )}

            {expanded === c.id && (
              <div className="border-t bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">Historial de compras</p>
                {purchases.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin compras registradas</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs">
                        <th className="text-left pb-1">Producto</th>
                        <th className="text-right pb-1">Cant.</th>
                        <th className="text-right pb-1">Precio</th>
                        <th className="text-right pb-1">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((p: any) => (
                        <tr key={p.id} className="border-t">
                          <td className="py-1 text-gray-700">{p.product}</td>
                          <td className="text-right text-gray-600">{p.quantity}</td>
                          <td className="text-right text-gray-600">${p.price.toLocaleString("es-CL")}</td>
                          <td className="text-right text-gray-400">{p.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
