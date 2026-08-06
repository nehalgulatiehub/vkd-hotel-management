import { ServiceDuePage } from "@/components/booking/ServiceDuePage";

export default function CruiseDue() {
  return (
    <ServiceDuePage
      config={{
        table: "cruise_bookings",
        serviceType: "cruise",
        nameField: "cruise_name",
        dateField: "cruise_date",
        title: "Cruise Due Amount",
        label: "Cruise",
        allRecordsPath: "/cruise-details",
      }}
    />
  );
}
