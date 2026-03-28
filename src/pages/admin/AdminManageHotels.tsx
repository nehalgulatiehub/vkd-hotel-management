import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";

interface OwnHotel {
  id: string;
  name: string;
}

export default function AdminManageHotels() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [hotels, setHotels] = useState<OwnHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchHotels();
    }
  }, [authLoading, canManage]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("own_hotels")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      toast.error("Failed to fetch hotels");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? hotels.map(h => h.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter(sid => sid !== id));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one hotel to delete");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} hotel(s)?`)) return;

    try {
      const { error } = await supabase
        .from("own_hotels")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`${selectedIds.length} hotel(s) deleted successfully`);
      setSelectedIds([]);
      fetchHotels();
    } catch (error) {
      console.error("Error deleting hotels:", error);
      toast.error("Failed to delete hotels");
    }
  };

  if (authLoading || loading) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Loading...</div>;
  }

  if (!canManage) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Access Denied</div>;
  }

  return (
    <div style={{ padding: 12, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
      <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, color: "#333" }}>📋 Manage Hotel</div>
      
      {/* Maroon header bar */}
      <div style={{ backgroundColor: "#b44a50", color: "#fff", padding: "4px 10px", fontSize: 11, fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Manage Hotel</span>
        <div style={{ display: "flex", gap: 6 }}>
          <span onClick={() => navigate("/admin/own-hotels")} style={{ color: "#fff", cursor: "pointer", textDecoration: "underline", fontSize: 11 }}>Back to Hotels</span>
          <span onClick={() => navigate("/admin/own-hotels/add")} style={{ color: "#fff", cursor: "pointer", textDecoration: "underline", fontSize: 11 }}>Add Hotel</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #ccc", borderTop: "none", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
          <thead>
            <tr style={{ backgroundColor: "#c47a7e", color: "#fff", fontWeight: "bold" }}>
              <th style={{ border: "1px solid #a88", padding: "5px 8px", textAlign: "left", fontWeight: "bold", fontSize: 11, color: "#fff" }}>Hotel</th>
              <th style={{ border: "1px solid #a88", padding: "5px 8px", textAlign: "center", fontWeight: "bold", fontSize: 11, color: "#fff", width: 200 }}>Action</th>
              <th style={{ border: "1px solid #a88", padding: "5px 8px", textAlign: "center", fontWeight: "bold", fontSize: 11, color: "#fff", width: 40 }}>
                <input type="checkbox" checked={selectedIds.length === hotels.length && hotels.length > 0} onChange={(e) => handleSelectAll(e.target.checked)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((hotel, index) => (
              <tr key={hotel.id} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f6f0f0" }}>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", fontSize: 11, color: "#606060" }}>{hotel.name}</td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", fontSize: 11, textAlign: "center" }}>
                  <span onClick={() => navigate(`/admin/own-hotels/add?edit=${hotel.id}`)} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Edit</span>
                  <span style={{ color: "#999", margin: "0 8px" }}>|</span>
                  <span onClick={() => navigate(`/admin/hotels/${hotel.id}/rooms`)} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Manage Rooms</span>
                  <span style={{ color: "#999", margin: "0 8px" }}>|</span>
                  <span onClick={() => toast.info("Package management coming soon")} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Manage Package</span>
                </td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "center" }}>
                  <input type="checkbox" checked={selectedIds.includes(hotel.id)} onChange={(e) => handleSelectOne(hotel.id, e.target.checked)} />
                </td>
              </tr>
            ))}
            {hotels.length === 0 && (
              <tr>
                <td colSpan={3} style={{ border: "1px solid #ddd", padding: "20px 8px", textAlign: "center", color: "#999", fontSize: 11 }}>No hotels found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={handleDeleteSelected} disabled={selectedIds.length === 0} style={{ border: "1px solid #888", padding: "2px 12px", fontSize: 11, backgroundColor: "#f5f5f5", cursor: selectedIds.length === 0 ? "not-allowed" : "pointer", opacity: selectedIds.length === 0 ? 0.5 : 1 }}>Delete</button>
      </div>
    </div>
  );
}