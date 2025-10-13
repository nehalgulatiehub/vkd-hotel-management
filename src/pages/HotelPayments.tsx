import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";

export default function HotelPayments() {
  return (
    <div className="min-h-screen">
      <Header title="Another Hotel Payments" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Another Hotel Payments</h2>
        </div>
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            Hotel payments view coming soon
          </div>
        </Card>
      </main>
    </div>
  );
}
