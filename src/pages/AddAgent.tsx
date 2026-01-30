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

export default function AddAgent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  
  const [cities, setCities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city_id: "",
    commission_rate: 0,
    notes: "", // Used for Contact Person with Contact Details
  });

  useEffect(() => {
    fetchCities();
    if (editId) {
      fetchAgentData(editId);
    }
  }, [editId]);

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("*").order("name");
    setCities(data || []);
  };

  const fetchAgentData = async (id: string) => {
    const { data, error } = await supabase.from("agents").select("*").eq("id", id).single();
    if (data && !error) {
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city_id: data.city_id || "",
        commission_rate: data.commission_rate || 0,
        notes: data.notes || "",
      });
    } else {
      toast.error("Failed to load agent data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && editId) {
      const { error } = await supabase.from("agents").update(formData).eq("id", editId);
      if (error) {
        toast.error("Error updating agent");
      } else {
        toast.success("Agent updated successfully");
        navigate("/agents");
      }
    } else {
      const { error } = await supabase.from("agents").insert([formData]);
      if (error) {
        toast.error("Error adding agent");
      } else {
        toast.success("Agent added successfully");
        navigate("/agents");
      }
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city_id: "",
      commission_rate: 0,
      notes: "",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title={isEditMode ? "Edit Agent" : "Add Agent"} />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-0 rounded-t" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">{isEditMode ? "Edit Agent" : "Add Agent"}</span>
        </div>

        {/* Form Card */}
        <Card className="rounded-t-none border-t-0" style={{ backgroundColor: "#F5E6E0" }}>
          <CardContent className="pt-4">
            {/* Required fields note */}
            <div className="text-right text-red-500 text-xs mb-4">* - Required fields</div>
            
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
              {/* Agent Name */}
              <div className="flex items-center gap-2">
                <Label htmlFor="name" className="w-56 text-right text-xs whitespace-nowrap">Agent Name :</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-white flex-1"
                />
                <span className="text-red-500">*</span>
              </div>

              {/* Email(s) */}
              <div className="flex items-start gap-2">
                <Label htmlFor="email" className="w-56 text-right text-xs whitespace-nowrap pt-2">Email(s) :</Label>
                <div className="flex-1">
                  <Textarea
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white"
                    rows={3}
                  />
                  <span className="text-xs text-muted-foreground">(Please enter every email in new line)</span>
                </div>
              </div>

              {/* Commission */}
              <div className="flex items-center gap-2">
                <Label htmlFor="commission_rate" className="w-56 text-right text-xs whitespace-nowrap">Commission :</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.01"
                  value={formData.commission_rate || ""}
                  onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                  className="bg-white flex-1"
                />
                <span className="text-xs">%</span>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2">
                <Label htmlFor="address" className="w-56 text-right text-xs whitespace-nowrap pt-2">Address :</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-white flex-1"
                  rows={3}
                />
              </div>

              {/* City */}
              <div className="flex items-center gap-2">
                <Label htmlFor="city" className="w-56 text-right text-xs whitespace-nowrap">City :</Label>
                <Select value={formData.city_id} onValueChange={(value) => setFormData({ ...formData, city_id: value })}>
                  <SelectTrigger className="bg-white flex-1">
                    <SelectValue placeholder="-City-" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Person with Contact Details */}
              <div className="flex items-start gap-2">
                <Label htmlFor="notes" className="w-56 text-right text-xs whitespace-nowrap pt-2">Contact Person with Contact Details :</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-white flex-1"
                  rows={3}
                />
              </div>

              {/* Contact No */}
              <div className="flex items-center gap-2">
                <Label htmlFor="phone" className="w-56 text-right text-xs whitespace-nowrap">Contact No. :</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white flex-1"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-center gap-2 pt-4">
                <Button type="submit" variant="outline" className="px-6 bg-gray-100 border-gray-400 text-black hover:bg-gray-200">
                  {isEditMode ? "Update" : "Add"}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} className="px-6 bg-gray-100 border-gray-400 text-black hover:bg-gray-200">
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
