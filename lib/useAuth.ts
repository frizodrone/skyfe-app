import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  whatsapp: string;
  drone_model: string;
  experience_level: string;
  avatar_url: string;
  subscription_tier: string;
  app_opens: number;
  created_at: string;
  last_login: string;
};

type Settings = {
  max_wind: number;
  max_gust: number;
  max_rain: number;
  min_temp: number;
  max_temp: number;
};

const DEFAULT_SETTINGS: Settings = {
  max_wind: 20,
  max_gust: 30,
  max_rain: 50,
  min_temp: 5,
  max_temp: 38,
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
        logAppOpen(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setSettings(DEFAULT_SETTINGS);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      // Load profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (prof) setProfile(prof as Profile);

      // Load settings
      const { data: sett } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (sett) {
        setSettings({
          max_wind: sett.max_wind,
          max_gust: sett.max_gust,
          max_rain: sett.max_rain,
          min_temp: sett.min_temp,
          max_temp: sett.max_temp,
        });
      }

      // Update last_login
      await supabase
        .from("profiles")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userId);
    } catch {
      // silent
    }
    setLoading(false);
  };

  const logAppOpen = async (userId: string) => {
    try {
      await supabase.from("usage_logs").insert({
        user_id: userId,
        event: "app_open",
        metadata: { timestamp: new Date().toISOString() },
      });
      await supabase.rpc("increment_app_opens", { user_id_input: userId }).catch(() => {
        // RPC may not exist yet, ignore
      });
    } catch {
      // silent
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
      if (!error && profile) {
        setProfile({ ...profile, ...updates } as Profile);
      }
      return !error;
    } catch {
      return false;
    }
  };

  const updateSettings = async (newSettings: Settings) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({ ...newSettings, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (!error) setSettings(newSettings);
      return !error;
    } catch {
      return false;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSettings(DEFAULT_SETTINGS);
    window.location.href = "/login";
  };

  return {
    user,
    profile,
    settings,
    loading,
    isLoggedIn: !!user,
    updateProfile,
    updateSettings,
    signOut,
  };
}
