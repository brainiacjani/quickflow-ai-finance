import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Preference = 'light' | 'dark' | 'system';
type Effective = 'light' | 'dark';

export default function useTheme() {
  const { user } = useAuth();
  const removingRef = useRef<number | null>(null);

  const readStored = (): Preference => {
    try {
      const v = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
      if (v === 'light' || v === 'dark' || v === 'system') return v;
      return 'system';
    } catch (e) {
      return 'system';
    }
  };

  const [preference, setPreferenceState] = useState<Preference>(readStored);

  // compute effective theme
  const getEffective = (pref: Preference): Effective => {
    if (pref === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
      return 'light';
    }
    return pref;
  };

  const [effective, setEffective] = useState<Effective>(() => getEffective(readStored()));

  // apply effective theme to document.documentElement
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (effective === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
      // persist preference to localStorage
      localStorage.setItem('theme', preference);
    } catch (e) {
      // ignore
    }
  }, [effective, preference]);

  // if system preference changes, respond when preference === 'system'
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (preference === 'system') {
        setEffective(getEffective('system'));
      }
    };
    try {
      mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
    } catch (e) {
      try { mq.addListener(handler); } catch(e){}
    }
    return () => {
      try { mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler); } catch(e){}
    };
  }, [preference]);

  // helper that applies a short transition class to avoid flash
  const applyTransition = () => {
    try {
      const el = document.documentElement;
      el.classList.add('theme-transition');
      if (removingRef.current) window.clearTimeout(removingRef.current);
      removingRef.current = window.setTimeout(() => {
        el.classList.remove('theme-transition');
        removingRef.current = null;
      }, 300);
    } catch (e) {}
  };

  const setPreference = async (p: Preference) => {
    applyTransition();
    setPreferenceState(p);
    setEffective(getEffective(p));

    // persist to localStorage
    try { localStorage.setItem('theme', p); } catch (e) {}

    // if user is signed in, persist to profiles table (best-effort)
    if (user?.id) {
      try {
        await supabase.from('profiles').update({ theme: p }).eq('id', user.id);
      } catch (e) {
        // non-fatal
        console.error('persist theme to profile failed', e);
      }
    }
  };

  const toggle = async () => {
    // toggle effective theme and persist explicit preference (light/dark)
    const next = effective === 'dark' ? 'light' : 'dark';
    await setPreference(next);
  };

  return { preference, effective, theme: effective, setPreference, toggle } as const;
}
