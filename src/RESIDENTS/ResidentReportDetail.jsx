import React, { useState, useEffect } from "react";
import { ChevronLeft, Save, Edit2, X, CheckCircle, MapPin } from "lucide-react";
import { supabase } from "../supabaseClient";
import { logSystemAction } from "../utils/logger";

function ResidentReportDetail({ report, onBack, onReportUpdated }) {
  const [loading, setLoading] = useState(false);
  const [reportTypes, setReportTypes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMap, setShowMap] = useState(false); // NEW STATE FOR MAP

  const isPending = report.report_statuses?.name?.toUpperCase() === "PENDING";

  const [formData, setFormData] = useState({
    report_type_id: report.report_type_id || "",
    landmark: report.landmark || "",
    description: report.description || "",
  });

  useEffect(() => {
    if (isPending) {
      const fetchTypes = async () => {
        const { data } = await supabase.from("report_types").select("id, name");
        if (data) setReportTypes(data);
      };
      fetchTypes();
    }
    
    // Hide navbar universally on this screen
    const navBar = document.querySelector(".bottom-nav-wrapper");
    if (navBar) navBar.style.display = "none";
    return () => {
      if (navBar) navBar.style.display = "";
    };
  }, [isPending]);

  const handleEditClick = () => {
    setFormData({
      report_type_id: report.report_type_id || "",
      landmark: report.landmark || "",
      description: report.description || "",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData({
      report_type_id: report.report_type_id || "",
      landmark: report.landmark || "",
      description: report.description || "",
    });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .update({
          report_type_id: parseInt(formData.report_type_id, 10),
          landmark: (formData.landmark || "").trim(),
          description: (formData.description || "").trim(),
        })
        .eq("id", report.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Update blocked by database security policies.");
      }

      await logSystemAction(
        "UPDATE_REPORT",
        `Resident updated report #${report.id}. New Landmark: ${formData.landmark.trim()}`,
      );

      setShowSuccessModal(true);
    } catch (err) {
      alert("Failed to update report. Please try again.\n" + err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentReportTypeName =
    reportTypes.find((t) => t.id === parseInt(formData.report_type_id))?.name ||
    report.report_types?.name;

  // FIXED GOOGLE MAPS URL FORMAT
  let mapSourceUrl = "";
  if (report.latitude && report.longitude) {
    mapSourceUrl = `https://maps.google.com/maps?q=${report.latitude},${report.longitude}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
  } else {
    const fallbackQuery = encodeURIComponent(`${formData.landmark || "Isabela"}, Isabela, Philippines`);
    mapSourceUrl = `https://maps.google.com/maps?q=${fallbackQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  // ==========================================
  // FULL SCREEN LOCATION MAP OVERLAY
  // ==========================================
  if (showMap) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "#f8fafc", zIndex: 99999, display: "flex", flexDirection: "column"
      }}>
        {/* MAP HEADER */}
        <div style={{
          display: "flex", alignItems: "center", padding: "20px 15px",
          background: "#1b0b8c", flexShrink: 0
        }}>
          <button
            onClick={() => setShowMap(false)}
            style={{
              background: "transparent", border: "none", padding: 0,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}
          >
            <ChevronLeft size={32} color="#fff" />
          </button>
          <span style={{ color: "#fff", fontWeight: "900", marginLeft: "10px", letterSpacing: "1px", fontSize: "1rem" }}>
            LOCATION MAP
          </span>
        </div>

        {/* MAP IFRAME CONTAINER */}
        <div style={{ flex: 1, width: "100%", position: "relative" }}>
          <iframe
            title="Report Location Map"
            width="100%"
            height="100%"
            style={{ border: 0, position: "absolute", top: 0, left: 0 }}
            loading="lazy"
            allowFullScreen
            src={mapSourceUrl}
          ></iframe>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-layout">
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-box">
            <div className="success-modal-header">
              <h2>UPDATED</h2>
            </div>
            <div className="success-modal-body">
              <p>
                Your report details have
                <br />
                been updated!
              </p>
              <button
                className="success-modal-btn"
                onClick={() => {
                  setShowSuccessModal(false);
                  setIsEditing(false);
                  if (onReportUpdated) onReportUpdated();
                }}
              >
                OK!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="detail-scrollable-content rrd-scrollable">
        <div className="detail-header">
          <button
            onClick={() => {
              isEditing ? handleCancelEdit() : onBack();
            }}
            className="back-btn"
          >
            <ChevronLeft size={28} strokeWidth={3} />
          </button>
          <h2>{isEditing ? "EDIT REPORT" : "REPORT DETAILS"}</h2>
        </div>

        <div className="detail-photo-section rrd-mb-20">
          {report.photo_url ? (
            <img
              src={report.photo_url}
              alt="Report issue"
              className="detail-photo"
            />
          ) : (
            <div className="no-photo">No Original Photo</div>
          )}
        </div>

        {/* ==========================================
            NEW "VIEW MAP" BUTTON
            ========================================== */}
        <button
          onClick={() => setShowMap(true)}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: "#1b0b8c",
            color: "#ffffff",
            border: "none",
            borderRadius: "50px",
            fontWeight: "900",
            fontSize: "1rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            boxShadow: "0 6px 15px rgba(27, 11, 140, 0.2)",
            transition: "transform 0.1s",
            marginBottom: "20px"
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
          onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <MapPin size={22} />
          VIEW LOCATION MAP
        </button>

        <div className="detail-info-section rrd-info-section">
          <div className="rrd-status-row">
            <h3 className="rrd-status-label">STATUS:</h3>
            <span
              className={`rrd-status-badge ${isPending ? "rrd-status-pending" : "rrd-status-resolved"}`}
            >
              {report.report_statuses?.name?.toUpperCase()}
            </span>
          </div>

          {isEditing ? (
            <div className="report-inputs rrd-inputs-wrapper">
              <p className="rrd-inputs-desc">
                Update your report details below.
              </p>

              <div className="edit-input-group">
                <label className="rrd-input-label">Report Type</label>
                <select
                  name="report_type_id"
                  value={formData.report_type_id}
                  onChange={handleInputChange}
                  className="edit-input custom-select"
                >
                  <option value="" disabled>
                    Select Report Type
                  </option>
                  {reportTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="edit-input-group">
                <label className="rrd-input-label">Landmark</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  className="edit-input"
                />
              </div>

              <div className="edit-input-group">
                <label className="rrd-input-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="edit-input rrd-textarea"
                />
              </div>

              <div className="rrd-btn-row">
                <button onClick={handleCancelEdit} className="rrd-btn-cancel">
                  <X size={20} /> CANCEL
                </button>
                <button
                  onClick={handleUpdateReport}
                  disabled={loading}
                  className="rrd-btn-save"
                >
                  <Save size={20} /> {loading ? "SAVING..." : "SAVE"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rrd-view-wrapper">
              {!isPending && (
                <p className="rrd-processing-msg" style={{ fontSize: "0.85rem", color: "#b45309", background: "#fffbeb", padding: "10px", borderRadius: "8px", marginBottom: "15px", fontWeight: "bold" }}>
                  This report is currently being processed and can no longer be
                  edited.
                </p>
              )}

              <div>
                <p className="rrd-field-label">Report Type</p>
                <p className="rrd-field-value">{currentReportTypeName}</p>
              </div>
              <hr className="rrd-hr" />

              <div>
                <p className="rrd-field-label">Landmark</p>
                <p className="rrd-field-value-normal">{formData.landmark}</p>
              </div>
              <hr className="rrd-hr" />

              {report.latitude && report.longitude && (
                <>
                  <div>
                    <p className="rrd-field-label">Coordinates</p>
                    <p
                      className="rrd-field-value-normal"
                      style={{ fontFamily: "monospace", color: "#64748b" }}
                    >
                      {report.latitude}, {report.longitude}
                    </p>
                  </div>
                  <hr className="rrd-hr" />
                </>
              )}

              <div>
                <p className="rrd-field-label">Description</p>
                <p className="rrd-field-value-normal">
                  {formData.description || "No description provided."}
                </p>
              </div>

              {isPending && (
                <button onClick={handleEditClick} className="rrd-edit-btn">
                  <Edit2 size={20} /> EDIT REPORT
                </button>
              )}

              {report.resolved_photo_url && (
                <div className="rrd-evidence-box">
                  <div className="rrd-evidence-header">
                    <CheckCircle size={20} color="#16a34a" />
                    <h3 className="rrd-evidence-title">FIXED EVIDENCE</h3>
                  </div>
                  <img
                    src={report.resolved_photo_url}
                    alt="Resolved Issue Evidence"
                    className="rrd-evidence-img"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResidentReportDetail;