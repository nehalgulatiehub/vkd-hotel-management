import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Room {
  id: string;
  room_number: string;
  total_quantity: number;
}

interface Hotel {
  id: string;
  name: string;
}

export default function AdminManageRooms() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Form dialog state
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    room_name: "",
    total_quantity: "1",
    adult_capacity: "2",
    child_capacity: "1",
    description: "",
    notes: ""
  });

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage && hotelId) {
      fetchHotel();
      fetchRooms();
    }
  }, [authLoading, canManage, hotelId]);

  const fetchHotel = async () => {
    try {
      const { data, error } = await supabase
        .from("own_hotels")
        .select("id, name")
        .eq("id", hotelId)
        .single();

      if (error) throw error;
      setHotel(data);
    } catch (error) {
      console.error("Error fetching hotel:", error);
      toast.error("Failed to fetch hotel");
    }
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, room_number, total_quantity, adult_capacity, child_capacity, description, notes")
        .eq("hotel_id", hotelId)
        .order("room_number");

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(rooms.map(r => r.id));
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
      toast.error("Please select at least one room to delete");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} room(s)?`)) return;

    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`${selectedIds.length} room(s) deleted successfully`);
      setSelectedIds([]);
      fetchRooms();
    } catch (error) {
      console.error("Error deleting rooms:", error);
      toast.error("Failed to delete rooms");
    }
  };

  const resetForm = () => {
    setFormData({
      room_name: "",
      total_quantity: "1",
      adult_capacity: "2",
      child_capacity: "1",
      description: "",
      notes: ""
    });
    setEditingRoom(null);
  };

  const handleEdit = async (room: Room) => {
    // Fetch full room data
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", room.id)
      .single();

    if (error) {
      toast.error("Failed to load room details");
      return;
    }

    setFormData({
      room_name: data.room_number || "",
      total_quantity: String(data.total_quantity || 1),
      adult_capacity: String(data.adult_capacity || 2),
      child_capacity: String(data.child_capacity || 1),
      description: data.description || "",
      notes: data.notes || ""
    });
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleAddRoom = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const roomData = {
      hotel_id: hotelId,
      room_number: formData.room_name,
      room_type: formData.room_name,
      total_quantity: parseInt(formData.total_quantity),
      capacity: parseInt(formData.adult_capacity) + parseInt(formData.child_capacity),
      adult_capacity: parseInt(formData.adult_capacity),
      child_capacity: parseInt(formData.child_capacity),
      description: formData.description,
      notes: formData.notes
    };

    try {
      if (editingRoom) {
        const { error } = await supabase
          .from("rooms")
          .update(roomData)
          .eq("id", editingRoom.id);

        if (error) throw error;
        toast.success("Room updated successfully");
      } else {
        const { error } = await supabase
          .from("rooms")
          .insert([roomData]);

        if (error) throw error;
        toast.success("Room created successfully");
      }
      setShowForm(false);
      resetForm();
      fetchRooms();
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error("Failed to save room");
    }
  };

  if (authLoading || loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (!canManage) {
    return <div className="p-6 text-center text-muted-foreground">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5E6E0]">
      {/* Blue Header Bar */}
      <div className="bg-[#1e6e99] text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">📋 Manage Rooms {hotel ? `- ${hotel.name}` : ""}</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 bg-white text-black hover:bg-gray-100 text-xs"
            onClick={() => navigate("/admin/manage-hotels")}
          >
            Manage Hotel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 bg-white text-black hover:bg-gray-100 text-xs"
            onClick={handleAddRoom}
          >
            Add Rooms
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Table */}
        <div className="border border-gray-300 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#D4A59A] text-white">
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Room Type↓↑</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium w-[150px]">No of Room↓↑</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-medium w-[150px]">Action</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-medium w-[50px]">
                  <Checkbox
                    checked={selectedIds.length === rooms.length && rooms.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, index) => (
                <tr key={room.id} className={index % 2 === 0 ? "bg-white" : "bg-[#F5E6E0]"}>
                  <td className="border border-gray-300 px-3 py-2">{room.room_number}</td>
                  <td className="border border-gray-300 px-3 py-2">{room.total_quantity}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                      onClick={() => handleEdit(room)}
                    >
                      Edit
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <Checkbox
                      checked={selectedIds.includes(room.id)}
                      onCheckedChange={(checked) => handleSelectOne(room.id, !!checked)}
                    />
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={4} className="border border-gray-300 px-3 py-8 text-center text-muted-foreground">
                    No rooms found. Click "Add Rooms" to create your first room.
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

      {/* Add/Edit Room Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add Room"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Room Name / Type <span className="text-destructive">*</span></Label>
              <Input
                required
                placeholder="e.g., Presidential Suite, Deluxe Room"
                value={formData.room_name}
                onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Total Quantity <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={formData.total_quantity}
                  onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Adult Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.adult_capacity}
                  onChange={(e) => setFormData({ ...formData, adult_capacity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Child Capacity</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.child_capacity}
                  onChange={(e) => setFormData({ ...formData, child_capacity: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRoom ? "Update Room" : "Add Room"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
