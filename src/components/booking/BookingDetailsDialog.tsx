import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BookingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  serviceType: "safari" | "vehicle" | "hotel" | "volvo_dm" | "volvo_md";
  serviceData: any;
}

export function BookingDetailsDialog({ 
  open, 
  onOpenChange, 
  booking, 
  serviceType, 
  serviceData 
}: BookingDetailsDialogProps) {
  const [resolvedRoomName, setResolvedRoomName] = useState<string | null>(null);

  // Resolve room UUID to name when dialog opens
  useEffect(() => {
    const resolveRoomName = async () => {
      if (!serviceData?.room_type) {
        setResolvedRoomName(null);
        return;
      }

      const roomType = serviceData.room_type;
      // Check if it's a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomType);
      
      if (isUUID) {
        const { data } = await supabase
          .from("rooms")
          .select("room_type, room_number")
          .eq("id", roomType)
          .maybeSingle();
        
        if (data) {
          setResolvedRoomName(data.room_type || data.room_number || roomType);
        } else {
          setResolvedRoomName(roomType);
        }
      } else {
        setResolvedRoomName(roomType);
      }
    };

    if (open && serviceData) {
      resolveRoomName();
    }
  }, [open, serviceData]);

  if (!booking || !serviceData) return null;

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy");
  };

  const formatPrice = (amount: number | null) => {
    return `Rs. ${(amount || 0).toLocaleString('en-IN')}/-`;
  };

  const renderRow = (label: string, value: string | number | null, isBold?: boolean) => (
    <tr>
      <td className={`pr-4 py-0.5 ${isBold ? 'font-bold' : ''}`} style={{ width: '45%' }}>{label}</td>
      <td className="py-0.5">{value || "-"}</td>
    </tr>
  );

  const renderSectionHeader = (title: string) => (
    <tr>
      <td colSpan={2} className="font-bold pt-2 pb-1">{title}</td>
    </tr>
  );

  const renderSafariDetails = () => (
    <>
      {renderSectionHeader("Safari :")}
      {renderRow("Safari Name :", serviceData.safari_name)}
      {renderRow("Safari Booking Date :", formatDate(booking.created_at))}
      {renderRow("Safari Date :", formatDate(serviceData.safari_date))}
      {renderRow("No of Persons :", serviceData.number_of_persons)}
      {renderRow("Safari Booking Price :", formatPrice(serviceData.rate_per_person))}
      {renderRow("Safari Selling Price :", formatPrice(serviceData.total_amount))}
    </>
  );

  const renderVehicleDetails = () => (
    <>
      {renderSectionHeader("Another Vehicle :")}
      {renderRow("Vehicle Details :", serviceData.vehicle_type)}
      {renderRow("Vehicle Selling Price :", formatPrice(serviceData.total_amount))}
      {renderRow("Vehicle Booking Price :", formatPrice(serviceData.rate))}
      {renderRow("Transporter :", serviceData.transporters?.name)}
      {renderRow("Vehicle Booking Date :", formatDate(booking.created_at))}
      {renderRow("Vehicle Journey Date :", formatDate(serviceData.pickup_date))}
    </>
  );

  const renderHotelDetails = () => {
    // Check if this is an Own Hotel (has own_hotel_id and own_hotels data) or Another Hotel (has hotel_id and another_hotels data)
    const isOwnHotel = serviceData.own_hotel_id && serviceData.own_hotels?.name;
    const isAnotherHotel = serviceData.hotel_id && serviceData.another_hotels?.name;
    
    // Use resolved room name or fallback to raw value
    const roomName = resolvedRoomName || serviceData.room_type || "-";
    
    if (isOwnHotel) {
      // Own Hotel Section
      return (
        <>
          {renderSectionHeader("Hotel :")}
          {renderRow("Hotel Name :", serviceData.own_hotels?.name)}
          {renderRow("Number of Rooms :", serviceData.number_of_rooms)}
          {renderRow("Room Name :", roomName)}
          {renderRow("Hotel Booking Date :", formatDate(booking.created_at))}
          {renderRow("Hotel Check In :", formatDate(serviceData.check_in_date))}
          {renderRow("Hotel Check Out :", formatDate(serviceData.check_out_date))}
          {renderRow("Room Selling Price :", formatPrice(serviceData.total_amount))}
        </>
      );
    } else if (isAnotherHotel) {
      // Another Hotel Section
      return (
        <>
          {renderSectionHeader("Another Hotel :")}
          {renderRow("Another Hotel Name :", serviceData.another_hotels?.name)}
          {renderRow("Number of Rooms :", serviceData.number_of_rooms)}
          {renderRow("Room Type :", roomName)}
          {renderRow("Hotel Booking Date :", formatDate(booking.created_at))}
          {renderRow("Hotel Check In :", formatDate(serviceData.check_in_date))}
          {renderRow("Hotel Check Out :", formatDate(serviceData.check_out_date))}
          {renderRow("Room Booking Price :", formatPrice(serviceData.room_rate))}
          {renderRow("Room Selling Price :", formatPrice(serviceData.total_amount))}
        </>
      );
    } else {
      // Fallback - show generic hotel info
      return (
        <>
          {renderSectionHeader("Hotel :")}
          {renderRow("Number of Rooms :", serviceData.number_of_rooms)}
          {renderRow("Room Type :", roomName)}
          {renderRow("Hotel Check In :", formatDate(serviceData.check_in_date))}
          {renderRow("Hotel Check Out :", formatDate(serviceData.check_out_date))}
          {renderRow("Room Selling Price :", formatPrice(serviceData.total_amount))}
        </>
      );
    }
  };

  const renderVolvoDetails = () => (
    <>
      {renderSectionHeader(serviceType === "volvo_dm" ? "Delhi - Manali :" : "Manali - Delhi :")}
      {renderRow("No. of Tickets :", serviceData.number_of_seats)}
      {renderRow("Ticket No. :", serviceData.ticket_number)}
      {renderRow("Seat No. :", serviceData.seat_numbers)}
      {renderRow("Transporter :", serviceData.transporters?.name)}
      {renderRow("Volvo Booking Date :", formatDate(booking.created_at))}
      {renderRow("Volvo Journey Date :", formatDate(serviceData.travel_date))}
      {renderRow("Volvo Booking Price :", formatPrice(serviceData.rate_per_seat))}
      {renderRow("Volvo Selling Price :", formatPrice(serviceData.total_amount))}
    </>
  );

  const renderServiceDetails = () => {
    switch (serviceType) {
      case "safari":
        return renderSafariDetails();
      case "vehicle":
        return renderVehicleDetails();
      case "hotel":
        return renderHotelDetails();
      case "volvo_dm":
      case "volvo_md":
        return renderVolvoDetails();
      default:
        return null;
    }
  };

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
                  {renderRow("Type :", booking.booking_type === "agent" ? "Agent" : "Direct")}
                  {renderRow("Reference :", booking.reference)}
                  {renderRow("Reference Email :", booking.reference_email)}
                  {renderRow("Email-Id :", booking.email)}
                  {renderRow("Customer Name :", booking.customer_name)}
                  {renderRow("Contact No :", booking.contact_no)}
                  {renderRow("Address :", booking.address)}
                  {renderRow("No. of People :", `${booking.adults || 0} Adult ${booking.children || 0} Children`)}
                  {renderRow("Booking From :", formatDate(booking.check_in_date))}
                  {renderRow("Booking To :", formatDate(booking.check_out_date))}
                  {booking.cheque_no && renderRow("Cheque No :", booking.cheque_no)}
                  {renderServiceDetails()}
                  {serviceData?.notes && renderRow("Package / Notes :", serviceData.notes)}
                  {booking.special_requests && renderRow("Special Requests :", booking.special_requests)}
                  {booking.notes && renderRow("Booking Notes :", booking.notes)}
                  {renderRow("Date :", formatDate(booking.created_at))}
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
