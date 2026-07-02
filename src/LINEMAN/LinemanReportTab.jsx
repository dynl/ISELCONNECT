import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import LinemanReportDetail from "./LinemanReportDetail";
import { CheckCircle, ChevronLeft } from "lucide-react";

function LinemanReportTab() {
  const [linemanName, setLinemanName] = useState("");
  const [assignedReports, setAssignedReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [totalSystemReports, setTotalSystemReports] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedReport, setSelectedReport] = useState(null);

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showResolvedScreen, setShowResolvedScreen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError;

      // 1. Fetch user data INCLUDING their branch_id
      const { data: userData } = await supabase
        .from("users")
        .select("first_name, branch_id")
        .eq("id", user.id)
        .maybeSingle();

      if (userData) setLinemanName(userData.first_name);

      const linemanBranchId = userData?.branch_id;

      // 2. Fetch Assignments
      const { data: assignmentsData, error: assignError } = await supabase
        .from("assignments")
        .select(
          `reports ( id, description, landmark, latitude, longitude, photo_url, purok_sitio, barangays ( name ), municipalities ( name ), report_types ( name ), report_statuses ( id, name ) )`,
        )
        .eq("lineman_id", user.id);

      if (assignmentsData && !assignError) {
        const reports = assignmentsData.map((a) => a.reports).filter(Boolean);
        setAssignedReports(reports);
      }

      // 3. Fetch General Reports (FILTERED BY LINEMAN'S BRANCH)
      let generalReportsQuery = supabase
        .from("reports")
        .select(
          `id, landmark, purok_sitio, barangays ( name ), municipalities ( name ), report_types ( name )`,
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (linemanBranchId) {
        generalReportsQuery = generalReportsQuery.eq(
          "branch_id",
          linemanBranchId,
        );
      }

      const { data: generalReports } = await generalReportsQuery;
      if (generalReports) setAllReports(generalReports);

      // 4. Fetch Total Reports Count (FILTERED BY LINEMAN'S BRANCH)
      let countQuery = supabase
        .from("reports")
        .select("*", { count: "exact", head: true });

      if (linemanBranchId) {
        countQuery = countQuery.eq("branch_id", linemanBranchId);
      }

      const { count: systemTotalCount } = await countQuery;
      if (systemTotalCount !== null) setTotalSystemReports(systemTotalCount);
    } catch (error) {
      console.error("Error fetching lineman data:", error.message);
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

  const pendingReportsCount = assignedReports.filter(
    (r) => r.report_statuses?.name?.toUpperCase() === "PENDING",
  ).length;

  const resolvedReports = assignedReports.filter(
    (r) => r.report_statuses?.name?.toUpperCase() === "RESOLVED",
  );

  const activeAssignedReports = assignedReports.filter(
    (r) => r.report_statuses?.name?.toUpperCase() !== "RESOLVED",
  );

  const filteredActiveReports = activeAssignedReports.filter((r) => {
    if (filterStatus === "ALL") return true;
    return r.report_statuses?.name?.toUpperCase() === filterStatus;
  });

  // ==========================================
  // DETAIL SCREEN
  // ==========================================
  if (selectedReport) {
    return (
      <LinemanReportDetail
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
        onReportUpdated={() => {
          setSelectedReport(null);
          fetchDashboardData();
        }}
      />
    );
  }

  // ==========================================
  // FULL-SCREEN RESOLVED REPORTS VIEW
  // ==========================================
  if (showResolvedScreen) {
    return (
      <div
        className="tab-content lineman-dashboard-layout"
        style={{
          height: "100vh",
          width: "100vw",
          position: "fixed",
          top: 0,
          left: 0,
          backgroundColor: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "20px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setShowResolvedScreen(false)}
            style={{
              background: "#ffffff",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <ChevronLeft size={24} color="#1b0b8c" strokeWidth={3} />
          </button>
          <h2
            style={{
              margin: 0,
              color: "#1b0b8c",
              fontWeight: "900",
              fontSize: "1.4rem",
            }}
          >
            RESOLVED REPORTS
          </h2>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 20px 100px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {resolvedReports.length === 0 ? (
            <p className="l-rt-loading">No resolved reports found.</p>
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
                }}
              >
                <div style={{ flex: 1 }}>
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
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  RESOLVED
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN DASHBOARD VIEW
  // ==========================================
  return (
    <div
      className="tab-content lineman-dashboard-layout l-rt-tab"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        boxSizing: "border-box",
        paddingBottom: "100px",
      }}
    >
      <div className="l-rt-sticky-header" style={{ marginBottom: "20px" }}>
        <p className="l-rt-greeting" style={{ margin: 0 }}>
          Hello
        </p>
        <h2 className="l-rt-name" style={{ margin: 0 }}>
          {linemanName || "Lineman"}
        </h2>
      </div>

      <div
        style={{
          display: "flex",
          gap: "15px",
          width: "100%",
          boxSizing: "border-box",
          marginBottom: "25px",
        }}
      >
        <div
          className="l-rt-stat-box-blue"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <p className="l-rt-stat-title-blue">
            TOTAL
            <br />
            REPORTS
          </p>
          <h3 className="l-rt-stat-num-blue">{totalSystemReports}</h3>
        </div>
        <div
          className="l-rt-stat-box-yellow"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <p className="l-rt-stat-title-yellow">
            PENDING ASSIGNED
            <br />
            REPORT
          </p>
          <h3 className="l-rt-stat-num-yellow">{pendingReportsCount}</h3>
        </div>
      </div>

      <button
        onClick={() => setShowResolvedScreen(true)}
        style={{
          width: "100%",
          padding: "14px",
          backgroundColor: "#16a34a",
          color: "#ffffff",
          borderRadius: "15px",
          border: "none",
          fontWeight: "900",
          fontSize: "0.95rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          marginBottom: "25px",
          boxShadow: "0 6px 15px rgba(22, 163, 74, 0.2)",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        <CheckCircle size={20} />
        VIEW RESOLVED REPORTS ({resolvedReports.length})
      </button>

      <h2 className="l-rt-section-title" style={{ marginBottom: 0 }}>
        <span className="text-yellow">ASSIGNED</span>{" "}
        <span className="text-navy">REPORTS</span>
      </h2>

      {/* =====================================================================
          THE FIX: REMOVED OVERFLOW, ENABLED WRAPPING
          ===================================================================== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap", // <--- This allows them to flow naturally
          gap: "10px",
          padding: "5px 0", // <--- Removed heavy padding
          marginTop: "10px",
          marginBottom: "15px",
          position: "relative",
          zIndex: 20,
        }}
      >
        {["ALL", "PENDING", "IN PROGRESS"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: "10px 18px",
              borderRadius: "50px",
              border: "none",
              fontWeight: "900",
              fontSize: "0.75rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              backgroundColor: filterStatus === status ? "#1b0b8c" : "#e2e8f0",
              color: filterStatus === status ? "#ffffff" : "#475569",
              transition: "all 0.2s",
              boxShadow:
                filterStatus === status
                  ? "0 4px 10px rgba(27,11,140,0.2)"
                  : "none",
              flexShrink: 0,
            }}
          >
            {status}
          </button>
        ))}
      </div>

      <div
        className="l-rt-list-wrapper"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          width: "100%",
          boxSizing: "border-box",
          marginTop: "0px",
          position: "relative",
          zIndex: 10,
          background: "transparent",
        }}
      >
        {loading ? (
          <p className="l-rt-loading">Loading assignments...</p>
        ) : filteredActiveReports.length === 0 ? (
          <p
            className="l-rt-loading"
            style={{ color: "#64748b", background: "transparent" }}
          >
            No active reports match this filter.
          </p>
        ) : (
          filteredActiveReports.map((report) => {
            const statusName =
              report.report_statuses?.name?.toUpperCase() || "UNKNOWN";
            let badgeBg = "#f1f5f9";
            let badgeColor = "#475569";
            let badgeBorder = "#cbd5e1";

            if (statusName === "PENDING") {
              badgeBg = "#fffbeb";
              badgeColor = "#b45309";
              badgeBorder = "#fef3c7";
            } else if (statusName === "IN PROGRESS") {
              badgeBg = "#eff6ff";
              badgeColor = "#1d4ed8";
              badgeBorder = "#bfdbfe";
            }

            return (
              <div
                key={`assigned-${report.id}`}
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
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 className="lineman-report-title">
                    {report.report_types?.name}
                  </h3>
                  <p className="lineman-report-address">
                    {formatAddress(report)}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeBorder}`,
                    padding: "6px 12px",
                    borderRadius: "50px",
                    fontSize: "0.7rem",
                    fontWeight: "900",
                    letterSpacing: "0.5px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {statusName}
                </div>
              </div>
            );
          })
        )}
      </div>

      <h2
        className="l-rt-section-title text-navy"
        style={{ marginTop: "30px" }}
      >
        GENERAL REPORTS
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginTop: "10px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {allReports.length === 0 && !loading ? (
          <p className="l-rt-loading" style={{ color: "#64748b" }}>
            No general reports in your branch.
          </p>
        ) : (
          allReports.map((report) => (
            <div
              key={`general-${report.id}`}
              className="lineman-report-card"
              style={{ width: "100%", boxSizing: "border-box", margin: 0 }}
            >
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

export default LinemanReportTab;
