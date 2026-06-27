import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function AdminScheduleAdvisory() {
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "SCHEDULED POWER INTERRUPTION",
    content: "Line maintenance and clearing operations.",
    municipality_id: "",
    selected_barangays: [], // Stores objects: { id, name }
    schedule_start: "",
    schedule_end: "",
  });

  // 1. Fetch Municipalities on load
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

  // 2. Fetch Barangays when a Municipality is selected
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Reset selected barangays if municipality changes
      if (name === "municipality_id") newData.selected_barangays = [];
      return newData;
    });
  };

  // Handle checking/unchecking barangays
  const handleBarangayToggle = (barangay) => {
    setFormData((prev) => {
      const isSelected = prev.selected_barangays.some((b) => b.id === barangay.id);
      
      let updatedBarangays;
      if (isSelected) {
        // Remove it if it was already checked
        updatedBarangays = prev.selected_barangays.filter((b) => b.id !== barangay.id);
      } else {
        // Add it if it wasn't checked
        updatedBarangays = [...prev.selected_barangays, barangay];
      }
      
      return { ...prev, selected_barangays: updatedBarangays };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Basic Validation
    if (!formData.municipality_id) return setError("Please select a municipality.");
    if (formData.selected_barangays.length === 0) return setError("Please select at least one barangay.");
    if (!formData.schedule_start || !formData.schedule_end) return setError("Please set the schedule times.");

    setLoading(true);

    try {
      // Step 1: Format the data for the database
      // Creates the string: "Victoria, Apanay, Magsaysay"
      const affectedAreasText = formData.selected_barangays.map(b => b.name).join(", ");
      
      // Creates the array of IDs: [1, 5, 8]
      const affectedBarangayIds = formData.selected_barangays.map(b => b.id);

      // Step 2: Save to Supabase
      const { error: dbError } = await supabase
        .from("power_advisories")
        .insert([
          {
            title: formData.title,
            content: formData.content,
            municipality_id: parseInt(formData.municipality_id),
            affected_areas: affectedAreasText,
            affected_barangay_ids: affectedBarangayIds,
            schedule_start: new Date(formData.schedule_start).toISOString(),
            schedule_end: new Date(formData.schedule_end).toISOString(),
            created_by_admin_id: 1
          }
        ]);

      if (dbError) throw dbError;

      setSuccess("Power advisory successfully scheduled!");
      
      // Reset the form
      setFormData({
        title: "SCHEDULED POWER INTERRUPTION",
        content: "Line maintenance and clearing operations.",
        municipality_id: "",
        selected_barangays: [],
        schedule_start: "",
        schedule_end: "",
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "30px", backgroundColor: "#f8fafc", borderRadius: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "#1b0b8c", textAlign: "center", marginBottom: "20px", fontWeight: "900" }}>
        SCHEDULE <span style={{ color: "#facc15" }}>POWER OUTAGE</span>
      </h2>

      {error && <div style={{ backgroundColor: "#fee2e2", color: "#ef4444", padding: "12px", borderRadius: "10px", marginBottom: "15px", fontWeight: "bold" }}>{error}</div>}
      {success && <div style={{ backgroundColor: "#dcfce3", color: "#16a34a", padding: "12px", borderRadius: "10px", marginBottom: "15px", fontWeight: "bold" }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Title & Content (Hidden or Editable based on your preference, left visible here for testing) */}
        <div>
          <label style={{ fontWeight: "bold", color: "#475569", display: "block", marginBottom: "5px" }}>Advisory Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleInputChange} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
        </div>

        {/* Schedule Inputs */}
        <div style={{ display: "flex", gap: "15px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", color: "#475569", display: "block", marginBottom: "5px" }}>Start Time</label>
            <input type="datetime-local" name="schedule_start" value={formData.schedule_start} onChange={handleInputChange} required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", color: "#475569", display: "block", marginBottom: "5px" }}>End Time</label>
            <input type="datetime-local" name="schedule_end" value={formData.schedule_end} onChange={handleInputChange} required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Municipality Selection */}
        <div>
          <label style={{ fontWeight: "bold", color: "#475569", display: "block", marginBottom: "5px" }}>Target Municipality</label>
          <select name="municipality_id" value={formData.municipality_id} onChange={handleInputChange} required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}>
            <option value="" disabled>Select Municipality</option>
            {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        {/* Multi-Select Barangays Checkboxes */}
        {formData.municipality_id && (
          <div>
            <label style={{ fontWeight: "bold", color: "#475569", display: "block", marginBottom: "10px" }}>Select Affected Barangays</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", backgroundColor: "#ffffff", padding: "15px", borderRadius: "10px", border: "1px solid #cbd5e1", maxHeight: "250px", overflowY: "auto" }}>
              {barangays.map(b => (
                <label key={b.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.95rem", color: "#334155" }}>
                  <input 
                    type="checkbox" 
                    checked={formData.selected_barangays.some(selected => selected.id === b.id)}
                    onChange={() => handleBarangayToggle(b)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  {b.name}
                </label>
              ))}
            </div>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "5px" }}>
              {formData.selected_barangays.length} barangay(s) selected
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button type="submit" disabled={loading} style={{ backgroundColor: "#1b0b8c", color: "#ffffff", border: "none", padding: "15px", borderRadius: "10px", fontWeight: "900", fontSize: "1.1rem", cursor: "pointer", marginTop: "10px" }}>
          {loading ? "SCHEDULING..." : "SCHEDULE ADVISORY"}
        </button>

      </form>
    </div>
  );
}

export default AdminScheduleAdvisory;