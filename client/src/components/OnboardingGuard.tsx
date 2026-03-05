import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

/**
 * Wraps authenticated routes. If onboarding is not complete,
 * redirects to /onboarding (or /avatar as fallback).
 */
export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const profileQuery = trpc.user.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (authLoading || profileQuery.isLoading) return;
    if (!isAuthenticated) return;

    const profile = profileQuery.data;
    if (profile && !profile.hasCompletedOnboarding) {
      navigate("/onboarding");
    }
  }, [authLoading, isAuthenticated, profileQuery.isLoading, profileQuery.data, navigate]);

  if (authLoading || (isAuthenticated && profileQuery.isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--ff-bg-primary)" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--ff-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return <>{children}</>;
}
