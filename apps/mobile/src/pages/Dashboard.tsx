import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { 
  MessageSquare, 
  Smartphone, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Clock,
  ArrowUpRight,
  User
} from "lucide-react";

interface StatsData {
  telegramLinked: boolean;
  telegramUser: string | null;
  skillsCount: number;
  phonesCount: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<StatsData>({
    telegramLinked: false,
    telegramUser: null,
    skillsCount: 0,
    phonesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        const [tgRes, skillsRes, phonesRes] = await Promise.all([
          api.get("/telegram/info").catch(() => ({ data: null })),
          api.get("/user-skills").catch(() => ({ data: [] })),
          api.get("/phone-numbers").catch(() => ({ data: [] }))
        ]);

        if (isMounted) {
          setStats({
            telegramLinked: !!tgRes?.data?.telegramChatId,
            telegramUser: tgRes?.data?.telegramUsername || null,
            skillsCount: Array.isArray(skillsRes?.data) ? skillsRes.data.length : 0,
            phonesCount: Array.isArray(phonesRes?.data) ? phonesRes.data.length : 0
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard overview stats:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStats();
    return () => { isMounted = false; };
  }, []);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good morning";
    if (hrs < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] relative overflow-hidden selection:bg-emerald-500/20 font-body pb-12">
      
      {/* LIQUID LIGHT ACCENTS */}
      <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,_#d1fae5_0%,_transparent_70%)] rounded-full blur-[80px] pointer-events-none z-0 opacity-60" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,_#ccfbf1_0%,_transparent_70%)] rounded-full blur-[80px] pointer-events-none z-0 opacity-40" />
      
      {/* SOFT DOTTED GRID */}
      <div className="absolute inset-0 bg-[radial-gradient(#0f172a05_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none z-0 opacity-80" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 md:py-12">
        
        {/* HEADER ROW */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 animate-[fadeIn_0.4s_ease-out]">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-extrabold uppercase tracking-wider mb-4 shadow-sm shadow-emerald-50">
              <Zap size={12} className="fill-emerald-600 animate-pulse" />
              Cognitive Engine Live
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight font-title text-slate-900 leading-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600">{user?.name || "Explorer"}</span>.
            </h1>
            <p className="mt-2.5 text-slate-500 text-base font-medium">
              Your neural memory buffer is active and processing incoming message streams.
            </p>
          </div>

          <button 
            onClick={() => navigate("/chat")}
            className="group relative px-6 py-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl font-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] transform transition-all active:scale-95 flex items-center gap-2 justify-center whitespace-nowrap"
          >
            <MessageSquare size={18} className="fill-current opacity-80" />
            Interactive Chat
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform font-bold" />
          </button>
        </header>

        {/* STATUS BOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-[fadeIn_0.5s_ease-out]">
          
          {/* WHATSAPP */}
          <div 
            onClick={() => navigate("/link")}
            className="group p-6 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-md hover:border-emerald-300/60 hover:bg-white cursor-pointer shadow-sm shadow-slate-200/40 hover:shadow-xl hover:shadow-emerald-100/20 transition-all flex items-start justify-between relative overflow-hidden hover:-translate-y-1"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600 shadow-inner shadow-emerald-100">
                <Smartphone size={22} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 font-title text-[17px] tracking-tight">WhatsApp Stream</h3>
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-emerald-600 text-[13px] font-extrabold">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Node
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all mt-1.5" />
          </div>

          {/* TELEGRAM */}
          <div 
            onClick={() => navigate("/link-telegram")}
            className="group p-6 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-md hover:border-cyan-300/60 hover:bg-white cursor-pointer shadow-sm shadow-slate-200/40 hover:shadow-xl hover:shadow-cyan-100/20 transition-all flex items-start justify-between relative overflow-hidden hover:-translate-y-1"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center border border-cyan-100 text-cyan-600 shadow-inner shadow-cyan-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </div>
              <div>
                <h3 className="font-black text-slate-800 font-title text-[17px] tracking-tight">Telegram Link</h3>
                {loading ? (
                  <div className="h-4 w-16 bg-slate-100 animate-pulse rounded mt-2" />
                ) : stats.telegramLinked ? (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-cyan-600 text-[13px] font-extrabold">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    @{stats.telegramUser || "Linked"}
                  </div>
                ) : (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-amber-600 text-[13px] font-extrabold">
                    <AlertCircle size={14} /> Setup Required
                  </div>
                )}
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all mt-1.5" />
          </div>

          {/* COGNITIVE CORE */}
          <div 
            onClick={() => navigate("/skills")}
            className="group p-6 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-md hover:border-indigo-300/60 hover:bg-white cursor-pointer shadow-sm shadow-slate-200/40 hover:shadow-xl hover:shadow-indigo-100/20 transition-all flex items-start justify-between relative overflow-hidden hover:-translate-y-1"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600 shadow-inner shadow-indigo-100">
                <Cpu size={22} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 font-title text-[17px] tracking-tight">Cognitive Modules</h3>
                {loading ? (
                  <div className="h-4 w-12 bg-slate-100 animate-pulse rounded mt-2" />
                ) : (
                  <p className="text-slate-500 text-[13px] font-semibold mt-1.5">
                    {stats.skillsCount} active AI agents
                  </p>
                )}
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all mt-1.5" />
          </div>

        </div>

        {/* MAIN BOARD SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-[fadeIn_0.6s_ease-out]">
          
          {/* MAIN CONTROL BOARD */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* METRICS CARD */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-md shadow-slate-200/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
              
              <h2 className="text-2xl font-black font-title text-slate-900 mb-4 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 shadow-sm">
                  <Zap size={18} className="fill-current" />
                </div>
                System Engine Operations
              </h2>
              
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                Memo unifies your business and personal channels, leveraging localized institutional memory to process complex incoming requests. Run direct scheduled broadcasts or analyze backend spreadsheets natively.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm">
                  <div className="text-[10px] text-slate-400 font-black font-title uppercase tracking-widest">AI Latency</div>
                  <div className="text-2xl font-black text-slate-800 mt-1 font-mono">&lt; 1.4s</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm">
                  <div className="text-[10px] text-slate-400 font-black font-title uppercase tracking-widest">Engine Node</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">99.9%</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm col-span-2 md:col-span-1">
                  <div className="text-[10px] text-slate-400 font-black font-title uppercase tracking-widest">Flow Type</div>
                  <div className="text-2xl font-black text-teal-600 mt-1 font-mono">Unified</div>
                </div>
              </div>
            </div>

            {/* ACTION GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={() => navigate("/phones")}
                className="p-6 rounded-2xl bg-white/70 hover:bg-white border border-slate-200 hover:border-emerald-300/50 cursor-pointer transition-all shadow-sm shadow-slate-200/40 hover:shadow-lg hover:shadow-emerald-100/20 group"
              >
                <h4 className="font-black text-slate-800 flex items-center gap-2.5 mb-2.5 font-title text-[16px]">
                  <Smartphone size={18} className="text-emerald-500 fill-emerald-100" /> 
                  Parallel Context Nodes
                </h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">
                  Configure tertiary numbers to inject alternative contextual pipelines into the primary vector memory buffer.
                </p>
                <span className="text-xs font-extrabold text-emerald-600 group-hover:text-emerald-700 inline-flex items-center gap-1 hover:underline">
                  Manage Phone Lines <ChevronRight size={12} />
                </span>
              </div>

              <div 
                onClick={() => navigate("/skills")}
                className="p-6 rounded-2xl bg-white/70 hover:bg-white border border-slate-200 hover:border-indigo-300/50 cursor-pointer transition-all shadow-sm shadow-slate-200/40 hover:shadow-lg hover:shadow-indigo-100/20 group"
              >
                <h4 className="font-black text-slate-800 flex items-center gap-2.5 mb-2.5 font-title text-[16px]">
                  <Cpu size={18} className="text-indigo-500 fill-indigo-100" /> 
                  Behavior Prompt Tuning
                </h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">
                  Customize active operational directives, agent logic permissions, and dynamic cognitive tool bindings.
                </p>
                <span className="text-xs font-extrabold text-indigo-600 group-hover:text-indigo-700 inline-flex items-center gap-1 hover:underline">
                  Calibrate Brain <ChevronRight size={12} />
                </span>
              </div>
            </div>

          </div>

          {/* TIMELINE BOARD */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md shadow-slate-200/50 flex flex-col h-[480px]">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <h3 className="font-black font-title text-slate-900 text-lg flex items-center gap-2">
                <Clock size={18} className="text-emerald-500" /> Live Activity Stream
              </h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black tracking-wider uppercase border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-light space-y-5">
              <div className="flex gap-3.5 animate-[fadeIn_0.3s_ease-out]">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm shadow-emerald-50">
                  <Zap size={15} className="fill-current opacity-80" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-slate-800 leading-tight">System Ready</div>
                  <div className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">Initial handshake verified with vector endpoint.</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1.5 tracking-wide uppercase">Just now</div>
                </div>
              </div>

              <div className="flex gap-3.5 animate-[fadeIn_0.5s_ease-out]">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm shadow-emerald-50">
                  <Smartphone size={15} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-slate-800 leading-tight">WhatsApp Client Up</div>
                  <div className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">Listening loop engaged for inbound customer streams.</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1.5 tracking-wide uppercase">12 mins ago</div>
                </div>
              </div>

              {stats.telegramLinked && (
                <div className="flex gap-3.5 animate-[fadeIn_0.7s_ease-out]">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 flex-shrink-0 shadow-sm shadow-cyan-50">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-extrabold text-slate-800 leading-tight">Telegram Active</div>
                    <div className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">Bot routing established and syncing username.</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1.5 tracking-wide uppercase">Active Node</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3.5 opacity-60">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0 shadow-inner shadow-slate-100">
                  <User size={15} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-slate-700 leading-tight">Session Renewed</div>
                  <div className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">Primary authentication lease safely extended.</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1.5 tracking-wide uppercase">Earlier today</div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <button 
                onClick={() => navigate("/chat")}
                className="w-full py-3 text-center rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-xs font-black text-slate-600 hover:text-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare size={12} />
                Launch Internal Chat Simulator
              </button>
            </div>
          </div>

        </div>

      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-light::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-light::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-light::-webkit-scrollbar-thumb {
          background: rgba(203, 213, 225, 0.6);
          border-radius: 10px;
        }
        .scrollbar-light::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.8);
        }
      `}</style>
    </div>
  );
}
