import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Phone, Search, AlertTriangle, ChevronLeft } from "lucide-react";

function HotlinesTab({ onBack }) {
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHotlines = async () => {
      try {
        setLoading(true);
        const { data, error: dbError } = await supabase
          .from("iselco_branch")
          .select("branch_id, branch_name, branch_hotline")
          .order("branch_name", { ascending: true });

        if (dbError) {
          console.error("Supabase Error:", dbError);
          throw dbError;
        }

        if (data) {
          // 1. Find the Main Office record
          const mainOffice = data.find(
            (branch) => branch.branch_name === "ISELCO-1 Main Office",
          );

          // 2. Get all other branches EXCEPT the Main Office
          const otherBranches = data.filter(
            (branch) => branch.branch_name !== "ISELCO-1 Main Office",
          );

          // 3. Combine them, forcing the Main Office to index 0 (the top)
          const sortedBranches = mainOffice
            ? [mainOffice, ...otherBranches]
            : otherBranches;

          setBranches(sortedBranches);
        } else {
          setBranches([]);
        }
      } catch (err) {
        console.error("Error fetching hotlines:", err.message);
        setError("Failed to load hotline numbers.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotlines();
  }, []);

  const filteredBranches = branches.filter((branch) =>
    branch.branch_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatPhoneNumber = (num) => {
    if (!num) return "N/A";
    const numStr = num.toString();
    return numStr.startsWith("9") ? `0${numStr}` : numStr;
  };

  return (
    <div
      className="bg-navy-tab"
      style={{
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        paddingTop: 0 /* Forces the container to ignore any default CSS top padding */,
      }}
    >
      {/* =========================================
          STICKY HEADER & SEARCH SECTION 
      ========================================= */}
      <div style={{ padding: "15px 20px 15px 20px", flexShrink: 0 }}>
        {" "}
        {/* Reduced top padding from 30px to 15px */}
        {/* Back Button & Title Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
            }}
          >
            <ChevronLeft size={32} color="#facc15" />
          </button>
          <div style={{ flex: 1, textAlign: "center", paddingRight: "32px" }}>
            <h1
              className="report-title text-yellow"
              style={{ marginBottom: 0, fontSize: "1.2rem" }}
            >
              EMERGENCY
            </h1>
            <h2
              className="text-white"
              style={{
                margin: 0,
                fontWeight: "900",
                fontSize: "1.2rem",
                letterSpacing: "1px",
              }}
            >
              HOTLINES
            </h2>
          </div>
        </div>
        {/* Search Bar */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            className="rounded-input"
            placeholder="Search branch office..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: "50px",
              width: "100%",
              boxSizing: "border-box",
              margin: 0,
            }}
          />
          <Search
            size={20}
            color="#1b0b8c"
            style={{
              position: "absolute",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
        </div>
      </div>

      {/* =========================================
          SCROLLABLE LIST SECTION 
      ========================================= */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px 20px" }}>
        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#ef4444",
              padding: "12px",
              borderRadius: "30px",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "0.85rem",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "10px",
            background: "rgba(255, 223, 132, 0.1)",
            border: "1px solid var(--accent-yellow)",
            padding: "15px",
            borderRadius: "20px",
            marginBottom: "25px",
          }}
        >
          <AlertTriangle
            color="var(--accent-yellow)"
            size={24}
            style={{ flexShrink: 0 }}
          />
          <p
            style={{
              color: "#ffffff",
              margin: 0,
              fontSize: "0.8rem",
              fontWeight: "600",
              lineHeight: "1.4",
            }}
          >
            Tap on any branch hotline card below to directly call the office for
            immediate assistance regarding power hazards or line faults.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
            <p
              style={{
                color: "#ffffff",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Loading hotlines...
            </p>
          ) : filteredBranches.length === 0 ? (
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                textAlign: "center",
                fontSize: "0.9rem",
              }}
            >
              No branches found matching your search.
            </p>
          ) : (
            filteredBranches.map((branch) => (
              <a
                key={branch.branch_id}
                href={`tel:${formatPhoneNumber(branch.branch_hotline)}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  className="lineman-report-card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                    margin: 0,
                    padding: "18px 20px",
                    background: "#ffffff",
                    borderRadius: "20px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        color: "var(--primary-navy)",
                        margin: "0 0 4px 0",
                        fontSize: "1.05rem",
                        fontWeight: "900",
                      }}
                    >
                      {branch.branch_name}
                    </h3>
                    <p
                      style={{
                        color: "#475569",
                        margin: 0,
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {formatPhoneNumber(branch.branch_hotline)}
                    </p>
                  </div>

                  <div
                    style={{
                      backgroundColor: "rgba(27, 11, 140, 0.05)",
                      width: "45px",
                      height: "45px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Phone
                      size={20}
                      color="var(--primary-navy)"
                      fill="var(--primary-navy)"
                    />
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default HotlinesTab;
