import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function AdminPlaceholder() {
  const location = useLocation();
  
  // Extract page name from URL
  const pageName = location.pathname
    .replace("/admin/", "")
    .split("/")
    .map(part => part.replace(/-/g, " "))
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" > ");

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto mt-20">
        <CardHeader className="text-center">
          <Construction className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <CardTitle className="text-xl">{pageName || "Admin Page"}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            This page is under development. The functionality will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
