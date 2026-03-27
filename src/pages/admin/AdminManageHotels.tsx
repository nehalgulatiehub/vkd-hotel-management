import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { AdminHeader } from "@/components/layout/AdminHeader";

interface OwnHotel {
  id: string;
  name: string;
}

export default function AdminManageHotels() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [hotels, setHotels] = useState<OwnHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchHotels();
    }
  }, [authLoading, canManage]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("own_hotels")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      toast.error("Failed to fetch hotels");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(hotels.map(h => h.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one hotel to delete");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} hotel(s)?`)) return;

    try {
      const { error } = await supabase
        .from("own_hotels")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`${selectedIds.length} hotel(s) deleted successfully`);
      setSelectedIds([]);
      fetchHotels();
    } catch (error) {
      console.error("Error deleting hotels:", error);
      toast.error("Failed to delete hotels");
    }
  };

  if (authLoading || loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (!canManage) {
    return <div className="p-6 text-center text-muted-foreground">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-[#f6f0f0]">
      {/* Blue Header Bar */}
      <div className="bg-[#b44a50] text-white px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">Manage Hotel</span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 bg-white text-black hover:bg-gray-100 text-xs"
            onClick={() => navigate("/admin/own-hotels")}
          >
            Back to Hotels
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 bg-white text-black hover:bg-gray-100 text-xs"
            onClick={() => navigate("/admin/own-hotels/add")}
          >
            Add Hotel
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Table */}
        <div className="border border-gray-300 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#c47a7e] text-white">
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Hotel↓↑</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-medium w-[200px]">Action</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-medium w-[50px]">
                  <Checkbox
                    checked={selectedIds.length === hotels.length && hotels.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((hotel, index) => (
                <tr key={hotel.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f6f0f0]"}>
                  <td className="border border-gray-300 px-3 py-2">{hotel.name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                        onClick={() => navigate(`/admin/own-hotels/add?edit=${hotel.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                        onClick={() => navigate(`/admin/hotels/${hotel.id}/rooms`)}
                      >
                        Manage Rooms
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                        onClick={() => toast.info("Package management coming soon")}
                      >
                        Manage Package
                      </button>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <Checkbox
                      checked={selectedIds.includes(hotel.id)}
                      onCheckedChange={(checked) => handleSelectOne(hotel.id, !!checked)}
                    />
                  </td>
                </tr>
              ))}
              {hotels.length === 0 && (
                <tr>
                  <td colSpan={3} className="border border-gray-300 px-3 py-8 text-center text-muted-foreground">
                    No hotels found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Button */}
        <div className="flex justify-end mt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
