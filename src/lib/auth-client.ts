import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface SessionResponse {
  authenticated: boolean;
  user?: User;
}

interface AuthResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        
        if (!res.ok) throw new Error('Failed to load session');
        
        const data: SessionResponse = await res.json();
        setUser(data.authenticated && data.user ? data.user : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    
    loadSession();
  }, []);
  
  return { user, loading, error };
}

export async function login(email: string, password: string) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    
    const data: AuthResponse = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Login failed');
    }
    
    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
}

export async function signup(email: string, password: string) {
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    
    const data: AuthResponse = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Signup failed');
    }
    
    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
}

export async function logout() {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error('Logout failed');
    }
    
    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
}

export const authClient = {
  useSession,
  login,
  signup,
  logout,
}; 