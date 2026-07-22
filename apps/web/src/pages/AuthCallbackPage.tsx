import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RouteLoading } from "../components/Layout";
import { requireSupabaseClient } from "../services/supabase";
import { useAuthState } from "../state/AuthState";

export function AuthCallbackPage() {
  const { user, loading } = useAuthState();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading || !user) return;
    void requireSupabaseClient().from("projects").select("slug").limit(1).then(({ data }) => {
      navigate(data?.[0] ? `/projects/${data[0].slug}/workspace` : "/onboarding", { replace: true });
    });
  }, [loading, navigate, user]);
  return <RouteLoading label="Restoring secure session" />;
}
