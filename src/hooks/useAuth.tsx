import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { Perfil, UsuarioPermissao } from "@/types/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Perfil | null>(null);
  const [permissions, setPermissions] = useState<UsuarioPermissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfileAndPermissions = async (userId: string) => {
      setAuthError(null);
    const { data: profileData, error: profileError } = await supabase
      .from("perfis")
      .select("*, organizacao:organizacoes(*)")
      .eq("id", userId)
      .maybeSingle(); // Better for handling "not found"
    
    if (profileError) {
      console.warn("Profile fetch warning (expected in emergency mode):", profileError);
      // Em modo de emergência, não bloqueamos o usuário
      setProfile(null);
      setPermissions([]); // Keep as array based on type UsuarioPermissao[]
      setLoading(false);
      return;
    }

    if (!profileData) {
      console.warn("No profile found for user. Using emergency access.");
      // Em modo de emergência, não bloqueamos o usuário
      setProfile(null);
      setPermissions([]); // Keep as array based on type UsuarioPermissao[]
      setLoading(false);
      return;
    }

    setProfile(profileData as Perfil);
    
    const { data: permData, error: permError } = await supabase
      .from("usuario_permissoes")
      .select("*, permissao:permissoes(*, modulo:modulos(*))")
      .eq("perfil_id", userId);
    
    if (!permError && permData) {
      setPermissions(permData as UsuarioPermissao[]);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfileAndPermissions(session.user.id);
        } else {
          setProfile(null);
          setPermissions([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfileAndPermissions(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, profile, permissions, loading, authError, signIn, signOut };
}
