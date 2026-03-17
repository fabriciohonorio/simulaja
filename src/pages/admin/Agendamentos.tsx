import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, MessageCircle, Phone, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Lead {
  id: string;
  nome: string;
  celular: string;
  valor_credito: number;
  data_vencimento: string | null;
  status: string | null;
  tipo_consorcio: string | null;
}

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgendamentos = async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, nome, celular, valor_credito, data_vencimento, status, tipo_consorcio")
        .not("data_vencimento", "is", null)
        .order("data_vencimento", { ascending: true });

      console.log("DEBUG: Agendamentos carregados (modo emergência):", data);
      if (!error && data) {
        setAgendamentos((data as any[]) as Lead[]);
      }
      setLoading(false);
    };

    fetchAgendamentos();
  }, []);

  const openWhatsApp = (lead: Lead) => {
    const msg = encodeURIComponent(`Olá ${lead.nome}! Seguimos com nosso agendamento para hoje?`);
    const phone = lead.celular.replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const agendadosHoje = agendamentos.filter(a => parseISO(a.data_vencimento!).toDateString() === hoje.toDateString());
  const atrasados = agendamentos.filter(a => parseISO(a.data_vencimento!) < hoje);
  const futuros = agendamentos.filter(a => parseISO(a.data_vencimento!) > hoje);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <CalendarDays className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agendamentos (Visão Global)</h1>
          <p className="text-sm text-muted-foreground font-medium">Todos os contatos agendados do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl bg-red-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Atrasados ({atrasados.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {atrasados.map(a => <AppointmentCard key={a.id} lead={a} type="atrasado" onWhatsApp={openWhatsApp} />)}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Hoje ({agendadosHoje.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agendadosHoje.map(a => <AppointmentCard key={a.id} lead={a} type="hoje" onWhatsApp={openWhatsApp} />)}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-slate-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Futuros ({futuros.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {futuros.map(a => <AppointmentCard key={a.id} lead={a} type="futuro" onWhatsApp={openWhatsApp} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AppointmentCard({ lead, type, onWhatsApp }: { lead: Lead, type: 'atrasado' | 'hoje' | 'futuro', onWhatsApp: (l: Lead) => void }) {
  const badgeColor = type === 'atrasado' ? 'bg-red-500' : type === 'hoje' ? 'bg-amber-500' : 'bg-slate-500';

  return (
    <div className={`p-4 bg-white rounded-2xl border-2 border-border shadow-sm space-y-3 transition-all hover:scale-[1.02]`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="font-black text-slate-800 tracking-tight leading-none">{lead.nome}</p>
          <p className="text-[10px] text-muted-foreground font-bold">{formatCurrency(lead.valor_credito)}</p>
        </div>
        <Badge className={`${badgeColor} text-white font-black text-[10px] uppercase h-5`}>
          {format(parseISO(lead.data_vencimento!), "dd/MM")}
        </Badge>
      </div>
      <Button onClick={() => onWhatsApp(lead)} className="w-full h-8 bg-green-500 hover:bg-green-600 text-white font-black text-xs uppercase gap-2">
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </Button>
    </div>
  );
}
