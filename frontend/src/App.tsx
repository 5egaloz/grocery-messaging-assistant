import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Package, DollarSign, MessageSquare, BarChart2, ShoppingCart } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Inventory from "./pages/Inventory";
import Cash from "./pages/Cash";
import Sales from "./pages/Sales";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";

const nav = [
  { to: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/sales", icon: <ShoppingCart size={18} />, label: "Ventas" },
  { to: "/clients", icon: <Users size={18} />, label: "Clientes" },
  { to: "/inventory", icon: <Package size={18} />, label: "Inventario" },
  { to: "/cash", icon: <DollarSign size={18} />, label: "Caja" },
  { to: "/messages", icon: <MessageSquare size={18} />, label: "Mensajes" },
  { to: "/reports", icon: <BarChart2 size={18} />, label: "Reportes" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r flex flex-col">
          <div className="px-5 py-5 border-b">
            <h1 className="font-bold text-gray-800 text-lg leading-tight">🛒 Mi Almacén</h1>
            <p className="text-xs text-gray-400">Sistema de gestión</p>
          </div>
          <nav className="flex-1 py-4 space-y-1 px-2">
            {nav.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`
                }
              >
                {icon} {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/cash" element={<Cash />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
