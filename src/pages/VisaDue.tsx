import { ServiceDuePage } from "@/components/booking/ServiceDuePage";

export default function VisaDue() {
  return (
    <ServiceDuePage
      config={{
        table: "visa_bookings",
        serviceType: "visa",
        nameField: "visa_name",
        dateField: "visa_date",
        title: "Visa Due Amount",
        label: "Visa",
        allRecordsPath: "/payments/visa",
      }}
    />
  );
}
