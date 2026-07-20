import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Eye, EyeOff } from "lucide-react";
import "../Resident.css";

function UpdatePassword({ onPasswordUpdated }) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if the user arrived here with a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError(
          "Your reset link is invalid or has expired. Please request a new one.",
        );
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setIsLoading(true);

    try {
      // Supabase securely updates the password for the currently recovered session
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage("Your password has been updated successfully!");

      // Give the user a moment to see the success message before redirecting to login
      setTimeout(() => {
        if (onPasswordUpdated) onPasswordUpdated();
        else window.location.href = "/";
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Top Graphic Section */}
      <div className="auth-top-section auth-bg-photo"></div>

      {/* Form Section */}
      <div className="auth-bottom-section">
        <h1 className="auth-form-title">Create New Password</h1>
        <div className="auth-title-underline"></div>

        {error && <div className="error-alert">{error}</div>}
        {message && <div className="success-alert">{message}</div>}

        <form onSubmit={handleUpdatePassword} className="auth-form-container">
          <p
            style={{
              color: "#cbd5e1",
              fontSize: "0.9rem",
              textAlign: "center",
              marginBottom: "15px",
            }}
          >
            Please enter your new password below.
          </p>

          <div className="auth-input-group">
            <label>New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#64748b" />
                ) : (
                  <Eye size={20} color="#64748b" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading || !!error.includes("expired")}
            style={{ opacity: isLoading || error ? 0.7 : 1 }}
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdatePassword;
