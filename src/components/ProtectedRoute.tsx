import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (profile?.is_suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 max-w-md p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">تم تعليق حسابك</h2>
          <p className="text-muted-foreground">تم تعليق حسابك من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني لمزيد من المعلومات.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
