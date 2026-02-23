import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useRegions } from "@/hooks/useRegions";

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
    <div className="flex flex-wrap gap-3">
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="التصنيف" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">الكل</SelectItem>
          {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={region} onValueChange={onRegionChange}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="المنطقة" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">الكل</SelectItem>
          {regions?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={serviceType} onValueChange={onServiceTypeChange}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="النوع" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">الكل</SelectItem>
          <SelectItem value="fixed_price">سعر ثابت</SelectItem>
          <SelectItem value="hourly">بالساعة</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
