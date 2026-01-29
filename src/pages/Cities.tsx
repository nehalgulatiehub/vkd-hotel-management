import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";

export default function Cities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cities, setCities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(searchParams.get("add") === "true");
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    country: "India",
  });

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Error fetching cities");
    } else {
      setCities(data || []);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // React to URL changes for ?add=true
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsAddDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("cities").insert([formData]);

    if (error) {
      toast.error("Error adding city");
    } else {
      toast.success("City added successfully");
      setIsAddDialogOpen(false);
      setFormData({ name: "", state: "", country: "India" });
      fetchCities();
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredCities, { itemsPerPage: 10 });

  return (
    <div className="min-h-screen">
      <Header title="City Management" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Input
            placeholder="Search cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add City
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New City</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">City Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Add City</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((city) => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.state || "-"}</TableCell>
                  <TableCell>{city.country}</TableCell>
                  <TableCell>{new Date(city.created_at).toLocaleDateString("en-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </div>
      </main>
    </div>
  );
}
