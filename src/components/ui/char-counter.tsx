import { cn } from "@/lib/utils";

interface CharCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharCounter({ current, max, className }: CharCounterProps) {
  const ratio = current / max;
  return (
    <p
      className={cn(
        "text-xs text-muted-foreground text-end",
        ratio >= 0.9 && "text-destructive",
        className
      )}
      dir="ltr"
    >
      {current} / {max}
    </p>
  );
}
