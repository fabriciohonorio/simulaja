import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Users, Mail, UserPlus, Copy, Loader2, Trash2 } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [emailToInvite, setEmailToInvite] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) return;

      const { data: perf } = await (supabase.from("perfis" as any) as any)
        .select("organizacao_id, organizacoes(*)")
        .eq("id", userId)
        .single();

      setOrg(perf?.organizacoes);

      const { data: members } = await (supabase.from("perfis" as any) as any)
        .select("*")
        .eq("organizacao_id", perf?.organizacao_id);
      setUsers(members || []);

      const { data: invites } = await (supabase.from("convites" as any) as any)
        .select("*")
        .eq("organizacao_id", perf?.organizacao_id)
        .eq("status", "pendente");
      setInvitations(invites || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!emailToInvite || !org) return;
    setInviting(true);
    try {
      const token = Math.random().toString(36).substring(2, 15);
      const { data: userRes } = await supabase.auth.getUser();

      const { error } = await (supabase.from("convites" as any) as any).insert({
        email: emailToInvite,
        token,
        organizacao_id: org.id,
        convidado_por: userRes.user?.id,
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

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Gestão da Equipe
        </h1>
        <p className="text-slate-500 font-medium text-sm sm:text-base">{org?.nome || "Minha Empresa"}</p>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Painel de convite */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Novo Convite</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Adicione membros ao time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-convite" className="font-bold text-slate-700">E-mail do Colaborador</Label>
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
              <Button
                className="w-full h-11 rounded-xl font-bold"
                onClick={handleInvite}
                disabled={inviting || !emailToInvite}
              >
                {inviting ? <Loader2 className="animate-spin h-4 w-4" /> : "Gerar Link de Acesso"}
              </Button>
            </CardContent>
          </Card>

          {/* Convites pendentes */}
          {invitations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Convites Pendentes</p>
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-2 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-700 truncate flex-1">{inv.email}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-primary hover:bg-primary/5"
                      onClick={() => copyInviteLink(inv.token)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50"
                      onClick={() => deleteInvite(inv.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Membros ativos */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-50">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
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
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-500 text-sm shrink-0">
                        {(u.nome_completo || u.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">
                          {u.nome_completo || "Sem nome"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {u.email || u.id.substring(0, 12) + "..."}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${
                        u.tipo_acesso === "admin"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}
                    >
                      {u.tipo_acesso === "admin" ? "Admin" : "Vendedor"}
                    </span>
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
