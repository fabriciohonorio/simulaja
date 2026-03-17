import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Perfil, Modulo, Permissao, UsuarioPermissao } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Shield, Mail, Phone, BadgeCheck, XCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UserManager({ orgId }: { orgId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviting, setIsInviting] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", nome_completo: "", tipo_acesso: "parcial" as const });
  const [selectedProfile, setSelectedProfile] = useState<Perfil | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles", orgId],
    queryFn: async () => {
      let query = supabase.from("perfis").select("*, organizacao:organizacoes(*)");
      if (orgId) query = query.eq("organizacao_id", orgId);
      
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as Perfil[];
    },
  });

  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data: mods, error: modError } = await supabase.from("modulos").select("*").order("ordem");
      if (modError) throw modError;
      
      const { data: perms, error: permError } = await supabase.from("permissoes").select("*");
      if (permError) throw permError;
      
      return mods.map(m => ({
        ...m,
        permissoes: perms.filter(p => p.modulo_id === m.id)
      })) as (Modulo & { permissoes: Permissao[] })[];
    },
  });

  const updatePermissions = useMutation({
    mutationFn: async ({ profileId, permissions }: { profileId: string, permissions: Record<string, boolean> }) => {
      // 1. Delete existing permissions
      await supabase.from("usuario_permissoes").delete().eq("perfil_id", profileId);
      
      // 2. Insert new ones
      const toInsert = Object.entries(permissions)
        .filter(([_, granted]) => granted)
        .map(([permId, _]) => ({
          perfil_id: profileId,
          permissao_id: permId,
          concedida: true
        }));
        
      if (toInsert.length > 0) {
        const { error } = await supabase.from("usuario_permissoes").insert(toInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({ title: "Permissões atualizadas!", description: "As permissões do usuário foram salvas com sucesso." });
      setSelectedProfile(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar permissões", description: error.message, variant: "destructive" });
    }
  });

  const inviteUser = useMutation({
    mutationFn: async (user: typeof newUser) => {
      // Logic for invitation would involve supabase.auth.admin here
      // For demo/simple version, we create the profile if we have an ID, 
      // but usually this is done via a specialized edge function.
      toast({ title: "Convite Enviado (Simulado)", description: `Um convite foi enviado para ${user.email}.` });
      setIsInviting(false);
    }
  });

  const handleOpenPermissions = async (profile: Perfil) => {
    setSelectedProfile(profile);
    const { data: currentPerms } = await supabase
      .from("usuario_permissoes")
      .select("permissao_id")
      .eq("perfil_id", profile.id);
    
    const permMap: Record<string, boolean> = {};
    currentPerms?.forEach(p => permMap[p.permissao_id] = true);
    setUserPermissions(permMap);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando usuários...</div>;

  return (
    <Card className="w-full bg-white/50 backdrop-blur-md border-primary/10 shadow-xl overflow-hidden mt-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-white/30 border-b border-primary/5">
        <div>
          <CardTitle className="text-2xl font-bold text-foreground">Gestão de Usuários</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">Controle quem tem acesso e quais módulos podem visualizar.</CardDescription>
        </div>
        <Dialog open={isInviting} onOpenChange={setIsInviting}>
          <DialogTrigger asChild>
            <Button 
              className="bg-secondary hover:bg-secondary/90 text-white gap-2 shadow-lg shadow-secondary/20 transition-all hover:scale-105 active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Convidar Membro</DialogTitle>
              <DialogDescription>
                Adicione um novo colaborador à sua organização.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nome Completo</label>
                <Input value={newUser.nome_completo} onChange={e => setNewUser({...newUser, nome_completo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">E-mail</label>
                <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Tipo de Acesso</label>
                <Select value={newUser.tipo_acesso} onValueChange={(v: any) => setNewUser({...newUser, tipo_acesso: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parcial">Parcial (Limitado por módulos)</SelectItem>
                    <SelectItem value="total">Total (Administrador)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => inviteUser.mutate(newUser)} disabled={!newUser.email}>Enviar Convite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Usuário</TableHead>
              <TableHead className="font-bold">Contato</TableHead>
              <TableHead className="font-bold">Organização</TableHead>
              <TableHead className="font-bold">Acesso</TableHead>
              <TableHead className="text-right font-bold">Permissões</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles?.map((profile) => (
              <TableRow key={profile.id} className="hover:bg-primary/5 transition-colors group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {profile.nome_completo?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{profile.nome_completo || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">{profile.cargo || "Membro"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> {profile.telefone || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {profile.telefone || "N/A"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-foreground">{profile.organizacao?.nome || "Global"}</span>
                </TableCell>
                <TableCell>
                  <div className={`flex items-center gap-1.5 text-sm font-bold ${profile.tipo_acesso === 'total' ? 'text-purple-600' : 'text-blue-600'}`}>
                    <Shield className="h-3.5 w-3.5" />
                    {profile.tipo_acesso === 'total' ? 'Total' : 'Parcial'}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog open={!!selectedProfile && selectedProfile.id === profile.id} onOpenChange={(open) => !open && setSelectedProfile(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs gap-2 font-bold text-primary hover:bg-primary/10"
                        onClick={() => handleOpenPermissions(profile)}
                      >
                        <BadgeCheck className="h-4 w-4" />
                        Configurar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Permissões: {profile.nome_completo}</DialogTitle>
                        <DialogDescription>
                          Defina quais módulos este usuário pode visualizar e manipular.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4 space-y-6">
                        {profile.tipo_acesso === 'total' ? (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex gap-3">
                            <Shield className="h-5 w-5 shrink-0" />
                            <p>Este usuário possui <strong>Acesso Total</strong>. Ele pode visualizar todos os módulos e realizar todas as ações, ignorando as permissões abaixo.</p>
                          </div>
                        ) : null}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {modules?.map(modulo => (
                            <div key={modulo.id} className="space-y-3 p-4 rounded-xl border border-primary/5 bg-slate-50/50">
                              <h4 className="font-bold text-sm flex items-center gap-2">
                                <span className="p-1.5 bg-white rounded-md shadow-sm border border-primary/5 text-primary">
                                  {modulo.nome[0]}
                                </span>
                                {modulo.nome}
                              </h4>
                              <div className="grid gap-2">
                                {modulo.permissoes.map(perm => (
                                  <div key={perm.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={perm.id} 
                                      checked={!!userPermissions[perm.id]} 
                                      onCheckedChange={(checked) => {
                                        setUserPermissions(prev => ({...prev, [perm.id]: !!checked}));
                                      }}
                                    />
                                    <label htmlFor={perm.id} className="text-xs font-medium leading-none cursor-pointer">
                                      {perm.acao}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <DialogFooter>
                        <Button 
                          className="gap-2"
                          onClick={() => updatePermissions.mutate({ profileId: profile.id, permissions: userPermissions })}
                          disabled={updatePermissions.isPending}
                        >
                          <Save className="h-4 w-4" />
                          Salvar Permissões
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
