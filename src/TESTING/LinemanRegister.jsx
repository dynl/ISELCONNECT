import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import logo from "../assets/ISELCONNECT.png";

function LinemanRegister({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mobileNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error("Signup failed. Please try again.");

      const newUserId = authData.user.id;

      // 2. Insert into public.users with role_id = 2 (Assuming 2 is your Lineman role)
      // Note: Adjust the role_id if your database uses a different integer for linemen!
      const { error: dbError } = await supabase.from("users").insert([
        {
          id: newUserId,
          first_name: formData.firstName.trim(),
          middle_name: formData.middleName.trim() || null,
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          mobile_number: formData.mobileNumber.trim(),
          role_id: 9, // <--- Change this if your lineman role ID is different from 2
          municipality_id: null, // Linemen usually handle multiple or aren't locked to one resident address
          barangay_id: null,
          purok_sitio: null,
        },
      ]);

      if (dbError) throw dbError;

      setSuccessMsg("Lineman testing account created successfully!");
      setFormData({ email: "", password: "", mobileNumber: "", firstName: "", middleName: "", lastName: "" });
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-top-section auth-bg-white">
        <button className="auth-back-btn" onClick={onBack} type="button">
          <ChevronLeft size={24} strokeWidth={2.5} color="#1e1b4b" />
        </button>

        <div className="auth-logo-container">
          <img src={logo} alt="ISELCONNECT Logo" className="auth-logo-img" />
        </div>
      </div>

      <div className="auth-bottom-section">
        <div className="auth-title-container">
          <h2 className="auth-form-title">
            <span className="text-yellow">LINEMAN</span>{" "}
            <span className="text-white">DEV SIGNUP</span>
          </h2>
          <div className="auth-title-underline"></div>
        </div>

        {errorMsg && <div className="error-alert">{errorMsg}</div>}
        {successMsg && <div className="success-alert">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form-container">
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
                {showPassword ? <EyeOff size={20} color="#1e1b4b" /> : <Eye size={20} color="#1e1b4b" />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Test Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LinemanRegister;