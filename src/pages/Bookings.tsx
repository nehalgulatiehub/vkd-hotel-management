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
import { Plus, Search } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { BookingReceipt } from "@/components/booking/BookingReceipt";
import { CompactFormRow } from "@/components/booking/CompactFormRow";

export default function Bookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const [showForm, setShowForm] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [ownHotels, setOwnHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [anotherHotels, setAnotherHotels] = useState<any[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
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
    // Another Hotel section fields
    another_hotel_id: "",
    another_hotel_num_rooms: "",
    another_hotel_room_type: "",
    another_hotel_booking_date: "",
    another_hotel_check_in: "",
    another_hotel_check_out: "",
    another_hotel_booking_price: "",
    another_hotel_selling_price: "",
    another_hotel_note: "",
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
      setBookings(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
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

      // Insert Another Hotel Booking if included
      if (formData.include_another_hotel && formData.another_hotel_id) {
        const anotherHotelAmount = formData.another_hotel_selling_price ? parseFloat(formData.another_hotel_selling_price) : 0;
        totalAmount += anotherHotelAmount;
        
        const anotherHotelData = {
          booking_id: bookingId,
          hotel_id: formData.another_hotel_id,
          own_hotel_id: null,
          check_in_date: formData.another_hotel_check_in,
          check_out_date: formData.another_hotel_check_out,
          room_type: formData.another_hotel_room_type,
          number_of_rooms: formData.another_hotel_num_rooms ? parseInt(formData.another_hotel_num_rooms) : 1,
          room_rate: formData.another_hotel_booking_price ? parseFloat(formData.another_hotel_booking_price) : 0,
          total_amount: anotherHotelAmount,
          paid_amount: 0,
          due_amount: anotherHotelAmount,
          notes: formData.another_hotel_note
        };
        
        const { error: anotherHotelError } = await supabase
          .from("hotel_bookings")
          .insert([anotherHotelData]);
        
        if (anotherHotelError) console.error("Another hotel booking error:", anotherHotelError);
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
    } catch (error) {
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
           matchesReference && matchesCheque && matchesDate;
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
  const handleViewDetails = (booking: any) => {
    navigate(isAdminRoute ? `/admin/bookings/${booking.id}` : `/bookings/${booking.id}`);
  };

  const handlePrintBooking = (booking: any) => {
    setPrintBookingId(booking.id);
    // Wait for the receipt component to fully render before printing
    setTimeout(() => {
      window.print();
    }, 800);
  };

  const handleViewPayment = (booking: any) => {
    navigate(isAdminRoute ? `/admin/booking-payments?id=${booking.id}` : `/payments/booking?id=${booking.id}`);
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
        // Another hotel data
        another_hotel_id: "",
        another_hotel_num_rooms: "",
        another_hotel_room_type: "",
        another_hotel_booking_date: "",
        another_hotel_check_in: "",
        another_hotel_check_out: "",
        another_hotel_booking_price: "",
        another_hotel_selling_price: "",
        another_hotel_note: "",
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

                {/* Another Hotel Details Section */}
                {formData.include_another_hotel && (
                  <div className="ml-28 border-l-2 border-primary/30 pl-3 py-1 space-y-1">
                    <p className="text-[10px] font-semibold text-primary mb-1">Another Hotel Details</p>
                    <CompactFormRow label="Hotel" className="!w-auto">
                      <Select
                        value={formData.another_hotel_id}
                        onValueChange={(value) => setFormData({ ...formData, another_hotel_id: value })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="-----Select-----" />
                        </SelectTrigger>
                        <SelectContent>
                          {anotherHotels.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id}>
                              {hotel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactFormRow>
                    <CompactFormRow label="No. Rooms" className="!w-auto">
                      <Input
                        type="number"
                        min="1"
                        value={formData.another_hotel_num_rooms}
                        onChange={(e) => setFormData({ ...formData, another_hotel_num_rooms: e.target.value })}
                        className="w-20"
                      />
                    </CompactFormRow>
                    <CompactFormRow label="Room Type" className="!w-auto">
                      <Select
                        value={formData.another_hotel_room_type}
                        onValueChange={(value) => setFormData({ ...formData, another_hotel_room_type: value })}
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
                          value={formData.another_hotel_check_in}
                          onChange={(e) => setFormData({ ...formData, another_hotel_check_in: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                      <CompactFormRow label="Check Out" className="!w-auto">
                        <Input
                          type="date"
                          value={formData.another_hotel_check_out}
                          onChange={(e) => setFormData({ ...formData, another_hotel_check_out: e.target.value })}
                          className="w-32"
                        />
                      </CompactFormRow>
                    </div>
                    <div className="flex gap-2">
                      <CompactFormRow label="Booking Price" className="!w-auto">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.another_hotel_booking_price}
                          onChange={(e) => setFormData({ ...formData, another_hotel_booking_price: e.target.value })}
                          className="w-24"
                        />
                      </CompactFormRow>
                      <CompactFormRow label="Selling Price" className="!w-auto">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.another_hotel_selling_price}
                          onChange={(e) => setFormData({ ...formData, another_hotel_selling_price: e.target.value })}
                          className="w-24"
                        />
                      </CompactFormRow>
                    </div>
                    <CompactFormRow label="Note" className="!w-auto">
                      <Textarea
                        value={formData.another_hotel_note}
                        onChange={(e) => setFormData({ ...formData, another_hotel_note: e.target.value })}
                        rows={2}
                        className="w-48"
                      />
                    </CompactFormRow>
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
            {/* Filter Section */}
            <Card className="mb-6 bg-pink-50">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* From Date */}
                  <div className="space-y-2">
                    <Label className="text-sm">From</Label>
                    <div className="flex gap-2">
                      <Select value={filters.fromMonth} onValueChange={(value) => setFilters({...filters, fromMonth: value})}>
                        <SelectTrigger className="w-20 bg-white">
                          <SelectValue placeholder="Nov" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={filters.fromDay} onValueChange={(value) => setFilters({...filters, fromDay: value})}>
                        <SelectTrigger className="w-16 bg-white">
                          <SelectValue placeholder="1" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input 
                        type="number" 
                        placeholder="2025" 
                        value={filters.fromYear}
                        onChange={(e) => setFilters({...filters, fromYear: e.target.value})}
                        className="w-20 bg-white"
                      />
                    </div>
                  </div>

                  {/* To Date */}
                  <div className="space-y-2">
                    <Label className="text-sm">To</Label>
                    <div className="flex gap-2">
                      <Select value={filters.toMonth} onValueChange={(value) => setFilters({...filters, toMonth: value})}>
                        <SelectTrigger className="w-20 bg-white">
                          <SelectValue placeholder="Nov" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={filters.toDay} onValueChange={(value) => setFilters({...filters, toDay: value})}>
                        <SelectTrigger className="w-16 bg-white">
                          <SelectValue placeholder="1" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input 
                        type="number" 
                        placeholder="2025" 
                        value={filters.toYear}
                        onChange={(e) => setFilters({...filters, toYear: e.target.value})}
                        className="w-20 bg-white"
                      />
                    </div>
                  </div>

                  {/* Search with Date */}
                  <div className="space-y-2">
                    <Label className="text-sm">Search with Date</Label>
                    <RadioGroup
                      value={filters.searchWithDate ? "yes" : "no"}
                      onValueChange={(value) => setFilters({...filters, searchWithDate: value === "yes"})}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="date-yes" />
                        <Label htmlFor="date-yes">YES</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="date-no" />
                        <Label htmlFor="date-no">NO</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {/* Type */}
                  <div className="space-y-2">
                    <Label className="text-sm">Type</Label>
                    <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="--Select--" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Agent Name */}
                  <div className="space-y-2">
                    <Label className="text-sm">Agent Name</Label>
                    <Select value={filters.agentName} onValueChange={(value) => setFilters({...filters, agentName: value})}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="--Select--" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reference */}
                  <div className="space-y-2">
                    <Label className="text-sm">Reference</Label>
                    <Input 
                      value={filters.reference}
                      onChange={(e) => setFilters({...filters, reference: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {/* Hotel */}
                  <div className="space-y-2">
                    <Label className="text-sm">Hotel (Own)</Label>
                    <Select value={filters.hotel} onValueChange={(value) => setFilters({...filters, hotel: value})}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="--Select--" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {ownHotels.map(hotel => (
                          <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Room */}
                  <div className="space-y-2">
                    <Label className="text-sm">Room</Label>
                    <Select value={filters.room} onValueChange={(value) => setFilters({...filters, room: value})}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="--Select--" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="deluxe">Deluxe</SelectItem>
                        <SelectItem value="suite">Suite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* User */}
                  <div className="space-y-2">
                    <Label className="text-sm">User</Label>
                    <Select value={filters.user} onValueChange={(value) => setFilters({...filters, user: value})}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="--Select--" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        <SelectItem value="all">All Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {/* Package */}
                  <div className="space-y-2">
                    <Label className="text-sm">Package</Label>
                    <Select value={filters.package} onValueChange={(value) => setFilters({...filters, package: value})}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="--Select--" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        <SelectItem value="all">All Packages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Customer */}
                  <div className="space-y-2">
                    <Label className="text-sm">Customer</Label>
                    <Input 
                      value={filters.customer}
                      onChange={(e) => setFilters({...filters, customer: e.target.value})}
                      className="bg-white"
                    />
                  </div>

                  {/* Cheque No */}
                  <div className="space-y-2">
                    <Label className="text-sm">Cheque No.</Label>
                    <Input 
                      value={filters.chequeNo}
                      onChange={(e) => setFilters({...filters, chequeNo: e.target.value})}
                      className="bg-white"
                    />
                  </div>

                  {/* Search Button */}
                  <div className="space-y-2">
                    <Label className="text-sm">&nbsp;</Label>
                    <Button className="w-full bg-gray-800 hover:bg-gray-700">
                      Search
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-pink-200">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">S.No.</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Type</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">User</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Customer Details</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Package Details</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Booking Price</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Date</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-muted-foreground">
                            No bookings found
                          </td>
                        </tr>
                      ) : (
                        pagination.paginatedItems.map((booking, index) => (
                          <tr key={booking.id} className="hover:bg-muted/50">
                            <td className="border border-gray-300 px-3 py-2 text-sm">{pagination.startIndex + index}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <div className="capitalize">{booking.booking_type}</div>
                              <div className="text-xs text-muted-foreground">
                                {booking.agents?.name || "Direct"}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              {booking.created_by || "-"}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <div className="font-medium">{booking.customer_name || "-"}</div>
                              <div className="text-xs text-muted-foreground">Contact No.: {booking.contact_no || "-"}</div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <div className="space-y-1 text-xs">
                                {booking.include_booking && <div>✓ Hotel Booking</div>}
                                {booking.include_delhi_manali && <div>✓ Delhi-Manali</div>}
                                {booking.include_manali_delhi && <div>✓ Manali-Delhi</div>}
                                {booking.include_safari && <div>✓ Safari</div>}
                                {booking.include_another_hotel && <div>✓ Another Hotel</div>}
                                {booking.include_additional_vehicle && <div>✓ Additional Vehicle</div>}
                                {booking.include_group_expenses && <div>✓ Group Expenses</div>}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <div className="space-y-1 text-xs">
                                <div><strong>Booking Price:</strong> Rs. {booking.total_amount || 0}/-</div>
                                <div><strong>Total Received:</strong> Rs. {booking.paid_amount || 0}/-</div>
                                <div><strong>Payment:</strong> Rs. {booking.paid_amount || 0}/-</div>
                                <div className="text-red-600"><strong>Due Payment:</strong> Rs. {booking.due_amount || 0}/-</div>
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">
                              <div className="space-y-1 text-xs">
                                <div><strong>Date:</strong> {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "-"}</div>
                                <div><strong>Booking From:</strong> {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "-"}</div>
                                <div><strong>Booking to:</strong> {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : "-"}</div>
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className="flex flex-col gap-1">
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-blue-600"
                                  onClick={() => handleViewDetails(booking)}
                                >
                                  View Details
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-blue-600"
                                  onClick={() => handlePrintBooking(booking)}
                                >
                                  Print Booking
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-blue-600"
                                  onClick={() => handleViewPayment(booking)}
                                >
                                  View Payment
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-blue-600"
                                  onClick={() => handleRefundPayment(booking)}
                                >
                                  Refund Payment
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-blue-600"
                                  onClick={() => handleEditBooking(booking)}
                                >
                                  Edit Booking
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-blue-600"
                                  onClick={() => handleAddPayment(booking)}
                                >
                                  Add Payment
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 text-xs text-red-600"
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
                <Input value={`Rs. ${selectedBooking?.due_amount || 0}/-`} disabled className="text-red-600 font-semibold" />
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
