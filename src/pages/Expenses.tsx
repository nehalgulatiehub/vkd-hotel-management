import { Header } from "@/components/layout/Header";

export default function Expenses() {
  return (
    <div className="min-h-screen">
      <Header title="Group Expenses" />
      <main className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Group Expenses</h2>
        <div className="text-center py-12 text-muted-foreground">
          Expense management coming soon
        </div>
      </main>
    </div>
  );
}
