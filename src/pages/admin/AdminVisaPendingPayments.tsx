import AdminPaymentPageLayout from "@/components/admin/AdminPaymentPageLayout";

export default function AdminVisaPendingPayments() {
  return <AdminPaymentPageLayout title="View Visa Pending Payment" paymentType="visa" approvalStatus="pending" />;
}
