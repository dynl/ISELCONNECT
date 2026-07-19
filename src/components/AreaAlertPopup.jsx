import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { AlertTriangle, X } from "lucide-react";

const AreaAlertPopup = () => {
  const [alertData, setAlertData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchRecentAlerts = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Calculate the exact time 24 hours ago
        const oneDayAgo = new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString();

        // 2. Fetch the most recent Area Alert from the last 24 hours
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("residents_id", user.id)
          .like("title", "Area Alert:%")
          .gte("created_at", oneDayAgo)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const latestAlert = data[0];

          // 3. Check local storage to see if the user already dismissed THIS specific alert
          const isDismissed = localStorage.getItem(
            `dismissed_alert_${latestAlert.id}`,
          );

          if (!isDismissed) {
            setAlertData(latestAlert);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Error fetching area alerts:", error.message);
      }
    };

    fetchRecentAlerts();

    // Optional: Set up real-time listening so the popup appears instantly
    // even if they are already inside the app when the neighbor reports it!
    const channel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotification = payload.new;
          if (newNotification.title.startsWith("Area Alert:")) {
            fetchRecentAlerts();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (alertData) {
      // 4. Save to local storage so it stops showing up for this specific report
      localStorage.setItem(`dismissed_alert_${alertData.id}`, "true");
    }
  };

  if (!isVisible || !alertData) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "400px",
          overflow: "hidden",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          animation: "popIn 0.3s ease-out",
        }}
      >
        <div
          style={{
            background: "#1b0b8c",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div
              style={{
                background: "#fde68a",
                padding: "8px",
                borderRadius: "50%",
                display: "flex",
              }}
            >
              <AlertTriangle size={24} color="#b45309" />
            </div>
            <h2
              style={{
                margin: 0,
                color: "#fff",
                fontSize: "1.2rem",
                fontWeight: "900",
                letterSpacing: "1px",
              }}
            >
              CRITICAL ALERT
            </h2>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: 0,
              display: "flex",
            }}
          >
            <X size={28} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <h3
            style={{
              margin: "0 0 10px 0",
              color: "#1e293b",
              fontSize: "1.05rem",
              fontWeight: "900",
            }}
          >
            {alertData.title}
          </h3>
          <p
            style={{
              margin: 0,
              color: "#475569",
              fontSize: "0.95rem",
              lineHeight: "1.6",
              fontWeight: "500",
            }}
          >
            {alertData.message}
          </p>

          <button
            onClick={handleClose}
            style={{
              width: "100%",
              padding: "16px",
              marginTop: "24px",
              background: "#fef3c7",
              color: "#b45309",
              border: "2px solid #fde68a",
              borderRadius: "50px",
              fontWeight: "900",
              fontSize: "1rem",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "1px",
              transition: "all 0.2s",
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default AreaAlertPopup;
