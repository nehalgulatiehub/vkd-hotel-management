import AdminPaymentPageLayout from "@/components/admin/AdminPaymentPageLayout";
import { SERVICE_PAYMENT_TYPES } from "@/utils/paymentCategories";

export default function AdminHotelPendingPayments() {
  return <AdminPaymentPageLayout title="View Another Hotel Pending Payment" paymentType={[...SERVICE_PAYMENT_TYPES.anotherHotel]} approvalStatus="pending" serviceLabel="Another Hotel" />;
}
