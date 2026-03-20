import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError("Email ou senha inválidos.");
    } else {
      navigate("/admin");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ 
        title: "E-mail necessário", 
        description: "Digite seu e-mail no campo acima para receber o link de recuperação.", 
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Link Enviado!", 
        description: "Verifique seu e-mail para redefinir sua senha." 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[28px] sm:rounded-[32px] overflow-hidden">
        <CardHeader className="text-center space-y-2 pt-8 sm:pt-10 px-6 sm:px-8">
          <div className="flex flex-col items-center">
            <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
              FABRICIO <span className="text-primary mx-0.5">|</span> <span className="font-light text-slate-500">Especialista Consórcio</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
              www.oespecialistaconsorcio.com.br
            </div>
          </div>
          <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 pt-3">Acesso ao Painel</CardTitle>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-8 sm:pb-10">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="vendedor@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl text-base"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-primary hover:underline transition-all"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 h-12 rounded-xl text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive font-medium text-center bg-destructive/10 py-2 rounded-lg">{error}</p>}

            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-base" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Entrando..." : "Entrar no CRM"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
