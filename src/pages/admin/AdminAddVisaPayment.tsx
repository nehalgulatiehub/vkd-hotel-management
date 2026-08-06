import AdminAddServicePayment from "@/components/admin/AdminAddServicePayment";

export default function AdminAddVisaPayment() {
  return <AdminAddServicePayment serviceType="visa" title="Add Visa Payment" table="visa_bookings" nameField="visa_name" />;
}
