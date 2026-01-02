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
import { CompactFormRow } from "@/components/booking/CompactFormRow";

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
      <main className="p-4 flex justify-center">
        <Card className="w-full max-w-xl">
          <CardContent className="p-4">
            <div className="mb-3 text-center">
              <h2 className="text-lg font-semibold">Create Hold Booking</h2>
              <p className="text-xs text-muted-foreground">Reserve rooms temporarily</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Booking Type */}
              <CompactFormRow label="Booking Type">
                <RadioGroup
                  value={formData.booking_type}
                  onValueChange={(value) => setFormData({ ...formData, booking_type: value })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="direct" id="direct" className="h-3 w-3" />
                    <Label htmlFor="direct" className="text-xs">Direct</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="agent" id="agent" className="h-3 w-3" />
                    <Label htmlFor="agent" className="text-xs">Agent</Label>
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
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id} className="text-xs">
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CompactFormRow>
              )}

              {/* Guest Details */}
              <CompactFormRow label="Customer Name" required>
                <Input
                  required
                  className="h-7 text-xs"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </CompactFormRow>

              <CompactFormRow label="Contact No" required>
                <Input
                  required
                  className="h-7 text-xs"
                  value={formData.contact_no}
                  onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                />
              </CompactFormRow>

              <CompactFormRow label="Email">
                <Input
                  type="email"
                  className="h-7 text-xs"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </CompactFormRow>

              <CompactFormRow label="Address">
                <Input
                  className="h-7 text-xs"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </CompactFormRow>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <CompactFormRow label="Check-in" required>
                  <Input
                    type="date"
                    required
                    className="h-7 text-xs"
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                  />
                </CompactFormRow>

                <CompactFormRow label="Check-out" required>
                  <Input
                    type="date"
                    required
                    className="h-7 text-xs"
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                  />
                </CompactFormRow>
              </div>

              {/* Occupancy */}
              <div className="grid grid-cols-2 gap-2">
                <CompactFormRow label="Adults">
                  <Input
                    type="number"
                    min="1"
                    className="h-7 text-xs"
                    value={formData.adults}
                    onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) })}
                  />
                </CompactFormRow>

                <CompactFormRow label="Children">
                  <Input
                    type="number"
                    min="0"
                    className="h-7 text-xs"
                    value={formData.children}
                    onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) })}
                  />
                </CompactFormRow>
              </div>

              {/* Hotel & Room */}
              <CompactFormRow label="Hotel" required>
                <Select
                  value={formData.hotel_id}
                  onValueChange={(value) => setFormData({ ...formData, hotel_id: value, room_type: "" })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {ownHotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id} className="text-xs">
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CompactFormRow>

              <div className="grid grid-cols-2 gap-2">
                <CompactFormRow label="Room Type" required>
                  <Select
                    value={formData.room_type}
                    onValueChange={(value) => setFormData({ ...formData, room_type: value })}
                    disabled={!formData.hotel_id}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id} className="text-xs">
                          {room.room_number} - {room.room_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CompactFormRow>

                <CompactFormRow label="No. of Rooms">
                  <Input
                    type="number"
                    min="1"
                    className="h-7 text-xs"
                    value={formData.number_of_rooms}
                    onChange={(e) => setFormData({ ...formData, number_of_rooms: parseInt(e.target.value) })}
                  />
                </CompactFormRow>
              </div>

              {/* Hold Expiry */}
              <div className="border border-orange-400 p-2 rounded bg-orange-50 dark:bg-orange-950/20">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="h-3 w-3 text-orange-600" />
                  <Label className="text-xs text-orange-900 dark:text-orange-400 font-semibold">Hold Expiry *</Label>
                </div>
                <Input
                  type="datetime-local"
                  required
                  className="h-7 text-xs bg-background"
                  value={formData.hold_until}
                  onChange={(e) => setFormData({ ...formData, hold_until: e.target.value })}
                />
                <p className="text-[10px] text-orange-700 dark:text-orange-500 mt-1">
                  Auto-cancels if not confirmed before this time
                </p>
              </div>

              {/* Notes */}
              <CompactFormRow label="Notes">
                <Textarea
                  placeholder="Special notes..."
                  className="text-xs min-h-[50px]"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </CompactFormRow>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => navigate("/bookings")}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-gradient-primary">
                  Create Hold Booking
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
