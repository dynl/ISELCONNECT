import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom"; // 1. IMPORTED PORTAL
import Webcam from "react-webcam";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Camera as CameraIcon, ChevronLeft, ChevronDown } from "lucide-react";
import { supabase } from "../supabaseClient";
import { logSystemAction } from "../utils/logger";
import { translations } from "../components/translations";

const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const selectedOption = options.find(
    (opt) => opt.id.toString() === value?.toString(),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const displayValue = isOpen
    ? searchTerm
    : selectedOption
      ? selectedOption.name
      : "";

  return (
    <div
      ref={dropdownRef}
      style={{ position: "relative", width: "100%", marginBottom: "0px" }}
    >
      <input
        type="text"
        name={name}
        className="rounded-input"
        style={{
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "text",
          width: "100%",
          boxSizing: "border-box",
        }}
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        autoComplete="off"
      />
      <div
        style={{
          position: "absolute",
          right: "15px",
          top: "25px",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <ChevronDown size={20} color="#64748b" />
      </div>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "15px",
            maxHeight: "220px",
            overflowY: "auto",
            zIndex: 9999,
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            marginTop: "5px",
            padding: "5px",
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => {
                  onChange({ target: { name, value: opt.id } });
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                style={{
                  padding: "12px 15px",
                  cursor: "pointer",
                  borderRadius: "10px",
                  color: "#1e293b",
                  fontWeight: selectedOption?.id === opt.id ? "bold" : "normal",
                  backgroundColor:
                    selectedOption?.id === opt.id ? "#f1f5f9" : "transparent",
                }}
              >
                {opt.name}
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "12px 15px",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function ReportTab({ isActive }) {
  const currentLang = localStorage.getItem("appLanguage") || "English";
  const t = translations[currentLang];

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: "", lon: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [reportTypes, setReportTypes] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [formData, setFormData] = useState({
    report_type_id: "",
    municipality_id: "",
    barangay_id: "",
    purok_sitio: "",
    landmark: "",
    description: "",
  });

  const webcamRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // 2. ADDED: This locks the screen scrolling whenever the modal is open!
  useEffect(() => {
    if (showSuccessModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showSuccessModal]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: typesData, error: typesError } = await supabase
        .from("report_types")
        .select("id, name")
        .order("id", { ascending: true });
      if (typesData && !typesError) setReportTypes(typesData);
      const { data: munData, error: munError } = await supabase
        .from("municipalities")
        .select("id, name, branch_id")
        .order("name", { ascending: true });
      if (munData && !munError) setMunicipalities(munData);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchBarangays = async () => {
      if (!formData.municipality_id) {
        setBarangays([]);
        return;
      }
      const { data, error } = await supabase
        .from("barangays")
        .select("id, name")
        .eq("municipality_id", formData.municipality_id)
        .order("name", { ascending: true });
      if (data && !error) setBarangays(data);
    };
    fetchBarangays();
  }, [formData.municipality_id]);

  useEffect(() => {
    const navBar = document.querySelector(".bottom-nav-wrapper");
    if (isCameraOpen) {
      if (navBar) navBar.style.display = "none";
    } else {
      if (navBar) navBar.style.display = "";
    }
    return () => {
      if (navBar) navBar.style.display = "";
    };
  }, [isCameraOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "municipality_id") newData.barangay_id = "";
      return newData;
    });
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImagePreview(imageSrc);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude.toFixed(6),
            lon: position.coords.longitude.toFixed(6),
          });
          setError("");
          setIsCameraOpen(false);
        },
        (err) => {
          setError("Location access denied. Please enable GPS.");
          setIsCameraOpen(false);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      setError("Geolocation is not supported by this device.");
      setIsCameraOpen(false);
    }
  }, [webcamRef]);

  const base64ToBlob = (base64, mimeType = "image/jpeg") => {
    const byteCharacters = atob(base64.split(",")[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  };

  const handleSubmitReport = async () => {
    if (!imagePreview) return setError("Please capture a photo of the issue.");
    if (!coordinates.lat || !coordinates.lon)
      return setError("Location coordinates are required.");
    if (!formData.report_type_id)
      return setError("Please select a Report Type.");
    if (!formData.municipality_id)
      return setError("Please select a Municipality.");
    if (!formData.barangay_id) return setError("Please select a Barangay.");
    if (!formData.landmark.trim()) return setError("Please enter a Landmark.");

    setIsSubmitting(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      const selectedMunicipality = municipalities.find(
        (m) => m.id.toString() === formData.municipality_id.toString(),
      );
      const automaticBranchId = selectedMunicipality?.branch_id || null;

      const fileName = `${user.id}-${Date.now()}.jpg`;
      const imageBlob = base64ToBlob(imagePreview);
      const { error: uploadError } = await supabase.storage
        .from("report_photos")
        .upload(fileName, imageBlob, { contentType: "image/jpeg" });
      if (uploadError) throw new Error("Failed to upload photo to storage.");

      const { data: publicUrlData } = supabase.storage
        .from("report_photos")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from("reports").insert([
        {
          residents_id: user.id,
          report_type_id: parseInt(formData.report_type_id),
          description: formData.description.trim() || null,
          landmark: formData.landmark.trim(),
          latitude: parseFloat(coordinates.lat),
          longitude: parseFloat(coordinates.lon),
          municipality_id: parseInt(formData.municipality_id),
          barangay_id: parseInt(formData.barangay_id),
          purok_sitio: formData.purok_sitio.trim() || null,
          branch_id: automaticBranchId,
          status_id: 1,
          photo_url: publicUrlData.publicUrl,
        },
      ]);

      if (dbError)
        throw new Error(
          "Failed to save report to database: " + dbError.message,
        );

      const typeName =
        reportTypes.find(
          (type) => type.id === parseInt(formData.report_type_id),
        )?.name || "issue";
      await logSystemAction(
        "SUBMIT_REPORT",
        `Resident submitted a new ${typeName} report at ${formData.landmark.trim()}.`,
      );
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isActive || !coordinates.lat || !coordinates.lon) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }
    const lat = parseFloat(coordinates.lat);
    const lon = parseFloat(coordinates.lon);
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
  }, [coordinates, isActive]);

  return (
    <div className="bg-navy-tab">
      {/* 3. ADDED: createPortal wraps the modal to guarantee it is full screen */}
      {showSuccessModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              zIndex: 999999,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div className="modal-box" style={{ margin: "0 20px" }}>
              <h3 className="modal-title" style={{ fontSize: "1.8rem" }}>
                {t.reported}
              </h3>
              <p
                className="modal-text"
                dangerouslySetInnerHTML={{
                  __html: t.reportReview.replace("now", "now<br />"),
                }}
              />
              <button
                className="modal-btn confirm-btn"
                style={{
                  backgroundColor: "#1b0b8c",
                  width: "100%",
                  borderRadius: "25px",
                }}
                onClick={() => {
                  setShowSuccessModal(false);
                  setImagePreview(null);
                  setCoordinates({ lat: "", lon: "" });
                  setFormData({
                    report_type_id: "",
                    municipality_id: "",
                    barangay_id: "",
                    purok_sitio: "",
                    landmark: "",
                    description: "",
                  });
                }}
              >
                OK!
              </button>
            </div>
          </div>,
          document.body,
        )}

      {!isCameraOpen ? (
        <div className="report-form-container">
          <h1 className="report-title text-yellow">{t.reportTitle}</h1>
          <div
            className="photo-capture-box"
            onClick={() => setIsCameraOpen(true)}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Captured report"
                className="captured-image-preview"
              />
            ) : (
              <div className="placeholder-content">
                <CameraIcon size={48} strokeWidth={1.5} color="#1b0b8c" />
                <h2>{t.capturePhoto}</h2>
              </div>
            )}
          </div>

          {coordinates.lat && (
            <div
              ref={mapContainerRef}
              className="map-preview-box report-map-mb"
              style={{ zIndex: 1 }}
            />
          )}

          <p
            className="location-note text-center"
            style={{ textAlign: "center", marginBottom: "15px" }}
          >
            <strong className="text-yellow">{t.noteLabel}</strong>{" "}
            {t.locationNote}
          </p>

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

          <div className="report-inputs">
            <input
              type="text"
              className="rounded-input"
              placeholder={t.longitude}
              value={coordinates.lon}
              readOnly
            />
            <input
              type="text"
              className="rounded-input"
              placeholder={t.latitude}
              value={coordinates.lat}
              readOnly
            />
            <SearchableDropdown
              name="report_type_id"
              options={reportTypes}
              value={formData.report_type_id}
              onChange={handleInputChange}
              placeholder={t.reportType}
            />
            <SearchableDropdown
              name="municipality_id"
              options={municipalities}
              value={formData.municipality_id}
              onChange={handleInputChange}
              placeholder={t.incidentMun}
            />
            <SearchableDropdown
              name="barangay_id"
              options={barangays}
              value={formData.barangay_id}
              onChange={handleInputChange}
              placeholder={
                !formData.municipality_id
                  ? "Select Municipality first"
                  : t.incidentBrgy
              }
              disabled={!formData.municipality_id}
            />
            <input
              type="text"
              name="purok_sitio"
              className="rounded-input"
              placeholder={t.purokSitio}
              value={formData.purok_sitio}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="landmark"
              className="rounded-input"
              placeholder={t.landmarkPlaceholder}
              value={formData.landmark}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="description"
              className="rounded-input"
              placeholder={t.descOptional}
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <button
            className="submit-report-btn"
            onClick={handleSubmitReport}
            disabled={isSubmitting}
          >
            {isSubmitting ? t.submitting : t.submit}
          </button>
        </div>
      ) : (
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
              onClick={() => setIsCameraOpen(false)}
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
            <span style={{ color: "#fff", fontWeight: "bold" }}>
              {t.evidenceCamera}
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
              {t.capturePhoto}
            </p>
            <button
              onClick={capture}
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
      )}
    </div>
  );
}

export default ReportTab;
