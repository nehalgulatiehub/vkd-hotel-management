import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

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
  if (!booking || !serviceData) return null;

  const renderServiceDetails = () => {
    switch (serviceType) {
      case "safari":
        return (
          <>
            <tr><td className="font-semibold pr-2">No of Safari:</td><td>{serviceData.number_of_persons || 0}</td></tr>
            <tr><td className="font-semibold pr-2">Safari Date:</td><td>{serviceData.safari_date ? format(new Date(serviceData.safari_date), "dd/MM/yyyy") : "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Transporter:</td><td>{serviceData.transporters?.name || "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Booking Price:</td><td>Rs. {(serviceData.rate_per_person || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Selling Price:</td><td>Rs. {(serviceData.total_amount || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Paid Amount:</td><td>Rs. {(serviceData.paid_amount || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Due Amount:</td><td className="text-red-600 font-semibold">Rs. {(serviceData.due_amount || 0).toLocaleString('en-IN')} /-</td></tr>
          </>
        );
      case "vehicle":
        return (
          <>
            <tr><td className="font-semibold pr-2">Vehicle:</td><td>{serviceData.vehicle_type || "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Vehicle Number:</td><td>{serviceData.vehicle_number || "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Transporter:</td><td>{serviceData.transporters?.name || "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Journey Date:</td><td>{serviceData.pickup_date ? format(new Date(serviceData.pickup_date), "dd/MM/yyyy") : "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Booking Price:</td><td>Rs. {(serviceData.rate || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Selling Price:</td><td>Rs. {(serviceData.total_amount || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Paid Amount:</td><td>Rs. {(serviceData.paid_amount || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Due Amount:</td><td className="text-red-600 font-semibold">Rs. {(serviceData.due_amount || 0).toLocaleString('en-IN')} /-</td></tr>
          </>
        );
      case "hotel":
        return (
          <>
            <tr><td className="font-semibold pr-2">Hotel Name:</td><td>{serviceData.another_hotels?.name || "-"}</td></tr>
            <tr><td className="font-semibold pr-2">City:</td><td className="text-red-600 font-bold">{serviceData.another_hotels?.cities?.name?.toUpperCase() || "-"}</td></tr>
            <tr><td className="font-semibold pr-2">No of Rooms:</td><td>{serviceData.number_of_rooms || 0}</td></tr>
            <tr><td className="font-semibold pr-2">Room Type:</td><td>{serviceData.room_type || "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Check-in:</td><td>{serviceData.check_in_date ? format(new Date(serviceData.check_in_date), "dd/MM/yyyy") : "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Check-out:</td><td>{serviceData.check_out_date ? format(new Date(serviceData.check_out_date), "dd/MM/yyyy") : "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Booking Price:</td><td>Rs. {(serviceData.room_rate || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Selling Price:</td><td>Rs. {(serviceData.total_amount || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Paid Amount:</td><td>Rs. {(serviceData.paid_amount || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Due Amount:</td><td className="text-red-600 font-semibold">Rs. {(serviceData.due_amount || 0).toLocaleString('en-IN')} /-</td></tr>
          </>
        );
      case "volvo_dm":
      case "volvo_md":
        return (
          <>
            <tr><td className="font-semibold pr-2">Route:</td><td>{serviceType === "volvo_dm" ? "Delhi - Manali" : "Manali - Delhi"}</td></tr>
            <tr><td className="font-semibold pr-2">No of Tickets:</td><td>{serviceData.number_of_seats || 0}</td></tr>
            <tr><td className="font-semibold pr-2">Ticket No:</td><td>{serviceData.ticket_number || "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Seat No:</td><td>{serviceData.seat_numbers || "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Transporter:</td><td>{serviceData.transporters?.name || "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Travel Date:</td><td>{serviceData.travel_date ? format(new Date(serviceData.travel_date), "dd/MM/yyyy") : "-"}</td></tr>
            <tr><td className="font-semibold pr-2">Booking Price:</td><td>Rs. {(serviceData.rate_per_seat || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Selling Price:</td><td>Rs. {(serviceData.total_amount || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Paid Amount:</td><td>Rs. {(serviceData.paid_amount || 0).toLocaleString('en-IN')} /-</td></tr>
            <tr><td className="font-semibold pr-2">Due Amount:</td><td className="text-red-600 font-semibold">Rs. {(serviceData.due_amount || 0).toLocaleString('en-IN')} /-</td></tr>
          </>
        );
      default:
        return null;
    }
  };

  const getServiceTitle = () => {
    switch (serviceType) {
      case "safari": return "Safari Details";
      case "vehicle": return "Vehicle Details";
      case "hotel": return "Hotel Details";
      case "volvo_dm": return "Delhi-Manali Volvo Details";
      case "volvo_md": return "Manali-Delhi Volvo Details";
      default: return "Details";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto p-0">
        <DialogHeader className="px-4 py-3" style={{ backgroundColor: "#1e6e99" }}>
          <DialogTitle className="text-white text-sm font-semibold">View Details</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          {/* Customer Details Section */}
          <div className="border rounded">
            <div className="px-3 py-2 font-semibold text-sm" style={{ backgroundColor: "#D4A59A" }}>
              Customer Details
            </div>
            <div className="p-3 text-[12px]" style={{ backgroundColor: "#F5E6E0" }}>
              <table>
                <tbody>
                  <tr><td className="font-semibold pr-2">Booking No:</td><td>{booking.booking_number || "-"}</td></tr>
                  <tr><td className="font-semibold pr-2">Customer Name:</td><td>{booking.customer_name || "-"}</td></tr>
                  <tr><td className="font-semibold pr-2">Contact No:</td><td>{booking.contact_no || "-"}</td></tr>
                  <tr><td className="font-semibold pr-2">Email:</td><td>{booking.email || "-"}</td></tr>
                  <tr><td className="font-semibold pr-2">Booking Type:</td><td className="capitalize">{booking.booking_type || "Direct"}</td></tr>
                  <tr><td className="font-semibold pr-2">Booking Date:</td><td>{booking.created_at ? format(new Date(booking.created_at), "dd/MM/yyyy") : "-"}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Service Details Section */}
          <div className="border rounded">
            <div className="px-3 py-2 font-semibold text-sm" style={{ backgroundColor: "#D4A59A" }}>
              {getServiceTitle()}
            </div>
            <div className="p-3 text-[12px]" style={{ backgroundColor: "#F5E6E0" }}>
              <table>
                <tbody>
                  {renderServiceDetails()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Section */}
          {booking.notes && (
            <div className="border rounded">
              <div className="px-3 py-2 font-semibold text-sm" style={{ backgroundColor: "#D4A59A" }}>
                Notes
              </div>
              <div className="p-3 text-[12px]" style={{ backgroundColor: "#F5E6E0" }}>
                {booking.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 text-[11px] text-white" style={{ backgroundColor: "#1e6e99" }}>
          <span className="font-semibold">Booking No:</span> {booking.booking_number} | 
          <span className="font-semibold ml-2">Customer:</span> {booking.customer_name}
        </div>
      </DialogContent>
    </Dialog>
  );
}
