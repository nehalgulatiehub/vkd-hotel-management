import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileSpreadsheet, Printer, Search } from "lucide-react";
import * as XLSX from "xlsx";

interface BookingListItem {
  id: string;
  booking_number: string;
  customer_name: string | null;
  check_in_date: string;
  check_out_date: string;
  agents?: { name: string } | null;
}

interface BookingDetails {
  id: string;
  booking_number: string;
  customer_name: string | null;
  address: string | null;
  contact_no: string | null;
  email: string | null;
  check_in_date: string;
  check_out_date: string;
  adults: number | null;
  children: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  due_amount: number | null;
  agents?: { name: string } | null;
  reference?: string | null;
}

interface HotelBooking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  room_type: string;
  number_of_rooms: number;
  room_rate: number;
  total_amount: number;
  rooms?: { room_type: string; base_price: number } | null;
}

interface VolvoBooking {
  id: string;
  route: string;
  travel_date: string;
  number_of_seats: number;
  rate_per_seat: number;
  total_amount: number;
}

interface SafariBooking {
  id: string;
  safari_name: string;
  safari_date: string;
  number_of_persons: number;
  rate_per_person: number;
  total_amount: number;
}

interface VehicleBooking {
  id: string;
  vehicle_type: string;
  pickup_date: string;
  dropoff_date: string;
  rate: number;
  total_amount: number;
}

interface RestaurantOrder {
  id: string;
  order_number: string;
  total_amount: number;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  created_at: string;
}

interface BillingItem {
  date: string;
  particulars: string;
  rate: number;
  qty: number;
  totalAmount: number;
  taxableAmount: number;
  cgstRate: string;
  cgstAmount: number;
  sgstRate: string;
  sgstAmount: number;
}

export default function Billing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);
  const [volvoBookings, setVolvoBookings] = useState<VolvoBooking[]>([]);
  const [safariBookings, setSafariBookings] = useState<SafariBooking[]>([]);
  const [vehicleBookings, setVehicleBookings] = useState<VehicleBooking[]>([]);
  const [restaurantOrders, setRestaurantOrders] = useState<RestaurantOrder[]>([]);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [companyDetails, setCompanyDetails] = useState({
    name: "DKV HOTEL MANAGEMENT",
    address: "Manali, Himachal Pradesh",
    contact: "",
    gstin: "",
    pan: "",
    hsnCode: "996311",
    bankName: "",
    accountNo: "",
    ifscCode: ""
  });
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (selectedBookingId) {
      fetchBookingDetails();
    }
  }, [selectedBookingId]);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, booking_number, customer_name, check_in_date, check_out_date, agents(name)")
      .in("status", ["confirmed", "completed"])
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load bookings");
    } else {
      setBookings(data || []);
    }
  };

  const fetchBookingDetails = async () => {
    if (!selectedBookingId) return;

    // Fetch booking details
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("*, agents(name)")
      .eq("id", selectedBookingId)
      .single();

    if (bookingError) {
      toast.error("Failed to load booking details");
      return;
    }

    setSelectedBooking(bookingData);
    setInvoiceNumber(`INV/${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${bookingData.booking_number}`);

    // Fetch all related data in parallel
    const [hotelRes, volvoRes, safariRes, vehicleRes, restaurantRes] = await Promise.all([
      supabase.from("hotel_bookings").select("*").eq("booking_id", selectedBookingId),
      supabase.from("volvo_bookings").select("*").eq("booking_id", selectedBookingId),
      supabase.from("safari_bookings").select("*").eq("booking_id", selectedBookingId),
      supabase.from("vehicle_bookings").select("*").eq("booking_id", selectedBookingId),
      supabase.from("restaurant_orders").select("*").eq("booking_id", selectedBookingId)
    ]);

    setHotelBookings(hotelRes.data || []);
    setVolvoBookings(volvoRes.data || []);
    setSafariBookings(safariRes.data || []);
    setVehicleBookings(vehicleRes.data || []);
    setRestaurantOrders(restaurantRes.data || []);

    // Generate billing items
    generateBillingItems(
      bookingData,
      hotelRes.data || [],
      volvoRes.data || [],
      safariRes.data || [],
      vehicleRes.data || [],
      restaurantRes.data || []
    );
  };

  const generateBillingItems = (
    booking: BookingDetails,
    hotels: HotelBooking[],
    volvos: VolvoBooking[],
    safaris: SafariBooking[],
    vehicles: VehicleBooking[],
    restaurants: RestaurantOrder[]
  ) => {
    const items: BillingItem[] = [];
    const accommodationGstRate = 12; // 6% CGST + 6% SGST
    const foodGstRate = 5; // 2.5% CGST + 2.5% SGST
    const transportGstRate = 5;

    // Add hotel accommodation items
    hotels.forEach((hotel) => {
      const checkIn = new Date(hotel.check_in_date);
      const checkOut = new Date(hotel.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i < nights; i++) {
        const date = new Date(checkIn);
        date.setDate(date.getDate() + i);
        const ratePerRoom = (hotel.room_rate || 0) / nights;
        const totalAmount = ratePerRoom * (hotel.number_of_rooms || 1);
        const taxableAmount = totalAmount / (1 + accommodationGstRate / 100);
        const cgst = taxableAmount * 0.06;
        const sgst = taxableAmount * 0.06;

        items.push({
          date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
          particulars: `Accommodation - ${hotel.room_type || 'Room'}`,
          rate: ratePerRoom,
          qty: hotel.number_of_rooms || 1,
          totalAmount: totalAmount,
          taxableAmount: taxableAmount,
          cgstRate: "6%",
          cgstAmount: cgst,
          sgstRate: "6%",
          sgstAmount: sgst
        });
      }
    });

    // Add volvo bookings
    volvos.forEach((volvo) => {
      const totalAmount = volvo.total_amount || 0;
      const taxableAmount = totalAmount / (1 + transportGstRate / 100);
      const cgst = taxableAmount * 0.025;
      const sgst = taxableAmount * 0.025;

      items.push({
        date: new Date(volvo.travel_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
        particulars: `Volvo - ${volvo.route}`,
        rate: volvo.rate_per_seat || 0,
        qty: volvo.number_of_seats || 1,
        totalAmount: totalAmount,
        taxableAmount: taxableAmount,
        cgstRate: "2.5%",
        cgstAmount: cgst,
        sgstRate: "2.5%",
        sgstAmount: sgst
      });
    });

    // Add safari bookings
    safaris.forEach((safari) => {
      const totalAmount = safari.total_amount || 0;
      const taxableAmount = totalAmount / (1 + transportGstRate / 100);
      const cgst = taxableAmount * 0.025;
      const sgst = taxableAmount * 0.025;

      items.push({
        date: new Date(safari.safari_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
        particulars: `Safari - ${safari.safari_name}`,
        rate: safari.rate_per_person || 0,
        qty: safari.number_of_persons || 1,
        totalAmount: totalAmount,
        taxableAmount: taxableAmount,
        cgstRate: "2.5%",
        cgstAmount: cgst,
        sgstRate: "2.5%",
        sgstAmount: sgst
      });
    });

    // Add vehicle bookings
    vehicles.forEach((vehicle) => {
      const totalAmount = vehicle.total_amount || 0;
      const taxableAmount = totalAmount / (1 + transportGstRate / 100);
      const cgst = taxableAmount * 0.025;
      const sgst = taxableAmount * 0.025;

      items.push({
        date: vehicle.pickup_date ? new Date(vehicle.pickup_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '-',
        particulars: `Vehicle - ${vehicle.vehicle_type || 'Transport'}`,
        rate: vehicle.rate || 0,
        qty: 1,
        totalAmount: totalAmount,
        taxableAmount: taxableAmount,
        cgstRate: "2.5%",
        cgstAmount: cgst,
        sgstRate: "2.5%",
        sgstAmount: sgst
      });
    });

    // Add restaurant orders
    restaurants.forEach((order) => {
      const totalAmount = order.total_amount || 0;
      const taxableAmount = order.subtotal || totalAmount / (1 + foodGstRate / 100);
      
      items.push({
        date: new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
        particulars: `Restaurant - Order #${order.order_number}`,
        rate: totalAmount,
        qty: 1,
        totalAmount: totalAmount,
        taxableAmount: taxableAmount,
        cgstRate: "2.5%",
        cgstAmount: order.cgst_amount || 0,
        sgstRate: "2.5%",
        sgstAmount: order.sgst_amount || 0
      });
    });

    setBillingItems(items);
  };

  const calculateTotals = () => {
    const totalAmount = billingItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalTaxable = billingItems.reduce((sum, item) => sum + item.taxableAmount, 0);
    const totalCgst = billingItems.reduce((sum, item) => sum + item.cgstAmount, 0);
    const totalSgst = billingItems.reduce((sum, item) => sum + item.sgstAmount, 0);
    
    return { totalAmount, totalTaxable, totalCgst, totalSgst };
  };

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const numStr = Math.floor(num).toString();
    
    const convert = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    
    return convert(Math.floor(num)) + ' Only';
  };

  const exportToExcel = () => {
    if (!selectedBooking || billingItems.length === 0) {
      toast.error("Please select a booking first");
      return;
    }

    const totals = calculateTotals();
    
    // Create workbook data
    const wsData: any[][] = [
      [companyDetails.name],
      [companyDetails.address],
      [`Contact No.: ${companyDetails.contact}`],
      [`GSTIN: ${companyDetails.gstin}`],
      [`Pan No.: ${companyDetails.pan}`],
      [`HSN/SAC Code: ${companyDetails.hsnCode}`],
      [],
      ['Bill To:', selectedBooking.customer_name || selectedBooking.reference || 'Guest', '', '', '', '', 'INVOICE'],
      ['Address:', selectedBooking.address || '-', '', '', '', '', '', '', '', `DATE: ${new Date(invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`],
      ['Contact:', selectedBooking.contact_no || '-', '', '', '', '', '', '', '', `INVOICE No: ${invoiceNumber}`],
      ['Email:', selectedBooking.email || '-'],
      [],
      [`Check In: ${new Date(selectedBooking.check_in_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - Check Out: ${new Date(selectedBooking.check_out_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`],
      [],
      ['Date', 'BILLING PARTICULARS', 'Rate', 'QTY', 'Total Amount', 'Taxable Amount', 'Rate CGST', 'CGST', 'Rate SGST', 'SGST']
    ];

    // Add billing items
    billingItems.forEach(item => {
      wsData.push([
        item.date,
        item.particulars,
        item.rate.toFixed(2),
        item.qty,
        item.totalAmount.toFixed(2),
        item.taxableAmount.toFixed(2),
        item.cgstRate,
        item.cgstAmount.toFixed(2),
        item.sgstRate,
        item.sgstAmount.toFixed(2)
      ]);
    });

    // Add totals
    wsData.push([]);
    wsData.push(['', 'TOTAL', '', '', totals.totalAmount.toFixed(2), totals.totalTaxable.toFixed(2), '', totals.totalCgst.toFixed(2), '', totals.totalSgst.toFixed(2)]);
    wsData.push([]);
    wsData.push([`TOTAL IN WORDS: ${numberToWords(totals.totalAmount)}`]);
    wsData.push([]);
    wsData.push(['Terms and Conditions:']);
    wsData.push(['Note: This is computer generated invoice no signature and stamp required.']);
    if (companyDetails.bankName) {
      wsData.push([]);
      wsData.push([`Bank: ${companyDetails.bankName}`]);
      wsData.push([`Account No: ${companyDetails.accountNo}`]);
      wsData.push([`IFSC Code: ${companyDetails.ifscCode}`]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 35 }, { wch: 10 }, { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice");
    XLSX.writeFile(wb, `Invoice_${selectedBooking.booking_number}_${invoiceDate}.xlsx`);
    
    toast.success("Invoice exported to Excel");
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredBookings = bookings.filter(b => 
    (b.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.agents?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-background">
      <Header title="Billing" />
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Billing / Invoice</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel} disabled={!selectedBooking}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={handlePrint} disabled={!selectedBooking}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Booking Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Select Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBookingId(booking.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedBookingId === booking.id 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium text-sm">{booking.booking_number}</div>
                    <div className="text-xs opacity-80">{booking.customer_name || booking.agents?.name || 'Guest'}</div>
                    <div className="text-xs opacity-60">
                      {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Invoice Number</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div>
                <Label>Invoice Date</Label>
                <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <Separator />
              <div>
                <Label>Company Name</Label>
                <Input value={companyDetails.name} onChange={(e) => setCompanyDetails({...companyDetails, name: e.target.value})} />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={companyDetails.address} onChange={(e) => setCompanyDetails({...companyDetails, address: e.target.value})} />
              </div>
              <div>
                <Label>Contact</Label>
                <Input value={companyDetails.contact} onChange={(e) => setCompanyDetails({...companyDetails, contact: e.target.value})} />
              </div>
              <div>
                <Label>GSTIN</Label>
                <Input value={companyDetails.gstin} onChange={(e) => setCompanyDetails({...companyDetails, gstin: e.target.value})} />
              </div>
              <div>
                <Label>PAN</Label>
                <Input value={companyDetails.pan} onChange={(e) => setCompanyDetails({...companyDetails, pan: e.target.value})} />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input value={companyDetails.bankName} onChange={(e) => setCompanyDetails({...companyDetails, bankName: e.target.value})} />
              </div>
              <div>
                <Label>Account No</Label>
                <Input value={companyDetails.accountNo} onChange={(e) => setCompanyDetails({...companyDetails, accountNo: e.target.value})} />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <Input value={companyDetails.ifscCode} onChange={(e) => setCompanyDetails({...companyDetails, ifscCode: e.target.value})} />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Invoice Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={printRef} className="bg-white text-black p-6 rounded-lg print:p-0" id="invoice-preview">
                {selectedBooking ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="text-center border-b pb-4">
                      <h2 className="text-xl font-bold">{companyDetails.name}</h2>
                      <p className="text-sm">{companyDetails.address}</p>
                      {companyDetails.contact && <p className="text-sm">Contact: {companyDetails.contact}</p>}
                      {companyDetails.gstin && <p className="text-sm">GSTIN: {companyDetails.gstin}</p>}
                      {companyDetails.pan && <p className="text-sm">PAN: {companyDetails.pan}</p>}
                      <p className="text-sm">HSN/SAC Code: {companyDetails.hsnCode}</p>
                    </div>

                    {/* Bill To & Invoice Info */}
                    <div className="grid grid-cols-2 gap-4 border-b pb-4">
                      <div>
                        <p className="font-semibold">Bill To:</p>
                        <p>{selectedBooking.customer_name || selectedBooking.reference || 'Guest'}</p>
                        <p className="text-sm">{selectedBooking.address || '-'}</p>
                        <p className="text-sm">{selectedBooking.contact_no || '-'}</p>
                        <p className="text-sm">{selectedBooking.email || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">INVOICE</p>
                        <p className="text-sm">Date: {new Date(invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className="text-sm">Invoice No: {invoiceNumber}</p>
                        <p className="text-sm mt-2">
                          Check In: {new Date(selectedBooking.check_in_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-sm">
                          Check Out: {new Date(selectedBooking.check_out_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Billing Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted">
                            <th className="border p-2 text-left">Date</th>
                            <th className="border p-2 text-left">Particulars</th>
                            <th className="border p-2 text-right">Rate</th>
                            <th className="border p-2 text-right">Qty</th>
                            <th className="border p-2 text-right">Total</th>
                            <th className="border p-2 text-right">Taxable</th>
                            <th className="border p-2 text-right">CGST</th>
                            <th className="border p-2 text-right">SGST</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billingItems.map((item, index) => (
                            <tr key={index}>
                              <td className="border p-2">{item.date}</td>
                              <td className="border p-2">{item.particulars}</td>
                              <td className="border p-2 text-right">₹{item.rate.toFixed(2)}</td>
                              <td className="border p-2 text-right">{item.qty}</td>
                              <td className="border p-2 text-right">₹{item.totalAmount.toFixed(2)}</td>
                              <td className="border p-2 text-right">₹{item.taxableAmount.toFixed(2)}</td>
                              <td className="border p-2 text-right">{item.cgstRate}<br/>₹{item.cgstAmount.toFixed(2)}</td>
                              <td className="border p-2 text-right">{item.sgstRate}<br/>₹{item.sgstAmount.toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="font-bold bg-muted">
                            <td className="border p-2" colSpan={4}>TOTAL</td>
                            <td className="border p-2 text-right">₹{totals.totalAmount.toFixed(2)}</td>
                            <td className="border p-2 text-right">₹{totals.totalTaxable.toFixed(2)}</td>
                            <td className="border p-2 text-right">₹{totals.totalCgst.toFixed(2)}</td>
                            <td className="border p-2 text-right">₹{totals.totalSgst.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Total in Words */}
                    <div className="border-t pt-4">
                      <p className="font-semibold">Total Amount: ₹{totals.totalAmount.toFixed(2)}</p>
                      <p className="text-sm italic">In Words: {numberToWords(totals.totalAmount)}</p>
                    </div>

                    {/* Bank Details */}
                    {companyDetails.bankName && (
                      <div className="border-t pt-4 grid grid-cols-2">
                        <div>
                          <p className="font-semibold text-sm">Bank Details:</p>
                          <p className="text-sm">{companyDetails.bankName}</p>
                          <p className="text-sm">A/C No: {companyDetails.accountNo}</p>
                          <p className="text-sm">IFSC: {companyDetails.ifscCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm mt-8">For {companyDetails.name}</p>
                          <p className="text-xs mt-4">Authorised Signatory</p>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="border-t pt-4 text-xs text-muted-foreground">
                      <p>Note: This is a computer generated invoice, no signature required.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Select a booking to generate invoice
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-preview, #invoice-preview * {
            visibility: visible;
          }
          #invoice-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
