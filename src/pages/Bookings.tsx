import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Bookings() {
  const [showForm, setShowForm] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
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
    include_booking: true,
    include_delhi_manali: false,
    include_manali_delhi: false,
    include_safari: false,
    include_another_hotel: false,
    include_additional_vehicle: false,
    include_group_expenses: false,
    agent_commission: "",
    cheque_no: ""
  });

  useEffect(() => {
    fetchAgents();
    fetchBookings();
  }, []);

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
    
    // Generate booking number
    const bookingNumber = `BK${Date.now().toString().slice(-8)}`;
    
    const bookingData = {
      ...formData,
      booking_number: bookingNumber,
      agent_commission: formData.agent_commission ? parseFloat(formData.agent_commission) : null,
      agent_id: formData.booking_type === "agent" && formData.agent_id ? formData.agent_id : null,
      status: "confirmed" as const,
      payment_status: "pending" as const
    };

    const { error } = await supabase
      .from("bookings")
      .insert([bookingData]);

    if (error) {
      toast.error("Failed to create booking");
      console.error(error);
    } else {
      toast.success("Booking created successfully");
      setShowForm(false);
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
        include_booking: true,
        include_delhi_manali: false,
        include_manali_delhi: false,
        include_safari: false,
        include_another_hotel: false,
        include_additional_vehicle: false,
        include_group_expenses: false,
        agent_commission: "",
        cheque_no: ""
      });
    }
  };

  const filteredBookings = bookings.filter(booking => 
    booking.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header title="Booking Management" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Bookings</h2>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "View Bookings" : "Create Booking"}
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Create New Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type */}
                <div className="space-y-2">
                  <Label className="text-base">Type <span className="text-destructive">*</span></Label>
                  <RadioGroup
                    value={formData.booking_type}
                    onValueChange={(value) => setFormData({ ...formData, booking_type: value })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="agent" id="agent" />
                      <Label htmlFor="agent">Agent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="direct" id="direct" />
                      <Label htmlFor="direct">Direct from customer</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Agent Selection */}
                {formData.booking_type === "agent" && (
                  <div className="space-y-2">
                    <Label>Agent <span className="text-destructive">*</span></Label>
                    <Select
                      value={formData.agent_id}
                      onValueChange={(value) => setFormData({ ...formData, agent_id: value })}
                    >
                      <SelectTrigger>
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
                  </div>
                )}

                {/* Reference */}
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  />
                </div>

                {/* Reference Email */}
                <div className="space-y-2">
                  <Label>Reference Email</Label>
                  <Input
                    type="email"
                    value={formData.reference_email}
                    onChange={(e) => setFormData({ ...formData, reference_email: e.target.value })}
                  />
                </div>

                {/* Customer Name */}
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={4}
                  />
                </div>

                {/* Contact No */}
                <div className="space-y-2">
                  <Label>Contact No.</Label>
                  <Input
                    value={formData.contact_no}
                    onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {/* Check-in Date */}
                <div className="space-y-2">
                  <Label>Check-in Date</Label>
                  <Input
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                  />
                </div>

                {/* Check-out Date */}
                <div className="space-y-2">
                  <Label>Check-out Date</Label>
                  <Input
                    type="date"
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                  />
                </div>

                {/* No of People */}
                <div className="space-y-2">
                  <Label>No of People</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.adults}
                        onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 0 })}
                        className="w-24"
                      />
                      <span>Adult</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.children}
                        onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                        className="w-24"
                      />
                      <span>Children</span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                </div>

                {/* Service Inclusions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Booking */}
                  <div className="space-y-2">
                    <Label>Booking</Label>
                    <RadioGroup
                      value={formData.include_booking ? "yes" : "no"}
                      onValueChange={(value) => setFormData({ ...formData, include_booking: value === "yes" })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="booking-yes" />
                        <Label htmlFor="booking-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="booking-no" />
                        <Label htmlFor="booking-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* DELHI - MANALI */}
                  <div className="space-y-2">
                    <Label>DELHI - MANALI</Label>
                    <RadioGroup
                      value={formData.include_delhi_manali ? "yes" : "no"}
                      onValueChange={(value) => setFormData({ ...formData, include_delhi_manali: value === "yes" })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="dm-yes" />
                        <Label htmlFor="dm-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="dm-no" />
                        <Label htmlFor="dm-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* MANALI - DELHI */}
                  <div className="space-y-2">
                    <Label>MANALI - DELHI</Label>
                    <RadioGroup
                      value={formData.include_manali_delhi ? "yes" : "no"}
                      onValueChange={(value) => setFormData({ ...formData, include_manali_delhi: value === "yes" })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="md-yes" />
                        <Label htmlFor="md-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="md-no" />
                        <Label htmlFor="md-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Safari */}
                  <div className="space-y-2">
                    <Label>Safari</Label>
                    <RadioGroup
                      value={formData.include_safari ? "yes" : "no"}
                      onValueChange={(value) => setFormData({ ...formData, include_safari: value === "yes" })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="safari-yes" />
                        <Label htmlFor="safari-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="safari-no" />
                        <Label htmlFor="safari-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Another Hotel */}
                  <div className="space-y-2">
                    <Label>Another Hotel</Label>
                    <RadioGroup
                      value={formData.include_another_hotel ? "yes" : "no"}
                      onValueChange={(value) => setFormData({ ...formData, include_another_hotel: value === "yes" })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="hotel-yes" />
                        <Label htmlFor="hotel-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="hotel-no" />
                        <Label htmlFor="hotel-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Additional Vehicle */}
                  <div className="space-y-2">
                    <Label>Additional Vehicle</Label>
                    <RadioGroup
                      value={formData.include_additional_vehicle ? "yes" : "no"}
                      onValueChange={(value) => setFormData({ ...formData, include_additional_vehicle: value === "yes" })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="vehicle-yes" />
                        <Label htmlFor="vehicle-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="vehicle-no" />
                        <Label htmlFor="vehicle-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Group Expenses */}
                  <div className="space-y-2">
                    <Label>Group Expences</Label>
                    <RadioGroup
                      value={formData.include_group_expenses ? "yes" : "no"}
                      onValueChange={(value) => setFormData({ ...formData, include_group_expenses: value === "yes" })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="expenses-yes" />
                        <Label htmlFor="expenses-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="expenses-no" />
                        <Label htmlFor="expenses-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Agent Commission */}
                {formData.booking_type === "agent" && (
                  <div className="space-y-2">
                    <Label>Agent Commission</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.agent_commission}
                      onChange={(e) => setFormData({ ...formData, agent_commission: e.target.value })}
                    />
                  </div>
                )}

                {/* Cheque No */}
                <div className="space-y-2">
                  <Label>Cheque No.</Label>
                  <Input
                    value={formData.cheque_no}
                    onChange={(e) => setFormData({ ...formData, cheque_no: e.target.value })}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="bg-gradient-primary">
                    Create Booking
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Booking No.</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Customer Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Reference</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Contact</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Adults/Children</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                            No bookings found
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm">{booking.booking_number}</td>
                            <td className="px-4 py-3 text-sm capitalize">{booking.booking_type}</td>
                            <td className="px-4 py-3 text-sm">{booking.customer_name || "-"}</td>
                            <td className="px-4 py-3 text-sm">{booking.reference || "-"}</td>
                            <td className="px-4 py-3 text-sm">{booking.contact_no || "-"}</td>
                            <td className="px-4 py-3 text-sm">{booking.adults}/{booking.children}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
