import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/supabase';

const AuthContext = createContext(null);

/**
 * Wraps the app and provides the current Supabase session + helpers.
 * All authentication is done via Supabase — the FastAPI backend simply
 * verifies the Supabase JWT (ES256) that the frontend passes in the
 * Authorization header.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the initial session (in case the user is already logged in from a
    // previous visit — Supabase persists the session in localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for future auth state changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sign in with email + password via Supabase Auth.
   * Returns { error } if sign-in fails, or { error: null } on success.
   */
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  /**
   * Sign up a new user via Supabase Auth.
   * Returns { error } if sign-up fails, or { error: null } on success.
   */
  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }

  /** Sign out the current user. */
  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook to access the auth context from any component. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
