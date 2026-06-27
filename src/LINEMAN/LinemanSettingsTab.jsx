import React, { useState } from "react";
import { ChevronLeft, Info, LogOut } from "lucide-react";
import { supabase } from "../supabaseClient";
import { logSystemAction } from "../utils/logger";
import "../Lineman.css";

function LinemanSettingsTab({ onBack, onLogout }) {
  const savedLanguage = localStorage.getItem("appLanguage") || "English";
  const [fontSize, setFontSize] = useState("2");
  const [language, setLanguage] = useState(savedLanguage);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSaveSettings = async () => {
    localStorage.setItem("appLanguage", language);
    await logSystemAction(
      "UPDATE_SETTINGS",
      `Lineman updated app settings (Language: ${language}).`,
    );
    alert("Settings saved successfully!");
    window.location.reload();
  };

  const handleSignOut = async () => {
    try {
      await logSystemAction(
        "USER_LOGOUT",
        "Lineman logged out of the application.",
      );
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      if (onLogout) onLogout();
    } catch (error) {
      alert("Error logging out: " + error.message);
    }
  };

  return (
    <div className="settings-page">
      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="custom-alert-overlay">
          <div className="custom-alert-box">
            <div className="custom-alert-header alert-header-danger">
              <h2>SIGN OUT</h2>
            </div>
            <div className="custom-alert-body">
              <p>Are you sure you want to log out of your account?</p>
              <div className="custom-alert-buttons">
                <button
                  className="alert-btn no-btn"
                  onClick={() => setShowLogoutModal(false)}
                >
                  CANCEL
                </button>
                <button
                  className="alert-btn yes-btn"
                  style={{ backgroundColor: "#ef4444" }}
                  onClick={handleSignOut}
                >
                  LOG OUT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CURVED NAVY HEADER */}
      <div className="settings-header-section">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={28} strokeWidth={3} />
        </button>
        <h2>SETTINGS</h2>
      </div>

      <div className="settings-content-wrapper">
        {/* APPEARANCE CARD */}
        <div className="settings-card">
          <h2 className="settings-card-title">Appearance</h2>
          <h3
            className="section-label"
            style={{
              marginBottom: "10px",
              color: "#64748b",
              fontSize: "0.9rem",
            }}
          >
            Font Size
          </h3>
          <div className="font-slider-container">
            <div className="font-labels">
              <span className="st-font-label-sm">Aa</span>
              <span className="st-font-label-md">Aa</span>
              <span className="st-font-label-lg">Aa</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="font-slider"
            />
          </div>
        </div>

        {/* LANGUAGES CARD */}
        <div className="settings-card">
          <h2 className="settings-card-title">Languages</h2>
          <h3
            className="section-label"
            style={{
              marginBottom: "10px",
              color: "#64748b",
              fontSize: "0.9rem",
            }}
          >
            Choose Language
          </h3>
          <select
            className="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="English">English</option>
            <option value="Tagalog">Tagalog</option>
          </select>
        </div>

        <button className="settings-save-btn" onClick={handleSaveSettings}>
          SAVE CHANGES
        </button>

        {/* ACCOUNT & ABOUT ACTIONS */}
        <div className="settings-card" style={{ marginTop: "15px" }}>
          <h2 className="settings-card-title">Account</h2>
          <button
            className="settings-logout-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={20} /> Log Out Account
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "20px",
              color: "#64748b",
            }}
          >
            <Info size={20} />
            <span style={{ fontWeight: "bold" }}>About Us</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LinemanSettingsTab;
