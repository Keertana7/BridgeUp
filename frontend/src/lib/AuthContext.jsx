import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still loading, null = no session, object = has session
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    // If Supabase is not configured (missing .env), treat as "not logged in"
    if (!supabaseConfigured || !supabase) {
      setSession(null);
      return;
    }

    // Get the current session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    // Subscribe to future auth changes (login / logout / token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading: session === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
