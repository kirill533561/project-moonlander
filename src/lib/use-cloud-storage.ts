"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

let userId: string | null = null;
let userIdPromise: Promise<string | null> | null = null;

function getUserId(): Promise<string | null> {
  if (userId) return Promise.resolve(userId);
  if (userIdPromise) return userIdPromise;
  userIdPromise = supabase.auth.getUser().then(({ data }) => {
    userId = data.user?.id ?? null;
    return userId;
  });
  return userIdPromise;
}

const writeQueue: Map<string, { value: unknown; timeout: ReturnType<typeof setTimeout> }> = new Map();

async function syncToCloud(key: string, value: unknown) {
  const uid = await getUserId();
  if (!uid) return;

  // Debounce: wait 500ms after last write before syncing
  const existing = writeQueue.get(key);
  if (existing) clearTimeout(existing.timeout);

  writeQueue.set(key, {
    value,
    timeout: setTimeout(async () => {
      try {
        await supabase.from("user_data").upsert(
          { user_id: uid, key, value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() },
          { onConflict: "user_id,key" }
        );
      } catch {
        // Silent fail — localStorage is the fallback
      }
      writeQueue.delete(key);
    }, 500),
  });
}

async function readFromCloud<T>(key: string): Promise<T | null> {
  const uid = await getUserId();
  if (!uid) return null;

  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("value")
      .eq("user_id", uid)
      .eq("key", key)
      .single();

    if (error || !data) return null;
    return data.value as T;
  } catch {
    return null;
  }
}

export function useCloudStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Try localStorage first (instant)
      let localValue: T | null = null;
      try {
        const item = localStorage.getItem(key);
        if (item) localValue = JSON.parse(item);
      } catch {}

      if (localValue !== null && !cancelled) {
        setStoredValue(localValue);
      }

      // Then try cloud (async)
      const cloudValue = await readFromCloud<T>(key);

      if (cancelled) return;

      if (cloudValue !== null) {
        setStoredValue(cloudValue);
        // Update localStorage with cloud data
        try { localStorage.setItem(key, JSON.stringify(cloudValue)); } catch {}
      } else if (localValue !== null) {
        // Local has data but cloud doesn't — push local to cloud
        syncToCloud(key, localValue);
      }

      setLoaded(true);
    }

    load();
    return () => { cancelled = true; };
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        // Write to localStorage (instant)
        try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
        // Write to cloud (debounced)
        syncToCloud(key, next);
        return next;
      });
    },
    [key]
  );

  return [loaded ? storedValue : initialValueRef.current, setValue];
}
