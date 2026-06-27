import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { User, Edit, Settings, Save, X } from "lucide-react";
import SettingsTab from "./SettingsTab";
import { translations } from "./translations";
import logo from "../assets/ISELCONNECT.png";
import { logSystemAction } from "../utils/logger";

function ProfileTab({ onLogout }) {
  const currentLang = localStorage.getItem("appLanguage") || "English";
  const t = translations[currentLang];

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    mobile_number: "",
    purok_sitio: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error("No user logged in.");

      const { data: userData, error: dbError } = await supabase
        .from("users")
        .select(
          `first_name, middle_name, last_name, email, mobile_number, purok_sitio, barangays ( name ), municipalities ( name )`,
        )
        .eq("id", authData.user.id)
        .single();
      if (dbError) throw dbError;
      setProfile(userData);
    } catch (error) {
      setErrorMsg(t.errorProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditData({
      first_name: profile.first_name || "",
      middle_name: profile.middle_name || "",
      last_name: profile.last_name || "",
      mobile_number: profile.mobile_number || "",
      purok_sitio: profile.purok_sitio || "",
    });
    setIsEditing(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("users")
        .update({
          first_name: editData.first_name.trim(),
          middle_name: editData.middle_name.trim() || null,
          last_name: editData.last_name.trim(),
          mobile_number: editData.mobile_number,
          purok_sitio: editData.purok_sitio.trim() || null,
        })
        .eq("id", authData.user.id);
      if (error) throw error;

      setProfile({
        ...profile,
        first_name: editData.first_name.trim(),
        middle_name: editData.middle_name.trim() || null,
        last_name: editData.last_name.trim(),
        mobile_number: editData.mobile_number,
        purok_sitio: editData.purok_sitio.trim() || null,
      });

      await logSystemAction(
        "UPDATE_PROFILE",
        "Resident updated their personal profile details.",
      );

      setIsEditing(false);
      setShowSaveModal(false);
    } catch (error) {
      alert(t.errorUpdate);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="home-loading-text" style={{ padding: "40px" }}>
        {t.loadingProfile}
      </div>
    );
  if (errorMsg)
    return (
      <div
        className="home-loading-text"
        style={{ padding: "40px", color: "red" }}
      >
        {errorMsg}
      </div>
    );
  if (showSettings)
    return (
      <SettingsTab onBack={() => setShowSettings(false)} onLogout={onLogout} />
    );

  const middleInitial = profile.middle_name
    ? `${profile.middle_name.charAt(0)}.`
    : "";
  const fullName = `${profile.first_name} ${middleInitial} ${profile.last_name}`
    .replace(/\s+/g, " ")
    .trim();

  // === UPDATED ADDRESS LOGIC ===
  const hasAddress = profile.barangays?.name || profile.municipalities?.name;
  const addressParts = [
    profile.purok_sitio,
    profile.barangays?.name,
    profile.municipalities?.name,
    hasAddress ? "Isabela" : null,
  ].filter(Boolean);

  const fullAddress = hasAddress ? addressParts.join(", ") : "None";

  return (
    <div className="pt-container">
      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">{t.confirmChangesTitle}</h3>
            <p className="modal-text">{t.confirmChangesText}</p>
            <div className="modal-buttons">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
              >
                {t.cancelBtn}
              </button>
              <button
                className="modal-btn confirm-btn"
                onClick={handleSaveProfile}
                disabled={isSaving}
                style={{ backgroundColor: "#1b0b8c" }}
              >
                {isSaving ? t.savingBtn : t.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="profile-header-bg"
        style={{
          background: `linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.6)), url(${logo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="avatar-container">
          <User size={80} color="#1b0b8c" strokeWidth={1.5} />
        </div>
      </div>

      <div className="pt-info-wrapper">
        <h2 className="pt-name-heading">
          {isEditing ? t.editProfileTitle : fullName}
        </h2>

        {!isEditing ? (
          <>
            <div className="pt-data-grid">
              <div className="pt-data-row">
                <span className="pt-data-label">Email:</span>
                <span
                  className="pt-data-value"
                  style={{ wordBreak: "break-all" }}
                >
                  {profile.email}
                </span>
              </div>
              <div className="pt-data-row">
                <span className="pt-data-label">{t.addressLabel}</span>
                <span
                  className="pt-data-value"
                  style={{
                    textTransform: fullAddress === "None" ? "none" : "inherit",
                  }}
                >
                  {fullAddress}
                </span>
              </div>
              <div className="pt-data-row">
                <span className="pt-data-label">{t.contactLabel}</span>
                <span className="pt-data-value">{profile.mobile_number}</span>
              </div>
            </div>

            <div className="profile-btn-row">
              <button onClick={handleEditClick} className="profile-btn-edit">
                <Edit size={20} /> EDIT PROFILE
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="profile-btn-settings"
              >
                <Settings size={20} /> SETTINGS
              </button>
            </div>
          </>
        ) : (
          <div className="pt-edit-form-wrapper">
            <div className="edit-input-group">
              <label>{t.firstName}</label>
              <input
                type="text"
                name="first_name"
                value={editData.first_name}
                onChange={handleEditChange}
                className="edit-input"
              />
            </div>
            <div className="edit-input-group">
              <label>{t.middleName}</label>
              <input
                type="text"
                name="middle_name"
                value={editData.middle_name}
                onChange={handleEditChange}
                className="edit-input"
              />
            </div>
            <div className="edit-input-group">
              <label>{t.lastName}</label>
              <input
                type="text"
                name="last_name"
                value={editData.last_name}
                onChange={handleEditChange}
                className="edit-input"
              />
            </div>
            <div className="edit-input-group">
              <label>{t.mobileNumber}</label>
              <input
                type="tel"
                name="mobile_number"
                value={editData.mobile_number}
                onChange={handleEditChange}
                className="edit-input"
              />
            </div>
            <div className="edit-input-group">
              <label>{t.purokSitio}</label>
              <input
                type="text"
                name="purok_sitio"
                value={editData.purok_sitio}
                onChange={handleEditChange}
                className="edit-input"
              />
            </div>
            <div className="edit-actions">
              <button
                className="edit-cancel-btn"
                onClick={() => setIsEditing(false)}
              >
                <X size={18} /> {t.cancelBtn}
              </button>
              <button
                className="edit-save-btn"
                onClick={() => setShowSaveModal(true)}
                disabled={isSaving}
              >
                <Save size={18} /> {t.saveChangesBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileTab;
