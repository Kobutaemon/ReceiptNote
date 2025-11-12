import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { AuthContext, useAuth } from "./authContext";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) {
          return;
        }

        if (error) {
          console.error("Failed to retrieve auth session", error);
          setSession(null);
          setStatus("unauthenticated");
          return;
        }

        const currentSession = data.session ?? null;
        setSession(currentSession);
        setStatus(currentSession ? "authenticated" : "unauthenticated");
      } catch (initializationError) {
        if (isMounted) {
          console.error(
            "Unexpected error while initializing auth",
            initializationError
          );
          setSession(null);
          setStatus("unauthenticated");
        }
      }
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      status,
    }),
    [session, status]
  );

  if (value.status === undefined) {
    // This should never happen, but guards against provider misuse.
    throw new Error("AuthProvider failed to determine auth status");
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthStatusGate({ children, fallback, loading }) {
  const { status } = useAuth();

  if (status === "checking") {
    return typeof loading === "function" ? loading() : loading ?? null;
  }

  if (status === "authenticated") {
    return children;
  }

  return typeof fallback === "function" ? fallback() : fallback ?? null;
}
