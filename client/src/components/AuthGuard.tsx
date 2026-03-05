import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Wraps a route component. If not authenticated, redirects to /login.
 * Shows a loading spinner while auth state is resolving.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--ff-bg-primary)" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--ff-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useAuth will handle the redirect
  }

  return <>{children}</>;
}
