import OrganizationManager from "@/components/admin/OrganizationManager";
import UserManager from "@/components/admin/UserManager";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Building2, Users } from "lucide-react";

export default function AuthSettings() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.tipo_acesso === 'total';

  return (
    <div className="space-y-8 pb-12 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/40 p-6 rounded-2xl border border-primary/5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações de Acesso</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 gap-1.5 py-1">
              <Shield className="h-3.5 w-3.5" />
              {isSuperAdmin ? "Super Admin" : "Gestor"}
            </Badge>
          </div>
          <p className="text-muted-foreground italic">
            {isSuperAdmin 
              ? "Gerenciamento global de organizações, usuários e permissões do sistema."
              : `Gerencie a equipe da ${profile?.organizacao?.nome || 'sua organização'} e suas permissões.`}
          </p>
        </div>
      </div>

      <Tabs defaultValue={isSuperAdmin ? "orgs" : "users"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 mb-8">
          {isSuperAdmin && (
            <TabsTrigger value="orgs" className="gap-2 font-bold py-2.5">
              <Building2 className="h-4 w-4" />
              Organizações
            </TabsTrigger>
          )}
          <TabsTrigger value="users" className="gap-2 font-bold py-2.5">
            <Users className="h-4 w-4" />
            Minha Equipe
          </TabsTrigger>
        </TabsList>

        {isSuperAdmin && (
          <TabsContent value="orgs" className="mt-0 animate-in fade-in-50 duration-500">
            <OrganizationManager />
          </TabsContent>
        )}

        <TabsContent value="users" className="mt-0 animate-in fade-in-50 duration-500">
          <UserManager orgId={isSuperAdmin ? undefined : profile?.organizacao_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
