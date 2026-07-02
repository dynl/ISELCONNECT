import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { ChevronLeft, Eye, EyeOff, CheckCircle, Circle } from "lucide-react";
import logo from "../assets/ISELCONNECT.png";
import { logSystemAction } from "../utils/logger";

// --- PASSWORD VALIDATION HELPER ---
const validatePassword = (password) => {
  const isValid = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(
    password,
  );
  if (!isValid) {
    return "Password must meet all requirements below.";
  }
  return null;
};

function Auth({ onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
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

        // Auto-select "N/A" if it's the only option available for the "Other" municipality
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
    setSuccessMsg("");

    try {
      if (isLogin) {
        const { data: preCheckUser } = await supabase
          .from("users")
          .select("role_id")
          .ilike("email", formData.email.trim())
          .maybeSingle();

        if (!preCheckUser) {
          throw new Error(
            "Account not found. Please ensure you are using the correct portal.",
          );
        }

        if (preCheckUser.role_id !== 7) {
          throw new Error("Access denied. Please use the Lineman portal.");
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (authError) throw authError;

        await logSystemAction(
          "USER_LOGIN",
          "Resident logged into the application successfully.",
        );
      } else {
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          throw new Error(passwordError);
        }

        if (isOtherMunicipality && !formData.otherLocation.trim()) {
          throw new Error("Please provide your City / Province.");
        }

        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formData.email.trim(),
            password: formData.password,
          },
        );

        if (authError) throw authError;
        if (!authData?.user?.id)
          throw new Error("Signup failed. Please try again.");

        const newUserId = authData.user.id;

        let finalPurokSitio = formData.purokSitio.trim();
        if (isOtherMunicipality && formData.otherLocation.trim()) {
          finalPurokSitio = finalPurokSitio
            ? `${finalPurokSitio}, ${formData.otherLocation.trim()}`
            : formData.otherLocation.trim();
        }

        const { error: dbError } = await supabase.from("users").insert([
          {
            id: newUserId,
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

        await logSystemAction("USER_SIGNUP", "Resident created a new account.");
        setSuccessMsg("Account created successfully!");
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasLength = formData.password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(formData.password);

  return (
    <div className="auth-layout">
      {/* 
        =====================================================================
        THE FIX: Removed the dynamic class so it always uses 'auth-bg-photo'
        ===================================================================== 
      */}
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
          onClick={onBack}
          type="button"
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 10,
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

      <div className="auth-bottom-section">
        <div className="auth-title-container">
          <h2 className="auth-form-title">
            <span className="text-yellow">RESIDENTS</span>{" "}
            <span className="text-white">{isLogin ? "LOGIN" : "SIGN UP"}</span>
          </h2>
          <div className="auth-title-underline"></div>
        </div>

        {errorMsg && <div className="error-alert">{errorMsg}</div>}
        {successMsg && <div className="success-alert">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form-container">
          {!isLogin && (
            <>
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
                  placeholder="Mobile Number"
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
            </>
          )}

          <div className="auth-input-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
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
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#1e1b4b" />
                ) : (
                  <Eye size={20} color="#1e1b4b" />
                )}
              </button>
            </div>

            {!isLogin && (
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
                  {hasLength ? <CheckCircle size={16} /> : <Circle size={16} />}{" "}
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
                  {hasLetter ? <CheckCircle size={16} /> : <Circle size={16} />}{" "}
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
                  {hasNumber ? <CheckCircle size={16} /> : <Circle size={16} />}{" "}
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
            )}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Processing..." : isLogin ? "Login" : "Submit"}
          </button>
        </form>

        <div className="auth-footer-link">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="auth-toggle-btn text-yellow"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg("");
              }}
            >
              {isLogin ? "Create one!" : "Login here!"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
