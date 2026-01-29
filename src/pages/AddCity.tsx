import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export default function AddCity() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    country: "India",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("cities").insert([formData]);

    if (error) {
      toast.error("Error adding city");
    } else {
      toast.success("City added successfully");
      navigate("/cities");
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
    <div className="min-h-screen bg-background">
      <Header title="Add City" />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-4" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">Add City</span>
          <span className="text-white/80 text-xs">* - Required fields</span>
        </div>

        {/* Form Card */}
        <Card style={{ backgroundColor: "#F5E6E0" }}>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">City Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-center gap-4 pt-4">
                <Button type="submit" className="px-8">Add</Button>
                <Button type="button" variant="outline" onClick={handleReset} className="px-8">Reset</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
