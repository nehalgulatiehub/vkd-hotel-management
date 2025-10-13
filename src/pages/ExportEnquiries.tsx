import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ExportEnquiries() {
  return (
    <div className="min-h-screen">
      <Header title="Export Enquiries" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Export Enquiries</h2>
          <Button className="bg-gradient-primary">
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Export enquiries functionality coming soon
        </div>
      </main>
    </div>
  );
}
