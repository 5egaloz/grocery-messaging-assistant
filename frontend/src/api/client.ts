const BASE = import.meta.env.VITE_API_URL || "https://grocery-messaging-assistant.onrender.com";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error en el servidor");
  }
  return res.json();
}

export const api = {
  // Clients
  getClients: () => req("/clients/"),
  createClient: (data: { name: string; phone: string }) =>
    req("/clients/", { method: "POST", body: JSON.stringify(data) }),
  deleteClient: (id: number) => req(`/clients/${id}`, { method: "DELETE" }),
  getClientPurchases: (id: number) => req(`/clients/${id}/purchases`),

  // Inventory
  getInventory: () => req("/inventory/"),
  addProduct: (data: object) =>
    req("/inventory/", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: object) =>
    req(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: number) => req(`/inventory/${id}`, { method: "DELETE" }),
  getLowStock: () => req("/inventory/alerts"),

  // Sales
  registerSale: (data: object) =>
    req("/sales/", { method: "POST", body: JSON.stringify(data) }),
  getTodaySales: () => req("/sales/today"),

  // Cash
  getCashStatus: () => req("/cash/status"),
  openCash: (data: { opening_amount: number; notes?: string }) =>
    req("/cash/open", { method: "POST", body: JSON.stringify(data) }),
  closeCash: (data: { closing_amount: number; notes?: string }) =>
    req("/cash/close", { method: "POST", body: JSON.stringify(data) }),
  getCashHistory: () => req("/cash/history"),
  getTodaySummary: () => req("/cash/today/summary"),

  // Messages
  getMessages: () => req("/messages/"),
  logMessage: (data: object) =>
    req("/messages/", { method: "POST", body: JSON.stringify(data) }),

  // Reports
  getWeeklyKpi: () => req("/reports/kpi/weekly"),
  getDailyKpi: () => req("/reports/kpi/daily"),
  getAgentLogs: () => req("/reports/agent-logs"),

  // Agent
  getInsights: () => req("/agent/insights"),
  getOffers: () => req("/agent/offers"),
  generateMessage: (client_id: number) =>
    req("/agent/message", { method: "POST", body: JSON.stringify({ client_id }) }),
  getWeeklyReport: () => req("/agent/weekly-kpi"),
  analyzeCash: (data: object) =>
    req("/agent/cash-analysis", { method: "POST", body: JSON.stringify(data) }),
};
