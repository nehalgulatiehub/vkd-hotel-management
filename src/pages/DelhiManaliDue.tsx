import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";

export default function DelhiManaliDue() {
  return (
    <div className="min-h-screen">
      <Header title="Delhi - Manali Due Amount" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Delhi - Manali Due Amount</h2>
        </div>
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            Delhi - Manali due amount tracking coming soon
          </div>
        </Card>
      </main>
    </div>
  );
}
