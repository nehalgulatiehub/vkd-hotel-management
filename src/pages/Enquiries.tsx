import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Enquiries() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEnquiryId, setEditingEnquiryId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    agent_id: "",
    guest_id: "",
    destination_city_id: "",
    check_in_date: "",
    check_out_date: "",
    adults: 1,
    children: 0,
    rooms_required: 1,
    budget_amount: "",
    special_requests: "",
    notes: "",
    status: "pending"
  });

  useEffect(() => {
    fetchEnquiries();
    fetchAgents();
    fetchGuests();
    fetchCities();
  }, []);

  const fetchEnquiries = async () => {
    const { data, error } = await supabase
      .from("enquiries")
      .select("*, agents(name), guests(first_name, last_name), cities(name)")
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

  const fetchGuests = async () => {
    const { data } = await supabase
      .from("guests")
      .select("*")
      .order("first_name");
    setGuests(data || []);
  };

  const fetchCities = async () => {
    const { data } = await supabase
      .from("cities")
      .select("*")
      .order("name");
    setCities(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const enquiryData = {
      enquiry_number: `ENQ${Date.now().toString().slice(-8)}`,
      agent_id: formData.agent_id || null,
      guest_id: formData.guest_id || null,
      destination_city_id: formData.destination_city_id || null,
      check_in_date: formData.check_in_date || null,
      check_out_date: formData.check_out_date || null,
      adults: formData.adults,
      children: formData.children,
      rooms_required: formData.rooms_required,
      budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
      special_requests: formData.special_requests,
      notes: formData.notes,
      status: formData.status
    };

    if (editingEnquiryId) {
      const { error } = await supabase
        .from("enquiries")
        .update(enquiryData)
        .eq("id", editingEnquiryId);

      if (error) {
        toast.error("Failed to update enquiry");
      } else {
        toast.success("Enquiry updated successfully");
        resetForm();
        fetchEnquiries();
      }
    } else {
      const { error } = await supabase
        .from("enquiries")
        .insert([enquiryData]);

      if (error) {
        toast.error("Failed to create enquiry");
      } else {
        toast.success("Enquiry created successfully");
        resetForm();
        fetchEnquiries();
      }
    }
  };

  const handleConvertToBooking = async (enquiry: any) => {
    if (!confirm("Convert this enquiry to a confirmed booking?")) return;

    const bookingData = {
      booking_number: `BK${Date.now().toString().slice(-8)}`,
      enquiry_id: enquiry.id,
      agent_id: enquiry.agent_id,
      guest_id: enquiry.guest_id,
      check_in_date: enquiry.check_in_date,
      check_out_date: enquiry.check_out_date,
      adults: enquiry.adults,
      children: enquiry.children,
      notes: enquiry.notes,
      special_requests: enquiry.special_requests,
      status: "confirmed" as const,
      payment_status: "pending" as const,
      total_amount: enquiry.budget_amount || 0,
      paid_amount: 0,
      due_amount: enquiry.budget_amount || 0,
      booking_type: enquiry.agent_id ? "agent" : "direct"
    };

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([bookingData])
      .select()
      .single();

    if (bookingError) {
      toast.error("Failed to create booking");
      return;
    }

    // Update enquiry status
    const { error: updateError } = await supabase
      .from("enquiries")
      .update({ status: "converted" })
      .eq("id", enquiry.id);

    if (updateError) {
      toast.error("Failed to update enquiry status");
      return;
    }

    toast.success("Enquiry converted to booking successfully");
    fetchEnquiries();
    navigate(`/bookings/${booking.id}`);
  };

  const resetForm = () => {
    setFormData({
      agent_id: "",
      guest_id: "",
      destination_city_id: "",
      check_in_date: "",
      check_out_date: "",
      adults: 1,
      children: 0,
      rooms_required: 1,
      budget_amount: "",
      special_requests: "",
      notes: "",
      status: "pending"
    });
    setShowForm(false);
    setEditingEnquiryId(null);
  };

  const filteredEnquiries = enquiries.filter(enquiry =>
    enquiry.enquiry_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enquiry.agents?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enquiry.guests?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-500",
      confirmed: "bg-green-500",
      cancelled: "bg-red-500",
      converted: "bg-blue-500"
    };
    return <Badge className={statusColors[status] || "bg-gray-500"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Enquiry Management" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {showForm ? (editingEnquiryId ? "Edit Enquiry" : "Generate Enquiry") : "View Enquiries"}
          </h2>
          <div className="flex gap-2">
            {!showForm && (
              <Button 
                className="bg-gradient-primary"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Enquiry
              </Button>
            )}
            {showForm && (
              <Button variant="outline" onClick={resetForm}>
                Back to List
              </Button>
            )}
          </div>
        </div>

        {!showForm ? (
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by enquiry number, agent, or guest..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Enquiry No</th>
                      <th className="text-left p-4 font-semibold">Agent/Guest</th>
                      <th className="text-left p-4 font-semibold">Destination</th>
                      <th className="text-left p-4 font-semibold">Check-in</th>
                      <th className="text-left p-4 font-semibold">Check-out</th>
                      <th className="text-left p-4 font-semibold">Guests</th>
                      <th className="text-left p-4 font-semibold">Budget</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnquiries.map((enquiry) => (
                      <tr key={enquiry.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">{enquiry.enquiry_number}</td>
                        <td className="p-4">
                          {enquiry.agents?.name || 
                           `${enquiry.guests?.first_name} ${enquiry.guests?.last_name}` ||
                           "Direct"}
                        </td>
                        <td className="p-4">{enquiry.cities?.name || "-"}</td>
                        <td className="p-4">{enquiry.check_in_date ? new Date(enquiry.check_in_date).toLocaleDateString() : "-"}</td>
                        <td className="p-4">{enquiry.check_out_date ? new Date(enquiry.check_out_date).toLocaleDateString() : "-"}</td>
                        <td className="p-4">{enquiry.adults + enquiry.children}</td>
                        <td className="p-4">₹{enquiry.budget_amount?.toLocaleString() || "-"}</td>
                        <td className="p-4">{getStatusBadge(enquiry.status)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {enquiry.status === "pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleConvertToBooking(enquiry)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Convert
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingEnquiryId(enquiry.id);
                                setFormData({
                                  agent_id: enquiry.agent_id || "",
                                  guest_id: enquiry.guest_id || "",
                                  destination_city_id: enquiry.destination_city_id || "",
                                  check_in_date: enquiry.check_in_date || "",
                                  check_out_date: enquiry.check_out_date || "",
                                  adults: enquiry.adults,
                                  children: enquiry.children,
                                  rooms_required: enquiry.rooms_required,
                                  budget_amount: enquiry.budget_amount?.toString() || "",
                                  special_requests: enquiry.special_requests || "",
                                  notes: enquiry.notes || "",
                                  status: enquiry.status
                                });
                                setShowForm(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEnquiries.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No enquiries found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <Label>Guest</Label>
                    <Select
                      value={formData.guest_id}
                      onValueChange={(value) => setFormData({ ...formData, guest_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select guest" />
                      </SelectTrigger>
                      <SelectContent>
                        {guests.map((guest) => (
                          <SelectItem key={guest.id} value={guest.id}>
                            {guest.first_name} {guest.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Destination City</Label>
                    <Select
                      value={formData.destination_city_id}
                      onValueChange={(value) => setFormData({ ...formData, destination_city_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Budget Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter budget"
                      value={formData.budget_amount}
                      onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Check-in Date</Label>
                    <Input
                      type="date"
                      value={formData.check_in_date}
                      onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Check-out Date</Label>
                    <Input
                      type="date"
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
                    <Label>Rooms Required</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.rooms_required}
                      onChange={(e) => setFormData({ ...formData, rooms_required: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Special Requests</Label>
                  <Textarea
                    placeholder="Any special requests..."
                    value={formData.special_requests}
                    onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    {editingEnquiryId ? "Update Enquiry" : "Create Enquiry"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </main>
    </div>
  );
}
