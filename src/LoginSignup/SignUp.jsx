import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  CheckCircle,
  Circle,
  ShieldCheck,
} from "lucide-react";
import logo from "../assets/ISELCONNECT.png";
import { logSystemAction } from "../utils/logger";

const validatePassword = (password) => {
  const isValid = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(
    password,
  );
  if (!isValid) return "Password must meet all requirements below.";
  return null;
};

function SignUp({ onBack }) {
  const [signupStep, setSignupStep] = useState("privacy");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mobileNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    purokSitio: "",
    otherLocation: "",
    municipality_id: "",
    barangay_id: "",
  });

  useEffect(() => {
    const fetchMunicipalities = async () => {
      const { data, error } = await supabase
        .from("municipalities")
        .select("id, name")
        .order("name", { ascending: true });
      if (data && !error) setMunicipalities(data);
    };
    fetchMunicipalities();
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
      if (data && !error) {
        setBarangays(data);
        if (data.length === 1 && data[0].name.includes("N/A")) {
          setFormData((prev) => ({
            ...prev,
            barangay_id: data[0].id.toString(),
          }));
        }
      }
    };
    fetchBarangays();
  }, [formData.municipality_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "municipality_id") newData.barangay_id = "";
      return newData;
    });
  };

  const isOtherMunicipality =
    municipalities.find(
      (m) => m.id.toString() === formData.municipality_id.toString(),
    )?.name === "Other / Outside Coverage Area";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const passwordError = validatePassword(formData.password);
      if (passwordError) throw new Error(passwordError);
      if (isOtherMunicipality && !formData.otherLocation.trim())
        throw new Error("Please provide your City / Province.");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData?.user?.id)
        throw new Error("Failed to create account. Email might already exist.");

      let finalPurokSitio = formData.purokSitio.trim();
      if (isOtherMunicipality && formData.otherLocation.trim()) {
        finalPurokSitio = finalPurokSitio
          ? `${finalPurokSitio}, ${formData.otherLocation.trim()}`
          : formData.otherLocation.trim();
      }

      const { error: dbError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          first_name: formData.firstName.trim(),
          middle_name: formData.middleName.trim() || null,
          last_name: formData.lastName.trim(),
          purok_sitio: finalPurokSitio || null,
          email: formData.email.trim(),
          mobile_number: formData.mobileNumber.trim(),
          role_id: 7,
          municipality_id: parseInt(formData.municipality_id),
          barangay_id: parseInt(formData.barangay_id),
        },
      ]);

      if (dbError) throw dbError;

      localStorage.setItem("isNewResident", "true");
      await logSystemAction(
        "USER_SIGNUP",
        "Resident created a verified account.",
      );
    } catch (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const hasLength = formData.password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(formData.password);

  return (
    <div className="auth-layout">
      <div
        className="auth-top-section auth-bg-photo"
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <button
          className="auth-back-btn"
          type="button"
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 10,
            animation: "contentFade 0.3s ease-out",
          }}
          onClick={() => {
            if (signupStep === "form") setSignupStep("privacy");
            else onBack();
          }}
        >
          <ChevronLeft size={24} strokeWidth={2.5} color="#1e1b4b" />
        </button>

        <div
          className="auth-logo-container"
          style={{ display: "flex", justifyContent: "center", width: "100%" }}
        >
          <img src={logo} alt="ISELCONNECT Logo" className="auth-logo-img" />
        </div>
      </div>

      <div
        className="auth-bottom-section"
        style={{
          display: "flex",
          flexDirection: "column",
          animation: "slideUpFade 0.4s ease-out",
        }}
      >
        <div className="auth-title-container">
          <h2 className="auth-form-title">
            <span className="text-yellow">ISELCONNECT</span>{" "}
            <span className="text-white">SIGN UP</span>
          </h2>
          <div className="auth-title-underline"></div>
        </div>

        {errorMsg && <div className="error-alert">{errorMsg}</div>}

        {signupStep === "privacy" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              animation: "contentFade 0.3s ease-out",
            }}
          >
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "20px",
                borderRadius: "15px",
                flex: 1,
                overflowY: "auto",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "15px",
                  color: "#1b0b8c",
                }}
              >
                <ShieldCheck size={28} />
                <h3
                  style={{ margin: 0, fontWeight: "900", fontSize: "1.1rem" }}
                >
                  Data Privacy Act of 2012
                </h3>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#334155",
                  lineHeight: "1.6",
                  marginBottom: "10px",
                  textAlign: "justify",
                }}
              >
                In compliance with the <strong>Republic Act No. 10173</strong>{" "}
                or the Data Privacy Act of 2012, ISELCONNECT strictly protects
                your personal information.
              </p>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#334155",
                  lineHeight: "1.6",
                  marginBottom: "10px",
                  textAlign: "justify",
                }}
              >
                By proceeding, you consent to the collection, processing, and
                storage of your personal data (Name, Address, Mobile Number, and
                Location coordinates) solely for the purpose of managing your
                account, verifying outage reports, and communicating system
                updates.
              </p>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#334155",
                  lineHeight: "1.6",
                  margin: 0,
                  textAlign: "justify",
                }}
              >
                Your data will never be shared with unverified third parties and
                is exclusively handled by authorized ISELCO-1 personnel and
                dispatchers.
              </p>
            </div>

            <div style={{ marginTop: "20px", flexShrink: 0 }}>
              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => setSignupStep("form")}
                style={{ backgroundColor: "#16a34a" }}
              >
                I Agree & Continue
              </button>
              <div style={{ textAlign: "center", marginTop: "15px" }}>
                <p style={{ color: "#e2e8f0", fontSize: "0.9rem", margin: 0 }}>
                  Changed your mind?{" "}
                  <button
                    type="button"
                    onClick={onBack}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#facc15",
                      fontWeight: "900",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      padding: 0,
                    }}
                  >
                    Cancel Sign Up
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {signupStep === "form" && (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
              animation: "contentFade 0.3s ease-out",
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingRight: "5px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "15px",
              }}
            >
              <div className="auth-input-group">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="auth-input"
                />
              </div>
              <div className="auth-input-group">
                <input
                  type="text"
                  name="middleName"
                  placeholder="Middle Name (Optional)"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  className="auth-input"
                />
              </div>
              <div className="auth-input-group">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="auth-input"
                />
              </div>
              <div className="auth-input-group">
                <input
                  type="tel"
                  name="mobileNumber"
                  placeholder="Mobile Number (e.g. 09123456789)"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  required
                  className="auth-input"
                />
              </div>

              <div className="auth-input-group">
                <select
                  name="municipality_id"
                  value={formData.municipality_id}
                  onChange={handleInputChange}
                  required
                  className="auth-input"
                >
                  <option value="" disabled>
                    Select Municipality
                  </option>
                  {municipalities.map((mun) => (
                    <option key={mun.id} value={mun.id}>
                      {mun.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="auth-input-group">
                <select
                  name="barangay_id"
                  value={formData.barangay_id}
                  onChange={handleInputChange}
                  required
                  className="auth-input"
                  disabled={!formData.municipality_id || isOtherMunicipality}
                >
                  <option value="" disabled>
                    {!formData.municipality_id
                      ? "Select Municipality first"
                      : "Select Barangay"}
                  </option>
                  {barangays.map((bar) => (
                    <option key={bar.id} value={bar.id}>
                      {bar.name}
                    </option>
                  ))}
                </select>
              </div>
              {isOtherMunicipality && (
                <div className="auth-input-group">
                  <input
                    type="text"
                    name="otherLocation"
                    placeholder="City / Province"
                    value={formData.otherLocation}
                    onChange={handleInputChange}
                    required
                    className="auth-input"
                  />
                </div>
              )}
              <div className="auth-input-group">
                <input
                  type="text"
                  name="purokSitio"
                  placeholder={
                    isOtherMunicipality
                      ? "Street Address / Unit (Optional)"
                      : "Purok / Sitio (Optional)"
                  }
                  value={formData.purokSitio}
                  onChange={handleInputChange}
                  className="auth-input"
                />
              </div>

              <div className="auth-input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="auth-input"
                />
              </div>
              <div className="auth-input-group">
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#1e1b4b" />
                    ) : (
                      <Eye size={20} color="#1e1b4b" />
                    )}
                  </button>
                </div>
                <div
                  style={{
                    marginTop: "10px",
                    marginLeft: "15px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: hasLength ? "#4ade80" : "#cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: "600",
                      transition: "color 0.2s",
                    }}
                  >
                    {hasLength ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Circle size={16} />
                    )}{" "}
                    At least 8 characters
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: hasLetter ? "#4ade80" : "#cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: "600",
                      transition: "color 0.2s",
                    }}
                  >
                    {hasLetter ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Circle size={16} />
                    )}{" "}
                    At least 1 letter
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: hasNumber ? "#4ade80" : "#cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: "600",
                      transition: "color 0.2s",
                    }}
                  >
                    {hasNumber ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Circle size={16} />
                    )}{" "}
                    At least 1 number
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: hasSpecial ? "#4ade80" : "#cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: "600",
                      transition: "color 0.2s",
                    }}
                  >
                    {hasSpecial ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Circle size={16} />
                    )}{" "}
                    At least 1 special character
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "auto", flexShrink: 0 }}>
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
              <div style={{ textAlign: "center", marginTop: "15px" }}>
                <p style={{ color: "#e2e8f0", fontSize: "0.9rem", margin: 0 }}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={onBack}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#facc15",
                      fontWeight: "900",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      padding: 0,
                    }}
                  >
                    Login here!
                  </button>
                </p>
              </div>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes contentFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default SignUp;
