import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Reservations() {
  return (
    <div className="min-h-screen">
      <Header title="Reservations" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Booking Management</h2>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Reservation
          </Button>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Reservation management coming soon
        </div>
      </main>
    </div>
  );
}
