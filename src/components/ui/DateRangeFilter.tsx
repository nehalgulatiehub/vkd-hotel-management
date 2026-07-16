import { DateInput } from "@/components/ui/DateInput";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar, X } from "lucide-react";

interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function DateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onSearch,
  onClear,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 p-3 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Date Range:</span>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="fromDate" className="text-sm text-muted-foreground">From:</Label>
        <DateInput
          id="fromDate"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="w-auto h-8 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="toDate" className="text-sm text-muted-foreground">To:</Label>
        <DateInput
          id="toDate"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="w-auto h-8 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSearch} className="h-8">
          Search
        </Button>
        <Button size="sm" variant="outline" onClick={onClear} className="h-8">
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}
