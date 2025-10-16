import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";

export default function BookingPayments() {
  return (
    <div className="min-h-screen">
      <Header title="Booking Payments" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">View Booking Payment</h2>
        </div>
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            Booking payment view coming soon
          </div>
        </Card>
      </main>
    </div>
  );
}
