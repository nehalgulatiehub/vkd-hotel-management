import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export default function AddTransporter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  
  const [cities, setCities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    city_id: "",
    vehicle_types: [] as string[],
    notes: "",
  });

  useEffect(() => {
    fetchCities();
    if (editId) {
      fetchTransporterData(editId);
    }
  }, [editId]);

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("*").order("name");
    setCities(data || []);
  };

  const fetchTransporterData = async (id: string) => {
    const { data, error } = await supabase.from("transporters").select("*").eq("id", id).single();
    if (data && !error) {
      setFormData({
        name: data.name || "",
        company_name: data.company_name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        state: data.state || "",
        city_id: data.city_id || "",
        vehicle_types: data.vehicle_types || [],
        notes: data.notes || "",
      });
    } else {
      toast.error("Failed to load transporter data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && editId) {
      const { error } = await supabase.from("transporters").update(formData).eq("id", editId);
      if (error) {
        toast.error("Error updating transporter");
      } else {
        toast.success("Transporter updated successfully");
        navigate("/transporters");
      }
    } else {
      const { error } = await supabase.from("transporters").insert([formData]);
      if (error) {
        toast.error("Error adding transporter");
      } else {
        toast.success("Transporter added successfully");
        navigate("/transporters");
      }
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      address: "",
      state: "",
      city_id: "",
      vehicle_types: [],
      notes: "",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title={isEditMode ? "Edit Transporter" : "Add Transporter"} />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-4" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">{isEditMode ? "Edit Transporter" : "Add Transporter"}</span>
          <span className="text-white/80 text-xs">* - Required fields</span>
        </div>

        {/* Form Card */}
        <Card style={{ backgroundColor: "#F5E6E0" }}>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Transporter Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email-Id</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Contact No <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Select value={formData.city_id} onValueChange={(value) => setFormData({ ...formData, city_id: value })}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="--Select City--" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Enter state"
                    className="bg-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-white"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-white"
                  rows={2}
                />
              </div>
              <div className="flex justify-center gap-4 pt-4">
                <Button type="submit" className="px-8">{isEditMode ? "Update" : "Add"}</Button>
                <Button type="button" variant="outline" onClick={handleReset} className="px-8">Reset</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
