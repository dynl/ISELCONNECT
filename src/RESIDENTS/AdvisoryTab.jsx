import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { translations } from "../components/translations";
import LoadingScreen from "../components/LoadingScreen"; // Added custom loading
import "../Resident.css";

function AdvisoryTab() {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentLang = localStorage.getItem("appLanguage") || "English";
  const t = translations[currentLang];

  useEffect(() => {
    fetchAdvisories();
  }, []);

  const fetchAdvisories = async () => {
    try {
      setLoading(true);
      const currentDateTime = new Date().toISOString();

      const { data: advisoryData, error: advisoryError } = await supabase
        .from("power_advisories")
        .select(
          "id, affected_areas, schedule_start, schedule_end, municipalities(name)",
        )
        .gte("schedule_end", currentDateTime)
        .order("schedule_start", { ascending: true });

      if (!advisoryError && advisoryData) setAdvisories(advisoryData);
    } catch (error) {
      console.error("Error fetching advisories:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase()
      .replace(" ", "");
  };

  const groupedAdvisories = advisories.reduce((acc, current) => {
    const dateStr = new Date(current.schedule_start)
      .toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
    const timeStr = `${formatTime(current.schedule_start)} - ${formatTime(current.schedule_end)}`;
    const groupKey = `${dateStr}|${timeStr}`;

    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(current);
    return acc;
  }, {});

  return (
    <div className="home-tab">
      <div
        className="home-section"
        style={{ paddingTop: "20px", paddingBottom: "100px" }}
      >
        <h2
          className="section-heading"
          style={{
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          <span className="text-yellow" style={{ fontWeight: "900" }}>
            {t.powerYellow}
          </span>{" "}
          <span className="text-navy" style={{ fontWeight: "900" }}>
            {t.advisoryNavy}
          </span>
        </h2>

        {loading ? (
          <LoadingScreen message={t.loadingAdvisories} />
        ) : Object.keys(groupedAdvisories).length === 0 ? (
          <p
            className="home-empty-text"
            style={{ textAlign: "center", color: "#64748b" }}
          >
            {t.noAdvisories}
          </p>
        ) : (
          Object.keys(groupedAdvisories).map((groupKey) => {
            const [dateKey, timeKey] = groupKey.split("|");
            return (
              <div key={groupKey} style={{ marginBottom: "30px" }}>
                <div
                  style={{
                    backgroundColor: "#fde047",
                    borderRadius: "20px",
                    padding: "15px",
                    textAlign: "center",
                    color: "#1b0b8c",
                    marginBottom: "15px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {dateKey}
                  </h3>
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: "0.95rem",
                      fontWeight: "700",
                    }}
                  >
                    {timeKey}
                  </p>
                </div>
                {groupedAdvisories[groupKey].map((adv) => {
                  const barangays = adv.affected_areas
                    ? adv.affected_areas.split(",").map((b) => b.trim())
                    : [];
                  const municipalityName =
                    adv.municipalities?.name || "MUNICIPALITY";

                  return (
                    <div
                      key={adv.id}
                      style={{
                        backgroundColor: "#1b0b8c",
                        borderRadius: "20px",
                        padding: "20px",
                        color: "#ffffff",
                        marginBottom: "12px",
                        boxShadow: "0 6px 15px rgba(27, 11, 140, 0.15)",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 15px 0",
                          textAlign: "center",
                          fontSize: "1.1rem",
                          fontWeight: "900",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        {municipalityName}
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          rowGap: "8px",
                          columnGap: "15px",
                          textAlign: "center",
                        }}
                      >
                        {barangays.map((brgy, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: "0.9rem",
                              color: "#e2e8f0",
                              fontWeight: "500",
                            }}
                          >
                            {brgy}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdvisoryTab;
