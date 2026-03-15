// Centralized dispute status labels and colors
export const disputeStatusLabels: Record<string, string> = {
  open: "مفتوح",
  waiting_response: "بانتظار الرد",
  under_review: "قيد المراجعة",
  info_requested: "طلب معلومات إضافية",
  preliminary_decision: "قرار مبدئي",
  final_decision: "قرار نهائي",
  resolved: "تم الحل",
  closed: "مغلق",
};

export const disputeStatusColors: Record<string, string> = {
  open: "bg-destructive/10 text-destructive",
  waiting_response: "bg-orange-500/10 text-orange-600",
  under_review: "bg-warning/10 text-warning",
  info_requested: "bg-info/10 text-info",
  preliminary_decision: "bg-primary/10 text-primary",
  final_decision: "bg-primary/20 text-primary",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

export const disputeTimelineColors: Record<string, string> = {
  open: "bg-destructive",
  waiting_response: "bg-orange-500",
  under_review: "bg-warning",
  info_requested: "bg-info",
  preliminary_decision: "bg-primary",
  final_decision: "bg-primary",
  resolved: "bg-success",
  closed: "bg-muted-foreground",
};

export const allDisputeStatuses = [
  "open",
  "waiting_response",
  "under_review",
  "info_requested",
  "preliminary_decision",
  "final_decision",
  "resolved",
  "closed",
  "archived",
] as const;
