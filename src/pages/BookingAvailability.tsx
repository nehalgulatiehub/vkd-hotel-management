import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";

export default function BookingAvailability() {
  return (
    <div className="min-h-screen">
      <Header title="Booking Availability" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Booking Availability</h2>
        </div>
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            Booking availability checker coming soon
          </div>
        </Card>
      </main>
    </div>
  );
}
