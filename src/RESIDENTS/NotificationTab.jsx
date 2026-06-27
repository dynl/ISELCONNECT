import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Bell } from "lucide-react";

function NotificationTab() {
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
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${formattedDate}  ${formattedTime}`;
  };

  return (
    <div className="bg-navy-tab">
      <h2 className="notification-title">NOTIFICATION</h2>

      <div className="notification-list">
        {loading ? (
          <p className="notif-loading-text">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="notif-empty-container">
            <Bell
              size={48}
              strokeWidth={1.5}
              color="#94a3b8"
              style={{ margin: "0 auto 10px auto" }}
            />
            <p>You have no new notifications.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-card ${notif.is_read ? "notif-card-read" : "notif-card-unread"}`}
            >
              <div className="notif-header">
                <h3 className="notif-title">{notif.title}</h3>
                <span className="notif-time">
                  {formatDateTime(notif.created_at)}
                </span>
              </div>
              <p style={{ color: "#334155", fontSize: "0.9rem", margin: 0 }}>
                {notif.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationTab;
