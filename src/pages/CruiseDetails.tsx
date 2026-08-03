import { ServiceModuleDetails } from "@/components/booking/ServiceModuleDetails";

export default function CruiseDetails() {
  return (
    <ServiceModuleDetails
      config={{
        table: "cruise_bookings",
        nameField: "cruise_name",
        dateField: "cruise_date",
        title: "View Cruise Details",
        label: "Cruise",
        paymentType: "cruise",
        detailsServiceType: "cruise",
      }}
    />
  );
}
