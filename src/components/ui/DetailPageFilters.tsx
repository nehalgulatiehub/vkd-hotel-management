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

  const selectClass = "h-6 text-[11px] border border-gray-400 px-1 bg-white";
  const inputClass = "h-6 text-[11px] border border-gray-400 px-1 bg-white";
  const labelClass = "text-[11px] text-gray-700 whitespace-nowrap";

  return (
    <div className="border border-[#1e6e99] bg-[#FDE1E1]">
      {/* Row 1: Date Range */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-1 border-b border-[#c99]">
        <div className="flex items-center gap-1">
          <span className={labelClass}>From :</span>
          <select className={selectClass} value={filters.fromMonth} onChange={(e) => updateFilter("fromMonth", e.target.value)}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select className={selectClass} value={filters.fromDay} onChange={(e) => updateFilter("fromDay", e.target.value)}>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="text" className={`${inputClass} w-12`} value={filters.fromYear} onChange={(e) => updateFilter("fromYear", e.target.value)} />
        </div>
        
        <div className="flex items-center gap-1">
          <span className={labelClass}>To :</span>
          <select className={selectClass} value={filters.toMonth} onChange={(e) => updateFilter("toMonth", e.target.value)}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select className={selectClass} value={filters.toDay} onChange={(e) => updateFilter("toDay", e.target.value)}>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="text" className={`${inputClass} w-12`} value={filters.toYear} onChange={(e) => updateFilter("toYear", e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <span className={labelClass}>Search with Date :</span>
          <label className="flex items-center gap-1 text-[11px]">
            <input type="radio" name="searchDate" checked={filters.searchWithDate} onChange={() => updateFilter("searchWithDate", true)} />
            YES
          </label>
          <label className="flex items-center gap-1 text-[11px]">
            <input type="radio" name="searchDate" checked={!filters.searchWithDate} onChange={() => updateFilter("searchWithDate", false)} />
            NO
          </label>
        </div>
      </div>

      {/* Row 2: Type, Agent, Reference, User */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-1 border-b border-[#c99]">
        {options.showType && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>Type</span>
            <select className={`${selectClass} w-24`} value={filters.type} onChange={(e) => updateFilter("type", e.target.value)}>
              <option value="">--Select--</option>
              <option value="direct">Direct</option>
              <option value="agent">Agent</option>
            </select>
          </div>
        )}

        {options.showAgent && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>Agent Name :</span>
            <select className={`${selectClass} w-36`} value={filters.agentId} onChange={(e) => updateFilter("agentId", e.target.value)}>
              <option value="">--Select--</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        {options.showReference && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>Reference :</span>
            <input type="text" className={`${inputClass} w-24`} value={filters.reference} onChange={(e) => updateFilter("reference", e.target.value)} />
          </div>
        )}

        {options.showUser && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>User :</span>
            <select className={`${selectClass} w-24`} value={filters.user} onChange={(e) => updateFilter("user", e.target.value)}>
              <option value="">--Select--</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown'}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Row 3: Customer, Transporter, Ticket No, Vehicle, Hotel, City, Search Button */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-1">
        {options.showUser && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>User</span>
            <select className={`${selectClass} w-24`} value={filters.user} onChange={(e) => updateFilter("user", e.target.value)}>
              <option value="">--Select--</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown'}</option>)}
            </select>
          </div>
        )}

        {options.showCustomer && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>Customer :</span>
            <input type="text" className={`${inputClass} w-28`} value={filters.customer} onChange={(e) => updateFilter("customer", e.target.value)} />
          </div>
        )}

        {options.showTransporter && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>Transporter :</span>
            <select className={`${selectClass} w-32`} value={filters.transporterId} onChange={(e) => updateFilter("transporterId", e.target.value)}>
              <option value="">Select</option>
              {transporters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {options.showTicketNo && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>Ticket No :</span>
            <input type="text" className={`${inputClass} w-24`} value={filters.ticketNo} onChange={(e) => updateFilter("ticketNo", e.target.value)} />
          </div>
        )}

        {options.showVehicle && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>Vehicle :</span>
            <input type="text" className={`${inputClass} w-24`} value={filters.vehicle} onChange={(e) => updateFilter("vehicle", e.target.value)} />
          </div>
        )}

        {options.showHotel && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>Hotel Name :</span>
            <select className={`${selectClass} w-36`} value={filters.hotelId} onChange={(e) => updateFilter("hotelId", e.target.value)}>
              <option value="">-------Select--------</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}

        {options.showCity && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>City</span>
            <select className={`${selectClass} w-36`} value={filters.cityId} onChange={(e) => updateFilter("cityId", e.target.value)}>
              <option value="">--Select City--</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {options.showNoOfSafari && (
          <div className="flex items-center gap-1">
            <span className={labelClass}>No of Safari</span>
            <input type="text" className={`${inputClass} w-16`} value={filters.noOfSafari} onChange={(e) => updateFilter("noOfSafari", e.target.value)} />
          </div>
        )}

        <button 
          onClick={onSearch}
          className="h-6 px-4 text-[11px] font-medium bg-gray-200 border border-gray-400 hover:bg-gray-300"
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
