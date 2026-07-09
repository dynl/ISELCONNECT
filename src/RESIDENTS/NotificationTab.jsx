import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Bell, AlertTriangle } from "lucide-react";
import { translations } from "../components/translations";
import LoadingScreen from "../components/LoadingScreen"; // Custom Loading

function NotificationTab() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentLang = localStorage.getItem("appLanguage") || "English";
  const t = translations[currentLang];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError;

      const { data: standardNotifs, error: notifError } = await supabase
        .from("notifications")
        .select("*")
        .eq("residents_id", user.id)
        .order("created_at", { ascending: false });
      if (notifError) throw notifError;

      const { data: userData, error: profileError } = await supabase
        .from("users")
        .select("barangay_id")
        .eq("id", user.id)
        .single();

      let upcomingAdvisories = [];
      if (userData && userData.barangay_id) {
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);

        const { data: advisoriesData, error: advError } = await supabase
          .from("power_advisories")
          .select(
            "id, title, schedule_start, schedule_end, affected_areas, created_at",
          )
          .contains("affected_barangay_ids", [userData.barangay_id])
          .gte("schedule_start", today.toISOString())
          .lte("schedule_start", threeDaysFromNow.toISOString());

        if (!advError && advisoriesData) {
          upcomingAdvisories = advisoriesData.map((adv) => ({
            id: `adv-${adv.id}`,
            title: adv.title || "UPCOMING POWER OUTAGE",
            message: `Scheduled from ${formatDateTime(adv.schedule_start)} to ${formatDateTime(adv.schedule_end)}. Affected areas: ${adv.affected_areas}`,
            created_at: adv.created_at || new Date().toISOString(),
            is_read: false,
            is_advisory: true,
          }));
        }
      }

      const combinedNotifs = [...(standardNotifs || []), ...upcomingAdvisories];
      combinedNotifs.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      setNotifications(combinedNotifs);
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
      <h2 className="notification-title">{t.notificationTitle}</h2>

      <div className="notification-list">
        {loading ? (
          <LoadingScreen message={t.loadingNotifs} />
        ) : notifications.length === 0 ? (
          <div className="notif-empty-container">
            <Bell
              size={48}
              strokeWidth={1.5}
              color="#94a3b8"
              style={{ margin: "0 auto 10px auto" }}
            />
            <p>{t.noNotifs}</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-card ${notif.is_read ? "notif-card-read" : "notif-card-unread"}`}
              style={
                notif.is_advisory
                  ? {
                      borderLeft: "5px solid #facc15",
                      backgroundColor: "#fefce8",
                    }
                  : {}
              }
            >
              <div
                className="notif-header"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {notif.is_advisory && (
                  <AlertTriangle size={18} color="#ca8a04" />
                )}
                <h3
                  className="notif-title"
                  style={
                    notif.is_advisory
                      ? { color: "#ca8a04", fontWeight: "900" }
                      : {}
                  }
                >
                  {notif.title}
                </h3>
                <span className="notif-time" style={{ marginLeft: "auto" }}>
                  {formatDateTime(notif.created_at)}
                </span>
              </div>
              <p
                style={{
                  color: "#334155",
                  fontSize: "0.9rem",
                  margin: "8px 0 0 0",
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

export default NotificationTab;
