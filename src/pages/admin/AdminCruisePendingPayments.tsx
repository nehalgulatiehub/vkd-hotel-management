import AdminPaymentPageLayout from "@/components/admin/AdminPaymentPageLayout";

export default function AdminCruisePendingPayments() {
  return <AdminPaymentPageLayout title="View Cruise Pending Payment" paymentType="cruise" approvalStatus="pending" />;
}
