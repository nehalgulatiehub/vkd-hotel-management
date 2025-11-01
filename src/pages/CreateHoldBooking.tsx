import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";

export default function CreateHoldBooking() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [ownHotels, setOwnHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    booking_type: "direct",
    agent_id: "",
    customer_name: "",
    address: "",
    contact_no: "",
    email: "",
    check_in_date: "",
    check_out_date: "",
    adults: 1,
    children: 0,
    hotel_id: "",
    room_type: "",
    number_of_rooms: 1,
    notes: "",
    hold_until: ""
  });

  useEffect(() => {
    fetchAgents();
    fetchOwnHotels();
  }, []);

  useEffect(() => {
    if (formData.hotel_id) {
      fetchRooms();
    }
  }, [formData.hotel_id]);

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

  const fetchRooms = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("hotel_id", formData.hotel_id)
      .eq("is_available", true)
      .order("room_number");
    setRooms(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hold_until) {
      toast.error("Please set hold expiry date and time");
      return;
    }

    // Create booking with hold status
    const bookingData = {
      booking_number: `HOLD${Date.now().toString().slice(-8)}`,
      booking_type: formData.booking_type,
      agent_id: formData.agent_id || null,
      customer_name: formData.customer_name,
      address: formData.address,
      contact_no: formData.contact_no,
      email: formData.email,
      check_in_date: formData.check_in_date,
      check_out_date: formData.check_out_date,
      adults: formData.adults,
      children: formData.children,
      notes: formData.notes,
      status: "confirmed" as const,
      payment_status: "pending" as const,
      is_hold: true,
      hold_until: formData.hold_until,
      total_amount: 0,
      paid_amount: 0,
      due_amount: 0
    };

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([bookingData])
      .select()
      .single();

    if (bookingError) {
      toast.error("Failed to create hold booking");
      return;
    }

    // Create hotel booking entry
    const selectedRoom = rooms.find(r => r.id === formData.room_type);
    const hotelBookingData = {
      booking_id: booking.id,
      own_hotel_id: formData.hotel_id,
      hotel_id: null,
      check_in_date: formData.check_in_date,
      check_out_date: formData.check_out_date,
      room_type: formData.room_type,
      number_of_rooms: formData.number_of_rooms,
      room_rate: selectedRoom?.base_price || 0,
      total_amount: 0,
      paid_amount: 0,
      due_amount: 0,
      notes: formData.notes
    };

    const { error: hotelError } = await supabase
      .from("hotel_bookings")
      .insert([hotelBookingData]);

    if (hotelError) {
      toast.error("Failed to create hotel booking entry");
      return;
    }

    toast.success("Hold booking created successfully");
    navigate("/hold-bookings");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Create Hold Booking" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Create Hold Booking</h2>
          <p className="text-muted-foreground">Reserve rooms temporarily with an expiry time</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Booking Type */}
              <div>
                <Label>Booking Type</Label>
                <RadioGroup
                  value={formData.booking_type}
                  onValueChange={(value) => setFormData({ ...formData, booking_type: value })}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="direct" id="direct" />
                    <Label htmlFor="direct">Direct</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="agent" id="agent" />
                    <Label htmlFor="agent">Agent</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Agent Selection */}
              {formData.booking_type === "agent" && (
                <div>
                  <Label>Agent *</Label>
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

              {/* Guest Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Contact Number *</Label>
                  <Input
                    required
                    value={formData.contact_no}
                    onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Check-in Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Check-out Date *</Label>
                  <Input
                    type="date"
                    required
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
              </div>

              {/* Hotel & Room Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Hotel *</Label>
                  <Select
                    value={formData.hotel_id}
                    onValueChange={(value) => setFormData({ ...formData, hotel_id: value, room_type: "" })}
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
                  <Label>Room Type *</Label>
                  <Select
                    value={formData.room_type}
                    onValueChange={(value) => setFormData({ ...formData, room_type: value })}
                    disabled={!formData.hotel_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.room_number} - {room.room_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Number of Rooms</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.number_of_rooms}
                    onChange={(e) => setFormData({ ...formData, number_of_rooms: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {/* Hold Expiry */}
              <div className="border-2 border-orange-500 p-4 rounded-lg bg-orange-50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <Label className="text-orange-900 font-semibold">Hold Expiry *</Label>
                </div>
                <Input
                  type="datetime-local"
                  required
                  value={formData.hold_until}
                  onChange={(e) => setFormData({ ...formData, hold_until: e.target.value })}
                  className="bg-white"
                />
                <p className="text-xs text-orange-700 mt-2">
                  This booking will be automatically cancelled if not confirmed before this date/time
                </p>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any special notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate("/bookings")}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-primary">
                  Create Hold Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
