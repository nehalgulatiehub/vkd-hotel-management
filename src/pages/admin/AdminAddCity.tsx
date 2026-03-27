import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminAddCity() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    country: "India",
  });

  useEffect(() => {
    if (editId) {
      fetchCityData(editId);
    }
  }, [editId]);

  const fetchCityData = async (id: string) => {
    const { data, error } = await supabase.from("cities").select("*").eq("id", id).single();
    if (data && !error) {
      setFormData({
        name: data.name || "",
        state: data.state || "",
        country: data.country || "India",
      });
    } else {
      toast.error("Failed to load city data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && editId) {
      const { error } = await supabase.from("cities").update(formData).eq("id", editId);
      if (error) {
        toast.error("Error updating city");
      } else {
        toast.success("City updated successfully");
        navigate("/admin/cities");
      }
    } else {
      const { error } = await supabase.from("cities").insert([formData]);
      if (error) {
        toast.error("Error adding city");
      } else {
        toast.success("City added successfully");
        navigate("/admin/cities");
      }
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      state: "",
      country: "India",
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">{isEditMode ? "Edit City" : "Add City"}</h1>
      
      {/* Blue Header Bar */}
      <div className="flex justify-between items-center px-4 py-2 mb-0 rounded-t" style={{ backgroundColor: "#1e6e99" }}>
        <span className="text-white font-semibold text-sm">{isEditMode ? "Edit City" : "Add City"}</span>
      </div>

      {/* Form Card */}
      <Card className="rounded-t-none border-t-0" style={{ backgroundColor: "#f6f0f0" }}>
        <CardContent className="pt-4">
          {/* Required fields note */}
          <div className="text-right text-red-500 text-xs mb-4">* - Required fields</div>
          
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
            {/* City Name */}
            <div className="flex items-center gap-2">
              <Label htmlFor="name" className="w-56 text-right text-xs whitespace-nowrap">City Name :</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white flex-1"
              />
              <span className="text-red-500">*</span>
            </div>

            {/* State */}
            <div className="flex items-center gap-2">
              <Label htmlFor="state" className="w-56 text-right text-xs whitespace-nowrap">State :</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="bg-white flex-1"
              />
            </div>

            {/* Country */}
            <div className="flex items-center gap-2">
              <Label htmlFor="country" className="w-56 text-right text-xs whitespace-nowrap">Country :</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
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
    </div>
  );
}