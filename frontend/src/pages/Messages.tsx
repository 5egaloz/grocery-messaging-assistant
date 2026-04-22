import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { api } from "../api/client";

export default function Messages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [generating, setGenerating] = useState<number | null>(null);
  const [previews, setPreviews] = useState<Record<number, { message: string; should_send: boolean }>>({});

  useEffect(() => {
    api.getMessages().then((d: any) => setMessages(d));
    api.getClients().then((d: any) => setClients(d));
  }, []);

  const generate = async (clientId: number) => {
    setGenerating(clientId);
    try {
      const d: any = await api.generateMessage(clientId);
      setPreviews(p => ({ ...p, [clientId]: d }));
    } finally {
      setGenerating(null);
    }
  };

  const send = async (clientId: number) => {
    const preview = previews[clientId];
    if (!preview) return;
    await api.logMessage({ client_id: clientId, content: preview.message });
    setPreviews(p => { const n = { ...p }; delete n[clientId]; return n; });
    const d: any = await api.getMessages();
    setMessages(d);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mensajes</h1>

      {/* Generate messages per client */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Generar mensaje por cliente</h2>
        <div className="space-y-3">
          {clients.map((c: any) => (
            <div key={c.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.phone}</p>
                </div>
                <button
                  onClick={() => generate(c.id)}
                  disabled={generating === c.id}
                  className="text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                >
                  {generating === c.id ? "Generando..." : <><MessageSquare size={14} /> Generar</>}
                </button>
              </div>

              {previews[c.id] && (
                <div className={`rounded-lg p-3 text-sm ${previews[c.id].should_send ? "bg-indigo-50 border border-indigo-100" : "bg-gray-50 border"}`}>
                  <p className="text-gray-700 whitespace-pre-wrap">{previews[c.id].message}</p>
                  {previews[c.id].should_send && (
                    <button
                      onClick={() => send(c.id)}
                      className="mt-2 flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                    >
                      <Send size={12} /> Registrar como enviado
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Message history */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <h2 className="font-semibold text-gray-700 px-4 py-3 border-b">Historial de mensajes</h2>
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400 px-4 py-3">Sin mensajes enviados aún</p>
        ) : (
          <div className="divide-y">
            {messages.map((m: any) => (
              <div key={m.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{m.client_name}</span>
                  <span className="text-xs text-gray-400">{m.sent_at?.slice(0, 16)}</span>
                </div>
                <p className="text-sm text-gray-500">{m.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
