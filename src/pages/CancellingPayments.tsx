import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";

export default function CancellingPayments() {
  return (
    <div className="min-h-screen">
      <Header title="Cancelling Payments" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">View Cancelling Payments</h2>
        </div>
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            Cancelling payments view coming soon
          </div>
        </Card>
      </main>
    </div>
  );
}
