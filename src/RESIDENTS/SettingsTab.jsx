import React, { useState } from "react";
import { ChevronLeft, Info, LogOut } from "lucide-react";
import { translations } from "./translations";
import { supabase } from "../supabaseClient";
import { logSystemAction } from "../utils/logger";
import AboutUs from "./AboutUs"; 

function SettingsTab({ onBack, onLogout }) {
  const savedLanguage = localStorage.getItem("appLanguage") || "English";
  const [language, setLanguage] = useState(savedLanguage);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false); 
  
  const t = translations[savedLanguage];

  const handleSave = async () => {
    localStorage.setItem("appLanguage", language);
    await logSystemAction(
      "UPDATE_SETTINGS",
      `Resident updated app settings (Language: ${language}).`,
    );
    alert(translations[language].saveAlert);
    window.location.reload();
  };

  const handleSignOut = async () => {
    await logSystemAction(
      "USER_LOGOUT",
      "Resident logged out of the application.",
    );
    await supabase.auth.signOut();
    if (onLogout) onLogout();
  };

  if (showAboutUs) {
    return <AboutUs onBack={() => setShowAboutUs(false)} />;
  }

  return (
    <div 
      className="settings-page page-transition"
      style={{ height: "100%", overflowY: "auto", paddingBottom: "120px", boxSizing: "border-box" }}
    >
      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">{t.signOutTitle}</h3>
            <p className="modal-text">{t.signOutText}</p>
            <div className="modal-buttons">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                {t.cancelBtn}
              </button>
              <button className="modal-btn confirm-btn" onClick={handleSignOut}>
                {t.confirmSignOutBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CURVED NAVY HEADER */}
      <div className="settings-header-section">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={28} strokeWidth={3} />
        </button>
        <h2>{t.settingsTitle}</h2>
      </div>

      <div className="settings-content-wrapper">
        {/* LANGUAGES CARD */}
        <div className="settings-card">
          <h2 className="settings-card-title">{t.languages}</h2>
          <h3
            className="section-label"
            style={{
              marginBottom: "10px",
              color: "#64748b",
              fontSize: "0.9rem",
            }}
          >
            {t.chooseLanguage}
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

        <button className="settings-save-btn" onClick={handleSave}>
          {t.save}
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

          <button
            onClick={() => setShowAboutUs(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "10px",
              marginTop: "20px",
              color: "#64748b",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              width: "100%",
              fontFamily: "inherit",
              fontSize: "1rem"
            }}
          >
            <Info size={20} />
            <span style={{ fontWeight: "bold" }}>{t.aboutUs}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsTab;