import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useRegions } from "@/hooks/useRegions";
import { Tag, MapPin, Layers } from "lucide-react";

interface Props {
  category: string;
  region: string;
  serviceType: string;
  onCategoryChange: (v: string) => void;
  onRegionChange: (v: string) => void;
  onServiceTypeChange: (v: string) => void;
}

export function ServiceFilters({ category, region, serviceType, onCategoryChange, onRegionChange, onServiceTypeChange }: Props) {
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="التصنيف" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Select value={region} onValueChange={onRegionChange}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="المنطقة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {regions?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1.5">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <Select value={serviceType} onValueChange={onServiceTypeChange}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="النوع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="fixed_price">سعر ثابت</SelectItem>
            <SelectItem value="hourly">بالساعة</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
