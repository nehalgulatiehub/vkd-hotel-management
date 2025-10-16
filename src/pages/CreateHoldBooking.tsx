import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";

export default function CreateHoldBooking() {
  return (
    <div className="min-h-screen">
      <Header title="Create Hold Booking" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Create Hold Booking</h2>
        </div>
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            Create hold booking functionality coming soon
          </div>
        </Card>
      </main>
    </div>
  );
}
