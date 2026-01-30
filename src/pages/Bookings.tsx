import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Trash2 } from "lucide-react";
import { AdminViewPaymentDialog } from "@/components/admin/AdminViewPaymentDialog";

// Type for another hotel entry
interface AnotherHotelEntry {
  hotel_id: string;
  num_rooms: string;
  room_type: string;
  check_in: string;
  check_out: string;
  booking_price: string;
  selling_price: string;
  note: string;
}
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { useState, useEffect } from "react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { BookingReceipt } from "@/components/booking/BookingReceipt";
import { CompactFormRow } from "@/components/booking/CompactFormRow";

export default function Bookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAddRoute = location.pathname === "/bookings/add";

  const [showForm, setShowForm] = useState(isAddRoute);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  
  // Auto-show form when navigating to /bookings/add, hide when on /bookings
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get("edit");
    
    if (isAddRoute) {
      setShowForm(true);
      setEditingBookingId(null);
    } else if (editId) {
      // Handle ?edit=bookingId query parameter - fetch booking and load for editing
      const loadBookingForEdit = async () => {
        const { data: booking, error } = await supabase
          .from("bookings")
          .select("*, agents(name)")
          .eq("id", editId)
          .maybeSingle();
        
        if (booking && !error) {
          handleEditBooking(booking);
          setShowForm(true);
        }
      };
      loadBookingForEdit();
    } else if (location.pathname === "/bookings" || location.pathname === "/admin/bookings") {
      setShowForm(false);
      setEditingBookingId(null);
    }
  }, [isAddRoute, location.pathname, location.search]);
  const [agents, setAgents] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [ownHotels, setOwnHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [filterRooms, setFilterRooms] = useState<any[]>([]);
  const [anotherHotels, setAnotherHotels] = useState<any[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Multiple another hotels state
  const [anotherHotelsList, setAnotherHotelsList] = useState<AnotherHotelEntry[]>([{
    hotel_id: "",
    num_rooms: "",
    room_type: "",
    check_in: "",
    check_out: "",
    booking_price: "",
    selling_price: "",
    note: ""
  }]);
  
  // Dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showViewDetailDialog, setShowViewDetailDialog] = useState(false);
  const [showViewPaymentDialog, setShowViewPaymentDialog] = useState(false);
  const [showAdminViewPaymentDialog, setShowAdminViewPaymentDialog] = useState(false);
  const [selectedAdminBookingId, setSelectedAdminBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingPayments, setBookingPayments] = useState<any[]>([]);
  const [viewDetailOwnHotelInfo, setViewDetailOwnHotelInfo] = useState<any[]>([]);
  const [viewDetailAnotherHotelInfo, setViewDetailAnotherHotelInfo] = useState<any[]>([]);
  const [viewDetailSafariInfo, setViewDetailSafariInfo] = useState<any[]>([]);
  const [viewDetailVehicleInfo, setViewDetailVehicleInfo] = useState<any[]>([]);
  const [viewDetailVolvoDMInfo, setViewDetailVolvoDMInfo] = useState<any[]>([]);
  const [viewDetailVolvoMDInfo, setViewDetailVolvoMDInfo] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentCityId, setPaymentCityId] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [printBookingId, setPrintBookingId] = useState<string | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    fromMonth: "",
    fromDay: "",
    fromYear: "",
    toMonth: "",
    toDay: "",
    toYear: "",
    type: "",
    agentName: "",
    hotel: "",
    room: "",
    package: "",
    customer: "",
    reference: "",
    user: "",
    chequeNo: "",
    searchWithDate: false
  });
  
  // Form state
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
    // Booking section fields
    booking_hotel_id: "",
    booking_room: "",
    booking_num_rooms: "",
    booking_package_type: "select",
    booking_custom_package: "",
    booking_price: "",
    booking_from: "",
    booking_to: "",
    // Delhi-Manali section fields
    dm_num_tickets: "",
    dm_ticket_no: "",
    dm_seat_no: "",
    dm_transporter_id: "",
    dm_booking_date: "",
    dm_journey_date: "",
    dm_booking_price: "",
    dm_selling_price: "",
    // Manali-Delhi section fields
    md_num_tickets: "",
    md_ticket_no: "",
    md_seat_no: "",
    md_transporter_id: "",
    md_booking_date: "",
    md_journey_date: "",
    md_booking_price: "",
    md_selling_price: "",
    // Safari section fields
    safari_transporter_id: "",
    safari_num: "",
    safari_booking_date: "",
    safari_journey_date: "",
    safari_booking_price: "",
    safari_selling_price: "",
    safari_note: "",
    // Another Hotel section fields - removed (now using anotherHotelsList state)
    // Additional Vehicle section fields
    vehicle_details: "",
    vehicle_booking_price: "",
    vehicle_selling_price: "",
    vehicle_transporter_id: "",
    vehicle_booking_date: "",
    vehicle_journey_date: "",
    vehicle_note: "",
    // Group Expenses section fields
    group_expense_amount: "",
    group_expense_details: ""
  });

  useEffect(() => {
    fetchAgents();
    fetchOwnHotels();
    fetchHotels();
    fetchAnotherHotels();
    fetchTransporters();
    fetchBookings();
    fetchCities();
  }, []);

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("Failed to load cities", error);
    } else {
      setCities(data || []);
    }
  };

  const fetchOwnHotels = async () => {
    const { data, error } = await supabase
      .from("own_hotels")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("Failed to load own hotels", error);
    } else {
      setOwnHotels(data || []);
    }
  };

  const fetchRoomsForHotel = async (hotelId: string) => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("hotel_id", hotelId)
      .eq("is_available", true)
      .order("room_number");
    
    if (error) {
      console.error("Failed to load rooms", error);
    } else {
      setRooms(data || []);
    }
  };

  const fetchFilterRoomsForHotel = async (hotelId: string) => {
    if (!hotelId) {
      setFilterRooms([]);
      return;
    }
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("hotel_id", hotelId)
      .order("room_number");
    
    if (error) {
      console.error("Failed to load filter rooms", error);
    } else {
      setFilterRooms(data || []);
    }
  };

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("name");
    
    if (error) {
      toast.error("Failed to load agents");
    } else {
      setAgents(data || []);
    }
  };

  const fetchHotels = async () => {
    const { data, error } = await supabase
      .from("another_hotels")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("Failed to load hotels", error);
    } else {
      setHotels(data || []);
    }
  };

  const fetchAnotherHotels = async () => {
    const { data, error } = await supabase
      .from("another_hotels")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("Failed to load another hotels", error);
    } else {
      setAnotherHotels(data || []);
    }
  };

  const fetchTransporters = async () => {
    const { data, error } = await supabase
      .from("transporters")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("Failed to load transporters", error);
    } else {
      setTransporters(data || []);
    }
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, agents(name), guests(first_name, last_name)")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load bookings");
    } else {
      // Fetch hotel bookings to show hotel and room names
      const bookingIds = (data || []).map(b => b.id);
      
      // Fetch profiles for created_by users
      const userIds = [...new Set((data || []).map(b => b.created_by).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, first_name, last_name")
          .in("id", userIds);
        
        (profiles || []).forEach((p: any) => {
          profilesMap[p.id] = p.username || `${p.first_name || ''} ${p.last_name || ''}`.trim() || "Unknown User";
        });
      }
      
      if (bookingIds.length > 0) {
        const { data: hotelData } = await supabase
          .from("hotel_bookings")
          .select("*, own_hotels(name), another_hotels(name)")
          .in("booking_id", bookingIds);
        
        // Get room names for UUIDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const roomIds = [...new Set((hotelData || []).map((hb: any) => hb.room_type).filter((rt: any) => rt && uuidRegex.test(rt)))];
        let roomsMap: Record<string, string> = {};
        
        if (roomIds.length > 0) {
          const { data: roomsData } = await supabase.from("rooms").select("id, room_type, room_number").in("id", roomIds);
          roomsMap = (roomsData || []).reduce((acc: Record<string, string>, r: any) => ({ ...acc, [r.id]: r.room_type || r.room_number }), {});
        }
        
        // Map hotel bookings to their booking_id with resolved room names
        const hotelBookingsMap: Record<string, any> = {};
        hotelData?.forEach((hb: any) => {
          const isUuid = hb.room_type && uuidRegex.test(hb.room_type);
          hotelBookingsMap[hb.booking_id] = {
            hotel_id: hb.own_hotel_id || hb.hotel_id,
            room_id: isUuid ? hb.room_type : null,
            hotel_name: hb.own_hotels?.name || hb.another_hotels?.name || null,
            room_type: isUuid ? (roomsMap[hb.room_type] || hb.room_type) : hb.room_type,
            number_of_rooms: hb.number_of_rooms
          };
        });
        
        // Attach hotel info and username to bookings
        const bookingsWithHotelInfo = (data || []).map(b => ({
          ...b,
          hotel_info: hotelBookingsMap[b.id] || null,
          created_by_name: b.created_by ? (profilesMap[b.created_by] || "Unknown User") : "-"
        }));
        setBookings(bookingsWithHotelInfo);
      } else {
        // Attach username even without hotel info
        const bookingsWithUsernames = (data || []).map(b => ({
          ...b,
          created_by_name: b.created_by ? (profilesMap[b.created_by] || "Unknown User") : "-"
        }));
        setBookings(bookingsWithUsernames);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use the most specific dates available (priority order):
    // 1. If "Booking" section is enabled and From/To are provided, use them.
    // 2. If "Another Hotel" section is enabled and check-in/out are provided, use first hotel's dates.
    // 3. Otherwise fall back to the main check-in/check-out dates.
    const firstAnotherHotelCheckIn = anotherHotelsList[0]?.check_in || "";
    const firstAnotherHotelCheckOut = anotherHotelsList[0]?.check_out || "";
    const effectiveCheckIn = formData.booking_from || firstAnotherHotelCheckIn || formData.check_in_date;
    const effectiveCheckOut = formData.booking_to || firstAnotherHotelCheckOut || formData.check_out_date;

    // Required fields validation (prevents Postgres "invalid input syntax for type date: \"\"" errors)
    if (!effectiveCheckIn || !effectiveCheckOut) {
      toast.error("Please select check-in and check-out dates.");
      return;
    }

    try {
      const isEditing = !!editingBookingId;

      // Prepare main booking data
      const bookingData = {
        ...(!isEditing && { booking_number: `BK${Date.now().toString().slice(-8)}` }),
        booking_type: formData.booking_type,
        agent_id: formData.booking_type === "agent" && formData.agent_id ? formData.agent_id : null,
        reference: formData.reference,
        reference_email: formData.reference_email,
        customer_name: formData.customer_name,
        address: formData.address,
        contact_no: formData.contact_no,
        email: formData.email,
        check_in_date: effectiveCheckIn,
        check_out_date: effectiveCheckOut,
        adults: formData.adults,
        children: formData.children,
        notes: formData.notes,
        include_booking: formData.include_booking,
        include_delhi_manali: formData.include_delhi_manali,
        include_manali_delhi: formData.include_manali_delhi,
        include_safari: formData.include_safari,
        include_another_hotel: formData.include_another_hotel,
        include_additional_vehicle: formData.include_additional_vehicle,
        include_group_expenses: formData.include_group_expenses,
        agent_commission: formData.agent_commission ? parseFloat(formData.agent_commission) : null,
        cheque_no: formData.cheque_no,
        status: "confirmed" as const,
        payment_status: "pending" as const,
        total_amount: 0,
        paid_amount: 0,
        due_amount: 0
      };

      let bookingId: string;
      
      if (isEditing) {
        // Update existing booking
        const { error: bookingError } = await supabase
          .from("bookings")
          .update(bookingData)
          .eq("id", editingBookingId);

        if (bookingError) throw bookingError;
        bookingId = editingBookingId;

        // Delete existing related records before inserting new ones
        await Promise.all([
          supabase.from("hotel_bookings").delete().eq("booking_id", bookingId),
          supabase.from("volvo_bookings").delete().eq("booking_id", bookingId),
          supabase.from("safari_bookings").delete().eq("booking_id", bookingId),
          supabase.from("vehicle_bookings").delete().eq("booking_id", bookingId),
          supabase.from("group_expenses").delete().eq("booking_id", bookingId)
        ]);
      } else {
        // Insert new booking
        const { data: bookingResult, error: bookingError } = await supabase
          .from("bookings")
          .insert([bookingData])
          .select()
          .single();

        if (bookingError) throw bookingError;
        bookingId = bookingResult.id;
      }

      // Calculate total amounts from all services
      let totalAmount = 0;

      // Insert Hotel Booking if included
      if (formData.include_booking && formData.booking_hotel_id) {
        const hotelAmount = formData.booking_price ? parseFloat(formData.booking_price) : 0;
        totalAmount += hotelAmount;
        
        const hotelBookingData = {
          booking_id: bookingId,
          own_hotel_id: formData.booking_hotel_id, // Use own_hotel_id instead of hotel_id
          hotel_id: null,
          check_in_date: formData.booking_from || formData.check_in_date,
          check_out_date: formData.booking_to || formData.check_out_date,
          room_type: formData.booking_room,
          number_of_rooms: formData.booking_num_rooms ? parseInt(formData.booking_num_rooms) : 1,
          room_rate: hotelAmount,
          total_amount: hotelAmount,
          paid_amount: 0,
          due_amount: hotelAmount,
          notes: formData.booking_custom_package
        };
        
        const { error: hotelError } = await supabase
          .from("hotel_bookings")
          .insert([hotelBookingData]);
        
        if (hotelError) console.error("Hotel booking error:", hotelError);
      }

      // Insert Delhi-Manali Volvo Booking if included
      if (formData.include_delhi_manali) {
        const volvoAmount = formData.dm_selling_price ? parseFloat(formData.dm_selling_price) : 0;
        totalAmount += volvoAmount;
        
        const volvoData = {
          booking_id: bookingId,
          route: "Delhi-Manali",
          travel_date: formData.dm_journey_date,
          number_of_seats: formData.dm_num_tickets ? parseInt(formData.dm_num_tickets) : 1,
          rate_per_seat: formData.dm_booking_price ? parseFloat(formData.dm_booking_price) : 0,
          total_amount: volvoAmount,
          paid_amount: 0,
          due_amount: volvoAmount,
          notes: `Ticket No: ${formData.dm_ticket_no}, Seat No: ${formData.dm_seat_no}`
        };
        
        const { error: volvoError } = await supabase
          .from("volvo_bookings")
          .insert([volvoData]);
        
        if (volvoError) console.error("Delhi-Manali volvo error:", volvoError);
      }

      // Insert Manali-Delhi Volvo Booking if included
      if (formData.include_manali_delhi) {
        const volvoAmount = formData.md_selling_price ? parseFloat(formData.md_selling_price) : 0;
        totalAmount += volvoAmount;
        
        const volvoData = {
          booking_id: bookingId,
          route: "Manali-Delhi",
          travel_date: formData.md_journey_date,
          number_of_seats: formData.md_num_tickets ? parseInt(formData.md_num_tickets) : 1,
          rate_per_seat: formData.md_booking_price ? parseFloat(formData.md_booking_price) : 0,
          total_amount: volvoAmount,
          paid_amount: 0,
          due_amount: volvoAmount,
          notes: `Ticket No: ${formData.md_ticket_no}, Seat No: ${formData.md_seat_no}`
        };
        
        const { error: volvoError } = await supabase
          .from("volvo_bookings")
          .insert([volvoData]);
        
        if (volvoError) console.error("Manali-Delhi volvo error:", volvoError);
      }

      // Insert Safari Booking if included
      if (formData.include_safari) {
        const safariAmount = formData.safari_selling_price ? parseFloat(formData.safari_selling_price) : 0;
        totalAmount += safariAmount;
        
        const safariData = {
          booking_id: bookingId,
          safari_name: "Safari",
          safari_date: formData.safari_journey_date,
          number_of_persons: formData.safari_num ? parseInt(formData.safari_num) : 1,
          rate_per_person: formData.safari_booking_price ? parseFloat(formData.safari_booking_price) : 0,
          total_amount: safariAmount,
          paid_amount: 0,
          due_amount: safariAmount,
          notes: formData.safari_note
        };
        
        const { error: safariError } = await supabase
          .from("safari_bookings")
          .insert([safariData]);
        
        if (safariError) console.error("Safari booking error:", safariError);
      }

      // Insert Another Hotel Bookings if included (supports multiple hotels)
      if (formData.include_another_hotel) {
        const validHotels = anotherHotelsList.filter(h => h.hotel_id);
        for (const hotel of validHotels) {
          const hotelAmount = hotel.selling_price ? parseFloat(hotel.selling_price) : 0;
          totalAmount += hotelAmount;
          
          const anotherHotelData = {
            booking_id: bookingId,
            hotel_id: hotel.hotel_id,
            own_hotel_id: null,
            check_in_date: hotel.check_in,
            check_out_date: hotel.check_out,
            room_type: hotel.room_type,
            number_of_rooms: hotel.num_rooms ? parseInt(hotel.num_rooms) : 1,
            room_rate: hotel.booking_price ? parseFloat(hotel.booking_price) : 0,
            total_amount: hotelAmount,
            paid_amount: 0,
            due_amount: hotelAmount,
            notes: hotel.note
          };
          
          const { error: anotherHotelError } = await supabase
            .from("hotel_bookings")
            .insert([anotherHotelData]);
          
          if (anotherHotelError) console.error("Another hotel booking error:", anotherHotelError);
        }
      }

      // Insert Additional Vehicle Booking if included
      if (formData.include_additional_vehicle) {
        const vehicleAmount = formData.vehicle_selling_price ? parseFloat(formData.vehicle_selling_price) : 0;
        totalAmount += vehicleAmount;
        
        const vehicleData = {
          booking_id: bookingId,
          transporter_id: formData.vehicle_transporter_id || null,
          vehicle_type: "other" as const,
          pickup_date: formData.vehicle_booking_date,
          dropoff_date: formData.vehicle_journey_date,
          rate: formData.vehicle_booking_price ? parseFloat(formData.vehicle_booking_price) : 0,
          total_amount: vehicleAmount,
          paid_amount: 0,
          due_amount: vehicleAmount,
          notes: `${formData.vehicle_details}\n${formData.vehicle_note}`
        };
        
        const { error: vehicleError } = await supabase
          .from("vehicle_bookings")
          .insert([vehicleData]);
        
        if (vehicleError) console.error("Vehicle booking error:", vehicleError);
      }

      // Insert Group Expenses if included
      if (formData.include_group_expenses && formData.group_expense_amount) {
        const expenseAmount = parseFloat(formData.group_expense_amount);
        totalAmount += expenseAmount;
        
        const expenseData = {
          booking_id: bookingId,
          amount: expenseAmount,
          description: formData.group_expense_details,
          expense_date: new Date().toISOString().split('T')[0],
          category: "Group Expense"
        };
        
        const { error: expenseError } = await supabase
          .from("group_expenses")
          .insert([expenseData]);
        
        if (expenseError) console.error("Group expense error:", expenseError);
      }

      // Update booking with calculated totals
      const { error: updateTotalsError } = await supabase
        .from("bookings")
        .update({
          total_amount: totalAmount,
          due_amount: totalAmount - (bookingData.paid_amount || 0),
          payment_status: totalAmount > 0 ? (bookingData.paid_amount || 0) >= totalAmount ? "paid" : (bookingData.paid_amount || 0) > 0 ? "partial" : "pending" : "paid"
        })
        .eq("id", bookingId);

      if (updateTotalsError) console.error("Error updating totals:", updateTotalsError);

      toast.success(isEditing ? "Booking updated successfully" : "Booking created successfully with all details");
      setShowForm(false);
      setEditingBookingId(null);
      fetchBookings();
      // Reset form
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
      // Reset another hotels list
      setAnotherHotelsList([{
        hotel_id: "",
        num_rooms: "",
        room_type: "",
        check_in: "",
        check_out: "",
        booking_price: "",
        selling_price: "",
        note: ""
      }]);
    } catch (error: any) {
      // If the session/refresh token is invalid, Supabase will fail before any DB write.
      if (
        error?.code === "refresh_token_not_found" ||
        String(error?.message || "").includes("Invalid Refresh Token")
      ) {
        console.error("Auth expired while creating booking:", error);
        toast.error("Session expired. Please sign in again.");
        await supabase.auth.signOut();
        navigate("/auth", { replace: true });
        return;
      }

      console.error("Error creating booking:", error);
      toast.error("Failed to create booking. Please try again.");
    }
  };

  const filteredBookings = bookings.filter(booking => {
    // Basic search
    const matchesSearch = !searchTerm || 
      booking.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = !filters.type || booking.booking_type === filters.type;
    
    // Agent filter
    const matchesAgent = !filters.agentName || booking.agent_id === filters.agentName;
    
    // Customer filter
    const matchesCustomer = !filters.customer || 
      booking.customer_name?.toLowerCase().includes(filters.customer.toLowerCase());
    
    // Reference filter
    const matchesReference = !filters.reference || 
      booking.reference?.toLowerCase().includes(filters.reference.toLowerCase());
    
    // Cheque No filter
    const matchesCheque = !filters.chequeNo || 
      booking.cheque_no?.toLowerCase().includes(filters.chequeNo.toLowerCase());
    
    // Hotel filter - check if booking has hotel_bookings matching selected hotel
    const matchesHotel = !filters.hotel || booking.hotel_info?.hotel_id === filters.hotel;
    
    // Room filter - check if booking has hotel_bookings matching selected room
    const matchesRoom = !filters.room || booking.hotel_info?.room_id === filters.room;
    
    // Date filter
    let matchesDate = true;
    if (filters.searchWithDate && filters.fromYear && filters.fromMonth && filters.fromDay) {
      const fromDate = new Date(`${filters.fromYear}-${filters.fromMonth.padStart(2, '0')}-${filters.fromDay.padStart(2, '0')}`);
      const bookingDate = new Date(booking.check_in_date);
      matchesDate = bookingDate >= fromDate;
      
      if (filters.toYear && filters.toMonth && filters.toDay) {
        const toDate = new Date(`${filters.toYear}-${filters.toMonth.padStart(2, '0')}-${filters.toDay.padStart(2, '0')}`);
        matchesDate = matchesDate && bookingDate <= toDate;
      }
    }
    
    return matchesSearch && matchesType && matchesAgent && matchesCustomer && 
           matchesReference && matchesCheque && matchesDate && matchesHotel && matchesRoom;
  });

  const pagination = usePagination(filteredBookings);
  
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, filters]);

  const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

  // Action handlers
  const handleViewDetails = async (booking: any) => {
    setSelectedBooking(booking);
    setViewDetailOwnHotelInfo([]);
    setViewDetailAnotherHotelInfo([]);
    setViewDetailSafariInfo([]);
    setViewDetailVehicleInfo([]);
    setViewDetailVolvoDMInfo([]);
    setViewDetailVolvoMDInfo([]);
    setShowViewDetailDialog(true);
    
    // Fetch all service bookings in parallel
    const [hotelRes, safariRes, vehicleRes, volvoDMRes, volvoMDRes] = await Promise.all([
      supabase.from("hotel_bookings").select("*, own_hotels(name), another_hotels(name, cities(name))").eq("booking_id", booking.id),
      supabase.from("safari_bookings").select("*").eq("booking_id", booking.id),
      supabase.from("vehicle_bookings").select("*").eq("booking_id", booking.id),
      supabase.from("volvo_bookings").select("*").eq("booking_id", booking.id).eq("route", "delhi_manali"),
      supabase.from("volvo_bookings").select("*").eq("booking_id", booking.id).eq("route", "manali_delhi")
    ]);

    // Process hotel bookings - separate Own Hotels from Another Hotels
    if (hotelRes.data && hotelRes.data.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const roomIds = [...new Set(hotelRes.data.map((hb: any) => hb.room_type).filter((rt: any) => rt && uuidRegex.test(rt)))];
      let roomsMap: Record<string, string> = {};
      
      if (roomIds.length > 0) {
        const { data: roomsData } = await supabase.from("rooms").select("id, room_type, room_number").in("id", roomIds);
        roomsMap = (roomsData || []).reduce((acc: Record<string, string>, r: any) => ({ ...acc, [r.id]: r.room_type || r.room_number }), {});
      }

      // Separate Own Hotels from Another Hotels
      const ownHotelBookings = hotelRes.data.filter((hb: any) => hb.own_hotel_id && hb.own_hotels?.name);
      const anotherHotelBookings = hotelRes.data.filter((hb: any) => hb.hotel_id && hb.another_hotels?.name);

      setViewDetailOwnHotelInfo(ownHotelBookings.map((hb: any) => ({
        hotelName: hb.own_hotels?.name || "-",
        roomName: hb.room_type && uuidRegex.test(hb.room_type) ? (roomsMap[hb.room_type] || hb.room_type) : (hb.room_type || "-"),
        numberOfRooms: hb.number_of_rooms || 1,
        notes: hb.notes || "",
        checkIn: hb.check_in_date || "",
        checkOut: hb.check_out_date || "",
        totalAmount: hb.total_amount || 0,
        roomRate: hb.room_rate || 0,
        createdAt: booking.created_at
      })));

      setViewDetailAnotherHotelInfo(anotherHotelBookings.map((hb: any) => ({
        hotelName: hb.another_hotels?.name || "-",
        roomName: hb.room_type && uuidRegex.test(hb.room_type) ? (roomsMap[hb.room_type] || hb.room_type) : (hb.room_type || "-"),
        numberOfRooms: hb.number_of_rooms || 1,
        notes: hb.notes || "",
        checkIn: hb.check_in_date || "",
        checkOut: hb.check_out_date || "",
        totalAmount: hb.total_amount || 0,
        roomRate: hb.room_rate || 0,
        createdAt: booking.created_at
      })));
    }

    if (safariRes.data) {
      setViewDetailSafariInfo(safariRes.data.map((sb: any) => ({
        transporter: sb.transporters?.name || "-",
        safariDate: sb.safari_date,
        numberOfPersons: sb.number_of_persons || 0,
        ratePerPerson: sb.rate_per_person || 0,
        totalAmount: sb.total_amount || 0,
        createdAt: booking.created_at
      })));
    }

    if (vehicleRes.data) {
      setViewDetailVehicleInfo(vehicleRes.data.map((vb: any) => ({
        vehicleType: vb.vehicle_type || "-",
        transporter: vb.transporters?.name || "-",
        pickupDate: vb.pickup_date,
        rate: vb.rate || 0,
        totalAmount: vb.total_amount || 0,
        createdAt: booking.created_at
      })));
    }

    if (volvoDMRes.data) {
      setViewDetailVolvoDMInfo(volvoDMRes.data.map((vb: any) => ({
        numberOfSeats: vb.number_of_seats || 0,
        ticketNumber: vb.ticket_number || "-",
        seatNumbers: vb.seat_numbers || "-",
        transporter: vb.transporters?.name || "-",
        travelDate: vb.travel_date,
        ratePerSeat: vb.rate_per_seat || 0,
        totalAmount: vb.total_amount || 0,
        createdAt: booking.created_at
      })));
    }

    if (volvoMDRes.data) {
      setViewDetailVolvoMDInfo(volvoMDRes.data.map((vb: any) => ({
        numberOfSeats: vb.number_of_seats || 0,
        ticketNumber: vb.ticket_number || "-",
        seatNumbers: vb.seat_numbers || "-",
        transporter: vb.transporters?.name || "-",
        travelDate: vb.travel_date,
        ratePerSeat: vb.rate_per_seat || 0,
        totalAmount: vb.total_amount || 0,
        createdAt: booking.created_at
      })));
    }
  };

  const handlePrintBooking = (booking: any) => {
    setPrintBookingId(booking.id);
    // Wait for the receipt component to fully render before printing
    setTimeout(() => {
      window.print();
    }, 800);
  };

  const fetchBookingPayments = async (bookingId: string) => {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, payment_date, payment_mode, reference_number, notes, approval_status, cities(name)")
      .eq("booking_id", bookingId)
      .order("payment_date", { ascending: false });
    setBookingPayments(data || []);
  };

  const handleViewPayment = async (booking: any) => {
    if (isAdminRoute) {
      // Use admin dialog with full service-wise payment breakdown
      setSelectedAdminBookingId(booking.id);
      setShowAdminViewPaymentDialog(true);
    } else {
      // Use standard dialog for user panel
      setSelectedBooking(booking);
      setBookingPayments([]);
      setShowViewPaymentDialog(true);
      await fetchBookingPayments(booking.id);
    }
  };

  const handleRefundPayment = (booking: any) => {
    navigate(isAdminRoute ? `/admin/refund-payments?id=${booking.id}` : `/refunds?id=${booking.id}`);
  };

  const handleEditBooking = async (booking: any) => {
    setEditingBookingId(booking.id);
    
    try {
      // Fetch all related booking data
      const [hotelData, volvoData, safariData, vehicleData, expenseData] = await Promise.all([
        supabase.from("hotel_bookings").select("*").eq("booking_id", booking.id),
        supabase.from("volvo_bookings").select("*").eq("booking_id", booking.id),
        supabase.from("safari_bookings").select("*").eq("booking_id", booking.id),
        supabase.from("vehicle_bookings").select("*").eq("booking_id", booking.id),
        supabase.from("group_expenses").select("*").eq("booking_id", booking.id)
      ]);

      const hotelBooking = hotelData.data?.[0];
      const delhiManaliVolvo = volvoData.data?.find((v: any) => v.route === "Delhi-Manali");
      const manaliDelhiVolvo = volvoData.data?.find((v: any) => v.route === "Manali-Delhi");
      const safariBooking = safariData.data?.[0];
      const vehicleBooking = vehicleData.data?.[0];
      const groupExpense = expenseData.data?.[0];

      // Pre-fill form with ALL booking data
      setFormData({
        booking_type: booking.booking_type || "agent",
        agent_id: booking.agent_id || "",
        reference: booking.reference || "",
        reference_email: booking.reference_email || "",
        customer_name: booking.customer_name || "",
        address: booking.address || "",
        contact_no: booking.contact_no || "",
        email: booking.email || "",
        adults: booking.adults || 1,
        children: booking.children || 0,
        notes: booking.notes || "",
        check_in_date: booking.check_in_date || "",
        check_out_date: booking.check_out_date || "",
        include_booking: booking.include_booking || false,
        include_delhi_manali: booking.include_delhi_manali || false,
        include_manali_delhi: booking.include_manali_delhi || false,
        include_safari: booking.include_safari || false,
        include_another_hotel: booking.include_another_hotel || false,
        include_additional_vehicle: booking.include_additional_vehicle || false,
        include_group_expenses: booking.include_group_expenses || false,
        agent_commission: booking.agent_commission?.toString() || "",
        cheque_no: booking.cheque_no || "",
        // Hotel booking data - use own_hotel_id if available
        booking_hotel_id: hotelBooking?.own_hotel_id || hotelBooking?.hotel_id || "",
        booking_room: hotelBooking?.room_type || "",
        booking_num_rooms: hotelBooking?.number_of_rooms?.toString() || "",
        booking_package_type: "select",
        booking_custom_package: hotelBooking?.notes || "",
        booking_price: hotelBooking?.total_amount?.toString() || "",
        booking_from: hotelBooking?.check_in_date || "",
        booking_to: hotelBooking?.check_out_date || "",
        // Delhi-Manali volvo data
        dm_num_tickets: delhiManaliVolvo?.number_of_seats?.toString() || "",
        dm_ticket_no: delhiManaliVolvo?.notes?.split("Ticket No: ")[1]?.split(",")[0] || "",
        dm_seat_no: delhiManaliVolvo?.notes?.split("Seat No: ")[1] || "",
        dm_transporter_id: "",
        dm_booking_date: "",
        dm_journey_date: delhiManaliVolvo?.travel_date || "",
        dm_booking_price: delhiManaliVolvo?.rate_per_seat?.toString() || "",
        dm_selling_price: delhiManaliVolvo?.total_amount?.toString() || "",
        // Manali-Delhi volvo data
        md_num_tickets: manaliDelhiVolvo?.number_of_seats?.toString() || "",
        md_ticket_no: manaliDelhiVolvo?.notes?.split("Ticket No: ")[1]?.split(",")[0] || "",
        md_seat_no: manaliDelhiVolvo?.notes?.split("Seat No: ")[1] || "",
        md_transporter_id: "",
        md_booking_date: "",
        md_journey_date: manaliDelhiVolvo?.travel_date || "",
        md_booking_price: manaliDelhiVolvo?.rate_per_seat?.toString() || "",
        md_selling_price: manaliDelhiVolvo?.total_amount?.toString() || "",
        // Safari data
        safari_transporter_id: "",
        safari_num: safariBooking?.number_of_persons?.toString() || "",
        safari_booking_date: "",
        safari_journey_date: safariBooking?.safari_date || "",
        safari_booking_price: safariBooking?.rate_per_person?.toString() || "",
        safari_selling_price: safariBooking?.total_amount?.toString() || "",
        safari_note: safariBooking?.notes || "",
        // Another hotel data is now managed via anotherHotelsList state
        // Vehicle data
        vehicle_details: vehicleBooking?.notes?.split("\n")[0] || "",
        vehicle_booking_price: vehicleBooking?.rate?.toString() || "",
        vehicle_selling_price: vehicleBooking?.total_amount?.toString() || "",
        vehicle_transporter_id: vehicleBooking?.transporter_id || "",
        vehicle_booking_date: vehicleBooking?.pickup_date || "",
        vehicle_journey_date: vehicleBooking?.dropoff_date || "",
        vehicle_note: vehicleBooking?.notes?.split("\n")[1] || "",
        // Group expense data
        group_expense_amount: groupExpense?.amount?.toString() || "",
        group_expense_details: groupExpense?.description || ""
      });

      // Load rooms if hotel is selected
      if (hotelBooking?.hotel_id) {
        fetchRoomsForHotel(hotelBooking.hotel_id);
      }

      setShowForm(true);
      toast.success("Booking loaded for editing");
    } catch (error) {
      console.error("Error loading booking for edit:", error);
      toast.error("Failed to load booking details");
    }
  };

  const handleAddPayment = (booking: any) => {
    setSelectedBooking(booking);
    setPaymentAmount("");
    setPaymentMode("");
    setPaymentReference("");
    setPaymentCityId("");
    setPaymentType("");
    setShowPaymentDialog(true);
  };

  const handleCancelBooking = (booking: any) => {
    setSelectedBooking(booking);
    setCancellationReason("");
    setShowCancelDialog(true);
  };

  const submitPayment = async () => {
    if (!paymentAmount || !paymentMode) {
      toast.error("Please fill in required fields");
      return;
    }

    if (isSubmittingPayment) return;
    setIsSubmittingPayment(true);

    try {
      const amount = parseFloat(paymentAmount);
      
      // Insert payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          booking_id: selectedBooking.id,
          amount: amount,
          payment_mode: paymentMode,
          reference_number: paymentReference,
          payment_date: new Date().toISOString().split('T')[0],
          city_id: paymentCityId || null,
          payment_type: paymentType || null
        });

      if (paymentError) throw paymentError;

      // Update booking paid and due amounts
      const newPaidAmount = (selectedBooking.paid_amount || 0) + amount;
      const newDueAmount = (selectedBooking.total_amount || 0) - newPaidAmount;

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          paid_amount: newPaidAmount,
          due_amount: newDueAmount,
          payment_status: newDueAmount <= 0 ? "paid" : "partial"
        })
        .eq("id", selectedBooking.id);

      if (updateError) throw updateError;

      toast.success("Payment added successfully");
      setShowPaymentDialog(false);
      fetchBookings();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to add payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const submitCancellation = async () => {
    if (!cancellationReason) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      // Create cancellation record
      const { error: cancellationError } = await supabase
        .from("cancellations")
        .insert({
          booking_id: selectedBooking.id,
          cancellation_reason: cancellationReason,
          refund_amount: selectedBooking.paid_amount || 0,
          cancellation_charges: 0
        });

      if (cancellationError) throw cancellationError;

      // Update booking status
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled"
        })
        .eq("id", selectedBooking.id);

      if (updateError) throw updateError;

      toast.success("Booking cancelled successfully");
      setShowCancelDialog(false);
      fetchBookings();
    } catch (error) {
      console.error("Cancellation error:", error);
      toast.error("Failed to cancel booking");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Booking Management" />
      <main className="p-3 print:hidden">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold">
            {showForm ? (editingBookingId ? "Edit Booking" : "Create Booking") : "View Booking"}
          </h2>
          <div className="flex gap-2">
            {!showForm && (
              <Button 
                onClick={() => {/* View all logic */}}
                variant="outline"
                size="sm"
              >
                View All
              </Button>
            )}
            <Button 
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setEditingBookingId(null);
                }
              }}
              className="bg-gradient-primary"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              {showForm ? "View Bookings" : "Create Booking"}
            </Button>
          </div>
        </div>

        {showForm ? (
          <Card className="max-w-2xl">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">{editingBookingId ? "Edit Booking" : "Create New Booking"}</CardTitle>
              <p className="text-[10px] text-muted-foreground text-right">* Required fields</p>
            </CardHeader>
            <CardContent className="p-3">
              <form onSubmit={handleSubmit} className="space-y-1">
                {/* Type */}
                <CompactFormRow label="Type" required>
                  <RadioGroup
                    value={formData.booking_type}
                    onValueChange={(value) => setFormData({ ...formData, booking_type: value })}
                    className="flex gap-3"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="agent" id="agent" className="h-3 w-3" />
                      <Label htmlFor="agent" className="text-[11px]">Agent</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="direct" id="direct" className="h-3 w-3" />
                      <Label htmlFor="direct" className="text-[11px]">Direct from customer</Label>
                    </div>
                  </RadioGroup>
                </CompactFormRow>

                {/* Agent Selection */}
                {formData.booking_type === "agent" && (
                  <CompactFormRow label="Agent" required>
                    <Select
                      value={formData.agent_id}
                      onValueChange={(value) => setFormData({ ...formData, agent_id: value })}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="-----Select-----" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CompactFormRow>
                )}

                <CompactFormRow label="Reference">
                  <Input
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-64"
                  />
                </CompactFormRow>

                <CompactFormRow label="Reference Email">
                  <Input
                    type="email"
                    value={formData.reference_email}
                    onChange={(e) => setFormData({ ...formData, reference_email: e.target.value })}
                    className="w-64"
                  />
                </CompactFormRow>

                <CompactFormRow label="Customer Name">
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-64"
                  />
                </CompactFormRow>

                <CompactFormRow label="Address">
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-64"
                  />
                </CompactFormRow>

                <CompactFormRow label="Contact No.">
                  <Input
                    value={formData.contact_no}
                    onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                    className="w-64"
                  />
                </CompactFormRow>

                <CompactFormRow label="Email">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-64"
                  />
                </CompactFormRow>

                <CompactFormRow label="No of People">
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min="0"
                      value={formData.adults}
                      onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 0 })}
                      className="w-16"
                    />
                    <span className="text-[11px]">Adult</span>
                    <Input
                      type="number"
                      min="0"
                      value={formData.children}
                      onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                      className="w-16"
                    />
                    <span className="text-[11px]">Children</span>
                  </div>
                </CompactFormRow>

                <CompactFormRow label="Note">
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-64"
                  />
                </CompactFormRow>

                {/* Service Inclusions */}
                <CompactFormRow label="Booking">
                  <RadioGroup
                    value={formData.include_booking ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_booking: value === "yes" })}
                    className="flex gap-3"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="booking-yes" className="h-3 w-3" />
                      <Label htmlFor="booking-yes" className="text-[11px]">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="booking-no" className="h-3 w-3" />
                      <Label htmlFor="booking-no" className="text-[11px]">No</Label>
                    </div>
                  </RadioGroup>
                </CompactFormRow>

                {/* Booking Details Section */}
                {formData.include_booking && (
                  <div className="ml-28 border-l-2 border-primary/30 pl-3 py-1 space-y-1">
                    <CompactFormRow label="Hotel" className="!w-auto">
                      <Select
                        value={formData.booking_hotel_id}
                        onValueChange={(value) => {
                          setFormData({ ...formData, booking_hotel_id: value, booking_room: "" });
                          fetchRoomsForHotel(value);
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="-----Select-----" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {ownHotels.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id}>
                              {hotel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactFormRow>

                    <CompactFormRow label="Room" className="!w-auto">
                      <Select
                        value={formData.booking_room}
                        onValueChange={(value) => setFormData({ ...formData, booking_room: value })}
                        disabled={!formData.booking_hotel_id}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="-----Select-----" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.room_number} - {room.room_type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactFormRow>

                    <CompactFormRow label="No of Rooms" className="!w-auto">
                      <Input
                        type="number"
                        min="1"
                        value={formData.booking_num_rooms}
                        onChange={(e) => setFormData({ ...formData, booking_num_rooms: e.target.value })}
                        className="w-20"
                      />
                    </CompactFormRow>

                    <CompactFormRow label="Package Type" className="!w-auto">
                      <RadioGroup
                        value={formData.booking_package_type}
                        onValueChange={(value) => setFormData({ ...formData, booking_package_type: value })}
                        className="flex gap-3"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="select" id="pkg-select" className="h-3 w-3" />
                          <Label htmlFor="pkg-select" className="text-[11px]">Select Package</Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="custom" id="pkg-custom" className="h-3 w-3" />
                          <Label htmlFor="pkg-custom" className="text-[11px]">Custom Package</Label>
                        </div>
                      </RadioGroup>
                    </CompactFormRow>

                    {formData.booking_package_type === "custom" && (
                      <CompactFormRow label="Package Note" className="!w-auto">
                        <Textarea
                          placeholder="Enter custom package details..."
                          value={formData.booking_custom_package}
                          onChange={(e) => setFormData({ ...formData, booking_custom_package: e.target.value })}
                          rows={2}
                          className="w-48"
                        />
                      </CompactFormRow>
                    )}

                    <CompactFormRow label="Price" className="!w-auto">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.booking_price}
                        onChange={(e) => setFormData({ ...formData, booking_price: e.target.value })}
                        className="w-24"
                      />
                    </CompactFormRow>

                    <div className="flex gap-2">
                      <CompactFormRow label="From" className="!w-auto">
                        <Input
                          type="date"
                          value={formData.booking_from}
                          onChange={(e) => setFormData({ ...formData, booking_from: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                      <CompactFormRow label="To" className="!w-auto">
                        <Input
                          type="date"
                          value={formData.booking_to}
                          onChange={(e) => setFormData({ ...formData, booking_to: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                    </div>
                  </div>
                )}

                <CompactFormRow label="DELHI - MANALI">
                  <RadioGroup
                    value={formData.include_delhi_manali ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_delhi_manali: value === "yes" })}
                    className="flex gap-3"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="dm-yes" className="h-3 w-3" />
                      <Label htmlFor="dm-yes" className="text-[11px]">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="dm-no" className="h-3 w-3" />
                      <Label htmlFor="dm-no" className="text-[11px]">No</Label>
                    </div>
                  </RadioGroup>
                </CompactFormRow>

                <CompactFormRow label="MANALI - DELHI">
                  <RadioGroup
                    value={formData.include_manali_delhi ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_manali_delhi: value === "yes" })}
                    className="flex gap-3"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="md-yes" className="h-3 w-3" />
                      <Label htmlFor="md-yes" className="text-[11px]">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="md-no" className="h-3 w-3" />
                      <Label htmlFor="md-no" className="text-[11px]">No</Label>
                    </div>
                  </RadioGroup>
                </CompactFormRow>

                <CompactFormRow label="Safari">
                  <RadioGroup
                    value={formData.include_safari ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_safari: value === "yes" })}
                    className="flex gap-3"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="safari-yes" className="h-3 w-3" />
                      <Label htmlFor="safari-yes" className="text-[11px]">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="safari-no" className="h-3 w-3" />
                      <Label htmlFor="safari-no" className="text-[11px]">No</Label>
                    </div>
                  </RadioGroup>
                </CompactFormRow>

                <CompactFormRow label="Another Hotel">
                  <RadioGroup
                    value={formData.include_another_hotel ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_another_hotel: value === "yes" })}
                    className="flex gap-3"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="hotel-yes" className="h-3 w-3" />
                      <Label htmlFor="hotel-yes" className="text-[11px]">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="hotel-no" className="h-3 w-3" />
                      <Label htmlFor="hotel-no" className="text-[11px]">No</Label>
                    </div>
                  </RadioGroup>
                </CompactFormRow>

                <CompactFormRow label="Add. Vehicle">
                  <RadioGroup
                    value={formData.include_additional_vehicle ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_additional_vehicle: value === "yes" })}
                    className="flex gap-3"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="vehicle-yes" className="h-3 w-3" />
                      <Label htmlFor="vehicle-yes" className="text-[11px]">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="vehicle-no" className="h-3 w-3" />
                      <Label htmlFor="vehicle-no" className="text-[11px]">No</Label>
                    </div>
                  </RadioGroup>
                </CompactFormRow>

                <CompactFormRow label="Group Expenses">
                  <RadioGroup
                    value={formData.include_group_expenses ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_group_expenses: value === "yes" })}
                    className="flex gap-3"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="expenses-yes" className="h-3 w-3" />
                      <Label htmlFor="expenses-yes" className="text-[11px]">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="expenses-no" className="h-3 w-3" />
                      <Label htmlFor="expenses-no" className="text-[11px]">No</Label>
                    </div>
                  </RadioGroup>
                </CompactFormRow>

                {/* DELHI - MANALI Details Section */}
                {formData.include_delhi_manali && (
                  <div className="ml-28 border-l-2 border-primary/30 pl-3 py-1 space-y-1">
                    <p className="text-[10px] font-semibold text-primary mb-1">DELHI - MANALI Details</p>
                    <CompactFormRow label="No. Tickets" className="!w-auto">
                      <Input
                        type="number"
                        min="1"
                        value={formData.dm_num_tickets}
                        onChange={(e) => setFormData({ ...formData, dm_num_tickets: e.target.value })}
                        className="w-20"
                      />
                    </CompactFormRow>
                    <CompactFormRow label="Ticket No." className="!w-auto">
                      <Input
                        value={formData.dm_ticket_no}
                        onChange={(e) => setFormData({ ...formData, dm_ticket_no: e.target.value })}
                        className="w-32"
                      />
                    </CompactFormRow>
                    <CompactFormRow label="Seat No." className="!w-auto">
                      <Input
                        value={formData.dm_seat_no}
                        onChange={(e) => setFormData({ ...formData, dm_seat_no: e.target.value })}
                        className="w-32"
                      />
                    </CompactFormRow>
                    <CompactFormRow label="Transporter" className="!w-auto">
                      <Select
                        value={formData.dm_transporter_id}
                        onValueChange={(value) => setFormData({ ...formData, dm_transporter_id: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {transporters.map((transporter) => (
                            <SelectItem key={transporter.id} value={transporter.id}>
                              {transporter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactFormRow>
                    <div className="flex gap-2">
                      <CompactFormRow label="Booking Date" className="!w-auto">
                        <Input
                          type="date"
                          value={formData.dm_booking_date}
                          onChange={(e) => setFormData({ ...formData, dm_booking_date: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                      <CompactFormRow label="Journey Date" className="!w-auto">
                        <Input
                          type="date"
                          value={formData.dm_journey_date}
                          onChange={(e) => setFormData({ ...formData, dm_journey_date: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                    </div>
                    <div className="flex gap-2">
                      <CompactFormRow label="Booking Price" className="!w-auto">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.dm_booking_price}
                          onChange={(e) => setFormData({ ...formData, dm_booking_price: e.target.value })}
                          className="w-24"
                        />
                      </CompactFormRow>
                      <CompactFormRow label="Selling Price" className="!w-auto">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.dm_selling_price}
                          onChange={(e) => setFormData({ ...formData, dm_selling_price: e.target.value })}
                          className="w-24"
                        />
                      </CompactFormRow>
                    </div>
                  </div>
                )}

                {/* MANALI - DELHI Details Section */}
                {formData.include_manali_delhi && (
                  <div className="ml-28 border-l-2 border-primary/30 pl-3 py-1 space-y-1">
                    <p className="text-[10px] font-semibold text-primary mb-1">MANALI - DELHI Details</p>
                    <CompactFormRow label="No. Tickets" className="!w-auto">
                      <Input
                        type="number"
                        min="1"
                        value={formData.md_num_tickets}
                        onChange={(e) => setFormData({ ...formData, md_num_tickets: e.target.value })}
                        className="w-20"
                      />
                    </CompactFormRow>
                    <CompactFormRow label="Ticket No." className="!w-auto">
                      <Input
                        value={formData.md_ticket_no}
                        onChange={(e) => setFormData({ ...formData, md_ticket_no: e.target.value })}
                        className="w-32"
                      />
                    </CompactFormRow>
                    <CompactFormRow label="Seat No." className="!w-auto">
                      <Input
                        value={formData.md_seat_no}
                        onChange={(e) => setFormData({ ...formData, md_seat_no: e.target.value })}
                        className="w-32"
                      />
                    </CompactFormRow>
                    <CompactFormRow label="Transporter" className="!w-auto">
                      <Select
                        value={formData.md_transporter_id}
                        onValueChange={(value) => setFormData({ ...formData, md_transporter_id: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {transporters.map((transporter) => (
                            <SelectItem key={transporter.id} value={transporter.id}>
                              {transporter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactFormRow>
                    <div className="flex gap-2">
                      <CompactFormRow label="Booking Date" className="!w-auto">
                        <Input
                          type="date"
                          value={formData.md_booking_date}
                          onChange={(e) => setFormData({ ...formData, md_booking_date: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                      <CompactFormRow label="Journey Date" className="!w-auto">
                        <Input
                          type="date"
                          value={formData.md_journey_date}
                          onChange={(e) => setFormData({ ...formData, md_journey_date: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                    </div>
                    <div className="flex gap-2">
                      <CompactFormRow label="Booking Price" className="!w-auto">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.md_booking_price}
                          onChange={(e) => setFormData({ ...formData, md_booking_price: e.target.value })}
                          className="w-24"
                        />
                      </CompactFormRow>
                      <CompactFormRow label="Selling Price" className="!w-auto">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.md_selling_price}
                          onChange={(e) => setFormData({ ...formData, md_selling_price: e.target.value })}
                          className="w-24"
                        />
                      </CompactFormRow>
                    </div>
                  </div>
                )}

                {/* Safari Details Section */}
                {formData.include_safari && (
                  <div className="ml-28 border-l-2 border-primary/30 pl-3 py-1 space-y-1">
                    <p className="text-[10px] font-semibold text-primary mb-1">Safari Details</p>
                    <CompactFormRow label="Transporter" className="!w-auto">
                      <Select
                        value={formData.safari_transporter_id}
                        onValueChange={(value) => setFormData({ ...formData, safari_transporter_id: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {transporters.map((transporter) => (
                            <SelectItem key={transporter.id} value={transporter.id}>
                              {transporter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactFormRow>
                    <CompactFormRow label="No. Safari" className="!w-auto">
                      <Input
                        type="number"
                        min="1"
                        value={formData.safari_num}
                        onChange={(e) => setFormData({ ...formData, safari_num: e.target.value })}
                        className="w-20"
                      />
                    </CompactFormRow>
                    <div className="flex gap-2">
                      <CompactFormRow label="Booking Date" className="!w-auto">
                        <Input
                          type="date"
                          value={formData.safari_booking_date}
                          onChange={(e) => setFormData({ ...formData, safari_booking_date: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                      <CompactFormRow label="Journey Date" className="!w-auto">
                        <Input
                          type="date"
                          value={formData.safari_journey_date}
                          onChange={(e) => setFormData({ ...formData, safari_journey_date: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                    </div>
                    <div className="flex gap-2">
                      <CompactFormRow label="Booking Price" className="!w-auto">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.safari_booking_price}
                          onChange={(e) => setFormData({ ...formData, safari_booking_price: e.target.value })}
                          className="w-24"
                        />
                      </CompactFormRow>
                      <CompactFormRow label="Selling Price" className="!w-auto">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.safari_selling_price}
                          onChange={(e) => setFormData({ ...formData, safari_selling_price: e.target.value })}
                          className="w-24"
                        />
                      </CompactFormRow>
                    </div>
                    <CompactFormRow label="Note" className="!w-auto">
                      <Textarea
                        value={formData.safari_note}
                        onChange={(e) => setFormData({ ...formData, safari_note: e.target.value })}
                        rows={2}
                        className="w-48"
                      />
                    </CompactFormRow>
                  </div>
                )}

                {/* Another Hotel Details Section - Supports Multiple Hotels */}
                {formData.include_another_hotel && (
                  <div className="ml-28 border-l-2 border-primary/30 pl-3 py-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-primary">Another Hotel Details</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setAnotherHotelsList([...anotherHotelsList, {
                          hotel_id: "",
                          num_rooms: "",
                          room_type: "",
                          check_in: "",
                          check_out: "",
                          booking_price: "",
                          selling_price: "",
                          note: ""
                        }])}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add More Hotel
                      </Button>
                    </div>
                    
                    {anotherHotelsList.map((hotel, index) => {
                      const updateHotel = (field: keyof AnotherHotelEntry, value: string) => {
                        const newList = [...anotherHotelsList];
                        newList[index] = { ...newList[index], [field]: value };
                        setAnotherHotelsList(newList);
                      };
                      
                      const removeHotel = () => {
                        if (anotherHotelsList.length > 1) {
                          const newList = anotherHotelsList.filter((_, i) => i !== index);
                          setAnotherHotelsList(newList);
                        }
                      };
                      
                      return (
                        <div key={index} className="border border-muted rounded-md p-2 space-y-1 relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-medium text-muted-foreground">Hotel #{index + 1}</span>
                            {anotherHotelsList.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                                onClick={removeHotel}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <CompactFormRow label="Hotel" className="!w-auto">
                            <Select
                              value={hotel.hotel_id}
                              onValueChange={(value) => updateHotel('hotel_id', value)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="-----Select-----" />
                              </SelectTrigger>
                              <SelectContent>
                                {anotherHotels.map((h) => (
                                  <SelectItem key={h.id} value={h.id}>
                                    {h.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </CompactFormRow>
                          <CompactFormRow label="No. Rooms" className="!w-auto">
                            <Input
                              type="number"
                              min="1"
                              value={hotel.num_rooms}
                              onChange={(e) => updateHotel('num_rooms', e.target.value)}
                              className="w-20"
                            />
                          </CompactFormRow>
                          <CompactFormRow label="Room Type" className="!w-auto">
                            <Select
                              value={hotel.room_type}
                              onValueChange={(value) => updateHotel('room_type', value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="deluxe">Deluxe</SelectItem>
                                <SelectItem value="suite">Suite</SelectItem>
                              </SelectContent>
                            </Select>
                          </CompactFormRow>
                          <div className="flex gap-2">
                            <CompactFormRow label="Check In" className="!w-auto">
                              <Input
                                type="date"
                                value={hotel.check_in}
                                onChange={(e) => updateHotel('check_in', e.target.value)}
                                className="w-32"
                              />
                            </CompactFormRow>
                            <CompactFormRow label="Check Out" className="!w-auto">
                              <Input
                                type="date"
                                value={hotel.check_out}
                                onChange={(e) => updateHotel('check_out', e.target.value)}
                                className="w-32"
                              />
                            </CompactFormRow>
                          </div>
                          <div className="flex gap-2">
                            <CompactFormRow label="Booking Price" className="!w-auto">
                              <Input
                                type="number"
                                step="0.01"
                                value={hotel.booking_price}
                                onChange={(e) => updateHotel('booking_price', e.target.value)}
                                className="w-24"
                              />
                            </CompactFormRow>
                            <CompactFormRow label="Selling Price" className="!w-auto">
                              <Input
                                type="number"
                                step="0.01"
                                value={hotel.selling_price}
                                onChange={(e) => updateHotel('selling_price', e.target.value)}
                                className="w-24"
                              />
                            </CompactFormRow>
                          </div>
                          <CompactFormRow label="Note" className="!w-auto">
                            <Textarea
                              value={hotel.note}
                              onChange={(e) => updateHotel('note', e.target.value)}
                              rows={2}
                              className="w-48"
                            />
                          </CompactFormRow>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Additional Vehicle Details Section */}
                {formData.include_additional_vehicle && (
                  <div className="ml-28 border-l-2 border-primary/30 pl-3 py-1 space-y-1">
                    <p className="text-[10px] font-semibold text-primary mb-1">Vehicle Details</p>
                    <CompactFormRow label="Details" className="!w-auto">
                      <Input
                        value={formData.vehicle_details}
                        onChange={(e) => setFormData({ ...formData, vehicle_details: e.target.value })}
                        className="w-48"
                      />
                    </CompactFormRow>
                    <CompactFormRow label="Transporter" className="!w-auto">
                      <Select
                        value={formData.vehicle_transporter_id}
                        onValueChange={(value) => setFormData({ ...formData, vehicle_transporter_id: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {transporters.map((transporter) => (
                            <SelectItem key={transporter.id} value={transporter.id}>
                              {transporter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactFormRow>
                    <div className="flex gap-2">
                      <CompactFormRow label="Booking Price" className="!w-auto">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.vehicle_booking_price}
                          onChange={(e) => setFormData({ ...formData, vehicle_booking_price: e.target.value })}
                          className="w-24"
                        />
                      </CompactFormRow>
                      <CompactFormRow label="Selling Price" className="!w-auto">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.vehicle_selling_price}
                          onChange={(e) => setFormData({ ...formData, vehicle_selling_price: e.target.value })}
                          className="w-24"
                        />
                      </CompactFormRow>
                    </div>
                    <div className="flex gap-2">
                      <CompactFormRow label="Booking Date" className="!w-auto">
                        <Input
                          type="date"
                          value={formData.vehicle_booking_date}
                          onChange={(e) => setFormData({ ...formData, vehicle_booking_date: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                      <CompactFormRow label="Journey Date" className="!w-auto">
                        <Input
                          type="date"
                          value={formData.vehicle_journey_date}
                          onChange={(e) => setFormData({ ...formData, vehicle_journey_date: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                    </div>
                    <CompactFormRow label="Note" className="!w-auto">
                      <Textarea
                        value={formData.vehicle_note}
                        onChange={(e) => setFormData({ ...formData, vehicle_note: e.target.value })}
                        rows={2}
                        className="w-48"
                      />
                    </CompactFormRow>
                  </div>
                )}

                {/* Group Expenses Details Section */}
                {formData.include_group_expenses && (
                  <div className="ml-28 border-l-2 border-primary/30 pl-3 py-1 space-y-1">
                    <p className="text-[10px] font-semibold text-primary mb-1">Group Expenses</p>
                    <CompactFormRow label="Amount" className="!w-auto">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.group_expense_amount}
                        onChange={(e) => setFormData({ ...formData, group_expense_amount: e.target.value })}
                        className="w-24"
                      />
                    </CompactFormRow>
                    <CompactFormRow label="Details" className="!w-auto">
                      <Textarea
                        value={formData.group_expense_details}
                        onChange={(e) => setFormData({ ...formData, group_expense_details: e.target.value })}
                        rows={2}
                        className="w-48"
                      />
                    </CompactFormRow>
                  </div>
                )}

                {/* Agent Commission */}
                {formData.booking_type === "agent" && (
                  <CompactFormRow label="Commission">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.agent_commission}
                      onChange={(e) => setFormData({ ...formData, agent_commission: e.target.value })}
                      className="w-24"
                    />
                  </CompactFormRow>
                )}

                <CompactFormRow label="Cheque No.">
                  <Input
                    value={formData.cheque_no}
                    onChange={(e) => setFormData({ ...formData, cheque_no: e.target.value })}
                    className="w-40"
                  />
                </CompactFormRow>

                <div className="flex gap-2 pt-2 ml-28">
                  <Button type="submit" size="sm" className="bg-gradient-primary">
                    {editingBookingId ? "Update" : "Create Booking"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingBookingId(null);
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
                      // Reset another hotels list
                      setAnotherHotelsList([{
                        hotel_id: "",
                        num_rooms: "",
                        room_type: "",
                        check_in: "",
                        check_out: "",
                        booking_price: "",
                        selling_price: "",
                        note: ""
                      }]);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Compact Filter Section - Matching Reference Design */}
            <div className="mb-3 border border-border bg-muted/50">
              {/* Row 1: Dates and Search with Date */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">From :</span>
                  <select 
                    value={filters.fromMonth} 
                    onChange={(e) => setFilters({...filters, fromMonth: e.target.value})}
                    className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
                  >
                    <option value="">Jan</option>
                    {months.map(m => <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}</option>)}
                  </select>
                  <select 
                    value={filters.fromDay} 
                    onChange={(e) => setFilters({...filters, fromDay: e.target.value})}
                    className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
                  >
                    <option value="">1</option>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input 
                    type="text" 
                    placeholder="2026" 
                    value={filters.fromYear} 
                    onChange={(e) => setFilters({...filters, fromYear: e.target.value})} 
                    className="h-5 w-12 text-[11px] border border-input bg-background px-1 rounded-sm" 
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">To :</span>
                  <select 
                    value={filters.toMonth} 
                    onChange={(e) => setFilters({...filters, toMonth: e.target.value})}
                    className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
                  >
                    <option value="">Jan</option>
                    {months.map(m => <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}</option>)}
                  </select>
                  <select 
                    value={filters.toDay} 
                    onChange={(e) => setFilters({...filters, toDay: e.target.value})}
                    className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
                  >
                    <option value="">1</option>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input 
                    type="text" 
                    placeholder="2026" 
                    value={filters.toYear} 
                    onChange={(e) => setFilters({...filters, toYear: e.target.value})} 
                    className="h-5 w-12 text-[11px] border border-input bg-background px-1 rounded-sm" 
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">Search with Date :</span>
                  <label className="flex items-center gap-0.5 text-[11px]">
                    <input type="radio" name="searchWithDate" checked={filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: true})} className="w-3 h-3" />
                    YES
                  </label>
                  <label className="flex items-center gap-0.5 text-[11px]">
                    <input type="radio" name="searchWithDate" checked={!filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: false})} className="w-3 h-3" />
                    NO
                  </label>
                </div>
              </div>

              {/* Row 2: Type, Agent, Reference, User */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">Type :</span>
                  <select 
                    value={filters.type} 
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                    className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
                  >
                    <option value="">--Select--</option>
                    <option value="agent">Agent</option>
                    <option value="direct">Direct</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">Agent Name :</span>
                  <select 
                    value={filters.agentName} 
                    onChange={(e) => setFilters({...filters, agentName: e.target.value})}
                    className="h-5 text-[11px] border border-input bg-background px-1 min-w-[120px] rounded-sm"
                  >
                    <option value="">--Select--</option>
                    {agents.map(agent => (<option key={agent.id} value={agent.id}>{agent.name}</option>))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">Reference :</span>
                  <input 
                    value={filters.reference} 
                    onChange={(e) => setFilters({...filters, reference: e.target.value})} 
                    className="h-5 w-24 text-[11px] border border-input bg-background px-1 rounded-sm" 
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">User :</span>
                  <select 
                    value={filters.user} 
                    onChange={(e) => setFilters({...filters, user: e.target.value})}
                    className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
                  >
                    <option value="">--Select--</option>
                    <option value="all">All Users</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Hotel, Room, Package, Customer, Cheque, Search */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">Hotel :</span>
                    <select 
                      value={filters.hotel} 
                      onChange={(e) => {
                        setFilters({...filters, hotel: e.target.value, room: ""});
                        fetchFilterRoomsForHotel(e.target.value);
                      }}
                      className="h-5 text-[11px] border border-input bg-background px-1 min-w-[120px] rounded-sm"
                    >
                      <option value="">--Select--</option>
                      {ownHotels.map(hotel => (<option key={hotel.id} value={hotel.id}>{hotel.name}</option>))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">Room :</span>
                    <select 
                      value={filters.room} 
                      onChange={(e) => setFilters({...filters, room: e.target.value})}
                      disabled={!filters.hotel}
                      className="h-5 text-[11px] border border-input bg-background px-1 min-w-[100px] disabled:bg-muted rounded-sm"
                    >
                      <option value="">{filters.hotel ? "--Select--" : "Select hotel"}</option>
                      {filterRooms.map(room => (<option key={room.id} value={room.id}>{room.room_type || room.room_number}</option>))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">Package :</span>
                    <select 
                      value={filters.package} 
                      onChange={(e) => setFilters({...filters, package: e.target.value})}
                      className="h-5 text-[11px] border border-input bg-background px-1 min-w-[120px] rounded-sm"
                    >
                      <option value="">--Select--</option>
                      <option value="all">All Packages</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">Customer :</span>
                    <input 
                      value={filters.customer} 
                      onChange={(e) => setFilters({...filters, customer: e.target.value})} 
                      className="h-5 w-28 text-[11px] border border-input bg-background px-1 rounded-sm" 
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">Cheque No. :</span>
                    <input 
                      value={filters.chequeNo} 
                      onChange={(e) => setFilters({...filters, chequeNo: e.target.value})} 
                      className="h-5 w-24 text-[11px] border border-input bg-background px-1 rounded-sm" 
                    />
                  </div>
                </div>
                <button className="h-6 px-4 text-[11px] bg-primary text-primary-foreground border border-primary/80 hover:bg-primary/90 rounded-sm">Search</button>
              </div>
            </div>

            {/* Detailed Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border border-border px-3 py-2 text-left text-sm font-semibold">S.No.</th>
                        <th className="border border-border px-3 py-2 text-left text-sm font-semibold">Type</th>
                        <th className="border border-border px-3 py-2 text-left text-sm font-semibold">User</th>
                        <th className="border border-border px-3 py-2 text-left text-sm font-semibold">Customer Details</th>
                        <th className="border border-border px-3 py-2 text-left text-sm font-semibold">Package Details</th>
                        <th className="border border-border px-3 py-2 text-left text-sm font-semibold">Booking Price</th>
                        <th className="border border-border px-3 py-2 text-left text-sm font-semibold">Date</th>
                        <th className="border border-border px-3 py-2 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="border border-border px-4 py-8 text-center text-muted-foreground">
                            No bookings found
                          </td>
                        </tr>
                      ) : (
                        pagination.paginatedItems.map((booking, index) => (
                          <tr key={booking.id} className="hover:bg-muted/50">
                            <td className="border border-border px-3 py-2 text-sm">{pagination.startIndex + index}</td>
                            <td className="border border-border px-3 py-2 text-sm">
                              <div>Agent</div>
                              <div className="text-xs text-muted-foreground">
                                {booking.booking_type === "agent" ? booking.agents?.name || "-" : "Direct"}
                              </div>
                            </td>
                            <td className="border border-border px-3 py-2 text-sm">
                              {booking.created_by_name || "-"}
                            </td>
                            <td className="border border-border px-3 py-2 text-sm">
                              <div className="font-medium">{booking.customer_name || "-"}</div>
                              <div className="text-xs text-muted-foreground">Contact No.: {booking.contact_no || "-"}</div>
                            </td>
                            <td className="border border-border px-3 py-2 text-sm">
                              <div className="space-y-1 text-xs">
                                {booking.hotel_info && (
                                  <>
                                    <div><strong>Hotel :</strong> {booking.hotel_info.hotel_name || "-"}</div>
                                    <div><strong>Room :</strong> {booking.hotel_info.room_type || "-"}</div>
                                    {booking.hotel_info.number_of_rooms && <div><strong>Rooms :</strong> {booking.hotel_info.number_of_rooms}</div>}
                                  </>
                                )}
                                {!booking.hotel_info && booking.include_booking && <div>✓ Hotel Booking</div>}
                                {booking.include_delhi_manali && <div>✓ Delhi-Manali</div>}
                                {booking.include_manali_delhi && <div>✓ Manali-Delhi</div>}
                                {booking.include_safari && <div>✓ Safari</div>}
                                {booking.include_another_hotel && <div>✓ Another Hotel</div>}
                                {booking.include_additional_vehicle && <div>✓ Add. Vehicle</div>}
                                {booking.include_group_expenses && <div>✓ Group Expenses</div>}
                              </div>
                            </td>
                            <td className="border border-border px-3 py-2 text-sm">
                              <div className="space-y-1 text-xs">
                                <div><strong>Booking Price:</strong> Rs. {booking.total_amount || 0}/-</div>
                                <div><strong>Total Received:</strong> Rs. {booking.paid_amount || 0}/-</div>
                                <div><strong>Payment:</strong> Rs. {booking.paid_amount || 0}/-</div>
                                <div className="text-destructive"><strong>Due Payment:</strong> Rs. {booking.due_amount || 0}/-</div>
                              </div>
                            </td>
                            <td className="border border-border px-3 py-2 text-sm">
                              <div className="space-y-1 text-xs">
                                <div><strong>Date:</strong> {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "-"}</div>
                                <div><strong>Booking From:</strong> {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "-"}</div>
                                <div><strong>Booking to:</strong> {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : "-"}</div>
                              </div>
                            </td>
                            <td className="border border-border px-3 py-2">
                              <div className="flex flex-col gap-1">
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-primary"
                                  onClick={() => handleViewDetails(booking)}
                                >
                                  View Details
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-primary"
                                  onClick={() => handlePrintBooking(booking)}
                                >
                                  Print Booking
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-primary"
                                  onClick={() => handleViewPayment(booking)}
                                >
                                  View Payment
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-primary"
                                  onClick={() => handleRefundPayment(booking)}
                                >
                                  Refund Payment
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-primary"
                                  onClick={() => handleEditBooking(booking)}
                                >
                                  Edit Booking
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-primary"
                                  onClick={() => handleAddPayment(booking)}
                                >
                                  Add Payment
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-destructive"
                                  onClick={() => handleCancelBooking(booking)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Summary Footer */}
                <div className="bg-muted border border-border p-3 space-y-1">
                  <div className="font-semibold text-sm">
                    Total Booking Price : Rs. {filteredBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0).toLocaleString('en-IN')} /-
                  </div>
                  <div className="flex gap-8 text-sm">
                    <span className="font-semibold">
                      Total Received Payment : Rs. {filteredBookings.reduce((sum, b) => sum + (b.paid_amount || 0), 0).toLocaleString('en-IN')} /-
                    </span>
                    <span className="font-semibold">
                      Total Due Payment : Rs. {filteredBookings.reduce((sum, b) => sum + (b.due_amount || 0), 0).toLocaleString('en-IN')} /-
                    </span>
                  </div>
                </div>

                <TablePagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={pagination.goToPage}
                  totalItems={pagination.totalItems}
                  startIndex={pagination.startIndex}
                  endIndex={pagination.endIndex}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* View Booking Details Dialog */}
        <Dialog open={showViewDetailDialog} onOpenChange={setShowViewDetailDialog}>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-auto p-0 rounded-lg">
            <div className="px-4 py-2" style={{ backgroundColor: "#1e6e99" }}>
              <DialogTitle className="text-white text-sm font-semibold">View Booking Details</DialogTitle>
            </div>
            {selectedBooking && (
              <div className="p-4">
                <div className="border border-gray-400 rounded" style={{ backgroundColor: "#F5E6E0" }}>
                  <div className="p-4 text-[12px]">
                    <table className="w-full">
                      <tbody>
                        <tr><td className="pr-4 py-0.5" style={{ width: '45%' }}>Type :</td><td className="py-0.5 capitalize">{selectedBooking.booking_type === "agent" ? "Agent" : "Direct"}</td></tr>
                        <tr><td className="pr-4 py-0.5">Reference :</td><td className="py-0.5">{selectedBooking.reference || selectedBooking.notes || "-"}</td></tr>
                        <tr><td className="pr-4 py-0.5">Email-Id :</td><td className="py-0.5">{selectedBooking.email || "-"}</td></tr>
                        <tr><td className="pr-4 py-0.5">Customer Name :</td><td className="py-0.5">{selectedBooking.customer_name || "-"}</td></tr>
                        <tr><td className="pr-4 py-0.5">Contact No :</td><td className="py-0.5">{selectedBooking.contact_no || "-"}</td></tr>
                        <tr><td className="pr-4 py-0.5">No. of People :</td><td className="py-0.5">{selectedBooking.adults || 0} Adult {selectedBooking.children || 0} Children</td></tr>
                        <tr><td className="pr-4 py-0.5">Booking From :</td><td className="py-0.5">{selectedBooking.check_in_date ? new Date(selectedBooking.check_in_date).toLocaleDateString("en-GB") : "-"}</td></tr>
                        <tr><td className="pr-4 py-0.5">Booking To :</td><td className="py-0.5">{selectedBooking.check_out_date ? new Date(selectedBooking.check_out_date).toLocaleDateString("en-GB") : "-"}</td></tr>
                        
                        {/* Safari Section */}
                        {viewDetailSafariInfo.length > 0 && viewDetailSafariInfo.map((safari, idx) => (
                          <React.Fragment key={`safari-${idx}`}>
                            <tr><td colSpan={2} className="font-bold pt-3 pb-1">Safari :</td></tr>
                            <tr><td className="pr-4 py-0.5">Transporter :</td><td className="py-0.5">{safari.transporter}</td></tr>
                            <tr><td className="pr-4 py-0.5">Safari Booking Date :</td><td className="py-0.5">{safari.createdAt ? new Date(safari.createdAt).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">Safari Date :</td><td className="py-0.5">{safari.safariDate ? new Date(safari.safariDate).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">No of Safari :</td><td className="py-0.5">{safari.numberOfPersons}</td></tr>
                            <tr><td className="pr-4 py-0.5">Safari Booking Price :</td><td className="py-0.5">Rs. {(safari.ratePerPerson || 0).toLocaleString('en-IN')}/-</td></tr>
                            <tr><td className="pr-4 py-0.5">Safari Selling Price :</td><td className="py-0.5">Rs. {(safari.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                          </React.Fragment>
                        ))}
                        
                        {/* Delhi-Manali Volvo Section */}
                        {viewDetailVolvoDMInfo.length > 0 && viewDetailVolvoDMInfo.map((volvo, idx) => (
                          <React.Fragment key={`dm-${idx}`}>
                            <tr><td colSpan={2} className="font-bold pt-3 pb-1">Delhi - Manali :</td></tr>
                            <tr><td className="pr-4 py-0.5">No. of Tickets :</td><td className="py-0.5">{volvo.numberOfSeats}</td></tr>
                            <tr><td className="pr-4 py-0.5">Ticket No. :</td><td className="py-0.5">{volvo.ticketNumber}</td></tr>
                            <tr><td className="pr-4 py-0.5">Seat No. :</td><td className="py-0.5">{volvo.seatNumbers}</td></tr>
                            <tr><td className="pr-4 py-0.5">Transporter :</td><td className="py-0.5">{volvo.transporter}</td></tr>
                            <tr><td className="pr-4 py-0.5">Volvo Booking Date :</td><td className="py-0.5">{volvo.createdAt ? new Date(volvo.createdAt).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">Volvo Journey Date :</td><td className="py-0.5">{volvo.travelDate ? new Date(volvo.travelDate).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">Volvo Booking Price :</td><td className="py-0.5">Rs. {(volvo.ratePerSeat || 0).toLocaleString('en-IN')}/-</td></tr>
                            <tr><td className="pr-4 py-0.5">Volvo Selling Price :</td><td className="py-0.5">Rs. {(volvo.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                          </React.Fragment>
                        ))}
                        
                        {/* Manali-Delhi Volvo Section */}
                        {viewDetailVolvoMDInfo.length > 0 && viewDetailVolvoMDInfo.map((volvo, idx) => (
                          <React.Fragment key={`md-${idx}`}>
                            <tr><td colSpan={2} className="font-bold pt-3 pb-1">Manali - Delhi :</td></tr>
                            <tr><td className="pr-4 py-0.5">No. of Tickets :</td><td className="py-0.5">{volvo.numberOfSeats}</td></tr>
                            <tr><td className="pr-4 py-0.5">Ticket No. :</td><td className="py-0.5">{volvo.ticketNumber}</td></tr>
                            <tr><td className="pr-4 py-0.5">Seat No. :</td><td className="py-0.5">{volvo.seatNumbers}</td></tr>
                            <tr><td className="pr-4 py-0.5">Transporter :</td><td className="py-0.5">{volvo.transporter}</td></tr>
                            <tr><td className="pr-4 py-0.5">Volvo Booking Date :</td><td className="py-0.5">{volvo.createdAt ? new Date(volvo.createdAt).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">Volvo Journey Date :</td><td className="py-0.5">{volvo.travelDate ? new Date(volvo.travelDate).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">Volvo Booking Price :</td><td className="py-0.5">Rs. {(volvo.ratePerSeat || 0).toLocaleString('en-IN')}/-</td></tr>
                            <tr><td className="pr-4 py-0.5">Volvo Selling Price :</td><td className="py-0.5">Rs. {(volvo.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                          </React.Fragment>
                        ))}
                        
                        {/* Another Vehicle Section */}
                        {viewDetailVehicleInfo.length > 0 && viewDetailVehicleInfo.map((vehicle, idx) => (
                          <React.Fragment key={`vehicle-${idx}`}>
                            <tr><td colSpan={2} className="font-bold pt-3 pb-1">Another Vehicle :</td></tr>
                            <tr><td className="pr-4 py-0.5">Vehicle Details :</td><td className="py-0.5">{vehicle.vehicleType}</td></tr>
                            <tr><td className="pr-4 py-0.5">Vehicle Selling Price :</td><td className="py-0.5">Rs. {(vehicle.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                            <tr><td className="pr-4 py-0.5">Vehicle Booking Price :</td><td className="py-0.5">Rs. {(vehicle.rate || 0).toLocaleString('en-IN')}/-</td></tr>
                            <tr><td className="pr-4 py-0.5">Transporter :</td><td className="py-0.5">{vehicle.transporter}</td></tr>
                            <tr><td className="pr-4 py-0.5">Vehicle Booking Date :</td><td className="py-0.5">{vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">Vehicle Journey Date :</td><td className="py-0.5">{vehicle.pickupDate ? new Date(vehicle.pickupDate).toLocaleDateString("en-GB") : "-"}</td></tr>
                          </React.Fragment>
                        ))}
                        
                        {/* Own Hotel Section (Hotel) */}
                        {viewDetailOwnHotelInfo.length > 0 && viewDetailOwnHotelInfo.map((hotel, idx) => (
                          <React.Fragment key={`own-hotel-${idx}`}>
                            <tr><td colSpan={2} className="font-bold pt-3 pb-1">Hotel :</td></tr>
                            <tr><td className="pr-4 py-0.5">Hotel Name :</td><td className="py-0.5">{hotel.hotelName}</td></tr>
                            <tr><td className="pr-4 py-0.5">Number of Rooms :</td><td className="py-0.5">{hotel.numberOfRooms}</td></tr>
                            <tr><td className="pr-4 py-0.5">Room Name :</td><td className="py-0.5">{hotel.roomName}</td></tr>
                            <tr><td className="pr-4 py-0.5">Hotel Check In :</td><td className="py-0.5">{hotel.checkIn ? new Date(hotel.checkIn).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">Hotel Check Out :</td><td className="py-0.5">{hotel.checkOut ? new Date(hotel.checkOut).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">Room Selling Price :</td><td className="py-0.5">Rs. {(hotel.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                          </React.Fragment>
                        ))}
                        
                        {/* Another Hotel Section */}
                        {viewDetailAnotherHotelInfo.length > 0 && viewDetailAnotherHotelInfo.map((hotel, idx) => (
                          <React.Fragment key={`another-hotel-${idx}`}>
                            <tr><td colSpan={2} className="font-bold pt-3 pb-1">Another Hotel :</td></tr>
                            <tr><td className="pr-4 py-0.5">Another Hotel Name :</td><td className="py-0.5">{hotel.hotelName}</td></tr>
                            <tr><td className="pr-4 py-0.5">Number of Rooms :</td><td className="py-0.5">{hotel.numberOfRooms}</td></tr>
                            <tr><td className="pr-4 py-0.5">Room Type :</td><td className="py-0.5">{hotel.roomName}</td></tr>
                            <tr><td className="pr-4 py-0.5">Hotel Booking Date :</td><td className="py-0.5">{hotel.createdAt ? new Date(hotel.createdAt).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">Hotel Check In :</td><td className="py-0.5">{hotel.checkIn ? new Date(hotel.checkIn).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">Hotel Check Out :</td><td className="py-0.5">{hotel.checkOut ? new Date(hotel.checkOut).toLocaleDateString("en-GB") : "-"}</td></tr>
                            <tr><td className="pr-4 py-0.5">Room Booking Price :</td><td className="py-0.5">Rs. {(hotel.roomRate || 0).toLocaleString('en-IN')}/-</td></tr>
                            <tr><td className="pr-4 py-0.5">Room Selling Price :</td><td className="py-0.5">Rs. {(hotel.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                          </React.Fragment>
                        ))}
                        
                        <tr><td className="pr-4 py-0.5 pt-3">Date :</td><td className="py-0.5 pt-3">{selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleDateString("en-GB") : "-"}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            <div className="px-4 py-2" style={{ backgroundColor: "#1e6e99" }}>
              <span className="text-white text-xs">&nbsp;</span>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Payment Dialog */}
        <Dialog open={showViewPaymentDialog} onOpenChange={setShowViewPaymentDialog}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <div className="bg-[#1e6e99] text-white px-4 py-2 text-sm font-medium">
              View Payment
            </div>
            <div className="p-4 space-y-4">
              {/* Summary Header */}
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#D4A59A" }}>
                    <th className="border border-border px-3 py-1.5"></th>
                    <th className="border border-border px-3 py-1.5 text-center font-medium">Total Payment</th>
                    <th className="border border-border px-3 py-1.5 text-center font-medium">Total Received Payment</th>
                    <th className="border border-border px-3 py-1.5 text-center font-medium">Total Due Payment</th>
                    <th className="border border-border px-3 py-1.5 text-center font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "#F5E6E0" }}>
                    <td className="border border-border px-3 py-1.5 font-medium">Booking</td>
                    <td className="border border-border px-3 py-1.5 text-center">Rs. {selectedBooking?.total_amount?.toLocaleString('en-IN') || 0}/-</td>
                    <td className="border border-border px-3 py-1.5 text-center">Rs. {selectedBooking?.paid_amount?.toLocaleString('en-IN') || 0}/-</td>
                    <td className="border border-border px-3 py-1.5 text-center">Rs. {selectedBooking?.due_amount?.toLocaleString('en-IN') || 0}/-</td>
                    <td className="border border-border px-3 py-1.5 text-center">
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-primary underline"
                        onClick={() => {
                          setShowViewPaymentDialog(false);
                          handleViewDetails(selectedBooking);
                        }}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Payment History Section */}
              <div>
                <div className="text-sm font-medium mb-2">Booking</div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#D4A59A" }}>
                      <th className="border border-border px-2 py-1.5 text-center font-medium">S.No.</th>
                      <th className="border border-border px-2 py-1.5 text-center font-medium">Payment</th>
                      <th className="border border-border px-2 py-1.5 text-center font-medium">Date</th>
                      <th className="border border-border px-2 py-1.5 text-center font-medium">Mode</th>
                      <th className="border border-border px-2 py-1.5 text-center font-medium">Payment Detail</th>
                      <th className="border border-border px-2 py-1.5 text-center font-medium">Place</th>
                      <th className="border border-border px-2 py-1.5 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingPayments.length === 0 ? (
                      <tr style={{ backgroundColor: "#F5E6E0" }}>
                        <td colSpan={7} className="border border-border px-3 py-4 text-center text-muted-foreground">
                          No payments found
                        </td>
                      </tr>
                    ) : (
                      bookingPayments.map((payment, idx) => (
                        <tr key={payment.id} style={{ backgroundColor: "#F5E6E0" }}>
                          <td className="border border-border px-2 py-1.5 text-center">{idx + 1}</td>
                          <td className="border border-border px-2 py-1.5 text-center">Rs. {payment.amount?.toLocaleString('en-IN') || 0}/-</td>
                          <td className="border border-border px-2 py-1.5 text-center">
                            {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : "-"}
                          </td>
                          <td className="border border-border px-2 py-1.5">
                            <div className="capitalize">{payment.payment_mode || "-"}</div>
                            {payment.reference_number && (
                              <div className="text-xs text-muted-foreground">Code={payment.reference_number}</div>
                            )}
                          </td>
                          <td className="border border-border px-2 py-1.5">{payment.notes || "-"}</td>
                          <td className="border border-border px-2 py-1.5 text-center">{payment.cities?.name || "-"}</td>
                          <td className="border border-border px-2 py-1.5 text-center capitalize">{payment.approval_status || "Pending"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-[#1e6e99] h-3"></div>
          </DialogContent>
        </Dialog>

        {/* Admin View Payment Dialog - Shows service-wise payment breakdown */}
        <AdminViewPaymentDialog
          open={showAdminViewPaymentDialog}
          onOpenChange={setShowAdminViewPaymentDialog}
          bookingId={selectedAdminBookingId}
        />

        {/* Add Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Booking Number</Label>
                <Input value={selectedBooking?.booking_number || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input value={selectedBooking?.customer_name || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input value={`Rs. ${selectedBooking?.total_amount || 0}/-`} disabled />
              </div>
              <div className="space-y-2">
                <Label>Due Amount</Label>
                <Input value={`Rs. ${selectedBooking?.due_amount || 0}/-`} disabled className="text-destructive font-semibold" />
              </div>
              <div className="space-y-2">
                <Label>Payment Amount <span className="text-destructive">*</span></Label>
                <Input 
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode <span className="text-destructive">*</span></Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input 
                  placeholder="Transaction/Cheque number"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Place (City)</Label>
                <Select value={paymentCityId} onValueChange={setPaymentCityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city where payment was collected" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="booking">Booking Advance Payment</SelectItem>
                    <SelectItem value="safari">Safari Payment</SelectItem>
                    <SelectItem value="delhi_manali">D-M Volvo Payment</SelectItem>
                    <SelectItem value="manali_delhi">M-D Volvo Payment</SelectItem>
                    <SelectItem value="hotel">Another Hotel Payment</SelectItem>
                    <SelectItem value="vehicle">Vehicle Payment</SelectItem>
                    <SelectItem value="final">Final Payment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={isSubmittingPayment}>Cancel</Button>
                <Button onClick={submitPayment} disabled={isSubmittingPayment}>
                  {isSubmittingPayment ? "Adding..." : "Add Payment"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Booking Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel booking {selectedBooking?.booking_number}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 my-4">
              <Label>Cancellation Reason <span className="text-destructive">*</span></Label>
              <Textarea 
                placeholder="Please provide reason for cancellation"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={submitCancellation} className="bg-destructive hover:bg-destructive/90">
                Confirm Cancellation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      {/* Print Receipt - Hidden on screen, visible when printing */}
      {printBookingId && <BookingReceipt bookingId={printBookingId} />}
    </div>
  );
}
