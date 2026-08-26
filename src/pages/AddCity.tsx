import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LegacyFormPanel } from "@/components/legacy/LegacyFormPanel";
import { LegacyFormRow } from "@/components/legacy/LegacyFormRow";

export default function AddCity() {
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
    const cityData = {
      name: formData.name.trim(),
      state: formData.state.trim() || null,
      country: formData.country.trim() || "India",
    };

    if (!cityData.name) {
      toast.error("City name is required");
      return;
    }

    if (isEditMode && editId) {
      const { error } = await supabase.from("cities").update(cityData).eq("id", editId);
      if (error) {
        toast.error(error.code === "23505" ? "This city already exists" : `Unable to update city: ${error.message}`);
      } else {
        toast.success("City updated successfully");
        navigate("/cities");
      }
      return;
    }

    const { error } = await supabase.from("cities").insert([cityData]);

    if (error) {
      toast.error(error.code === "23505" ? "This city already exists" : `Unable to add city: ${error.message}`);
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
      <Header title={isEditMode ? "Edit City" : "Add City"} />
      <main className="p-4">
        <LegacyFormPanel title={isEditMode ? "Edit City" : "Add City"} rightSlot={<span className="text-white/80 text-xs">* - Required fields</span>}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <LegacyFormRow label="City Name" htmlFor="name" required>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={100}
                className="bg-white"
              />
            </LegacyFormRow>
            <LegacyFormRow label="State" htmlFor="state">
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                maxLength={100}
                className="bg-white"
              />
            </LegacyFormRow>
            <LegacyFormRow label="Country" htmlFor="country">
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                maxLength={100}
                className="bg-white"
              />
            </LegacyFormRow>
            <div className="flex justify-center gap-4 pt-4">
              <Button type="submit" className="px-8">{isEditMode ? "Update" : "Add"}</Button>
              <Button type="button" variant="outline" onClick={handleReset} className="px-8">Reset</Button>
            </div>
          </form>
        </LegacyFormPanel>
      </main>
    </div>
  );
}
