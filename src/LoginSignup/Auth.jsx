import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import logo from "../assets/ISELCONNECT.png";
import { logSystemAction } from "../utils/logger";
import SignUp from "./SignUp";

function Auth({ onBack }) {
  const [showSignUp, setShowSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data: preCheckUser } = await supabase
        .from("users")
        .select("role_id")
        .ilike("email", formData.email.trim())
        .maybeSingle();
      if (!preCheckUser) throw new Error("Account not found in the system.");

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });
      if (authError) throw authError;

      const roleName =
        preCheckUser.role_id === 7 ? "Resident" : "Lineman/Staff";
      await logSystemAction(
        "USER_LOGIN",
        `${roleName} logged into the application successfully.`,
      );
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (showSignUp) {
    return <SignUp onBack={() => setShowSignUp(false)} />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* =========================================
          TOP SECTION (Background Image & Logo) 
      ============================================= */}
      <div
        className="auth-bg-photo"
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Smooth white fade at the bottom of the image */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%",
            background: "linear-gradient(to bottom, transparent, #ffffff)",
          }}
        ></div>

        {/* LOGO MOVED LOWER HERE */}
        <img
          src={logo}
          alt="ISELCONNECT Logo"
          style={{
            width: "90%",
            maxWidth: "380px",
            zIndex: 1,
            marginTop: "10%",
            marginBottom: "0",
          }}
        />
      </div>

      {/* =========================================
          BOTTOM SECTION (Navy Bottom Sheet) 
      ============================================= */}
      <div
        style={{
          backgroundColor: "#1b0b8c",
          borderTopLeftRadius: "60px",
          padding: "35px 30px 50px 30px",
          flexShrink: 0,
          boxShadow: "0 -10px 25px rgba(0,0,0,0.15)",
          animation: "slideUpFade 0.4s ease-out",
        }}
      >
        {/* Title Header */}
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "1.7rem",
              fontWeight: "900",
              letterSpacing: "1px",
            }}
          >
            <span style={{ color: "#ffffff" }}>LOGIN</span>
          </h2>
          <div
            style={{
              height: "1px",
              backgroundColor: "rgba(255, 255, 255, 0.4)",
              width: "85%",
              margin: "8px auto 0 auto",
            }}
          ></div>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#ef4444",
              padding: "10px",
              borderRadius: "10px",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "0.85rem",
              marginBottom: "15px",
            }}
          >
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column" }}
        >
          {/* Email Input Group */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: "15px",
            }}
          >
            <label
              style={{
                color: "#ffffff",
                fontWeight: "900",
                marginBottom: "8px",
                fontSize: "1rem",
                paddingLeft: "5px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Example@gmail.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{
                padding: "15px 20px",
                borderRadius: "30px",
                border: "none",
                fontSize: "1rem",
                outline: "none",
                backgroundColor: "#ffffff",
                color: "#334155",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Password Input Group */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: "35px",
            }}
          >
            <label
              style={{
                color: "#ffffff",
                fontWeight: "900",
                marginBottom: "8px",
                fontSize: "1rem",
                paddingLeft: "5px",
              }}
            >
              Password
            </label>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="********"
                value={formData.password}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "15px 20px",
                  borderRadius: "30px",
                  border: "none",
                  fontSize: "1rem",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "15px",
                  background: "transparent",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showPassword ? (
                  <EyeOff size={22} color="#64748b" />
                ) : (
                  <Eye size={22} color="#1b0b8c" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <div style={{ padding: "0 10px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                backgroundColor: "#ffffff",
                color: "#1b0b8c",
                padding: "15px",
                borderRadius: "30px",
                fontWeight: "900",
                fontSize: "1.1rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 0 0 2px #1b0b8c, 0 0 0 4px #ffffff",
                opacity: loading ? 0.7 : 1,
                fontFamily: "inherit",
              }}
            >
              {loading ? "Processing..." : "Login"}
            </button>
          </div>

          {/* Footer Link */}
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <p
              style={{
                color: "#ffffff",
                fontSize: "0.9rem",
                margin: 0,
                fontWeight: "700",
              }}
            >
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setShowSignUp(true);
                  setErrorMsg("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#facc15",
                  fontWeight: "900",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  padding: 0,
                  textDecoration: "underline",
                  fontFamily: "inherit",
                }}
              >
                Create one!
              </button>
            </p>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Auth;
