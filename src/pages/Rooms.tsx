import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";

export default function Rooms() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    room_number: "",
    room_type: "standard",
    floor_number: "",
    capacity: "2",
    adult_capacity: "2",
    child_capacity: "1",
    base_price: "",
    description: "",
    is_available: true,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const roomData = {
      hotel_id: hotelId,
      ...formData,
      floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
      capacity: parseInt(formData.capacity),
      adult_capacity: parseInt(formData.adult_capacity),
      child_capacity: parseInt(formData.child_capacity),
      base_price: parseFloat(formData.base_price)
    };

    const { error } = await supabase
      .from("rooms")
      .insert([roomData]);

    if (error) {
      toast.error("Failed to create room");
      console.error(error);
    } else {
      toast.success("Room created successfully");
      setShowForm(false);
      fetchRooms();
      setFormData({
        room_number: "",
        room_type: "standard",
        floor_number: "",
        capacity: "2",
        adult_capacity: "2",
        child_capacity: "1",
        base_price: "",
        description: "",
        is_available: true,
        notes: ""
      });
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
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "View Rooms" : "Add Room"}
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Add New Room</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Room Number <span className="text-destructive">*</span></Label>
                    <Input
                      required
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Room Type <span className="text-destructive">*</span></Label>
                    <Select
                      value={formData.room_type}
                      onValueChange={(value) => setFormData({ ...formData, room_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="deluxe">Deluxe</SelectItem>
                        <SelectItem value="suite">Suite</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Floor Number</Label>
                    <Input
                      type="number"
                      value={formData.floor_number}
                      onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total Capacity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
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

                  <div className="space-y-2">
                    <Label>Base Price <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
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
                    Create Room
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <div>
                        <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
                        <Badge variant="secondary" className="mt-1 capitalize">
                          {room.room_type}
                        </Badge>
                      </div>
                      <Badge variant={room.is_available ? "default" : "destructive"}>
                        {room.is_available ? "Available" : "Occupied"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {room.floor_number && (
                      <p className="text-sm">🏢 Floor {room.floor_number}</p>
                    )}
                    <p className="text-sm">👥 Capacity: {room.capacity} ({room.adult_capacity}A + {room.child_capacity}C)</p>
                    <p className="text-sm font-semibold text-primary">
                      ₹{room.base_price}/night
                    </p>
                    {room.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {room.description}
                      </p>
                    )}
                    <div className="pt-2">
                      <Button size="sm" variant="outline" className="w-full">
                        Edit
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
