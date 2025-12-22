import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users } from "lucide-react";

interface RestaurantTable {
  id: string;
  table_number: string;
  table_name: string | null;
  capacity: number;
  status: string;
  notes: string | null;
}

const RestaurantTables = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [formData, setFormData] = useState({
    table_number: "",
    table_name: "",
    capacity: "4",
    status: "available",
    notes: ""
  });

  const { data: tables, isLoading } = useQuery({
    queryKey: ["restaurant-tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("*")
        .order("table_number");
      if (error) throw error;
      return data as RestaurantTable[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const tableData = {
        table_number: data.table_number,
        table_name: data.table_name || null,
        capacity: parseInt(data.capacity),
        status: data.status,
        notes: data.notes || null
      };

      if (editingTable) {
        const { error } = await supabase
          .from("restaurant_tables")
          .update(tableData)
          .eq("id", editingTable.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("restaurant_tables")
          .insert(tableData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
      toast.success(editingTable ? "Table updated successfully" : "Table added successfully");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
      toast.success("Table deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setFormData({ table_number: "", table_name: "", capacity: "4", status: "available", notes: "" });
    setEditingTable(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (table: RestaurantTable) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      table_name: table.table_name || "",
      capacity: String(table.capacity),
      status: table.status,
      notes: table.notes || ""
    });
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-success/20 text-success border-success/30";
      case "occupied": return "bg-destructive/20 text-destructive border-destructive/30";
      case "reserved": return "bg-warning/20 text-warning border-warning/30";
      case "maintenance": return "bg-muted text-muted-foreground border-muted";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Tables</h1>
          <p className="text-muted-foreground">Manage your restaurant tables</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTable ? "Edit Table" : "Add New Table"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Table Number <span className="text-destructive">*</span></Label>
                  <Input
                    required
                    placeholder="e.g., T1, T2"
                    value={formData.table_number}
                    onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Table Name</Label>
                  <Input
                    placeholder="e.g., Window Table"
                    value={formData.table_name}
                    onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables?.map((table) => (
          <Card key={table.id} className={`relative border-2 ${getStatusColor(table.status)}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{table.table_number}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(table)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 text-destructive" 
                    onClick={() => deleteMutation.mutate(table.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {table.table_name && <p className="text-sm font-medium">{table.table_name}</p>}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3 w-3" /> {table.capacity}
              </div>
              <p className="text-xs mt-1 capitalize">{table.status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!tables || tables.length === 0) && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No tables found. Add your first table to get started.</p>
        </Card>
      )}
    </div>
  );
};

export default RestaurantTables;
