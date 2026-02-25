import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRegions } from "@/hooks/useRegions";

export interface ReportFilterValues {
  dateFrom: Date;
  dateTo: Date;
  regionId: string | null;
}

interface ReportFiltersProps {
  filters: ReportFilterValues;
  onChange: (filters: ReportFilterValues) => void;
}

const presets = [
  { label: "آخر شهر", value: 1 },
  { label: "آخر 3 أشهر", value: 3 },
  { label: "آخر 6 أشهر", value: 6 },
  { label: "آخر سنة", value: 12 },
];

export function getDefaultFilters(): ReportFilterValues {
  return {
    dateFrom: subMonths(new Date(), 6),
    dateTo: new Date(),
    regionId: null,
  };
}

export function ReportFilters({ filters, onChange }: ReportFiltersProps) {
  const { data: regions } = useRegions();

  const applyPreset = (months: number) => {
    onChange({
      ...filters,
      dateFrom: subMonths(new Date(), months),
      dateTo: new Date(),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />

      {/* Date From */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("text-xs gap-1", !filters.dateFrom && "text-muted-foreground")}>
            <CalendarIcon className="h-3.5 w-3.5" />
            {filters.dateFrom ? format(filters.dateFrom, "yyyy/MM/dd") : "من"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateFrom}
            onSelect={(d) => d && onChange({ ...filters, dateFrom: d })}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <span className="text-xs text-muted-foreground">إلى</span>

      {/* Date To */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("text-xs gap-1", !filters.dateTo && "text-muted-foreground")}>
            <CalendarIcon className="h-3.5 w-3.5" />
            {filters.dateTo ? format(filters.dateTo, "yyyy/MM/dd") : "إلى"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateTo}
            onSelect={(d) => d && onChange({ ...filters, dateTo: d })}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Region */}
      <Select
        value={filters.regionId ?? "all"}
        onValueChange={(v) => onChange({ ...filters, regionId: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="المنطقة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل المناطق</SelectItem>
          {(regions ?? []).map((r) => (
            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Quick presets */}
      <div className="flex gap-1">
        {presets.map((p) => (
          <Button key={p.value} variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => applyPreset(p.value)}>
            {p.label}
          </Button>
        ))}
      </div>

      <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => onChange(getDefaultFilters())}>
        <RotateCcw className="h-3 w-3 ml-1" />إعادة تعيين
      </Button>
    </div>
  );
}
