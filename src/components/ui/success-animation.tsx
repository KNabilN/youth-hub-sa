import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  title: string;
  description?: string;
  className?: string;
}

export function SuccessAnimation({ title, description, className }: SuccessAnimationProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 animate-fade-in", className)}>
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--success))]/15 flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="h-10 w-10 text-[hsl(var(--success))]" />
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-[hsl(var(--success))]/30 animate-[ping_1.5s_ease-out_1]" />
      </div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
    </div>
  );
}
