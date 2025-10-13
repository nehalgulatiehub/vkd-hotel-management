import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Enquiries() {
  return (
    <div className="min-h-screen">
      <Header title="Enquiry Management" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Enquiries</h2>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Generate Enquiry
          </Button>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Enquiry management coming soon
        </div>
      </main>
    </div>
  );
}
