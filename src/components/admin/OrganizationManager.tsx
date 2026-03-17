import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Organizacao } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Settings, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrganizationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newOrg, setNewOrg] = useState({ nome: "", slug: "", plano: "free" as const });

  const { data: organizations, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Organizacao[];
    },
  });

  const createOrg = useMutation({
    mutationFn: async (org: typeof newOrg) => {
      const { data, error } = await supabase
        .from("organizacoes")
        .insert({
          nome: org.nome,
          slug: org.slug,
          plano: org.plano,
          max_usuarios: org.plano === "free" ? 1 : org.plano === "starter" ? 5 : 20,
          max_leads: org.plano === "free" ? 100 : org.plano === "starter" ? 1000 : 10000,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Organização criada!", description: "A nova organização foi registrada com sucesso." });
      setIsAdding(false);
      setNewOrg({ nome: "", slug: "", plano: "free" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar organização", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando organizações...</div>;

  return (
    <Card className="w-full bg-white/50 backdrop-blur-md border-primary/10 shadow-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-white/30 border-b border-primary/5">
        <div>
          <CardTitle className="text-2xl font-bold text-foreground">Gestão de Organizações</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">Gerencie múltiplas empresas e planos no sistema.</CardDescription>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          {isAdding ? <Plus className="h-4 w-4 rotate-45 transition-transform" /> : <Plus className="h-4 w-4" />}
          {isAdding ? "Cancelar" : "Nova Organização"}
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {isAdding && (
          <div className="p-6 bg-primary/5 border-b border-primary/10 animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Nome da Empresa</label>
                <Input 
                  placeholder="Ex: Simulador Já" 
                  value={newOrg.nome} 
                  onChange={(e) => setNewOrg({ ...newOrg, nome: e.target.value })} 
                  className="bg-white border-primary/10 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Slug (URL)</label>
                <Input 
                  placeholder="ex-simulador-ja" 
                  value={newOrg.slug} 
                  onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/ /g, "-") })} 
                  className="bg-white border-primary/10 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Plano</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-primary/10 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newOrg.plano}
                  onChange={(e) => setNewOrg({ ...newOrg, plano: e.target.value as any })}
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={() => createOrg.mutate(newOrg)} 
                disabled={!newOrg.nome || !newOrg.slug || createOrg.isPending}
                className="bg-secondary hover:bg-secondary/90 text-white font-bold"
              >
                {createOrg.isPending ? "Criando..." : "Confirmar Cadastro"}
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Organização</TableHead>
              <TableHead className="font-bold">Slug</TableHead>
              <TableHead className="font-bold">Plano</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations?.map((org) => (
              <TableRow key={org.id} className="hover:bg-primary/5 transition-colors group">
                <TableCell className="font-medium text-foreground">{org.nome}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{org.slug}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    org.plano === 'pro' ? 'bg-purple-100 text-purple-700' :
                    org.plano === 'starter' ? 'bg-blue-100 text-blue-700' :
                    org.plano === 'enterprise' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {org.plano}
                  </span>
                </TableCell>
                <TableCell>
                  {org.ativo ? (
                    <div className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                      <CheckCircle2 className="h-4 w-4" /> Ativo
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-500 font-medium text-sm">
                      <XCircle className="h-4 w-4" /> Inativo
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {organizations?.length === 0 && !isAdding && (
          <div className="p-12 text-center text-muted-foreground italic">
            Nenhuma organização cadastrada. Comece criando uma nova!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
