import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Bell } from "lucide-react";
import "../Lineman.css";
import { translations } from "../components/translations";
import LoadingScreen from "../components/LoadingScreen";

function LinemanNotificationTab() {
  const currentLang = localStorage.getItem("appLanguage") || "English";
  const t = translations[currentLang];

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("residents_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        boxSizing: "border-box",
        padding: "18px 16px",
        background: "linear-gradient(180deg, #ffffff 0%, #f4f6ff 100%)",
        minHeight: "100%",
      }}
    >
      {/* STICKY HEADER */}
      <div
        style={{
          position: "sticky",
          top: 0,
          margin: "-18px -16px 20px -16px",
          padding: "22px 16px 18px 16px", // Added slightly more padding to accommodate the larger text
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 50,
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <h2
          className="text-navy"
          style={{
            margin: 0,
            fontSize: "1.8rem", // Enlarged font size
            fontWeight: "900",
            letterSpacing: "1px", // Spread out slightly for a cleaner look
            textTransform: "uppercase", // Forced uppercase
          }}
        >
          {t.notificationTitle || "Notifications"}
        </h2>
      </div>

      <div
        className="notification-list"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          width: "100%",
        }}
      >
        {loading ? (
          <LoadingScreen message={t.loadingNotifs} />
        ) : notifications.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "40px",
              color: "#64748b",
            }}
          >
            <Bell
              size={48}
              strokeWidth={1.5}
              color="#cbd5e1"
              style={{ marginBottom: "10px" }}
            />
            <p style={{ fontWeight: "bold" }}>{t.noNotifs}</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "16px 20px",
                margin: 0,
                boxShadow: "0 4px 10px rgba(27, 11, 140, 0.05)",
                borderLeft: notif.is_read
                  ? "6px solid #cbd5e1"
                  : "6px solid #f5c400",
                opacity: notif.is_read ? 0.75 : 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "5px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: "900",
                    color: "#1b0b8c",
                    textTransform: "uppercase",
                  }}
                >
                  {notif.title}
                </h3>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                    marginLeft: "10px",
                  }}
                >
                  {formatDateTime(notif.created_at)}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "#475569",
                  lineHeight: "1.5",
                  fontWeight: "500",
                }}
              >
                {notif.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LinemanNotificationTab;
