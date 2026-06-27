import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { translations } from "./translations";
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
      const { data: advisoryData, error: advisoryError } = await supabase
        .from("power_advisories")
        .select("id, affected_areas, schedule_start, schedule_end")
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
    const dateKey = new Date(current.schedule_start)
      .toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(current);
    return acc;
  }, {});

  return (
    <div className="home-tab">
      <div className="home-section" style={{ paddingTop: "20px" }}>
        <h2 className="section-heading" style={{ textTransform: "uppercase" }}>
          <span className="text-yellow">{t.powerYellow}</span>{" "}
          <span className="text-navy">{t.advisoryNavy}</span>
        </h2>

        {loading ? (
          <p className="home-loading-text">Loading advisories...</p>
        ) : Object.keys(groupedAdvisories).length === 0 ? (
          <p className="home-empty-text">{t.noAdvisories}</p>
        ) : (
          Object.keys(groupedAdvisories).map((dateKey) => (
            <div key={dateKey} style={{ marginBottom: "25px" }}>
              
              {/* NEW YELLOW DATE PILL */}
              <div className="advisory-date-pill bg-yellow text-navy">
                {dateKey}
              </div>

              {/* NEW SOLID NAVY GRID WITH YELLOW DIVIDER */}
              <div className="advisory-grid bg-navy text-white">
                
                {/* Left Column: Barangay */}
                <div className="advisory-col-barangay">
                  <h3 className="advisory-col-header">{t.barangay}</h3>
                  {groupedAdvisories[dateKey].map((adv) => (
                    <p key={`area-${adv.id}`} className="advisory-item-text">
                      {adv.affected_areas}
                    </p>
                  ))}
                </div>
                
                {/* Right Column: Time | Date */}
                <div className="advisory-col-time">
                  <h3 className="advisory-col-header">{t.timeDate}</h3>
                  {groupedAdvisories[dateKey].map((adv) => (
                    <p key={`time-${adv.id}`} className="advisory-item-text">
                      {formatTime(adv.schedule_start)} -{" "}
                      {formatTime(adv.schedule_end)}
                    </p>
                  ))}
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdvisoryTab;