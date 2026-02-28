import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/useCategories";
import { useRegions } from "@/hooks/useRegions";
import { Tag, MapPin, Layers, Search, DollarSign } from "lucide-react";

interface Props {
  category: string;
  region: string;
  serviceType: string;
  searchQuery: string;
  priceMin: string;
  priceMax: string;
  onCategoryChange: (v: string) => void;
  onRegionChange: (v: string) => void;
  onServiceTypeChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
}

export function ServiceFilters({
  category, region, serviceType, searchQuery, priceMin, priceMax,
  onCategoryChange, onRegionChange, onServiceTypeChange, onSearchChange, onPriceMinChange, onPriceMaxChange,
}: Props) {
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();

  return (
    <div className="space-y-3 w-full">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="ابحث عن خدمة بالاسم أو الوصف..."
          className="pe-9 h-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Category */}
        <div className="flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="التصنيف" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Region */}
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Select value={region} onValueChange={onRegionChange}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="المنطقة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {regions?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Type */}
        <div className="flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <Select value={serviceType} onValueChange={onServiceTypeChange}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="النوع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="fixed_price">سعر ثابت</SelectItem>
              <SelectItem value="hourly">بالساعة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price range */}
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            value={priceMin}
            onChange={e => onPriceMinChange(e.target.value)}
            placeholder="من"
            className="w-[80px] h-9"
            min={0}
          />
          <span className="text-xs text-muted-foreground">-</span>
          <Input
            type="number"
            value={priceMax}
            onChange={e => onPriceMaxChange(e.target.value)}
            placeholder="إلى"
            className="w-[80px] h-9"
            min={0}
          />
        </div>
      </div>
    </div>
  );
}
