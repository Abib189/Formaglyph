import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseMode } from "../services/dataMode";
import { supabase } from "../services/supabase";

interface AuthStateValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthStateContext = createContext<AuthStateValue | null>(null);

export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setSession(data.session);
      setError(sessionError?.message ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    if (!supabase) return;
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (signInError) { setError(signInError.message); throw signInError; }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) { setError(signOutError.message); throw signOutError; }
  }, []);

  const value = useMemo<AuthStateValue>(() => ({
    user: isSupabaseMode ? session?.user ?? null : ({ id: "local-admin", email: "demo@formaglyph.local" } as User),
    session,
    loading,
    error,
    signInWithMagicLink,
    signOut,
  }), [session, loading, error, signInWithMagicLink, signOut]);

  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
}

export function useAuthState() {
  const value = useContext(AuthStateContext);
  if (!value) throw new Error("useAuthState must be used inside AuthStateProvider.");
  return value;
}
