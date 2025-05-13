"use client";
import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useSupabaseAuth } from "./SupabaseAuthProvider";

export function AuthButtons() {
  const { user, loading, error } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const handleSignUp = async () => {
    setLocalLoading(true);
    setLocalError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLocalLoading(false);
    if (error) setLocalError(error.message);
  };

  const handleSignIn = async () => {
    setLocalLoading(true);
    setLocalError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLocalLoading(false);
    if (error) setLocalError(error.message);
  };

  const handleGoogleSignIn = async () => {
    setLocalLoading(true);
    setLocalError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    setLocalLoading(false);
    if (error) setLocalError(error.message);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card max-w-md mx-auto mt-12 text-center flex flex-col gap-6 shadow-xl border border-gray-100">
      {user ? (
        <>
          <h1 className="text-3xl font-extrabold mb-1 text-primary">Welcome back!</h1>
          <div className="mb-2 text-lg font-medium text-gray-700">{user.email}</div>
          <button className="mt-2 w-full" onClick={handleSignOut}>Sign Out</button>
          <div className="text-success mt-4 text-base font-semibold">You are logged in. Enjoy your dashboard!</div>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-extrabold mb-2 text-primary">Repurpose AI 💜</h1>
          <p className="mb-6 text-gray-500 text-lg">Sign in or create an account to get started.</p>
          <div className="flex flex-col gap-3 mb-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={localLoading}
              className="text-base"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={localLoading}
              className="text-base"
            />
          </div>
          <div className="flex flex-col gap-2 mb-2">
            <button className="w-full" onClick={handleSignUp} disabled={localLoading}>Sign Up</button>
            <button className="w-full" onClick={handleSignIn} disabled={localLoading}>Sign In</button>
            <button
              className="w-full bg-white text-[#ea4335] border border-[#ea4335] hover:bg-[#ea4335] hover:text-white transition"
              onClick={handleGoogleSignIn}
              disabled={localLoading}
              style={{ fontWeight: 700 }}
            >
              <span className="inline-block align-middle mr-2">G</span>Sign In with Google
            </button>
          </div>
          {(localError || error) && <div className="text-danger mt-2 text-base font-semibold">{localError || error}</div>}
        </>
      )}
    </div>
  );
} 