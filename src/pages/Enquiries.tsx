import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { LegacyDatePicker } from "@/components/ui/LegacyDatePicker";
import { formatDisplayDate } from "@/utils/dateFormat";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { LegacyPanelHeader } from "@/components/legacy/LegacyPanelHeader";
import { LegacyFormPanel } from "@/components/legacy/LegacyFormPanel";
import { LegacyFormRow } from "@/components/legacy/LegacyFormRow";
import {
  legacyFilterContainerStyle,
  legacyFilterLabelClass,
  legacyFilterInputClass,
  legacySearchButtonStyle,
} from "@/components/legacy/legacyFilterStyles";


export default function Enquiries() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAddRoute = location.pathname.replace(/\/+$/, "").endsWith("/add");
  const [showForm, setShowForm] = useState(isAddRoute);

  // Keep the form open/closed in sync with the route so clicking
  // "Generate Enquiry" while already on "View Enquiry" works.
  useEffect(() => {
    setShowForm(isAddRoute);
  }, [isAddRoute]);

  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [ownHotels, setOwnHotels] = useState<any[]>([]);
  const [anotherHotels, setAnotherHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEnquiryId, setEditingEnquiryId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    booking_type: "agent",
    agent_id: "",
    reference: "",
    reference_email: "",
    customer_name: "",
    address: "",
    contact_no: "",
    email: "",
    city_id: "",
    adults: 1,
    children: 0,
    notes: "",
    check_in_date: "",
    check_out_date: "",
    include_booking: false,
    include_delhi_manali: false,
    include_manali_delhi: false,
    include_safari: false,
    include_another_hotel: false,
    include_additional_vehicle: false,
    include_group_expenses: false,
    agent_commission: "",
    cheque_no: "",
    booking_hotel_id: "",
    booking_room: "",
    booking_num_rooms: "",
    booking_package_type: "select",
    booking_custom_package: "",
    booking_price: "",
    booking_from: "",
    booking_to: "",
    dm_num_tickets: "",
    dm_ticket_no: "",
    dm_seat_no: "",
    dm_transporter_id: "",
    dm_booking_date: "",
    dm_journey_date: "",
    dm_booking_price: "",
    dm_selling_price: "",
    md_num_tickets: "",
    md_ticket_no: "",
    md_seat_no: "",
    md_transporter_id: "",
    md_booking_date: "",
    md_journey_date: "",
    md_booking_price: "",
    md_selling_price: "",
    safari_transporter_id: "",
    safari_num: "",
    safari_booking_date: "",
    safari_journey_date: "",
    safari_booking_price: "",
    safari_selling_price: "",
    safari_note: "",
    another_hotel_id: "",
    another_hotel_num_rooms: "",
    another_hotel_room_type: "",
    another_hotel_booking_date: "",
    another_hotel_check_in: "",
    another_hotel_check_out: "",
    another_hotel_booking_price: "",
    another_hotel_selling_price: "",
    another_hotel_note: "",
    vehicle_details: "",
    vehicle_booking_price: "",
    vehicle_selling_price: "",
    vehicle_transporter_id: "",
    vehicle_booking_date: "",
    vehicle_journey_date: "",
    vehicle_note: "",
    group_expense_amount: "",
    group_expense_details: ""
  });

  const today = new Date().toISOString().slice(0, 10);
  const [cities, setCities] = useState<any[]>([]);
  const { profiles, getUserName } = useProfilesMap();
  const [filters, setFilters] = useState({
    from: today,
    to: today,
    searchWithDate: false,
    type: "",
    agentId: "",
    reference: "",
    status: "",
    userId: "",
    email: "",
    contactNo: "",
    cityId: "",
    customer: "",
  });

  useEffect(() => {
    fetchEnquiries();
    fetchAgents();
    fetchOwnHotels();
    fetchHotels();
    fetchAnotherHotels();
    fetchTransporters();
    fetchCities();
  }, []);

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("id, name").order("name");
    setCities(data || []);
  };

  const handleEditEnquiry = (enquiry: any) => {
    setEditingEnquiryId(enquiry.id);
    setFormData((prev) => {
      const next: any = { ...prev };
      Object.keys(prev).forEach((key) => {
        const value = (enquiry as any)[key];
        const current = (prev as any)[key];
        if (typeof current === "boolean") next[key] = !!value;
        else if (typeof current === "number") next[key] = value ?? current;
        else next[key] = value == null ? "" : String(value);
      });
      next.booking_type = enquiry.booking_type || (enquiry.agent_id ? "agent" : "direct");
      next.booking_package_type = enquiry.booking_package_type || "select";
      next.city_id = enquiry.destination_city_id || "";
      return next;
    });
    setShowForm(true);
  };


  const fetchEnquiries = async () => {
    const { data, error } = await supabase
      .from("enquiries")
      .select("*, agents(name)")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load enquiries");
    } else {
      setEnquiries(data || []);
    }
  };

  const fetchAgents = async () => {
    const { data } = await supabase
      .from("agents")
      .select("*")
      .order("name");
    setAgents(data || []);
  };

  const fetchOwnHotels = async () => {
    const { data } = await supabase
      .from("own_hotels")
      .select("*")
      .order("name");
    setOwnHotels(data || []);
  };

  const fetchHotels = async () => {
    const { data } = await supabase
      .from("another_hotels")
      .select("*")
      .order("name");
    setHotels(data || []);
  };

  const fetchAnotherHotels = async () => {
    const { data } = await supabase
      .from("another_hotels")
      .select("*")
      .order("name");
    setAnotherHotels(data || []);
  };

  const fetchTransporters = async () => {
    const { data } = await supabase
      .from("transporters")
      .select("*")
      .order("name");
    setTransporters(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const enquiryData: Record<string, any> = {
      ...(!editingEnquiryId && { enquiry_number: `ENQ${Date.now().toString().slice(-8)}` }),
      booking_type: formData.booking_type,
      agent_id: formData.booking_type === "agent" && formData.agent_id ? formData.agent_id : null,
      reference: formData.reference || null,
      reference_email: formData.reference_email || null,
      customer_name: formData.customer_name || null,
      address: formData.address || null,
      contact_no: formData.contact_no || null,
      email: formData.email || null,
      destination_city_id: formData.city_id || null,
      check_in_date: formData.check_in_date || null,
      check_out_date: formData.check_out_date || null,
      adults: formData.adults,
      children: formData.children,
      notes: formData.notes,
      special_requests: formData.notes || null,
      agent_commission: formData.agent_commission === "" ? 0 : Number(formData.agent_commission),
      include_booking: formData.include_booking,
      include_delhi_manali: formData.include_delhi_manali,
      include_manali_delhi: formData.include_manali_delhi,
      include_safari: formData.include_safari,
      include_another_hotel: formData.include_another_hotel,
      include_additional_vehicle: formData.include_additional_vehicle,
      include_group_expenses: formData.include_group_expenses,
      status: "on_hold"
    };

    // Persist the per-service detail fields (only for the sections set to Yes)
    const detailGroups: Record<string, string[]> = {
      include_booking: ["booking_hotel_id", "booking_room", "booking_num_rooms", "booking_package_type", "booking_custom_package", "booking_price", "booking_from", "booking_to"],
      include_delhi_manali: ["dm_num_tickets", "dm_ticket_no", "dm_seat_no", "dm_transporter_id", "dm_booking_date", "dm_journey_date", "dm_booking_price", "dm_selling_price"],
      include_manali_delhi: ["md_num_tickets", "md_ticket_no", "md_seat_no", "md_transporter_id", "md_booking_date", "md_journey_date", "md_booking_price", "md_selling_price"],
      include_safari: ["safari_transporter_id", "safari_num", "safari_booking_date", "safari_journey_date", "safari_booking_price", "safari_selling_price", "safari_note"],
      include_another_hotel: ["another_hotel_id", "another_hotel_num_rooms", "another_hotel_room_type", "another_hotel_booking_date", "another_hotel_check_in", "another_hotel_check_out", "another_hotel_booking_price", "another_hotel_selling_price", "another_hotel_note"],
      include_additional_vehicle: ["vehicle_details", "vehicle_booking_price", "vehicle_selling_price", "vehicle_transporter_id", "vehicle_booking_date", "vehicle_journey_date", "vehicle_note"],
      include_group_expenses: ["group_expense_amount", "group_expense_details"],
    };

    Object.entries(detailGroups).forEach(([flag, keys]) => {
      const on = (formData as any)[flag];
      keys.forEach((k) => {
        const val = (formData as any)[k];
        enquiryData[k] = on ? (val === "" || val == null ? null : String(val)) : null;
      });
    });


    if (formData.booking_type === "agent" && !formData.agent_id) {
      toast.error("Please select an agent");
      return;
    }


    if (editingEnquiryId) {
      const { error } = await supabase
        .from("enquiries")
        .update(enquiryData as any)
        .eq("id", editingEnquiryId);

      if (error) {
        toast.error("Failed to update enquiry");
        console.error(error);
      } else {
        toast.success("Enquiry updated successfully");
        resetForm();
        fetchEnquiries();
      }
    } else {
      const { error } = await supabase
        .from("enquiries")
        .insert([enquiryData] as any);

      if (error) {
        toast.error("Failed to create enquiry");
        console.error(error);
      } else {
        toast.success("Enquiry created successfully");
        resetForm();
        fetchEnquiries();
      }
    }
  };

  const handleConvertToBooking = async (enquiry: any) => {
    if (!confirm("Convert this enquiry to a confirmed booking?")) return;

    try {
      const bookingData = {
        booking_number: `BK${Date.now().toString().slice(-8)}`,
        booking_type: enquiry.booking_type,
        agent_id: enquiry.agent_id,
        reference: enquiry.reference,
        reference_email: enquiry.reference_email,
        customer_name: enquiry.customer_name,
        address: enquiry.address,
        contact_no: enquiry.contact_no,
        email: enquiry.email,
        check_in_date: enquiry.check_in_date,
        check_out_date: enquiry.check_out_date,
        adults: enquiry.adults,
        children: enquiry.children,
        notes: enquiry.notes,
        include_booking: enquiry.include_booking,
        include_delhi_manali: enquiry.include_delhi_manali,
        include_manali_delhi: enquiry.include_manali_delhi,
        include_safari: enquiry.include_safari,
        include_another_hotel: enquiry.include_another_hotel,
        include_additional_vehicle: enquiry.include_additional_vehicle,
        include_group_expenses: enquiry.include_group_expenses,
        agent_commission: enquiry.agent_commission,
        cheque_no: enquiry.cheque_no,
        status: "confirmed" as const,
        payment_status: "pending" as const,
        total_amount: 0,
        paid_amount: 0,
        due_amount: 0
      };

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) throw bookingError;

      const bookingId = booking.id;
      let totalAmount = 0;

      if (enquiry.include_booking && enquiry.booking_hotel_id) {
        const hotelAmount = enquiry.booking_price ? parseFloat(enquiry.booking_price) : 0;
        totalAmount += hotelAmount;
        
        await supabase.from("hotel_bookings").insert([{
          booking_id: bookingId,
          own_hotel_id: enquiry.booking_hotel_id,
          hotel_id: null,
          check_in_date: enquiry.booking_from || enquiry.check_in_date,
          check_out_date: enquiry.booking_to || enquiry.check_out_date,
          room_type: enquiry.booking_room,
          number_of_rooms: enquiry.booking_num_rooms ? parseInt(enquiry.booking_num_rooms) : 1,
          room_rate: hotelAmount,
          total_amount: hotelAmount,
          paid_amount: 0,
          due_amount: hotelAmount,
          notes: enquiry.booking_custom_package
        }]);
      }

      if (enquiry.include_delhi_manali) {
        const volvoAmount = enquiry.dm_selling_price ? parseFloat(enquiry.dm_selling_price) : 0;
        totalAmount += volvoAmount;
        
        await supabase.from("volvo_bookings").insert([{
          booking_id: bookingId,
          route: "delhi_manali",
          travel_date: enquiry.dm_journey_date,
          number_of_seats: enquiry.dm_num_tickets ? parseInt(enquiry.dm_num_tickets) : 1,
          rate_per_seat: enquiry.dm_booking_price ? parseFloat(enquiry.dm_booking_price) : 0,
          total_amount: volvoAmount,
          paid_amount: 0,
          due_amount: volvoAmount,
          notes: `Ticket No: ${enquiry.dm_ticket_no}, Seat No: ${enquiry.dm_seat_no}`
        }]);
      }

      if (enquiry.include_manali_delhi) {
        const volvoAmount = enquiry.md_selling_price ? parseFloat(enquiry.md_selling_price) : 0;
        totalAmount += volvoAmount;
        
        await supabase.from("volvo_bookings").insert([{
          booking_id: bookingId,
          route: "manali_delhi",
          travel_date: enquiry.md_journey_date,
          number_of_seats: enquiry.md_num_tickets ? parseInt(enquiry.md_num_tickets) : 1,
          rate_per_seat: enquiry.md_booking_price ? parseFloat(enquiry.md_booking_price) : 0,
          total_amount: volvoAmount,
          paid_amount: 0,
          due_amount: volvoAmount,
          notes: `Ticket No: ${enquiry.md_ticket_no}, Seat No: ${enquiry.md_seat_no}`
        }]);
      }

      if (enquiry.include_safari) {
        const safariAmount = enquiry.safari_selling_price ? parseFloat(enquiry.safari_selling_price) : 0;
        totalAmount += safariAmount;
        
        await supabase.from("safari_bookings").insert([{
          booking_id: bookingId,
          safari_name: "Safari",
          safari_date: enquiry.safari_journey_date,
          number_of_persons: enquiry.safari_num ? parseInt(enquiry.safari_num) : 1,
          rate_per_person: enquiry.safari_booking_price ? parseFloat(enquiry.safari_booking_price) : 0,
          total_amount: safariAmount,
          paid_amount: 0,
          due_amount: safariAmount,
          notes: enquiry.safari_note
        }]);
      }

      if (enquiry.include_another_hotel && enquiry.another_hotel_id) {
        const anotherHotelAmount = enquiry.another_hotel_selling_price ? parseFloat(enquiry.another_hotel_selling_price) : 0;
        totalAmount += anotherHotelAmount;
        
        await supabase.from("hotel_bookings").insert([{
          booking_id: bookingId,
          hotel_id: enquiry.another_hotel_id,
          own_hotel_id: null,
          check_in_date: enquiry.another_hotel_check_in,
          check_out_date: enquiry.another_hotel_check_out,
          room_type: enquiry.another_hotel_room_type,
          number_of_rooms: enquiry.another_hotel_num_rooms ? parseInt(enquiry.another_hotel_num_rooms) : 1,
          room_rate: enquiry.another_hotel_booking_price ? parseFloat(enquiry.another_hotel_booking_price) : 0,
          total_amount: anotherHotelAmount,
          paid_amount: 0,
          due_amount: anotherHotelAmount,
          notes: enquiry.another_hotel_note
        }]);
      }

      if (enquiry.include_additional_vehicle) {
        const vehicleAmount = enquiry.vehicle_selling_price ? parseFloat(enquiry.vehicle_selling_price) : 0;
        totalAmount += vehicleAmount;
        
        await supabase.from("vehicle_bookings").insert([{
          booking_id: bookingId,
          transporter_id: enquiry.vehicle_transporter_id || null,
          vehicle_type: "other" as const,
          pickup_date: enquiry.vehicle_booking_date,
          dropoff_date: enquiry.vehicle_journey_date,
          rate: enquiry.vehicle_booking_price ? parseFloat(enquiry.vehicle_booking_price) : 0,
          total_amount: vehicleAmount,
          paid_amount: 0,
          due_amount: vehicleAmount,
          notes: `${enquiry.vehicle_details}\n${enquiry.vehicle_note}`
        }]);
      }

      if (enquiry.include_group_expenses && enquiry.group_expense_amount) {
        const expenseAmount = parseFloat(enquiry.group_expense_amount);
        totalAmount += expenseAmount;
        
        await supabase.from("group_expenses").insert([{
          booking_id: bookingId,
          amount: expenseAmount,
          description: enquiry.group_expense_details,
          expense_date: new Date().toISOString().split('T')[0],
          category: "Group Expense"
        }]);
      }

      await supabase.from("bookings").update({
        total_amount: totalAmount,
        due_amount: totalAmount,
        payment_status: totalAmount > 0 ? "pending" : "paid"
      }).eq("id", bookingId);

      const { error: updateError } = await supabase
        .from("enquiries")
        .update({ status: "converted" })
        .eq("id", enquiry.id);

      if (updateError) throw updateError;

      toast.success("Enquiry converted to booking successfully");
      fetchEnquiries();
      navigate(`/bookings`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to convert enquiry");
    }
  };

  const resetForm = () => {
    setFormData({
      booking_type: "agent",
      agent_id: "",
      reference: "",
      reference_email: "",
      customer_name: "",
      address: "",
      contact_no: "",
      email: "",
      city_id: "",
      adults: 1,
      children: 0,
      notes: "",
      check_in_date: "",
      check_out_date: "",
      include_booking: false,
      include_delhi_manali: false,
      include_manali_delhi: false,
      include_safari: false,
      include_another_hotel: false,
      include_additional_vehicle: false,
      include_group_expenses: false,
      agent_commission: "",
      cheque_no: "",
      booking_hotel_id: "",
      booking_room: "",
      booking_num_rooms: "",
      booking_package_type: "select",
      booking_custom_package: "",
      booking_price: "",
      booking_from: "",
      booking_to: "",
      dm_num_tickets: "",
      dm_ticket_no: "",
      dm_seat_no: "",
      dm_transporter_id: "",
      dm_booking_date: "",
      dm_journey_date: "",
      dm_booking_price: "",
      dm_selling_price: "",
      md_num_tickets: "",
      md_ticket_no: "",
      md_seat_no: "",
      md_transporter_id: "",
      md_booking_date: "",
      md_journey_date: "",
      md_booking_price: "",
      md_selling_price: "",
      safari_transporter_id: "",
      safari_num: "",
      safari_booking_date: "",
      safari_journey_date: "",
      safari_booking_price: "",
      safari_selling_price: "",
      safari_note: "",
      another_hotel_id: "",
      another_hotel_num_rooms: "",
      another_hotel_room_type: "",
      another_hotel_booking_date: "",
      another_hotel_check_in: "",
      another_hotel_check_out: "",
      another_hotel_booking_price: "",
      another_hotel_selling_price: "",
      another_hotel_note: "",
      vehicle_details: "",
      vehicle_booking_price: "",
      vehicle_selling_price: "",
      vehicle_transporter_id: "",
      vehicle_booking_date: "",
      vehicle_journey_date: "",
      vehicle_note: "",
      group_expense_amount: "",
      group_expense_details: ""
    });
    setShowForm(false);
    setEditingEnquiryId(null);
    if (isAddRoute) navigate("/enquiries", { replace: true });
  };

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enquiry) => {
      const like = (val: any, term: string) => (val || "").toString().toLowerCase().includes(term.toLowerCase());
      if (filters.customer && !like(enquiry.customer_name, filters.customer)) return false;
      if (filters.reference && !(like(enquiry.reference, filters.reference) || like(enquiry.enquiry_number, filters.reference))) return false;
      if (filters.email && !(like(enquiry.email, filters.email) || like(enquiry.reference_email, filters.email))) return false;
      if (filters.contactNo && !like(enquiry.contact_no, filters.contactNo)) return false;
      if (filters.agentId && enquiry.agent_id !== filters.agentId) return false;
      if (filters.type === "Direct" && enquiry.agent_id) return false;
      if (filters.type === "Agent" && !enquiry.agent_id) return false;
      if (filters.status && enquiry.status !== filters.status) return false;
      if (filters.userId && enquiry.created_by !== filters.userId) return false;
      if (filters.cityId && enquiry.destination_city_id !== filters.cityId) return false;
      if (filters.searchWithDate && filters.from && filters.to) {
        const d = (enquiry.check_in_date || enquiry.created_at || "").slice(0, 10);
        if (!d) return false;
        if (d < filters.from || d > filters.to) return false;
      }
      return true;
    });
  }, [enquiries, filters]);

  const pagination = usePagination(filteredEnquiries);

  useEffect(() => {
    pagination.resetPage();
  }, [filters]);


  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      on_hold: "bg-yellow-500",
      confirmed: "bg-green-500",
      cancelled: "bg-red-500",
      converted: "bg-blue-500"
    };
    const statusText = status === "on_hold" ? "On Hold" : status.charAt(0).toUpperCase() + status.slice(1);
    return <Badge className={statusColors[status] || "bg-gray-500"}>{statusText}</Badge>;
  };

  // ---- Legacy form helpers ----
  const setF = (key: string, value: any) => setFormData((prev) => ({ ...prev, [key]: value }));
  const inpCls = "border border-gray-600 bg-white text-[12px] h-[22px] px-1";

  const rowInput = (label: string, key: string, type = "text", width = "230px") => (
    <LegacyFormRow label={label} key={key}>
      <input
        type={type}
        value={(formData as any)[key] ?? ""}
        onChange={(e) => setF(key, e.target.value)}
        className={inpCls}
        style={{ width }}
      />
    </LegacyFormRow>
  );

  const rowArea = (label: string, key: string) => (
    <LegacyFormRow label={label} key={key}>
      <textarea
        value={(formData as any)[key] ?? ""}
        onChange={(e) => setF(key, e.target.value)}
        className="border border-gray-600 bg-white text-[12px] w-[230px] h-[70px] px-1"
      />
    </LegacyFormRow>
  );

  useEffect(() => {
    const hotelId = formData.booking_hotel_id;
    if (!hotelId) {
      setRooms([]);
      return;
    }
    supabase
      .from("rooms")
      .select("*")
      .eq("hotel_id", hotelId)
      .order("room_number")
      .then(({ data }) => setRooms(data || []));
  }, [formData.booking_hotel_id]);

  const rowSelect = (label: string, key: string, list: any[], placeholder = "-----Select-----") => (
    <LegacyFormRow label={label} key={key}>
      <select
        value={(formData as any)[key] ?? ""}
        onChange={(e) => setF(key, e.target.value)}
        className="border border-gray-600 bg-white text-[12px] h-[22px] w-[250px] px-1"
      >
        <option value="">{placeholder}</option>
        {list.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </LegacyFormRow>
  );

  const rowRoomSelect = () => (
    <LegacyFormRow label="Room">
      <select
        value={formData.booking_room ?? ""}
        onChange={(e) => setF("booking_room", e.target.value)}
        disabled={!formData.booking_hotel_id}
        className="border border-gray-600 bg-white text-[12px] h-[22px] w-[250px] px-1"
      >
        <option value="">-----Select-----</option>
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.room_number} - {r.room_type}
          </option>
        ))}
      </select>
    </LegacyFormRow>
  );


  const rowDate = (label: string, key: string) => (
    <LegacyFormRow label={label} key={key}>
      <LegacyDatePicker value={(formData as any)[key] ?? ""} onChange={(e: any) => setF(key, e.target.value)} />
    </LegacyFormRow>
  );

  const toggleRow = (label: string, key: string) => (
    <LegacyFormRow label={label} key={key}>
      <div className="flex items-center gap-4 pt-1">
        <label className="flex items-center gap-1 text-[12px]">
          <input type="radio" name={key} checked={!!(formData as any)[key]} onChange={() => setF(key, true)} />
          Yes
        </label>
        <label className="flex items-center gap-1 text-[12px]">
          <input type="radio" name={key} checked={!(formData as any)[key]} onChange={() => setF(key, false)} />
          No
        </label>
      </div>
    </LegacyFormRow>
  );

  const servicePanel = (title: string, children: React.ReactNode) => (
    <div className="ml-[60px] mb-3 border border-gray-400 bg-[#f7dde0] p-3">
      <div className="text-[12px] font-semibold text-gray-800 mb-2">{title}</div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header title="Enquiry Management" />
      <main className="p-4">
        {!showForm ? (
          <div>
            <LegacyPanelHeader
              title="View Enquiry"
              className="mb-3"
              right={
                <Button
                  variant="link"
                  className="text-white p-0 h-auto text-sm hover:text-white/80"
                  onClick={() => setFilters({ from: today, to: today, searchWithDate: false, type: "", agentId: "", reference: "", status: "", userId: "", email: "", contactNo: "", cityId: "", customer: "" })}
                >
                  View All Records
                </Button>
              }
            />

            {/* Filter Panel */}
            <div className="mb-3" style={legacyFilterContainerStyle}>
              <div className="px-3 py-2 space-y-2">
                {/* Row 1 */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className={legacyFilterLabelClass}>From :</span>
                    <LegacyDatePicker value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={legacyFilterLabelClass}>To :</span>
                    <LegacyDatePicker value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={legacyFilterLabelClass}>Search with Date :</span>
                    <label className="flex items-center gap-1 text-[12px]">
                      <input type="radio" checked={filters.searchWithDate} onChange={() => setFilters({ ...filters, searchWithDate: true })} /> YES
                    </label>
                    <label className="flex items-center gap-1 text-[12px]">
                      <input type="radio" checked={!filters.searchWithDate} onChange={() => setFilters({ ...filters, searchWithDate: false })} /> NO
                    </label>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className={legacyFilterLabelClass}>Type :</span>
                    <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className={`${legacyFilterInputClass} min-w-[110px]`}>
                      <option value="">--Select--</option>
                      <option value="Direct">Direct</option>
                      <option value="Agent">Agent</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={legacyFilterLabelClass}>Agent Name :</span>
                    <select value={filters.agentId} onChange={(e) => setFilters({ ...filters, agentId: e.target.value })} className={`${legacyFilterInputClass} min-w-[200px]`}>
                      <option value="">--Select--</option>
                      {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={legacyFilterLabelClass}>Reference :</span>
                    <input value={filters.reference} onChange={(e) => setFilters({ ...filters, reference: e.target.value })} className={`${legacyFilterInputClass} w-[220px]`} />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className={legacyFilterLabelClass}>Status :</span>
                    <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={`${legacyFilterInputClass} min-w-[130px]`}>
                      <option value="">--Select--</option>
                      <option value="on_hold">On Hold</option>
                      <option value="pending">Pending</option>
                      <option value="follow_up">Follow Up</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="converted">Converted</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={legacyFilterLabelClass}>User :</span>
                    <select value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })} className={`${legacyFilterInputClass} min-w-[150px]`}>
                      <option value="">--Select--</option>
                      {profiles.map((p) => <option key={p.id} value={p.id}>{getUserName(p.id)}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className={legacyFilterLabelClass}>Email-Id :</span>
                    <input value={filters.email} onChange={(e) => setFilters({ ...filters, email: e.target.value })} className={`${legacyFilterInputClass} w-[180px]`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={legacyFilterLabelClass}>Contact-No :</span>
                    <input value={filters.contactNo} onChange={(e) => setFilters({ ...filters, contactNo: e.target.value })} className={`${legacyFilterInputClass} w-[180px]`} />
                  </div>
                </div>

                {/* Row 5 */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className={legacyFilterLabelClass}>City :</span>
                    <select value={filters.cityId} onChange={(e) => setFilters({ ...filters, cityId: e.target.value })} className={`${legacyFilterInputClass} min-w-[260px]`}>
                      <option value="">-City-</option>
                      {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={legacyFilterLabelClass}>Customer :</span>
                    <input value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} className={`${legacyFilterInputClass} w-[200px]`} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end px-3 pb-2">
                <button type="button" style={legacySearchButtonStyle} onClick={() => pagination.resetPage()}>
                  Search
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Enquiry
              </Button>
            </div>

            {/* Main Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: "#D4A59A" }}>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold w-[50px]">S.No.</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Enquiry No</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Type</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Customer / Agent</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Contact</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Enquiry Detail</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Status</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">User</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold w-[120px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagination.paginatedItems.length === 0 ? (
                        <tr style={{ backgroundColor: "#F5E6E0" }}>
                          <td colSpan={9} className="border border-[#c99] text-center py-8" style={{ color: "#c00" }}>
                            Sorry, Currently There are no record to display
                          </td>
                        </tr>
                      ) : (
                        pagination.paginatedItems.map((enquiry, idx) => (
                          <tr key={enquiry.id} style={{ backgroundColor: "#F5E6E0" }} className="align-top">
                            <td className="border border-[#c99] px-3 py-2 text-xs">{pagination.startIndex + idx}</td>
                            <td className="border border-[#c99] px-3 py-2 text-xs">{enquiry.enquiry_number}</td>
                            <td className="border border-[#c99] px-3 py-2 text-xs">
                              {enquiry.agent_id ? `Agent (${enquiry.agents?.name || ""})` : "Direct"}
                            </td>
                            <td className="border border-[#c99] px-3 py-2 text-xs">{enquiry.customer_name || enquiry.agents?.name || "-"}</td>
                            <td className="border border-[#c99] px-3 py-2 text-xs">
                              <div>{enquiry.contact_no || "-"}</div>
                              <div>{enquiry.email || enquiry.reference_email || ""}</div>
                            </td>
                            <td className="border border-[#c99] px-3 py-2 text-xs">
                              <div>{formatDisplayDate(enquiry.check_in_date)} - {formatDisplayDate(enquiry.check_out_date)}</div>
                              <div>{(enquiry.adults || 0)} Adult {(enquiry.children || 0)} Children</div>
                              {enquiry.reference && <div>Reference : {enquiry.reference}</div>}
                            </td>
                            <td className="border border-[#c99] px-3 py-2 text-xs">{getStatusBadge(enquiry.status)}</td>
                            <td className="border border-[#c99] px-3 py-2 text-xs">{enquiry.created_by ? getUserName(enquiry.created_by) : "-"}</td>
                            <td className="border border-[#c99] px-3 py-2 text-xs">
                              <div className="flex flex-col gap-1">
                                {enquiry.status === "on_hold" && (
                                  <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleConvertToBooking(enquiry)}>
                                    Confirm Booking
                                  </Button>
                                )}
                                <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleEditEnquiry(enquiry)}>
                                  View / Edit
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center px-3 py-2 text-[12px] border-t border-[#c99]">
                    <span>Showing {pagination.startIndex + 1}-{pagination.endIndex} of {pagination.totalItems}</span>
                    <div className="flex gap-1">
                      <button onClick={() => pagination.goToPage(Math.max(1, pagination.currentPage - 1))} disabled={pagination.currentPage === 1} className="border border-gray-400 px-2 py-0.5 disabled:opacity-50">Prev</button>
                      <span className="px-2 py-0.5">Page {pagination.currentPage} / {pagination.totalPages}</span>
                      <button onClick={() => pagination.goToPage(Math.min(pagination.totalPages, pagination.currentPage + 1))} disabled={pagination.currentPage === pagination.totalPages} className="border border-gray-400 px-2 py-0.5 disabled:opacity-50">Next</button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        ) : (
          <LegacyFormPanel
            title={editingEnquiryId ? "Edit Enquiry" : "Generate Enquiry"}
            rightSlot={
              <div className="flex items-center gap-4">
                <span className="text-white/80 text-xs"><span className="text-red-300">*</span> - Required fields</span>
                <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={resetForm}>
                  Back to List
                </Button>
              </div>
            }
          >
            <form onSubmit={handleSubmit}>
              {/* Type */}
              <LegacyFormRow label="Type">
                <div className="flex items-center gap-4 text-[12px] pt-2">
                  <label className="flex items-center gap-1">
                    <input type="radio" name="booking_type" checked={formData.booking_type === "agent"}
                      onChange={() => setFormData({ ...formData, booking_type: "agent" })} />
                    Agent
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="booking_type" checked={formData.booking_type === "direct"}
                      onChange={() => setFormData({ ...formData, booking_type: "direct", agent_id: "" })} />
                    Direct from customer <span className="text-red-600">*</span>
                  </label>
                </div>
              </LegacyFormRow>

              {/* Agent */}
              {formData.booking_type === "agent" && (
                <LegacyFormRow label="Agent" required>
                  <select
                    value={formData.agent_id}
                    onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                    className="border border-gray-600 bg-white text-[12px] h-[22px] w-[360px] px-1"
                  >
                    <option value="">-----Select-----</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </LegacyFormRow>
              )}

              {[
                { label: "Reference", key: "reference" },
                { label: "Reference Email", key: "reference_email" },
                { label: "Customer Name", key: "customer_name" },
              ].map((f) => (
                <LegacyFormRow label={f.label} key={f.key}>
                  <input
                    type="text"
                    value={(formData as any)[f.key]}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="border border-gray-600 bg-white text-[12px] h-[22px] w-[230px] px-1"
                  />
                </LegacyFormRow>
              ))}

              {/* Address */}
              <LegacyFormRow label="Address">
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="border border-gray-600 bg-white text-[12px] w-[230px] h-[90px] px-1"
                />
              </LegacyFormRow>

              {[
                { label: "Contact No.", key: "contact_no" },
                { label: "Email", key: "email" },
              ].map((f) => (
                <LegacyFormRow label={f.label} key={f.key}>
                  <input
                    type="text"
                    value={(formData as any)[f.key]}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="border border-gray-600 bg-white text-[12px] h-[22px] w-[230px] px-1"
                  />
                </LegacyFormRow>
              ))}

              {/* No of People */}
              <LegacyFormRow label="No of People">
                <div className="flex items-center">
                  <input
                    type="number" min={0}
                    value={formData.adults}
                    onChange={(e) => setFormData({ ...formData, adults: Number(e.target.value) })}
                    className="border border-gray-600 bg-white text-[12px] h-[22px] w-[60px] px-1"
                  />
                  <span className="text-[12px] mx-2">Adult</span>
                  <input
                    type="number" min={0}
                    value={formData.children}
                    onChange={(e) => setFormData({ ...formData, children: Number(e.target.value) })}
                    className="border border-gray-600 bg-white text-[12px] h-[22px] w-[60px] px-1"
                  />
                  <span className="text-[12px] ml-2">Children</span>
                </div>
              </LegacyFormRow>

              {/* Enquiry Message */}
              <LegacyFormRow label="Enquiry Message">
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="border border-gray-600 bg-white text-[12px] w-[230px] h-[90px] px-1"
                />
              </LegacyFormRow>

              {/* Place (City) */}
              <LegacyFormRow label="Place(City)">
                <select
                  value={formData.city_id}
                  onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                  className="border border-gray-600 bg-white text-[12px] h-[22px] w-[250px] px-1"
                >
                  <option value="">-City-</option>
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </LegacyFormRow>

              {/* Booking (own hotel) */}
              {toggleRow("Booking", "include_booking")}
              {formData.include_booking && servicePanel("Booking Details", (
                <>
                  {rowSelect("Hotel", "booking_hotel_id", ownHotels)}
                  {rowRoomSelect()}
                  {rowInput("No of Rooms", "booking_num_rooms", "number", "80px")}
                  <LegacyFormRow label="Package Type">
                    <select
                      value={formData.booking_package_type}
                      onChange={(e) => setF("booking_package_type", e.target.value)}
                      className="border border-gray-600 bg-white text-[12px] h-[22px] w-[250px] px-1"
                    >
                      <option value="select">-----Select-----</option>
                      <option value="EP">EP (Room Only)</option>
                      <option value="CP">CP (Room + Breakfast)</option>
                      <option value="MAP">MAP (Room + Breakfast + 1 Meal)</option>
                      <option value="AP">AP (All Meals)</option>
                      <option value="custom">Custom</option>
                    </select>
                  </LegacyFormRow>
                  {formData.booking_package_type === "custom" && rowInput("Custom Package", "booking_custom_package")}
                  {rowDate("Booking From", "booking_from")}
                  {rowDate("Booking To", "booking_to")}
                  {rowInput("Booking Price", "booking_price", "number", "150px")}
                </>
              ))}

              {/* Delhi - Manali */}
              {toggleRow("DELHI - MANALI", "include_delhi_manali")}
              {formData.include_delhi_manali && servicePanel("Delhi - Manali Details", (
                <>
                  {rowSelect("Transporter", "dm_transporter_id", transporters)}
                  {rowInput("No of Tickets", "dm_num_tickets", "number", "80px")}
                  {rowInput("Ticket No.", "dm_ticket_no")}
                  {rowInput("Seat No.", "dm_seat_no")}
                  {rowDate("Booking Date", "dm_booking_date")}
                  {rowDate("Journey Date", "dm_journey_date")}
                  {rowInput("Booking Price", "dm_booking_price", "number", "150px")}
                  {rowInput("Selling Price", "dm_selling_price", "number", "150px")}
                </>
              ))}

              {/* Manali - Delhi */}
              {toggleRow("MANALI - DELHI", "include_manali_delhi")}
              {formData.include_manali_delhi && servicePanel("Manali - Delhi Details", (
                <>
                  {rowSelect("Transporter", "md_transporter_id", transporters)}
                  {rowInput("No of Tickets", "md_num_tickets", "number", "80px")}
                  {rowInput("Ticket No.", "md_ticket_no")}
                  {rowInput("Seat No.", "md_seat_no")}
                  {rowDate("Booking Date", "md_booking_date")}
                  {rowDate("Journey Date", "md_journey_date")}
                  {rowInput("Booking Price", "md_booking_price", "number", "150px")}
                  {rowInput("Selling Price", "md_selling_price", "number", "150px")}
                </>
              ))}

              {/* Safari */}
              {toggleRow("Safari", "include_safari")}
              {formData.include_safari && servicePanel("Safari Details", (
                <>
                  {rowSelect("Transporter", "safari_transporter_id", transporters)}
                  {rowInput("No of Safari", "safari_num", "number", "80px")}
                  {rowDate("Booking Date", "safari_booking_date")}
                  {rowDate("Journey Date", "safari_journey_date")}
                  {rowInput("Booking Price", "safari_booking_price", "number", "150px")}
                  {rowInput("Selling Price", "safari_selling_price", "number", "150px")}
                  {rowArea("Note", "safari_note")}
                </>
              ))}

              {/* Another Hotel */}
              {toggleRow("Another Hotel", "include_another_hotel")}
              {formData.include_another_hotel && servicePanel("Another Hotel Details", (
                <>
                  {rowSelect("Hotel", "another_hotel_id", anotherHotels)}
                  {rowInput("Room Type", "another_hotel_room_type")}
                  {rowInput("No of Rooms", "another_hotel_num_rooms", "number", "80px")}
                  {rowDate("Booking Date", "another_hotel_booking_date")}
                  {rowDate("Check In", "another_hotel_check_in")}
                  {rowDate("Check Out", "another_hotel_check_out")}
                  {rowInput("Booking Price", "another_hotel_booking_price", "number", "150px")}
                  {rowInput("Selling Price", "another_hotel_selling_price", "number", "150px")}
                  {rowArea("Note", "another_hotel_note")}
                </>
              ))}

              {/* Additional Vehicle */}
              {toggleRow("Additional Vehicle", "include_additional_vehicle")}
              {formData.include_additional_vehicle && servicePanel("Additional Vehicle Details", (
                <>
                  {rowSelect("Transporter", "vehicle_transporter_id", transporters)}
                  {rowInput("Vehicle Details", "vehicle_details")}
                  {rowDate("Booking Date", "vehicle_booking_date")}
                  {rowDate("Journey Date", "vehicle_journey_date")}
                  {rowInput("Booking Price", "vehicle_booking_price", "number", "150px")}
                  {rowInput("Selling Price", "vehicle_selling_price", "number", "150px")}
                  {rowArea("Note", "vehicle_note")}
                </>
              ))}

              {/* Group Expences */}
              {toggleRow("Group Expences", "include_group_expenses")}
              {formData.include_group_expenses && servicePanel("Group Expences Details", (
                <>
                  {rowInput("Amount", "group_expense_amount", "number", "150px")}
                  {rowArea("Details", "group_expense_details")}
                </>
              ))}

              {/* Agent Commission */}
              <LegacyFormRow label="Agent Commission">
                <input
                  type="number"
                  value={formData.agent_commission}
                  onChange={(e) => setFormData({ ...formData, agent_commission: e.target.value })}
                  className="border border-gray-600 bg-white text-[12px] h-[22px] w-[230px] px-1"
                />
              </LegacyFormRow>

              <div className="flex justify-center gap-3 pt-4">
                <button type="submit" className="border-2 border-gray-500 bg-[#e6e6e6] text-[12px] font-mono px-4 py-[2px]">
                  {editingEnquiryId ? "Update" : "Create"}
                </button>
                <button type="button" onClick={resetForm} className="border-2 border-gray-500 bg-[#e6e6e6] text-[12px] font-mono px-4 py-[2px]">
                  Reset
                </button>
              </div>
            </form>
          </LegacyFormPanel>
        )}
      </main>
    </div>
  );
}
