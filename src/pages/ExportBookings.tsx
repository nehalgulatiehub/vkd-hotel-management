import { Header } from "@/components/layout/Header";
import { LegacyDatePicker } from "@/components/ui/LegacyDatePicker";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useRoomNames } from "@/hooks/useRoomNames";

const today = new Date().toISOString().split("T")[0];

export default function ExportBookings() {
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [searchWithDate, setSearchWithDate] = useState<"yes" | "no">("yes");
  const [hotelId, setHotelId] = useState("all");
  const [hotels, setHotels] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const { roomName } = useRoomNames();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("own_hotels").select("id, name").order("name");
      setHotels(data || []);
      if (data?.length) setHotelId(data[0].id);
    })();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      let query = supabase
        .from("bookings")
        .select(
          "*, agent:agents(name), hotel_bookings(*, own_hotel:own_hotels(name), hotel:another_hotels(name)), volvo_bookings(*), safari_bookings(*), vehicle_bookings(*, transporter:transporters(name))"
        )
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      if (searchWithDate === "yes") {
        if (dateFrom) query = query.gte("check_in_date", dateFrom);
        if (dateTo) query = query.lte("check_in_date", dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      let rowsData = data || [];
      if (hotelId !== "all") {
        rowsData = rowsData.filter((b: any) =>
          (b.hotel_bookings || []).some((h: any) => h.own_hotel_id === hotelId)
        );
      }

      if (!rowsData.length) {
        toast.error("No bookings found for the selected filters");
        return;
      }

      const rows = rowsData.map((b: any, i: number) => {
        const ownHotel = (b.hotel_bookings || []).find((h: any) => h.own_hotel_id);
        const anotherHotel = (b.hotel_bookings || []).find((h: any) => h.hotel_id);
        const dm = (b.volvo_bookings || []).find((v: any) =>
          (v.route || "").toLowerCase().includes("delhi-manali") ||
          (v.route || "").toLowerCase().startsWith("delhi")
        );
        const md = (b.volvo_bookings || []).find((v: any) => v !== dm);
        const safari = (b.safari_bookings || [])[0];
        const vehicle = (b.vehicle_bookings || [])[0];

        return {
          "S.No.": i + 1,
          Type: b.booking_type || "",
          Agent: b.agent?.name || "",
          "Customer Name": b.customer_name || "",
          "Booking From": b.check_in_date || "",
          "Booking To": b.check_out_date || "",
          Package: ownHotel?.notes || b.notes || "",
          Room: roomName(ownHotel?.room_type, ""),
          "No.of Room": ownHotel?.number_of_rooms ?? 0,
          Hotel: ownHotel?.own_hotel?.name || "",
          "Booking Price": ownHotel?.total_amount ?? 0,
          "D-M No. of Tickets": dm?.number_of_seats ?? 0,
          "D-M Ticket No.": "",
          "D-M Seat No.": "",
          "D-M Transporter": "",
          "D-M Volvo Booking Date": dm?.created_at ? String(dm.created_at).split("T")[0] : "",
          "D-M Volvo Journey Date": dm?.travel_date || "",
          "D-M Volvo Booking Price": dm?.rate_per_seat ?? 0,
          "D-M Volvo Selling Price": dm?.total_amount ?? 0,
          "M-D No.of Tickets": md?.number_of_seats ?? 0,
          "M-D Ticket No.": "",
          "M-D Seat No.": "",
          "M-D Transporter": "",
          "M-D Volvo Booking Date": md?.created_at ? String(md.created_at).split("T")[0] : "",
          "M-D Volvo Journey Date": md?.travel_date || "",
          "M-D Volvo Booking Price": md?.rate_per_seat ?? 0,
          "M-D Volvo Selling Price": md?.total_amount ?? 0,
          "Safari Transporter": safari?.safari_name || "",
          "No.of Safari": safari?.number_of_persons ?? 0,
          "Safari Booking Date": safari?.created_at ? String(safari.created_at).split("T")[0] : "",
          "Safari Journey Date": safari?.safari_date || "",
          "Safari Booking Pirce": safari?.rate_per_person ?? 0,
          "Safari Selling Price": safari?.total_amount ?? 0,
          "Another Hotel Name": anotherHotel?.hotel?.name || "",
          "No of Rooms": anotherHotel?.number_of_rooms ?? 0,
          "Room Type": roomName(anotherHotel?.room_type, ""),
          "Booking From ": anotherHotel?.check_in_date || "",
          "Hotel Booking Date": anotherHotel?.created_at
            ? String(anotherHotel.created_at).split("T")[0]
            : "",
          "Hotel Check In": anotherHotel?.check_in_date || "",
          "Hotel Check Out": anotherHotel?.check_out_date || "",
          "Room Booking Price": anotherHotel?.room_rate ?? 0,
          "Room Selling Price": anotherHotel?.total_amount ?? 0,
          "Vehicle Details": vehicle
            ? [vehicle.vehicle_type, vehicle.vehicle_number].filter(Boolean).join(" ")
            : "",
          "Vehicle booking Price": vehicle?.rate ?? 0,
          "Vehicle Selling Price": vehicle?.total_amount ?? 0,
          Transporter: vehicle?.transporter?.name || "",
          "Vehicle Booking Date": vehicle?.pickup_date || "",
          "Vehicle Selling Date": vehicle?.dropoff_date || "",
          Reference: b.reference || "",
          "Reference Email": b.reference_email || "",
          "Agent Commission": b.agent_commission ?? 0,
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");
      XLSX.writeFile(wb, `booking_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`Exported ${rows.length} bookings`);
    } catch (e: any) {
      toast.error(e.message || "Failed to export bookings");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Export Booking" />
      <main className="p-6">
        <div className="rounded-lg overflow-hidden border border-border shadow-sm max-w-5xl">
          <div className="bg-[#1a72b8] text-white px-4 py-2 font-serif font-bold text-lg">
            Export Booking
          </div>
          <div className="bg-[#f7dede] px-4 py-3 space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#7a4a4a]">
              <div className="flex items-center gap-2">
                <span>From :</span>
                <LegacyDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <span>To :</span>
                <LegacyDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span>Search with Date :</span>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={searchWithDate === "yes"}
                    onChange={() => setSearchWithDate("yes")}
                  />
                  YES
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={searchWithDate === "no"}
                    onChange={() => setSearchWithDate("no")}
                  />
                  NO
                </label>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#7a4a4a]">
              <div className="flex items-center gap-2">
                <span>Hotel</span>
                <select
                  value={hotelId}
                  onChange={(e) => setHotelId(e.target.value)}
                  className="h-7 min-w-[200px] border border-black bg-white px-1 text-sm text-foreground"
                >
                  <option value="all">All Hotels</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="border-2 border-outset border-[#999] bg-[#d4d0c8] px-4 py-1 font-mono font-bold text-black text-sm disabled:opacity-60"
              >
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
          <div className="bg-white h-40" />
          <div className="bg-[#1a72b8] h-8" />
        </div>
      </main>
    </div>
  );
}
