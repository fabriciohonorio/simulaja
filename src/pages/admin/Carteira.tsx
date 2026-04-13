import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { 
  Users, 
  Search, 
  Trophy, 
  Upload,
  FileText,
  ExternalLink,
  Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface Cliente {
  id: string;
  nome: string;
  grupo: string | null;
  cota: string | null;
  cota_contemplada: string | null;
  valor_credito: number | null;
  administradora: string | null;
  status: string | null;
  boleto_url: string | null;
}

export default function Carteira() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("carteira")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      setClientes(data || []);
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao carregar carteira", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBoleto = async (clientId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `boletos/${clientId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("profiles") // Using existing bucket or assume 'boletos'
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("carteira")
        .update({ boleto_url: publicUrl })
        .eq("id", clientId);

      if (updateError) throw updateError;

      toast({ title: "Boleto enviado!" });
      fetchClientes();
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    }
  };

  const filtered = clientes.filter(c => 
    (c.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.grupo || "").includes(searchTerm)
  );

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Carregando carteira de clientes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900">Carteira de Clientes</h1>
      </div>

      <AdminHeroCard 
        title="Gestão de Contratos" 
        subtitle="Controle de Contemplações e Boletos"
        icon={Users} 
        bgIcon={Users}
        accentColor="primary"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar cliente por nome ou grupo..." 
              className="pl-10 h-10 border-slate-200" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
             <Trophy className="h-4 w-4 text-emerald-500" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total: {clientes.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="group p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-black text-slate-900 truncate max-w-[150px]">{c.nome}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{c.administradora || "Administradora"}</p>
                </div>
                <Badge variant={c.cota_contemplada ? "default" : "outline"} className={`text-[8px] font-black ${c.cota_contemplada ? 'bg-emerald-500' : ''}`}>
                  {c.cota_contemplada ? "CONTEMPLADO" : "EM ANDAMENTO"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-slate-50">
                <div className="text-[10px]">
                  <p className="text-slate-400 font-bold uppercase tracking-tighter">Grupo / Cota</p>
                  <p className="font-black text-slate-700">{c.grupo || "-"} / {c.cota || "-"}</p>
                </div>
                <div className="text-[10px] text-right">
                   <p className="text-slate-400 font-bold uppercase tracking-tighter">Cota Contemplada</p>
                   <p className="font-black text-emerald-600">{c.cota_contemplada || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mt-3">
                <div className="text-[10px]">
                  <p className="text-slate-400 font-bold uppercase tracking-tighter">Crédito</p>
                  <p className="font-black text-blue-600">{formatCurrency(Number(c.valor_credito || 0))}</p>
                </div>
                
                <div className="flex gap-1">
                  {c.boleto_url ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2 text-[9px] font-black uppercase text-blue-600 border-blue-100 hover:bg-blue-50"
                      onClick={() => window.open(c.boleto_url!, '_blank')}
                    >
                      <FileText className="h-3 w-3 mr-1" /> Ver Boleto
                    </Button>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="h-7 px-2 border border-dashed border-slate-200 rounded-md flex items-center text-[9px] font-black uppercase text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
                        <Upload className="h-3 w-3 mr-1" /> Subir Boleto
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadBoleto(c.id, file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminHeroCard>
    </div>
  );
}
