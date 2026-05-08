// Compatibility wrapper: redirects all shadcn toast calls to sonner
import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  [key: string]: any;
}

function toast(opts: ToastOptions) {
  if (opts.variant === "destructive") {
    sonnerToast.error(opts.title ?? "", { description: opts.description });
  } else {
    sonnerToast.success(opts.title ?? "", { description: opts.description });
  }
}

function useToast() {
  return { toast, toasts: [] as any[], dismiss: (_id?: string) => {} };
}

export { useToast, toast };
