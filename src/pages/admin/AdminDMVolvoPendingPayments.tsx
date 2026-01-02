import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { toast } from "sonner";

interface PaymentWithDetails {
  id: string;
  amount: number;
  payment_mode: string | null;
  payment_date: string | null;
  reference_number: string | null;
  approval_status: string | null;
  created_at: string | null;
  booking: {
    id: string;
    booking_number: string;
    check_in_date: string;
    check_out_date: string;
    customer_name: string | null;
    contact_no: string | null;
    total_amount: number | null;
    adults: number | null;
    children: number | null;
    address: string | null;
    agent?: { name: string; company_name: string | null } | null;
  } | null;
  hotel_info?: { hotel_name: string | null; room_type: string | null; number_of_rooms?: number | null };
  created_by_profile?: { username: string | null; first_name: string | null; last_name: string | null } | null;
}

export default function AdminDMVolvoPendingPayments() {
  const { isAdmin, isAccount, user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterHotel, setFilterHotel] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const canManage = isAdmin() || isAccount();

  const filteredPayments = payments.filter(payment => {
    const matchesCustomer = !searchCustomer || 
      payment.booking?.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      payment.booking?.booking_number?.toLowerCase().includes(searchCustomer.toLowerCase());
    const matchesMode = filterPaymentMode === "all" || payment.payment_mode?.toLowerCase() === filterPaymentMode.toLowerCase();
    const matchesUser = filterUser === "all" || payment.created_by_profile?.username === filterUser || payment.created_by_profile?.first_name === filterUser;
    const matchesAgent = filterAgent === "all" || payment.booking?.agent?.name === filterAgent;
    const matchesHotel = filterHotel === "all" || payment.hotel_info?.hotel_name === filterHotel;
    
    let matchesDate = true;
    if (appliedFromDate || appliedToDate) {
      const paymentDate = payment.payment_date ? new Date(payment.payment_date) : null;
      if (paymentDate) {
        if (appliedFromDate) matchesDate = matchesDate && paymentDate >= new Date(appliedFromDate);
        if (appliedToDate) matchesDate = matchesDate && paymentDate <= new Date(appliedToDate);
      } else {
        matchesDate = false;
      }
    }
    
    return matchesCustomer && matchesMode && matchesDate && matchesUser && matchesAgent && matchesHotel;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments, { itemsPerPage: 15 });
  const totalPaymentAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchPendingPayments();
      fetchFilters();
    }
  }, [authLoading]);

  const fetchFilters = async () => {
    const [agentsRes, hotelsRes, profilesRes] = await Promise.all([
      supabase.from("agents").select("id, name").order("name"),
      supabase.from("own_hotels").select("id, name").order("name"),
      supabase.from("profiles").select("id, username, first_name").order("username")
    ]);
    if (agentsRes.data) setAgents(agentsRes.data);
    if (hotelsRes.data) setHotels(hotelsRes.data);
    if (profilesRes.data) setUsers(profilesRes.data.map(p => ({ id: p.id, name: p.username || p.first_name || "Unknown" })));
  };

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`id, amount, payment_mode, payment_date, reference_number, approval_status, created_at, created_by, booking:bookings(id, booking_number, check_in_date, check_out_date, customer_name, contact_no, total_amount, adults, children, address, agent:agents(name, company_name))`)
        .eq("payment_type", "delhi_manali")
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const bookingIds = (data || []).map((p: any) => p.booking?.id).filter(Boolean);
      let hotelBookingsMap: Record<string, any> = {};
      
      if (bookingIds.length > 0) {
        const { data: hotelBookings } = await supabase
          .from("hotel_bookings")
          .select(`booking_id, room_type, number_of_rooms, hotel:another_hotels(name), own_hotel:own_hotels(name)`)
          .in("booking_id", bookingIds);
        
        hotelBookings?.forEach((hb: any) => {
          hotelBookingsMap[hb.booking_id] = { hotel_name: hb.hotel?.name || hb.own_hotel?.name || null, room_type: hb.room_type, number_of_rooms: hb.number_of_rooms };
        });
      }

      const creatorIds = [...new Set((data || []).map((p: any) => p.created_by).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, username, first_name, last_name").in("id", creatorIds);
        profilesMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      }

      const paymentsWithProfiles = (data || []).map((p: any) => ({
        ...p,
        hotel_info: hotelBookingsMap[p.booking?.id] || null,
        created_by_profile: p.created_by ? profilesMap[p.created_by] : null
      }));

      setPayments(paymentsWithProfiles as PaymentWithDetails[]);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSearch = () => { setAppliedFromDate(fromDate); setAppliedToDate(toDate); };
  const handleDateClear = () => { setFromDate(""); setToDate(""); setAppliedFromDate(""); setAppliedToDate(""); };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    setSelectedPayments(prev => { const newSet = new Set(prev); checked ? newSet.add(paymentId) : newSet.delete(paymentId); return newSet; });
  };

  const handleSelectAll = (checked: boolean) => { setSelectedPayments(checked ? new Set(paginatedItems.map(p => p.id)) : new Set()); };

  const handleBulkApproval = async (status: "approved" | "rejected") => {
    if (selectedPayments.size === 0) { toast.error("Please select at least one payment"); return; }
    try {
      const { error } = await supabase.from("payments").update({ approval_status: status, approved_by: user?.id, approved_at: new Date().toISOString() }).in("id", Array.from(selectedPayments));
      if (error) throw error;
      toast.success(`${selectedPayments.size} payment(s) ${status} successfully`);
      setSelectedPayments(new Set());
      fetchPendingPayments();
    } catch (error) { toast.error("Failed to update payments"); }
  };

  if (authLoading) return <div className="min-h-screen"><AdminHeader title="D-M Volvo Pending Payments" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card></main></div>;
  if (!canManage) return <div className="min-h-screen"><AdminHeader title="Access Denied" /><main className="p-4"><Card><CardContent className="py-8 text-center text-muted-foreground">Access denied.</CardContent></Card></main></div>;

  return (
    <div className="min-h-screen">
      <AdminHeader title="D-M Volvo Pending Payments" />
      <main className="p-4 space-y-4">
        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader className="py-2 px-4 bg-destructive text-destructive-foreground">
            <CardTitle className="text-sm font-medium">Search</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromDateChange={setFromDate} onToDateChange={setToDate} onSearch={handleDateSearch} onClear={handleDateClear} />
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
              <Select value={filterPaymentMode} onValueChange={setFilterPaymentMode}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Payment Mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">--Select Mode--</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="net banking">Net Banking</SelectItem>
                  <SelectItem value="credit card">Credit Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Agent Name" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">--Select Agent--</SelectItem>
                  {agents.map(agent => (<SelectItem key={agent.id} value={agent.name}>{agent.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filterHotel} onValueChange={setFilterHotel}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Hotel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">--Select Hotel--</SelectItem>
                  {hotels.map(hotel => (<SelectItem key={hotel.id} value={hotel.name}>{hotel.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input placeholder="Customer" value={searchCustomer} onChange={(e) => setSearchCustomer(e.target.value)} className="h-8 text-xs" />
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="User" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">--Select User--</SelectItem>
                  {users.map(u => (<SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8" onClick={handleDateSearch}>Search</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-2 px-4 border-b bg-destructive/10">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> D-M Volvo Pending Payments ({totalItems})</span>
              <span className="text-sm font-bold">Total Payment: Rs. {totalPaymentAmount.toLocaleString()}/-</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : paginatedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No pending D-M Volvo payments found.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">S.No.</TableHead>
                        <TableHead>Booking</TableHead>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"><Checkbox checked={paginatedItems.length > 0 && selectedPayments.size === paginatedItems.length} onCheckedChange={handleSelectAll} /></TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((payment, index) => (
                        <TableRow key={payment.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                          <TableCell>
                            <div className="text-xs space-y-0.5">
                              <div className="font-semibold">Booking:</div>
                              <div>{payment.booking?.check_in_date} - {payment.booking?.check_out_date}</div>
                              <div><span className="font-medium">No. of Rooms:</span> {payment.hotel_info?.number_of_rooms || 1}</div>
                              <div><span className="font-medium">Price:</span> Rs. {payment.booking?.total_amount?.toLocaleString() || 0}/-</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-0.5">
                              <div className="font-semibold">{payment.booking?.customer_name || "N/A"}</div>
                              <div>Contact No.: {payment.booking?.contact_no || ""}</div>
                              <div>Place: {payment.booking?.address || ""}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-0.5">
                              <div><span className="font-medium">Agent:</span> {payment.booking?.agent?.name || ""}</div>
                              <div><span className="font-medium">Hotel:</span> {payment.hotel_info?.hotel_name || ""}</div>
                              <div><span className="font-medium">Room:</span> {payment.hotel_info?.room_type || ""}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">Rs. {payment.amount?.toLocaleString() || 0}/-</TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>{payment.payment_mode || "N/A"}</div>
                              {payment.reference_number && <div>Code={payment.reference_number}</div>}
                            </div>
                          </TableCell>
                          <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), "dd-MMM-yyyy") : "N/A"}</TableCell>
                          <TableCell>{payment.created_by_profile?.username || payment.created_by_profile?.first_name || "N/A"}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-orange-600 border-orange-300">Pending</Badge></TableCell>
                          <TableCell><Checkbox checked={selectedPayments.has(payment.id)} onCheckedChange={(checked) => handleSelectPayment(payment.id, !!checked)} /></TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-xs">
                              <Button variant="link" size="sm" className="h-auto p-0 text-destructive hover:text-destructive/80" onClick={() => navigate(`/admin/bookings/${payment.booking?.id}`)}>View Booking</Button>
                              <Button variant="link" size="sm" className="h-auto p-0 text-destructive hover:text-destructive/80" onClick={() => navigate(`/admin/booking-payments?id=${payment.booking?.id}`)}>View Payment</Button>
                              <Button variant="link" size="sm" className="h-auto p-0 text-destructive hover:text-destructive/80" onClick={() => navigate(`/admin/refund-payments?id=${payment.booking?.id}`)}>View Refund Payment</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm font-medium">Total Payment: Rs. {totalPaymentAmount.toLocaleString()}/-</div>
                  <div className="flex items-center gap-4">
                    <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleBulkApproval("approved")} disabled={selectedPayments.size === 0} className="gap-1"><CheckCircle className="h-4 w-4" /> Approved ({selectedPayments.size})</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleBulkApproval("rejected")} disabled={selectedPayments.size === 0} className="gap-1"><XCircle className="h-4 w-4" /> Reject ({selectedPayments.size})</Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
