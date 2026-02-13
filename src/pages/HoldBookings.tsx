import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Clock, Search, Eye } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

export default function HoldBookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [holdBookings, setHoldBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHoldBookings();
    
    // Check for expired bookings every minute
    const interval = setInterval(checkExpiredBookings, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchHoldBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, agents(name), hotel_bookings(*, own_hotels(name))")
      .eq("is_hold", true)
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load hold bookings");
    } else {
      setHoldBookings(data || []);
    }
  };

  const checkExpiredBookings = async () => {
    const now = new Date().toISOString();
    
    const { data: expiredBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("is_hold", true)
      .lt("hold_until", now)
      .eq("status", "confirmed");

    if (expiredBookings && expiredBookings.length > 0) {
      const ids = expiredBookings.map(b => b.id);
      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .in("id", ids);
      
      fetchHoldBookings();
      toast.info(`${expiredBookings.length} hold booking(s) expired`);
    }
  };

  const handleConfirmBooking = async (booking: any) => {
    if (!confirm("Confirm this hold booking? This will remove the hold status.")) return;

    const { error } = await supabase
      .from("bookings")
      .update({ 
        is_hold: false,
        hold_until: null,
        status: "confirmed"
      })
      .eq("id", booking.id);

    if (error) {
      toast.error("Failed to confirm booking");
    } else {
      toast.success("Booking confirmed successfully");
      fetchHoldBookings();
    }
  };

  const handleCancelBooking = async (booking: any) => {
    if (!confirm("Cancel this hold booking?")) return;

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);

    if (error) {
      toast.error("Failed to cancel booking");
    } else {
      toast.success("Booking cancelled successfully");
      fetchHoldBookings();
    }
  };

  const isExpired = (holdUntil: string) => {
    return new Date(holdUntil) < new Date();
  };

  const getTimeRemaining = (holdUntil: string) => {
    const now = new Date();
    const expiry = new Date(holdUntil);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff < 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    
    return `${hours}h ${minutes}m remaining`;
  };

  const filteredBookings = holdBookings.filter(booking =>
    booking.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.agents?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pagination = usePagination(filteredBookings);
  
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Hold Bookings" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Hold Bookings</h2>
            <p className="text-muted-foreground">Temporary reservations with expiry time</p>
          </div>
          <Button 
            className="bg-gradient-primary"
            onClick={() => navigate("/bookings/hold")}
          >
            <Clock className="h-4 w-4 mr-2" />
            Create Hold Booking
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by booking number, customer, or agent..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Booking No</th>
                    <th className="text-left p-4 font-semibold">Customer</th>
                    <th className="text-left p-4 font-semibold">Hotel</th>
                    <th className="text-left p-4 font-semibold">Check-in</th>
                    <th className="text-left p-4 font-semibold">Check-out</th>
                    <th className="text-left p-4 font-semibold">Hold Until</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedItems.map((booking) => {
                    const expired = isExpired(booking.hold_until);
                    const isCancelled = booking.status === "cancelled";
                    
                    return (
                      <tr 
                        key={booking.id} 
                        className={`border-b hover:bg-muted/50 ${expired || isCancelled ? "opacity-60" : ""}`}
                      >
                        <td className="p-4 font-mono">{booking.booking_number}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{booking.customer_name}</p>
                            {booking.agents && (
                              <p className="text-xs text-muted-foreground">via {booking.agents.name}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {booking.hotel_bookings?.[0]?.own_hotels?.name || "-"}
                        </td>
                        <td className="p-4">
                          {new Date(booking.check_in_date).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          {new Date(booking.check_out_date).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-sm">
                              {new Date(booking.hold_until).toLocaleString()}
                            </p>
                            <p className={`text-xs ${expired ? "text-red-600" : "text-orange-600"} font-medium`}>
                              {getTimeRemaining(booking.hold_until)}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          {isCancelled ? (
                            <Badge className="bg-red-600">Cancelled</Badge>
                          ) : expired ? (
                            <Badge className="bg-gray-600">Expired</Badge>
                          ) : (
                            <Badge className="bg-orange-600">On Hold</Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {!expired && !isCancelled && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleConfirmBooking(booking)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleCancelBooking(booking)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(isAdminRoute ? `/admin/bookings/${booking.id}` : `/bookings/${booking.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredBookings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No hold bookings found
                </div>
              )}
            </div>
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              totalItems={pagination.totalItems}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
