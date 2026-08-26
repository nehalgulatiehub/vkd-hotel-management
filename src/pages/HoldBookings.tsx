import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { LegacyPanelHeader } from "@/components/legacy/LegacyPanelHeader";
import {
  legacyFilterContainerStyle,
  legacyFilterLabelClass,
  legacyFilterInputClass,
  legacySearchButtonStyle,
} from "@/components/legacy/legacyFilterStyles";

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
      <main className="p-4">
        <LegacyPanelHeader
          title="View Hold Booking"
          className="mb-3"
          right={
            <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={() => setSearchTerm("")}>
              View All Records
            </Button>
          }
        />

        {/* Compact Filter Section */}
        <div className="mb-3" style={legacyFilterContainerStyle}>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>Search :</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Booking No, Customer or Agent"
                className={`${legacyFilterInputClass} w-64`}
              />
            </div>
          </div>

          <div className="flex justify-end px-3 pb-2">
            <button style={legacySearchButtonStyle}>Search</button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-3">
          <Button
            className="bg-gradient-primary"
            size="sm"
            onClick={() => navigate("/bookings/hold")}
          >
            <Clock className="h-4 w-4 mr-2" />
            Create Hold Booking
          </Button>
        </div>

        {/* Main Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#D4A59A" }}>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Booking No</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Customer</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Hotel</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Check-in</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Check-out</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Hold Until</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Status</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">
                        No hold bookings found
                      </td>
                    </tr>
                  ) : (
                    pagination.paginatedItems.map((booking) => {
                      const expired = isExpired(booking.hold_until);
                      const isCancelled = booking.status === "cancelled";

                      return (
                        <tr
                          key={booking.id}
                          style={{ backgroundColor: "#F5E6E0" }}
                          className={expired || isCancelled ? "opacity-60" : ""}
                        >
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top font-mono">{booking.booking_number}</td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div className="font-medium">{booking.customer_name}</div>
                            {booking.agents && (
                              <div className="text-muted-foreground">via {booking.agents.name}</div>
                            )}
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            {booking.hotel_bookings?.[0]?.own_hotels?.name || "-"}
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            {new Date(booking.check_in_date).toLocaleDateString()}
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            {new Date(booking.check_out_date).toLocaleDateString()}
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div>{new Date(booking.hold_until).toLocaleString()}</div>
                            <div className={`${expired ? "text-red-600" : "text-orange-600"} font-medium`}>
                              {getTimeRemaining(booking.hold_until)}
                            </div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            {isCancelled ? (
                              <Badge className="bg-red-600">Cancelled</Badge>
                            ) : expired ? (
                              <Badge className="bg-gray-600">Expired</Badge>
                            ) : (
                              <Badge className="bg-orange-600">On Hold</Badge>
                            )}
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {!expired && !isCancelled && (
                                <>
                                  <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-green-700" onClick={() => handleConfirmBooking(booking)}>
                                    Confirm
                                  </Button>
                                  <span className="text-muted-foreground">/</span>
                                  <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-destructive" onClick={() => handleCancelBooking(booking)}>
                                    Cancel
                                  </Button>
                                  <span className="text-muted-foreground">/</span>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="link"
                                className="h-auto p-0 text-[11px] text-primary"
                                onClick={() => navigate(isAdminRoute ? `/admin/bookings/${booking.id}` : `/bookings/${booking.id}`)}
                              >
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
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
