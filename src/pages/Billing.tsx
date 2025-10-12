import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax: number;
  total: number;
  paid: boolean;
  guests: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          guests (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.guests?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.guests?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header title="Billing" />
      <main className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold">Invoices & Billing</h2>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number or guest name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading invoices...</div>
        ) : (
          <div className="grid gap-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-lg mb-2">
                        Invoice #{invoice.invoice_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Guest: {invoice.guests?.first_name} {invoice.guests?.last_name}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={invoice.paid ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                        {invoice.paid ? "Paid" : "Pending"}
                      </Badge>
                      <p className="text-2xl font-bold text-primary">
                        ₹{invoice.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Issue Date</p>
                      <p className="font-medium">{new Date(invoice.issue_date).toLocaleDateString('en-IN')}</p>
                    </div>
                    {invoice.due_date && (
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="font-medium">₹{invoice.subtotal.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tax</p>
                      <p className="font-medium">₹{invoice.tax.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredInvoices.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "No invoices found matching your search" 
                  : "No invoices yet. Create your first invoice to get started."}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
