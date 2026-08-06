import AdminPaymentPageLayout from "@/components/admin/AdminPaymentPageLayout";

export default function AdminHotelPendingPayments() {
  return <AdminPaymentPageLayout title="View Another Hotel Pending Payment" paymentType={["another_hotel", "hotel"]} approvalStatus="pending" serviceLabel="Another Hotel" />;
}
