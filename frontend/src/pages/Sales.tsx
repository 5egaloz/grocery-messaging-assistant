import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { api } from "../api/client";

interface SaleItem { product: string; quantity: number; unit_price: number; }

export default function Sales() {
  const [clients, setClients] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [todaySales, setTodaySales] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [items, setItems] = useState<SaleItem[]>([{ product: "", quantity: 1, unit_price: 0 }]);
  const [success, setSuccess] = useState<string>("");

  const load = async () => {
    const [c, inv, s] = await Promise.all([
      api.getClients() as any,
      api.getInventory() as any,
      api.getTodaySales() as any,
    ]);
    setClients(c);
    setInventory(inv);
    setTodaySales(s);
  };

  useEffect(() => { load(); }, []);

  const addItem = () => setItems(i => [...i, { product: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (idx: number) => setItems(i => i.filter((_, j) => j !== idx));

  const updateItem = (idx: number, field: keyof SaleItem, value: string | number) => {
    setItems(items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === "product") {
        const inv = inventory.find((p: any) => p.product === value);
        if (inv) updated.unit_price = inv.on_sale && inv.sale_price ? inv.sale_price : inv.price;
      }
      return updated;
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.product && i.quantity > 0 && i.unit_price > 0);
    if (!validItems.length) return;
    const data: any = { items: validItems };
    if (clientId) data.client_id = +clientId;
    await api.registerSale(data);
    setItems([{ product: "", quantity: 1, unit_price: 0 }]);
    setClientId("");
    setSuccess("Venta registrada ✓");
    setTimeout(() => setSuccess(""), 3000);
    load();
  };

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Registrar venta</h1>

      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
        <select className="border rounded-lg px-3 py-2 text-sm w-full md:w-64"
          value={clientId} onChange={e => setClientId(e.target.value)}>
          <option value="">Sin cliente / anónimo</option>
          {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 flex-wrap">
              <select
                className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-40"
                value={item.product}
                onChange={e => updateItem(idx, "product", e.target.value)}
                required
              >
                <option value="">Seleccionar producto</option>
                {inventory.map((p: any) => (
                  <option key={p.id} value={p.product}>
                    {p.product} — ${(p.on_sale && p.sale_price ? p.sale_price : p.price).toLocaleString("es-CL")}
                  </option>
                ))}
              </select>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-20"
                type="number" min="0.1" step="0.1"
                value={item.quantity}
                onChange={e => updateItem(idx, "quantity", +e.target.value)}
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm w-28"
                type="number" placeholder="Precio unit."
                value={item.unit_price || ""}
                onChange={e => updateItem(idx, "unit_price", +e.target.value)}
              />
              <span className="flex items-center text-sm text-gray-500 w-24">
                ${(item.quantity * item.unit_price).toLocaleString("es-CL")}
              </span>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={addItem} className="text-indigo-600 text-sm flex items-center gap-1 hover:underline">
            <Plus size={15} /> Agregar ítem
          </button>
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg text-gray-800">Total: ${total.toLocaleString("es-CL")}</span>
            <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-indigo-700">
              <ShoppingCart size={16} /> Registrar
            </button>
          </div>
        </div>
        {success && <p className="text-green-600 text-sm font-medium">{success}</p>}
      </form>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <h2 className="font-semibold text-gray-700 px-4 py-3 border-b">Ventas de hoy</h2>
        {todaySales.length === 0 ? (
          <p className="text-sm text-gray-400 px-4 py-3">Sin ventas aún</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-left px-4 py-2">Productos</th>
                <th className="text-right px-4 py-2">Total</th>
                <th className="text-right px-4 py-2">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {todaySales.map((s: any) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 text-gray-700">{s.client_name || "Anónimo"}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{s.items}</td>
                  <td className="px-4 py-2 text-right font-medium">${s.total.toLocaleString("es-CL")}</td>
                  <td className="px-4 py-2 text-right text-gray-400">{s.date?.slice(11, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
