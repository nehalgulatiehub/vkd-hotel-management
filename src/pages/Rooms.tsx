import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";

export default function Rooms() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    room_name: "",
    total_quantity: "1",
    adult_capacity: "2",
    child_capacity: "1",
    description: "",
    notes: ""
  });

  useEffect(() => {
    if (hotelId) {
      fetchHotel();
      fetchRooms();
    }
  }, [hotelId]);

  const fetchHotel = async () => {
    const { data, error } = await supabase
      .from("own_hotels")
      .select("*, cities(name, state)")
      .eq("id", hotelId)
      .single();
    
    if (error) {
      toast.error("Failed to load hotel");
    } else {
      setHotel(data);
    }
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("hotel_id", hotelId)
      .order("room_number");
    
    if (error) {
      toast.error("Failed to load rooms");
    } else {
      setRooms(data || []);
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

  const handleEdit = (room: any) => {
    setFormData({
      room_name: room.room_number || "",
      total_quantity: String(room.total_quantity || 1),
      adult_capacity: String(room.adult_capacity || 2),
      child_capacity: String(room.child_capacity || 1),
      description: room.description || "",
      notes: room.notes || ""
    });
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", roomId);

    if (error) {
      toast.error("Failed to delete room");
    } else {
      toast.success("Room deleted successfully");
      fetchRooms();
    }
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

    if (editingRoom) {
      const { error } = await supabase
        .from("rooms")
        .update(roomData)
        .eq("id", editingRoom.id);

      if (error) {
        toast.error("Failed to update room");
        console.error(error);
      } else {
        toast.success("Room updated successfully");
        setShowForm(false);
        resetForm();
        fetchRooms();
      }
    } else {
      const { error } = await supabase
        .from("rooms")
        .insert([roomData]);

      if (error) {
        toast.error("Failed to create room");
        console.error(error);
      } else {
        toast.success("Room created successfully");
        setShowForm(false);
        resetForm();
        fetchRooms();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Room Management" />
      <main className="p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/own-hotels")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hotels
          </Button>
          
          {hotel && (
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">{hotel.name}</h2>
              <p className="text-muted-foreground">
                {hotel.cities?.name}, {hotel.cities?.state}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Rooms</h3>
          <Button 
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="bg-gradient-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "View Rooms" : "Add Room"}
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingRoom ? "Edit Room" : "Add New Room"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Room Name <span className="text-destructive">*</span></Label>
                    <Input
                      required
                      placeholder="e.g., Presidential Suite, Deluxe Room"
                      value={formData.room_name}
                      onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total Available Quantity <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g., 10"
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
                    rows={3}
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

                <div className="flex gap-4">
                  <Button type="submit" className="bg-gradient-primary">
                    {editingRoom ? "Update Room" : "Create Room"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No rooms found. Add your first room!
                </CardContent>
              </Card>
            ) : (
              rooms.map((room) => (
                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{room.room_number}</CardTitle>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {room.total_quantity || 1} Rooms
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">👥 Capacity: {room.adult_capacity || 2} Adults + {room.child_capacity || 1} Children</p>
                    {room.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {room.description}
                      </p>
                    )}
                    <div className="pt-2 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleEdit(room)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(room.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}