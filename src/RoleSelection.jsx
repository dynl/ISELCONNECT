import React from "react";
import { HardHat, Users } from "lucide-react";
import logo from "./assets/ISELCONNECT.png";
import "./RoleSelection.css";

function RoleSelection({ onSelectResident, onSelectLineman }) {
  return (
    <div className="role-selection-layout">
      <div className="role-top-section">
        {/* The overlay div has been removed from here so the background is crisp! */}
        <img src={logo} alt="ISELCONNECT" className="role-logo" />
      </div>

      <div className="role-bottom-section">
        <div className="role-handle"></div>

        <h2 className="role-title">CHOOSE YOUR ROLE</h2>
        <p className="role-subtitle">Select your account type to continue</p>

        <div className="role-cards-container">
          <button className="role-card role-card-lineman" onClick={onSelectLineman}>
            <div className="role-icon-wrapper">
              <HardHat size={42} color="#1b0b8c" strokeWidth={1.8} />
            </div>
            <span className="role-label">LINEMAN</span>
            <span className="role-description">For field staff and utility workers</span>
          </button>

          <button className="role-card role-card-resident" onClick={onSelectResident}>
            <div className="role-icon-wrapper">
              <Users size={42} color="#1b0b8c" strokeWidth={1.8} />
            </div>
            <span className="role-label">RESIDENT</span>
            <span className="role-description">For community users and reporters</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;