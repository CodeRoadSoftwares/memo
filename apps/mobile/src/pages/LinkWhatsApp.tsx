import { useState } from "react";
import api from "../api/axios";
import { Smartphone, QrCode, Trash2, RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function LinkWhatsApp() {
  const [iframeKey, setIframeKey] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleConnect = async () => {
    setError("");
    setSuccessMsg("");
    setConnecting(true);
    try {
      await api.get("/connect");
      setStarted(true);
      setIframeKey((k) => k + 1);
    } catch {
      setError("Failed to initiate connection. Try again.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setError("");
    setSuccessMsg("");
    setDisconnecting(true);
    try {
      await api.get("/disconnect");
      setStarted(false);
      setSuccessMsg("WhatsApp session deleted.");
    } catch {
      setError("Failed to disconnect. Try again.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-body relative pb-12">
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-200/60 z-40 px-6 py-6 shadow-sm shadow-slate-200/20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black font-title tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <Smartphone size={18} />
            </div>
            WhatsApp Stream
          </h1>
        </div>
      </header>

      {/* MAIN WRAP */}
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8 items-center">
        
        {/* CONTROL BOARD */}
        <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-8 shadow-md shadow-slate-200/50 text-center flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-600 mb-4">
            <Smartphone size={32} className="stroke-[2px]" />
          </div>
          
          <h2 className="text-xl font-black font-title text-slate-800 tracking-tight leading-tight">Connect Account Channel</h2>
          <p className="text-[13.5px] text-slate-500 font-semibold mt-2 max-w-sm leading-relaxed">
            Initialize the session to generate a secure pairing QR token. Scan it directly from **WhatsApp → Linked Devices**.
          </p>

          <div className="w-full flex flex-col gap-3.5 mt-8">
            <button
              onClick={handleConnect}
              disabled={connecting || disconnecting}
              className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-sm tracking-wider uppercase px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[54px] disabled:opacity-60"
            >
              {connecting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <QrCode size={18} /> Generate Pairing Code
                </>
              )}
            </button>

            <button
              onClick={handleDisconnect}
              disabled={connecting || disconnecting}
              className="w-full bg-rose-50 border border-rose-100/60 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-200/50 font-extrabold text-[13px] tracking-wider uppercase px-6 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60"
            >
              {disconnecting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Trash2 size={15} /> Delete Session Lease
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="w-full mt-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-inner">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="w-full mt-5 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-inner">
              <CheckCircle2 size={14} />
              {successMsg}
            </div>
          )}
        </div>

        {/* IFRAME SCAN WRAP */}
        {started && (
          <div className="w-full flex flex-col gap-5 animate-[slideUp_0.3s_ease-out]">
            <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px] flex flex-col justify-center">
              <iframe
                key={iframeKey}
                src={`${baseUrl}/link`}
                title="WhatsApp QR"
                className="w-full h-[380px] border-none block rounded-xl"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
            
            <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <RefreshCw size={16} className="text-slate-400 stroke-[3px]" />
                <p className="text-[13px] font-bold leading-tight">Tap refresh after scanning to confirm pairing status.</p>
              </div>
              <button
                onClick={() => setIframeKey((k) => k + 1)}
                className="bg-white border border-slate-200 text-slate-700 font-black text-xs tracking-wide uppercase px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                Refresh Board
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
