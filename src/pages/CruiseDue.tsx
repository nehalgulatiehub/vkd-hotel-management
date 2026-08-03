import { ServiceModuleDue } from "@/components/booking/ServiceModuleDue";

export default function CruiseDue() {
  return (
    <ServiceModuleDue
      config={{ table: "cruise_bookings", nameField: "cruise_name", dateField: "cruise_date", title: "Due Amount Cruise", label: "Cruise" }}
    />
  );
}
