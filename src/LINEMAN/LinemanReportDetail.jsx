import React, { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Webcam from "react-webcam";
import {
  ChevronLeft, Clock, Wrench, CheckCircle, MapPin, Users, MessageSquare,
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
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

function LinemanReportDetail({ report, onBack, onReportUpdated }) {
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
  const [showEvidenceAlert, setShowEvidenceAlert] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companions, setCompanions] = useState([]);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [loadingAssignmentDetails, setLoadingAssignmentDetails] = useState(true);

  // ==========================================
  // FETCH ASSIGNMENT DETAILS
  // ==========================================
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      if (!report?.id) return;
      try {
        setLoadingAssignmentDetails(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from("assignments")
          .select(`lineman_id, admin_remarks, users ( first_name, last_name )`)
          .eq("report_id", report.id);

        if (error) throw error;

        if (data) {
          const otherLinemen = data
            .filter((assignment) => assignment.lineman_id !== user?.id)
            .map((assignment) => {
              const fName = assignment.users?.first_name || "";
              const lName = assignment.users?.last_name || "";
              return `${fName} ${lName}`.trim();
            })
            .filter(Boolean);

          setCompanions(otherLinemen);

          const myAssignment = data.find((a) => a.lineman_id === user?.id) || data[0];
          if (myAssignment && myAssignment.admin_remarks) {
            setAdminRemarks(myAssignment.admin_remarks);
          }
        }
      } catch (err) {
        console.error("Error fetching assignment details:", err.message);
      } finally {
        setLoadingAssignmentDetails(false);
      }
    };

    fetchAssignmentDetails();
  }, [report.id]);

  // ==========================================
  // LEAFLET MAP INITIALIZATION
  // ==========================================
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

      // Custom Red Marker for Linemen matching your original UI
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `<div style="background-color: #ea4335; width: 22px; height: 22px; border-radius: 50%; border: 4px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false
        }).setView([lat, lon], 16);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapRef.current);
      } else {
        mapRef.current.setView([lat, lon], 16);
      }

      if (markerRef.current) markerRef.current.remove();
      markerRef.current = L.marker([lat, lon], { icon: customIcon }).addTo(mapRef.current);
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
    if (statusName === activeStatus) return;

    if (statusName === "RESOLVED" && !evidencePhoto) {
      setPendingStatusUpdate("RESOLVED");
      setShowEvidenceAlert(true);
      return;
    }

    setPendingStatusUpdate(statusName);
    setShowStatusAlert(true);
  };

  const confirmStatusUpdate = async () => {
    setIsSubmitting(true);
    try {
      let newStatusId = 1;
      if (pendingStatusUpdate === "PENDING") newStatusId = 1;
      if (pendingStatusUpdate === "IN PROGRESS") newStatusId = 2;
      if (pendingStatusUpdate === "RESOLVED") newStatusId = 3;

      const updatePayload = { status_id: newStatusId };

      if (pendingStatusUpdate === "RESOLVED" && evidencePhoto) {
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
      }

      const { data, error } = await supabase
        .from("reports")
        .update(updatePayload)
        .eq("id", report.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("Update blocked by Supabase! Check RLS policies.");

      if (
        pendingStatusUpdate === "IN PROGRESS" ||
        pendingStatusUpdate === "RESOLVED"
      ) {
        const now = new Date().toISOString();
        const assignmentPayload = {};

        if (pendingStatusUpdate === "IN PROGRESS") {
          assignmentPayload.arrival_at = now;
        } else if (pendingStatusUpdate === "RESOLVED") {
          assignmentPayload.completion_at = now;
        }

        const { error: assignmentError } = await supabase
          .from("assignments")
          .update(assignmentPayload)
          .eq("report_id", report.id);

        if (assignmentError) {
          console.error(
            "Failed to save timestamp to assignments table:",
            assignmentError.message,
          );
        }
      }

      await logSystemAction(
        "UPDATE_REPORT_STATUS",
        `Lineman updated report #${report.id} status to ${pendingStatusUpdate}.`,
      );

      setActiveStatus(pendingStatusUpdate);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Failed to update status:", err.message);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
      setShowStatusAlert(false);
      setPendingStatusUpdate(null);
    }
  };

  const captureEvidence = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setEvidencePhoto(imageSrc);
        setIsCameraOpen(false);

        if (pendingStatusUpdate === "RESOLVED") {
          setShowStatusAlert(true);
        }
      }
    }
  }, [webcamRef, pendingStatusUpdate]);

  if (showMap) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "#f8fafc", zIndex: 99999, display: "flex", flexDirection: "column"
      }}>
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
          <span style={{
            color: "#fff", fontWeight: "900", marginLeft: "10px",
            letterSpacing: "1px", fontSize: "1rem"
          }}>
            LOCATION MAP
          </span>
        </div>
        <div style={{ flex: 1, width: "100%", position: "relative" }}>
          {/* LEAFLET MAP CONTAINER */}
          <div ref={mapContainerRef} style={{ position: "absolute", top: 0, bottom: 0, width: "100%" }} />
        </div>
      </div>
    );
  }

  if (isCameraOpen) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "#000", zIndex: 99999, display: "flex", flexDirection: "column"
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 15px", background: "#000", flexShrink: 0
        }}>
          <button
            onClick={() => { setIsCameraOpen(false); setPendingStatusUpdate(null); }}
            style={{
              background: "transparent", border: "none", padding: 0, display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}
          >
            <ChevronLeft size={32} color="#fff" />
          </button>
          <span style={{ color: "#fff", fontWeight: "bold" }}>EVIDENCE CAMERA</span>
          <div style={{ width: 32 }}></div>
        </div>

        <div style={{ flex: 1, position: "relative", width: "100%", background: "#111", overflow: "hidden" }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            mirrored={true}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div style={{
          background: "#e2e8f0", padding: "20px 15px 40px 15px", display: "flex",
          flexDirection: "column", alignItems: "center", flexShrink: 0,
          borderTopLeftRadius: "30px", borderTopRightRadius: "30px"
        }}>
          <p style={{ margin: "0 0 15px 0", color: "#111", fontWeight: "900", fontSize: "0.9rem" }}>
            CAPTURE THE FIX
          </p>
          <button
            onClick={captureEvidence}
            style={{
              width: "70px", height: "70px", borderRadius: "50%", background: "#cbd5e1",
              border: "5px solid #fff", boxShadow: "0 0 0 3px #000", cursor: "pointer"
            }}
          ></button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-layout">
      {showEvidenceAlert && (
        <div className="custom-alert-overlay">
          <div className="custom-alert-box">
            <div className="custom-alert-header alert-header-danger">
              <h2>EVIDENCE REQUIRED</h2>
            </div>
            <div className="custom-alert-body">
              <p>Please capture a photo of<br />the fixed issue before<br />resolving this report.</p>
              <div className="custom-alert-buttons" style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  className="alert-btn no-btn"
                  onClick={() => { setShowEvidenceAlert(false); setPendingStatusUpdate(null); }}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1",
                    background: "#f1f5f9", color: "#475569", fontWeight: "bold", cursor: "pointer"
                  }}
                >
                  CANCEL
                </button>
                <button
                  className="alert-btn yes-btn bg-navy text-white"
                  onClick={() => { setShowEvidenceAlert(false); setIsCameraOpen(true); }}
                  style={{ flex: 1, padding: "12px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}
                >
                  OPEN CAMERA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatusAlert && (
        <div className="custom-alert-overlay">
          <div className="custom-alert-box">
            <div className="custom-alert-header">
              <h2>CONFIRMATION</h2>
            </div>
            <div className="custom-alert-body">
              <p>Are you sure you<br />want to update the<br />status to {pendingStatusUpdate}?</p>
              <div className="custom-alert-buttons">
                <button
                  className="alert-btn no-btn"
                  onClick={() => { setShowStatusAlert(false); setPendingStatusUpdate(null); }}
                  disabled={isSubmitting}
                >
                  NO
                </button>
                <button className="alert-btn yes-btn" onClick={confirmStatusUpdate} disabled={isSubmitting}>
                  {isSubmitting ? "SAVING..." : "YES"}
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
              <h2>UPDATED</h2>
            </div>
            <div className="success-modal-body">
              <p>Status successfully<br />updated to {activeStatus}!</p>
              <button
                className="success-modal-btn"
                onClick={() => { setShowSuccessModal(false); if (onReportUpdated) onReportUpdated(); }}
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
          <h2>{report.report_types?.name || "REPORT DETAILS"}</h2>
        </div>

        <div className="detail-photo-section">
          {report.photo_url ? (
            <img src={report.photo_url} alt="Report issue" className="detail-photo" />
          ) : (
            <div className="no-photo">No Photo Provided</div>
          )}
        </div>

        <div className="detail-info-section">
          <p><strong>DESCRIPTION:</strong> {report.description || "No description provided."}</p>
          <p><strong>LANDMARK:</strong> {report.landmark || "N/A"}</p>
        </div>

        <div className="detail-coords-section" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
          
          {adminRemarks && (
            <div style={{
              background: "#fffbeb", padding: "16px", borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.03)", marginBottom: "5px", border: "1px solid #fde68a"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <MessageSquare size={20} color="#b45309" />
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "900", color: "#b45309", letterSpacing: "0.5px" }}>
                  ADMIN DISPATCH REMARKS
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#78350f", fontWeight: "600", lineHeight: "1.4" }}>
                {adminRemarks}
              </p>
            </div>
          )}

          <button
            onClick={() => setShowMap(true)}
            style={{
              width: "100%", padding: "16px", backgroundColor: "#1b0b8c", color: "#ffffff",
              border: "none", borderRadius: "50px", fontWeight: "900", fontSize: "1rem",
              display: "flex", justifyContent: "center", alignItems: "center", gap: "10px",
              cursor: "pointer", boxShadow: "0 6px 15px rgba(27, 11, 140, 0.2)", transition: "transform 0.1s"
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <MapPin size={22} />
            VIEW LOCATION MAP
          </button>

          <div className="coords-row" style={{ marginTop: "10px" }}>
            <span><strong>LO:</strong> {report.longitude || "N/A"}</span>
            <span><strong>LA:</strong> {report.latitude || "N/A"}</span>
          </div>

          <div style={{
            background: "#ffffff", padding: "16px", borderRadius: "12px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.03)", marginTop: "10px", border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Users size={20} color="#1b0b8c" />
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "900", color: "#1b0b8c", letterSpacing: "0.5px" }}>
                ASSIGNED COMPANIONS
              </h3>
            </div>

            {loadingAssignmentDetails ? (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontStyle: "italic" }}>
                Loading team members...
              </p>
            ) : companions.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {companions.map((comp, idx) => (
                  <li key={idx} style={{ fontSize: "0.9rem", color: "#334155", fontWeight: "700" }}>{comp}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>
                You are currently the only lineman assigned to this report.
              </p>
            )}
          </div>

          {evidencePhoto && (
            <div style={{
              display: "flex", alignItems: "center", gap: "15px", background: "#f0fdf4",
              border: "1px solid #bbf7d0", padding: "10px", borderRadius: "12px", marginTop: "10px"
            }}>
              <img
                src={evidencePhoto}
                alt="Evidence"
                style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "2px solid #16a34a" }}
              />
              <div style={{ color: "#15803d", fontWeight: "900", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "5px" }}>
                <CheckCircle size={18} /> EVIDENCE READY
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="status-action-bar">
        <button
          className={`status-icon-btn btn-pending ${activeStatus === "PENDING" ? "active active-pending" : ""}`}
          onClick={() => handleStatusClick("PENDING")}
        >
          <Clock size={28} className="status-icon" />
          <span>PENDING</span>
        </button>

        <button
          className={`status-icon-btn btn-inprogress ${activeStatus === "IN PROGRESS" ? "active active-inprogress" : ""}`}
          onClick={() => handleStatusClick("IN PROGRESS")}
        >
          <Wrench size={28} className="status-icon" />
          <span>IN PROGRESS</span>
        </button>

        <button
          className={`status-icon-btn btn-resolved ${activeStatus === "RESOLVED" ? "active active-resolved" : ""}`}
          onClick={() => handleStatusClick("RESOLVED")}
        >
          <CheckCircle size={28} className="status-icon" />
          <span>RESOLVED</span>
        </button>
      </div>
    </div>
  );
}

export default LinemanReportDetail;