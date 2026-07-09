"use client";

import { useCallback, useState } from "react";

interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  isActive: boolean;
  isBlacklisted: boolean;
  createdAt: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Use singleton pattern outside React to avoid effect linting issues
let cachedUser: AuthUser | null = null;
let cachedLoading = true;
let cachedError: string | null = null;
let fetchPromise: Promise<void> | null = null;

async function doFetch() {
  try {
    const res = await fetch("/api/auth/session");
    if (!res.ok) {
      cachedUser = null;
      cachedError = "Not authenticated";
      cachedLoading = false;
      return;
    }
    const data = await res.json();
    if (data?.user) {
      cachedUser = {
        ...data.user,
        status: data.user.status || "offline",
      };
      cachedError = null;
    } else {
      cachedUser = null;
      cachedError = "No user data";
    }
  } catch {
    cachedUser = null;
    cachedError = "Network error";
  } finally {
    cachedLoading = false;
  }
}

function startFetch() {
  if (!fetchPromise) {
    fetchPromise = doFetch();
  }
}

// Trigger fetch immediately on module load
startFetch();

export function useAuth(): UseAuthReturn {
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    cachedLoading = true;
    cachedError = null;
    setTick((t) => t + 1);
    await doFetch();
    setTick((t) => t + 1);
  }, []);

  // Force re-render on mount to get latest state
  if (cachedLoading && fetchPromise) {
    fetchPromise.then(() => setTick((t) => t + 1));
  }

  return {
    user: cachedUser,
    loading: cachedLoading,
    error: cachedError,
    refresh,
  };
}
