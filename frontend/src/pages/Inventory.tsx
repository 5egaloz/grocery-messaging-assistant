import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Tag } from "lucide-react";
import { api } from "../api/client";

const emptyForm = { product: "", price: 0, stock: 0, unit: "unidad", on_sale: false, sale_price: undefined as number | undefined };

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.getInventory().then((d: any) => setItems(d));
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await api.updateProduct(editing, form);
    } else {
      await api.addProduct(form);
    }
    setForm({ ...emptyForm });
    setEditing(null);
    setShowForm(false);
    load();
  };

  const startEdit = (item: any) => {
    setForm({ product: item.product, price: item.price, stock: item.stock, unit: item.unit, on_sale: !!item.on_sale, sale_price: item.sale_price });
    setEditing(item.id);
    setShowForm(true);
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar producto?")) return;
    await api.deleteProduct(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ ...emptyForm }); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-indigo-700"
        >
          <Plus size={16} /> Agregar producto
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="bg-white rounded-xl shadow-sm border p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm col-span-2 md:col-span-1" placeholder="Producto" value={form.product}
            onChange={e => setForm(f => ({ ...f, product: e.target.value }))} required />
          <input className="border rounded-lg px-3 py-2 text-sm" type="number" placeholder="Precio" value={form.price}
            onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} required />
          <input className="border rounded-lg px-3 py-2 text-sm" type="number" placeholder="Stock" value={form.stock}
            onChange={e => setForm(f => ({ ...f, stock: +e.target.value }))} required />
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.unit}
            onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
            {["unidad", "kg", "lt", "paquete", "caja"].map(u => <option key={u}>{u}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.on_sale} onChange={e => setForm(f => ({ ...f, on_sale: e.target.checked }))} />
            En oferta
          </label>
          {form.on_sale && (
            <input className="border rounded-lg px-3 py-2 text-sm" type="number" placeholder="Precio oferta"
              value={form.sale_price || ""} onChange={e => setForm(f => ({ ...f, sale_price: +e.target.value }))} />
          )}
          <div className="col-span-2 md:col-span-3 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
              {editing ? "Guardar cambios" : "Agregar"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">Producto</th>
              <th className="text-right px-4 py-3">Precio</th>
              <th className="text-right px-4 py-3">Stock</th>
              <th className="text-center px-4 py-3">Oferta</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item: any) => (
              <tr key={item.id} className={item.stock <= 5 ? "bg-amber-50" : ""}>
                <td className="px-4 py-3 font-medium text-gray-800">{item.product}</td>
                <td className="px-4 py-3 text-right text-gray-600">${item.price.toLocaleString("es-CL")}</td>
                <td className={`px-4 py-3 text-right font-medium ${item.stock <= 5 ? "text-amber-600" : "text-gray-700"}`}>
                  {item.stock} {item.unit}
                </td>
                <td className="px-4 py-3 text-center">
                  {item.on_sale ? (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      <Tag size={10} /> ${item.sale_price?.toLocaleString("es-CL")}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded mr-1">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => remove(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
