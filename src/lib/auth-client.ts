import { useState, useEffect } from 'react';
// Import react-query hooks
import { useQuery, useQueryClient } from '@tanstack/react-query';

// // Get the worker URL from environment variables
// // Ensure VITE_WORKER_URL is set in your .env file (e.g., VITE_WORKER_URL=https://your-worker.your-account.workers.dev)
// const WORKER_URL = import.meta.env.VITE_WORKER_URL;

// if (!WORKER_URL) {
//   console.error("VITE_WORKER_URL environment variable is not set!");
//   // Optionally throw an error or set a default, but failing loudly is often better during development
//   // throw new Error("VITE_WORKER_URL environment variable is not set!");
// }

// // Helper function to create full API URLs
// function getApiUrl(path: string): string {
//   // Ensure the path starts with a /
//   const formattedPath = path.startsWith('/') ? path : `/${path}`;
//   return `${WORKER_URL}${formattedPath}`;
// }

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

// Define the fetch function for the session query
const fetchSession = async (): Promise<SessionResponse> => {
  const res = await fetch('/api/auth/session', { // Use relative path
    credentials: 'include', 
  });
  if (!res.ok) {
    // Handle non-OK responses, maybe return a specific shape or throw
    // For simplicity, let's assume non-200 means not authenticated for this query
    if (res.status === 401 || res.status === 403) {
        return { authenticated: false };
    }
    // Rethrow other errors
    throw new Error('Failed to fetch session status');
  }
  const data: SessionResponse = await res.json();
  return data;
};

// Define the query key
export const sessionQueryKey = ['session'];

export function useSession() {
  const { data, isLoading, error, isError } = useQuery<SessionResponse, Error>({
      queryKey: sessionQueryKey,
      queryFn: fetchSession,
      staleTime: 5 * 60 * 1000, // Keep session data fresh for 5 mins
      gcTime: 15 * 60 * 1000, // Keep data in cache for 15 mins
      retry: 1, // Retry once on error
      refetchOnWindowFocus: true, // Refetch session when window regains focus
  });

  return {
      // Derive user from the query data
      user: data?.authenticated ? data.user : null,
      // Expose loading state
      loading: isLoading,
      // Expose error state/object
      error: isError ? error : null,
      // Expose raw authenticated flag if needed
      isAuthenticated: data?.authenticated ?? false,
  };
}

export async function login(email: string, password: string) {
  // if (!WORKER_URL) return { success: false, error: "Worker URL not configured" }; - REMOVED
  try {
    const res = await fetch('/api/auth/login', { // Use relative path
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
  // if (!WORKER_URL) return { success: false, error: "Worker URL not configured" }; - REMOVED
  try {
    const res = await fetch('/api/auth/signup', { // Use relative path
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
  // if (!WORKER_URL) return { success: false, error: "Worker URL not configured" }; - REMOVED
  try {
    const res = await fetch('/api/auth/logout', { // Use relative path
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
  sessionQueryKey // Export the key for invalidation
}; 