import { ServiceModuleDetails } from "@/components/booking/ServiceModuleDetails";

export default function VisaDetails() {
  return (
    <ServiceModuleDetails
      config={{
        table: "visa_bookings",
        nameField: "visa_name",
        dateField: "visa_date",
        title: "View Visa Details",
        label: "Visa",
        paymentType: "visa",
        detailsServiceType: "visa",
      }}
    />
  );
}
