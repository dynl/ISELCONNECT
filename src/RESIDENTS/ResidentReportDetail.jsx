import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ChevronLeft, Save, Edit2, X, CheckCircle, MapPin } from "lucide-react";
import { supabase } from "../supabaseClient";
import { logSystemAction } from "../utils/logger";
import { translations } from "../components/translations";

function ResidentReportDetail({ report, onBack, onReportUpdated }) {
  const currentLang = localStorage.getItem("appLanguage") || "English";
  const t = translations[currentLang];

  const [loading, setLoading] = useState(false);
  const [reportTypes, setReportTypes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

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
    const navBar = document.querySelector(".bottom-nav-wrapper");
    if (navBar) navBar.style.display = "none";
    return () => {
      if (navBar) navBar.style.display = "";
    };
  }, [isPending]);

  useEffect(() => {
    if (!showMap) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }
    const lat = report.latitude ? parseFloat(report.latitude) : 16.7805;
    const lon = report.longitude ? parseFloat(report.longitude) : 121.6508;

    setTimeout(() => {
      if (!mapContainerRef.current) return;
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `<div style="background-color: #facc15; width: 22px; height: 22px; border-radius: 50%; border: 4px solid #1b0b8c; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
        }).setView([lat, lon], 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapRef.current);
      } else {
        mapRef.current.setView([lat, lon], 16);
      }
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = L.marker([lat, lon], { icon: customIcon }).addTo(
        mapRef.current,
      );
    }, 100);
  }, [showMap, report.latitude, report.longitude]);

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
      if (!data || data.length === 0)
        throw new Error("Update blocked by database security policies.");
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
    reportTypes.find((type) => type.id === parseInt(formData.report_type_id))
      ?.name || report.report_types?.name;

  if (showMap) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "#f8fafc",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "20px 15px",
            background: "#1b0b8c",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setShowMap(false)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={32} color="#fff" />
          </button>
          <span
            style={{
              color: "#fff",
              fontWeight: "900",
              marginLeft: "10px",
              letterSpacing: "1px",
              fontSize: "1rem",
            }}
          >
            {t.viewLocationMap}
          </span>
        </div>
        <div style={{ flex: 1, width: "100%", position: "relative" }}>
          <div
            ref={mapContainerRef}
            style={{ position: "absolute", top: 0, bottom: 0, width: "100%" }}
          />
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
          <h2>{isEditing ? t.editReportTitle : t.reportDetailsTitle}</h2>
        </div>

        <div className="detail-photo-section rrd-mb-20">
          {report.photo_url ? (
            <img
              src={report.photo_url}
              alt="Report issue"
              className="detail-photo"
            />
          ) : (
            <div className="no-photo">{t.noOriginalPhoto}</div>
          )}
        </div>

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
            marginBottom: "20px",
          }}
        >
          <MapPin size={22} />
          {t.viewLocationMap}
        </button>

        <div className="detail-info-section rrd-info-section">
          <div className="rrd-status-row">
            <h3 className="rrd-status-label">{t.statusLabel}</h3>
            <span
              className={`rrd-status-badge ${isPending ? "rrd-status-pending" : "rrd-status-resolved"}`}
            >
              {report.report_statuses?.name?.toUpperCase()}
            </span>
          </div>

          {isEditing ? (
            <div className="report-inputs rrd-inputs-wrapper">
              <p className="rrd-inputs-desc">{t.updateReportDesc}</p>
              <div className="edit-input-group">
                <label className="rrd-input-label">{t.reportType}</label>
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
                  <X size={20} /> {t.cancelBtn}
                </button>
                <button
                  onClick={handleUpdateReport}
                  disabled={loading}
                  className="rrd-btn-save"
                >
                  <Save size={20} /> {loading ? t.savingBtn : t.saveBtn}
                </button>
              </div>
            </div>
          ) : (
            <div className="rrd-view-wrapper">
              {!isPending && (
                <p
                  className="rrd-processing-msg"
                  style={{
                    fontSize: "0.85rem",
                    color: "#b45309",
                    background: "#fffbeb",
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    fontWeight: "bold",
                  }}
                >
                  {t.processingMsg}
                </p>
              )}
              <div>
                <p className="rrd-field-label">{t.reportType}</p>
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
                    <p className="rrd-field-label">{t.coordinatesLabel}</p>
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
                  {formData.description || t.noDescProvided}
                </p>
              </div>
              {isPending && (
                <button onClick={handleEditClick} className="rrd-edit-btn">
                  <Edit2 size={20} /> {t.editReportTitle}
                </button>
              )}
              {report.resolved_photo_url && (
                <div className="rrd-evidence-box">
                  <div className="rrd-evidence-header">
                    <CheckCircle size={20} color="#16a34a" />
                    <h3 className="rrd-evidence-title">{t.fixedEvidence}</h3>
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
