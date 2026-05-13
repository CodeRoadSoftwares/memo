import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const tabs = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: "/phones",
    label: "Phone Numbers",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l1.62-1.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    to: "/skills",
    label: "Skills",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    to: "/link",
    label: "Link WhatsApp",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    to: "/link-telegram",
    label: "Link Telegram",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    ),
  },
];

export default function SideNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-[4px_0_24px_rgba(148,163,184,0.05)] font-title z-50">
      {/* Logo Row */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="text-2xl filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]">💬</div>
        <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700">
          Memo
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5 px-4 py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition-all duration-200 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-sm shadow-emerald-100 translate-x-1"
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100/70 hover:text-slate-900 hover:translate-x-1"
              }`
            }
          >
            {tab.icon}
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info Footer */}
      <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[15px] font-black flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-200/50">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-extrabold text-slate-900 truncate leading-tight">
              {user?.name || "Explorer"}
            </span>
            <span className="text-[11px] font-bold text-slate-500 truncate mt-0.5">
              {user?.phone || "Active Session"}
            </span>
          </div>
        </div>
        
        <button
          className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100/50 text-rose-500 flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-200 active:scale-95"
          onClick={handleLogout}
          title="Logout"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
