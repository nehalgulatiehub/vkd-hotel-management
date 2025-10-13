import { Header } from "@/components/layout/Header";

export default function Payments() {
  return (
    <div className="min-h-screen">
      <Header title="Payment & Financials" />
      <main className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Payments & Financials</h2>
        <div className="text-center py-12 text-muted-foreground">
          Payment management coming soon
        </div>
      </main>
    </div>
  );
}
