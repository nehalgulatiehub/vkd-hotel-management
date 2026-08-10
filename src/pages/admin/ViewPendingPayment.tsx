import AdminPaymentPageLayout from "@/components/admin/AdminPaymentPageLayout";
import { SERVICE_PAYMENT_TYPES } from "@/components/admin/servicePaymentTypes";

export default function ViewPendingPayment() {
  return <AdminPaymentPageLayout title="View Pending Payment" approvalStatus="pending" excludePaymentTypes={SERVICE_PAYMENT_TYPES} />;
}
