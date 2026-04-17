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
  NotebookPen,
  ClipboardList,
  RefreshCw,
  ShieldAlert,
  Trash2,
  CalendarDays,
  Pencil
} from "lucide-react";
import { formatToUpper, formatToFourDigits } from "@/lib/formatters";
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
import { HistoricoModal } from "@/components/admin/funil/HistoricoModal";
import { Lead } from "@/types/funil";
import confetti from "canvas-confetti";

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
  lead_id?: string | null;
  protocolo_lance_fixo?: string | null;
  celular?: string | null;
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
  const [lotteryAdmin, setLotteryAdmin] = useState<string>("TODAS"); // NOVO STATE
  const [lotteryWinners, setLotteryWinners] = useState<Cliente[]>([]);
  const [lotteryChecked, setLotteryChecked] = useState(false);
  const [sortOrder, setSortOrder] = useState<"a-z" | "valor-desc" | "espera-desc">("a-z");
  const [todasCotasContempladas, setTodasCotasContempladas] = useState<any[]>([]);
  const [selectedLeadForHistory, setSelectedLeadForHistory] = useState<Lead | null>(null);
  const [leadsComLance, setLeadsComLance] = useState<Set<string>>(new Set());
  
  // States para editar data
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState("");
  
  // State para contemplação manual
  const [manualContemplationClient, setManualContemplationClient] = useState<Cliente | null>(null);

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
      
      // Lógica de Deduplicação Silenciosa - Baseada em Nome + Grupo + Cota
      const seenContracts = new Set();
      const uniqueClients: Cliente[] = [];
      const duplicatesToDelete: string[] = [];

      (data || []).forEach(c => {
        const normName = (c.nome || "").trim().toUpperCase();
        const contractKey = `${normName}-${c.grupo}-${c.cota}`;
        
        if (seenContracts.has(contractKey)) {
           duplicatesToDelete.push(c.id);
        } else {
           seenContracts.add(contractKey);
           uniqueClients.push(c);
        }
      });

      if (duplicatesToDelete.length > 0) {
        const { error: delError } = await supabase.from("carteira").delete().in("id", duplicatesToDelete);
        if (delError) console.error("Não foi possível excluir fisicamente:", delError);
        console.log(`Encontrou ${duplicatesToDelete.length} duplicatas.`);
      }

      // Enriquecer data_adesao a partir da data de fechamento do lead (status_updated_at)
      const leadIds = uniqueClients.map(c => c.lead_id).filter(Boolean) as string[];
      let leadDateMap = new Map<string, string>();
      let leadsSet = new Set<string>();

      if (leadIds.length > 0) {
        const [{ data: leadDates }, { data: lanceInteractions }] = await Promise.all([
          supabase
            .from("leads")
            .select("id, status_updated_at")
            .in("id", leadIds),
          supabase
            .from("historico_contatos")
            .select("lead_id")
            .eq("tipo", "lance")
            .in("lead_id", leadIds),
        ]);

        leadDateMap = new Map(
          (leadDates || []).map(l => [
            l.id,
            l.status_updated_at
          ])
        );
        leadsSet = new Set((lanceInteractions || []).map(i => i.lead_id));
        setLeadsComLance(leadsSet);
      }

      // Persistir data_adesao enriquecida de volta ao banco para clientes que tinham o campo vazio
      const persistPromises: Promise<any>[] = [];
      for (const c of uniqueClients) {
        if (!c.data_adesao && c.lead_id) {
          const enrichedDate = leadDateMap.get(c.lead_id);
          if (enrichedDate) {
            persistPromises.push(
              supabase.from("carteira").update({ data_adesao: enrichedDate }).eq("id", c.id) as any
            );
          }
        }
      }
      if (persistPromises.length > 0) {
        await Promise.all(persistPromises);
        console.log(`[Carteira] Persistida data_adesao para ${persistPromises.length} cliente(s) sem data.`);
      }

      const formattedUniqueClients = uniqueClients.map(c => ({
        ...c,
        nome: formatToUpper(c.nome),
        grupo: formatToFourDigits(c.grupo),
        cota: formatToFourDigits(c.cota),
        administradora: formatToUpper(c.administradora),
        // Usa data do lead se data_adesao estiver vazia (fallback em memória)
        data_adesao: c.data_adesao || (c.lead_id ? (leadDateMap.get(c.lead_id) ?? null) : null),
      }));

      setClientes(formattedUniqueClients);
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

  const handleOpenTratativas = async (cliente: Cliente) => {
    if (cliente.lead_id) {
       // Buscar lead completo
       const { data: lead } = await supabase.from("leads").select("*").eq("id", cliente.lead_id).single();
       if (lead) {
         setSelectedLeadForHistory(lead as unknown as Lead);
         return;
       }
    }

    // Se não tem lead_id ou lead não encontrado, tentar buscar por nome ou criar
    setLoading(true);
    try {
      const { data: existingLeads } = await supabase.from("leads")
        .select("*")
        .eq("nome", cliente.nome)
        .eq("organizacao_id", profile?.organizacao_id)
        .limit(1);

      if (existingLeads && existingLeads.length > 0) {
        const lead = existingLeads[0];
        setSelectedLeadForHistory(lead as unknown as Lead);
        // Vincular ao cliente para a próxima vez
        await supabase.from("carteira").update({ lead_id: lead.id }).eq("id", cliente.id);
      } else {
        // Criar lead shadow — usar data_adesao como data da venda para NÃO contaminar métricas do mês atual
        const shadowStatusDate = cliente.data_adesao
          ? (cliente.data_adesao.includes('T') ? cliente.data_adesao : `${cliente.data_adesao}T12:00:00Z`)
          : "2020-01-01T12:00:00Z"; // data bem no passado se não houver data de adesão
        const { data: newLead, error: insErr } = await supabase.from("leads").insert({
          nome: cliente.nome,
          celular: cliente.celular,
          tipo_consorcio: cliente.tipo_consorcio || "imovel",
          valor_credito: cliente.valor_credito || 0,
          status: "fechado",
          status_updated_at: shadowStatusDate,
          organizacao_id: profile?.organizacao_id,
          grupo: cliente.grupo,
          cota: cliente.cota,
          origem: "carteira_shadow",
        }).select().single();

        if (newLead) {
          setSelectedLeadForHistory(newLead as unknown as Lead);
          await supabase.from("carteira").update({ lead_id: newLead.id }).eq("id", cliente.id);
        }
      }
    } catch (e) {
      toast({ title: "Erro ao abrir tratativas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncData = async () => {
    setLoading(true);
    try {
      const { data: carteiraItems, error: cErr } = await supabase
        .from("carteira")
        .select("id, lead_id, data_adesao")
        .not("lead_id", "is", null);

      if (cErr) throw cErr;

      if (!carteiraItems || carteiraItems.length === 0) {
        toast({ title: "Nenhum vínculo encontrado para sincronizar" });
        return;
      }

      let syncCount = 0;
      for (const item of carteiraItems) {
        const { data: lead } = await supabase
          .from("leads")
          // CRÍTICO: incluir status_updated_at para salvar data_adesao
          .select("nome, grupo, cota, tipo_consorcio, valor_credito, administradora, status_updated_at, celular")
          .eq("id", item.lead_id)
          .single();

        if (lead) {
          const bestDate = lead.status_updated_at || null;
          await supabase.from("carteira").update({
            nome: lead.nome,
            grupo: lead.grupo,
            cota: lead.cota,
            tipo_consorcio: lead.tipo_consorcio,
            valor_credito: lead.valor_credito,
            administradora: lead.administradora,
            celular: lead.celular,
            // Persiste a melhor data apenas se a carteira não tiver data, para não sobrescrever
            ...((bestDate && !item.data_adesao) ? { data_adesao: bestDate } : {}),
          }).eq("id", item.id);
          syncCount++;
        }
      }

      // NOVO: Sincronização por Nome para itens sem lead_id ou com dados suspeitos
      const { data: allCarteira } = await supabase.from("carteira").select("*");
      const { data: allLeadsVendidos } = await supabase.from("leads").select("*").in("status", ["fechado", "venda_fechada"]);

      if (allCarteira && allLeadsVendidos) {
        for (const c of allCarteira) {
          // Se as cotas não batem com o que deveria ser (ex: caso do João Batista)
          const matchingLeads = allLeadsVendidos.filter(l => 
            l.nome?.trim().toUpperCase() === c.nome?.trim().toUpperCase()
          );

          if (matchingLeads.length > 0) {
             // Tentar encontrar o melhor match ou atualizar o lead_id se estiver faltando
             // No caso do João, se ele tem 2 e na carteira tem 2, tentamos parear
             const leadMatch = matchingLeads.find(l => l.grupo === c.grupo && l.cota === c.cota);
             
             if (!leadMatch) {
                // Se não há match exato de grupo/cota, mas o nome bate, 
                // Priorizamos os dados do LEAD (como solicitado pelo usuário)
                // Se o cliente tem 2 e o lead tem 2, vamos atualizar as cotas da carteira
                // para baterem com os leads por ordem de ID ou similar
                const cIndex = allCarteira.filter(x => x.nome === c.nome).indexOf(c);
                if (matchingLeads[cIndex]) {
                  const correctLead = matchingLeads[cIndex];
                  await supabase.from("carteira").update({
                    lead_id: correctLead.id,
                    nome: formatToUpper(correctLead.nome),
                    grupo: formatToFourDigits(correctLead.grupo),
                    cota: formatToFourDigits(correctLead.cota),
                    valor_credito: correctLead.valor_credito,
                    administradora: formatToUpper(correctLead.administradora)
                  }).eq("id", c.id);
                  syncCount++;
                }
             }
          }
        }
      }

      toast({ title: `Sincronização concluída: ${syncCount} registros ajustados.` });

      // PARTE 2: Recuperar leads vendidos que não estão na carteira
      const { data: vendidos } = await supabase
        .from("leads")
        .select("*")
        .in("status", ["fechado", "venda_fechada"]);

      if (vendidos && vendidos.length > 0) {
        // Pegar todos os lead_ids que JÁ estão na carteira após a primeira parte
        const { data: currentCarteira } = await supabase.from("carteira").select("lead_id");
        const existingIds = new Set((currentCarteira || []).map(i => i.lead_id));
        
        let restoredCount = 0;
        for (const v of vendidos) {
          if (!existingIds.has(v.id)) {
            // Se o lead vendido não está na carteira, restaurar
            // CRÍTICO: salvar data_adesao a partir do fechamento do lead
            const leadDate = v.status_updated_at || null;
            await supabase.from("carteira").insert({
              lead_id: v.id,
              nome: formatToUpper(v.nome),
              grupo: formatToFourDigits(v.grupo),
              cota: formatToFourDigits(v.cota),
              administradora: formatToUpper(v.administradora),
              valor_credito: v.valor_credito,
              tipo_consorcio: v.tipo_consorcio,
              celular: v.celular,
              organizacao_id: v.organizacao_id,
              status: "ativo",
              data_adesao: leadDate,
              created_at: new Date().toISOString()
            });
            restoredCount++;
          }
        }
        if (restoredCount > 0) {
          toast({ title: `${restoredCount} contratos restaurados dos Leads!` });
        }
      }

      fetchClientes();
    } catch (e) {
      toast({ title: "Erro na sincronização", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsInadimplente = async (c: Cliente) => {
    if (!profile?.organizacao_id) return;
    
    const confirmMove = confirm(`Deseja marcar ${c.nome} como inadimplente?`);
    if (!confirmMove) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("inadimplentes").insert({
        nome: formatToUpper(c.nome),
        celular: c.celular,
        grupo: formatToFourDigits(c.grupo),
        cota: formatToFourDigits(c.cota),
        tipo_consorcio: c.tipo_consorcio,
        administradora: formatToUpper(c.administradora),
        valor_parcela: 0, // Necessita preenchimento manual no outro lado
        parcelas_atrasadas: 1,
        status: "em_atraso",
        organizacao_id: profile.organizacao_id
      });

      if (error) throw error;
      toast({ title: "Cliente enviado para Inadimplentes!" });
    } catch (e) {
      toast({ title: "Erro ao marcar inadimplência", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
      
      const adminName = formatToUpper(c.administradora) || "NÃO INFORMADA";
      if (lotteryAdmin !== "TODAS" && adminName !== lotteryAdmin) return;
      
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

  const getWaitTime = (dateStr?: string | null): { label: string; urgent: boolean } => {
    if (!dateStr) return { label: "Data não informada", urgent: false };
    const date = new Date(dateStr);
    const now = new Date();
    const months = differenceInMonths(now, date);
    const days = differenceInDays(now, date);
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remMonths = months % 12;
      return {
        label: remMonths > 0 ? `${years} ano(s) e ${remMonths} mês(es)` : `${years} ano(s)`,
        urgent: true,
      };
    }
    if (months > 0) return { label: `${months} mês(es)`, urgent: months >= 6 };
    return { label: `${days} dia(s)`, urgent: false };
  };

  const handleSaveDate = async (id: string, leadId?: string | null) => {
    if (!editDateValue) return;
    try {
      const isoDate = new Date(editDateValue).toISOString();
      await supabase.from("carteira").update({ data_adesao: isoDate }).eq("id", id);
      
      // Se houver lead associado, atualizar nele também para manter sincronizado total
      if (leadId) {
         await supabase.from("leads").update({ 
            data_fechamento: isoDate,
            status_updated_at: isoDate 
         }).eq("id", leadId);
      }

      setClientes(prev => prev.map(c => c.id === id ? { ...c, data_adesao: isoDate } : c));
      setEditingDateId(null);
      toast({ title: "Data atualizada com sucesso!" });
    } catch (e) {
      toast({ title: "Erro ao atualizar data", variant: "destructive" });
    }
  };

  const handleManualContemplationAction = async (client: Cliente) => {
    setManualContemplationClient(client);
    
    // Confetti effect
    const end = Date.now() + 2 * 1000;
    const colors = ['#f59e0b', '#fbbf24', '#34d399', '#10b981'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        zIndex: 9999
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        zIndex: 9999
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    try {
      // Update DB to mark as contemplated if not already
      if (!client.cota_contemplada) {
         const newDate = new Date().toISOString();
         await supabase.from("carteira").update({ cota_contemplada: newDate }).eq("id", client.id);
         setClientes(prev => prev.map(c => c.id === client.id ? { ...c, cota_contemplada: newDate } : c));
         
         // Add to cotas_contempladas history
         if (client.grupo && client.cota && profile?.organizacao_id) {
            await supabase.from("cotas_contempladas").insert({
               grupo: client.grupo,
               cota: client.cota,
               organizacao_id: profile.organizacao_id,
               created_at: newDate
            });
         }
      }
    } catch (e) {
      console.error("Error setting contemplation", e);
    }
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
           <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
             <select 
               className="h-12 bg-white/10 border border-white/20 text-white rounded-md px-3 font-bold text-sm outline-none cursor-pointer appearance-none"
               value={lotteryAdmin}
               onChange={e => setLotteryAdmin(e.target.value)}
             >
               <option value="TODAS" className="text-slate-800">Todas as Administradoras</option>
               {Array.from(new Set(["MAGALU", "ADEMICON", "SERVOPA", ...clientes.map(c => formatToUpper(c.administradora)).filter(Boolean)])).sort().map(admin => (
                 <option key={admin as string} value={admin as string} className="text-slate-800">{admin as string}</option>
               ))}
             </select>
             <Input 
               placeholder="Loteria Federal..." 
               value={lotteryNumber} 
               onChange={e => setLotteryNumber(e.target.value)} 
               className="h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200 min-w-[150px]"
             />
             <Button onClick={checkLotteryGlobal} className="h-12 bg-white text-blue-700 hover:bg-blue-50 font-black uppercase text-xs shrink-0">
               Processar Sorteio
             </Button>
           </div>
        </div>

        {lotteryChecked && (
          <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20 animate-in fade-in slide-in-from-top-4">
             {lotteryWinners.length > 0 ? (
               <div>
                  <p className="font-black text-emerald-300 text-sm uppercase tracking-widest mb-2">🎉 {lotteryWinners.length} Ganhador(es) Encontrado(s){lotteryAdmin !== "TODAS" ? ` NA ${lotteryAdmin}` : ""}!</p>
                  <div className="flex flex-col gap-2">
                    {lotteryWinners.map(w => (
                      <div key={w.id} className="bg-emerald-500/20 px-3 py-2 rounded-lg flex items-center justify-between gap-4">
                         <span className="font-bold flex-1 truncate">{w.nome}</span>
                         <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 shrink-0">{w.administradora}</span>
                         <span className="text-xs font-black bg-emerald-500 px-2 py-0.5 rounded shrink-0">G: {w.grupo} | C: {w.cota}</span>
                      </div>
                    ))}
                  </div>
               </div>
             ) : (
               <p className="font-bold text-center text-blue-100 text-sm">Nenhum cliente da {lotteryAdmin !== "TODAS" ? lotteryAdmin : "sua carteira"} coincide com a cota sorteada. ℹ️</p>
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
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncData}
          className="h-12 gap-2 text-slate-600 bg-white border-slate-100 rounded-xl px-4 font-black uppercase text-xs"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Dados
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSorted.map((c) => (
          <div key={c.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex flex-col min-w-0">
                <h4 className="font-black text-slate-900 truncate">{formatToUpper(c.nome)}</h4>
                {c.administradora && (
                  <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase w-fit mt-1">
                    {formatToUpper(c.administradora)}
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
                <p className="font-black flex items-center gap-1">{formatToFourDigits(c.grupo) || "-"} / {formatToFourDigits(c.cota) || "-"} <ExternalLink className="h-3 w-3" /></p>
              </div>
              <div className="p-2 border-l border-slate-50">
                <p className="text-slate-400 font-bold uppercase text-[9px]">Crédito</p>
                <p className="font-black text-blue-600">{formatCurrency(Number(c.valor_credito || 0))}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {editingDateId === c.id ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-50 border-slate-200">
                  <Input 
                    type="date" 
                    className="h-8 text-xs font-bold" 
                    value={editDateValue}
                    onChange={e => setEditDateValue(e.target.value)}
                  />
                  <Button size="sm" className="h-8 text-xs font-black" onClick={() => handleSaveDate(c.id, c.lead_id)}>Salvar</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingDateId(null)}>Cancelar</Button>
                </div>
              ) : (
                (() => {
                  const wait = getWaitTime(c.data_adesao);
                  return (
                    <div className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border relative ${
                      wait.urgent
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>
                      <Clock className="h-3 w-3 shrink-0" />
                      <div className="flex-1">
                        <p className="text-[9px] font-bold uppercase text-center opacity-60 tracking-widest">Aguardando contemplação</p>
                        <p className={`text-[11px] font-black uppercase tracking-wider text-center ${
                          wait.urgent ? "text-rose-700" : "text-amber-700"
                        }`}>
                          {wait.label}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingDateId(c.id);
                          setEditDateValue(c.data_adesao ? new Date(c.data_adesao).toISOString().split('T')[0] : '');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md bg-white/50 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 shadow-sm"
                        title="Corrigir Data de Adesão"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className={`flex-1 h-8 text-[9px] font-black uppercase gap-1.5 transition-all ${
                  c.lead_id && leadsComLance.has(c.lead_id)
                    ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-500/20" 
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
                onClick={() => handleOpenTratativas(c)}
              >
                <NotebookPen className="h-3 w-3" /> 
                {c.lead_id && leadsComLance.has(c.lead_id) ? "Lance Registrado" : "Tratativas"}
              </Button>

              {c.boleto_url && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 h-8 text-[9px] font-black uppercase bg-blue-50 text-blue-600"
                  onClick={() => window.open(c.boleto_url!, '_blank')}
                >
                  <FileText className="h-3.5 w-3.5 mr-1" /> Boleto
                </Button>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                onClick={() => handleMarkAsInadimplente(c)}
                title="Marcar como Inadimplente"
              >
                <ShieldAlert className="h-4 w-4" />
              </Button>
              
              {!c.cota_contemplada && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-50 rounded-lg shrink-0"
                  onClick={() => handleManualContemplationAction(c)}
                  title="Contemplar Manualmente"
                >
                  <Trophy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!manualContemplationClient} onOpenChange={(open) => { if (!open) setManualContemplationClient(null); }}>
        <DialogContent className="max-w-sm text-center p-8 bg-gradient-to-br from-amber-400 to-amber-600 border-none rounded-3xl shadow-2xl">
           <DialogHeader>
             <DialogTitle className="sr-only">Cliente Contemplado</DialogTitle>
           </DialogHeader>
           <Trophy className="h-20 w-20 mx-auto text-white drop-shadow-md mb-4 animate-bounce" />
           <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-2 drop-shadow-md">
             Contemplado!
           </h2>
           <p className="text-amber-100 font-bold mb-4">
             {manualContemplationClient?.nome}
           </p>
           <p className="text-sm text-amber-100 bg-black/10 rounded-lg px-4 py-2 inline-block font-black mt-2">
             G: {manualContemplationClient?.grupo} / C: {manualContemplationClient?.cota}
           </p>
           <Button 
             className="w-full mt-6 bg-white text-amber-600 hover:bg-amber-50 font-black uppercase tracking-widest h-12 rounded-xl"
             onClick={() => setManualContemplationClient(null)}
           >
             Incrível!
           </Button>
        </DialogContent>
      </Dialog>

      <HistoricoModal 
        lead={selectedLeadForHistory}
        onClose={() => {
          setSelectedLeadForHistory(null);
          // Atualiza para garantir que se um lance foi incluído, o botão fique verde
          fetchClientes();
        }}
      />

      <Dialog open={showContemplations} onOpenChange={setShowContemplations}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Cotas Contempladas — Grupo {selectedGrupo}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {cotasContempladas.length} cota(s) registrada(s). Digite o número e pressione Enter ou clique em Incluir.
            </DialogDescription>
          </DialogHeader>

          {/* Input fixo — sempre visível */}
          <div className="flex gap-2 pt-2 pb-3 border-b border-slate-100 shrink-0">
            <Input
              placeholder="Nº da cota contemplada..."
              value={newCota}
              onChange={e => setNewCota(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddContemplation()}
              className="h-11 text-base font-bold"
              autoFocus
            />
            <Button
              onClick={handleAddContemplation}
              disabled={!newCota.trim()}
              className="h-11 px-6 font-black bg-amber-500 hover:bg-amber-600 text-white shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" /> Incluir
            </Button>
          </div>

          {/* Grade de cotas com scroll independente */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loadingContemplations ? (
              <div className="flex items-center justify-center py-10 text-slate-400 text-sm animate-pulse">
                Carregando cotas...
              </div>
            ) : cotasContempladas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <Trophy className="h-8 w-8 opacity-20" />
                <p className="text-sm font-medium">Nenhuma cota contemplada registrada.</p>
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 py-3">
                {cotasContempladas.map(c => (
                  <div
                    key={c.id}
                    className="group relative aspect-square bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center font-black text-sm text-amber-800 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all cursor-default"
                  >
                    {c.cota}
                    <button
                      onClick={() => handleDeleteContemplation(c.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Excluir cota"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
