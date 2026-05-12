import { useState } from "react";
import {
  Briefcase,
  BrainCircuit,
  Handshake,
  CalendarClock,
  UserRoundCheck,
  Megaphone,
  FileScan,
  Brain,
  Bot,
  Zap,
  MessageSquareQuote,
  Database,
  CheckCircle2,
  Menu,
  X,
  Play,
  Mic,
  User,
} from "lucide-react";

const repoUrl = "https://github.com/CodeRoadSoftwares/memo";

const activeSkills = [
  {
    icon: Briefcase,
    name: "Operations Assistant",
    desc: "AI-powered executive brain that continuously tracks business tasks, client commitments, and operational decisions.",
    tags: ["Task Logic", "Briefings", "Follow-ups"],
  },
  {
    icon: BrainCircuit,
    name: "Knowledge Manager",
    desc: "Builds persistent institutional memory buffers for storing long-term strategy, rules, and business reasoning.",
    tags: ["Strategic Log", "Policies"],
  },
  {
    icon: Handshake,
    name: "CRM & Relationships",
    desc: "Maps interactions, analyzes supplier behavior patterns, and preserves deep client preference histories.",
    tags: ["Deal Tracker", "Interactions"],
  },
  {
    icon: CalendarClock,
    name: "Scheduling Manager",
    desc: "Handles runtime conflict detection, availability windows, and direct calendar coordination automatically.",
    tags: ["Calendars", "Bookings"],
  },
  {
    icon: UserRoundCheck,
    name: "HR Coordination",
    desc: "Synchronizes attendance records, tracks leave logs, and directs interview/recruitment workflows.",
    tags: ["Workforce", "Hiring"],
  },
  {
    icon: Megaphone,
    name: "Outbound Broadcasts",
    desc: "Coordinates autonomous message delivery to third-party contacts based on time-shifted cron schedules.",
    tags: ["Dispatch", "Messaging"],
  },
  {
    icon: FileScan,
    name: "Media Intelligence",
    desc: "Leverages backend vision loaders to interpret invoices, process tabular sheets, and retrieve historical files.",
    tags: ["OCR Core", "File Query"],
  },
];

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-white text-[#0f172a] min-h-screen font-body overflow-x-hidden relative">
      {/* LIQUID ANIMATED BACKGROUNDS */}
      <div className="fixed top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full blur-[100px] opacity-50 animate-floatAround 
          top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,_#d1fae5_0%,_#ecfdf5_100%)] 
          [animation-duration:25s]"
        />
        <div
          className="absolute rounded-full blur-[100px] opacity-50 animate-floatAround 
          bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,_#ccfbf1_0%,_#f0fdfa_100%)] 
          [animation-duration:18s] [animation-delay:-5s]"
        />
        <div
          className="absolute rounded-full blur-[100px] opacity-50 animate-floatAround 
          top-[40%] right-[10%] w-[30vw] h-[30vw] bg-[radial-gradient(circle,_#f0fdf4_0%,_transparent_100%)] 
          [animation-duration:30s] [animation-delay:-10s]"
        />
      </div>

      {/* MAGIC STICKY NAV */}
      <nav
        className={`fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] md:w-[calc(100%-48px)] max-w-[1000px] 
        bg-white/80 backdrop-blur-[20px] border border-white/50 
        shadow-[0_20px_40px_rgba(0,0,0,0.04)] rounded-[24px] md:rounded-[32px] z-[1000] transition-all duration-300
        ${isMobileMenuOpen ? "h-auto p-6" : "h-16 flex items-center justify-between px-6"}`}
      >
        {/* Row Container (Brand + Controls) */}
        <div
          className={`flex items-center justify-between w-full ${isMobileMenuOpen ? "mb-6" : ""}`}
        >
          <div className="font-title font-extrabold text-xl text-[#0f172a] flex items-center gap-2">
            Memo
          </div>

          {/* Right Group */}
          <div className="flex items-center gap-4">
            <div className="flex gap-8 max-md:hidden">
              <a
                href="#intro"
                className="no-underline text-[#4b5563] font-semibold text-sm transition-colors hover:text-[#128c7e]"
              >
                Concept
              </a>
              <a
                href="#skills"
                className="no-underline text-[#4b5563] font-semibold text-sm transition-colors hover:text-[#128c7e]"
              >
                Agents
              </a>
              <a
                href="#brain"
                className="no-underline text-[#4b5563] font-semibold text-sm transition-colors hover:text-[#128c7e]"
              >
                Brain
              </a>
              <a
                href="#stack"
                className="no-underline text-[#4b5563] font-semibold text-sm transition-colors hover:text-[#128c7e]"
              >
                Engine
              </a>
            </div>

            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline max-md:hidden"
            >
              <div className="px-4 py-2 bg-[#111b21] text-white rounded-full text-[13px] font-bold hover:scale-105 transition-transform">
                GitHub
              </div>
            </a>

            {/* Mobile Burger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hidden max-md:flex w-10 h-10 items-center justify-center bg-black/[0.03] border border-black/[0.05] rounded-full text-[#0f172a]"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Expandable List */}
        {isMobileMenuOpen && (
          <div className="hidden max-md:flex flex-col gap-2 w-full animate-[fadeIn_0.2s_ease-out]">
            <a
              href="#intro"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl bg-black/[0.02] no-underline text-[#111b21] font-bold text-base flex items-center justify-between hover:bg-black/[0.05]"
            >
              Concept
            </a>
            <a
              href="#skills"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl bg-black/[0.02] no-underline text-[#111b21] font-bold text-base flex items-center justify-between hover:bg-black/[0.05]"
            >
              Agents
            </a>
            <a
              href="#brain"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl bg-black/[0.02] no-underline text-[#111b21] font-bold text-base flex items-center justify-between hover:bg-black/[0.05]"
            >
              Brain
            </a>
            <a
              href="#stack"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl bg-black/[0.02] no-underline text-[#111b21] font-bold text-base flex items-center justify-between hover:bg-black/[0.05]"
            >
              Engine Stack
            </a>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-4 mt-2 rounded-xl bg-[#111b21] no-underline text-white font-bold text-center text-base shadow-lg"
            >
              View GitHub Repo
            </a>
          </div>
        )}
      </nav>

      <div className="relative z-10">
        {/* HERO SECTION */}
        <section
          className="min-h-screen flex flex-col items-center justify-center text-center pt-48 px-6 relative"
          id="hero"
        >
          <h1 className="font-title font-extrabold leading-[0.95] tracking-tight text-[#0f172a] text-[clamp(48px,8vw,88px)]">
            Make everyday
            <br />
            <span className="font-fancy italic font-extrabold bg-clip-text text-transparent bg-[linear-gradient(120deg,#075e54_0%,#25d366_100%)]">
              Unforgettable.
            </span>
          </h1>

          <p className="text-[#4b5563] max-w-[700px] leading-relaxed mt-8 mb-12 font-normal text-[clamp(18px,2.5vw,24px)]">
            Memo translates raw WhatsApp streams into a highly structured,
            permanently stored, and fully actionable brain. Open source,
            hyper-private, and breathtakingly simple.
          </p>

          <div className="flex gap-5 flex-wrap justify-center mb-20">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden no-underline bg-[#111b21] text-white font-title text-lg font-bold py-[18px] px-9 rounded-full flex items-center gap-2.5 
              transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] shadow-[0_10px_30px_rgba(0,0,0,0.1)] 
               hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:bg-black 
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent 
              before:-translate-x-full before:transition-transform before:duration-500 hover:before:translate-x-full"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Contribute Code
            </a>
            <a
              href="#stack"
              className="group relative overflow-hidden no-underline bg-transparent text-[#111b21] font-title text-lg font-bold py-[18px] px-9 rounded-full flex items-center gap-2.5 
              transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] border-2 border-[#e2e8f0] shadow-none 
              hover:bg-[#f8fafc] hover:border-[#cbd5e1]"
            >
              View Core Architecture
            </a>
          </div>

          {/* THE MAGICAL SPLIT SCENE */}
          <div className="w-full max-w-[1200px] mt-16 flex flex-col lg:flex-row items-center gap-16 text-left">
            {/* LEFT TEXT COLUMN: Magical Narrative */}
            <div className="flex-1 flex flex-col gap-6 max-w-[600px]">
              <h2 className="font-title font-extrabold text-[clamp(36px,4.5vw,52px)] leading-[1.1] text-[#0f172a]">
                Your second brain,
                <br />
                <span className="text-transparent font-fancy italic bg-clip-text bg-gradient-to-r from-[#075e54] via-[#128c7e] to-[#25d366]">
                  embedded in chat.
                </span>
              </h2>
              <p className="text-lg text-[#4b5563] leading-relaxed m-0">
                Memo doesn't require downloading another app. It invisibly
                orchestrates logic, memory, and scheduling directly within your
                existing communication loops.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-black/[0.03] shadow-sm transition-all hover:bg-white hover:shadow-magical hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-full bg-[#075e54] text-white flex items-center justify-center shrink-0 shadow-md">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0f172a] text-base">
                      Zero Overhead Entry
                    </h4>
                    <p className="text-sm text-[#64748b] m-0">
                      Log actionable notes in less than 2 seconds.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-black/[0.03] shadow-sm transition-all hover:bg-white hover:shadow-magical hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-full bg-[#128c7e] text-white flex items-center justify-center shrink-0 shadow-md">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0f172a] text-base">
                      Auto-Pilot Engagement
                    </h4>
                    <p className="text-sm text-[#64748b] m-0">
                      Workers dispatch follow-ups even while offline.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Reanchored strictly into secure fluid flow */}
            <div className="flex-1 w-full flex items-end justify-center relative h-[600px] lg:h-[650px]">
              {/* The Central Phone Stage (Locked Trimmed Silhouette Globally) */}
              <div className="relative w-[300px] md:w-[360px] h-[580px] bg-white rounded-t-[40px] border-b-0 shadow-[0_20px_80px_rgba(0,0,0,0.1)] border-[8px] border-black overflow-hidden z-10 shadow-magical flex-shrink-0 transition-transform ">
                <div className="bg-[#efeae2] h-full flex flex-col">
                  <div className="bg-[#075e54] p-4 text-white flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#075e54] shadow-sm">
                      <Bot size={18} />
                    </div>
                    <div className="flex flex-col items-start">
                      <b className="text-sm font-bold">Memo</b>
                      <span className="text-[11px] opacity-80">
                        Active Intelligence
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-3 flex flex-col gap-2">
                    {/* 1. USER INITIAL REQUEST */}
                    <div className="p-[8px_12px] rounded-xl text-[13px] max-w-[85%] shadow-[0_1px_1px_rgba(0,0,0,0.1)] bg-white self-start rounded-tl-none text-left">
                      Remind me to send the proposal to David tomorrow morning.
                    </div>

                    {/* 2. MEMO RESPONSE */}
                    <div className="p-[6px_12px] rounded-xl text-[13px] max-w-[85%] shadow-[0_1px_1px_rgba(0,0,0,0.1)] bg-[#dcf8c6] self-end rounded-tr-none text-right">
                      Done.
                    </div>

                    {/* 3. VOICE NOTE (0:10) */}
                    <div className="p-1.5 pr-3 rounded-xl bg-white self-start rounded-tl-none shadow-[0_1px_1px_rgba(0,0,0,0.1)] flex items-center gap-2.5 min-w-[265px]">
                      {/* COMPACT AVATAR & MIC */}
                      <div className="relative shrink-0 ml-0.5">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden">
                          <User
                            size={22}
                            fill="currentColor"
                            className="opacity-50 mt-1.5"
                          />
                        </div>
                        <div className="absolute -right-0.5 -bottom-0.5 bg-white rounded-full p-[1px]">
                          <div className="w-3.5 h-3.5 bg-[#25d366] rounded-full flex items-center justify-center text-white shadow-sm">
                            <Mic size={8} fill="currentColor" />
                          </div>
                        </div>
                      </div>

                      {/* COMPACT PLAY CONTROL */}
                      <div className="text-[#8696a0] shrink-0 ml-0.5 -mt-2">
                        <Play size={16} fill="currentColor" />
                      </div>

                      {/* ABSOLUTE DENSITY WAVEFORM (NO WHITESPACE) */}
                      <div className="flex-1 flex flex-col mt-0.5">
                        <div className="h-6 flex items-center gap-[1.5px] w-full">
                          {/* Blue (Played) Segment - 10 bars */}
                          <div className="w-[2px] h-2 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-4 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-3 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-2 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-5 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-3 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-6 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-3 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-4 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-4 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-3 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-2 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-5 bg-[#53bdeb] rounded-full"></div>
                          <div className="w-[2px] h-2 bg-[#53bdeb] rounded-full"></div>
                          {/* Active Head */}
                          <div className="relative w-[2px] h-6 bg-[#53bdeb] rounded-full">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#53bdeb] rounded-full shadow-sm"></div>
                          </div>
                          {/* Grey (Remaining) Segment - Massive Flood Fill (~25 bars) */}
                          <div className="w-[2px] h-3 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-5 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-4 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-5 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-3 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-6 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-4 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-4 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-1 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-1 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-1 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-3 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-3 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                           <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                           <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                           <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                           <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                           
                          <div className="w-[2px] h-4 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-6 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-4 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-4 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-5 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-3 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-4 bg-[#aebac1] rounded-full"></div>
                          <div className="w-[2px] h-2 bg-[#aebac1] rounded-full"></div>
                        </div>
                        <div className="text-[10px] font-normal text-[#667781]">
                          0:10
                        </div>
                      </div>
                    </div>

                    {/* 4. MEMO ADDS FROM VOICE */}
                    <div className="p-[8px_12px] rounded-xl text-[13px] max-w-[85%] shadow-[0_1px_1px_rgba(0,0,0,0.1)] bg-[#dcf8c6] self-end rounded-tr-none text-right">
                      Added. Passport renewal due this week.
                    </div>

                    {/* 5. DATE SEPARATOR (4 days later) */}
                    <div className="flex justify-center my-1">
                      <div className="bg-[#e1f3fb] text-[#54656f] text-[10px] font-bold px-3 py-0.5 rounded-md shadow-sm uppercase tracking-wider border border-[#d1eefc]">
                        Thursday
                      </div>
                    </div>

                    {/* 6. USER QUOTED REPLY */}
                    <div className="p-1 rounded-xl bg-white self-start rounded-tl-none shadow-[0_1px_1px_rgba(0,0,0,0.1)] flex flex-col gap-0.5 max-w-[85%] min-w-[220px]">
                      <div className="bg-black/[0.04] rounded-lg border-l-[4px] border-[#35a6e1] p-1.5 flex flex-col text-left">
                        <span className="text-[11px] font-bold text-[#35a6e1]">
                          You
                        </span>
                        <span className="text-[11px] text-slate-600 truncate">
                          Remind me to send the proposal to David tomorrow
                          morning.
                        </span>
                      </div>
                      <span className="text-[13px] px-1 pb-0.5 text-left text-slate-800">
                        What else was pending?
                      </span>
                    </div>

                    {/* 7. MEMO BULLET RESPONSE */}
                    <div className="p-[8px_12px] rounded-xl text-[13px] max-w-[85%] shadow-[0_1px_1px_rgba(0,0,0,0.1)] bg-[#dcf8c6] self-end rounded-tr-none text-left flex flex-col gap-0.5">
                      <span className="font-bold">Pending items:</span>
                      <div className="flex items-start gap-1.5">
                        <span className="text-[10px] mt-0.5">•</span>
                        <span>Passport renewal deadline</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-[10px] mt-0.5">•</span>
                        <span>Sign landlord insurance policy</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-[10px] mt-0.5">•</span>
                        <span>Review Q3 marketing slides</span>
                      </div>
                    </div>

                    {/* 8. TYPING EFFECT */}
                    <div className="p-[10px_14px] rounded-xl bg-[#dcf8c6] self-end rounded-tr-none shadow-[0_1px_1px_rgba(0,0,0,0.1)] flex items-center gap-[4px]">
                      <style>{`
                        @keyframes wa-bounce {
                          0%, 50%, 100% { transform: translateY(0); }
                          25%,75% { transform: translateY(-2px); }
                        }
                        .wa-dot {
                          width: 4px;
                          height: 4px;
                          background-color: rgba(0,0,0,0.35);
                          border-radius: 50%;
                          animation: wa-bounce 2s infinite ease-in-out;
                        }
                      `}</style>
                      <div
                        className="wa-dot"
                        style={{ animationDelay: "0s" }}
                      ></div>
                      <div
                        className="wa-dot"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="wa-dot"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STORY SECTION 1: AMBIENT NATURE */}
        <section className="py-[120px] px-6 max-w-[1200px] mx-auto" id="intro">
          <div className="grid grid-cols-2 gap-20 items-center max-md:grid-cols-1 max-md:gap-10">
            <div>
              <span className="font-extrabold uppercase tracking-[2px] text-[#128c7e] text-[13px] mb-4 block">
                Zero Friction
              </span>
              <h2 className="font-title text-[clamp(32px,5vw,48px)] font-extrabold mb-6 leading-[1.1] text-[#0f172a]">
                Talk to your systems like they actually listen.
              </h2>
              <p className="text-lg leading-relaxed text-[#4b5563] mb-8">
                Say goodbye to clunky apps and convoluted navigation menus. Memo
                interfaces directly through the WhatsApp surface you already use
                100 times a day.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 items-center text-base font-semibold text-[#1e293b]">
                  <CheckCircle2 size={20} className="text-[#059669]" />
                  Real-time transcriptions of your voice notes.
                </div>
                <div className="flex gap-3 items-center text-base font-semibold text-[#1e293b]">
                  <CheckCircle2 size={20} className="text-[#059669]" />
                  Native processing of images and complex PDFs.
                </div>
                <div className="flex gap-3 items-center text-base font-semibold text-[#1e293b]">
                  <CheckCircle2 size={20} className="text-[#059669]" />
                  Zero latency ingestion and conversational recall.
                </div>
              </div>
            </div>
            <div className="relative">
              <div
                className="bg-white rounded-[32px] p-10 shadow-[0_40px_80px_-12px_rgba(0,0,0,0.05)] border border-black/[0.03] relative overflow-hidden 
                before:absolute before:top-[-50%] before:right-[-50%] before:w-full before:h-full 
                before:bg-[radial-gradient(circle,_rgba(37,211,102,0.1),_transparent_70%)]"
              >
                <div className="text-[#128c7e] mb-4">
                  <MessageSquareQuote size={40} strokeWidth={1.5} />
                </div>
                <h3 className="font-title font-extrabold text-2xl mb-3 text-[#0f172a]">
                  WhatsApp As OS
                </h3>
                <p className="text-[#64748b] leading-relaxed m-0 text-sm">
                  Powered by `@whiskeysockets/baileys`, Memo bridges existing
                  messaging ecosystems seamlessly without locking you into
                  expensive enterprise walled gardens.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* NEW: THE REAL CAPABILITIES GRID FROM SEED */}
        <section
          className="py-[120px] px-6 max-w-[1200px] mx-auto pt-0"
          id="skills"
        >
          <div className="text-center max-w-[700px] mx-auto mb-10">
            <span className="font-extrabold uppercase tracking-[2px] text-[#128c7e] text-[13px] mb-4 block">
              Available Runtime Skills
            </span>
            <h2 className="font-title text-[clamp(32px,5vw,48px)] font-extrabold mb-6 leading-[1.1] text-[#0f172a]">
              A modular fleet of native agents.
            </h2>
            <p className="text-lg leading-relaxed text-[#4b5563] mb-8">
              Memo's execution core pulls dynamically from discrete server-side
              runtime catalog definitions to provide specialized situational
              logic.
            </p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-8 mt-[60px]">
            {activeSkills.map((skill) => (
              <div
                key={skill.name}
                className="group relative bg-white rounded-[32px] p-10 border border-black/[0.04] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.02)] 
                transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden flex flex-col items-start 
                hover:-translate-y-3 hover:scale-[1.01] hover:shadow-glow hover:border-[#25d366]/20 
                before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#25d366]/[0.03] before:to-[#128c7e]/[0.03] before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100"
              >
                <div
                  className="relative w-16 h-16 bg-[#f8fafc] rounded-[20px] flex items-center justify-center text-[28px] mb-6 z-10 
                  transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)] 
                  group-hover:bg-[#075e54] group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-[0_15px_30px_rgba(7,94,84,0.2)]"
                >
                  <skill.icon
                    size={28}
                    className="transition-transform duration-500 group-hover:text-white group-hover:brightness-125"
                  />
                </div>
                <h4 className="font-title text-[22px] font-extrabold mb-3 text-[#0f172a] z-10 relative">
                  {skill.name}
                </h4>
                <p className="text-[15px] text-[#64748b] leading-relaxed mb-6 z-10 relative">
                  {skill.desc}
                </p>
                <div className="flex flex-wrap gap-2 z-10 relative mt-auto">
                  {skill.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-black/[0.03] text-[#475569] text-xs font-bold px-3.5 py-1.5 rounded-full border border-transparent transition-all duration-300 
                      group-hover:bg-white group-hover:border-black/[0.05] group-hover:text-[#128c7e]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div
                  className="absolute -bottom-5 -right-5 w-20 h-20 bg-[#25d366] rounded-full blur-[40px] opacity-0 
                  transition-opacity duration-500 pointer-events-none group-hover:opacity-20"
                />
              </div>
            ))}
          </div>
        </section>

        {/* STORY SECTION 2: THE BRAIN */}
        <section
          className="py-[120px] px-6 max-w-[1200px] mx-auto pt-10"
          id="brain"
        >
          <div
            className="grid grid-cols-2 gap-20 items-center max-md:grid-cols-1 max-md:gap-10"
            style={{ direction: "rtl" }}
          >
            <div style={{ direction: "ltr" }}>
              <span className="font-extrabold uppercase tracking-[2px] text-[#128c7e] text-[13px] mb-4 block">
                Cognitive Layer
              </span>
              <h2 className="font-title text-[clamp(32px,5vw,48px)] font-extrabold mb-6 leading-[1.1] text-[#0f172a]">
                Built with an infinite episodic memory.
              </h2>
              <p className="text-lg leading-relaxed text-[#4b5563] mb-8">
                Memo uses local pgvector embeddings combined with Google's
                Gemini to dynamically hydrate every response with exactly what
                was discussed three months ago.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 items-center text-base font-semibold text-[#1e293b]">
                  <CheckCircle2 size={20} className="text-[#059669]" />
                  Sub-millisecond vector search lookups.
                </div>
                <div className="flex gap-3 items-center text-base font-semibold text-[#1e293b]">
                  <CheckCircle2 size={20} className="text-[#059669]" />
                  Automated contextual tagging and pruning.
                </div>
                <div className="flex gap-3 items-center text-base font-semibold text-[#1e293b]">
                  <CheckCircle2 size={20} className="text-[#059669]" />
                  Persistent structured memory buffer.
                </div>
              </div>
            </div>
            <div className="relative" style={{ direction: "ltr" }}>
              <div className="bg-[#111b21] text-white rounded-[32px] p-10 shadow-[0_40px_80px_-12px_rgba(0,0,0,0.05)] border border-black/[0.03] relative overflow-hidden">
                <div className="text-white/70 mb-4">
                  <Database size={40} strokeWidth={1.5} />
                </div>
                <h3 className="font-title font-extrabold text-2xl mb-3 text-white">
                  Localized Vectorized DB
                </h3>
                <p className="text-[#94a3b8] leading-relaxed m-0 text-sm">
                  Self-host PostgreSQL with pgvector extension to ensure your
                  private knowledge doesn't sit on unmanaged third-party clouds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BENTO GRID FOR ENGINE SUMMARY */}
        <section
          className="py-[120px] px-6 max-w-[1200px] mx-auto pt-0"
          id="stack"
        >
          <div className="text-center max-w-[700px] mx-auto mb-4">
            <span className="font-extrabold uppercase tracking-[2px] text-[#128c7e] text-[13px] mb-4 block">
              The Engine Stack
            </span>
            <h2 className="font-title text-[clamp(32px,5vw,48px)] font-extrabold mb-6 leading-[1.1] text-[#0f172a]">
              An orchestration of modular brilliance.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-[60px] max-md:grid-cols-1">
            <div
              className="col-span-2 bg-[#111b21] text-white rounded-[24px] p-8 border-none relative overflow-hidden 
              after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top_right,_rgba(37,211,102,0.2),_transparent_60%)] 
              transition-all duration-300 hover:-translate-y-2 hover:shadow-magical max-md:col-span-1"
            >
              <h3 className="text-white font-title font-extrabold text-xl mb-3 z-10 relative">
                Gemini Cognitive Pipeline
              </h3>
              <p className="text-[#94a3b8] font-normal text-sm leading-relaxed m-0 z-10 relative">
                Operates via a robust, two-phase architecture: rapid-fire JSON
                intent extraction followed by thorough search-enabled narration
                for queries.
              </p>
            </div>
            <div className="bg-white rounded-[24px] p-8 border border-black/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:shadow-magical">
              <h3 className="text-[#0f172a] font-title font-extrabold text-xl mb-3">
                Redis Queues
              </h3>
              <p className="text-[#64748b] text-sm leading-relaxed m-0">
                BullMQ reliably manages background OCR workloads and voice
                transcoding with strict single-flight concurrency options.
              </p>
            </div>
            <div className="bg-white rounded-[24px] p-8 border border-black/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:shadow-magical">
              <h3 className="text-[#0f172a] font-title font-extrabold text-xl mb-3">
                Fastify Runtime
              </h3>
              <p className="text-[#64748b] text-sm leading-relaxed m-0">
                Blazing fast, typed API surface enabling instantaneous data
                resolution and direct React 19 client communication.
              </p>
            </div>
            <div className="bg-white rounded-[24px] p-8 border border-black/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:shadow-magical">
              <h3 className="text-[#0f172a] font-title font-extrabold text-xl mb-3">
                Python Venv
              </h3>
              <p className="text-[#64748b] text-sm leading-relaxed m-0">
                Direct child-process bridge executing localized faster-whisper
                audio transcription & native embedding lookups.
              </p>
            </div>
            <div className="bg-white rounded-[24px] p-8 border border-black/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:shadow-magical">
              <h3 className="text-[#0f172a] font-title font-extrabold text-xl mb-3">
                Prisma 7 + pgvector
              </h3>
              <p className="text-[#64748b] text-sm leading-relaxed m-0">
                Strict structural modeling securing 384-dimensional localized
                spatial embedding tables perfectly.
              </p>
            </div>
          </div>
        </section>

        {/* MAGICAL FOOTER */}
        <footer className="pt-[120px] px-6 pb-20 text-center bg-gradient-to-b from-transparent to-white">
          <h2 className="font-title font-extrabold leading-[0.95] tracking-tight text-[#0f172a] text-[clamp(32px,6vw,56px)] mb-6">
            Build the Next Phase <br />
            of{" "}
            <span className="font-fancy italic font-extrabold text-black">
              Cognition.
            </span>
          </h2>
          <div className="flex justify-center gap-5">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden no-underline bg-[#111b21] text-white font-title text-lg font-bold py-[18px] px-9 rounded-full flex items-center gap-2.5 
              transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] shadow-[0_10px_30px_rgba(0,0,0,0.1)] 
              hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:bg-black"
            >
              Join Collaboration
            </a>
          </div>

          <div className="mt-10 text-sm text-[#94a3b8]">
            © 2026 The Memo Project. Designed for the independent era.
          </div>
        </footer>
      </div>
    </div>
  );
}
