import { useState, useEffect } from "react";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, ThemedActionLink, filterInputStyle } from "@/components/admin/AdminPageShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { format } from "date-fns";

interface NewsItem { id: string; title: string; content: string; created_at: string; }

export default function AdminNews() {
  const location = useLocation();
  const isAddMode = location.pathname.includes("/add");
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(isAddMode);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const canManage = isAdmin() || isAccount();

  useEffect(() => { const stored = localStorage.getItem("admin_news"); if (stored) setNews(JSON.parse(stored)); }, []);

  const saveNews = (items: NewsItem[]) => { localStorage.setItem("admin_news", JSON.stringify(items)); setNews(items); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNews) { saveNews(news.map((n) => n.id === editingNews.id ? { ...n, ...formData } : n)); toast.success("News updated successfully"); }
    else { saveNews([{ id: crypto.randomUUID(), ...formData, created_at: new Date().toISOString() }, ...news]); toast.success("News added successfully"); }
    resetForm();
  };

  const handleEdit = (item: NewsItem) => { setEditingNews(item); setFormData({ title: item.title, content: item.content }); setIsDialogOpen(true); };
  const handleDelete = (id: string) => { if (!confirm("Are you sure you want to delete this news?")) return; saveNews(news.filter((n) => n.id !== id)); toast.success("News deleted successfully"); };
  const resetForm = () => { setFormData({ title: "", content: "" }); setEditingNews(null); setIsDialogOpen(false); };

  const filteredNews = news.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));
  const pagination = usePagination(filteredNews);

  if (authLoading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 11 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24, textAlign: "center", fontSize: 11 }}>Access Denied</div>;

  const filterSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <span>Search :</span>
      <input value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...filterInputStyle, minWidth: 250 }} placeholder="Search news..." />
    </div>
  );

  return (
    <>
      <AdminPageShell title="News Manager" actions={[{ label: "Add News", onClick: () => { resetForm(); setIsDialogOpen(true); } }]} filterSection={filterSection} pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, onPageChange: pagination.goToPage, totalItems: pagination.totalItems, startIndex: pagination.startIndex, endIndex: pagination.endIndex }}>
        <ThemedTable>
          <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Title</ThemedTH><ThemedTH>Content</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Action</ThemedTH></ThemedTHead>
          <tbody>
            {pagination.paginatedItems.map((item, index) => (
              <ThemedTR key={item.id} index={index}>
                <ThemedTD>{pagination.startIndex + index + 1}</ThemedTD>
                <ThemedTD>{item.title}</ThemedTD>
                <ThemedTD>{item.content}</ThemedTD>
                <ThemedTD>{format(new Date(item.created_at), "dd/MM/yyyy")}</ThemedTD>
                <ThemedTD>
                  <ThemedActionLink onClick={() => handleEdit(item)}>Edit</ThemedActionLink>
                  <ThemedActionLink onClick={() => handleDelete(item.id)}>Delete</ThemedActionLink>
                </ThemedTD>
              </ThemedTR>
            ))}
            {filteredNews.length === 0 && <ThemedEmptyRow colSpan={5} message="No news found" />}
          </tbody>
        </ThemedTable>
      </AdminPageShell>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingNews ? "Edit News" : "Add News"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
            <div><Label>Content *</Label><Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows={4} /></div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit">{editingNews ? "Update" : "Add"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
