import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import sitaraLogo from "@/assets/sitara-logo.png.asset.json";
import winsomeLogo from "@/assets/winsome-logo.png.asset.json";

// Lovable asset CDN is only served from the *.lovable.app host. On custom
// domains (e.g. vkddelhi.com) the /__l5e/ path returns an error, so fall back
// to the published Lovable host for asset URLs.
const ASSET_HOST = "https://terra-lodge-manager.lovable.app";

function hostedAssetUrl(path: string) {
  if (!path) return "";
  try {
    const origin = window.location.origin;
    const base = /lovable\.app$|localhost|127\.0\.0\.1/.test(window.location.hostname)
      ? origin
      : ASSET_HOST;
    return new URL(path, base).href;
  } catch {
    return path;
  }
}


interface BookingConfirmationVoucherProps {
  bookingId: string;
  onClose: () => void;
}

type Brand = {
  key: "winsome" | "sitara" | "default";
  logo: string | null;
  name: string;
  subTitle: string;
  unitLine: string;
  address: string;
  contact: string;
};

const BRANDS: Record<"winsome" | "sitara", Omit<Brand, "key">> = {
  winsome: {
    logo: hostedAssetUrl(winsomeLogo.url),
    name: "Winsome Resort",
    subTitle: "Jim Corbett, Ramnagar",
    unitLine: "(a unit of Mukut Hotels and Resort Pvt Ltd)",
    address: "Winsome Resort, Jim Corbett, Ramnagar",
    contact: "9560002045/46",
  },
  sitara: {
    logo: hostedAssetUrl(sitaraLogo.url),
    name: "Hotel Sitara International",
    subTitle: "Manali",
    unitLine: "(a unit of Mukut Hotels and Resort Pvt Ltd)",
    address: "Hotel Sitara International, Manali",
    contact: "9882171103/9667788928",
  },
};

function detectBrand(hotelName?: string | null): "winsome" | "sitara" | null {
  const n = (hotelName || "").toLowerCase();
  if (n.includes("sitara")) return "sitara";
  if (n.includes("winsome")) return "winsome";
  return null;
}

export function BookingConfirmationVoucher({ bookingId, onClose }: BookingConfirmationVoucherProps) {
  const [booking, setBooking] = useState<any>(null);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [roomNamesMap, setRoomNamesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
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

      const bk = bookingRes.data;
      const hbs = hotelRes.data || [];
      const settings = settingsRes.data;

      setBooking(bk);
      setHotelBookings(hbs);
      setCompanySettings(settings);

      // Resolve room_type UUIDs to room names
      let roomMap: Record<string, string> = {};
      const roomTypeIds = hbs.map((hb: any) => hb.room_type).filter(Boolean);
      if (roomTypeIds.length > 0) {
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("id, room_type, room_number")
          .in("id", roomTypeIds);
        (roomsData || []).forEach((r: any) => {
          roomMap[r.id] = r.room_type || r.room_number;
        });
        setRoomNamesMap(roomMap);
      }

      // Brand resolution based on the hotel of this booking
      const hotelName = hbs[0]?.own_hotels?.name || hbs[0]?.another_hotels?.name || "";
      const brandKey = detectBrand(hotelName);
      const brand: Brand = brandKey
        ? { key: brandKey, ...BRANDS[brandKey] }
        : {
            key: "default",
            logo: settings?.logo_url || null,
            name: settings?.company_name || hotelName || "Your Hotel",
            subTitle: settings?.sub_title || "",
            unitLine: "",
            address: settings?.address || "",
            contact: settings?.contact_no || "",
          };

      // Meal plan / package details — stored in hotel_bookings.notes either as
      // "Package: XYZ" (selected package) or as free-text custom package note
      const packageFromNotes = hbs
        .map((hb: any) => {
          const n = (hb.notes || "").trim();
          if (!n) return null;
          const m = n.match(/Package:\s*([^|]+)/);
          return m ? m[1].trim() : n;
        })
        .filter(Boolean)
        .join(", ");
      const mealPlan =
        packageFromNotes ||
        hbs.map((hb: any) => hb.meal_plan).filter(Boolean).join(", ") ||
        (bk as any)?.package_type ||
        bk?.special_requests ||
        "-";


      const numberOfRooms = hbs.reduce((s: number, hb: any) => s + (hb.number_of_rooms || 0), 0);
      const roomType =
        hbs.map((hb: any) => (hb.room_type ? roomMap[hb.room_type] || hb.room_type : null)).filter(Boolean).join(", ") ||
        "-";

      setFields({
        brandKey: brand.key,
        logoUrl: brand.logo || "",
        companyName: brand.name,
        subTitle: brand.subTitle,
        unitLine: brand.unitLine,
        address: brand.address,
        contact: brand.contact,
        guestName: bk?.customer_name || "",
        contactNo: bk?.contact_no || "",
        bookingNumber: bk?.booking_number || "",
        checkIn: bk?.check_in_date ? fmt(bk.check_in_date) : "",
        checkOut: bk?.check_out_date ? fmt(bk.check_out_date) : "",
        numberOfRooms: numberOfRooms ? String(numberOfRooms) : "-",
        roomType,
        persons: String(bk?.adults || 0),
        kids: String(bk?.children || 0),
        extraMattress: "-",
        mealPlan,
        billingInstruction: bk?.notes || "",
        inclusions: (brand.key === "sitara"
          ? [
              "Welcome drink (Non-alcoholic) on arrival",
              "Meals as per plan (at Restaurant)",
              "Complimentary use of Wifi facility",
            ]
          : [
              "Welcome drink (Non-alcoholic) on arrival",
              "Meals as per plan (at Restaurant)",
              "Evening Hi Tea with cookies (at Restaurant)",
              "Complimentary use of Swimming Pool (costumes mandatory)",
              "Complimentary use of Gym",
              "Complimentary use of Indoor/Outdoor games",
              "Complimentary use of Adventure activities",
              "Complimentary use of Wifi facility",
            ]
        ).join("\n"),
        specialRequests:
          bk?.special_requests ||
          "Requests for anything not included above will be subject to availability and to be intimated at the time of check-in",
        bankAccountName: settings?.company_name || brand.name || "",
        bankAccountNo: settings?.account_no || "",
        bankName: settings?.bank_name || "",
        bankIfsc: settings?.ifsc_code || "",
        bankBranch: settings?.branch_name || "",
        footerSalutation: "Thanks & Regards,",
        footerCompany: brand.name,
        footerAddress: brand.address,
        footerMobile: brand.contact,
      });


    } catch (error) {
      console.error("Error fetching voucher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string, v: string) => setFields((f) => ({ ...f, [k]: v }));

  const Val = ({ k, className = "" }: { k: string; className?: string }) =>
    editing ? (
      <input
        value={fields[k] ?? ""}
        onChange={(e) => set(k, e.target.value)}
        className={`w-full border border-blue-400 rounded px-1 py-0.5 text-sm bg-blue-50 ${className}`}
      />
    ) : (
      <span className={className}>{fields[k] || "-"}</span>
    );

  const Multi = ({ k, rows = 4 }: { k: string; rows?: number }) =>
    editing ? (
      <textarea
        value={fields[k] ?? ""}
        rows={rows}
        onChange={(e) => set(k, e.target.value)}
        className="w-full border border-blue-400 rounded px-2 py-1 text-sm bg-blue-50"
      />
    ) : null;

  const lines = (k: string) =>
    (fields[k] || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);



  if (loading) return null;
  if (!booking) return null;

  const companyName = fields.companyName;
  const companyContact = fields.contact;
  const companyAddress = fields.address;
  const hotelName = companyName;

  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-auto print:block" id="voucher-container">
      <div ref={voucherRef} className="max-w-3xl mx-auto p-8 pb-28 bg-white text-black" id="voucher-content">
        {/* Header */}
        <div data-pdf-section className="text-center mb-6 border-b-2 border-gray-800 pb-4">
          {fields.logoUrl && (
            <img src={fields.logoUrl} alt={companyName} crossOrigin="anonymous" className="h-16 mx-auto mb-2 object-contain" />
          )}
          <h1 className="text-2xl font-bold tracking-wide">
            <Val k="companyName" className="text-center font-bold" />
          </h1>
          <p className="text-sm text-gray-600">
            <Val k="subTitle" />
          </p>
          {(fields.unitLine || editing) && (
            <p className="text-xs text-gray-600 italic">
              <Val k="unitLine" />
            </p>
          )}
          <p className="text-lg font-bold mt-3 underline">Booking Confirmation Voucher</p>
        </div>

        {/* Resort Address */}
        <div data-pdf-section className="text-center mb-4 text-sm">
          <p className="font-semibold">
            Resort Address - <Val k="address" />
          </p>
          <p>
            Contact number - <Val k="contact" />
          </p>
        </div>

        {/* Greeting */}
        <div data-pdf-section className="mb-6 text-sm bg-gray-50 p-4 rounded border">
          <p className="font-semibold mb-2">Dear {fields.guestName || "Sir/Ma'am"},</p>
          <p className="mb-2">Namaskar!!!</p>
          <p>Thank you for choosing {companyName}. We are pleased to confirm your reservation as per the details below:-</p>
        </div>

        {/* Booking Details Table */}
        <div data-pdf-section className="mb-6">
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <tbody>
              <tr className="bg-gray-100">
                <td className="border border-gray-400 p-2 font-semibold w-1/2">Booking Confirmation Number</td>
                <td className="border border-gray-400 p-2"><Val k="bookingNumber" /></td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Guest Name</td>
                <td className="border border-gray-400 p-2"><Val k="guestName" /></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-2 font-semibold">Contact No</td>
                <td className="border border-gray-400 p-2"><Val k="contactNo" /></td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Check In</td>
                <td className="border border-gray-400 p-2"><Val k="checkIn" /></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-2 font-semibold">Check Out</td>
                <td className="border border-gray-400 p-2"><Val k="checkOut" /></td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">No of Room</td>
                <td className="border border-gray-400 p-2"><Val k="numberOfRooms" /></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-2 font-semibold">Room Type</td>
                <td className="border border-gray-400 p-2"><Val k="roomType" /></td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">No of Person</td>
                <td className="border border-gray-400 p-2"><Val k="persons" /></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-2 font-semibold">No of Kids</td>
                <td className="border border-gray-400 p-2"><Val k="kids" /></td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold">Extra Mattress</td>
                <td className="border border-gray-400 p-2"><Val k="extraMattress" /></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-2 font-semibold">Meal Plan / Package</td>
                <td className="border border-gray-400 p-2"><Val k="mealPlan" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Billing Instruction */}
        {(fields.billingInstruction || editing) && (
          <div data-pdf-section className="mb-6 text-sm">
            <p className="flex gap-2">
              <span className="font-semibold whitespace-nowrap">Billing Instruction:</span>
              <Val k="billingInstruction" />
            </p>
          </div>
        )}

        {/* Inclusions */}
        <div data-pdf-section className="mb-6 text-sm">
          <h3 className="font-bold mb-2 underline">Inclusions:</h3>
          {editing ? (
            <>
              <Multi k="inclusions" rows={8} />
              <p className="text-xs text-gray-500 mt-1">One inclusion per line</p>
            </>
          ) : (
            <ul className="list-disc ml-6 space-y-1">
              {lines("inclusions").map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Bank Details */}
        {(editing || fields.bankName || fields.bankAccountNo) && (
          <div data-pdf-section className="mb-6">
            <h3 className="font-bold mb-2 text-sm underline">BANK DETAILS</h3>
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <tbody>
                <tr className="bg-gray-100">
                  <td className="border border-gray-400 p-2 w-8">1</td>
                  <td className="border border-gray-400 p-2 font-semibold">Beneficiary / Account Name</td>
                  <td className="border border-gray-400 p-2"><Val k="bankAccountName" /></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2">2</td>
                  <td className="border border-gray-400 p-2 font-semibold">Account No.</td>
                  <td className="border border-gray-400 p-2"><Val k="bankAccountNo" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-400 p-2">3</td>
                  <td className="border border-gray-400 p-2 font-semibold">BANK Name</td>
                  <td className="border border-gray-400 p-2"><Val k="bankName" /></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2">4</td>
                  <td className="border border-gray-400 p-2 font-semibold">RTGS/NEFT/IFSC</td>
                  <td className="border border-gray-400 p-2"><Val k="bankIfsc" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-400 p-2">5</td>
                  <td className="border border-gray-400 p-2 font-semibold">Branch Name / Address</td>
                  <td className="border border-gray-400 p-2"><Val k="bankBranch" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Special Requests */}
        <div data-pdf-section className="mb-4 text-sm">
          <h3 className="font-bold mb-1">SPECIAL REQUESTS</h3>
          {editing ? (
            <Multi k="specialRequests" rows={3} />
          ) : (
            lines("specialRequests").map((l, i) => <p key={i}>{l}</p>)
          )}
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
          <p className="font-semibold"><Val k="footerSalutation" className="font-semibold" /></p>
          <p><Val k="footerCompany" /></p>
          <p className="text-gray-600"><Val k="footerAddress" /></p>
          <p className="text-gray-600">{editing ? <Val k="footerMobile" /> : (fields.footerMobile ? `Mobile: ${fields.footerMobile}` : "")}</p>
        </div>

      </div>

      {/* Action Buttons - hidden during print */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex flex-wrap justify-center gap-3 print:hidden z-[10000]">
        <button
          onClick={() => setEditing((e) => !e)}
          className={`px-6 py-2 rounded-md font-medium text-white ${editing ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}`}
        >
          {editing ? "✔ Done Editing" : "✏️ Edit Voucher"}
        </button>
        <button
          onClick={async () => {
            setEditing(false);
            // Let React commit the read-only render before capturing (two frames + tick),
            // otherwise the edit inputs get baked into the PDF and look blurry.
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
            await new Promise((r) => setTimeout(r, 250));
            const container = voucherRef.current;
            if (!container) return;
            const sections = Array.from(container.querySelectorAll<HTMLElement>('[data-pdf-section]'));
            if (sections.length === 0) return;

             await document.fonts?.ready;
             const voucherImages = Array.from(container.querySelectorAll<HTMLImageElement>('img'));
             await Promise.all(voucherImages.map((image) => {
               if (image.complete) return Promise.resolve();
               return new Promise<void>((resolve) => {
                 image.addEventListener('load', () => resolve(), { once: true });
                 image.addEventListener('error', () => resolve(), { once: true });
               });
             }));

            const A4_W = 210, A4_H = 297, MARGIN = 12;
            const CONTENT_W = A4_W - MARGIN * 2;
            const CONTENT_H = A4_H - MARGIN * 2;
            const GAP = 3;

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            let cursorY = MARGIN;

            for (const section of sections) {
               // Capture a padded clone instead of the live element. html2canvas can
               // otherwise trim the final line's descenders at an element boundary.
               const captureHost = document.createElement('div');
               captureHost.style.position = 'fixed';
               captureHost.style.left = '-10000px';
               captureHost.style.top = '0';
               captureHost.style.width = `${container.clientWidth}px`;
               captureHost.style.padding = '4px 2px 8px';
               captureHost.style.boxSizing = 'border-box';
               captureHost.style.background = '#ffffff';
               captureHost.style.color = '#000000';

               const clone = section.cloneNode(true) as HTMLElement;
               clone.style.margin = '0';
               clone.style.width = '100%';
               clone.style.boxSizing = 'border-box';

               // Safety net: if any editable field is still rendered as an input/textarea,
               // flatten it to plain text so the PDF shows crisp text instead of form boxes.
               clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((el) => {
                 const text = document.createElement('span');
                 text.textContent = el.value || el.getAttribute('value') || '';
                 text.style.display = 'block';
                 text.style.font = 'inherit';
                 text.style.color = '#000000';
                 text.style.whiteSpace = 'pre-wrap';
                 el.replaceWith(text);
               });

               captureHost.appendChild(clone);
               document.body.appendChild(captureHost);

               let canvas: HTMLCanvasElement;
               try {
                 const cloneImages = Array.from(captureHost.querySelectorAll<HTMLImageElement>('img'));
                 await Promise.all(cloneImages.map((image) => image.decode().catch(() => undefined)));
                 canvas = await html2canvas(captureHost, {
                   scale: 3,
                   useCORS: true,
                   allowTaint: false,
                   backgroundColor: '#ffffff',
                   logging: false,
                   width: captureHost.scrollWidth,
                   height: captureHost.scrollHeight,
                   windowWidth: container.clientWidth,
                   scrollX: 0,
                   scrollY: 0,
                 });
               } finally {
                 captureHost.remove();
               }

              let imgW = CONTENT_W;
              let imgH = (canvas.height * imgW) / canvas.width;

              // Never slice through a section (that cuts text in half).
              // If it is taller than a full page, scale it down to fit the page.
              if (imgH > CONTENT_H) {
                const ratio = CONTENT_H / imgH;
                imgH = CONTENT_H;
                imgW = CONTENT_W * ratio;
                if (cursorY > MARGIN) {
                  pdf.addPage();
                  cursorY = MARGIN;
                }
              } else if (cursorY + imgH > A4_H - MARGIN && cursorY > MARGIN) {
                pdf.addPage();
                cursorY = MARGIN;
              }

              const offsetX = MARGIN + (CONTENT_W - imgW) / 2;
               pdf.addImage(canvas.toDataURL('image/png'), 'PNG', offsetX, cursorY, imgW, imgH, undefined, 'NONE');
              cursorY += imgH + GAP;
            }


            pdf.save(`Booking_${fields.bookingNumber || bookingId}.pdf`);
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          📥 Download PDF
        </button>
        <button
          onClick={() => {
            const phone = fields.contactNo?.replace(/[^0-9]/g, '') || '';
            const message = encodeURIComponent(
              `*Booking Confirmation Voucher*\n\n` +
              `Dear ${fields.guestName || 'Guest'},\n\n` +
              `Your booking has been confirmed!\n\n` +
              `📋 *Booking No:* ${fields.bookingNumber}\n` +
              `📅 *Check In:* ${fields.checkIn}\n` +
              `📅 *Check Out:* ${fields.checkOut}\n` +
              `👥 *Persons:* ${fields.persons} Adults, ${fields.kids} Kids\n` +
              `🏨 *Hotel:* ${hotelName}\n` +
              `🛏️ *Rooms:* ${fields.numberOfRooms}\n` +
              `🍽️ *Meal Plan:* ${fields.mealPlan}\n\n` +
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
            const subject = encodeURIComponent(`Booking Confirmation - ${fields.bookingNumber}`);
            const body = encodeURIComponent(
              `Dear ${fields.guestName || 'Guest'},\n\n` +
              `Your booking has been confirmed!\n\n` +
              `Booking No: ${fields.bookingNumber}\n` +
              `Check In: ${fields.checkIn}\n` +
              `Check Out: ${fields.checkOut}\n` +
              `Persons: ${fields.persons} Adults, ${fields.kids} Kids\n` +
              `Hotel: ${hotelName}\n` +
              `Rooms: ${fields.numberOfRooms}\n` +
              `Meal Plan: ${fields.mealPlan}\n\n` +
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

function fmt(dateStr: string) {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}
