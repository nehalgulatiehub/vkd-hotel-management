import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { LegacyFormPanel } from "@/components/legacy/LegacyFormPanel";

export default function ExportHotels() {
  return (
    <div className="min-h-screen">
      <Header title="Export Another Hotels" />
      <main className="p-4">
        <LegacyFormPanel
          title="Export Another Hotels"
          rightSlot={
            <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" disabled>
              <Download className="h-4 w-4 mr-1" />
              Export to Excel
            </Button>
          }
        >
          <div className="text-center py-12 text-muted-foreground">
            Export hotels functionality coming soon
          </div>
        </LegacyFormPanel>
      </main>
    </div>
  );
}
