import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePagination } from "@/hooks/usePagination";

interface PendingPayment {
  id: string;
  type: "booking" | "restaurant" | "refund";
  booking_id?: string;
  booking_number?: string;
  invoice_number?: string;
  customer_name?: string;
  contact_no?: string;
  address?: string;
  check_in_date?: string;
  check_out_date?: string;
  total_amount?: number;
  paid_amount?: number;
  due_amount?: number;
  adults?: number;
  children?: number;
  amount: number;
  payment_mode: string;
  payment_date: string;
  approval_status: string;
  reference_number?: string;
  agent_name?: string;
  hotel_name?: string;
  room_type?: string;
  created_by_name?: string;
}

export default function PaymentApprovals() {
  const { isAdmin, isAccount, canApprovePayment, user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>("all");

  const canView = isAdmin() || isAccount();

  const filteredPayments = payments.filter(payment => {
    const matchesCustomer = !searchCustomer || 
      payment.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      payment.booking_number?.toLowerCase().includes(searchCustomer.toLowerCase());
    const matchesMode = filterPaymentMode === "all" || 
      payment.payment_mode?.toLowerCase() === filterPaymentMode.toLowerCase();
    return matchesCustomer && matchesMode;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments, { itemsPerPage: 10 });

  useEffect(() => {
    if (!authLoading && canView) {
      fetchPayments();
    }
  }, [authLoading, canView, activeTab]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const allPayments: PendingPayment[] = [];

      // Fetch booking payments with more details
      const { data: bookingPayments, error: bpError } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          payment_mode,
          payment_date,
          approval_status,
          reference_number,
          created_by,
          booking:bookings(
            id,
            booking_number, 
            customer_name,
            contact_no,
            address,
            check_in_date,
            check_out_date,
            total_amount,
            paid_amount,
            due_amount,
            adults,
            children,
            agent:agents(name, company_name)
          )
        `)
        .eq("approval_status", activeTab === "pending" ? "pending" : activeTab)
        .order("created_at", { ascending: false });

      if (bpError) throw bpError;

      // Fetch hotel bookings for each payment's booking
      const bookingIds = bookingPayments?.map((p: any) => p.booking?.id).filter(Boolean) || [];
      let hotelBookingsMap: Record<string, any> = {};
      
      if (bookingIds.length > 0) {
        const { data: hotelBookings } = await supabase
          .from("hotel_bookings")
          .select(`
            booking_id,
            room_type,
            hotel:another_hotels(name),
            own_hotel:own_hotels(name)
          `)
          .in("booking_id", bookingIds);
        
        hotelBookings?.forEach((hb: any) => {
          hotelBookingsMap[hb.booking_id] = {
            hotel_name: hb.hotel?.name || hb.own_hotel?.name || null,
            room_type: hb.room_type
          };
        });
      }

      // Fetch created_by profiles
      const creatorIds = [...new Set(bookingPayments?.map((p: any) => p.created_by).filter(Boolean) || [])];
      let profilesMap: Record<string, any> = {};
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, first_name, last_name")
          .in("id", creatorIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      }

      bookingPayments?.forEach((p: any) => {
        const hotelInfo = hotelBookingsMap[p.booking?.id] || {};
        const creatorProfile = p.created_by ? profilesMap[p.created_by] : null;
        
        allPayments.push({
          id: p.id,
          type: "booking",
          booking_id: p.booking?.id,
          booking_number: p.booking?.booking_number,
          customer_name: p.booking?.customer_name,
          contact_no: p.booking?.contact_no,
          address: p.booking?.address,
          check_in_date: p.booking?.check_in_date,
          check_out_date: p.booking?.check_out_date,
          total_amount: p.booking?.total_amount,
          paid_amount: p.booking?.paid_amount,
          due_amount: p.booking?.due_amount,
          adults: p.booking?.adults,
          children: p.booking?.children,
          amount: p.amount,
          payment_mode: p.payment_mode || "Unknown",
          payment_date: p.payment_date,
          approval_status: p.approval_status || "pending",
          reference_number: p.reference_number,
          agent_name: p.booking?.agent?.name || "Direct",
          hotel_name: hotelInfo.hotel_name,
          room_type: hotelInfo.room_type,
          created_by_name: creatorProfile?.username || creatorProfile?.first_name || null,
        });
      });

      // Fetch restaurant payments
      const { data: restaurantPayments, error: rpError } = await supabase
        .from("restaurant_payments")
        .select(`
          id,
          amount,
          payment_mode,
          payment_date,
          approval_status,
          reference_number,
          invoice:restaurant_invoices(invoice_number, customer_name, customer_phone)
        `)
        .eq("approval_status", activeTab === "pending" ? "pending" : activeTab);

      if (rpError) throw rpError;

      restaurantPayments?.forEach((p: any) => {
        allPayments.push({
          id: p.id,
          type: "restaurant",
          invoice_number: p.invoice?.invoice_number,
          customer_name: p.invoice?.customer_name,
          contact_no: p.invoice?.customer_phone,
          amount: p.amount,
          payment_mode: p.payment_mode || "Unknown",
          payment_date: p.payment_date,
          approval_status: p.approval_status || "pending",
          reference_number: p.reference_number,
        });
      });

      // Fetch refunds
      const { data: refunds, error: rError } = await supabase
        .from("refunds")
        .select(`
          id,
          refund_amount,
          refund_mode,
          refund_date,
          approval_status,
          reference_number,
          booking:bookings(id, booking_number, customer_name, contact_no)
        `)
        .eq("approval_status", activeTab === "pending" ? "pending" : activeTab);

      if (rError) throw rError;

      refunds?.forEach((r: any) => {
        allPayments.push({
          id: r.id,
          type: "refund",
          booking_id: r.booking?.id,
          booking_number: r.booking?.booking_number,
          customer_name: r.booking?.customer_name,
          contact_no: r.booking?.contact_no,
          amount: r.refund_amount,
          payment_mode: r.refund_mode || "Unknown",
          payment_date: r.refund_date,
          approval_status: r.approval_status || "pending",
          reference_number: r.reference_number,
        });
      });

      // Filter out cash payments for account users (they can't approve them)
      const filteredPayments = isAccount() && !isAdmin()
        ? allPayments.filter(p => p.payment_mode.toLowerCase() !== "cash")
        : allPayments;

      setPayments(filteredPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (payment: PendingPayment, status: "approved" | "rejected") => {
    if (!canApprovePayment(payment.payment_mode)) {
      toast.error("You cannot approve cash payments");
      return;
    }

    // Optimistically remove the payment from the list immediately
    setPayments(prev => prev.filter(p => !(p.id === payment.id && p.type === payment.type)));

    try {
      const updateData = {
        approval_status: status,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      };

      let error = null;
      
      switch (payment.type) {
        case "booking":
          const { error: bError } = await supabase
            .from("payments")
            .update(updateData)
            .eq("id", payment.id);
          error = bError;
          break;
        case "restaurant":
          const { error: rError } = await supabase
            .from("restaurant_payments")
            .update(updateData)
            .eq("id", payment.id);
          error = rError;
          break;
        case "refund":
          const { error: refError } = await supabase
            .from("refunds")
            .update(updateData)
            .eq("id", payment.id);
          error = refError;
          break;
      }

      if (error) throw error;

      toast.success(`Payment ${status} successfully`);
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment status");
      // Refetch to restore the payment if the update failed
      fetchPayments();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "booking":
        return <Badge variant="outline">Booking</Badge>;
      case "restaurant":
        return <Badge variant="outline">Restaurant</Badge>;
      case "refund":
        return <Badge variant="outline">Refund</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Payment Approvals" />
        <main className="p-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen">
        <Header title="Access Denied" />
        <main className="p-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              You don't have permission to access this page.
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Payment Approvals" />
      <main className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Payment Approval Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <Input
                    placeholder="Search by customer or booking..."
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                  />
                  <Select value={filterPaymentMode} onValueChange={setFilterPaymentMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Payment Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="net banking">Net Banking</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : paginatedItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No {activeTab} payments found
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>S.No</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Booking Details</TableHead>
                          <TableHead>Customer Details</TableHead>
                          <TableHead>Package Info</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedItems.map((payment, index) => (
                          <TableRow key={`${payment.type}-${payment.id}`}>
                            <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                            <TableCell>{getTypeBadge(payment.type)}</TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                <div className="font-medium">
                                  {payment.booking_number || payment.invoice_number || "-"}
                                </div>
                                {payment.check_in_date && payment.check_out_date && (
                                  <div>{payment.check_in_date} - {payment.check_out_date}</div>
                                )}
                                {(payment.adults || payment.children) && (
                                  <div>Pax: {payment.adults || 0}A + {payment.children || 0}C</div>
                                )}
                                {payment.total_amount && (
                                  <div>Price: Rs. {payment.total_amount.toLocaleString()}/-</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                <div className="font-medium">{payment.customer_name || "N/A"}</div>
                                {payment.contact_no && <div>Contact: {payment.contact_no}</div>}
                                {payment.address && <div>Place: {payment.address}</div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                <div>Agent: {payment.agent_name || "Direct"}</div>
                                <div>Hotel: {payment.hotel_name || "-"}</div>
                                <div>Room: {payment.room_type || "-"}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                <div className="font-medium">Rs. {payment.amount?.toLocaleString() || 0}/-</div>
                                {payment.reference_number && (
                                  <div>Ref: {payment.reference_number}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{payment.payment_mode}</Badge>
                            </TableCell>
                            <TableCell>
                              {payment.payment_date
                                ? format(new Date(payment.payment_date), "dd/MM/yyyy")
                                : "-"}
                            </TableCell>
                            <TableCell>{payment.created_by_name || "-"}</TableCell>
                            <TableCell>{getStatusBadge(payment.approval_status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {payment.booking_id && (
                                  <>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-auto p-0 text-xs justify-start"
                                      onClick={() => navigate(`/bookings/${payment.booking_id}`)}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Booking
                                    </Button>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-auto p-0 text-xs justify-start text-blue-600"
                                      onClick={() => navigate(`/payments/booking?id=${payment.booking_id}`)}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Payments
                                    </Button>
                                  </>
                                )}
                                {activeTab === "pending" && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-7 w-7 text-green-600 hover:text-green-700"
                                      onClick={() => handleApproval(payment, "approved")}
                                      disabled={!canApprovePayment(payment.payment_mode)}
                                      title={
                                        !canApprovePayment(payment.payment_mode)
                                          ? "Account users cannot approve cash payments"
                                          : "Approve payment"
                                      }
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-7 w-7 text-red-600 hover:text-red-700"
                                      onClick={() => handleApproval(payment, "rejected")}
                                      disabled={!canApprovePayment(payment.payment_mode)}
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                      totalItems={totalItems}
                      startIndex={startIndex}
                      endIndex={endIndex}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {isAccount() && !isAdmin() && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-4 text-sm text-amber-800">
              <strong>Note:</strong> As an Account user, you can approve all payment types except cash payments.
              Cash payments require Admin approval.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
