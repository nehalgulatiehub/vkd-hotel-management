import AdminPaymentPageLayout from "@/components/admin/AdminPaymentPageLayout";
import { SERVICE_PAYMENT_TYPES } from "@/utils/paymentCategories";

export default function AdminHotelApprovedPayments() {
  return <AdminPaymentPageLayout title="View Another Hotel Approved Payment" paymentType={[...SERVICE_PAYMENT_TYPES.anotherHotel]} approvalStatus="approved" serviceLabel="Another Hotel" />;
}
