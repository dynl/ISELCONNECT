import React from "react";
import { createPortal } from "react-dom";
import {
  Zap,
  Users,
  ShieldCheck,
  GraduationCap,
  ChevronLeft,
} from "lucide-react";

function AboutUs({ onBack }) {
  const aboutContent = (
    <div
      className="page-transition" /* PAGE TRANSITION ADDED HERE */
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
      {/* Main Content Wrapper */}
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          backgroundColor: "#ffffff",
          minHeight: "100vh",
          boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
        }}
      >
        {/* Header Section */}
        <div
          style={{
            backgroundColor: "#1b0b8c",
            padding: "60px 20px 40px",
            position: "relative",
            textAlign: "center",
            color: "#ffffff",
          }}
        >
          {/* FLOATING NATIVE-STYLE BACK BUTTON */}
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
              BACK
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
            ABOUT <span style={{ color: "#facc15" }}>ISELCONNECT</span>
          </h1>
          <p style={{ margin: 0, fontSize: "1rem", opacity: 0.9 }}>
            Bridging the gap between the community and utility services.
          </p>
        </div>

        {/* Content Section */}
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
            Our Mission
          </h2>
          <p
            style={{
              color: "#475569",
              lineHeight: "1.6",
              marginBottom: "30px",
            }}
          >
            ISELCONNECT is a hybrid web and mobile system designed to streamline
            communication between ISELCO-1 and its consumers. Our goal is to
            empower residents with real-time power outage advisories while
            providing a seamless, crowdsourced platform to report maintenance
            issues like leaning poles, sparking transformers, and line
            clearings.
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
            Key Features
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
                Real-Time Advisories
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                Advanced notifications for scheduled power interruptions.
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
                Crowdsourced Reports
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                Allowing residents to report field issues directly to linemen.
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
                Faster Resolutions
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                Directing reports to the right branch for rapid response.
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
            The Developer
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
                This platform was developed by{" "}
                <strong>
                  Allysa B. Reyes, Mark Justin F. Balisacan, and John Lloyd A.
                  Binuya
                </strong>
                , a student pursuing a Bachelor of Science in Information
                Technology with a major in Web and Mobile Application
                Development at Isabela State University. ISELCONNECT serves as a
                capstone project dedicated to improving public utility services
                and community safety through modern technology.
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