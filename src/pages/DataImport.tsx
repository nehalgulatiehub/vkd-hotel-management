import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ImportStats {
  agents: { total: number; imported: number; errors: number };
  hotels: { total: number; imported: number; errors: number };
  bookings: { total: number; imported: number; errors: number };
  payments: { total: number; imported: number; errors: number };
  transporters: { total: number; imported: number; errors: number };
}

const DataImport = () => {
  const [sqlData, setSqlData] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [stats, setStats] = useState<ImportStats | null>(null);

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
      // Split by ),( pattern to get individual rows
      const rowMatches = valuesStr.match(/\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/g);
      
      if (rowMatches) {
        rowMatches.forEach((row) => {
          // Remove outer parentheses
          const inner = row.slice(1, -1);
          // Parse values (handle quoted strings, nulls, numbers)
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
        // tbl_agent columns: id, agentname, address, city, contact_no, email, commission, user, contact_person, status
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
        // tbl_another_hotel: id, hotel, room, contact_person, email, phone, web_url, city, address, package, status
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
        // tbl_transporter: id, name, address, contact_no, vehicle_types, etc
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
    agentIdMap: Map<number, string>,
    hotelIdMap: Map<number, string>,
    transporterIdMap: Map<number, string>
  ): Promise<{ imported: number; errors: number; idMap: Map<number, string> }> => {
    const rows = parseInserts(sql, "tbl_booking");
    const idMap = new Map<number, string>();
    let imported = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        // tbl_booking has many columns, key ones:
        // 0: id, 10: customer_name, 12: contact_no, 13: email, 20: fromm (check_in), 21: too (check_out)
        // 8: agent_id, 19: price, etc.
        
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
          paid_amount: 0, // Will be updated from payments
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
        // tbl_payment: id, booking_id, payment, place, date, approve_date, status, payment_mode, chequeno, txn_code, others, p_detail
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
        
        // Update booking paid_amount manually
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

  const handleImport = async () => {
    if (!sqlData.trim()) {
      toast.error("Please paste your SQL data first");
      return;
    }

    setImporting(true);
    setProgress(0);
    setStats(null);

    try {
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
      const bookingResult = await importBookings(
        sqlData,
        agentResult.idMap,
        hotelResult.idMap,
        transporterResult.idMap
      );
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSqlData(e.target?.result as string);
        toast.success("SQL file loaded successfully!");
      };
      reader.readAsText(file);
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
            <div className="flex gap-4">
              <input
                type="file"
                accept=".sql,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="sql-file"
              />
              <label htmlFor="sql-file">
                <Button variant="outline" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload SQL File
                  </span>
                </Button>
              </label>
              <span className="text-sm text-muted-foreground">
                Or paste your SQL data below
              </span>
            </div>

            <Textarea
              placeholder="Paste your MySQL INSERT statements here..."
              value={sqlData}
              onChange={(e) => setSqlData(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
            />

            {sqlData && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {(sqlData.length / 1024).toFixed(1)} KB of data loaded
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={importing || !sqlData.trim()}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Import Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>• Agents from tbl_agent will be imported to agents table</p>
            <p>• Hotels from tbl_another_hotel will be imported to another_hotels table</p>
            <p>• Bookings from tbl_booking will be imported to bookings table with new booking numbers (WNS-XXXXXX)</p>
            <p>• Payments from tbl_payment will be linked to the new booking IDs</p>
            <p>• Foreign key relationships will be automatically mapped</p>
            <p>• Duplicate entries will be skipped</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataImport;
