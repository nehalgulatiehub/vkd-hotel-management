import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
      const { data, error } = await supabase.from("own_hotels").select("id, name").eq("id", hotelId).single();
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
      const { data, error } = await supabase.from("rooms").select("id, room_number, total_quantity, adult_capacity, child_capacity, description, notes").eq("hotel_id", hotelId).order("room_number");
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
    setSelectedIds(checked ? rooms.map(r => r.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter(sid => sid !== id));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) { toast.error("Please select at least one room to delete"); return; }
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} room(s)?`)) return;
    try {
      const { error } = await supabase.from("rooms").delete().in("id", selectedIds);
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
    setFormData({ room_name: "", total_quantity: "1", adult_capacity: "2", child_capacity: "1", description: "", notes: "" });
    setEditingRoom(null);
  };

  const handleEdit = async (room: Room) => {
    const { data, error } = await supabase.from("rooms").select("*").eq("id", room.id).single();
    if (error) { toast.error("Failed to load room details"); return; }
    setFormData({
      room_name: data.room_number || "", total_quantity: String(data.total_quantity || 1),
      adult_capacity: String(data.adult_capacity || 2), child_capacity: String(data.child_capacity || 1),
      description: data.description || "", notes: data.notes || ""
    });
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleAddRoom = () => { resetForm(); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const roomData = {
      hotel_id: hotelId, room_number: formData.room_name, room_type: formData.room_name,
      total_quantity: parseInt(formData.total_quantity),
      capacity: parseInt(formData.adult_capacity) + parseInt(formData.child_capacity),
      adult_capacity: parseInt(formData.adult_capacity), child_capacity: parseInt(formData.child_capacity),
      description: formData.description, notes: formData.notes
    };
    try {
      if (editingRoom) {
        const { error } = await supabase.from("rooms").update(roomData).eq("id", editingRoom.id);
        if (error) throw error;
        toast.success("Room updated successfully");
      } else {
        const { error } = await supabase.from("rooms").insert([roomData]);
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

  if (authLoading || loading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Access Denied</div>;

  return (
    <div style={{ padding: 12, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
      <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, color: "#333" }}>📋 Manage Rooms {hotel ? `- ${hotel.name}` : ""}</div>
      
      {/* Maroon header bar */}
      <div style={{ backgroundColor: "#b44a50", color: "#fff", padding: "4px 10px", fontSize: 11, fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Manage Rooms</span>
        <div style={{ display: "flex", gap: 6 }}>
          <span onClick={() => navigate("/admin/manage-hotels")} style={{ color: "#fff", cursor: "pointer", textDecoration: "underline", fontSize: 11 }}>Manage Hotel</span>
          <span onClick={handleAddRoom} style={{ color: "#fff", cursor: "pointer", textDecoration: "underline", fontSize: 11 }}>Add Rooms</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #ccc", borderTop: "none", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
          <thead>
            <tr style={{ backgroundColor: "#c47a7e", color: "#fff", fontWeight: "bold" }}>
              <th style={{ border: "1px solid #a88", padding: "5px 8px", textAlign: "left", fontWeight: "bold", fontSize: 11, color: "#fff" }}>Room Type</th>
              <th style={{ border: "1px solid #a88", padding: "5px 8px", textAlign: "left", fontWeight: "bold", fontSize: 11, color: "#fff", width: 150 }}>No of Room</th>
              <th style={{ border: "1px solid #a88", padding: "5px 8px", textAlign: "center", fontWeight: "bold", fontSize: 11, color: "#fff", width: 150 }}>Action</th>
              <th style={{ border: "1px solid #a88", padding: "5px 8px", textAlign: "center", fontWeight: "bold", fontSize: 11, color: "#fff", width: 40 }}>
                <input type="checkbox" checked={selectedIds.length === rooms.length && rooms.length > 0} onChange={(e) => handleSelectAll(e.target.checked)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, index) => (
              <tr key={room.id} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f6f0f0" }}>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", fontSize: 11, color: "#606060" }}>{room.room_number}</td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", fontSize: 11, color: "#606060" }}>{room.total_quantity}</td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", fontSize: 11, textAlign: "center" }}>
                  <span onClick={() => handleEdit(room)} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Edit</span>
                </td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "center" }}>
                  <input type="checkbox" checked={selectedIds.includes(room.id)} onChange={(e) => handleSelectOne(room.id, e.target.checked)} />
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr><td colSpan={4} style={{ border: "1px solid #ddd", padding: "20px 8px", textAlign: "center", color: "#999", fontSize: 11 }}>No rooms found. Click "Add Rooms" to create your first room.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={handleDeleteSelected} disabled={selectedIds.length === 0} style={{ border: "1px solid #888", padding: "2px 12px", fontSize: 11, backgroundColor: "#f5f5f5", cursor: selectedIds.length === 0 ? "not-allowed" : "pointer", opacity: selectedIds.length === 0 ? 0.5 : 1 }}>Delete</button>
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
              <Input required placeholder="e.g., Presidential Suite, Deluxe Room" value={formData.room_name} onChange={(e) => setFormData({ ...formData, room_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Total Quantity <span className="text-destructive">*</span></Label>
                <Input type="number" min="1" required value={formData.total_quantity} onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Adult Capacity</Label>
                <Input type="number" min="1" value={formData.adult_capacity} onChange={(e) => setFormData({ ...formData, adult_capacity: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Child Capacity</Label>
                <Input type="number" min="0" value={formData.child_capacity} onChange={(e) => setFormData({ ...formData, child_capacity: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">{editingRoom ? "Update Room" : "Add Room"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}