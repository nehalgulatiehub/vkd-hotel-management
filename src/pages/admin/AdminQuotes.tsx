import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { format } from "date-fns";

interface QuoteItem {
  id: string;
  text: string;
  author: string;
  created_at: string;
}

export default function AdminQuotes() {
  const location = useLocation();
  const isAddMode = location.pathname.includes("/add");
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(isAddMode);
  const [editingQuote, setEditingQuote] = useState<QuoteItem | null>(null);
  const [formData, setFormData] = useState({ text: "", author: "" });

  const canManage = isAdmin() || isAccount();

  const fetchQuotes = async () => {
    const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false });
    if (!error) setQuotes(data || []);
  };

  useEffect(() => { fetchQuotes(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuote) {
      const { error } = await supabase.from("quotes").update({ text: formData.text, author: formData.author }).eq("id", editingQuote.id);
      if (error) { toast.error("Failed to update quote"); return; }
      toast.success("Quote updated successfully");
    } else {
      const { error } = await supabase.from("quotes").insert({ text: formData.text, author: formData.author });
      if (error) { toast.error("Failed to add quote"); return; }
      toast.success("Quote added successfully");
    }
    resetForm();
    fetchQuotes();
  };

  const handleEdit = (item: QuoteItem) => {
    setEditingQuote(item);
    setFormData({ text: item.text, author: item.author });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quote?")) return;
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) { toast.error("Failed to delete quote"); return; }
    toast.success("Quote deleted successfully");
    fetchQuotes();
  };

  const resetForm = () => {
    setFormData({ text: "", author: "" });
    setEditingQuote(null);
    setIsDialogOpen(false);
  };

  const filteredQuotes = quotes.filter((item) =>
    item.text.toLowerCase().includes(search.toLowerCase()) ||
    (item.author || "").toLowerCase().includes(search.toLowerCase())
  );

  const pagination = usePagination(filteredQuotes);

  if (authLoading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!canManage) return <div className="p-6 text-center text-muted-foreground">Access Denied</div>;

  return (
    <>
      <AdminPageShell
        title="Quote Manager"
        actions={[{ label: "Add Quote", onClick: () => { resetForm(); setIsDialogOpen(true); } }]}
        filterSection={
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700 w-20 text-right">Search :</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 max-w-sm h-7 text-xs" placeholder="Search quotes..." />
          </div>
        }
        pagination={{
          currentPage: pagination.currentPage, totalPages: pagination.totalPages,
          onPageChange: pagination.goToPage, totalItems: pagination.totalItems,
          startIndex: pagination.startIndex, endIndex: pagination.endIndex,
        }}
      >
        <ThemedTable>
          <ThemedTHead>
            <ThemedTH className="w-12 text-center">S.No</ThemedTH>
            <ThemedTH>Quote</ThemedTH>
            <ThemedTH>Author</ThemedTH>
            <ThemedTH>Date</ThemedTH>
            <ThemedTH className="text-center w-24">Action</ThemedTH>
          </ThemedTHead>
          <tbody>
            {pagination.paginatedItems.map((item, index) => (
              <ThemedTR key={item.id} index={index}>
                <ThemedTD className="text-center">{pagination.startIndex + index}</ThemedTD>
                <ThemedTD className="max-w-md">{item.text}</ThemedTD>
                <ThemedTD>{item.author || "-"}</ThemedTD>
                <ThemedTD>{format(new Date(item.created_at), "dd/MM/yyyy")}</ThemedTD>
                <ThemedTD className="text-center">
                  <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <span className="text-gray-400 mx-1">/</span>
                  <button onClick={() => handleDelete(item.id)} className="text-blue-600 hover:underline text-xs">Delete</button>
                </ThemedTD>
              </ThemedTR>
            ))}
            {filteredQuotes.length === 0 && <ThemedEmptyRow colSpan={5} message="No quotes found" />}
          </tbody>
        </ThemedTable>
      </AdminPageShell>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQuote ? "Edit Quote" : "Add Quote"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Quote Text *</Label>
              <Textarea value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })} required rows={3} />
            </div>
            <div>
              <Label>Author</Label>
              <Input value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit">{editingQuote ? "Update" : "Add"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
