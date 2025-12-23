import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileSpreadsheet, Printer, Search, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

interface CompanySettings {
  id: string;
  company_name: string;
  sub_title: string | null;
  address: string | null;
  contact_no: string | null;
  gstin: string | null;
  pan_no: string | null;
  hsn_code: string | null;
  logo_url: string | null;
  bank_name: string | null;
  account_no: string | null;
  ifsc_code: string | null;
  branch_name: string | null;
  terms_conditions: string | null;
}

export default function Billing() {
  const navigate = useNavigate();
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
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [customerGstNo, setCustomerGstNo] = useState("");
  const [customerPanNo, setCustomerPanNo] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBookings();
    fetchCompanySettings();
  }, []);

  useEffect(() => {
    if (selectedBookingId) {
      fetchBookingDetails();
    }
  }, [selectedBookingId]);

  const fetchCompanySettings = async () => {
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to load company settings", error);
    } else if (data) {
      setCompanySettings(data);
    }
  };

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
    const year = new Date().getFullYear();
    const nextYear = (year + 1).toString().slice(-2);
    setInvoiceNumber(`INV/${year}-${nextYear}/${bookingData.booking_number}`);

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
    const accommodationGstRate = 12;
    const foodGstRate = 5;
    const transportGstRate = 5;

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
          date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
          particulars: `Accommodation`,
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

    volvos.forEach((volvo) => {
      const totalAmount = volvo.total_amount || 0;
      const taxableAmount = totalAmount / (1 + transportGstRate / 100);
      const cgst = taxableAmount * 0.025;
      const sgst = taxableAmount * 0.025;

      items.push({
        date: new Date(volvo.travel_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
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

    safaris.forEach((safari) => {
      const totalAmount = safari.total_amount || 0;
      const taxableAmount = totalAmount / (1 + transportGstRate / 100);
      const cgst = taxableAmount * 0.025;
      const sgst = taxableAmount * 0.025;

      items.push({
        date: new Date(safari.safari_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
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

    vehicles.forEach((vehicle) => {
      const totalAmount = vehicle.total_amount || 0;
      const taxableAmount = totalAmount / (1 + transportGstRate / 100);
      const cgst = taxableAmount * 0.025;
      const sgst = taxableAmount * 0.025;

      items.push({
        date: vehicle.pickup_date ? new Date(vehicle.pickup_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '-',
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

    restaurants.forEach((order) => {
      const totalAmount = order.total_amount || 0;
      const taxableAmount = order.subtotal || totalAmount / (1 + foodGstRate / 100);
      
      items.push({
        date: new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
        particulars: `Extra Food`,
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
    
    return { totalAmount: Math.round(totalAmount), totalTaxable, totalCgst, totalSgst };
  };

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const exportToExcel = () => {
    if (!selectedBooking || billingItems.length === 0) {
      toast.error("Please select a booking first");
      return;
    }

    const totals = calculateTotals();
    const settings = companySettings;
    
    // Create worksheet data matching the professional invoice format
    const wsData: any[][] = [];
    
    // Company Header
    wsData.push([settings?.company_name || 'Company Name', '', '', '', '', '', '', '', '', '']);
    if (settings?.sub_title) wsData.push([settings.sub_title, '', '', '', '', '', '', '', '', '']);
    wsData.push([settings?.address || '', '', '', '', '', '', '', '', '', '']);
    wsData.push([`Contact No.: ${settings?.contact_no || ''}`, '', '', '', '', '', '', '', '', '']);
    wsData.push([`GSTIN: ${settings?.gstin || ''}`, '', '', '', '', '', '', '', '', '']);
    wsData.push([`Pan No.: ${settings?.pan_no || ''}`, '', '', '', '', '', 'INVOICE', '', '', '']);
    wsData.push([`HSN/SAC Code: ${settings?.hsn_code || '996311'}`, '', '', '', '', '', '', '', '', '']);
    wsData.push([]); // Empty row
    
    // Bill To section with Date and Invoice No
    wsData.push(['Bill To :', selectedBooking.customer_name || selectedBooking.reference || 'Guest', '', '', '', '', '', '', '', `DATE:${formatDate(invoiceDate)}`]);
    wsData.push(['Address :', selectedBooking.address || '-', '', '', '', '', '', '', '', `INVOICE No: ${invoiceNumber}`]);
    wsData.push([`GST NO : ${customerGstNo || 'N/A'}`, '', '', '', '', '', '', '', '', '']);
    wsData.push([`Pan No.: ${customerPanNo || 'N/A'}`, '', '', '', '', '', '', '', '', '']);
    wsData.push([]); // Empty row
    
    // Check In - Check Out
    wsData.push([`Check In - ${formatDate(selectedBooking.check_in_date)} - ${formatDate(selectedBooking.check_out_date)}`, '', '', '', '', '', '', '', '', '']);
    wsData.push(['Accommodation', '', '', '', '', '', '', '', '', '']);
    
    // Table Header
    wsData.push(['Date', 'BILLING PARTICULARS', '', 'Rate', 'QTY/No. Of Rooms', 'Total Amount', 'Taxable Amount', 'Rate CGST', 'CGST', 'Rate SGST', 'SGST']);
    
    // Billing Items
    billingItems.forEach(item => {
      wsData.push([
        item.date,
        item.particulars,
        '',
        item.rate.toFixed(0),
        item.qty,
        item.totalAmount.toFixed(0),
        item.taxableAmount.toFixed(2),
        item.cgstRate,
        item.cgstAmount.toFixed(0),
        item.sgstRate,
        item.sgstAmount.toFixed(0)
      ]);
    });
    
    // Empty row before totals
    wsData.push([]);
    wsData.push(['', 'Round Off', '', '', '', '', '', '', '', '', '']);
    
    // Totals row
    wsData.push(['', '', '', '', '', totals.totalAmount.toFixed(0), totals.totalTaxable.toFixed(2), '', totals.totalCgst.toFixed(2), '', totals.totalSgst.toFixed(2)]);
    
    // Total in words and company signature
    wsData.push([`TOTAL IN WORDS : ${numberToWords(totals.totalAmount)}`, '', '', '', '', '', '', `FOR ${settings?.company_name || 'Company'}`, '', '', '']);
    wsData.push(['Terms and Condition:', '', '', '', '', '', '', '', '', '', '']);
    wsData.push(['Note:', settings?.terms_conditions || 'This is computer generated invoice no signature and stamp required.', '', '', '', '', '', 'Authorised Signatory', '', '', '']);
    
    // Bank Details
    if (settings?.bank_name) {
      wsData.push([`1) Please issue Cheque/DD in favour of "${settings.company_name}".`, '', '', '', '', '', '', '', '', '', '']);
      wsData.push(['Account No', settings.account_no || '', settings.bank_name || '', '', '', '', '', '', '', '', '']);
      wsData.push(['IFSC Code', settings.ifsc_code || '', '', '', '', '', '', '', '', '', '']);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 30 }, // Particulars
      { wch: 5 },  // empty
      { wch: 10 }, // Rate
      { wch: 15 }, // Qty
      { wch: 14 }, // Total
      { wch: 14 }, // Taxable
      { wch: 10 }, // CGST Rate
      { wch: 10 }, // CGST
      { wch: 10 }, // SGST Rate
      { wch: 10 }, // SGST
    ];

    // Merge cells for header
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Company name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Sub title
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Address
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
      <div className="container mx-auto p-6 print:p-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h1 className="text-3xl font-bold">Billing / Invoice</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Company Settings
            </Button>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 print:block">
          {/* Booking Selection */}
          <Card className="lg:col-span-1 print:hidden">
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
              <div className="max-h-[300px] overflow-y-auto space-y-2">
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
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Customer Details</h4>
                <div>
                  <Label className="text-xs">Customer GST No.</Label>
                  <Input 
                    value={customerGstNo} 
                    onChange={(e) => setCustomerGstNo(e.target.value)} 
                    placeholder="Enter GST No."
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Customer PAN No.</Label>
                  <Input 
                    value={customerPanNo} 
                    onChange={(e) => setCustomerPanNo(e.target.value)} 
                    placeholder="Enter PAN No."
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Invoice Number</Label>
                  <Input 
                    value={invoiceNumber} 
                    onChange={(e) => setInvoiceNumber(e.target.value)} 
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Invoice Date</Label>
                  <Input 
                    type="date" 
                    value={invoiceDate} 
                    onChange={(e) => setInvoiceDate(e.target.value)} 
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Preview */}
          <Card className="lg:col-span-3 print:shadow-none print:border-none">
            <CardContent className="p-0">
              <div ref={printRef} className="bg-white text-black p-8 print:p-0" id="invoice-preview">
                {selectedBooking ? (
                  <div className="space-y-0">
                    {/* Professional Header */}
                    <div className="border-b-2 border-black pb-4 mb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h1 className="text-3xl font-bold tracking-tight mb-1">
                            {companySettings?.company_name || 'COMPANY NAME'}
                          </h1>
                          {companySettings?.sub_title && (
                            <p className="text-sm text-gray-600 mb-1">{companySettings.sub_title}</p>
                          )}
                          <p className="text-sm">{companySettings?.address || ''}</p>
                          {companySettings?.contact_no && (
                            <p className="text-sm">Contact No.: {companySettings.contact_no}</p>
                          )}
                          {companySettings?.gstin && (
                            <p className="text-sm font-medium">GSTIN: {companySettings.gstin}</p>
                          )}
                          {companySettings?.pan_no && (
                            <p className="text-sm">Pan No.: {companySettings.pan_no}</p>
                          )}
                          <p className="text-sm">HSN/SAC Code: {companySettings?.hsn_code || '996311'}</p>
                        </div>
                        <div className="text-right">
                          {companySettings?.logo_url && (
                            <img 
                              src={companySettings.logo_url} 
                              alt="Company Logo" 
                              className="h-20 w-auto object-contain ml-auto mb-2"
                            />
                          )}
                          <div className="text-2xl font-bold text-primary border-2 border-primary px-4 py-1 inline-block">
                            INVOICE
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bill To Section */}
                    <div className="border border-black mb-4">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-black">
                            <td className="p-2 w-24 font-medium border-r border-black">Bill To :</td>
                            <td className="p-2 font-medium">{selectedBooking.customer_name || selectedBooking.reference || 'Guest'}</td>
                            <td className="p-2 text-right font-medium">DATE:{formatDate(invoiceDate)}</td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="p-2 font-medium border-r border-black">Address :</td>
                            <td className="p-2">{selectedBooking.address || '-'}</td>
                            <td className="p-2 text-right font-medium">INVOICE No: {invoiceNumber}</td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="p-2 border-r border-black" colSpan={2}>GST NO : {customerGstNo || 'N/A'}</td>
                            <td className="p-2"></td>
                          </tr>
                          <tr>
                            <td className="p-2 border-r border-black" colSpan={2}>Pan No.: {customerPanNo || 'N/A'}</td>
                            <td className="p-2"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Check In/Out */}
                    <div className="text-center font-medium py-2 border border-black mb-0">
                      Check In - {formatDate(selectedBooking.check_in_date)} - {formatDate(selectedBooking.check_out_date)}
                    </div>
                    <div className="text-center font-medium py-1 bg-gray-100 border-x border-black">
                      Accommodation
                    </div>

                    {/* Billing Table */}
                    <table className="w-full text-xs border border-black border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black p-2 text-left">Date</th>
                          <th className="border border-black p-2 text-left">BILLING PARTICULARS</th>
                          <th className="border border-black p-2 text-right">Rate</th>
                          <th className="border border-black p-2 text-right">QTY/No.<br/>Of Rooms</th>
                          <th className="border border-black p-2 text-right">Total<br/>Amount</th>
                          <th className="border border-black p-2 text-right">Taxable<br/>Amount</th>
                          <th className="border border-black p-2 text-right">Rate<br/>CGST</th>
                          <th className="border border-black p-2 text-right">CGST</th>
                          <th className="border border-black p-2 text-right">Rate<br/>SGST</th>
                          <th className="border border-black p-2 text-right">SGST</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingItems.map((item, index) => (
                          <tr key={index}>
                            <td className="border border-black p-2">{item.date}</td>
                            <td className="border border-black p-2 font-medium">{item.particulars}</td>
                            <td className="border border-black p-2 text-right">{item.rate.toFixed(0)}</td>
                            <td className="border border-black p-2 text-right">{item.qty}</td>
                            <td className="border border-black p-2 text-right">{item.totalAmount.toFixed(0)}</td>
                            <td className="border border-black p-2 text-right">{item.taxableAmount.toFixed(0)}</td>
                            <td className="border border-black p-2 text-right">{item.cgstRate}</td>
                            <td className="border border-black p-2 text-right">{item.cgstAmount.toFixed(0)}</td>
                            <td className="border border-black p-2 text-right">{item.sgstRate}</td>
                            <td className="border border-black p-2 text-right">{item.sgstAmount.toFixed(0)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="border border-black p-2"></td>
                          <td className="border border-black p-2 text-center">Round Off</td>
                          <td className="border border-black p-2"></td>
                          <td className="border border-black p-2"></td>
                          <td className="border border-black p-2"></td>
                          <td className="border border-black p-2"></td>
                          <td className="border border-black p-2"></td>
                          <td className="border border-black p-2"></td>
                          <td className="border border-black p-2"></td>
                          <td className="border border-black p-2"></td>
                        </tr>
                        <tr className="font-bold bg-gray-50">
                          <td className="border border-black p-2" colSpan={4}></td>
                          <td className="border border-black p-2 text-right">{totals.totalAmount.toFixed(0)}</td>
                          <td className="border border-black p-2 text-right">{totals.totalTaxable.toFixed(2)}</td>
                          <td className="border border-black p-2"></td>
                          <td className="border border-black p-2 text-right">{totals.totalCgst.toFixed(2)}</td>
                          <td className="border border-black p-2"></td>
                          <td className="border border-black p-2 text-right">{totals.totalSgst.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Total in Words and Signature */}
                    <table className="w-full text-xs border-x border-b border-black">
                      <tbody>
                        <tr>
                          <td className="p-2 font-medium">
                            TOTAL IN WORDS : {numberToWords(totals.totalAmount)}
                          </td>
                          <td className="p-2 text-right font-medium">
                            FOR {companySettings?.company_name || 'Company'}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Terms and Condition:</td>
                          <td className="p-2"></td>
                        </tr>
                        <tr>
                          <td className="p-2">
                            <span className="font-medium">Note:</span> {companySettings?.terms_conditions || 'This is computer generated invoice no signature and stamp required.'}
                          </td>
                          <td className="p-2 text-right">Authorised Signatory</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Bank Details */}
                    {companySettings?.bank_name && (
                      <table className="w-full text-xs border-x border-b border-black">
                        <tbody>
                          <tr>
                            <td className="p-2" colSpan={3}>
                              1) Please issue Cheque/DD in favour of "{companySettings.company_name}".
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 w-24">Account No</td>
                            <td className="p-2 w-32">{companySettings.account_no}</td>
                            <td className="p-2">{companySettings.bank_name}</td>
                          </tr>
                          <tr>
                            <td className="p-2">IFSC Code</td>
                            <td className="p-2" colSpan={2}>{companySettings.ifsc_code}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground print:hidden">
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
            padding: 10mm;
            font-size: 10pt;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
