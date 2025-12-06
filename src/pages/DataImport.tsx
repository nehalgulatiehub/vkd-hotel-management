import { useState, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle, AlertCircle, Loader2, FileText } from "lucide-react";

interface ImportStats {
  agents: { total: number; imported: number; errors: number };
  hotels: { total: number; imported: number; errors: number };
  bookings: { total: number; imported: number; errors: number };
  payments: { total: number; imported: number; errors: number };
  transporters: { total: number; imported: number; errors: number };
}

const DataImport = () => {
  // Store File reference instead of content to prevent memory issues
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [stats, setStats] = useState<ImportStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse MySQL INSERT statements
  const parseInserts = (sql: string, tableName: string): any[] => {
    const regex = new RegExp(
      `INSERT INTO \`${tableName}\`[^;]*VALUES\\s*([\\s\\S]*?)(?:;|$)`,
      "gi"
    );
    const results: any[] = [];
    let match;

    while ((match = regex.exec(sql)) !== null) {
      const valuesStr = match[1];
      const rowMatches = valuesStr.match(/\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/g);
      
      if (rowMatches) {
        rowMatches.forEach((row) => {
          const inner = row.slice(1, -1);
          const values = parseRowValues(inner);
          results.push(values);
        });
      }
    }
    return results;
  };

  const parseRowValues = (rowStr: string): any[] => {
    const values: any[] = [];
    let current = "";
    let inString = false;
    let stringChar = "";
    let i = 0;

    while (i < rowStr.length) {
      const char = rowStr[i];
      
      if (!inString && (char === "'" || char === '"')) {
        inString = true;
        stringChar = char;
        i++;
        continue;
      }
      
      if (inString && char === stringChar) {
        if (rowStr[i + 1] === stringChar) {
          current += char;
          i += 2;
          continue;
        }
        inString = false;
        i++;
        continue;
      }
      
      if (!inString && char === ",") {
        values.push(parseValue(current.trim()));
        current = "";
        i++;
        continue;
      }
      
      current += char;
      i++;
    }
    
    if (current.trim()) {
      values.push(parseValue(current.trim()));
    }
    
    return values;
  };

  const parseValue = (val: string): any => {
    if (val === "NULL" || val === "null" || val === "") return null;
    if (val === "0") return 0;
    if (/^-?\d+$/.test(val)) return parseInt(val, 10);
    if (/^-?\d+\.?\d*$/.test(val)) return parseFloat(val);
    return val.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\'/g, "'");
  };

  const importAgents = async (sql: string): Promise<{ imported: number; errors: number; idMap: Map<number, string> }> => {
    const rows = parseInserts(sql, "tbl_agent");
    const idMap = new Map<number, string>();
    let imported = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const agentData = {
          name: row[1] || "Unknown Agent",
          address: row[2] || null,
          phone: row[4] || null,
          email: (row[5] || "").split(",")[0]?.trim() || null,
          commission_rate: row[6] ? parseFloat(row[6]) || 0 : 0,
          notes: row[8] ? `Contact: ${row[8]}` : null,
        };

        const { data, error } = await supabase
          .from("agents")
          .insert(agentData)
          .select("id")
          .single();

        if (error) throw error;
        idMap.set(row[0], data.id);
        imported++;
      } catch (e) {
        console.error("Agent import error:", e, row);
        errors++;
      }
    }

    return { imported, errors, idMap };
  };

  const importHotels = async (sql: string): Promise<{ imported: number; errors: number; idMap: Map<number, string> }> => {
    const rows = parseInserts(sql, "tbl_another_hotel");
    const idMap = new Map<number, string>();
    let imported = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const hotelData = {
          name: row[1] || "Unknown Hotel",
          contact_person: row[3] || null,
          email: row[4] || null,
          phone: row[5] || null,
          address: row[8] || null,
          notes: row[9] ? `Package: ${row[9]}` : null,
        };

        const { data, error } = await supabase
          .from("another_hotels")
          .insert(hotelData)
          .select("id")
          .single();

        if (error) throw error;
        idMap.set(row[0], data.id);
        imported++;
      } catch (e) {
        console.error("Hotel import error:", e, row);
        errors++;
      }
    }

    return { imported, errors, idMap };
  };

  const importTransporters = async (sql: string): Promise<{ imported: number; errors: number; idMap: Map<number, string> }> => {
    const rows = parseInserts(sql, "tbl_transporter");
    const idMap = new Map<number, string>();
    let imported = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const transporterData = {
          name: row[1] || "Unknown Transporter",
          address: row[2] || null,
          phone: row[3] || null,
          notes: row[4] || null,
        };

        const { data, error } = await supabase
          .from("transporters")
          .insert(transporterData)
          .select("id")
          .single();

        if (error) throw error;
        idMap.set(row[0], data.id);
        imported++;
      } catch (e) {
        console.error("Transporter import error:", e, row);
        errors++;
      }
    }

    return { imported, errors, idMap };
  };

  const importBookings = async (
    sql: string,
    agentIdMap: Map<number, string>
  ): Promise<{ imported: number; errors: number; idMap: Map<number, string> }> => {
    const rows = parseInserts(sql, "tbl_booking");
    const idMap = new Map<number, string>();
    let imported = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const bookingNumber = `WNS-${row[0].toString().padStart(6, "0")}`;
        const agentId = row[8] ? agentIdMap.get(row[8]) : null;
        
        const bookingData = {
          booking_number: bookingNumber,
          customer_name: row[10] || null,
          contact_no: row[12] || null,
          email: row[13] || null,
          check_in_date: row[20] || new Date().toISOString().split("T")[0],
          check_out_date: row[21] || new Date().toISOString().split("T")[0],
          adults: row[17] || 1,
          children: row[18] || 0,
          total_amount: row[19] || 0,
          paid_amount: 0,
          due_amount: row[19] || 0,
          agent_id: agentId,
          notes: row[20] || null,
          booking_type: row[7] === "Agent" ? "agent" : "direct",
          status: (row[46] === 1 ? "cancelled" : "confirmed") as "cancelled" | "completed" | "confirmed" | "enquiry" | "hold",
          include_safari: row[40] === 1,
          include_delhi_manali: row[23] === 1,
          include_manali_delhi: row[31] === 1,
          include_another_hotel: row[45] === 1,
          include_additional_vehicle: row[53] === 1,
        };

        const { data, error } = await supabase
          .from("bookings")
          .insert([bookingData])
          .select("id")
          .single();

        if (error) throw error;
        idMap.set(row[0], data.id);
        imported++;
      } catch (e) {
        console.error("Booking import error:", e, row);
        errors++;
      }
    }

    return { imported, errors, idMap };
  };

  const importPayments = async (
    sql: string,
    bookingIdMap: Map<number, string>
  ): Promise<{ imported: number; errors: number }> => {
    const rows = parseInserts(sql, "tbl_payment");
    let imported = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const bookingId = bookingIdMap.get(row[1]);
        if (!bookingId) continue;

        const paymentData = {
          booking_id: bookingId,
          amount: row[2] || 0,
          payment_date: row[4] || new Date().toISOString().split("T")[0],
          payment_mode: row[7] || "Cash",
          reference_number: row[8] || row[9] || null,
          notes: row[11] || null,
        };

        const { error } = await supabase.from("payments").insert(paymentData);

        if (error) throw error;
        
        const { data: booking } = await supabase
          .from("bookings")
          .select("paid_amount, total_amount")
          .eq("id", bookingId)
          .single();
        
        if (booking) {
          const newPaidAmount = (booking.paid_amount || 0) + (row[2] || 0);
          await supabase
            .from("bookings")
            .update({
              paid_amount: newPaidAmount,
              due_amount: (booking.total_amount || 0) - newPaidAmount,
            })
            .eq("id", bookingId);
        }

        imported++;
      } catch (e) {
        console.error("Payment import error:", e, row);
        errors++;
      }
    }

    return { imported, errors };
  };

  // Read file content only when import starts
  const readFileContent = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (manualInput.trim()) {
        resolve(manualInput);
        return;
      }
      
      if (!selectedFile) {
        reject(new Error("No file selected"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(selectedFile);
    });
  };

  const handleImport = async () => {
    if (!selectedFile && !manualInput.trim()) {
      toast.error("Please upload a file or paste SQL data first");
      return;
    }

    setImporting(true);
    setProgress(0);
    setStats(null);

    try {
      // Read file content at import time (not stored in state)
      setCurrentStep("Reading file...");
      const sqlData = await readFileContent();
      setProgress(5);

      // Step 1: Import Agents (20%)
      setCurrentStep("Importing agents...");
      const agentResult = await importAgents(sqlData);
      setProgress(20);

      // Step 2: Import Hotels (40%)
      setCurrentStep("Importing hotels...");
      const hotelResult = await importHotels(sqlData);
      setProgress(40);

      // Step 3: Import Transporters (50%)
      setCurrentStep("Importing transporters...");
      const transporterResult = await importTransporters(sqlData);
      setProgress(50);

      // Step 4: Import Bookings (80%)
      setCurrentStep("Importing bookings...");
      const bookingResult = await importBookings(sqlData, agentResult.idMap);
      setProgress(80);

      // Step 5: Import Payments (100%)
      setCurrentStep("Importing payments...");
      const paymentResult = await importPayments(sqlData, bookingResult.idMap);
      setProgress(100);

      setStats({
        agents: { total: agentResult.imported + agentResult.errors, imported: agentResult.imported, errors: agentResult.errors },
        hotels: { total: hotelResult.imported + hotelResult.errors, imported: hotelResult.imported, errors: hotelResult.errors },
        bookings: { total: bookingResult.imported + bookingResult.errors, imported: bookingResult.imported, errors: bookingResult.errors },
        payments: { total: paymentResult.imported + paymentResult.errors, imported: paymentResult.imported, errors: paymentResult.errors },
        transporters: { total: transporterResult.imported + transporterResult.errors, imported: transporterResult.imported, errors: transporterResult.errors },
      });

      toast.success("Import completed successfully!");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Import failed. Check console for details.");
    } finally {
      setImporting(false);
      setCurrentStep("");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setManualInput(""); // Clear manual input when file is selected
      toast.success(`File "${file.name}" selected (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setManualInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <Header title="Data Import" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Legacy Data
            </CardTitle>
            <CardDescription>
              Upload your MySQL SQL dump file to import agents, hotels, bookings, and payments into the new system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="sql-file"
              />
              <label htmlFor="sql-file">
                <Button variant="outline" asChild disabled={importing}>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {selectedFile ? "Change File" : "Upload SQL File"}
                  </span>
                </Button>
              </label>
              {!selectedFile && (
                <span className="text-sm text-muted-foreground">
                  Or paste small SQL data below
                </span>
              )}
            </div>

            {selectedFile ? (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB ready for import
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={clearSelection}
                  disabled={importing}
                >
                  Clear selection
                </Button>
              </div>
            ) : (
              <Textarea
                placeholder="Paste your MySQL INSERT statements here (for small files only, max ~5MB)..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="min-h-[150px] font-mono text-xs"
                disabled={importing}
              />
            )}

            <Button
              onClick={handleImport}
              disabled={importing || (!selectedFile && !manualInput.trim())}
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {currentStep}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Import
                </>
              )}
            </Button>

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  {progress}% complete
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="p-4 border rounded-lg">
                    <h4 className="font-medium capitalize mb-2">{key}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <Badge variant="outline">{value.total}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Imported:</span>
                        <Badge variant="default" className="bg-green-500">
                          {value.imported}
                        </Badge>
                      </div>
                      {value.errors > 0 && (
                        <div className="flex justify-between">
                          <span>Errors:</span>
                          <Badge variant="destructive">{value.errors}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DataImport;
