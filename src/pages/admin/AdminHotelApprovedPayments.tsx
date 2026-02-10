import AdminPaymentPageLayout from "@/components/admin/AdminPaymentPageLayout";

export default function AdminHotelApprovedPayments() {
  return <AdminPaymentPageLayout title="View Another Hotel Approved Payment" paymentType="hotel" approvalStatus="approved" serviceLabel="Another Hotel" />;
}
