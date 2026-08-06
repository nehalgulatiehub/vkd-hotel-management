import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRoomNames } from "@/hooks/useRoomNames";

interface BookingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  serviceType?: "safari" | "vehicle" | "hotel" | "volvo_dm" | "volvo_md" | "visa" | "cruise";
  serviceData?: any;
}

const normalizeRoute = (route: unknown) =>
  String(route ?? "").toLowerCase().replace(/\s+/g, "").replace(/[-_]/g, "");

export function BookingDetailsDialog({
  open,
  onOpenChange,
  booking,
  serviceData,
}: BookingDetailsDialogProps) {
  const { roomName } = useRoomNames();
  const [data, setData] = useState<any>(null);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [fullBooking, setFullBooking] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!open || !booking?.id) return;
      const [bookingRes, hotels, safaris, volvos, vehicles, visas, cruises, transp] = await Promise.all([
        supabase.from("bookings").select("*, agents(name)").eq("id", booking.id).maybeSingle(),
        supabase
          .from("hotel_bookings")
          .select("*, own_hotels(name), another_hotels(name)")
          .eq("booking_id", booking.id),
        supabase.from("safari_bookings").select("*").eq("booking_id", booking.id),
        supabase.from("volvo_bookings").select("*").eq("booking_id", booking.id),
        supabase.from("vehicle_bookings").select("*, transporters(name)").eq("booking_id", booking.id),
        (supabase as any).from("visa_bookings").select("*").eq("booking_id", booking.id),
        (supabase as any).from("cruise_bookings").select("*").eq("booking_id", booking.id),
        supabase.from("transporters").select("id, name"),
      ]);

      const hotelRows = hotels.data || [];
      setFullBooking(bookingRes.data || null);
      setTransporters(transp.data || []);
      setData({
        ownHotels: hotelRows.filter((h: any) => h.own_hotel_id),
        anotherHotels: hotelRows.filter((h: any) => !h.own_hotel_id && h.hotel_id),
        safaris: safaris.data || [],
        volvoDM: (volvos.data || []).filter((v: any) => normalizeRoute(v.route) === "delhimanali"),
        volvoMD: (volvos.data || []).filter((v: any) => normalizeRoute(v.route) === "manalidelhi"),
        vehicles: vehicles.data || [],
        visas: visas.data || [],
        cruises: cruises.data || [],
      });
    };
    load();
  }, [open, booking?.id]);


  if (!booking) return null;
  const b: any = { ...(booking || {}), ...(fullBooking || {}) };
  if (!booking) return null;

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd/MM/yyyy");
    } catch {
      return "-";
    }
  };

  const formatPrice = (amount: number | null | undefined) =>
    `Rs. ${(Number(amount) || 0).toLocaleString("en-IN")}/-`;

  const transporterName = (id?: string | null) =>
    (id && transporters.find((t) => t.id === id)?.name) || "-";

  const renderRow = (label: string, value: any, key?: string) => (
    <tr key={key || label}>
      <td className="pr-4 py-0.5" style={{ width: "45%" }}>{label}</td>
      <td className="py-0.5">{value === 0 ? 0 : value || "-"}</td>
    </tr>
  );

  const renderSectionHeader = (title: string, key?: string) => (
    <tr key={key || title}>
      <td colSpan={2} className="font-bold pt-2 pb-1">{title}</td>
    </tr>
  );

  const sections: JSX.Element[] = [];

  (data?.ownHotels || []).forEach((h: any, i: number) => {
    sections.push(
      renderSectionHeader("Hotel :", `own-h-${i}`),
      renderRow("Hotel Name :", h.own_hotels?.name, `own-n-${i}`),
      renderRow("Number of Rooms :", h.number_of_rooms, `own-r-${i}`),
      renderRow("Room Name :", roomName(h.room_type), `own-rt-${i}`),
      renderRow("Hotel Booking Date :", formatDate(b.created_at), `own-bd-${i}`),
      renderRow("Hotel Check In :", formatDate(h.check_in_date), `own-ci-${i}`),
      renderRow("Hotel Check Out :", formatDate(h.check_out_date), `own-co-${i}`),
      renderRow("Room Selling Price :", formatPrice(h.total_amount), `own-sp-${i}`),
      ...(h.notes ? [renderRow("Hotel Notes :", h.notes, `own-nt-${i}`)] : []),
    );
  });

  (data?.anotherHotels || []).forEach((h: any, i: number) => {
    sections.push(
      renderSectionHeader("Another Hotel :", `ah-h-${i}`),
      renderRow("Another Hotel Name :", h.another_hotels?.name, `ah-n-${i}`),
      renderRow("Number of Rooms :", h.number_of_rooms, `ah-r-${i}`),
      renderRow("Room Type :", roomName(h.room_type), `ah-rt-${i}`),
      renderRow("Hotel Booking Date :", formatDate(b.created_at), `ah-bd-${i}`),
      renderRow("Hotel Check In :", formatDate(h.check_in_date), `ah-ci-${i}`),
      renderRow("Hotel Check Out :", formatDate(h.check_out_date), `ah-co-${i}`),
      renderRow("Room Booking Price :", formatPrice(h.room_rate), `ah-bp-${i}`),
      renderRow("Room Selling Price :", formatPrice(h.total_amount), `ah-sp-${i}`),
      ...(h.notes ? [renderRow("Hotel Notes :", h.notes, `ah-nt-${i}`)] : []),
    );
  });

  (data?.safaris || []).forEach((s: any, i: number) => {
    sections.push(
      renderSectionHeader("Safari :", `sf-h-${i}`),
      renderRow("Transporter :", s.safari_name, `sf-n-${i}`),
      renderRow("Safari Booking Date :", formatDate(b.created_at), `sf-bd-${i}`),
      renderRow("Safari Date :", formatDate(s.safari_date), `sf-d-${i}`),
      renderRow("No of Safari :", s.number_of_persons, `sf-p-${i}`),
      renderRow("Safari Booking Price :", formatPrice(s.rate_per_person), `sf-bp-${i}`),
      renderRow("Safari Selling Price :", formatPrice(s.total_amount), `sf-sp-${i}`),
      ...(s.notes ? [renderRow("Safari Notes :", s.notes, `sf-nt-${i}`)] : []),
    );
  });

  const volvoSection = (v: any, title: string, prefix: string) => {
    const notes = String(v.notes || "");
    const ticket = notes.match(/Ticket No:\s*([^,]*)/i)?.[1]?.trim();
    const seat = notes.match(/Seat No:\s*(.*)$/i)?.[1]?.trim();
    return [
      renderSectionHeader(title, `${prefix}-h`),
      renderRow("No. of Tickets :", v.number_of_seats, `${prefix}-t`),
      renderRow("Ticket No. :", ticket, `${prefix}-tn`),
      renderRow("Seat No. :", seat, `${prefix}-sn`),
      renderRow("Transporter :", transporterName(v.transporter_id), `${prefix}-tr`),
      renderRow("Volvo Booking Date :", formatDate(b.created_at), `${prefix}-bd`),
      renderRow("Volvo Journey Date :", formatDate(v.travel_date), `${prefix}-jd`),
      renderRow("Volvo Booking Price :", formatPrice(v.rate_per_seat), `${prefix}-bp`),
      renderRow("Volvo Selling Price :", formatPrice(v.total_amount), `${prefix}-sp`),
      ...(v.notes ? [renderRow("Volvo Notes :", v.notes, `${prefix}-nt`)] : []),
    ];
  };

  (data?.volvoDM || []).forEach((v: any, i: number) => {
    sections.push(...volvoSection(v, "Delhi - Manali :", `dm-${i}`));
  });
  (data?.volvoMD || []).forEach((v: any, i: number) => {
    sections.push(...volvoSection(v, "Manali - Delhi :", `md-${i}`));
  });

  (data?.vehicles || []).forEach((v: any, i: number) => {
    sections.push(
      renderSectionHeader("Another Vehicle :", `vh-h-${i}`),
      renderRow("Vehicle Details :", v.vehicle_type, `vh-t-${i}`),
      renderRow("Vehicle Booking Price :", formatPrice(v.rate), `vh-bp-${i}`),
      renderRow("Vehicle Selling Price :", formatPrice(v.total_amount), `vh-sp-${i}`),
      renderRow("Transporter :", v.transporters?.name || transporterName(v.transporter_id), `vh-tr-${i}`),
      renderRow("Vehicle Booking Date :", formatDate(b.created_at), `vh-bd-${i}`),
      renderRow("Vehicle Journey Date :", formatDate(v.pickup_date), `vh-jd-${i}`),
      ...(v.notes ? [renderRow("Vehicle Notes :", v.notes, `vh-nt-${i}`)] : []),
    );
  });

  (data?.visas || []).forEach((v: any, i: number) => {
    sections.push(
      renderSectionHeader("Visa :", `vs-h-${i}`),
      renderRow("Visa Name :", v.visa_name, `vs-n-${i}`),
      renderRow("Visa Booking Date :", formatDate(b.created_at), `vs-bd-${i}`),
      renderRow("Visa Date :", formatDate(v.visa_date), `vs-d-${i}`),
      renderRow("No of Persons :", v.number_of_persons, `vs-p-${i}`),
      renderRow("Visa Booking Price :", formatPrice(v.rate_per_person), `vs-bp-${i}`),
      renderRow("Visa Selling Price :", formatPrice(v.total_amount), `vs-sp-${i}`),
      ...(v.notes ? [renderRow("Visa Notes :", v.notes, `vs-nt-${i}`)] : []),
    );
  });

  (data?.cruises || []).forEach((c: any, i: number) => {
    sections.push(
      renderSectionHeader("Cruise :", `cr-h-${i}`),
      renderRow("Cruise Name :", c.cruise_name, `cr-n-${i}`),
      renderRow("Cruise Booking Date :", formatDate(b.created_at), `cr-bd-${i}`),
      renderRow("Cruise Date :", formatDate(c.cruise_date), `cr-d-${i}`),
      renderRow("No of Persons :", c.number_of_persons, `cr-p-${i}`),
      renderRow("Cruise Booking Price :", formatPrice(c.rate_per_person), `cr-bp-${i}`),
      renderRow("Cruise Selling Price :", formatPrice(c.total_amount), `cr-sp-${i}`),
      ...(c.notes ? [renderRow("Cruise Notes :", c.notes, `cr-nt-${i}`)] : []),
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-auto p-0 rounded-lg">
        <DialogHeader className="px-4 py-3" style={{ backgroundColor: "#b44a50" }}>
          <DialogTitle className="text-white text-sm font-semibold">View Booking Details</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <div className="border border-gray-400 rounded" style={{ backgroundColor: "#f6f0f0" }}>
            <div className="p-4 text-[12px]">
              <table className="w-full">
                <tbody>
                  {renderRow("Type :", b.booking_type === "agent" ? "Agent" : "Direct")}
                  {b.booking_type === "agent" && renderRow("Agent Name :", b.agents?.name)}
                  {renderRow("Reference :", b.reference)}
                  {renderRow("Reference Email :", b.reference_email)}
                  {renderRow("Email-Id :", b.email)}
                  {renderRow("Customer Name :", b.customer_name)}
                  {renderRow("Contact No :", b.contact_no)}
                  {renderRow("Address :", b.address)}
                  {renderRow("No. of People :", `${b.adults || 0} Adult ${b.children || 0} Children`)}
                  {renderRow("Booking From :", formatDate(b.check_in_date))}
                  {renderRow("Booking To :", formatDate(b.check_out_date))}
                  {b.cheque_no && renderRow("Cheque No :", b.cheque_no)}
                  {sections}
                  {serviceData?.notes && !data && renderRow("Package / Notes :", serviceData.notes)}
                  {b.special_requests && renderRow("Special Requests :", b.special_requests)}
                  {b.notes && renderRow("Booking Notes :", b.notes)}
                  {renderRow("Date :", formatDate(b.created_at))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2" style={{ backgroundColor: "#b44a50" }}>
          <span className="text-white text-[11px]">&nbsp;</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
