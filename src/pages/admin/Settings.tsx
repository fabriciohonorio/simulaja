import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { Users, Mail, UserPlus, Copy, Loader2, Trash2, Shield, ChevronDown, Upload, CalendarDays, Settings as SettingsIcon } from "lucide-react";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "manager", label: "Manager" },
  { value: "vendedor", label: "Vendedor" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber-100 text-amber-900 border-amber-300",
  manager: "bg-purple-100 text-purple-900 border-purple-300",
  vendedor: "bg-blue-100 text-blue-900 border-blue-300",
};

export default function Settings() {
  const { toast } = useToast();
  const { profile, isAdmin } = useProfile();
  const [emailToInvite, setEmailToInvite] = useState("");
  const [roleToInvite, setRoleToInvite] = useState("vendedor");
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [org, setOrg] = useState<any>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [profile]);

  const fetchData = async () => {
    if (!profile?.organizacao_id) return;
    setLoading(true);
    try {
      const { data: members } = await (supabase.from("perfis" as any) as any)
        .select("*")
        .eq("organizacao_id", profile.organizacao_id);
      setUsers(members || []);

      const { data: orgData } = await (supabase.from("organizacoes" as any) as any)
        .select("*").eq("id", profile.organizacao_id).single();
      setOrg(orgData);

      const { data: invites } = await (supabase.from("convites" as any) as any)
        .select("*")
        .eq("organizacao_id", profile.organizacao_id)
        .eq("status", "pendente");
      setInvitations(invites || []);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!emailToInvite || !profile?.organizacao_id) return;
    setInviting(true);
    try {
      const token = Math.random().toString(36).substring(2, 15);
      const { error } = await (supabase.from("convites" as any) as any).insert({
        email: emailToInvite,
        token,
        organizacao_id: profile.organizacao_id,
        convidado_por: profile.id,
        tipo_acesso: roleToInvite,
      });
      if (error) throw error;
      toast({ title: "Convite Criado!", description: "Copie o link abaixo e envie ao colaborador." });
      setEmailToInvite("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/admin/register?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copiado!", description: "Envie para seu colaborador." });
  };

  const deleteInvite = async (id: string) => {
    await (supabase.from("convites" as any) as any).delete().eq("id", id);
    toast({ title: "Convite Removido" });
    fetchData();
  };

  const deleteMember = async (userId: string) => {
    if (!window.confirm("Tem certeza que deseja remover este membro da equipe? Todos os dados vinculados a ele podem ser afetados.")) return;
    
    setLoading(true);
    try {
      const { error } = await (supabase.from("perfis" as any) as any)
        .delete()
        .eq("id", userId);
        
      if (error) throw error;
      
      toast({ 
        title: "Membro Removido", 
        description: "O acesso deste colaborador foi revogado com sucesso." 
      });
      fetchData();
    } catch (err: any) {
      toast({ 
        title: "Erro ao remover", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    try {
      const { error } = await supabase.rpc("update_member_role" as any, {
        target_user_id: userId,
        new_role: newRole,
      });
      if (error) throw error;
      toast({ title: "Cargo Alterado!", description: `Novo cargo: ${ROLES.find(r => r.value === newRole)?.label}` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setChangingRole(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Configurações</h1>
          <p className="text-slate-500 font-medium text-sm">{org?.nome || "Minha Empresa"}</p>
        </div>
      </div>

      {/* Seção Meu Perfil - Standardized Slim Style */}
      <AdminHeroCard 
        title="Operação & Perfil" 
        subtitle="Configurações e Acesso do Colaborador"
        icon={SettingsIcon} 
        bgIcon={SettingsIcon}
        accentColor="primary"
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="relative group/avatar">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-white/10 overflow-hidden bg-slate-800 flex items-center justify-center text-xl font-black shrink-0 transition-transform group-hover/avatar:scale-105">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.nome_completo || ""} className="h-full w-full object-cover" />
              ) : (
                (profile?.nome_completo || "?").charAt(0).toUpperCase()
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className="absolute -bottom-1 -right-1 p-1.5 bg-primary rounded-full cursor-pointer shadow-lg hover:bg-primary/80 transition-colors border-2 border-slate-900"
            >
              <Upload className="h-3 w-3 text-white" />
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast({ title: "Arquivo muito grande", description: "O limite é de 2MB.", variant: "destructive" });
                    return;
                  }
                  setLoading(true);
                  try {
                    const fileExt = file.name.split('.').pop();
                    const filePath = `${profile?.id}/avatar.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from("profiles")
                      .upload(filePath, file, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                      .from("profiles")
                      .getPublicUrl(filePath);

                    const { error: updateError } = await (supabase.from("perfis" as any) as any)
                      .update({ avatar_url: publicUrl })
                      .eq("id", profile?.id);

                    if (updateError) throw updateError;

                    toast({ title: "Foto atualizada!", description: "Sua nova foto já está visível." });
                    window.location.reload(); 
                  } catch (err: any) {
                    toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </label>
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{profile?.nome_completo}</h2>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{profile?.email}</p>
            <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${ROLE_COLORS[profile?.tipo_acesso || "vendedor"]}`}>
                {profile?.tipo_acesso}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-100 bg-slate-50 text-slate-400">
                ID: #{profile?.id?.substring(0, 8)}
              </span>
            </div>
            
            <div className="pt-3">
              <Button 
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.auth.linkIdentity({
                      provider: 'google',
                      options: {
                        redirectTo: `${window.location.origin}/admin/configuracoes`,
                        scopes: "https://www.googleapis.com/auth/calendar.events",
                      }
                    });
                    if (error) throw error;
                  } catch (err: any) {
                    toast({ title: "Erro na conexão", description: err.message, variant: "destructive" });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-white text-slate-900 hover:bg-slate-100 font-black text-[10px] tracking-tight rounded-lg h-8"
                size="sm"
              >
                <CalendarDays className="h-3 w-3 mr-2 text-blue-600" />
                CONECTAR CALENDAR
              </Button>
            </div>
          </div>
        </div>
      </AdminHeroCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Painel de convite */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl"><UserPlus className="h-5 w-5 text-primary" /></div>
                <div>
                  <CardTitle className="text-base font-bold">Novo Convite</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Adicione membros ao time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-convite" className="font-bold text-slate-700">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email-convite"
                    type="email"
                    placeholder="vendedor@empresa.com"
                    className="pl-9 h-11 rounded-xl text-sm"
                    value={emailToInvite}
                    onChange={(e) => setEmailToInvite(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Cargo</Label>
                <Select value={roleToInvite} onValueChange={setRoleToInvite}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    {isAdmin && <SelectItem value="admin">Administrador</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full h-11 rounded-xl font-bold"
                onClick={handleInvite}
                disabled={inviting || !emailToInvite}
              >
                {inviting ? <Loader2 className="animate-spin h-4 w-4" /> : "Gerar Link de Acesso"}
              </Button>
            </CardContent>
          </Card>

          {invitations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Convites Pendentes</p>
              {invitations.map((inv) => (
                <div key={inv.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-2 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700 truncate">{inv.email}</p>
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[inv.tipo_acesso || 'vendedor']}`}>
                      {inv.tipo_acesso || 'vendedor'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/5" onClick={() => copyInviteLink(inv.token)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50" onClick={() => deleteInvite(inv.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Membros */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-50">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl"><Users className="h-5 w-5 text-blue-500" /></div>
                  <div>
                    <CardTitle className="text-base font-bold">Membros Ativos</CardTitle>
                    <CardDescription className="text-xs">Pessoas com acesso ao CRM</CardDescription>
                  </div>
                </div>
                <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                  {users.length} {users.length === 1 ? "membro" : "membros"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-500 text-sm shrink-0">
                        {(u.nome_completo || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{u.nome_completo || "Sem nome"}</p>
                        <p className="text-xs text-slate-400">{u.id === profile?.id ? "Você" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && u.id !== profile?.id ? (
                        <>
                          <div className="flex items-center gap-2">
                            {changingRole === u.id ? (
                              <Loader2 className="animate-spin h-4 w-4 text-slate-400" />
                            ) : (
                              <Select value={u.tipo_acesso || "vendedor"} onValueChange={(val) => changeRole(u.id, val)}>
                                <SelectTrigger className={`h-8 text-[11px] font-black uppercase rounded-full border px-3 ${ROLE_COLORS[u.tipo_acesso || "vendedor"]}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="vendedor">Vendedor</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            onClick={() => deleteMember(u.id)}
                            title="Excluir Vendedor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${ROLE_COLORS[u.tipo_acesso || "vendedor"]}`}>
                          {u.tipo_acesso === "admin" ? "Admin" : u.tipo_acesso === "manager" ? "Manager" : "Vendedor"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
