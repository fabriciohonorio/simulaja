import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Building2, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("token");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [orgNome, setOrgNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (invitationToken) {
      checkInvitation();
    }
  }, [invitationToken]);

  const checkInvitation = async () => {
    const { data, error } = await (supabase
      .from("convites" as any) as any)
      .select("*, organizacoes(nome)")
      .eq("token", invitationToken)
      .eq("status", "pendente")
      .single();

    if (error || !data) {
      toast({
        title: "Convite Inválido",
        description: "Este link de convite expirou ou é inválido.",
        variant: "destructive"
      });
      return;
    }
    setInvitationData(data);
    setEmail(data.email);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: nome,
            organizacao_id: invitationData?.organizacao_id,
            tipo_acesso: invitationToken ? 'vendedor' : 'admin'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário.");

      if (invitationToken && invitationData) {
        // Apenas marca o convite como aceito. O perfil será criado via Trigger com a org correta
        await (supabase
          .from("convites" as any) as any)
          .update({ status: "aceito" })
          .eq("token", invitationToken);
      }

      setSuccess(true);
      toast({
        title: "Conta criada!",
        description: "Verifique seu e-mail para confirmar o acesso.",
      });
      
      setTimeout(() => navigate("/admin/login"), 3000);

    } catch (err: any) {
      toast({
        title: "Erro no cadastro",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[32px] overflow-hidden text-center p-8">
           <div className="bg-green-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
           </div>
           <h2 className="text-2xl font-bold mb-2">Quase lá!</h2>
           <p className="text-slate-500 mb-6">Enviamos um e-mail de confirmação para <strong>{email}</strong>.</p>
           <Button onClick={() => navigate("/admin/login")} variant="outline" className="w-full rounded-xl">
             Ir para o Login
           </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      <div className="hidden md:flex md:w-1/2 bg-slate-900 p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-900/40 opacity-50" />
        <div className="relative z-10">
          <div className="space-y-1">
            <div className="text-2xl font-black tracking-tight text-white">
              FABRICIO <span className="text-primary mx-1">|</span> <span className="font-light opacity-80">Especialista Consórcio</span>
            </div>
            <div className="text-xs font-medium text-white/60 tracking-widest uppercase">
              www.oespecialistaconsorcio.com.br
            </div>
          </div>
          <div className="mt-24 space-y-6">
            <h1 className="text-5xl font-black leading-tight">
              O Futuro do seu <br />
              <span className="text-primary italic">Consórcio</span> começa aqui.
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              {invitationToken ? "Aceitar Convite" : "Criar sua Conta"}
            </h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome">Seu Nome Completo</Label>
              <Input id="nome" placeholder="Ex: Fabrício Honório" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>

            {!invitationToken && (
               <div className="space-y-2">
                <Label htmlFor="org">Nome da sua Empresa / Equipe</Label>
                <div className="relative">
                   <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                   <Input id="org" placeholder="Ex: Honório Consórcios" className="pl-10" value={orgNome} onChange={(e) => setOrgNome(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail Profissional</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!invitationToken} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Crie uma Senha Forte</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="pr-10 h-12 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button className="w-full h-12 rounded-[16px]" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (invitationToken ? "Entrar na Equipe" : "Começar Agora")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
