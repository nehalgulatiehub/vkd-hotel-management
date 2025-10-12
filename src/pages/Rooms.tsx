import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Room {
  id: string;
  room_number: string;
  floor: number;
  status: string;
  current_price: number;
  room_types: {
    name: string;
  } | null;
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, room_types(name)')
        .order('room_number');

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-success text-success-foreground",
      occupied: "bg-primary text-primary-foreground",
      maintenance: "bg-warning text-warning-foreground",
      reserved: "bg-accent text-accent-foreground",
      cleaning: "bg-muted text-muted-foreground",
    };
    return colors[status] || "bg-muted";
  };

  return (
    <div className="min-h-screen">
      <Header title="Rooms" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Room Inventory</h2>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading rooms...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => (
              <Card key={room.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
                    <Badge className={getStatusColor(room.status)}>
                      {room.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      Type: <span className="font-medium text-foreground">
                        {room.room_types?.name || 'N/A'}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Floor: <span className="font-medium text-foreground">{room.floor}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Price: <span className="font-medium text-foreground">
                        ${room.current_price?.toFixed(2) || '0.00'}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No rooms found. Add your first room to get started.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
