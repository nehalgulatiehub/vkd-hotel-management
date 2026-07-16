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
import { useAuthContext } from "@/contexts/AuthContext";

export default function CreateHoldBooking() {
  const navigate = useNavigate();
  const { hasMenuAccess, isAdmin, isAccount } = useAuthContext();
  const [agents, setAgents] = useState<any[]>([]);
  
  // Permission checks for booking sections
  const canSeeBookingSection = isAdmin() || isAccount() || hasMenuAccess("booking_section_booking");
  const canSeeDelhiManaliSection = isAdmin() || isAccount() || hasMenuAccess("booking_section_delhi_manali");
  const canSeeManaliDelhiSection = isAdmin() || isAccount() || hasMenuAccess("booking_section_manali_delhi");
  const canSeeSafariSection = isAdmin() || isAccount() || hasMenuAccess("booking_section_safari");
  const canSeeAnotherHotelSection = isAdmin() || isAccount() || hasMenuAccess("booking_section_another_hotel");
  const canSeeVehicleSection = isAdmin() || isAccount() || hasMenuAccess("booking_section_vehicle");
  const canSeeGroupExpensesSection = isAdmin() || isAccount() || hasMenuAccess("booking_section_group_expenses");

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
    include_booking: false,
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
  }, []);

  const fetchAgents = async () => {
    const { data } = await supabase
      .from("agents")
      .select("*")
      .order("name");
    setAgents(data || []);
  };

  const handleReset = () => {
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
      include_booking: false,
      include_delhi_manali: false,
      include_manali_delhi: false,
      include_safari: false,
      include_another_hotel: false,
      include_additional_vehicle: false,
      include_group_expenses: false,
      agent_commission: "",
      cheque_no: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.booking_type === "agent" && !formData.agent_id) {
      toast.error("Please select an agent");
      return;
    }

    const bookingData = {
      booking_number: `HOLD${Date.now().toString().slice(-8)}`,
      booking_type: formData.booking_type,
      agent_id: formData.agent_id || null,
      reference: formData.reference || null,
      reference_email: formData.reference_email || null,
      customer_name: formData.customer_name,
      address: formData.address,
      contact_no: formData.contact_no,
      email: formData.email,
      check_in_date: new Date().toISOString().split('T')[0],
      check_out_date: new Date().toISOString().split('T')[0],
      adults: formData.adults,
      children: formData.children,
      notes: formData.notes,
      status: "confirmed" as const,
      payment_status: "pending" as const,
      is_hold: true,
      include_booking: formData.include_booking,
      include_delhi_manali: formData.include_delhi_manali,
      include_manali_delhi: formData.include_manali_delhi,
      include_safari: formData.include_safari,
      include_another_hotel: formData.include_another_hotel,
      include_additional_vehicle: formData.include_additional_vehicle,
      include_group_expenses: formData.include_group_expenses,
      agent_commission: formData.agent_commission ? parseFloat(formData.agent_commission) : null,
      total_amount: 0,
      paid_amount: 0,
      due_amount: 0
    };

    const { error: bookingError } = await supabase
      .from("bookings")
      .insert([bookingData]);

    if (bookingError) {
      toast.error("Failed to create hold booking");
      return;
    }

    toast.success("Hold booking created successfully");
    navigate("/bookings/hold-list");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Create Hold Booking" />
      <main className="p-4 flex justify-center">
        <Card className="w-full max-w-xl" style={{ backgroundColor: '#F5E6E0' }}>
          <CardContent className="p-6">
            <div className="flex justify-end mb-2">
              <span className="text-red-500 text-xs">* - Required fields</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Type */}
              <div className="flex items-center gap-2">
                <Label className="w-40 text-right text-xs shrink-0">Type :</Label>
                <RadioGroup
                  value={formData.booking_type}
                  onValueChange={(value) => setFormData({ ...formData, booking_type: value })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="agent" id="agent" className="h-4 w-4" />
                    <Label htmlFor="agent" className="text-xs">Agent</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="direct" id="direct" className="h-4 w-4" />
                    <Label htmlFor="direct" className="text-xs">Direct from customer</Label>
                  </div>
                </RadioGroup>
                <span className="text-red-500">*</span>
              </div>

              {/* Agent */}
              <div className="flex items-center gap-2">
                <Label className="w-40 text-right text-xs shrink-0">Agent :</Label>
                <Select
                  value={formData.agent_id}
                  onValueChange={(value) => setFormData({ ...formData, agent_id: value })}
                  disabled={formData.booking_type !== "agent"}
                >
                  <SelectTrigger className="bg-white flex-1 h-7 text-xs">
                    <SelectValue placeholder="-----Select-----" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id} className="text-xs">
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-red-500">*</span>
              </div>

              {/* Reference */}
              <div className="flex items-center gap-2">
                <Label className="w-40 text-right text-xs shrink-0">Reference :</Label>
                <Input
                  className="bg-white flex-1 h-7 text-xs"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>

              {/* Reference Email */}
              <div className="flex items-center gap-2">
                <Label className="w-40 text-right text-xs shrink-0">Reference Email :</Label>
                <Input
                  type="email"
                  className="bg-white flex-1 h-7 text-xs"
                  value={formData.reference_email}
                  onChange={(e) => setFormData({ ...formData, reference_email: e.target.value })}
                />
              </div>

              {/* Customer Name */}
              <div className="flex items-center gap-2">
                <Label className="w-40 text-right text-xs shrink-0">Customer Name :</Label>
                <Input
                  className="bg-white flex-1 h-7 text-xs"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>

              {/* Address */}
              <div className="flex items-start gap-2">
                <Label className="w-40 text-right text-xs shrink-0 pt-1">Address :</Label>
                <Textarea
                  className="bg-white flex-1 text-xs min-h-[60px]"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Contact No */}
              <div className="flex items-center gap-2">
                <Label className="w-40 text-right text-xs shrink-0">Contact No. :</Label>
                <Input
                  className="bg-white flex-1 h-7 text-xs"
                  value={formData.contact_no}
                  onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="flex items-center gap-2">
                <Label className="w-40 text-right text-xs shrink-0">Email :</Label>
                <Input
                  type="email"
                  className="bg-white flex-1 h-7 text-xs"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* No of People */}
              <div className="flex items-center gap-2">
                <Label className="w-40 text-right text-xs shrink-0">No of People :</Label>
                <Input
                  type="number"
                  min="1"
                  className="bg-white w-16 h-7 text-xs"
                  value={formData.adults}
                  onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 1 })}
                />
                <span className="text-xs">Adult</span>
                <Input
                  type="number"
                  min="0"
                  className="bg-white w-16 h-7 text-xs"
                  value={formData.children}
                  onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                />
                <span className="text-xs">Children</span>
              </div>

              {/* Note */}
              <div className="flex items-start gap-2">
                <Label className="w-40 text-right text-xs shrink-0 pt-1">Note :</Label>
                <Textarea
                  className="bg-white flex-1 text-xs min-h-[60px]"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Toggle Options with Yes/No Radio Buttons */}
              {/* Booking */}
              {canSeeBookingSection && (
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-right text-xs shrink-0">Booking :</Label>
                  <RadioGroup
                    value={formData.include_booking ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_booking: value === "yes" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="booking-yes" className="h-4 w-4" />
                      <Label htmlFor="booking-yes" className="text-xs">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="booking-no" className="h-4 w-4" />
                      <Label htmlFor="booking-no" className="text-xs">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Delhi - Manali */}
              {canSeeDelhiManaliSection && (
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-right text-xs shrink-0">DELHI - MANALI :</Label>
                  <RadioGroup
                    value={formData.include_delhi_manali ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_delhi_manali: value === "yes" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="dm-yes" className="h-4 w-4" />
                      <Label htmlFor="dm-yes" className="text-xs">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="dm-no" className="h-4 w-4" />
                      <Label htmlFor="dm-no" className="text-xs">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Manali - Delhi */}
              {canSeeManaliDelhiSection && (
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-right text-xs shrink-0">MANALI - DELHI :</Label>
                  <RadioGroup
                    value={formData.include_manali_delhi ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_manali_delhi: value === "yes" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="md-yes" className="h-4 w-4" />
                      <Label htmlFor="md-yes" className="text-xs">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="md-no" className="h-4 w-4" />
                      <Label htmlFor="md-no" className="text-xs">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Safari */}
              {canSeeSafariSection && (
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-right text-xs shrink-0">Safari :</Label>
                  <RadioGroup
                    value={formData.include_safari ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_safari: value === "yes" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="safari-yes" className="h-4 w-4" />
                      <Label htmlFor="safari-yes" className="text-xs">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="safari-no" className="h-4 w-4" />
                      <Label htmlFor="safari-no" className="text-xs">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Another Hotel */}
              {canSeeAnotherHotelSection && (
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-right text-xs shrink-0">Another Hotel :</Label>
                  <RadioGroup
                    value={formData.include_another_hotel ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_another_hotel: value === "yes" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="hotel-yes" className="h-4 w-4" />
                      <Label htmlFor="hotel-yes" className="text-xs">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="hotel-no" className="h-4 w-4" />
                      <Label htmlFor="hotel-no" className="text-xs">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Additional Vehicle */}
              {canSeeVehicleSection && (
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-right text-xs shrink-0">Additional Vehicle :</Label>
                  <RadioGroup
                    value={formData.include_additional_vehicle ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_additional_vehicle: value === "yes" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="vehicle-yes" className="h-4 w-4" />
                      <Label htmlFor="vehicle-yes" className="text-xs">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="vehicle-no" className="h-4 w-4" />
                      <Label htmlFor="vehicle-no" className="text-xs">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Group Expenses */}
              {canSeeGroupExpensesSection && (
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-right text-xs shrink-0">Group Expences :</Label>
                  <RadioGroup
                    value={formData.include_group_expenses ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, include_group_expenses: value === "yes" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="yes" id="expenses-yes" className="h-4 w-4" />
                      <Label htmlFor="expenses-yes" className="text-xs">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="no" id="expenses-no" className="h-4 w-4" />
                      <Label htmlFor="expenses-no" className="text-xs">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Agent Commission */}
              <div className="flex items-center gap-2">
                <Label className="w-40 text-right text-xs shrink-0">Agent Commission :</Label>
                <Input
                  type="number"
                  className="bg-white flex-1 h-7 text-xs"
                  value={formData.agent_commission}
                  onChange={(e) => setFormData({ ...formData, agent_commission: e.target.value })}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-center gap-4 pt-4">
                <Button 
                  type="submit" 
                  variant="outline" 
                  size="sm" 
                  className="bg-gray-100 border-gray-400 hover:bg-gray-200 text-gray-700 px-6"
                >
                  Create
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  className="bg-gray-100 border-gray-400 hover:bg-gray-200 text-gray-700 px-6"
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
