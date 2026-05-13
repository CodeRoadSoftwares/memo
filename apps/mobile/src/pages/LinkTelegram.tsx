import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ExternalLink, 
  Trash2, 
  Loader2, 
  RefreshCw,
  Key
} from "lucide-react";

interface TelegramInfo {
  botUsername: string | null;
  telegramChatId: string | null;
  telegramUsername: string | null;
}

export default function LinkTelegram() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);
  const [info, setInfo] = useState<TelegramInfo>({
    botUsername: null,
    telegramChatId: null,
    telegramUsername: null,
  });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const apiKey = user?.apiKey || "API_KEY_UNAVAILABLE";

  const fetchTelegramInfo = async () => {
    try {
      const { data } = await api.get<TelegramInfo>("/telegram/info");
      setInfo(data);
    } catch {
      setError("Failed to load Telegram integration info.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError("");
    await fetchTelegramInfo();
  };

  useEffect(() => {
    let isMounted = true;
    const getInitialData = async () => {
      try {
        const { data } = await api.get<TelegramInfo>("/telegram/info");
        if (isMounted) {
          setInfo(data);
        }
      } catch {
        if (isMounted) {
          setError("Failed to load Telegram integration info.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    getInitialData();
    return () => { isMounted = false; };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnlink = async () => {
    setError("");
    setSuccessMsg("");
    setUnlinking(true);
    try {
      await api.post("/telegram/unlink");
      setInfo((prev) => ({
        ...prev,
        telegramChatId: null,
        telegramUsername: null,
      }));
      setSuccessMsg("Successfully unlinked Telegram account.");
    } catch {
      setError("Failed to unlink account. Try again.");
    } finally {
      setUnlinking(false);
    }
  };

  const botUrl = info.botUsername
    ? `https://t.me/${info.botUsername}`
    : "https://t.me";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-body relative pb-12">
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-200/60 z-40 px-6 py-6 shadow-sm shadow-slate-200/20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black font-title tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-sm">
              <Send size={17} className="translate-x-[-1px]" />
            </div>
            Telegram Link
          </h1>
        </div>
      </header>

      {/* MAIN CONTENT WRAP */}
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
        
        {/* MAIN CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md shadow-slate-200/40 text-center flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 shadow-sm flex items-center justify-center text-cyan-600 mb-4">
            <Send size={30} className="translate-x-[-1.5px]" />
          </div>

          <h2 className="text-xl font-black font-title text-slate-800 tracking-tight">Connect Telegram Bot</h2>
          <p className="text-[13.5px] text-slate-500 font-semibold mt-2 max-w-sm leading-relaxed">
            Deploy voice directives, manage calendar items, and push direct prompt commands via our secure Telegram broker.
          </p>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-cyan-600">
              <Loader2 size={30} className="animate-spin" />
            </div>
          ) : (
            <div className="w-full mt-8 space-y-6">
              
              {/* Connection Status Area */}
              {info.telegramChatId ? (
                <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-4 flex items-center gap-4 text-left shadow-inner shadow-emerald-50/40 animate-[fadeIn_0.3s_ease-out]">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="stroke-[3px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-[14px] text-emerald-800 leading-tight">Successfully Registered</div>
                    {info.telegramUsername && (
                      <div className="text-xs text-emerald-600 font-bold truncate mt-0.5">@{info.telegramUsername}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/50 border border-amber-100/80 rounded-2xl p-4 flex items-center gap-4 text-left shadow-inner shadow-amber-50/40 animate-[fadeIn_0.3s_ease-out]">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="stroke-[3px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-[14px] text-amber-800 leading-tight">Integration Required</div>
                    <div className="text-xs text-amber-600 font-bold mt-0.5">Follow linkage steps below to initiate node handshake.</div>
                  </div>
                </div>
              )}

              {/* API Access Control Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Key size={14} className="text-slate-400 stroke-[3px]" />
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Account API Credentials</h4>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={apiKey}
                    className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none shadow-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className={`flex-shrink-0 text-xs font-black px-4 py-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                      copied 
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {copied ? <CheckCircle2 size={13} className="stroke-[3px]" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Primary Interaction Buttons */}
              <div className="flex flex-col gap-3 w-full pt-2">
                <a
                  href={botUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full no-underline"
                >
                  <button className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-sm tracking-wider uppercase px-6 py-4 rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[54px]">
                    Open Telegram Desktop <ExternalLink size={16} />
                  </button>
                </a>

                {info.telegramChatId && (
                  <button
                    onClick={handleUnlink}
                    disabled={unlinking}
                    className="w-full bg-rose-50 border border-rose-100/60 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-200/50 font-extrabold text-[13px] tracking-wider uppercase px-6 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60"
                  >
                    {unlinking ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={15} /> Decommission Node
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          )}

          {error && (
            <div className="w-full mt-6 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-inner">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {successMsg && (
            <div className="w-full mt-6 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-inner">
              <CheckCircle2 size={14} /> {successMsg}
            </div>
          )}
        </div>

        {/* Step Instructions Block */}
        {!info.telegramChatId && (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 text-left shadow-sm animate-[slideUp_0.3s_ease-out]">
            <h3 className="font-black font-title text-slate-800 text-[17px] tracking-tight mb-4 flex items-center gap-2">
              <div className="w-1.5 h-5 bg-cyan-500 rounded-full" /> How to Establish Integration
            </h3>
            <ol className="space-y-4 text-slate-600 text-sm font-semibold">
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-black flex items-center justify-center shadow-sm border border-cyan-200 mt-0.5">1</span>
                <p className="leading-relaxed">Copy your **API Key credentials** generated in the primary security card above.</p>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-black flex items-center justify-center shadow-sm border border-cyan-200 mt-0.5">2</span>
                <p className="leading-relaxed">
                  Launch the bot interface via <span className="text-cyan-600 font-black">Open Telegram Desktop</span>, or lookup{" "}
                  <span className="text-cyan-600 font-extrabold bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 rounded-md font-mono">{info.botUsername ? `@${info.botUsername}` : "@YourAssistant"}</span> in search.
                </p>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-black flex items-center justify-center shadow-sm border border-cyan-200 mt-0.5">3</span>
                <div className="space-y-2 flex-1 min-w-0">
                  <p className="leading-relaxed">Initiate a direct private messaging session and issue the binding directive:</p>
                  <code className="inline-block bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-mono font-extrabold select-all shadow-sm">
                    /link <span className="text-cyan-600 uppercase font-black">&lt;your_api_key&gt;</span>
                  </code>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-black flex items-center justify-center shadow-sm border border-cyan-200 mt-0.5">4</span>
                <div className="leading-relaxed">
                  Return to this console and click{" "}
                  <button
                    onClick={handleRefresh}
                    className="text-cyan-600 font-black inline-flex items-center gap-0.5 hover:underline"
                  >
                    Refresh Dashboard <RefreshCw size={12} className="stroke-[3px]" />
                  </button>
                  {" "}to sync connection vectors.
                </div>
              </li>
            </ol>
          </div>
        )}

      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
