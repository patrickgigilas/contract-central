import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, subscription } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (subscription && subscription.status !== "active") {
    return <Navigate to="/pricing" replace />;
  }

  if (!subscription) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
