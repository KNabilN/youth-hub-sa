import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
}

const sizeMap = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };

export function StarRating({ value, onChange, max = 5, size = "md", readonly = false, showValue = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= display;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={cn(
              "transition-transform",
              !readonly && "hover:scale-125 cursor-pointer",
              readonly && "cursor-default"
            )}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
          >
            <Star
              className={cn(
                sizeMap[size],
                "transition-colors",
                filled ? "text-warning fill-warning" : "text-muted-foreground/30"
              )}
            />
          </button>
        );
      })}
      {showValue && <span className="text-sm font-semibold ms-1">{value}/{max}</span>}
    </div>
  );
}
