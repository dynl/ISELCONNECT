import React, { useState, useEffect } from "react";
import { Activity, Clock, ShieldAlert, ChevronLeft } from "lucide-react";
import { supabase } from "../supabaseClient";

function SystemLogsTab({ onBack }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // Fetch logs and join with the users table to get their names!
      const { data, error } = await supabase
        .from("system_logs")
        .select(`
          id,
          action_type,
          action_details,
          created_at,
          users ( first_name, last_name )
        `)
        .order("created_at", { ascending: false })
        .limit(100); // Limit to latest 100 logs so it doesn't slow down

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching system logs:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true
    });
  };

  // Helper to color-code different action types
  const getBadgeStyle = (type) => {
    if (type.includes("UPDATE")) return "log-badge-update";
    if (type.includes("SUBMIT") || type.includes("CREATE")) return "log-badge-create";
    if (type.includes("DELETE") || type.includes("ERROR")) return "log-badge-danger";
    return "log-badge-default";
  };

  return (
    <div className="system-logs-layout">
      
      {/* CURVED NAVY HEADER */}
      <div className="logs-header-section">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <ChevronLeft size={28} strokeWidth={3} />
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldAlert size={32} color="#f5c400" />
          <h2>SYSTEM LOGS</h2>
        </div>
      </div>

      <div className="logs-content-wrapper">
        <div className="logs-card">
          <div className="logs-card-header">
            <Activity size={20} color="#1b0b8c" />
            <h3>Recent Activity</h3>
          </div>

          {loading ? (
            <div className="logs-loading">Fetching system records...</div>
          ) : logs.length === 0 ? (
            <div className="logs-empty">No system logs recorded yet.</div>
          ) : (
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const userName = log.users 
                      ? `${log.users.first_name} ${log.users.last_name}` 
                      : "Unknown User";

                    return (
                      <tr key={log.id}>
                        <td className="log-time">
                          <Clock size={14} style={{ marginRight: '5px', marginBottom: '-2px' }}/>
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="log-user">{userName}</td>
                        <td>
                          <span className={`log-badge ${getBadgeStyle(log.action_type)}`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="log-details">{log.action_details}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemLogsTab;