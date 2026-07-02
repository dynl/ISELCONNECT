import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import logo from "../assets/ISELCONNECT.png";
import { logSystemAction } from "../utils/logger";

function LinemanAuth({ onLoginSuccess, onBack }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data: preCheckUser } = await supabase
        .from("users")
        .select("role_id")
        .ilike("email", formData.email.trim())
        .maybeSingle();

      if (!preCheckUser)
        throw new Error(
          "Account not found. Please ensure you are using the correct portal.",
        );
      if (preCheckUser.role_id !== 9)
        throw new Error(
          "Access denied. This portal is strictly for ISELCO-1 Linemen.",
        );

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw authError;

      await logSystemAction(
        "USER_LOGIN",
        "Lineman logged into the application successfully.",
      );

      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* 
        =====================================================================
        THE FIX: Added absolute positioning to the back button and forced 
        the logo container to center at 100% width.
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
          title="Go Back"
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 10,
          }}
        >
          <ChevronLeft size={24} color="#1e1b4b" strokeWidth={2.5} />
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
            <span className="text-yellow">LINEMAN</span>{" "}
            <span className="text-white">LOGIN</span>
          </h2>
          <div className="auth-title-underline"></div>
        </div>

        {errorMsg && <div className="error-alert">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="auth-form-container">
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
              >
                {showPassword ? (
                  <EyeOff size={20} color="#1e1b4b" />
                ) : (
                  <Eye size={20} color="#1e1b4b" />
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LinemanAuth;
