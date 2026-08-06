import AdminAddServicePayment from "@/components/admin/AdminAddServicePayment";

export default function AdminAddCruisePayment() {
  return <AdminAddServicePayment serviceType="cruise" title="Add Cruise Payment" table="cruise_bookings" nameField="cruise_name" />;
}
