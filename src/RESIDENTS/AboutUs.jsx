import React from "react";
import { createPortal } from "react-dom";
import {
  Zap,
  Users,
  ShieldCheck,
  GraduationCap,
  ChevronLeft,
} from "lucide-react";
import { translations } from "../components/translations"; // Added Dictionary

function AboutUs({ onBack }) {
  const currentLang = localStorage.getItem("appLanguage") || "English";
  const t = translations[currentLang];

  const aboutContent = (
    <div
      className="page-transition"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#f8fafc",
        zIndex: 999999,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          backgroundColor: "#ffffff",
          minHeight: "100vh",
          boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            backgroundColor: "#1b0b8c",
            padding: "60px 20px 40px",
            position: "relative",
            textAlign: "center",
            color: "#ffffff",
          }}
        >
          <button
            onClick={onBack}
            style={{
              position: "absolute",
              top: "20px",
              left: "15px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50px",
              padding: "6px 14px 6px 8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#ffffff",
              cursor: "pointer",
              backdropFilter: "blur(4px)",
            }}
          >
            <ChevronLeft size={22} strokeWidth={3} />
            <span
              style={{
                fontWeight: "900",
                fontSize: "0.9rem",
                letterSpacing: "0.5px",
              }}
            >
              {t.backBtn}
            </span>
          </button>

          <h1
            style={{
              margin: "0 0 10px 0",
              fontSize: "2rem",
              fontWeight: "900",
              letterSpacing: "1px",
            }}
          >
            {t.aboutTitle} <span style={{ color: "#facc15" }}>ISELCONNECT</span>
          </h1>
        </div>

        <div style={{ padding: "40px 30px", paddingBottom: "100px" }}>
          <h2
            style={{
              color: "#1e293b",
              fontSize: "1.3rem",
              fontWeight: "800",
              marginBottom: "15px",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "10px",
            }}
          >
            {t.ourMission}
          </h2>
          <p
            style={{
              color: "#475569",
              lineHeight: "1.6",
              marginBottom: "30px",
            }}
          >
            {t.missionText}
          </p>

          <h2
            style={{
              color: "#1e293b",
              fontSize: "1.3rem",
              fontWeight: "800",
              marginBottom: "20px",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "10px",
            }}
          >
            {t.keyFeatures}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "20px",
                backgroundColor: "#f1f5f9",
                borderRadius: "10px",
              }}
            >
              <Zap size={32} color="#ca8a04" style={{ marginBottom: "10px" }} />
              <h3
                style={{
                  fontSize: "1rem",
                  color: "#0f172a",
                  margin: "0 0 8px 0",
                }}
              >
                {t.rtAdvisories}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                {t.rtDesc}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "20px",
                backgroundColor: "#f1f5f9",
                borderRadius: "10px",
              }}
            >
              <Users
                size={32}
                color="#1d4ed8"
                style={{ marginBottom: "10px" }}
              />
              <h3
                style={{
                  fontSize: "1rem",
                  color: "#0f172a",
                  margin: "0 0 8px 0",
                }}
              >
                {t.crReports}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                {t.crDesc}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "20px",
                backgroundColor: "#f1f5f9",
                borderRadius: "10px",
              }}
            >
              <ShieldCheck
                size={32}
                color="#16a34a"
                style={{ marginBottom: "10px" }}
              />
              <h3
                style={{
                  fontSize: "1rem",
                  color: "#0f172a",
                  margin: "0 0 8px 0",
                }}
              >
                {t.fastRes}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                {t.fastDesc}
              </p>
            </div>
          </div>

          <h2
            style={{
              color: "#1e293b",
              fontSize: "1.3rem",
              fontWeight: "800",
              marginBottom: "15px",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "10px",
            }}
          >
            {t.theDeveloper}
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "15px",
              backgroundColor: "#eff6ff",
              padding: "20px",
              borderRadius: "10px",
              borderLeft: "4px solid #1b0b8c",
            }}
          >
            <GraduationCap
              size={40}
              color="#1b0b8c"
              style={{ flexShrink: 0 }}
            />
            <div>
              <p style={{ color: "#334155", lineHeight: "1.6", margin: 0 }}>
                {t.devText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(aboutContent, document.body);
}

export default AboutUs;
