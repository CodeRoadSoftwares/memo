import { useState, useEffect } from "react";
import {
  getAllSkills,
  getMySkills,
  addSkill,
  removeSkill,
} from "../api/skills";
import type { Skill } from "../api/skills";
import { Cpu, Sparkles, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react";

const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  scheduling: { icon: "📅", color: "from-emerald-600 to-teal-600", label: "Scheduling Logic" },
  knowledge_management: { icon: "🧠", color: "from-indigo-600 to-blue-600", label: "Institutional Brain" },
  relationship_management: { icon: "🤝", color: "from-purple-600 to-violet-600", label: "CRM & Relationships" },
  operations: { icon: "⚡", color: "from-amber-600 to-orange-600", label: "Operations Assistant" },
  human_resources: { icon: "👥", color: "from-rose-600 to-pink-600", label: "HR Coordination" },
};

function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { icon: "🔌", color: "from-slate-600 to-slate-800", label: cat.replace(/_/g, " ") };
}

export default function Skills() {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [mySkillIds, setMySkillIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    try {
      const [all, mine] = await Promise.all([getAllSkills(), getMySkills()]);
      setAllSkills(all.data.skills);
      setMySkillIds(new Set(mine.data.skills.map((s) => s.id)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (skill: Skill) => {
    setToggling(skill.id);
    try {
      if (mySkillIds.has(skill.id)) {
        await removeSkill(skill.id);
        setMySkillIds((prev) => {
          const s = new Set(prev);
          s.delete(skill.id);
          return s;
        });
      } else {
        await addSkill(skill.id);
        setMySkillIds((prev) => new Set(prev).add(skill.id));
      }
    } catch {
      /* ignore */
    } finally {
      setToggling(null);
    }
  };

  const grouped = allSkills.reduce<Record<string, Skill[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  const activeCount = mySkillIds.size;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-body relative pb-12">
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-200/60 z-40 px-6 py-6 shadow-sm shadow-slate-200/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black font-title tracking-tight text-slate-900 flex items-center gap-2">
              <Cpu size={22} className="text-emerald-500 fill-emerald-100" />
              AI Cognitive Skills
            </h1>
            <p className="text-[13px] text-slate-500 font-semibold mt-1 leading-relaxed">
              {activeCount > 0
                ? `${activeCount} active module${activeCount > 1 ? "s" : ""} calibrating your internal employee brain.`
                : "Enable intelligent logic capabilities to train your customized operational agent."}
            </p>
          </div>
          
          {activeCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider shadow-sm shadow-emerald-50 self-start sm:self-center">
              <CheckCircle2 size={13} className="stroke-[3px]" />
              {activeCount} Active
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">
        
        {loading ? (
          <div className="py-32 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="animate-spin text-emerald-500" />
            <p className="text-sm font-black tracking-tight text-slate-500">Compiling prompt schemas...</p>
          </div>
        ) : allSkills.length === 0 ? (
          <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center gap-3 shadow-sm max-w-2xl mx-auto w-full mt-8">
            <Sparkles size={40} className="opacity-30 text-emerald-500" />
            <p className="font-black text-slate-600 text-lg tracking-tight mt-2">No Skill Blueprints Available</p>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">
              Your account configuration contains no compatible executive modules at this time. Contact support to provision schemas.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, skills]) => {
            const meta = categoryMeta(category);
            const activeInCat = skills.filter((s) => mySkillIds.has(s.id)).length;
            
            return (
              <div key={category} className="space-y-4">
                
                {/* CATEGORY SUBHEAD */}
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3.5 ml-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{meta.icon}</span>
                    <span className={`font-black text-xs tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md uppercase">
                    {activeInCat} / {skills.length} Engaged
                  </span>
                </div>

                {/* SKILLS MATRIX GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {skills.map((skill) => {
                    const active = mySkillIds.has(skill.id);
                    const busy = toggling === skill.id;
                    const isExpanded = expanded === skill.id;

                    return (
                      <div
                        key={skill.id}
                        className={`group rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden p-6 ${
                          active
                            ? "bg-emerald-50/40 border-emerald-200 shadow-md shadow-emerald-100/50 hover:shadow-lg hover:border-emerald-300/70"
                            : "bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div>
                          {/* TOP META ROW */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-black font-title text-[17px] text-slate-900 tracking-tight leading-tight">
                                  {skill.name}
                                </h3>
                                <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider uppercase">
                                  v{skill.version}
                                </span>
                              </div>
                              <p className="text-[13px] text-slate-500 font-medium leading-relaxed mt-1.5">
                                {skill.shortDescription}
                              </p>
                            </div>

                            {/* TOGGLE */}
                            <button
                              onClick={() => toggle(skill)}
                              disabled={busy}
                              className="flex-shrink-0 relative focus:outline-none select-none active:scale-[0.97] transition-transform mt-1 disabled:opacity-60"
                            >
                              {busy ? (
                                <div className="w-12 h-6.5 flex items-center justify-center">
                                  <Loader2 size={16} className="animate-spin text-emerald-600" />
                                </div>
                              ) : (
                                <div className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 flex items-center shadow-inner ${
                                  active ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-200/50" : "bg-slate-200 shadow-slate-300/50"
                                }`}>
                                  <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                                    active ? "translate-x-5.5" : "translate-x-0"
                                  }`} />
                                </div>
                              )}
                            </button>
                          </div>

                          {/* TAG PILLS */}
                          {skill.capabilities?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-5">
                              {skill.capabilities.map((cap) => (
                                <span 
                                  key={cap.key} 
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-sm ${
                                    active
                                      ? "bg-white/80 border-emerald-200/60 text-emerald-700"
                                      : "bg-slate-50 border-slate-200/60 text-slate-500"
                                  }`}
                                >
                                  {cap.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ACCORDION CONTROLLER */}
                        <div className="mt-5 pt-4 border-t border-slate-200/60 flex flex-col">
                          <button
                            onClick={() => setExpanded(isExpanded ? null : skill.id)}
                            className={`text-xs font-black tracking-wide uppercase inline-flex items-center gap-1 self-start hover:underline ${
                              active ? "text-emerald-700" : "text-slate-500"
                            }`}
                          >
                            {isExpanded ? (
                              <>Collapse Info <ChevronUp size={14} className="stroke-[3px]" /></>
                            ) : (
                              <>Technical Specifications <ChevronDown size={14} className="stroke-[3px]" /></>
                            )}
                          </button>

                          {/* EXPANDED PANEL */}
                          {isExpanded && (
                            <div className="mt-4 space-y-4 animate-[slideDown_0.2s_ease-out]">
                              {skill.description && (
                                <p className="text-xs text-slate-500 font-medium leading-relaxed border-l-2 border-emerald-400/60 pl-3.5 italic py-0.5">
                                  {skill.description}
                                </p>
                              )}

                              {skill.examplePrompts?.length > 0 && (
                                <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/50 shadow-inner">
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Sample Commands</div>
                                  {skill.examplePrompts.map((prompt, i) => (
                                    <div 
                                      key={i} 
                                      className="bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 shadow-sm italic"
                                    >
                                      <span className="text-emerald-500 font-extrabold not-italic mr-0.5">“</span>
                                      {prompt}
                                      <span className="text-emerald-500 font-extrabold not-italic ml-0.5">”</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .w-6\\.5 { width: 1.625rem; }
        .h-6\\.5 { height: 1.625rem; }
        .w-4\\.5 { width: 1.125rem; }
        .h-4\\.5 { height: 1.125rem; }
        .translate-x-5\\.5 { --tw-translate-x: 1.375rem; transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y)); }
      `}</style>
    </div>
  );
}
