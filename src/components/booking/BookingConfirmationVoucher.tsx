import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface BookingConfirmationVoucherProps {
  bookingId: string;
  onClose: () => void;
}

export function BookingConfirmationVoucher({ bookingId, onClose }: BookingConfirmationVoucherProps) {
  const [booking, setBooking] = useState<any>(null);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [roomNamesMap, setRoomNamesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const voucherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [bookingId]);

  const fetchData = async () => {
    try {
      const [bookingRes, hotelRes, settingsRes] = await Promise.all([
        supabase.from("bookings").select("*, agents(name)").eq("id", bookingId).single(),
        supabase.from("hotel_bookings").select("*, own_hotels(name), another_hotels(name)").eq("booking_id", bookingId),
        supabase.from("company_settings").select("*").limit(1).single(),
      ]);

      setBooking(bookingRes.data);
      setHotelBookings(hotelRes.data || []);
      setCompanySettings(settingsRes.data);

      // Resolve room_type UUIDs to room names
      const roomTypeIds = (hotelRes.data || [])
        .map((hb: any) => hb.room_type)
        .filter(Boolean);
      if (roomTypeIds.length > 0) {
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("id, room_type, room_number")
          .in("id", roomTypeIds);
        if (roomsData) {
          const map: Record<string, string> = {};
          roomsData.forEach((r: any) => {
            map[r.id] = r.room_type || r.room_number;
          });
          setRoomNamesMap(map);
        }
      }
    } catch (error) {
      console.error("Error fetching voucher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const companyName = companySettings?.company_name || "Your Hotel";
  const companySubTitle = companySettings?.sub_title || "";
  const companyAddress = companySettings?.address || "";
  const companyContact = companySettings?.contact_no || "";

  if (loading) return null;
  if (!booking) return null;

  const hotelName = hotelBookings[0]?.own_hotels?.name || hotelBookings[0]?.another_hotels?.name || companyName;
  const numberOfRooms = hotelBookings.reduce((sum, hb) => sum + (hb.number_of_rooms || 0), 0);
  const roomType = hotelBookings.map(hb => hb.room_type ? (roomNamesMap[hb.room_type] || hb.room_type) : null).filter(Boolean).join(", ") || "-";

  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-auto print:block" id="voucher-container">
      <div ref={voucherRef} className="max-w-3xl mx-auto p-8 bg-white text-black" id="voucher-content">
        {/* Header */}
        <div data-pdf-section className="text-center mb-6 border-b-2 border-gray-800 pb-4">
          {companySettings?.logo_url && (
            <img src={companySettings.logo_url} alt={companyName} className="h-16 mx-auto mb-2" />
          )}
          <h1 className="text-2xl font-bold tracking-wide">{companyName}</h1>
          {companySubTitle && <p className="text-sm text-gray-600">{companySubTitle}</p>}
          <p className="text-lg font-bold mt-3 underline">Booking Confirmation Voucher</p>
        </div>

        {/* Resort Address */}
        <div data-pdf-section className="text-center mb-4 text-sm">
          <p className="font-semibold">Resort Address - {companyAddress}</p>
          <p>Contact number - {companyContact}</p>
        </div>

        {/* Greeting */}
        <div data-pdf-section className="mb-6 text-sm bg-gray-50 p-4 rounded border">
          <p className="font-semibold mb-2">Dear {booking.customer_name || "Sir/Ma'am"},</p>
          <p className="mb-2">Namaskar!!!</p>
          <p>Thank you for choosing {companyName}. We are pleased to confirm your reservation as per the details below:-</p>
        </div>

        {/* Booking Details Table */}
        <div data-pdf-section className="mb-6">
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <tbody>
              <tr className="bg-gray-100">
                <td className="border border-gray-400 p-2 font-semibold w-1/2">Booking Confirmation Number</td>
                <td className="border border-gray-400 p-2">{booking.booking_number}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Guest Name</td>
                <td className="border border-gray-400 p-2">{booking.customer_name || "-"}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-2 font-semibold">Contact No</td>
                <td className="border border-gray-400 p-2">{booking.contact_no || "-"}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Check In</td>
                <td className="border border-gray-400 p-2">{formatDate(booking.check_in_date)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-2 font-semibold">Check Out</td>
                <td className="border border-gray-400 p-2">{formatDate(booking.check_out_date)}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">No of Room</td>
                <td className="border border-gray-400 p-2">{numberOfRooms || "-"}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-2 font-semibold">Room Type</td>
                <td className="border border-gray-400 p-2">{roomType}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">No of Person</td>
                <td className="border border-gray-400 p-2">{booking.adults || 0}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-2 font-semibold">No of Kids</td>
                <td className="border border-gray-400 p-2">{booking.children || 0}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Extra Mattress</td>
                <td className="border border-gray-400 p-2">-</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-2 font-semibold">Meal Plan</td>
                <td className="border border-gray-400 p-2">{booking.special_requests || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Billing Instruction */}
        {booking.notes && (
          <div data-pdf-section className="mb-6 text-sm">
            <p><span className="font-semibold">Billing Instruction:</span> {booking.notes}</p>
          </div>
        )}

        {/* Inclusions */}
        <div data-pdf-section className="mb-6 text-sm">
          <h3 className="font-bold mb-2 underline">Inclusions:</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Welcome drink (Non-alcoholic) on arrival</li>
            <li>Meals as per plan (at Restaurant)</li>
            <li>Evening Hi Tea with cookies (at Restaurant)</li>
            <li>Complimentary use of Swimming Pool (costumes mandatory)</li>
            <li>Complimentary use of Gym</li>
            <li>Complimentary use of Indoor/Outdoor games</li>
            <li>Complimentary use of Adventure activities</li>
            <li>Complimentary use of Wifi facility</li>
          </ul>
        </div>

        {/* Bank Details */}
        {companySettings && (companySettings.bank_name || companySettings.account_no) && (
          <div data-pdf-section className="mb-6">
            <h3 className="font-bold mb-2 text-sm underline">BANK DETAILS</h3>
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <tbody>
                <tr className="bg-gray-100">
                  <td className="border border-gray-400 p-2 w-8">1</td>
                  <td className="border border-gray-400 p-2 font-semibold">Beneficiary / Account Name</td>
                  <td className="border border-gray-400 p-2">{companyName}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2">2</td>
                  <td className="border border-gray-400 p-2 font-semibold">Account No.</td>
                  <td className="border border-gray-400 p-2">{companySettings.account_no || "-"}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-400 p-2">3</td>
                  <td className="border border-gray-400 p-2 font-semibold">BANK Name</td>
                  <td className="border border-gray-400 p-2">{companySettings.bank_name || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2">4</td>
                  <td className="border border-gray-400 p-2 font-semibold">RTGS/NEFT/IFSC</td>
                  <td className="border border-gray-400 p-2">{companySettings.ifsc_code || "-"}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-400 p-2">5</td>
                  <td className="border border-gray-400 p-2 font-semibold">Branch Name / Address</td>
                  <td className="border border-gray-400 p-2">{companySettings.branch_name || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Special Requests */}
        <div data-pdf-section className="mb-4 text-sm">
          <h3 className="font-bold mb-1">SPECIAL REQUESTS</h3>
          <p>Requests for anything not included above will be subject to availability and to be intimated at the time of check-in</p>
        </div>

        {/* Contact Info */}
        <div data-pdf-section className="mb-4 text-sm">
          <p>Please share <span className="font-bold">Front Office Number: {companyContact}</span> with your guest and share his number to us too, for us to share the location and to coordinate.</p>
        </div>

        {/* Check-In/Check-Out Policy */}
        <div data-pdf-section className="mb-4 text-sm">
          <h3 className="font-bold mb-1">CHECK-IN/CHECK-OUT POLICY</h3>
          <p><span className="font-bold">Our check-in time is 1 pm and our check-out time is 10 am.</span> If you want to check-in early and check-out late, we will be happy to oblige, subject to availability and at a nominal additional charge.</p>
        </div>

        {/* Payment Policy */}
        <div data-pdf-section className="mb-4 text-sm">
          <h3 className="font-bold mb-1 underline">Payment Policy</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Need 50% of the Total Amount at the time of Confirmation</li>
            <li>Need Remaining 30% of the Total Amount, before 15 days from the Date of Booking (Check In)</li>
            <li>Need Full Payment to be done before 7 days of the Booking (Check In)</li>
          </ul>
        </div>

        {/* Cancellation Policy */}
        <div data-pdf-section className="mb-6 text-sm">
          <h3 className="font-bold mb-1 underline">Cancellation/Refund Policy:</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>100% of the total amount be refunded if Cancellation made before 21 days of check in</li>
            <li>50% of the total amount be refunded if cancellation made before 15 days of check in</li>
            <li>25% of the total amount be refunded if cancellation made before 7 days of check in</li>
            <li>No refund in case of no show or cancellation within 5 days of check in</li>
            <li>Partial Cancellation of booking is treated as Cancellation</li>
          </ul>
        </div>

        {/* Footer */}
        <div data-pdf-section className="text-sm border-t border-gray-300 pt-4">
          <p className="font-semibold">Thanks & Regards,</p>
          <p>{companyName}</p>
          {companyAddress && <p className="text-gray-600">{companyAddress}</p>}
          {companyContact && <p className="text-gray-600">Mobile: {companyContact}</p>}
        </div>
      </div>

      {/* Action Buttons - hidden during print */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex justify-center gap-4 print:hidden z-[10000]">
        <button
          onClick={() => {
            window.print();
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          📥 Download PDF
        </button>
        <button
          onClick={() => {
            const phone = booking.contact_no?.replace(/[^0-9]/g, '') || '';
            const message = encodeURIComponent(
              `*Booking Confirmation Voucher*\n\n` +
              `Dear ${booking.customer_name || 'Guest'},\n\n` +
              `Your booking has been confirmed!\n\n` +
              `📋 *Booking No:* ${booking.booking_number}\n` +
              `📅 *Check In:* ${formatDate(booking.check_in_date)}\n` +
              `📅 *Check Out:* ${formatDate(booking.check_out_date)}\n` +
              `👥 *Persons:* ${booking.adults || 0} Adults, ${booking.children || 0} Kids\n` +
              `🏨 *Hotel:* ${hotelName}\n` +
              `🛏️ *Rooms:* ${numberOfRooms || '-'}\n\n` +
              `💰 *Total Amount:* ₹${booking.total_amount || 0}\n` +
              `✅ *Paid:* ₹${booking.paid_amount || 0}\n` +
              `⏳ *Due:* ₹${booking.due_amount || 0}\n\n` +
              `Thank you for choosing ${companyName}!\n` +
              `Contact: ${companyContact}`
            );
            const whatsappUrl = phone
              ? `https://wa.me/91${phone}?text=${message}`
              : `https://wa.me/?text=${message}`;
            window.open(whatsappUrl, '_blank');
          }}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
        >
          📱 Share on WhatsApp
        </button>
        <button
          onClick={() => {
            const subject = encodeURIComponent(`Booking Confirmation - ${booking.booking_number}`);
            const body = encodeURIComponent(
              `Dear ${booking.customer_name || 'Guest'},\n\n` +
              `Your booking has been confirmed!\n\n` +
              `Booking No: ${booking.booking_number}\n` +
              `Check In: ${formatDate(booking.check_in_date)}\n` +
              `Check Out: ${formatDate(booking.check_out_date)}\n` +
              `Persons: ${booking.adults || 0} Adults, ${booking.children || 0} Kids\n` +
              `Hotel: ${hotelName}\n` +
              `Rooms: ${numberOfRooms || '-'}\n\n` +
              `Total Amount: Rs. ${booking.total_amount || 0}\n` +
              `Paid: Rs. ${booking.paid_amount || 0}\n` +
              `Due: Rs. ${booking.due_amount || 0}\n\n` +
              `Thank you for choosing ${companyName}!\n` +
              `Contact: ${companyContact}\n` +
              `Address: ${companyAddress}`
            );
            const email = booking.email || '';
            window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
          }}
          className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
        >
          ✉️ Send Email
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium"
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
