import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import LinemanReportDetail from "./LinemanReportDetail";
import { translations } from "../components/translations";

const getPriorityColor = (level) => {
  switch (level?.toUpperCase()) {
    case "CRITICAL":
      return "#ef4444";
    case "HIGH":
      return "#f97316";
    case "NORMAL":
      return "#3b82f6";
    case "LOW":
      return "#10b981";
    default:
      return "#1b0b8c";
  }
};

function LinemanHistoryTab() {
  const currentLang = localStorage.getItem("appLanguage") || "English";
  const t = translations[currentLang];

  const [activeView, setActiveView] = useState("RESOLVED");

  const [resolvedReports, setResolvedReports] = useState([]);
  const [generalReports, setGeneralReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("branch_id")
        .eq("id", user.id)
        .maybeSingle();

      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(
          `reports ( id, description, landmark, latitude, longitude, photo_url, purok_sitio, created_at, barangays ( name ), municipalities ( name ), report_types ( name, priority_level ), report_statuses ( id, name ) )`,
        )
        .eq("lineman_id", user.id);

      if (assignmentsData) {
        const extracted = assignmentsData.map((a) => a.reports).filter(Boolean);
        const resolved = extracted.filter(
          (r) => r.report_statuses?.name?.toUpperCase() === "RESOLVED",
        );
        setResolvedReports(
          resolved.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
          ),
        );
      }

      let query = supabase
        .from("reports")
        .select(
          `id, landmark, purok_sitio, created_at, barangays ( name ), municipalities ( name ), report_types ( name, priority_level )`,
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (userData?.branch_id) {
        query = query.eq("branch_id", userData.branch_id);
      }

      const { data: generalData } = await query;
      if (generalData) setGeneralReports(generalData);
    } catch (error) {
      console.error("Error fetching history data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (report) => {
    return [
      report.purok_sitio,
      report.barangays?.name,
      report.municipalities?.name,
      "Isabela",
    ]
      .filter(Boolean)
      .join(", ");
  };

  if (selectedReport) {
    return (
      <LinemanReportDetail
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
        onReportUpdated={() => {
          setSelectedReport(null);
          fetchAllData();
        }}
      />
    );
  }

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
      {/* STICKY HEADER & TOGGLE */}
      <div
        style={{
          position: "sticky",
          top: 0,
          margin: "-18px -16px 20px -16px",
          padding: "22px 16px 18px 16px", // Adjusted padding to match Notifications tab
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
            margin: "0 0 15px 0",
            fontSize: "1.8rem", // Enlarged font size
            fontWeight: "900",
            letterSpacing: "1px", // Spread out slightly for a cleaner look
            textTransform: "uppercase", // Forced uppercase
          }}
        >
          Report Logs
        </h2>

        {/* --- SEGMENTED TOGGLE SWITCH --- */}
        <div
          style={{
            display: "flex",
            gap: "5px",
            background: "#e2e8f0",
            padding: "6px",
            borderRadius: "14px",
          }}
        >
          <button
            onClick={() => setActiveView("RESOLVED")}
            style={{
              flex: 1,
              padding: "12px 10px",
              borderRadius: "10px",
              border: "none",
              fontWeight: "900",
              fontSize: "0.85rem",
              background: activeView === "RESOLVED" ? "#ffffff" : "transparent",
              color: activeView === "RESOLVED" ? "#1b0b8c" : "#64748b",
              boxShadow:
                activeView === "RESOLVED"
                  ? "0 4px 10px rgba(0,0,0,0.08)"
                  : "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            Resolved ({resolvedReports.length})
          </button>
          <button
            onClick={() => setActiveView("GENERAL")}
            style={{
              flex: 1,
              padding: "12px 10px",
              borderRadius: "10px",
              border: "none",
              fontWeight: "900",
              fontSize: "0.85rem",
              background: activeView === "GENERAL" ? "#ffffff" : "transparent",
              color: activeView === "GENERAL" ? "#1b0b8c" : "#64748b",
              boxShadow:
                activeView === "GENERAL"
                  ? "0 4px 10px rgba(0,0,0,0.08)"
                  : "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            General System
          </button>
        </div>
      </div>
      {/* ------------------------------- */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          width: "100%",
        }}
      >
        {loading ? (
          <p className="l-rt-loading">Loading records...</p>
        ) : activeView === "RESOLVED" ? (
          /* RESOLVED VIEW */
          resolvedReports.length === 0 ? (
            <p className="l-rt-loading" style={{ color: "#64748b" }}>
              {t.noResolvedReports || "No resolved reports yet."}
            </p>
          ) : (
            resolvedReports.map((report) => (
              <div
                key={`resolved-${report.id}`}
                className="lineman-report-card cursor-pointer"
                onClick={() => setSelectedReport(report)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                  margin: 0,
                  borderLeft: `6px solid ${getPriorityColor(report.report_types?.priority_level)}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: getPriorityColor(
                        report.report_types?.priority_level,
                      ),
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    {report.report_types?.priority_level || "Normal"} Priority
                  </span>
                  <h3 className="lineman-report-title">
                    {report.report_types?.name}
                  </h3>
                  <p className="lineman-report-address">
                    {formatAddress(report)}
                  </p>
                </div>
                <div
                  style={{
                    backgroundColor: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #bbf7d0",
                    padding: "6px 12px",
                    borderRadius: "50px",
                    fontSize: "0.7rem",
                    fontWeight: "900",
                    letterSpacing: "0.5px",
                  }}
                >
                  RESOLVED
                </div>
              </div>
            ))
          )
        ) : /* GENERAL VIEW */
        generalReports.length === 0 ? (
          <p className="l-rt-loading" style={{ color: "#64748b" }}>
            {t.noGeneralReports || "No general reports found."}
          </p>
        ) : (
          generalReports.map((report) => (
            <div
              key={`general-${report.id}`}
              className="lineman-report-card"
              style={{
                width: "100%",
                boxSizing: "border-box",
                margin: 0,
                borderLeft: `6px solid ${getPriorityColor(report.report_types?.priority_level)}`,
              }}
            >
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: getPriorityColor(report.report_types?.priority_level),
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                {report.report_types?.priority_level || "Normal"} Priority
              </span>
              <h3 className="lineman-report-title">
                {report.report_types?.name}
              </h3>
              <p className="lineman-report-address">{formatAddress(report)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LinemanHistoryTab;
