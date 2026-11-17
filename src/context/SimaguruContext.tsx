import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { SEED_STATE } from '../data/seedData';
import {
  isSupabaseConfigured,
  loadWorkspaceFromSupabase,
  saveWorkspaceToSupabase,
} from '../lib/supabase';
import { SimaguruState } from '../types';

const STORAGE_KEY = 'simaguru_smk_garnesia_state_v1';
const THEME_KEY = 'simaguru_theme_v1';

interface SimaguruContextValue {
  state: SimaguruState;
  isLoading: boolean;
  isSaving: boolean;
  toast: { message: string; type: 'success' | 'error' } | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  updateState: (updater: (prev: SimaguruState) => SimaguruState, notifyText?: string) => void;
  resetDemoData: () => Promise<void>;
  notify: (message: string, type?: 'success' | 'error') => void;
}

const SimaguruContext = createContext<SimaguruContextValue | null>(null);

export function SimaguruProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SimaguruState>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached) as SimaguruState;
    } catch {
      // ignore invalid cache
    }
    return SEED_STATE;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  const saveTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        if (isSupabaseConfigured()) {
          const remoteState = await loadWorkspaceFromSupabase();
          if (!active) return;
          if (remoteState && remoteState.profile) {
            setState(remoteState);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState));
          } else {
            // Seed Supabase workspace on first run
            await saveWorkspaceToSupabase(SEED_STATE);
            if (!active) return;
            setState(SEED_STATE);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STATE));
          }
          return;
        }

        const res = await fetch('/api/state');
        if (res.ok) {
          const serverState = (await res.json()) as SimaguruState;
          if (!active) return;
          if (serverState && serverState.profile) {
            setState(serverState);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverState));
          }
        }
      } catch {
        // Fallback smoothly to localStorage / SEED_STATE
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  const persistState = useCallback((next: SimaguruState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota error
    }
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    setIsSaving(true);
    saveTimerRef.current = window.setTimeout(() => {
      const savePromise = isSupabaseConfigured()
        ? saveWorkspaceToSupabase(next)
        : fetch('/api/state', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(next),
          }).then(() => undefined);

      savePromise
        .catch(() => {
          // LocalStorage remains active fallback
        })
        .finally(() => {
          setIsSaving(false);
        });
    }, 250);
  }, []);

  const updateState = useCallback(
    (updater: (prev: SimaguruState) => SimaguruState, notifyText?: string) => {
      setState((prev) => {
        const next = updater(prev);
        persistState(next);
        return next;
      });
      if (notifyText) {
        notify(notifyText, 'success');
      }
    },
    [persistState, notify]
  );

  const resetDemoData = useCallback(async () => {
    setState(SEED_STATE);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STATE));
    try {
      if (isSupabaseConfigured()) {
        await saveWorkspaceToSupabase(SEED_STATE);
      } else {
        await fetch('/api/state/reset', { method: 'POST' });
      }
    } catch {
      // ignore
    }
    notify('Data demo SMK Garnesia berhasil dipulihkan', 'success');
  }, [notify]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <SimaguruContext.Provider
      value={{
        state,
        isLoading,
        isSaving,
        toast,
        theme,
        toggleTheme,
        updateState,
        resetDemoData,
        notify,
      }}
    >
      {children}
    </SimaguruContext.Provider>
  );
}

export function useSimaguru() {
  const ctx = useContext(SimaguruContext);
  if (!ctx) {
    throw new Error('useSimaguru must be used within SimaguruProvider');
  }
  return ctx;
}
