import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MessageCircle, Bell } from "lucide-react";
import { format, isSameDay, isToday, isBefore, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  nome: string;
  celular: string | null;
  status: string | null;
  valor_credito: number;
  data_vencimento: string | null;
}

interface DashboardCalendarProps {
  leads: Lead[];
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const openWhatsApp = (lead: Lead, isReminder: boolean) => {
  const phone = lead.celular?.replace(/\D/g, "") || "";
  const msg = isReminder
    ? encodeURIComponent(
        `Olá ${lead.nome}! Lembrando que o vencimento do seu consórcio é ${
          lead.data_vencimento ? format(parseISO(lead.data_vencimento), "dd/MM/yyyy") : "em breve"
        }. Qualquer dúvida estou à disposição!`,
      )
    : encodeURIComponent(`Olá ${lead.nome}! Vamos conversar sobre seu consórcio?`);
  window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
};

export default function DashboardCalendar({ leads }: DashboardCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const leadsComVencimento = useMemo(
    () => leads.filter((l) => l.data_vencimento && l.status === "aguardando_pagamento"),
    [leads],
  );

  const datesWithEvents = useMemo(() => {
    const map = new Map<string, number>();
    leadsComVencimento.forEach((l) => {
      const key = l.data_vencimento!;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [leadsComVencimento]);

  const leadsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return leadsComVencimento.filter((l) => isSameDay(parseISO(l.data_vencimento!), selectedDate));
  }, [selectedDate, leadsComVencimento]);

  const today = startOfDay(new Date());

  // Highlight days with events
  const modifiers = useMemo(() => {
    const eventDays = Array.from(datesWithEvents.keys()).map((d) => parseISO(d));
    const overdueDays = eventDays.filter((d) => isBefore(d, today) && !isToday(d));
    const todayEvents = eventDays.filter((d) => isToday(d));
    const futureDays = eventDays.filter((d) => !isBefore(d, today) && !isToday(d));
    return { overdue: overdueDays, dueToday: todayEvents, upcoming: futureDays };
  }, [datesWithEvents, today]);

  const modifiersStyles = {
    overdue: { backgroundColor: "hsl(0 84% 60%)", color: "white", borderRadius: "50%" },
    dueToday: {
      backgroundColor: "hsl(45 93% 47%)",
      color: "white",
      borderRadius: "50%",
      animation: "pulse 2s infinite",
    },
    upcoming: { backgroundColor: "hsl(var(--primary))", color: "white", borderRadius: "50%" },
  };

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" /> Agenda de Vencimentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          locale={ptBR}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md border mx-auto"
        />

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] sm:text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Atrasado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Hoje
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Futuro
          </span>
        </div>

        {/* Selected date leads */}
        {selectedDate && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} — {leadsOnSelectedDate.length} vencimento(s)
            </p>
            {leadsOnSelectedDate.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-2">
                Nenhum vencimento nesta data.
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {leadsOnSelectedDate.map((l) => {
                  const vencDate = parseISO(l.data_vencimento!);
                  const isOverdue = isBefore(vencDate, today) && !isToday(vencDate);
                  const isDueToday = isToday(vencDate);

                  return (
                    <div
                      key={l.id}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        isOverdue
                          ? "bg-red-50 border-red-200"
                          : isDueToday
                            ? "bg-amber-50 border-amber-200"
                            : "bg-card border-border"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
                          {(isOverdue || isDueToday) && (
                            <Bell className="h-3.5 w-3.5 text-red-500 animate-pulse shrink-0" />
                          )}
                          {l.nome}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatCurrency(Number(l.valor_credito))}
                        </p>
                      </div>
                      {l.celular && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:bg-green-50 shrink-0"
                          onClick={() => openWhatsApp(l, true)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
