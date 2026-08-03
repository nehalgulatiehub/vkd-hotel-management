import { ServiceModulePayments } from "@/components/booking/ServiceModulePayments";

export default function VisaPayments() {
  return <ServiceModulePayments config={{ paymentType: "visa", title: "Visa Payment" }} />;
}
