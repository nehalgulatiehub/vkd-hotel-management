import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import * as XLSX from "xlsx";

export default function ExportAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { profiles, getUserName } = useProfilesMap();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("agents")
        .select("*, city:cities(name)")
        .order("name");
      if (error) toast.error("Failed to load agents");
      else setAgents(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = agents.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      a.name?.toLowerCase().includes(q) ||
      a.company_name?.toLowerCase().includes(q) ||
      a.phone?.includes(searchTerm) ||
      a.email?.toLowerCase().includes(q);
    const matchesUser = userFilter === "all" || a.created_by === userFilter;
    return matchesSearch && matchesUser;
  });

  const handleExport = () => {
    if (!filtered.length) return;
    const rows = filtered.map((a) => ({
      Name: a.name,
      Company: a.company_name || "-",
      Phone: a.phone || "-",
      Email: a.email || "-",
      Address: a.address || "-",
      City: a.city?.name || "-",
      "Commission %": a.commission_rate ?? "-",
      "Created By": a.created_by ? getUserName(a.created_by) : "-",
      Notes: a.notes || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agents");
    XLSX.writeFile(wb, `agents_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Agents exported successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Export Agents" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Export Agents</h2>
          <Button className="bg-gradient-primary" onClick={handleExport} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name, company, phone, email..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Created By</Label>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">All Users</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-2">Total Agents: {filtered.length}</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Name</th>
                      <th className="text-left p-3 font-semibold">Company</th>
                      <th className="text-left p-3 font-semibold">Phone</th>
                      <th className="text-left p-3 font-semibold">Email</th>
                      <th className="text-left p-3 font-semibold">City</th>
                      <th className="text-left p-3 font-semibold">Commission %</th>
                      <th className="text-left p-3 font-semibold">Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="p-4 text-center text-muted-foreground" colSpan={7}>Loading...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td className="p-4 text-center text-muted-foreground" colSpan={7}>No agents found</td></tr>
                    ) : filtered.map((a) => (
                      <tr key={a.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">{a.name}</td>
                        <td className="p-3">{a.company_name || "-"}</td>
                        <td className="p-3">{a.phone || "-"}</td>
                        <td className="p-3">{a.email || "-"}</td>
                        <td className="p-3">{a.city?.name || "-"}</td>
                        <td className="p-3">{a.commission_rate ?? "-"}</td>
                        <td className="p-3">{a.created_by ? getUserName(a.created_by) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
