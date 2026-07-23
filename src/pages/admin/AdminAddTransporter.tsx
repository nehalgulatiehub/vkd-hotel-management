import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { filterInputStyle, filterSelectStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";

interface City {
  id: string;
  name: string;
}

export default function AdminAddTransporter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", city_id: "", notes: "" });

  useEffect(() => { fetchCities(); if (editId) fetchTransporterData(editId); }, [editId]);

  const fetchCities = async () => { const { data } = await supabase.from("cities").select("*").order("name"); setCities(data || []); };

  const fetchTransporterData = async (id: string) => {
    const { data, error } = await supabase.from("transporters").select("*").eq("id", id).single();
    if (data && !error) { setFormData({ name: data.name || "", email: data.email || "", phone: data.phone || "", address: data.address || "", city_id: data.city_id || "", notes: data.notes || "" }); }
    else { toast.error("Failed to load transporter data"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, city_id: formData.city_id || null };
    if (isEditMode && editId) {
      const { error } = await supabase.from("transporters").update(payload).eq("id", editId);
      if (error) { toast.error("Error updating transporter"); } else { toast.success("Transporter updated successfully"); navigate("/admin/transporters"); }
    } else {
      const { error } = await supabase.from("transporters").insert([payload]);
      if (error) { toast.error("Error adding transporter"); } else { toast.success("Transporter added successfully"); navigate("/admin/transporters"); }
    }
  };

  const handleReset = () => { setFormData({ name: "", email: "", phone: "", address: "", city_id: "", notes: "" }); };

  const labelStyle: React.CSSProperties = { width: 180, textAlign: "right", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" };
  const inputStyle: React.CSSProperties = { ...filterInputStyle, border: "1px solid #999", padding: "2px 4px", flex: 1, maxWidth: 350 };

  return (
    <div style={{ padding: 12, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
      <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, color: "#333" }}>📋 {isEditMode ? "Edit Transporter" : "Add Transporter"}</div>
      <div style={{ border: "1px solid #ccc" }}>
        <div style={{ backgroundColor: "#b44a50", color: "#fff", padding: "4px 10px", fontSize: 11, fontWeight: "bold" }}>{isEditMode ? "Edit Transporter" : "Add Transporter"}</div>
        <form onSubmit={handleSubmit} style={{ padding: 16, backgroundColor: "#f6f0f0" }}>
          <div style={{ textAlign: "right", fontSize: 10, color: "red", marginBottom: 12 }}>* - Required Fields</div>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <label style={labelStyle}>Transporter Name :</label>
            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} required />
            <span style={{ color: "red" }}>*</span>
          </div>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <label style={{ ...labelStyle, paddingTop: 4 }}>Email(s) :</label>
            <div style={{ flex: 1, maxWidth: 350 }}>
              <textarea value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} rows={3} style={{ ...inputStyle, width: "100%", fontFamily: "Arial", fontSize: 11 }} />
              <div style={{ fontSize: 10, color: "#666" }}>(Please enter every email in new line)</div>
            </div>
          </div>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <label style={{ ...labelStyle, paddingTop: 4 }}>Address :</label>
            <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={3} style={{ ...inputStyle, fontFamily: "Arial", fontSize: 11 }} />
          </div>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <label style={labelStyle}>City :</label>
            <select value={formData.city_id} onChange={e => setFormData({ ...formData, city_id: e.target.value })} style={{ ...filterSelectStyle, border: "1px solid #999", minWidth: 200 }}>
              <option value="">-City-</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <label style={{ ...labelStyle, paddingTop: 4 }}>Contact Person with Contact Details :</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} style={{ ...inputStyle, fontFamily: "Arial", fontSize: 11 }} />
          </div>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <label style={labelStyle}>Contact No. :</label>
            <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            <button type="submit" style={filterButtonStyle}>{isEditMode ? "Update" : "Add"}</button>
            <button type="button" onClick={handleReset} style={filterButtonStyle}>Reset</button>
          </div>
        </form>
      </div>
    </div>
  );
}
