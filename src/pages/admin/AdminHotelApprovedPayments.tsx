import AdminPaymentPageLayout from "@/components/admin/AdminPaymentPageLayout";

export default function AdminHotelApprovedPayments() {
  return <AdminPaymentPageLayout title="View Another Hotel Approved Payment" paymentType={["another_hotel", "hotel"]} approvalStatus="approved" serviceLabel="Another Hotel" />;
}
