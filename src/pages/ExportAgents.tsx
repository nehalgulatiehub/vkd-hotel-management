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
import { LegacyFormPanel } from "@/components/legacy/LegacyFormPanel";

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
      <main className="p-4">
        <LegacyFormPanel
          title="Export Agents"
          rightSlot={
            <Button
              variant="link"
              className="text-white p-0 h-auto text-sm hover:text-white/80"
              onClick={handleExport}
              disabled={!filtered.length}
            >
              <Download className="h-4 w-4 mr-1" />
              Export to Excel
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name, company, phone, email..."
                  className="pl-10 bg-white"
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
                className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm"
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
          <p className="text-sm text-muted-foreground">Total Agents: {filtered.length}</p>
        </LegacyFormPanel>

        <Card className="mt-4">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#D4A59A" }}>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Name</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Company</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Phone</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Email</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">City</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Commission %</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="border border-[#c99] p-4 text-center text-muted-foreground" colSpan={7}>Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td className="border border-[#c99] p-4 text-center text-muted-foreground" colSpan={7}>No agents found</td></tr>
                  ) : filtered.map((a) => (
                    <tr key={a.id} style={{ backgroundColor: "#F5E6E0" }}>
                      <td className="border border-[#c99] px-3 py-2 text-xs">{a.name}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs">{a.company_name || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs">{a.phone || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs">{a.email || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs">{a.city?.name || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs">{a.commission_rate ?? "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs">{a.created_by ? getUserName(a.created_by) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
