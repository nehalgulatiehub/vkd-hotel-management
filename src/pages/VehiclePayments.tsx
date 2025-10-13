import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";

export default function VehiclePayments() {
  return (
    <div className="min-h-screen">
      <Header title="Vehicle Payments" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Another Vehicle Payments</h2>
        </div>
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            Vehicle payments view coming soon
          </div>
        </Card>
      </main>
    </div>
  );
}
