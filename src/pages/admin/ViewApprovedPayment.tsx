import AdminPaymentPageLayout from "@/components/admin/AdminPaymentPageLayout";
import { SERVICE_PAYMENT_TYPES } from "@/components/admin/servicePaymentTypes";

export default function ViewApprovedPayment() {
  return <AdminPaymentPageLayout title="View Approved Payment" approvalStatus="approved" excludePaymentTypes={SERVICE_PAYMENT_TYPES} />;
}
