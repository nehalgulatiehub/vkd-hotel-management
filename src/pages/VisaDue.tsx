import { ServiceModuleDue } from "@/components/booking/ServiceModuleDue";

export default function VisaDue() {
  return (
    <ServiceModuleDue
      config={{ table: "visa_bookings", nameField: "visa_name", dateField: "visa_date", title: "Due Amount Visa", label: "Visa" }}
    />
  );
}
