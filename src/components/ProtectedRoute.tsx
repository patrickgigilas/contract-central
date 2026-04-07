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
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Assinatura inativa</h1>
          <p className="text-muted-foreground mb-4">Sua assinatura está inativa. Entre em contato para reativar.</p>
          <a href="https://wa.me/5519997950007" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
            Falar com suporte
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
