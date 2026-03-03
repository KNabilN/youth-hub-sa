import { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import { CalendarIcon, Filter, RotateCcw, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRegions } from "@/hooks/useRegions";
import { useCities } from "@/hooks/useCities";
import { toast } from "sonner";

export interface ReportFilterValues {
  dateFrom: Date;
  dateTo: Date;
  regionId: string | null;
  cityId: string | null;
}

interface SavedFilter {
  name: string;
  filters: { dateFrom: string; dateTo: string; regionId: string | null; cityId: string | null };
}

interface ReportFiltersProps {
  filters: ReportFilterValues;
  onChange: (filters: ReportFilterValues) => void;
}

const SAVED_FILTERS_KEY = "report_saved_filters";

const presets = [
  { label: "آخر شهر", value: 1 },
  { label: "آخر 3 أشهر", value: 3 },
  { label: "آخر 6 أشهر", value: 6 },
  { label: "آخر سنة", value: 12 },
];

function loadSavedFilters(): SavedFilter[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) || "[]");
  } catch { return []; }
}

function persistSavedFilters(items: SavedFilter[]) {
  localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(items));
}

export function getDefaultFilters(): ReportFilterValues {
  return {
    dateFrom: subMonths(new Date(), 6),
    dateTo: new Date(),
    regionId: null,
    cityId: null,
  };
}

export function ReportFilters({ filters, onChange }: ReportFiltersProps) {
  const { data: regions } = useRegions();
  const { data: cities } = useCities(filters.regionId);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(loadSavedFilters);

  // Auto-clear city when region changes
  useEffect(() => {
    if (filters.cityId && cities && !cities.find((c) => c.id === filters.cityId)) {
      onChange({ ...filters, cityId: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.regionId]);

  const saveCurrentFilter = () => {
    const name = prompt("اسم الفلتر المحفوظ:");
    if (!name?.trim()) return;
    const entry: SavedFilter = {
      name: name.trim(),
      filters: {
        dateFrom: filters.dateFrom.toISOString(),
        dateTo: filters.dateTo.toISOString(),
        regionId: filters.regionId,
        cityId: filters.cityId,
      },
    };
    const updated = [...savedFilters.filter((f) => f.name !== entry.name), entry];
    setSavedFilters(updated);
    persistSavedFilters(updated);
    toast.success("تم حفظ الفلتر");
  };

  const applySavedFilter = (name: string) => {
    const found = savedFilters.find((f) => f.name === name);
    if (!found) return;
    onChange({
      dateFrom: new Date(found.filters.dateFrom),
      dateTo: new Date(found.filters.dateTo),
      regionId: found.filters.regionId,
      cityId: found.filters.cityId ?? null,
    });
  };

  const deleteSavedFilter = (name: string) => {
    const updated = savedFilters.filter((f) => f.name !== name);
    setSavedFilters(updated);
    persistSavedFilters(updated);
    toast.success("تم حذف الفلتر");
  };

  const applyPreset = (months: number) => {
    onChange({
      ...filters,
      dateFrom: subMonths(new Date(), months),
      dateTo: new Date(),
    });
  };

  const handleRegionChange = (v: string) => {
    onChange({ ...filters, regionId: v === "all" ? null : v, cityId: null });
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
        onValueChange={handleRegionChange}
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

      {/* City */}
      <Select
        value={filters.cityId ?? "all"}
        onValueChange={(v) => onChange({ ...filters, cityId: v === "all" ? null : v })}
        disabled={!filters.regionId}
      >
        <SelectTrigger className={cn("w-[140px] h-8 text-xs", !filters.regionId && "opacity-50")}>
          <SelectValue placeholder="المدينة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل المدن</SelectItem>
          {(cities ?? []).map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
        <RotateCcw className="h-3 w-3 me-1" />إعادة تعيين
      </Button>

      {/* Save / Load filters */}
      <Button variant="outline" size="sm" className="text-xs h-7 px-2 gap-1" onClick={saveCurrentFilter}>
        <Star className="h-3 w-3" />حفظ الفلتر
      </Button>

      {savedFilters.length > 0 && (
        <Select onValueChange={applySavedFilter}>
          <SelectTrigger className="w-[150px] h-7 text-xs">
            <SelectValue placeholder="فلاتر محفوظة" />
          </SelectTrigger>
          <SelectContent>
            {savedFilters.map((sf) => (
              <div key={sf.name} className="flex items-center justify-between pe-2">
                <SelectItem value={sf.name} className="flex-1">{sf.name}</SelectItem>
                <button
                  type="button"
                  className="p-0.5 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); deleteSavedFilter(sf.name); }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
