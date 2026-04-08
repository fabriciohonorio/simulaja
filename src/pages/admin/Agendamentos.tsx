import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, MessageCircle, Phone, Clock, AlertCircle, Search, MapPin, DollarSign, ExternalLink } from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Lead {
  id: string;
  nome: string;
  status: string | null;
  valor_credito: number;
  data_vencimento: string | null;
  celular: string | null;
  cidade: string | null;
  tipo_consorcio: string | null;
}

export default function Agendamentos() {
  const [agendas, setAgendas] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAgendas = async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .not("data_vencimento", "is", null)
        .not("status", "in", '("fechado","perdido","morto","aguardando_pagamento")')
        .order("data_vencimento", { ascending: true });
      
      setAgendas((data as any[]) ?? []);
      setLoading(false);
    };

    fetchAgendas();
  }, []);

  const excludedStatuses = ["fechado", "perdido", "morto", "aguardando_pagamento"];
  const filteredAgendas = agendas.filter(a => 
    !excludedStatuses.includes(a.status?.toLowerCase() || "") &&
    (a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.cidade && a.cidade.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const openWhatsApp = (lead: Lead) => {
    const phone = lead.celular ? lead.celular.replace(/\D/g, "") : "";
    window.open(`https://wa.me/55${phone}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agendamentos de Contato</h1>
          <p className="text-sm text-muted-foreground italic">Listagem de todos os leads com retorno agendado.</p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <h3 className="font-bold text-lg truncate leading-tight">{lead.nome}</h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lead.cidade || "N/Inf"}</span>
                    <span className="flex items-center gap-1 text-primary font-bold"><DollarSign className="h-3 w-3" /> {formatCurrency(Number(lead.valor_credito))}</span>
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
    </div>
  );
}
