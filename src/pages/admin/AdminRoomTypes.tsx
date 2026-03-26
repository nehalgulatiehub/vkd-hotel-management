import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";

export default function AdminRoomTypes() {
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const canManage = isAdmin() || isAccount();

  useEffect(() => { if (!authLoading && canManage) fetchRoomTypes(); }, [authLoading, canManage]);

  const fetchRoomTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("rooms").select("room_type");
    if (!error) setRoomTypes([...new Set(data?.map((r) => r.room_type) || [])].sort());
    setLoading(false);
  };

  const filteredRoomTypes = roomTypes.filter((type) => type.toLowerCase().includes(search.toLowerCase()));
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredRoomTypes);

  if (authLoading || loading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!canManage) return <div className="p-6 text-center">Access Denied</div>;

  const filterSection = (
    <div className="flex items-center gap-2 text-xs">
      <span>Search :</span>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search room types..." className="border px-2 py-0.5 text-xs min-w-[200px]" />
    </div>
  );

  return (
    <AdminPageShell title="Room Type Manager" filterSection={filterSection} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      <ThemedTable>
        <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Room Type</ThemedTH></ThemedTHead>
        <tbody>
          {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={2} message="No room types found" /> : paginatedItems.map((type, index) => (
            <ThemedTR key={type} index={index}>
              <ThemedTD>{startIndex + index + 1}</ThemedTD>
              <ThemedTD>{type}</ThemedTD>
            </ThemedTR>
          ))}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
