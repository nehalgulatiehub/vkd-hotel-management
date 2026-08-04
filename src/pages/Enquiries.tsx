import { DateInput } from "@/components/ui/DateInput";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, CheckCircle, Eye } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { LegacyDatePicker } from "@/components/ui/LegacyDatePicker";
import { formatDisplayDate } from "@/utils/dateFormat";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";


export default function Enquiries() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [ownHotels, setOwnHotels] = useState<any[]>([]);
  const [anotherHotels, setAnotherHotels] = useState<any[]>([]);
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
      next.booking_type = enquiry.booking_type || "agent";
      next.booking_package_type = enquiry.booking_package_type || "select";
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
      agent_id: formData.booking_type === "agent" && formData.agent_id ? formData.agent_id : null,
      check_in_date: formData.check_in_date || null,
      check_out_date: formData.check_out_date || null,
      adults: formData.adults,
      children: formData.children,
      notes: formData.notes,
      special_requests: formData.notes || null,
      status: "on_hold"
    };

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
          route: "Delhi-Manali",
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
          route: "Manali-Delhi",
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

  const filterPanelStyle = { backgroundColor: "#F9D7D7" };
  const smallSelect = "border border-gray-500 bg-white h-[22px] text-[12px] px-1 leading-none";
  const smallInput = "border border-gray-500 bg-white h-[22px] text-[12px] px-1 leading-none";
  const labelStyle = "text-[12px] text-gray-800 whitespace-nowrap";

  return (
    <div className="min-h-screen bg-background">
      <Header title="Enquiry Management" />
      <main className="p-4">
        {showForm && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">
              {editingEnquiryId ? "Edit Enquiry" : "Generate Enquiry"}
            </h2>
            <Button variant="outline" onClick={resetForm}>
              Back to List
            </Button>
          </div>
        )}

        {!showForm ? (
          <div className="border border-gray-300">
            {/* Blue Header */}
            <div className="flex justify-between items-center px-4 py-2" style={{ backgroundColor: "#1e6e99" }}>
              <span className="text-white font-semibold text-[14px]">View Enquiry</span>
              <button
                onClick={() => setFilters({ from: today, to: today, searchWithDate: false, type: "", agentId: "", reference: "", status: "", userId: "", email: "", contactNo: "", cityId: "", customer: "" })}
                className="text-white hover:underline text-[14px] bg-transparent border-0 cursor-pointer font-semibold"
              >
                View All Records
              </button>
            </div>

            {/* Filter Panel */}
            <div className="p-3 space-y-2" style={filterPanelStyle}>
              {/* Row 1 */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>From :</span>
                  <LegacyDatePicker value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>To :</span>
                  <LegacyDatePicker value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>Search with Date :</span>
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
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>Type :</span>
                  <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className={`${smallSelect} min-w-[110px]`}>
                    <option value="">--Select--</option>
                    <option value="Direct">Direct</option>
                    <option value="Agent">Agent</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>Agent Name :</span>
                  <select value={filters.agentId} onChange={(e) => setFilters({ ...filters, agentId: e.target.value })} className={`${smallSelect} min-w-[200px]`}>
                    <option value="">--Select--</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>Reference :</span>
                  <input value={filters.reference} onChange={(e) => setFilters({ ...filters, reference: e.target.value })} className={`${smallInput} w-[220px]`} />
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>Status :</span>
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={`${smallSelect} min-w-[130px]`}>
                    <option value="">--Select--</option>
                    <option value="on_hold">On Hold</option>
                    <option value="pending">Pending</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="converted">Converted</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>User :</span>
                  <select value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })} className={`${smallSelect} min-w-[150px]`}>
                    <option value="">--Select--</option>
                    {profiles.map((p) => <option key={p.id} value={p.id}>{getUserName(p.id)}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>Email-Id :</span>
                  <input value={filters.email} onChange={(e) => setFilters({ ...filters, email: e.target.value })} className={`${smallInput} w-[180px]`} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>Contact-No :</span>
                  <input value={filters.contactNo} onChange={(e) => setFilters({ ...filters, contactNo: e.target.value })} className={`${smallInput} w-[180px]`} />
                </div>
              </div>

              {/* Row 5 */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>City :</span>
                  <select value={filters.cityId} onChange={(e) => setFilters({ ...filters, cityId: e.target.value })} className={`${smallSelect} min-w-[260px]`}>
                    <option value="">-City-</option>
                    {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelStyle}>Customer :</span>
                  <input value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} className={`${smallInput} w-[200px]`} />
                </div>
                <button
                  type="button"
                  onClick={() => pagination.resetPage()}
                  className="ml-auto border border-gray-500 bg-gray-200 hover:bg-gray-300 px-4 py-1 text-[12px] font-semibold"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#D4A59A" }} className="text-left">
                    <th className="p-2 border-b border-gray-400 w-[50px]">S.No.</th>
                    <th className="p-2 border-b border-gray-400">Enquiry No</th>
                    <th className="p-2 border-b border-gray-400">Type</th>
                    <th className="p-2 border-b border-gray-400">Customer / Agent</th>
                    <th className="p-2 border-b border-gray-400">Contact</th>
                    <th className="p-2 border-b border-gray-400">Enquiry Detail</th>
                    <th className="p-2 border-b border-gray-400">Status</th>
                    <th className="p-2 border-b border-gray-400">User</th>
                    <th className="p-2 border-b border-gray-400 w-[120px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedItems.length === 0 ? (
                    <tr style={filterPanelStyle}>
                      <td colSpan={9} className="text-center py-8" style={{ color: "#c00" }}>
                        Sorry, Currently There are no record to display
                      </td>
                    </tr>
                  ) : (
                    pagination.paginatedItems.map((enquiry, idx) => (
                      <tr key={enquiry.id} style={filterPanelStyle} className="align-top">
                        <td className="p-2 border-b border-gray-300">{pagination.startIndex + idx + 1}</td>
                        <td className="p-2 border-b border-gray-300">{enquiry.enquiry_number}</td>
                        <td className="p-2 border-b border-gray-300">
                          {enquiry.agent_id ? `Agent (${enquiry.agents?.name || ""})` : "Direct"}
                        </td>
                        <td className="p-2 border-b border-gray-300">{enquiry.customer_name || enquiry.agents?.name || "-"}</td>
                        <td className="p-2 border-b border-gray-300">
                          <div>{enquiry.contact_no || "-"}</div>
                          <div>{enquiry.email || enquiry.reference_email || ""}</div>
                        </td>
                        <td className="p-2 border-b border-gray-300">
                          <div>{formatDisplayDate(enquiry.check_in_date)} - {formatDisplayDate(enquiry.check_out_date)}</div>
                          <div>{(enquiry.adults || 0)} Adult {(enquiry.children || 0)} Children</div>
                          {enquiry.reference && <div>Reference : {enquiry.reference}</div>}
                        </td>
                        <td className="p-2 border-b border-gray-300">{getStatusBadge(enquiry.status)}</td>
                        <td className="p-2 border-b border-gray-300">{enquiry.created_by ? getUserName(enquiry.created_by) : "-"}</td>
                        <td className="p-2 border-b border-gray-300">
                          <div className="flex flex-col gap-1 text-[#7a3b2e]">
                            {enquiry.status === "on_hold" && (
                              <button onClick={() => handleConvertToBooking(enquiry)} className="text-left hover:underline">
                                Confirm Booking
                              </button>
                            )}
                            <button onClick={() => handleEditEnquiry(enquiry)} className="text-left hover:underline">
                              View / Edit
                            </button>
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
              <div className="flex justify-between items-center px-3 py-2 text-[12px] border-t border-gray-300 bg-white">
                <span>Showing {pagination.startIndex + 1}-{pagination.endIndex} of {pagination.totalItems}</span>
                <div className="flex gap-1">
                  <button onClick={() => pagination.goToPage(Math.max(1, pagination.currentPage - 1))} disabled={pagination.currentPage === 1} className="border border-gray-400 px-2 py-0.5 disabled:opacity-50">Prev</button>
                  <span className="px-2 py-0.5">Page {pagination.currentPage} / {pagination.totalPages}</span>
                  <button onClick={() => pagination.goToPage(Math.min(pagination.totalPages, pagination.currentPage + 1))} disabled={pagination.currentPage === pagination.totalPages} className="border border-gray-400 px-2 py-0.5 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}

            <div className="flex justify-end p-2 bg-white border-t border-gray-300">
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Enquiry
              </Button>
            </div>
          </div>

        ) : (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Booking Type */}
                <div>
                  <Label>Booking Type</Label>
                  <RadioGroup
                    value={formData.booking_type}
                    onValueChange={(value) => setFormData({ ...formData, booking_type: value })}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="agent" id="agent" />
                      <Label htmlFor="agent">Agent Booking</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="direct" id="direct" />
                      <Label htmlFor="direct">Direct Booking</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.booking_type === "agent" && (
                    <div>
                      <Label>Agent</Label>
                      <Select
                        value={formData.agent_id}
                        onValueChange={(value) => setFormData({ ...formData, agent_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Customer Name</Label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div>
                    <Label>Contact Number</Label>
                    <Input
                      value={formData.contact_no}
                      onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                      placeholder="Enter contact number"
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>

                  <div>
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </div>

                  <div>
                    <Label>Reference</Label>
                    <Input
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="Enter reference"
                    />
                  </div>

                  <div>
                    <Label>Reference Email</Label>
                    <Input
                      value={formData.reference_email}
                      onChange={(e) => setFormData({ ...formData, reference_email: e.target.value })}
                      placeholder="Enter reference email"
                    />
                  </div>

                  <div>
                    <Label>Check-in Date</Label>
                    <DateInput
                      value={formData.check_in_date}
                      onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Check-out Date</Label>
                    <DateInput
                      value={formData.check_out_date}
                      onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Adults</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.adults}
                      onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label>Children</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.children}
                      onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label>Agent Commission</Label>
                    <Input
                      type="number"
                      value={formData.agent_commission}
                      onChange={(e) => setFormData({ ...formData, agent_commission: e.target.value })}
                      placeholder="Enter commission amount"
                    />
                  </div>

                  <div>
                    <Label>Cheque Number</Label>
                    <Input
                      value={formData.cheque_no}
                      onChange={(e) => setFormData({ ...formData, cheque_no: e.target.value })}
                      placeholder="Enter cheque number"
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Include Services Checkboxes */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include_booking"
                      checked={formData.include_booking}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, include_booking: checked as boolean })
                      }
                    />
                    <Label htmlFor="include_booking">Hotel Booking</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include_delhi_manali"
                      checked={formData.include_delhi_manali}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, include_delhi_manali: checked as boolean })
                      }
                    />
                    <Label htmlFor="include_delhi_manali">Delhi-Manali Volvo</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include_manali_delhi"
                      checked={formData.include_manali_delhi}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, include_manali_delhi: checked as boolean })
                      }
                    />
                    <Label htmlFor="include_manali_delhi">Manali-Delhi Volvo</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include_safari"
                      checked={formData.include_safari}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, include_safari: checked as boolean })
                      }
                    />
                    <Label htmlFor="include_safari">Safari</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include_another_hotel"
                      checked={formData.include_another_hotel}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, include_another_hotel: checked as boolean })
                      }
                    />
                    <Label htmlFor="include_another_hotel">Another Hotel</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include_additional_vehicle"
                      checked={formData.include_additional_vehicle}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, include_additional_vehicle: checked as boolean })
                      }
                    />
                    <Label htmlFor="include_additional_vehicle">Additional Vehicle</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include_group_expenses"
                      checked={formData.include_group_expenses}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, include_group_expenses: checked as boolean })
                      }
                    />
                    <Label htmlFor="include_group_expenses">Group Expenses</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conditional Service Forms */}
            {formData.include_booking && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Hotel Booking Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Hotel</Label>
                      <Select
                        value={formData.booking_hotel_id}
                        onValueChange={(value) => setFormData({ ...formData, booking_hotel_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {ownHotels.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id}>
                              {hotel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Room Type</Label>
                      <Input
                        value={formData.booking_room}
                        onChange={(e) => setFormData({ ...formData, booking_room: e.target.value })}
                        placeholder="Enter room type"
                      />
                    </div>

                    <div>
                      <Label>Number of Rooms</Label>
                      <Input
                        type="number"
                        value={formData.booking_num_rooms}
                        onChange={(e) => setFormData({ ...formData, booking_num_rooms: e.target.value })}
                        placeholder="Enter number of rooms"
                      />
                    </div>

                    <div>
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={formData.booking_price}
                        onChange={(e) => setFormData({ ...formData, booking_price: e.target.value })}
                        placeholder="Enter price"
                      />
                    </div>

                    <div>
                      <Label>From Date</Label>
                      <DateInput
                        value={formData.booking_from}
                        onChange={(e) => setFormData({ ...formData, booking_from: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>To Date</Label>
                      <DateInput
                        value={formData.booking_to}
                        onChange={(e) => setFormData({ ...formData, booking_to: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.booking_custom_package}
                        onChange={(e) => setFormData({ ...formData, booking_custom_package: e.target.value })}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.include_delhi_manali && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Delhi-Manali Volvo Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Number of Tickets</Label>
                      <Input
                        type="number"
                        value={formData.dm_num_tickets}
                        onChange={(e) => setFormData({ ...formData, dm_num_tickets: e.target.value })}
                        placeholder="Enter number of tickets"
                      />
                    </div>

                    <div>
                      <Label>Ticket Number</Label>
                      <Input
                        value={formData.dm_ticket_no}
                        onChange={(e) => setFormData({ ...formData, dm_ticket_no: e.target.value })}
                        placeholder="Enter ticket number"
                      />
                    </div>

                    <div>
                      <Label>Seat Number</Label>
                      <Input
                        value={formData.dm_seat_no}
                        onChange={(e) => setFormData({ ...formData, dm_seat_no: e.target.value })}
                        placeholder="Enter seat number"
                      />
                    </div>

                    <div>
                      <Label>Journey Date</Label>
                      <DateInput
                        value={formData.dm_journey_date}
                        onChange={(e) => setFormData({ ...formData, dm_journey_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Booking Price</Label>
                      <Input
                        type="number"
                        value={formData.dm_booking_price}
                        onChange={(e) => setFormData({ ...formData, dm_booking_price: e.target.value })}
                        placeholder="Enter booking price"
                      />
                    </div>

                    <div>
                      <Label>Selling Price</Label>
                      <Input
                        type="number"
                        value={formData.dm_selling_price}
                        onChange={(e) => setFormData({ ...formData, dm_selling_price: e.target.value })}
                        placeholder="Enter selling price"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.include_manali_delhi && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Manali-Delhi Volvo Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Number of Tickets</Label>
                      <Input
                        type="number"
                        value={formData.md_num_tickets}
                        onChange={(e) => setFormData({ ...formData, md_num_tickets: e.target.value })}
                        placeholder="Enter number of tickets"
                      />
                    </div>

                    <div>
                      <Label>Ticket Number</Label>
                      <Input
                        value={formData.md_ticket_no}
                        onChange={(e) => setFormData({ ...formData, md_ticket_no: e.target.value })}
                        placeholder="Enter ticket number"
                      />
                    </div>

                    <div>
                      <Label>Seat Number</Label>
                      <Input
                        value={formData.md_seat_no}
                        onChange={(e) => setFormData({ ...formData, md_seat_no: e.target.value })}
                        placeholder="Enter seat number"
                      />
                    </div>

                    <div>
                      <Label>Journey Date</Label>
                      <DateInput
                        value={formData.md_journey_date}
                        onChange={(e) => setFormData({ ...formData, md_journey_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Booking Price</Label>
                      <Input
                        type="number"
                        value={formData.md_booking_price}
                        onChange={(e) => setFormData({ ...formData, md_booking_price: e.target.value })}
                        placeholder="Enter booking price"
                      />
                    </div>

                    <div>
                      <Label>Selling Price</Label>
                      <Input
                        type="number"
                        value={formData.md_selling_price}
                        onChange={(e) => setFormData({ ...formData, md_selling_price: e.target.value })}
                        placeholder="Enter selling price"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.include_safari && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Safari Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Number of Persons</Label>
                      <Input
                        type="number"
                        value={formData.safari_num}
                        onChange={(e) => setFormData({ ...formData, safari_num: e.target.value })}
                        placeholder="Enter number of persons"
                      />
                    </div>

                    <div>
                      <Label>Safari Date</Label>
                      <DateInput
                        value={formData.safari_journey_date}
                        onChange={(e) => setFormData({ ...formData, safari_journey_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Booking Price</Label>
                      <Input
                        type="number"
                        value={formData.safari_booking_price}
                        onChange={(e) => setFormData({ ...formData, safari_booking_price: e.target.value })}
                        placeholder="Enter booking price"
                      />
                    </div>

                    <div>
                      <Label>Selling Price</Label>
                      <Input
                        type="number"
                        value={formData.safari_selling_price}
                        onChange={(e) => setFormData({ ...formData, safari_selling_price: e.target.value })}
                        placeholder="Enter selling price"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.safari_note}
                        onChange={(e) => setFormData({ ...formData, safari_note: e.target.value })}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.include_another_hotel && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Another Hotel Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Hotel</Label>
                      <Select
                        value={formData.another_hotel_id}
                        onValueChange={(value) => setFormData({ ...formData, another_hotel_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {anotherHotels.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id}>
                              {hotel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Room Type</Label>
                      <Input
                        value={formData.another_hotel_room_type}
                        onChange={(e) => setFormData({ ...formData, another_hotel_room_type: e.target.value })}
                        placeholder="Enter room type"
                      />
                    </div>

                    <div>
                      <Label>Number of Rooms</Label>
                      <Input
                        type="number"
                        value={formData.another_hotel_num_rooms}
                        onChange={(e) => setFormData({ ...formData, another_hotel_num_rooms: e.target.value })}
                        placeholder="Enter number of rooms"
                      />
                    </div>

                    <div>
                      <Label>Check-in Date</Label>
                      <DateInput
                        value={formData.another_hotel_check_in}
                        onChange={(e) => setFormData({ ...formData, another_hotel_check_in: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Check-out Date</Label>
                      <DateInput
                        value={formData.another_hotel_check_out}
                        onChange={(e) => setFormData({ ...formData, another_hotel_check_out: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Booking Price</Label>
                      <Input
                        type="number"
                        value={formData.another_hotel_booking_price}
                        onChange={(e) => setFormData({ ...formData, another_hotel_booking_price: e.target.value })}
                        placeholder="Enter booking price"
                      />
                    </div>

                    <div>
                      <Label>Selling Price</Label>
                      <Input
                        type="number"
                        value={formData.another_hotel_selling_price}
                        onChange={(e) => setFormData({ ...formData, another_hotel_selling_price: e.target.value })}
                        placeholder="Enter selling price"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.another_hotel_note}
                        onChange={(e) => setFormData({ ...formData, another_hotel_note: e.target.value })}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.include_additional_vehicle && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Additional Vehicle Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Transporter</Label>
                      <Select
                        value={formData.vehicle_transporter_id}
                        onValueChange={(value) => setFormData({ ...formData, vehicle_transporter_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transporter" />
                        </SelectTrigger>
                        <SelectContent>
                          {transporters.map((transporter) => (
                            <SelectItem key={transporter.id} value={transporter.id}>
                              {transporter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Vehicle Details</Label>
                      <Input
                        value={formData.vehicle_details}
                        onChange={(e) => setFormData({ ...formData, vehicle_details: e.target.value })}
                        placeholder="Enter vehicle details"
                      />
                    </div>

                    <div>
                      <Label>Pickup Date</Label>
                      <DateInput
                        value={formData.vehicle_booking_date}
                        onChange={(e) => setFormData({ ...formData, vehicle_booking_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Journey Date</Label>
                      <DateInput
                        value={formData.vehicle_journey_date}
                        onChange={(e) => setFormData({ ...formData, vehicle_journey_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Booking Price</Label>
                      <Input
                        type="number"
                        value={formData.vehicle_booking_price}
                        onChange={(e) => setFormData({ ...formData, vehicle_booking_price: e.target.value })}
                        placeholder="Enter booking price"
                      />
                    </div>

                    <div>
                      <Label>Selling Price</Label>
                      <Input
                        type="number"
                        value={formData.vehicle_selling_price}
                        onChange={(e) => setFormData({ ...formData, vehicle_selling_price: e.target.value })}
                        placeholder="Enter selling price"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.vehicle_note}
                        onChange={(e) => setFormData({ ...formData, vehicle_note: e.target.value })}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.include_group_expenses && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Group Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={formData.group_expense_amount}
                        onChange={(e) => setFormData({ ...formData, group_expense_amount: e.target.value })}
                        placeholder="Enter expense amount"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Details</Label>
                      <Textarea
                        value={formData.group_expense_details}
                        onChange={(e) => setFormData({ ...formData, group_expense_details: e.target.value })}
                        placeholder="Enter expense details..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary">
                {editingEnquiryId ? "Update Enquiry" : "Create Enquiry"}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
