import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FilterOptions {
  showType?: boolean;
  showAgent?: boolean;
  showUser?: boolean;
  showCustomer?: boolean;
  showReference?: boolean;
  showTransporter?: boolean;
  showHotel?: boolean;
  showCity?: boolean;
  showVehicle?: boolean;
  showTicketNo?: boolean;
  showNoOfSafari?: boolean;
}

interface FilterValues {
  fromMonth: string;
  fromDay: string;
  fromYear: string;
  toMonth: string;
  toDay: string;
  toYear: string;
  searchWithDate: boolean;
  type: string;
  agentId: string;
  user: string;
  customer: string;
  reference: string;
  transporterId: string;
  hotelId: string;
  cityId: string;
  vehicle: string;
  ticketNo: string;
  noOfSafari: string;
}

interface DetailPageFiltersProps {
  options: FilterOptions;
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  onSearch: () => void;
}

const months = [
  { value: "01", label: "Jan" }, { value: "02", label: "Feb" }, { value: "03", label: "Mar" },
  { value: "04", label: "Apr" }, { value: "05", label: "May" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Aug" }, { value: "09", label: "Sep" },
  { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" }
];

const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const years = Array.from({ length: 10 }, (_, i) => String(2020 + i));

const MAROON = "#b44a50";

const selectStyle: React.CSSProperties = {
  border: "1px solid #999", padding: "2px 4px", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", height: 22, backgroundColor: "#fff"
};
const inputStyle: React.CSSProperties = {
  border: "1px solid #999", padding: "2px 4px", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", height: 22, backgroundColor: "#fff"
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", color: "#606060", whiteSpace: "nowrap"
};
const rowStyle: React.CSSProperties = {
  display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 16px", padding: "4px 10px", borderBottom: "1px solid #ccc", backgroundColor: "#fff"
};

export function DetailPageFilters({ options, filters, onFilterChange, onSearch }: DetailPageFiltersProps) {
  const [agents, setAgents] = useState<any[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (options.showAgent) fetchAgents();
    if (options.showTransporter) fetchTransporters();
    if (options.showHotel) fetchHotels();
    if (options.showCity) fetchCities();
    if (options.showUser) fetchUsers();
  }, [options]);

  const fetchAgents = async () => {
    const { data } = await supabase.from("agents").select("id, name").order("name");
    setAgents(data || []);
  };
  const fetchTransporters = async () => {
    const { data } = await supabase.from("transporters").select("id, name").order("name");
    setTransporters(data || []);
  };
  const fetchHotels = async () => {
    const { data } = await supabase.from("another_hotels").select("id, name").order("name");
    setHotels(data || []);
  };
  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("id, name").order("name");
    setCities(data || []);
  };
  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, username, first_name, last_name").order("first_name");
    setUsers(data || []);
  };

  const updateFilter = (key: keyof FilterValues, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div style={{ border: "1px solid #ccc" }}>
      {/* Search header bar */}
      <div style={{
        backgroundColor: MAROON, color: "#fff", padding: "4px 10px", fontSize: 11,
        fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: "Arial, Helvetica, sans-serif"
      }}>
        <span>Search</span>
        <span style={{ cursor: "pointer", textDecoration: "underline", fontSize: 11 }}>View All Records</span>
      </div>

      {/* Row 1: Date Range */}
      <div style={rowStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={labelStyle}>From :</span>
          <select style={{ ...selectStyle, minWidth: 50 }} value={filters.fromMonth} onChange={(e) => updateFilter("fromMonth", e.target.value)}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select style={{ ...selectStyle, minWidth: 40 }} value={filters.fromDay} onChange={(e) => updateFilter("fromDay", e.target.value)}>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="text" style={{ ...inputStyle, width: 48 }} value={filters.fromYear} onChange={(e) => updateFilter("fromYear", e.target.value)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={labelStyle}>To :</span>
          <select style={{ ...selectStyle, minWidth: 50 }} value={filters.toMonth} onChange={(e) => updateFilter("toMonth", e.target.value)}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select style={{ ...selectStyle, minWidth: 40 }} value={filters.toDay} onChange={(e) => updateFilter("toDay", e.target.value)}>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="text" style={{ ...inputStyle, width: 48 }} value={filters.toYear} onChange={(e) => updateFilter("toYear", e.target.value)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={labelStyle}>Search with Date :</span>
          <label style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}>
            <input type="radio" name="searchDate" checked={filters.searchWithDate} onChange={() => updateFilter("searchWithDate", true)} /> YES
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}>
            <input type="radio" name="searchDate" checked={!filters.searchWithDate} onChange={() => updateFilter("searchWithDate", false)} /> NO
          </label>
        </div>
      </div>

      {/* Row 2: Type, Agent, Reference, User */}
      <div style={rowStyle}>
        {options.showType && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>Type</span>
            <select style={{ ...selectStyle, minWidth: 90 }} value={filters.type} onChange={(e) => updateFilter("type", e.target.value)}>
              <option value="">--Select--</option>
              <option value="direct">Direct</option>
              <option value="agent">Agent</option>
            </select>
          </div>
        )}
        {options.showAgent && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>Agent Name :</span>
            <select style={{ ...selectStyle, minWidth: 130 }} value={filters.agentId} onChange={(e) => updateFilter("agentId", e.target.value)}>
              <option value="">--Select--</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}
        {options.showReference && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>Reference :</span>
            <input type="text" style={{ ...inputStyle, width: 90 }} value={filters.reference} onChange={(e) => updateFilter("reference", e.target.value)} />
          </div>
        )}
        {options.showUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>User :</span>
            <select style={{ ...selectStyle, minWidth: 90 }} value={filters.user} onChange={(e) => updateFilter("user", e.target.value)}>
              <option value="">--Select--</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown'}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Row 3: Customer, Transporter, etc + Search Button */}
      <div style={{ ...rowStyle, borderBottom: "none" }}>
        {options.showCustomer && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>Customer :</span>
            <input type="text" style={{ ...inputStyle, width: 100 }} value={filters.customer} onChange={(e) => updateFilter("customer", e.target.value)} />
          </div>
        )}
        {options.showTransporter && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>Transporter :</span>
            <select style={{ ...selectStyle, minWidth: 120 }} value={filters.transporterId} onChange={(e) => updateFilter("transporterId", e.target.value)}>
              <option value="">Select</option>
              {transporters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        {options.showTicketNo && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>Ticket No :</span>
            <input type="text" style={{ ...inputStyle, width: 90 }} value={filters.ticketNo} onChange={(e) => updateFilter("ticketNo", e.target.value)} />
          </div>
        )}
        {options.showVehicle && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>Vehicle :</span>
            <input type="text" style={{ ...inputStyle, width: 90 }} value={filters.vehicle} onChange={(e) => updateFilter("vehicle", e.target.value)} />
          </div>
        )}
        {options.showHotel && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>Hotel Name :</span>
            <select style={{ ...selectStyle, minWidth: 130 }} value={filters.hotelId} onChange={(e) => updateFilter("hotelId", e.target.value)}>
              <option value="">-------Select--------</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
        {options.showCity && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>City</span>
            <select style={{ ...selectStyle, minWidth: 130 }} value={filters.cityId} onChange={(e) => updateFilter("cityId", e.target.value)}>
              <option value="">--Select City--</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        {options.showNoOfSafari && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>No of Safari</span>
            <input type="text" style={{ ...inputStyle, width: 60 }} value={filters.noOfSafari} onChange={(e) => updateFilter("noOfSafari", e.target.value)} />
          </div>
        )}
        <button
          onClick={onSearch}
          style={{
            border: "1px solid #888", padding: "2px 12px", fontSize: 11,
            fontFamily: "Arial, Helvetica, sans-serif", backgroundColor: "#f5f5f5", cursor: "pointer", height: 22
          }}
        >
          Search
        </button>
      </div>
    </div>
  );
}

export const getDefaultFilters = (): FilterValues => {
  const now = new Date();
  return {
    fromMonth: String(now.getMonth() + 1).padStart(2, "0"),
    fromDay: String(now.getDate()).padStart(2, "0"),
    fromYear: String(now.getFullYear()),
    toMonth: String(now.getMonth() + 1).padStart(2, "0"),
    toDay: String(now.getDate()).padStart(2, "0"),
    toYear: String(now.getFullYear()),
    searchWithDate: false,
    type: "",
    agentId: "",
    user: "",
    customer: "",
    reference: "",
    transporterId: "",
    hotelId: "",
    cityId: "",
    vehicle: "",
    ticketNo: "",
    noOfSafari: ""
  };
};

export type { FilterValues, FilterOptions };
