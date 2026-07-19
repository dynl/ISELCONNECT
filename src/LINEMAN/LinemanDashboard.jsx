import { useState } from "react";
import ReportTab from "./LinemanReportTab";
import HistoryTab from "./LinemanHistoryTab"; // <-- New Combined Tab
import NotificationTab from "./LinemanNotificationTab";
import ProfileTab from "./LinemanProfileTab";
import "../Lineman.css";

import { List, Archive, Bell, User } from "lucide-react";

function LinemanDashboard() {
  const [activeTab, setActiveTab] = useState("report");

  return (
    <div className="lineman-dashboard-layout">
      {/* Middle Wrapper (handles the scrolling perfectly) */}
      <div
        key={activeTab}
        className="animate-tab-switch l-rt-tab"
        style={{ width: "100%" }}
      >
        {activeTab === "report" && <ReportTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "notification" && <NotificationTab />}
        {activeTab === "profile" && <ProfileTab />}
      </div>

      {/* 4-Item PERSISTENT BOTTOM NAVIGATION */}
      <div className="bottom-nav-wrapper">
        <div className="pill-nav">
          <button
            className={`nav-item ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            <List size={24} strokeWidth={activeTab === "report" ? 2.5 : 2} />
            <span>Assigned</span>
          </button>

          <button
            className={`nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <Archive
              size={24}
              strokeWidth={activeTab === "history" ? 2.5 : 2}
            />
            <span>Logs</span>
          </button>

          <button
            className={`nav-item ${activeTab === "notification" ? "active" : ""}`}
            onClick={() => setActiveTab("notification")}
          >
            <Bell
              size={24}
              strokeWidth={activeTab === "notification" ? 2.5 : 2}
            />
            <span>Notifs</span>
          </button>

          <button
            className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <User size={24} strokeWidth={activeTab === "profile" ? 2.5 : 2} />
            <span>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LinemanDashboard;
