import { ServiceModulePayments } from "@/components/booking/ServiceModulePayments";

export default function CruisePayments() {
  return <ServiceModulePayments config={{ paymentType: "cruise", title: "Cruise Payment" }} />;
}
