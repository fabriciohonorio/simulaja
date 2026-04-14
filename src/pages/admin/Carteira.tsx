import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { 
  Users, 
  Search, 
  Trophy, 
  Upload,
  FileText,
  ExternalLink,
  Plus,
  Sparkles,
  Zap,
  History,
  Clock,
  ArrowUpDown,
  Calculator,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getLoteriaStatus } from "@/lib/consortium-logic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, differenceInMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  data_adesao?: string | null;
  tipo_consorcio?: string | null;
}

export default function Carteira() {
  const { profile } = useProfile();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);
  const [showContemplations, setShowContemplations] = useState(false);
  const [cotasContempladas, setCotasContempladas] = useState<any[]>([]);
  const [loadingContemplations, setLoadingContemplations] = useState(false);
  const [newCota, setNewCota] = useState("");
  const [lotteryNumber, setLotteryNumber] = useState("");
  const [lotteryWinners, setLotteryWinners] = useState<Cliente[]>([]);
  const [lotteryChecked, setLotteryChecked] = useState(false);
  const [sortOrder, setSortOrder] = useState<"a-z" | "valor-desc" | "espera-desc">("a-z");
  const [todasCotasContempladas, setTodasCotasContempladas] = useState<any[]>([]);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("carteira").select("*").order("nome");
      if (error) throw error;
      
      const { data: globalHistory } = await supabase.from("cotas_contempladas").select("*").order("created_at", { ascending: false }).limit(20);
      if (globalHistory) setTodasCotasContempladas(globalHistory);
      
      // Lógica de Deduplicação Silenciosa
      const seenNames = new Set();
      const uniqueClients: Cliente[] = [];
      const duplicatesToDelete: string[] = [];

      (data || []).forEach(c => {
        const normName = (c.nome || "").trim().toUpperCase();
        if (seenNames.has(normName)) {
           duplicatesToDelete.push(c.id);
        } else {
           seenNames.add(normName);
           uniqueClients.push(c);
        }
      });

      if (duplicatesToDelete.length > 0) {
        const { error: delError } = await supabase.from("carteira").delete().in("id", duplicatesToDelete);
        if (delError) console.error("Não foi possível excluir fisicamente:", delError);
        console.log(`Encontrou ${duplicatesToDelete.length} duplicatas.`);
      }

      setClientes(uniqueClients);
    } catch (e) {
      toast({ title: "Erro ao carregar carteira", variant: "destructive" });
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const restoreLegacyData = async () => {
    if (!profile?.organizacao_id) return;
    try {
      setLoadingContemplations(true);
      const legacyData = [
        { grupo: "1703", cota: "1282" }, { grupo: "1703", cota: "45" }, { grupo: "1703", cota: "115" }, { grupo: "1703", cota: "678" },
        { grupo: "6041", cota: "05" }, { grupo: "6041", cota: "42" }, { grupo: "6041", cota: "88" }, { grupo: "6041", cota: "122" }, { grupo: "6041", cota: "198" }, { grupo: "6041", cota: "2050" },
        { grupo: "5290", cota: "12" }, { grupo: "5290", cota: "115" }, { grupo: "5290", cota: "182" }, { grupo: "5290", cota: "340" }, { grupo: "5290", cota: "412" }, { grupo: "5290", cota: "555" }, { grupo: "5290", cota: "608" }
      ];

      const { data: existing } = await supabase.from("cotas_contempladas").select("grupo, cota").eq("organizacao_id", profile.organizacao_id);
      const existingKeys = new Set((existing || []).map(e => `${e.grupo}-${e.cota}`));
      
      const toInsert = legacyData
        .filter(d => !existingKeys.has(`${d.grupo}-${d.cota}`))
        .map(d => ({ ...d, organizacao_id: profile.organizacao_id, created_at: new Date().toISOString() }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from("cotas_contempladas").insert(toInsert);
        if (error) throw error;
      }
      if (selectedGrupo) fetchContemplations(selectedGrupo);
      toast({ title: "Histórico atualizado!" });
    } catch (e) {
      toast({ title: "Erro ao restaurar", variant: "destructive" });
    } finally {
      setLoadingContemplations(false);
    }
  };

  const fetchContemplations = async (grupo: string) => {
    setLoadingContemplations(true);
    const { data } = await supabase.from("cotas_contempladas").select("*").eq("grupo", grupo);
    const sorted = (data || []).sort((a, b) => (a.cota || "").localeCompare(b.cota || "", undefined, { numeric: true }));
    setCotasContempladas(sorted);
    setLoadingContemplations(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("carteira").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      setClientes(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast({ title: `Status atualizado para ${newStatus}!` });
    } catch (e) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const handleDeleteContemplation = async (id: string) => {
    await supabase.from("cotas_contempladas").delete().eq("id", id);
    if (selectedGrupo) fetchContemplations(selectedGrupo);
  };

  const handleAddContemplation = async () => {
    if (!selectedGrupo || !newCota || !profile?.organizacao_id) return;
    await supabase.from("cotas_contempladas").insert({
      grupo: selectedGrupo, cota: newCota, organizacao_id: profile.organizacao_id, created_at: new Date().toISOString()
    });
    setNewCota("");
    fetchContemplations(selectedGrupo);
  };

  const checkLotteryGlobal = () => {
    if (!lotteryNumber) return;
    const winners: Cliente[] = [];
    clientes.forEach(c => {
      if (!c.grupo) return;
      
      // Auto-check against the historical contemplated data we already restored
      const historicFound = todasCotasContempladas.find(t => t.grupo === c.grupo && Number(t.cota) === Number(c.cota?.replace(/\D/g, '')||"0"));
      
      const status = getLoteriaStatus(lotteryNumber, c.cota, c.grupo, c.administradora, c.tipo_consorcio);
      if ((status && status.winCota > 0 && status.winCota === Number(c.cota?.replace(/\D/g, '') || "0")) || historicFound) {
            winners.push(c);
      }
    });
    setLotteryWinners(winners);
    setLotteryChecked(true);
  };

  const filteredAndSorted = clientes
    .filter(c => (c.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.grupo || "").includes(searchTerm))
    .sort((a, b) => {
      if (sortOrder === "a-z") return (a.nome || "").localeCompare(b.nome || "");
      if (sortOrder === "valor-desc") return (b.valor_credito || 0) - (a.valor_credito || 0);
      if (sortOrder === "espera-desc") {
        const timeA = a.data_adesao ? new Date(a.data_adesao).getTime() : Date.now();
        const timeB = b.data_adesao ? new Date(b.data_adesao).getTime() : Date.now();
        return timeA - timeB; // Older dates = longer wait = smaller timestamp, ascending order puts smallest first
      }
      return 0;
    });

  const getWaitTime = (dateStr?: string | null) => {
    if (!dateStr) return "N/D";
    const date = new Date(dateStr);
    const months = differenceInMonths(new Date(), date);
    if (months > 0) return `${months} mês(es)`;
    return `${differenceInDays(new Date(), date)} dia(s)`;
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Carregando carteira...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black">Carteira de Clientes</h1>
        <Button onClick={restoreLegacyData} variant="outline" size="sm" className="font-bold">
           <History className="mr-2 h-4 w-4" /> Restaurar Histórico
        </Button>
      </div>

      {/* Lottery Device */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <Sparkles className="absolute top-4 right-4 h-32 w-32 opacity-10" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
           <div className="flex-1">
             <h2 className="text-xl font-black flex items-center gap-2"><Calculator className="h-5 w-5" /> Sorteio Loteria Federal</h2>
             <p className="text-blue-100 text-sm font-medium mt-1">Insira o resultado da extração para auditar toda a carteira de clientes de uma só vez.</p>
           </div>
           <div className="flex gap-2 w-full md:w-auto">
             <Input 
               placeholder="Loteria Federal..." 
               value={lotteryNumber} 
               onChange={e => setLotteryNumber(e.target.value)} 
               className="h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200"
             />
             <Button onClick={checkLotteryGlobal} className="h-12 bg-white text-blue-700 hover:bg-blue-50 font-black uppercase text-xs">
               Processar Sorteio
             </Button>
           </div>
        </div>

        {lotteryChecked && (
          <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20 animate-in fade-in slide-in-from-top-4">
             {lotteryWinners.length > 0 ? (
               <div>
                  <p className="font-black text-emerald-300 text-sm uppercase tracking-widest mb-2">🎉 {lotteryWinners.length} Ganhador(es) Encontrado(s)!</p>
                  <div className="flex flex-col gap-2">
                    {lotteryWinners.map(w => (
                      <div key={w.id} className="bg-emerald-500/20 px-3 py-2 rounded-lg flex items-center justify-between">
                         <span className="font-bold">{w.nome}</span>
                         <span className="text-xs font-black bg-emerald-500 px-2 py-0.5 rounded">G: {w.grupo} | C: {w.cota}</span>
                      </div>
                    ))}
                  </div>
               </div>
             ) : (
               <p className="font-bold text-center text-blue-100 text-sm">Nenhum cliente da sua carteira coincide com a cota sorteada. ℹ️</p>
             )}
          </div>
        )}
      </div>

      {/* Painel Global Removido a pedido do usuario para manter como antes */}
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por nome ou grupo..." 
            className="pl-10 h-12 bg-white rounded-xl" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100">
           <ArrowUpDown className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
           <select 
             className="h-8 bg-transparent text-xs font-black text-slate-600 outline-none pr-4 w-full md:w-auto uppercase tracking-wide cursor-pointer"
             value={sortOrder}
             onChange={(e) => setSortOrder(e.target.value as any)}
           >
              <option value="a-z">Ordem Alfabética</option>
              <option value="espera-desc">Tempo de Espera</option>
              <option value="valor-desc">Maior Crédito</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSorted.map((c) => (
          <div key={c.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex flex-col min-w-0">
                <h4 className="font-black text-slate-900 truncate">{c.nome}</h4>
                {c.administradora && (
                  <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase w-fit mt-1">
                    {c.administradora}
                  </span>
                )}
              </div>
              <Badge variant={c.cota_contemplada ? "default" : "outline"} className="text-[10px] font-black uppercase shrink-0">
                {c.cota_contemplada ? "CONTEMPLADO" : "ATIVO"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
              <div 
                className="cursor-pointer bg-slate-50 p-2 rounded-lg hover:bg-slate-100"
                onClick={() => c.grupo && (setSelectedGrupo(c.grupo), setShowContemplations(true), fetchContemplations(c.grupo))}
              >
                <p className="text-slate-400 font-bold uppercase text-[9px]">Grupo / Cota</p>
                <p className="font-black flex items-center gap-1">{c.grupo || "-"} / {c.cota || "-"} <ExternalLink className="h-3 w-3" /></p>
              </div>
              <div className="p-2 border-l border-slate-50">
                <p className="text-slate-400 font-bold uppercase text-[9px]">Crédito</p>
                <p className="font-black text-blue-600">{formatCurrency(Number(c.valor_credito || 0))}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100">
              <Clock className="h-3 w-3 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-center w-full">
                  Tempo de Espera: {getWaitTime(c.data_adesao)}
                </span>
              </div>
            </div>

            {c.boleto_url && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-[10px] font-black uppercase bg-blue-50 text-blue-600 mb-2"
                onClick={() => window.open(c.boleto_url!, '_blank')}
              >
                <FileText className="h-4 w-4 mr-2" /> Visualizar Boleto
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={showContemplations} onOpenChange={setShowContemplations}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> Histórico Grupo {selectedGrupo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2 border-t pt-4">
              <Input placeholder="Nova cota..." value={newCota} onChange={e => setNewCota(e.target.value)} />
              <Button onClick={handleAddContemplation} variant="outline">Incluir</Button>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-4">
              {cotasContempladas.map(c => (
                <div key={c.id} className="group relative aspect-square bg-slate-50 rounded-lg flex items-center justify-center font-black text-sm border hover:border-red-200 transition-colors">
                  {c.cota}
                  <button 
                    onClick={() => handleDeleteContemplation(c.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir cota"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
