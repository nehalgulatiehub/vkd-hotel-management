import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  AdminPageShell,
  ThemedTable,
  ThemedTHead,
  ThemedTH,
  ThemedTD,
  ThemedTR,
  ThemedEmptyRow,
  ThemedActionLink,
  filterSelectStyle,
  filterInputStyle,
  filterButtonStyle,
} from "@/components/admin/AdminPageShell";

interface City {
  id: string;
  name: string;
}

interface AnotherHotel {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  rating: number | null;
  city_id: string | null;
  notes: string | null;
  room_types: string | null;
  packages: string | null;
  city?: { name: string } | null;
}

export default function AdminAnotherHotels() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [hotels, setHotels] = useState<AnotherHotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<AnotherHotel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  const [hotelNameFilter, setHotelNameFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [contactNoFilter, setContactNoFilter] = useState("");
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchHotels();
      fetchCities();
    }
  }, [authLoading, canManage]);

  useEffect(() => {
    setFilteredHotels(hotels);
  }, [hotels]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("another_hotels")
        .select("*, city:cities(name)")
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

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase.from("cities").select("id, name").order("name");
      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const handleSearch = () => {
    let result = [...hotels];
    if (hotelNameFilter) result = result.filter(h => h.id === hotelNameFilter);
    if (cityFilter) result = result.filter(h => h.city_id === cityFilter);
    if (emailFilter) result = result.filter(h => h.email?.toLowerCase().includes(emailFilter.toLowerCase()));
    if (contactNoFilter) result = result.filter(h => h.phone?.includes(contactNoFilter));
    setFilteredHotels(result);
  };

  const handleViewAll = () => {
    setHotelNameFilter("");
    setCityFilter("");
    setEmailFilter("");
    setContactNoFilter("");
    setFilteredHotels(hotels);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hotel?")) return;
    try {
      const { error } = await supabase.from("another_hotels").delete().eq("id", id);
      if (error) throw error;
      toast.success("Hotel deleted successfully");
      fetchHotels();
    } catch (error) {
      console.error("Error deleting hotel:", error);
      toast.error("Failed to delete hotel");
    }
  };

  const toggleHotelSelection = (id: string) => {
    setSelectedHotels(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedHotels.length === filteredHotels.length) {
      setSelectedHotels([]);
    } else {
      setSelectedHotels(filteredHotels.map(h => h.id));
    }
  };

  if (authLoading || loading) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Loading...</div>;
  }

  if (!canManage) {
    return <div style={{ padding: 24, textAlign: "center" }}>Access Denied</div>;
  }

  const filterSection = (
    <div>
      {/* Row 1 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <label style={{ fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", minWidth: 80, textAlign: "right" }}>Hotel Name :</label>
        <select value={hotelNameFilter} onChange={e => setHotelNameFilter(e.target.value)} style={{ ...filterSelectStyle, flex: 1, maxWidth: 500 }}>
          <option value="">---Select Type---</option>
          {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <label style={{ fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", minWidth: 50, textAlign: "right", marginLeft: 20 }}>Email :</label>
        <input value={emailFilter} onChange={e => setEmailFilter(e.target.value)} style={{ ...filterInputStyle, width: 160 }} />
      </div>
      {/* Row 2 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <label style={{ fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", minWidth: 80, textAlign: "right" }}>City Name:</label>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={{ ...filterSelectStyle, width: 180 }}>
          <option value="">Select city</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label style={{ fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", minWidth: 70, textAlign: "right", marginLeft: 20 }}>Contact No :</label>
        <input value={contactNoFilter} onChange={e => setContactNoFilter(e.target.value)} style={{ ...filterInputStyle, width: 160 }} />
        <button onClick={handleSearch} style={filterButtonStyle}>Search</button>
      </div>
    </div>
  );

  return (
    <AdminPageShell
      title="Manage Another Hotel"
      actions={[{ label: "View All Records", onClick: handleViewAll }]}
      filterSection={filterSection}
    >
      <ThemedTable>
        <ThemedTHead>
          <ThemedTH>Hotel Name</ThemedTH>
          <ThemedTH>Room</ThemedTH>
          <ThemedTH>Contact Person/Email</ThemedTH>
          <ThemedTH>Contact No/City</ThemedTH>
          <ThemedTH>Address</ThemedTH>
          <ThemedTH>Package</ThemedTH>
          <ThemedTH>Action</ThemedTH>
          <th style={{ border: "1px solid #a88", padding: "5px 8px", backgroundColor: "#c47a7e", textAlign: "center", width: 28 }}>
            <input type="checkbox" checked={selectedHotels.length === filteredHotels.length && filteredHotels.length > 0} onChange={toggleSelectAll} />
          </th>
        </ThemedTHead>
        <tbody>
          {filteredHotels.map((hotel, index) => (
            <ThemedTR key={hotel.id} index={index}>
              <ThemedTD>{hotel.name}</ThemedTD>
              <ThemedTD>{hotel.room_types || ""}</ThemedTD>
              <ThemedTD>
                <div>{hotel.contact_person || ""}</div>
                <div>Email : {hotel.email || ""}</div>
              </ThemedTD>
              <ThemedTD>
                <div>{hotel.phone || ""}</div>
                <div>City : {hotel.city?.name || ""}</div>
              </ThemedTD>
              <ThemedTD>{hotel.address || ""}</ThemedTD>
              <ThemedTD>{hotel.packages || ""}</ThemedTD>
              <ThemedTD>
                <ThemedActionLink onClick={() => navigate(`/admin/another-hotels/add?edit=${hotel.id}`)}>Edit</ThemedActionLink>
                /
                <ThemedActionLink onClick={() => handleDelete(hotel.id)}>Delete</ThemedActionLink>
              </ThemedTD>
              <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "center", verticalAlign: "top" }}>
                <input type="checkbox" checked={selectedHotels.includes(hotel.id)} onChange={() => toggleHotelSelection(hotel.id)} />
              </td>
            </ThemedTR>
          ))}
          {filteredHotels.length === 0 && <ThemedEmptyRow colSpan={8} />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
