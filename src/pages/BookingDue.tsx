import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";

export default function BookingDue() {
  return (
    <div className="min-h-screen">
      <Header title="Booking Due Amount" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Booking Due Amount</h2>
        </div>
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            Booking due amount tracking coming soon
          </div>
        </Card>
      </main>
    </div>
  );
}
