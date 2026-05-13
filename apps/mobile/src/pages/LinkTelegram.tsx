import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/link.css";

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

  // Local reference or fallback if context didn't contain key initially
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

    return () => {
      isMounted = false;
    };
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
    <div className="link-screen">
      <header className="page-header">
        <h1>Link Telegram</h1>
      </header>

      <div className="link-body">
        <div className="link-card">
          <div className="link-icon">✈️</div>
          <h2>Connect to Telegram Bot</h2>
          <p>
            Control your assistant, send voice notes, and receive reminders directly via Telegram.
          </p>

          {loading ? (
            <div style={{ margin: "20px 0", textAlign: "center" }}>
              <span className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : (
            <>
              {/* Status Indicator */}
              {info.telegramChatId ? (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "12px",
                    borderRadius: "12px",
                    margin: "16px 0",
                    textAlign: "center",
                  }}
                >
                  <p style={{ color: "#10b981", fontWeight: "bold", margin: 0 }}>
                    ✅ Successfully Linked
                  </p>
                  {info.telegramUsername && (
                    <p style={{ fontSize: "13px", marginTop: "4px", opacity: 0.8 }}>
                      Linked to: @{info.telegramUsername}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    padding: "12px",
                    borderRadius: "12px",
                    margin: "16px 0",
                    textAlign: "center",
                  }}
                >
                  <p style={{ color: "#f59e0b", fontWeight: "bold", margin: 0 }}>
                    ⚠️ Not Connected
                  </p>
                </div>
              )}

              {/* Step 1: API Key Section */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.03)",
                  borderRadius: "12px",
                  padding: "16px",
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "left",
                  marginBottom: "20px",
                }}
              >
                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Your API Key</h4>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    readOnly
                    value={apiKey}
                    style={{
                      flex: 1,
                      background: "#fff",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      fontFamily: "monospace",
                    }}
                  />
                  <button
                    className="btn-secondary"
                    style={{ margin: 0, padding: "0 16px" }}
                    onClick={handleCopy}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="link-actions" style={{ flexDirection: "column", gap: "12px" }}>
                <a
                  href={botUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", width: "100%" }}
                >
                  <button className="btn-primary" style={{ width: "100%" }}>
                    Open Telegram Bot
                  </button>
                </a>

                {info.telegramChatId && (
                  <button
                    className="btn-danger"
                    onClick={handleUnlink}
                    disabled={unlinking}
                    style={{ width: "100%" }}
                  >
                    {unlinking ? <span className="spinner" /> : "Disconnect Bot"}
                  </button>
                )}
              </div>
            </>
          )}

          {error && (
            <p className="auth-error" style={{ marginTop: 12 }}>
              {error}
            </p>
          )}
          {successMsg && (
            <p className="success-msg" style={{ marginTop: 12 }}>
              {successMsg}
            </p>
          )}
        </div>

        {/* Step instructions block */}
        {!info.telegramChatId && (
          <div
            style={{
              background: "#fff",
              borderRadius: "24px",
              border: "1px solid rgba(0,0,0,0.05)",
              padding: "24px",
              marginTop: "20px",
              textAlign: "left",
              boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>How to Link:</h3>
            <ol style={{ paddingLeft: "20px", margin: 0, lineHeight: "1.6" }}>
              <li>Copy your unique **API Key** from the card above.</li>
              <li>
                Click **Open Telegram Bot** (or search{" "}
                {info.botUsername ? `@${info.botUsername}` : "for our bot"} on Telegram).
              </li>
              <li>
                Start a chat and send the command: <br />
                <code style={{ background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                  /link YOUR_API_KEY
                </code>
              </li>
              <li>
                Tap{" "}
                <span
                  style={{ textDecoration: "underline", cursor: "pointer", color: "#0088cc", fontWeight: "bold" }}
                  onClick={handleRefresh}
                >
                  Refresh
                </span>{" "}
                to verify your status.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
