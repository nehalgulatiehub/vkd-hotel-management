import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { Card, CardContent } from "@/components/ui/card";

export default function Agents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    agentName: "",
    email: "",
    cityId: "",
    user: "",
    contactNo: ""
  });

  useEffect(() => {
    fetchAgents();
    fetchCities();
    fetchUsers();
  }, []);

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("*, cities(name)")
      .order("name");

    if (!error) {
      setAgents(data || []);
    }
  };

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("*").order("name");
    setCities(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, username, first_name, last_name").order("username");
    setUsers(data || []);
  };

  const handleEdit = (agent: any) => {
    // Navigate to edit page (could be implemented later or use a query param)
    navigate(`/agents/add?edit=${agent.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (error) {
      toast.error("Error deleting agent");
    } else {
      toast.success("Agent deleted successfully");
      fetchAgents();
    }
  };

  const clearFilters = () => {
    setFilters({
      agentName: "",
      email: "",
      cityId: "",
      user: "",
      contactNo: ""
    });
  };

  const filteredAgents = agents.filter(agent => {
    const matchesName = !filters.agentName || 
      agent.name.toLowerCase().includes(filters.agentName.toLowerCase()) ||
      agent.company_name?.toLowerCase().includes(filters.agentName.toLowerCase());
    const matchesEmail = !filters.email || 
      agent.email?.toLowerCase().includes(filters.email.toLowerCase());
    const matchesCity = !filters.cityId || agent.city_id === filters.cityId;
    const matchesContact = !filters.contactNo || 
      agent.phone?.includes(filters.contactNo);
    
    return matchesName && matchesEmail && matchesCity && matchesContact;
  });

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredAgents, { itemsPerPage: 10 });

  return (
    <div className="min-h-screen bg-background">
      <Header title="Agent Management" />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-3" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">View Agent</span>
          <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={clearFilters}>
            View All Records
          </Button>
        </div>

        {/* Compact Filter Section */}
        <div className="mb-3 border border-border">
              <div className="bg-[#8B1538] text-white px-3 py-1.5 text-xs font-semibold">Search</div>
              <div className="bg-muted/50">
          {/* Row 1: Agent Name, Email */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">Agent Name :</span>
              <input 
                value={filters.agentName} 
                onChange={(e) => setFilters({...filters, agentName: e.target.value})} 
                className="h-5 w-40 text-[11px] border border-input bg-background px-1 rounded-sm" 
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">Email :</span>
              <input 
                value={filters.email} 
                onChange={(e) => setFilters({...filters, email: e.target.value})} 
                className="h-5 w-48 text-[11px] border border-input bg-background px-1 rounded-sm" 
              />
            </div>
          </div>

          {/* Row 2: City Name, User */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">City Name :</span>
              <select 
                value={filters.cityId} 
                onChange={(e) => setFilters({...filters, cityId: e.target.value})} 
                className="h-5 text-[11px] border border-input bg-background px-1 min-w-[150px] rounded-sm"
              >
                <option value="">-City-</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">User :</span>
              <select 
                value={filters.user} 
                onChange={(e) => setFilters({...filters, user: e.target.value})} 
                className="h-5 text-[11px] border border-input bg-background px-1 min-w-[100px] rounded-sm"
              >
                <option value="">--Select--</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Contact No, Search Button */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 py-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">Contact No :</span>
              <input 
                value={filters.contactNo} 
                onChange={(e) => setFilters({...filters, contactNo: e.target.value})} 
                className="h-5 w-40 text-[11px] border border-input bg-background px-1 rounded-sm" 
              />
            </div>
            <button className="h-6 px-4 text-[11px] bg-foreground text-background border border-foreground/80 hover:bg-foreground/90 rounded-sm">
              Search
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Main Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#D4A59A" }}>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Agent Name</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Email</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Commission %</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Address</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Contact Person</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Contact No.</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">
                        No agents found
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((agent) => (
                      <tr key={agent.id} style={{ backgroundColor: "#F5E6E0" }}>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="font-medium">{agent.name}</div>
                          {agent.company_name && (
                            <div className="text-muted-foreground">{agent.company_name}</div>
                          )}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {agent.email || "-"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {agent.commission_rate ? `${agent.commission_rate}%` : "%"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div>{agent.address || "-"}</div>
                          {agent.cities?.name && (
                            <div className="text-muted-foreground">{agent.cities.name}</div>
                          )}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {agent.notes || "-"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {agent.phone || "-"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="flex gap-2">
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary" onClick={() => handleEdit(agent)}>
                              Edit
                            </Button>
                            <span className="text-muted-foreground">/</span>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-destructive" onClick={() => handleDelete(agent.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
