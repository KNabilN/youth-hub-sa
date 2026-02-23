import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-muted/80 flex items-center justify-center mb-5">
        <Icon className="h-10 w-10 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && (onAction || actionHref) && (
        <Button className="mt-5 shadow-md" onClick={() => onAction ? onAction() : actionHref && navigate(actionHref)}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
