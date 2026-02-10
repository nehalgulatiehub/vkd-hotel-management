import AdminPaymentPageLayout from "@/components/admin/AdminPaymentPageLayout";

export default function AdminHotelPendingPayments() {
  return <AdminPaymentPageLayout title="View Another Hotel Pending Payment" paymentType="hotel" approvalStatus="pending" serviceLabel="Another Hotel" />;
}
