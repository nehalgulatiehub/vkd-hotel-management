import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Booking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: number;
  reference: string | null;
  adults: number;
  children: number;
  special_requests: string | null;
  guests: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  rooms: {
    room_number: string;
  } | null;
}

export default function Reservations() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newBooking, setNewBooking] = useState({
    guestId: "",
    roomId: "",
    checkInDate: "",
    checkOutDate: "",
    adults: 1,
    children: 0,
    reference: "",
    specialRequests: "",
    totalAmount: 0,
  });

  const [rooms, setRooms] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);

  useEffect(() => {
    fetchBookings();
    fetchRoomsAndGuests();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          guests (first_name, last_name, email),
          rooms (room_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsAndGuests = async () => {
    try {
      const [roomsRes, guestsRes] = await Promise.all([
        supabase.from('rooms').select('*').eq('status', 'available'),
        supabase.from('guests').select('*'),
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (guestsRes.error) throw guestsRes.error;

      setRooms(roomsRes.data || []);
      setGuests(guestsRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch rooms and guests");
    }
  };

  const handleCreateBooking = async () => {
    if (!newBooking.guestId || !newBooking.roomId || !newBooking.checkInDate || !newBooking.checkOutDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const { error } = await supabase.from('bookings').insert({
        guest_id: newBooking.guestId,
        room_id: newBooking.roomId,
        check_in_date: newBooking.checkInDate,
        check_out_date: newBooking.checkOutDate,
        adults: newBooking.adults,
        children: newBooking.children,
        reference: newBooking.reference || null,
        special_requests: newBooking.specialRequests || null,
        total_amount: newBooking.totalAmount,
        status: 'pending',
      });

      if (error) throw error;

      toast.success("Booking created successfully");
      setIsDialogOpen(false);
      fetchBookings();
      
      setNewBooking({
        guestId: "",
        roomId: "",
        checkInDate: "",
        checkOutDate: "",
        adults: 1,
        children: 0,
        reference: "",
        specialRequests: "",
        totalAmount: 0,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create booking");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-warning text-warning-foreground",
      confirmed: "bg-success text-success-foreground",
      checked_in: "bg-primary text-primary-foreground",
      checked_out: "bg-muted text-muted-foreground",
      cancelled: "bg-destructive text-destructive-foreground",
    };
    return colors[status] || "bg-muted";
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.guests?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guests?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen">
      <Header title="Reservations" />
      <main className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold">Booking Management</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Reservation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Reservation</DialogTitle>
                <DialogDescription>Add a new booking to the system</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guest">Guest *</Label>
                    <Select value={newBooking.guestId} onValueChange={(value) => setNewBooking({ ...newBooking, guestId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select guest" />
                      </SelectTrigger>
                      <SelectContent>
                        {guests.map((guest) => (
                          <SelectItem key={guest.id} value={guest.id}>
                            {guest.first_name} {guest.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room">Room *</Label>
                    <Select value={newBooking.roomId} onValueChange={(value) => setNewBooking({ ...newBooking, roomId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.room_number} - ₹{room.current_price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check-in Date *</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={newBooking.checkInDate}
                      onChange={(e) => setNewBooking({ ...newBooking, checkInDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check-out Date *</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={newBooking.checkOutDate}
                      onChange={(e) => setNewBooking({ ...newBooking, checkOutDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adults">Adults</Label>
                    <Input
                      id="adults"
                      type="number"
                      min="1"
                      value={newBooking.adults}
                      onChange={(e) => setNewBooking({ ...newBooking, adults: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="children">Children</Label>
                    <Input
                      id="children"
                      type="number"
                      min="0"
                      value={newBooking.children}
                      onChange={(e) => setNewBooking({ ...newBooking, children: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference</Label>
                    <Input
                      id="reference"
                      placeholder="Booking reference (optional)"
                      value={newBooking.reference}
                      onChange={(e) => setNewBooking({ ...newBooking, reference: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Total Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newBooking.totalAmount}
                      onChange={(e) => setNewBooking({ ...newBooking, totalAmount: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requests">Special Requests</Label>
                  <Textarea
                    id="requests"
                    placeholder="Any special requests or notes..."
                    value={newBooking.specialRequests}
                    onChange={(e) => setNewBooking({ ...newBooking, specialRequests: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBooking} className="bg-gradient-primary">
                    Create Booking
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by guest name or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading reservations...</div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {booking.guests?.first_name} {booking.guests?.last_name}
                      </CardTitle>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Room: <span className="font-medium text-foreground">{booking.rooms?.room_number}</span></p>
                        <p>Email: <span className="font-medium text-foreground">{booking.guests?.email}</span></p>
                        {booking.reference && (
                          <p>Reference: <span className="font-medium text-foreground">{booking.reference}</span></p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                      <p className="text-lg font-bold text-primary">
                        ₹{booking.total_amount?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Check-in</p>
                      <p className="font-medium">{new Date(booking.check_in_date).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-out</p>
                      <p className="font-medium">{new Date(booking.check_out_date).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Guests</p>
                      <p className="font-medium">{booking.adults} Adults, {booking.children} Children</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nights</p>
                      <p className="font-medium">
                        {Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))}
                      </p>
                    </div>
                  </div>
                  
                  {booking.special_requests && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Special Requests:</p>
                      <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredBookings.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "No bookings found matching your filters" 
                  : "No reservations yet. Create your first booking to get started."}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
