"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../utils/supabaseClient";

interface SupabaseAuthContextType {
  user: any;
  session: any;
  loading: boolean;
  error: string | null;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.getSession();
      setSession(data?.session || null);
      setUser(data?.session?.user || null);
      setLoading(false);
      if (error) setError(error.message);
    };
    getSession();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseAuthContext.Provider value={{ user, session, loading, error }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  return ctx;
} 