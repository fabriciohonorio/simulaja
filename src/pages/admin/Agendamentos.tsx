import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, MessageCircle, Phone, Clock, AlertCircle, Search, MapPin, DollarSign, ExternalLink, Gift, PartyPopper, Plus, ChevronLeft, ChevronRight, CheckCircle2, ListFilter, Calendar as CalendarIcon } from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isPast, isToday, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, addDays, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatLeadValue, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { TrendingUp, Zap, Sparkles } from "lucide-react";
import { formatToUpper } from "@/lib/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseBirthday, isBirthdayToday, isBirthdayThisMonth } from "@/lib/birthdayUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Lead {
  id: string;
  nome: string;
  status: string | null;
  valor_credito: number;
  data_vencimento: string | null;
  celular: string | null;
  cidade: string | null;
  tipo_consorcio: string | null;
  dados_cadastro?: any;
}

interface Appointment {
  id: string;
  titulo: string;
  data_agendada: string;
  descricao: string | null;
  lead_id: string | null;
  tipo: string | null;
  status: string | null;
  lead?: Lead;
}

export default function Agendamentos() {
  const { profile } = useAuth();
  const [agendas, setAgendas] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [leadsWithBirthday, setLeadsWithBirthday] = useState<Lead[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // States para novo agendamento
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [newAppt, setNewAppt] = useState({
    titulo: "",
    data: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    descricao: "",
    lead_id: "none",
    tipo: "reuniao"
  });
  const [allLeadsList, setAllLeadsList] = useState<Lead[]>([]);

  const fetchAgendas = async () => {
    // Busca todos os leads relevantes
    const { data: leadsData } = await supabase
      .from("leads")
      .select("*")
      .order("data_vencimento", { ascending: true });
    
    const allLeads = (leadsData as any[]) ?? [];
    setAllLeadsList(allLeads);
    
    // Filtra agendamentos normais (vencimento do lead)
    const filteredAgendas = allLeads.filter(a => 
      a.data_vencimento && 
      !["fechado", "perdido", "morto", "aguardando_pagamento"].includes(a.status?.toLowerCase() || "")
    );
    
    // Busca agendamentos da tabela 'agendamentos'
    const { data: apptsData } = await supabase
      .from("agendamentos")
      .select("*, lead:leads(*)")
      .order("data_agendada", { ascending: true });
    
    setAppointments((apptsData as any[]) ?? []);
    
    // Filtra aniversariantes (todos que possuem data)
    const birthdayLeads = allLeads.filter(l => {
      const birth = l.dados_cadastro?.dataNascimento || l.dados_cadastro?.NASCIMENTO || l.dados_cadastro?.DATA_NASCIMENTO || l.dados_cadastro?.data_nascimento || l.dados_cadastro?.nascimento;
      return birth && parseBirthday(birth) !== null;
    }).sort((a, b) => {
      const birthA = a.dados_cadastro?.dataNascimento || a.dados_cadastro?.NASCIMENTO || a.dados_cadastro?.DATA_NASCIMENTO || a.dados_cadastro?.data_nascimento || a.dados_cadastro?.nascimento;
      const birthB = b.dados_cadastro?.dataNascimento || b.dados_cadastro?.NASCIMENTO || b.dados_cadastro?.DATA_NASCIMENTO || b.dados_cadastro?.data_nascimento || b.dados_cadastro?.nascimento;
      const dateA = parseBirthday(birthA)!;
      const dateB = parseBirthday(birthB)!;
      
      if (dateA.getMonth() !== dateB.getMonth()) {
        return dateA.getMonth() - dateB.getMonth();
      }
      return dateA.getDate() - dateB.getDate();
    });

    setAgendas(filteredAgendas);
    setLeadsWithBirthday(birthdayLeads);
    setLoading(false);
  };

  useEffect(() => {
    fetchAgendas();
  }, []);

  const filteredAgendas = agendas.filter(a => 
    (a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.cidade && a.cidade.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredBirthdays = leadsWithBirthday.filter(a => 
    (a.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const agendamentosHoje = agendas.filter(a => isToday(parseISO(a.data_vencimento!))).length;
  const aniversariantesHoje = leadsWithBirthday.filter(l => {
    const birth = l.dados_cadastro?.NASCIMENTO || l.dados_cadastro?.DATANASCIMENTO || l.dados_cadastro?.DATA_NASCIMENTO || l.dados_cadastro?.data_nascimento || l.dados_cadastro?.nascimento || l.dados_cadastro?.birth_date;
    return isBirthdayToday(birth);
  }).length;

  const agendamentosAtrasados = agendas.filter(a => {
    const d = parseISO(a.data_vencimento!);
    return isPast(d) && !isToday(d);
  }).length;
  const openWhatsApp = (lead: Lead, isBirthday = false) => {
    const phone = lead.celular ? lead.celular.replace(/\D/g, "") : "";
    let message = "";
    if (isBirthday) {
      message = `Olá ${formatToUpper(lead.nome)}! %0A%0AEm nome d'O Especialista Consórcio, gostaria de lhe desejar um feliz aniversário! Que seu dia seja repleto de alegrias e realizações. Parabéns! 🎉🥳`;
    }
    window.open(`https://wa.me/55${phone}${message ? `?text=${message}` : ""}`, "_blank");
  };

  const handleAddAppointment = async () => {
    if (!newAppt.titulo || !newAppt.data) {
      toast({ title: "Erro", description: "Preencha o título e a data.", variant: "destructive" });
      return;
    }

    const leadIdValue = newAppt.lead_id === "none" || !newAppt.lead_id ? null : newAppt.lead_id;

    const { error } = await supabase.from("agendamentos").insert({
      titulo: newAppt.titulo,
      data_agendada: newAppt.data,
      descricao: newAppt.descricao,
      lead_id: leadIdValue as any, // Cast to any because types might be strict
      tipo: newAppt.tipo,
      criado_por: profile?.id,
      status: "pendente"
    });

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Agendamento salvo!", description: "Seu compromisso foi registrado com sucesso." });
      setIsAddingAppointment(false);
      fetchAgendas();
    }
  };

  // Calendário Grid Helpers
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => {
    const appts = appointments.filter(a => isSameDay(parseISO(a.data_agendada), day));
    const leads = agendas.filter(l => isSameDay(parseISO(l.data_vencimento!), day));
    const births = leadsWithBirthday.filter(l => {
      const birth = l.dados_cadastro?.NASCIMENTO || l.dados_cadastro?.DATANASCIMENTO || l.dados_cadastro?.DATA_NASCIMENTO || l.dados_cadastro?.data_nascimento || l.dados_cadastro?.nascimento || l.dados_cadastro?.birth_date;
      const b = parseBirthday(birth);
      return b && b.getDate() === day.getDate() && b.getMonth() === day.getMonth();
    });
    return { appts, leads, births };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Gamified Agenda Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AdminHeroCard 
            title="Sua Agenda" 
            subtitle="Calendário & Compromissos"
            icon={CalendarDays} 
            bgIcon={CalendarDays}
            accentColor="primary"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  Organização <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">Total</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                   Centralize retornos de leads, agendamentos importantes e aniversários em uma visão mensal completa.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Agendados</p>
                  <p className="text-lg font-black text-purple-600">{agendas.length + appointments.length}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Aniversários</p>
                  <p className="text-lg font-black text-amber-600">{leadsWithBirthday.length}</p>
                </div>
              </div>
            </div>
          </AdminHeroCard>
        </div>

        <div className="lg:col-span-4 grid grid-cols-1 gap-4">
          <Dialog open={isAddingAppointment} onOpenChange={setIsAddingAppointment}>
            <DialogTrigger asChild>
              <Button className="h-full rounded-[24px] bg-slate-900 hover:bg-slate-800 text-white shadow-xl flex flex-col items-center justify-center gap-3 p-6 group transition-all">
                <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-black uppercase tracking-tighter text-sm">Novo Agendamento</p>
                  <p className="text-[10px] text-slate-400 mt-1">Reunião, Visita ou Follow-up</p>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white rounded-3xl border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">Registrar Compromisso</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Título do Compromisso</Label>
                  <Input 
                    placeholder="Ex: Reunião de Fechamento" 
                    value={newAppt.titulo}
                    onChange={e => setNewAppt({...newAppt, titulo: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Data e Hora</Label>
                    <Input 
                      type="datetime-local" 
                      value={newAppt.data}
                      onChange={e => setNewAppt({...newAppt, data: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Tipo</Label>
                    <Select value={newAppt.tipo} onValueChange={v => setNewAppt({...newAppt, tipo: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="visita">Visita</SelectItem>
                        <SelectItem value="banco">Banco</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Vincular a um Cliente</Label>
                  <Select value={newAppt.lead_id} onValueChange={v => setNewAppt({...newAppt, lead_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente (opcional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem vínculo (Evento Geral)</SelectItem>
                      {allLeadsList.map(l => (
                        <SelectItem key={l.id} value={l.id}>{formatToUpper(l.nome)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Observações</Label>
                  <Textarea 
                    placeholder="Detalhes importantes..." 
                    value={newAppt.descricao}
                    onChange={e => setNewAppt({...newAppt, descricao: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingAppointment(false)}>Cancelar</Button>
                <Button onClick={handleAddAppointment} className="bg-slate-900 text-white">Salvar na Agenda</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou cidade..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="calendario" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendario" className="gap-2">
            <CalendarIcon className="h-4 w-4" /> Calendário Mensal
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="gap-2">
            <ListFilter className="h-4 w-4" /> Lista de Compromissos
          </TabsTrigger>
          <TabsTrigger value="aniversarios" className="gap-2">
            <Gift className="h-4 w-4" /> Aniversários (Todos)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="animate-in fade-in zoom-in-95 duration-500">
          <Card className="rounded-[32px] overflow-hidden border-slate-100 shadow-xl">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentDate(new Date())} className="text-[10px] font-black uppercase">Hoje</Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-slate-100">
                {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"].map(d => (
                  <div key={d} className="py-3 text-center text-[10px] font-black text-slate-400 tracking-widest bg-slate-50/30">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const { appts, leads, births } = getEventsForDay(day);
                  const isTodayDay = isToday(day);
                  const isThisMonth = isSameMonth(day, currentDate);
                  const hasEvents = appts.length > 0 || leads.length > 0 || births.length > 0;

                  return (
                    <div 
                      key={day.toISOString()} 
                      className={cn(
                        "min-h-[120px] p-2 border-r border-b border-slate-50 transition-colors hover:bg-slate-50/50 relative",
                        !isThisMonth && "bg-slate-50/20 opacity-40",
                        (i + 1) % 7 === 0 && "border-r-0"
                      )}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={cn(
                          "text-xs font-black p-1.5 rounded-lg w-8 h-8 flex items-center justify-center",
                          isTodayDay ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "text-slate-400"
                        )}>
                          {format(day, "d")}
                        </span>
                        {births.length > 0 && <PartyPopper className="h-3 w-3 text-amber-500" />}
                      </div>

                      <div className="space-y-1 mt-1">
                        {appts.map(a => (
                          <div key={a.id} className="text-[9px] p-1 bg-purple-50 text-purple-700 rounded border border-purple-100 truncate font-bold uppercase tracking-tight">
                            📌 {a.titulo}
                          </div>
                        ))}
                        {leads.map(l => (
                          <div key={l.id} className="text-[9px] p-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 truncate font-bold uppercase tracking-tight">
                            👤 {l.nome}
                          </div>
                        ))}
                        {births.map(b => (
                          <div key={`cal-birth-${b.id}`} className="text-[9px] p-1 bg-amber-50 text-amber-700 rounded border border-amber-100 truncate font-bold uppercase tracking-tight animate-pulse">
                            🎂 {b.nome}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agendamentos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {/* Listagem de Agendamentos da Tabela 'agendamentos' */}
             {appointments.map(appt => (
                <Card key={appt.id} className="overflow-hidden border-t-4 border-t-purple-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">{format(parseISO(appt.data_agendada), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                          <Badge variant="secondary" className="text-[8px] font-black uppercase text-purple-700 bg-purple-100">{appt.tipo || "Compromisso"}</Badge>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg truncate leading-tight uppercase tracking-tighter">{appt.titulo}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium mb-3">CLIENTE: {formatToUpper(appt.lead?.nome || "Vínculo Direto")}</p>
                    {appt.descricao && <p className="text-xs text-slate-500 line-clamp-2 italic mb-4">"{appt.descricao}"</p>}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => appt.lead ? openWhatsApp(appt.lead) : null}
                      >
                        <WhatsAppIcon className="h-4 w-4" /> Contato
                      </Button>
                    </div>
                  </CardContent>
                </Card>
             ))}

            {filteredAgendas.map((lead) => {
              const date = parseISO(lead.data_vencimento!);
              const isAtrasado = isPast(date) && !isToday(date);
              const hoje = isToday(date);

              return (
                <Card key={lead.id} className={`overflow-hidden border-t-4 ${isAtrasado ? "border-t-red-500" : hoje ? "border-t-amber-500" : "border-t-primary"}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isAtrasado ? "bg-red-50 text-red-600" : hoje ? "bg-amber-50 text-amber-600" : "bg-primary/10 text-primary"}`}>
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">{format(date, "dd 'de' MMMM", { locale: ptBR })}</p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">
                            {isAtrasado ? "⚠️ Atrasado" : hoje ? "🔔 Vence Hoje" : "📅 Programado"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase truncate max-w-[100px]">
                        {lead.status?.replace(/_/g, " ") ?? "Lead"}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <h3 className="font-bold text-lg truncate leading-tight">{formatToUpper(lead.nome)}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lead.cidade || "N/Inf"}</span>
                        <span className="flex items-center gap-1 text-primary font-bold"><DollarSign className="h-3 w-3" /> {formatLeadValue(Number(lead.valor_credito))}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        onClick={() => openWhatsApp(lead)}
                      >
                        <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => window.open(`/admin/funil`, "_self")}
                      >
                        <ExternalLink className="h-4 w-4" /> Ver no Funil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredAgendas.length === 0 && (
              <div className="col-span-full py-20 text-center bg-card rounded-xl border-2 border-dashed border-border opacity-50">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhum agendamento encontrado.</p>
                <p className="text-sm">Tudo em dia por aqui!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="aniversarios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBirthdays.map((lead) => {
              const birthStr = lead.dados_cadastro?.NASCIMENTO || lead.dados_cadastro?.DATANASCIMENTO || lead.dados_cadastro?.DATA_NASCIMENTO || lead.dados_cadastro?.data_nascimento || lead.dados_cadastro?.nascimento || lead.dados_cadastro?.birth_date;
              const birthDate = parseBirthday(birthStr);
              const hoje = isBirthdayToday(birthStr);

              return (
                <Card key={`birth-${lead.id}`} className={`overflow-hidden border-t-4 ${hoje ? "border-t-amber-500 animate-pulse" : "border-t-blue-400"}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${hoje ? "bg-amber-100 text-amber-600 shadow-sm" : "bg-blue-50 text-blue-600"}`}>
                          <Gift className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">
                            {birthDate ? format(birthDate, "dd 'de' MMMM", { locale: ptBR }) : "--"}
                          </p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">
                            {hoje ? "🥳 É HOJE!" : "🎂 Aniversariantes"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase">
                        {hoje ? "Parabéns!" : "Próximo"}
                      </Badge>
                    </div>

                    <div className="space-y-1 mb-4">
                      <h3 className="font-bold text-lg truncate leading-tight">{formatToUpper(lead.nome)}</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        {birthDate ? `${new Date().getFullYear() - birthDate.getFullYear()} anos` : ""}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className={`flex-1 gap-2 ${hoje ? "bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20" : ""}`}
                        onClick={() => openWhatsApp(lead, true)}
                      >
                        <WhatsAppIcon className="h-4 w-4" /> Enviar Parabéns
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredBirthdays.length === 0 && (
              <div className="col-span-full py-20 text-center bg-card rounded-xl border-2 border-dashed border-border opacity-50">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhum aniversariante este mês.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
