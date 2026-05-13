import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Smartphone, 
  Users, 
  Cpu, 
  ChevronRight, 
  LogOut, 
  Bot, 
  MessageSquare 
} from "lucide-react";

const quickLinks = [
  {
    label: "WhatsApp Integration",
    desc: "Sync primary channel live",
    to: "/link",
    icon: <Smartphone size={20} />,
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    label: "Phone Registry",
    desc: "Regulate active client context",
    to: "/phones",
    icon: <Users size={20} />,
    color: "text-indigo-600 bg-indigo-50 border-indigo-100",
  },
  {
    label: "Cognitive Skills",
    desc: "Toggle prompt operational directives",
    to: "/skills",
    icon: <Cpu size={20} />,
    color: "text-amber-600 bg-amber-50 border-amber-100",
  },
];

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-body relative flex flex-col pb-12">
      
      {/* GLASS HEADER */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-200/60 z-40 px-6 py-5 shadow-sm shadow-slate-200/20 flex items-center justify-between w-full">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-100">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-black text-slate-800 leading-tight tracking-tight">{user?.name}</div>
            <div className="text-[11px] text-slate-400 font-bold mt-0.5 tracking-wider uppercase">Virtual Simulator</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="md:hidden w-9 h-9 rounded-xl bg-rose-50 border border-rose-100/60 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white hover:shadow-lg transition-all active:scale-90"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </header>

      {/* MAIN CONTENT BODY */}
      <div className="max-w-4xl w-full mx-auto px-6 py-10 flex-1 flex flex-col gap-8">
        
        {/* HERO WELCOME */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center flex flex-col items-center shadow-md shadow-slate-200/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-600 mb-4">
            <Bot size={32} className="stroke-[2px]" />
          </div>

          <h2 className="text-xl font-black font-title text-slate-800 tracking-tight leading-tight">Virtual AI Employee Ready</h2>
          <p className="text-[13.5px] text-slate-500 font-semibold mt-2.5 max-w-sm leading-relaxed">
            Calibration suite finalized. Execute individual channel triggers to begin automation sequence routines.
          </p>
        </div>

        {/* QUICK ACTIONS MATRIX */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-row md:flex-col items-start md:items-start gap-4 group"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.color} flex-shrink-0 shadow-sm`}>
                {item.icon}
              </div>
              <div className="min-w-0 flex-1 flex flex-col md:mt-1">
                <span className="text-[14px] font-black text-slate-800 leading-tight flex items-center justify-between group-hover:text-emerald-600 transition-colors">
                  {item.label}
                  <ChevronRight size={14} className="md:hidden text-slate-400 stroke-[3px]" />
                </span>
                <span className="text-[12px] text-slate-400 font-semibold mt-1 leading-snug md:block hidden">
                  {item.desc}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* SIMULATOR PANEL CARD */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex items-center gap-4 shadow-sm shadow-slate-200/40 relative group hover:border-emerald-200 transition-colors">
          <div className="relative flex items-center justify-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <div className="absolute w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75" />
          </div>
          
          <div className="min-w-0 flex-1">
            <h4 className="text-[14px] font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              <MessageSquare size={14} className="text-slate-400" /> Live Console Simulator
            </h4>
            <p className="text-[12px] text-slate-400 font-semibold mt-0.5">
              Message payloads captured across parallel endpoints will populate this buffer dynamically.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
