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
        backgroundColor: "#1b0b8c",
        minHeight: "100vh",
        padding: "40px 20px 120px 20px",
        boxSizing: "border-box",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          margin: "0 0 30px 0",
          fontSize: "2.2rem",
          fontWeight: "900",
          letterSpacing: "1px",
          color: "#ffdf84",
          textTransform: "uppercase",
        }}
      >
        {t.notificationTitle}
      </h2>

      <div className="notification-list">
        {loading ? (
          <LoadingScreen message={t.loadingNotifs} />
        ) : notifications.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "40px",
              color: "#cbd5e1",
            }}
          >
            <Bell
              size={48}
              strokeWidth={1.5}
              color="#cbd5e1"
              style={{ marginBottom: "10px" }}
            />
            <p>{t.noNotifs}</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "16px 20px",
                marginBottom: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                opacity: notif.is_read ? 0.85 : 1,
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
                    color: "#1e1b4b",
                    textTransform: "uppercase",
                  }}
                >
                  {notif.title}
                </h3>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    fontWeight: "600",
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
                  lineHeight: "1.4",
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
