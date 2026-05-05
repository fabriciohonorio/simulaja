import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types";

let _cache: Profile | null = null;
const _listeners: Array<(p: Profile | null) => void> = [];

export interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isVendedor: boolean;
  refetch: () => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<Profile | null>(_cache);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    // Subscribe to cache updates
    const idx = _listeners.push((p) => setProfile(p)) - 1;

    if (!_cache) {
      fetchProfile();
    }

    return () => {
      _listeners.splice(idx, 1);
    };
  }, []);

  const fetchProfile = async (): Promise<void> => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase.from("perfis")
      .select("id, nome_completo, tipo_acesso, organizacao_id, avatar_url")
      .eq("id", user.id)
      .single();

    if (data) {
      _cache = { ...data, email: user.email } as Profile;
      _listeners.forEach((fn) => fn(_cache));
    }
    setLoading(false);
  };

  const isAdmin = profile?.tipo_acesso === "admin";
  const isManager = profile?.tipo_acesso === "manager" || isAdmin;
  const isVendedor = profile?.tipo_acesso === "vendedor";

  return { profile, loading, isAdmin, isManager, isVendedor, refetch: fetchProfile };
};

// Clear on sign out
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    _cache = null;
    _listeners.forEach((fn) => fn(null));
  }
});
