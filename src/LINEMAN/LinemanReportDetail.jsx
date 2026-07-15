import React, { useState, useEffect, useRef, useCallback } from "react";
import { translations } from "../components/translations";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Webcam from "react-webcam";
import {
  ChevronLeft,
  Clock,
  Wrench,
  CheckCircle,
  MapPin,
  Users,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { logSystemAction } from "../utils/logger";
import "../Lineman.css";

const base64ToBlob = (base64, mimeType = "image/jpeg") => {
  const byteCharacters = atob(base64.split(",")[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
};

function LinemanReportDetail({ report, onBack, onReportUpdated }) {
  const currentLang = localStorage.getItem("appLanguage") || "English";
  const t = translations[currentLang];

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const webcamRef = useRef(null);

  const [activeStatus, setActiveStatus] = useState(
    report.report_statuses?.name?.toUpperCase() || "PENDING",
  );

  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --- NEW RESOLUTION FLOW STATES ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRemarksOpen, setIsRemarksOpen] = useState(false);
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [resolutionRemarks, setResolutionRemarks] = useState("");
  // ----------------------------------

  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companions, setCompanions] = useState([]);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [loadingAssignmentDetails, setLoadingAssignmentDetails] =
    useState(true);

  const isResolved = activeStatus === "RESOLVED";

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      if (!report?.id) return;
      try {
        setLoadingAssignmentDetails(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("assignments")
          .select(`lineman_id, admin_remarks, users ( first_name, last_name )`)
          .eq("report_id", report.id);
        if (error) throw error;
        if (data) {
          const otherLinemen = data
            .filter((a) => a.lineman_id !== user?.id)
            .map((a) =>
              `${a.users?.first_name || ""} ${a.users?.last_name || ""}`.trim(),
            )
            .filter(Boolean);
          setCompanions(otherLinemen);
          const myAssignment =
            data.find((a) => a.lineman_id === user?.id) || data[0];
          if (myAssignment && myAssignment.admin_remarks)
            setAdminRemarks(myAssignment.admin_remarks);
        }
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoadingAssignmentDetails(false);
      }
    };
    fetchAssignmentDetails();
  }, [report.id]);

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
        html: `<div style="background-color: #ea4335; width: 22px; height: 22px; border-radius: 50%; border: 4px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
        }).setView([lat, lon], 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
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
  }, [report, showMap]);

  useEffect(() => {
    const navBar = document.querySelector(".bottom-nav-wrapper");
    if (navBar) navBar.style.display = "none";
    return () => {
      if (navBar) navBar.style.display = "";
    };
  }, []);

  const handleStatusClick = (statusName) => {
    if (statusName === activeStatus || isResolved) return;

    // NEW FLOW: If RESOLVED is clicked, bypass the alert and instantly open the camera
    if (statusName === "RESOLVED") {
      setPendingStatusUpdate("RESOLVED");
      setIsCameraOpen(true);
      return;
    }

    setPendingStatusUpdate(statusName);
    setShowStatusAlert(true);
  };

  const captureEvidence = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setEvidencePhoto(imageSrc);
        setIsCameraOpen(false);

        // After photo is taken, smoothly transition to the Remarks screen
        if (pendingStatusUpdate === "RESOLVED") {
          setIsRemarksOpen(true);
        }
      }
    }
  }, [webcamRef, pendingStatusUpdate]);

  const confirmStatusUpdate = async () => {
    setIsSubmitting(true);
    try {
      let newStatusId = 1;
      if (pendingStatusUpdate === "PENDING") newStatusId = 1;
      if (pendingStatusUpdate === "IN PROGRESS") newStatusId = 2;
      if (pendingStatusUpdate === "RESOLVED") newStatusId = 3;

      const updatePayload = { status_id: newStatusId };

      // --- APPEND PHOTO AND REMARKS IF RESOLVED ---
      if (pendingStatusUpdate === "RESOLVED") {
        if (!evidencePhoto) throw new Error("Evidence photo is missing.");
        if (!resolutionRemarks.trim())
          throw new Error("Remarks are required to resolve.");

        const fileName = `resolved-${report.id}-${Date.now()}.jpg`;
        const imageBlob = base64ToBlob(evidencePhoto);

        const { error: uploadError } = await supabase.storage
          .from("report_photos")
          .upload(fileName, imageBlob, { contentType: "image/jpeg" });

        if (uploadError) throw new Error("Failed to upload evidence photo.");

        const { data: publicUrlData } = supabase.storage
          .from("report_photos")
          .getPublicUrl(fileName);

        updatePayload.resolved_photo_url = publicUrlData.publicUrl;

        // Note: Ensure you have a 'remarks' column in your 'reports' table for this!
        updatePayload.remarks = resolutionRemarks.trim();
      }

      const { data, error } = await supabase
        .from("reports")
        .update(updatePayload)
        .eq("id", report.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("Update blocked by Supabase!");

      if (
        pendingStatusUpdate === "IN PROGRESS" ||
        pendingStatusUpdate === "RESOLVED"
      ) {
        const assignmentPayload =
          pendingStatusUpdate === "IN PROGRESS"
            ? { arrival_at: new Date().toISOString() }
            : { completion_at: new Date().toISOString() };

        await supabase
          .from("assignments")
          .update(assignmentPayload)
          .eq("report_id", report.id);
      }

      await logSystemAction(
        "UPDATE_REPORT_STATUS",
        `Lineman updated report #${report.id} status to ${pendingStatusUpdate}.`,
      );

      setActiveStatus(pendingStatusUpdate);
      setShowSuccessModal(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
      setShowStatusAlert(false);
      setIsRemarksOpen(false);
      setPendingStatusUpdate(null);
    }
  };

  // ==========================================
  // FULL SCREEN OVERLAYS
  // ==========================================

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
            {t.locationMap}
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

  if (isCameraOpen) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "#000",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 15px",
            background: "#000",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => {
              setIsCameraOpen(false);
              setPendingStatusUpdate(null);
            }}
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
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            Proof of Resolution
          </span>
          <div style={{ width: 32 }}></div>
        </div>
        <div
          style={{
            flex: 1,
            position: "relative",
            width: "100%",
            background: "#111",
            overflow: "hidden",
          }}
        >
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            mirrored={true}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        <div
          style={{
            background: "#e2e8f0",
            padding: "20px 15px 40px 15px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
            borderTopLeftRadius: "30px",
            borderTopRightRadius: "30px",
          }}
        >
          <p
            style={{
              margin: "0 0 15px 0",
              color: "#111",
              fontWeight: "900",
              fontSize: "0.9rem",
            }}
          >
            {t.captureTheFix}
          </p>
          <button
            onClick={captureEvidence}
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "#cbd5e1",
              border: "5px solid #fff",
              boxShadow: "0 0 0 3px #000",
              cursor: "pointer",
            }}
          ></button>
        </div>
      </div>
    );
  }

  if (isRemarksOpen) {
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
            justifyContent: "space-between",
            padding: "20px 15px",
            background: "#1b0b8c",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => {
              setIsRemarksOpen(false);
              setIsCameraOpen(true);
            }} // Goes back to camera to retake photo
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
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Resolution Remarks
          </span>
          <div style={{ width: 32 }}></div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "220px",
              borderRadius: "15px",
              overflow: "hidden",
              marginBottom: "20px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              border: "2px solid #cbd5e1",
            }}
          >
            <img
              src={evidencePhoto}
              alt="Resolution Proof"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <label
            style={{
              color: "#1e293b",
              fontWeight: "900",
              marginBottom: "10px",
              fontSize: "0.95rem",
              textTransform: "uppercase",
            }}
          >
            Action Taken / Remarks:
          </label>
          <textarea
            value={resolutionRemarks}
            onChange={(e) => setResolutionRemarks(e.target.value)}
            placeholder="Describe exactly what was fixed..."
            style={{
              width: "100%",
              height: "140px",
              padding: "15px",
              borderRadius: "15px",
              border: "1px solid #cbd5e1",
              fontSize: "1rem",
              resize: "none",
              marginBottom: "20px",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />

          <button
            onClick={confirmStatusUpdate}
            disabled={isSubmitting || !resolutionRemarks.trim()}
            style={{
              marginTop: "auto",
              backgroundColor: "#1b0b8c",
              color: "#fff",
              padding: "18px",
              borderRadius: "30px",
              fontWeight: "900",
              fontSize: "1rem",
              border: "none",
              cursor:
                isSubmitting || !resolutionRemarks.trim()
                  ? "not-allowed"
                  : "pointer",
              opacity: isSubmitting || !resolutionRemarks.trim() ? 0.6 : 1,
              textTransform: "uppercase",
              letterSpacing: "1px",
              boxShadow: "0 6px 15px rgba(27, 11, 140, 0.2)",
            }}
          >
            {isSubmitting ? "Saving Resolution..." : "Confirm & Resolve Report"}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN COMPONENT RENDER
  // ==========================================

  return (
    <div className="detail-layout page-transition">
      {showStatusAlert && (
        <div className="custom-alert-overlay">
          <div className="custom-alert-box">
            <div className="custom-alert-header">
              <h2>{t.confirmationTitle}</h2>
            </div>
            <div className="custom-alert-body">
              <p>
                {t.confirmStatusUpdate}{" "}
                {pendingStatusUpdate === "IN PROGRESS"
                  ? t.inProgress
                  : t.pending}
                ?
              </p>
              <div className="custom-alert-buttons">
                <button
                  className="alert-btn no-btn"
                  onClick={() => {
                    setShowStatusAlert(false);
                    setPendingStatusUpdate(null);
                  }}
                  disabled={isSubmitting}
                >
                  {t.noBtn}
                </button>
                <button
                  className="alert-btn yes-btn"
                  onClick={confirmStatusUpdate}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t.savingBtn : t.yesBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-box">
            <div className="success-modal-header">
              <h2>{t.updatedTitle}</h2>
            </div>
            <div className="success-modal-body">
              <p>
                {t.statusUpdatedText}{" "}
                {activeStatus === "RESOLVED"
                  ? t.resolved
                  : activeStatus === "IN PROGRESS"
                    ? t.inProgress
                    : t.pending}
                !
              </p>
              <button
                className="success-modal-btn"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onReportUpdated) onReportUpdated();
                }}
              >
                OK!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="detail-scrollable-content">
        <div className="detail-header">
          <button onClick={onBack} className="back-btn">
            <ChevronLeft size={28} strokeWidth={3} />
          </button>
          <h2>{report.report_types?.name || t.reportDetailsTitle}</h2>
        </div>

        <div className="detail-photo-section">
          {report.photo_url ? (
            <img
              src={report.photo_url}
              alt="Report issue"
              className="detail-photo"
            />
          ) : (
            <div className="no-photo">{t.noPhotoProvided}</div>
          )}
        </div>

        <div className="detail-info-section">
          <p>
            <strong>{t.descriptionLabel}</strong>{" "}
            {report.description || t.noDescProvided}
          </p>
          <p>
            <strong>{t.landmarkLabel}</strong> {report.landmark || "N/A"}
          </p>
        </div>

        <div
          className="detail-coords-section"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "15px",
          }}
        >
          {adminRemarks && (
            <div
              style={{
                background: "#fffbeb",
                padding: "16px",
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                marginBottom: "5px",
                border: "1px solid #fde68a",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <MessageSquare size={20} color="#b45309" />
                <h3
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: "900",
                    color: "#b45309",
                    letterSpacing: "0.5px",
                  }}
                >
                  {t.adminRemarks}
                </h3>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#78350f",
                  fontWeight: "600",
                  lineHeight: "1.4",
                }}
              >
                {adminRemarks}
              </p>
            </div>
          )}

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
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.98)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <MapPin size={22} /> {t.viewLocationMap}
          </button>

          <div className="coords-row" style={{ marginTop: "10px" }}>
            <span>
              <strong>LO:</strong> {report.longitude || "N/A"}
            </span>
            <span>
              <strong>LA:</strong> {report.latitude || "N/A"}
            </span>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "16px",
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
              marginTop: "10px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <Users size={20} color="#1b0b8c" />
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: "900",
                  color: "#1b0b8c",
                  letterSpacing: "0.5px",
                }}
              >
                {t.assignedCompanions}
              </h3>
            </div>
            {loadingAssignmentDetails ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "#64748b",
                  fontStyle: "italic",
                }}
              >
                {t.loadingTeam}
              </p>
            ) : companions.length > 0 ? (
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {companions.map((comp, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: "0.9rem",
                      color: "#334155",
                      fontWeight: "700",
                    }}
                  >
                    {comp}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "#64748b",
                  fontWeight: "600",
                }}
              >
                {t.onlyLineman}
              </p>
            )}
          </div>
        </div>
      </div>

      {isResolved && (
        <div
          style={{
            textAlign: "center",
            padding: "8px",
            background: "#fef2f2",
            color: "#ef4444",
            fontSize: "0.8rem",
            fontWeight: "bold",
            borderTop: "1px solid #fee2e2",
            zIndex: 10,
          }}
        >
          {t.reportResolved}
        </div>
      )}

      <div className="status-action-bar">
        <button
          className={`status-icon-btn btn-pending ${activeStatus === "PENDING" ? "active active-pending" : ""}`}
          onClick={() => handleStatusClick("PENDING")}
          disabled={isResolved}
          style={isResolved ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          <Clock size={28} className="status-icon" />
          <span>{t.pending}</span>
        </button>
        <button
          className={`status-icon-btn btn-inprogress ${activeStatus === "IN PROGRESS" ? "active active-inprogress" : ""}`}
          onClick={() => handleStatusClick("IN PROGRESS")}
          disabled={isResolved}
          style={isResolved ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          <Wrench size={28} className="status-icon" />
          <span>{t.inProgress}</span>
        </button>
        <button
          className={`status-icon-btn btn-resolved ${activeStatus === "RESOLVED" ? "active active-resolved" : ""}`}
          onClick={() => handleStatusClick("RESOLVED")}
        >
          <CheckCircle size={28} className="status-icon" />
          <span>{t.resolved}</span>
        </button>
      </div>
    </div>
  );
}

export default LinemanReportDetail;
