import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalFetched: number;
  onPrev: () => void;
  onNext: () => void;
}

export function PaginationControls({ page, pageSize, totalFetched, onPrev, onNext }: PaginationControlsProps) {
  const hasNext = totalFetched === pageSize;
  const hasPrev = page > 0;

  if (!hasPrev && !hasNext) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <Button variant="outline" size="sm" disabled={!hasPrev} onClick={onPrev}>
        <ChevronRight className="h-4 w-4 me-1" />
        السابق
      </Button>
      <span className="text-sm text-muted-foreground">صفحة {page + 1}</span>
      <Button variant="outline" size="sm" disabled={!hasNext} onClick={onNext}>
        التالي
        <ChevronLeft className="h-4 w-4 ms-1" />
      </Button>
    </div>
  );
}
