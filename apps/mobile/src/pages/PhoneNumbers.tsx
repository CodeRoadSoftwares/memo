import { useState, useEffect } from "react";
import {
  getPhoneNumbers,
  addPhoneNumbers,
  deletePhoneNumber,
} from "../api/phoneNumbers";
import type { PhoneNumber } from "../api/phoneNumbers";
import { Smartphone, Trash2, Plus, Loader2 } from "lucide-react";

export default function PhoneNumbers() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const { data } = await getPhoneNumbers();
      setNumbers(data.phoneNumbers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdding(true);
    try {
      await addPhoneNumbers([
        { phone: phone.trim(), label: label.trim() || undefined },
      ]);
      setPhone("");
      setLabel("");
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to add number");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePhoneNumber(id);
      setNumbers((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-body relative">
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-200/60 z-40 px-6 py-6 shadow-sm shadow-slate-200/20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black font-title tracking-tight text-slate-900 flex items-center gap-2">
            <Smartphone size={22} className="text-emerald-500" />
            Phone Context Nodes
          </h1>
          <div className="text-xs font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-full tracking-wide uppercase">
            {numbers.length} Connected
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
        
        {/* EXPLANATORY BANNER */}
        <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-5 shadow-sm shadow-emerald-50 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700 shadow-sm">
            <Smartphone size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-emerald-800 leading-tight">Configure Secondary Lines</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1 leading-relaxed">
              Inject alternate conversational contexts into Gemini's central neural workspace by authorizing parallel phone number endpoints.
            </p>
          </div>
        </div>

        {/* ADD FORM */}
        <form onSubmit={handleAdd} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-md shadow-slate-200/50 space-y-4 flex flex-col md:flex-row md:items-end gap-4 md:space-y-0">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4.5 py-3.5 text-[15px] font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
              required
            />
          </div>
          
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Label (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Sales Operations"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4.5 py-3.5 text-[15px] font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>

          <div className="md:flex-shrink-0 md:mb-0.5">
            <button 
              type="submit" 
              disabled={adding}
              className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-sm tracking-wide px-7 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[50px] disabled:opacity-60 disabled:pointer-events-none"
            >
              {adding ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Plus size={16} className="stroke-[3px]" /> Add Node
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm shadow-rose-50">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* LIST AREA */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Active Pipeline Registrations</h3>
          
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-emerald-500" />
              <p className="text-sm font-bold mt-2">Hydrating memory tables...</p>
            </div>
          ) : numbers.length === 0 ? (
            <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center gap-3 shadow-sm">
              <Smartphone size={40} className="opacity-30" />
              <p className="font-black text-slate-500 text-base mt-2 tracking-tight">No secondary nodes registered</p>
              <p className="text-xs text-slate-400 font-semibold max-w-xs leading-relaxed">Primary system node is active, but alternate channels have not been bound to the account yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {numbers.map((n) => (
                <div 
                  key={n.id} 
                  className="bg-white rounded-2xl border border-slate-200/80 px-6 py-5 shadow-sm shadow-slate-200/40 flex items-center justify-between hover:shadow-md hover:border-slate-300/60 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <span className="block font-black text-slate-800 text-[16px] leading-snug tracking-tight">{n.phone}</span>
                      {n.label && (
                        <span className="inline-block bg-slate-100 text-slate-500 text-[11px] font-black px-2 py-0.5 rounded-md tracking-wide uppercase mt-1">
                          {n.label}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="w-9 h-9 bg-rose-50 border border-rose-100/50 rounded-xl text-rose-500 flex items-center justify-center transition-all duration-200 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-200 active:scale-95"
                    title="Delete Pipeline Node"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
