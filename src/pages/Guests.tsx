import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Guests() {
  return (
    <div className="min-h-screen">
      <Header title="Guests" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Guest Management</h2>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Guest
          </Button>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Guest management coming soon
        </div>
      </main>
    </div>
  );
}
