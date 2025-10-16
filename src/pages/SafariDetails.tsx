import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";

export default function SafariDetails() {
  return (
    <div className="min-h-screen">
      <Header title="Safari Details" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">View Safari Detail</h2>
        </div>
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            Safari details view coming soon
          </div>
        </Card>
      </main>
    </div>
  );
}
