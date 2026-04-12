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
  const { signIn, signInWithGoogle } = useAuth();
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
          <div className="flex flex-col items-center pb-4 transition-all duration-700 hover:scale-105">
            <img 
              src="/icon-512.png" 
              alt="Logo Contemplar" 
              className="h-32 sm:h-40 w-auto object-contain drop-shadow-xl" 
            />
            <div className="flex flex-col items-center leading-tight mt-4">
              <span className="text-[24px] sm:text-[32px] font-black tracking-tighter text-slate-900 uppercase">CONTEMPLAR</span>
              <span className="text-[18px] sm:text-[22px] font-bold tracking-[0.3em] text-[#84CC16] -mt-1 ml-2">CRM</span>
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

          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-muted-foreground uppercase font-semibold">ou conecte-se com</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl font-bold text-base mt-4 border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={async () => {
              setLoading(true);
              await signInWithGoogle();
              setLoading(false);
            }}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google Workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
