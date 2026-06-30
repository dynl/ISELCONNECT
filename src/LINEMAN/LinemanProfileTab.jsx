import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Settings, User, Edit2, Save, X } from "lucide-react";
import LinemanSettingsTab from "./LinemanSettingsTab";
import { logSystemAction } from "../utils/logger";
import "../Lineman.css";

function LinemanProfileTab({ onLogout }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("profile"); // 'profile' or 'settings'

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [editData, setEditData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    municipality_id: "",
    barangay_id: "",
    purok_sitio: "",
  });

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: dbUser } = await supabase
          .from("users")
          .select(
            `
            *,
            employees ( employee_id_no ),
            barangays ( id, name ),
            municipalities ( id, name )
          `,
          )
          .eq("id", user.id)
          .maybeSingle();

        const empId =
          dbUser?.employees?.[0]?.employee_id_no ||
          dbUser?.employees?.employee_id_no ||
          "N/A";

        // === UPDATED ADDRESS LOGIC ===
        const hasAddress =
          dbUser?.municipalities?.name || dbUser?.barangays?.name;
        const addressParts = [
          dbUser?.purok_sitio,
          dbUser?.barangays?.name,
          dbUser?.municipalities?.name,
          hasAddress ? "Isabela" : null,
        ].filter(Boolean);

        const fullAddress = hasAddress ? addressParts.join(", ") : "None";

        setUserProfile({
          id: user.id,
          // Grabbing the email directly from the secure auth object
          email: user.email || dbUser?.email || "N/A",
          firstName: dbUser?.first_name ?? "",
          lastName: dbUser?.last_name ?? "",
          middleName: dbUser?.middle_name ?? "",
          mobileNumber: dbUser?.mobile_number ?? "N/A",
          employeeId: empId,
          address: fullAddress,
          municipality_id: dbUser?.municipality_id || "",
          barangay_id: dbUser?.barangay_id || "",
          purok_sitio: dbUser?.purok_sitio || "",
        });
      }
    } catch (error) {
      console.error("Error loading lineman profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Fetch Municipalities for the Edit Form
  useEffect(() => {
    const fetchMunicipalities = async () => {
      const { data } = await supabase
        .from("municipalities")
        .select("id, name")
        .order("name");
      if (data) setMunicipalities(data);
    };
    fetchMunicipalities();
  }, []);

  // Fetch Barangays dynamically when Municipality changes in Edit Form
  useEffect(() => {
    const fetchBarangays = async () => {
      if (!editData.municipality_id) {
        setBarangays([]);
        return;
      }
      const { data } = await supabase
        .from("barangays")
        .select("id, name")
        .eq("municipality_id", editData.municipality_id)
        .order("name");
      if (data) setBarangays(data);
    };

    if (isEditing) fetchBarangays();
  }, [editData.municipality_id, isEditing]);

  const handleEditClick = () => {
    setEditData({
      first_name: userProfile.firstName,
      middle_name: userProfile.middleName,
      last_name: userProfile.lastName,
      municipality_id: userProfile.municipality_id,
      barangay_id: userProfile.barangay_id,
      purok_sitio: userProfile.purok_sitio,
    });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "municipality_id") newData.barangay_id = ""; // Reset barangay if municipality changes
      return newData;
    });
  };

  const handleSaveProfile = async () => {
    if (
      !editData.first_name ||
      !editData.last_name ||
      !editData.municipality_id ||
      !editData.barangay_id
    ) {
      alert("First Name, Last Name, Municipality, and Barangay are required.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          first_name: editData.first_name.trim(),
          middle_name: editData.middle_name.trim() || null,
          last_name: editData.last_name.trim(),
          municipality_id: parseInt(editData.municipality_id),
          barangay_id: parseInt(editData.barangay_id),
          purok_sitio: editData.purok_sitio.trim() || null,
        })
        .eq("id", userProfile.id);

      if (error) throw error;

      await logSystemAction(
        "UPDATE_PROFILE",
        "Lineman updated their profile information.",
      );

      setIsEditing(false);
      setShowSuccessModal(true);
      await fetchUserData(); // Refresh to get updated relational names (address)
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="l-pt-loading">Loading profile...</div>;

  if (activeView === "settings") {
    return (
      <LinemanSettingsTab
        onBack={() => setActiveView("profile")}
        onLogout={onLogout}
      />
    );
  }

  const fullName =
    `${userProfile?.firstName ?? ""} ${userProfile?.middleName ?? ""} ${userProfile?.lastName ?? ""}`
      .replace(/\s+/g, " ")
      .trim() || "Lineman";

  return (
    <div className="l-pt-container pt-container">
      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-box">
            <div className="success-modal-header">
              <h2>SUCCESS</h2>
            </div>
            <div className="success-modal-body">
              <p>
                Your profile has been
                <br />
                successfully updated!
              </p>
              <button
                className="success-modal-btn"
                onClick={() => setShowSuccessModal(false)}
              >
                OK!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="l-pt-overflow">
        <div
          className="l-pt-hero-bg profile-header-bg"
          style={{
            backgroundImage: "url('/assets/BG.png')",
            backgroundColor: "#1b0b8c",
          }}
        >
          <div className="l-pt-avatar-wrapper avatar-container">
            <User size={75} color="#64748b" strokeWidth={2} />
          </div>
        </div>

        <div
          className="l-pt-info-wrapper pt-info-wrapper"
          style={{ marginTop: "70px" }}
        >
          <h2
            className="l-pt-name-heading pt-name-heading"
            style={{ marginBottom: isEditing ? "20px" : "30px" }}
          >
            {fullName}
          </h2>

          {isEditing ? (
            <div
              className="pt-edit-form-wrapper"
              style={{ width: "100%", maxWidth: "340px", marginBottom: "40px" }}
            >
              <div className="edit-input-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={editData.first_name}
                  onChange={handleInputChange}
                  className="edit-input"
                />
              </div>
              <div className="edit-input-group">
                <label>Middle Name (Optional)</label>
                <input
                  type="text"
                  name="middle_name"
                  value={editData.middle_name}
                  onChange={handleInputChange}
                  className="edit-input"
                />
              </div>
              <div className="edit-input-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={editData.last_name}
                  onChange={handleInputChange}
                  className="edit-input"
                />
              </div>

              <div className="edit-input-group">
                <label>Municipality</label>
                <select
                  name="municipality_id"
                  value={editData.municipality_id}
                  onChange={handleInputChange}
                  className="edit-input custom-select"
                >
                  <option value="" disabled>
                    Select Municipality
                  </option>
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="edit-input-group">
                <label>Barangay</label>
                <select
                  name="barangay_id"
                  value={editData.barangay_id}
                  onChange={handleInputChange}
                  className="edit-input custom-select"
                  disabled={!editData.municipality_id}
                >
                  <option value="" disabled>
                    {editData.municipality_id
                      ? "Select Barangay"
                      : "Select Municipality First"}
                  </option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="edit-input-group">
                <label>Purok / Sitio (Optional)</label>
                <input
                  type="text"
                  name="purok_sitio"
                  value={editData.purok_sitio}
                  onChange={handleInputChange}
                  className="edit-input"
                />
              </div>

              <div className="edit-actions">
                <button
                  onClick={() => setIsEditing(false)}
                  className="edit-cancel-btn"
                  disabled={saving}
                >
                  <X size={18} /> CANCEL
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="edit-save-btn"
                  disabled={saving}
                >
                  <Save size={18} /> {saving ? "SAVING..." : "SAVE"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="l-pt-data-grid pt-data-grid">
                <div className="l-pt-data-row pt-data-row">
                  <span className="l-pt-data-label pt-data-label">
                    Employee ID:
                  </span>
                  <span
                    className="l-pt-data-value pt-data-value"
                    style={{ fontWeight: "700" }}
                  >
                    {userProfile?.employeeId}
                  </span>
                </div>

                {/* NEW ROW FOR EMAIL */}
                <div className="l-pt-data-row pt-data-row">
                  <span className="l-pt-data-label pt-data-label">
                    Email Address:
                  </span>
                  <span
                    className="l-pt-data-value pt-data-value"
                    style={{ fontWeight: "700", wordBreak: "break-all" }}
                  >
                    {userProfile?.email}
                  </span>
                </div>

                <div className="l-pt-data-row pt-data-row">
                  <span className="l-pt-data-label pt-data-label">
                    Address:
                  </span>
                  <span
                    className="l-pt-data-value pt-data-value"
                    style={{ textAlign: "right" }}
                  >
                    {userProfile?.address}
                  </span>
                </div>
                <div className="l-pt-data-row pt-data-row">
                  <span className="l-pt-data-label pt-data-label">
                    Contact number:
                  </span>
                  <span
                    className="l-pt-data-value pt-data-value"
                    style={{ fontWeight: "700" }}
                  >
                    {userProfile?.mobileNumber}
                  </span>
                </div>
              </div>

              {/* 50/50 Split Action Buttons */}
              <div
                className="profile-btn-row"
                style={{
                  display: "flex",
                  width: "100%",
                  maxWidth: "340px",
                  borderRadius: "30px",
                  overflow: "hidden",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                  marginBottom: "40px",
                }}
              >
                <button
                  onClick={handleEditClick}
                  style={{
                    flex: 1,
                    backgroundColor: "#ffdf84",
                    color: "#000000",
                    border: "none",
                    padding: "18px",
                    fontWeight: "900",
                    fontSize: "0.95rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    textTransform: "uppercase",
                  }}
                >
                  <Edit2 size={18} /> EDIT
                </button>
                <button
                  onClick={() => setActiveView("settings")}
                  style={{
                    flex: 1,
                    backgroundColor: "#1b0b8c",
                    color: "#ffffff",
                    border: "none",
                    padding: "18px",
                    fontWeight: "900",
                    fontSize: "0.95rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    textTransform: "uppercase",
                  }}
                >
                  <Settings size={18} /> SETTINGS
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LinemanProfileTab;
