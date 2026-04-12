import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Bell } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";  // ADDED
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { formatCurrency } from "@/lib/utils";
import { HistoricoModal } from "./HistoricoModal";
import { ADMINISTRADORAS } from "@/hooks/useFunil";

export function FunilModals({ state }: { state: any }) {
  const {
    historicoLead,
    handleCloseHistorico,
    leads,
    vencimentoLead,
    setVencimentoLead,
    selectedDate,
    setSelectedDate,
    horaAgendamento,
    setHoraAgendamento,
    notaAgendamento,
    setNotaAgendamento,
    criarNoGcal,
    setCriarNoGcal,
    handleSaveVencimento,
    celebrationLead,
    setCelebrationLead,
    grupo,
    setGrupo,
    cota,
    setCota,
    administradora,
    setAdministradora,
    saving,
    handleSaveCelebration,
  } = state;

  return (
    <>
      <HistoricoModal lead={historicoLead} onClose={handleCloseHistorico} allLeads={leads} />

      <Dialog open={!!vencimentoLead} onOpenChange={(open: boolean) => !open && setVencimentoLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-amber-500" /> Agendar Próxima Ação
            </DialogTitle>
            <DialogDescription>
              Agende o próximo contato, reunião ou vencimento para{" "}
              <span className="font-bold">{vencimentoLead?.nome}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-md border"
            />
            {selectedDate && (
              <div className="w-full space-y-4 px-2">
                <p className="text-sm text-muted-foreground text-center">
                  Data selecionada:{" "}
                  <span className="font-bold text-foreground">{format(selectedDate, "dd/MM/yyyy")}</span>
                </p>
                <div className="space-y-2">
                  <Label>Horário do Agendamento</Label>
                  <Input type="time" value={horaAgendamento} onChange={(e) => setHoraAgendamento(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nota / Assunto do Lembrete</Label>
                  <Textarea placeholder="Ex: Ligar pra fechar" value={notaAgendamento} onChange={(e) => setNotaAgendamento(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="gcal" checked={criarNoGcal} onChange={(e) => setCriarNoGcal(e.target.checked)} className="rounded border-gray-300 text-primary" />
                  <Label htmlFor="gcal" className="cursor-pointer text-sm">Criar evento no Google Calendar</Label>
                </div>
              </div>
            )}
            <div className="flex gap-2 w-full">
              <Button className="flex-1" onClick={handleSaveVencimento} disabled={!selectedDate}>
                <Bell className="h-4 w-4 mr-2" /> Agendar
              </Button>
              <Button variant="ghost" onClick={() => setVencimentoLead(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!celebrationLead} onOpenChange={(open: boolean) => !open && setCelebrationLead(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              🎉 PARABÉNS! MAIS UMA FANTÁSTICA VENDA!
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              <span className="font-bold text-foreground">{celebrationLead?.nome}</span>
              <br />
              <span className="text-xl font-bold text-primary">
                {celebrationLead && formatCurrency(Number(celebrationLead.valor_credito))}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grupo">Grupo</Label>
                <Input id="grupo" value={grupo} onChange={(e: any) => setGrupo(e.target.value)} placeholder="Ex: 1234" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cota">Cota</Label>
                <Input id="cota" value={cota} onChange={(e: any) => setCota(e.target.value)} placeholder="Ex: 56" />
              </div>
            </div>
            
            <div className="space-y-2 text-left">
              <Label>Administradora</Label>
              <Select 
                value={administradora || celebrationLead?.administradora || ""} 
                onValueChange={setAdministradora}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Administradora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {ADMINISTRADORAS.map(admin => (
                    <SelectItem key={admin} value={admin}>{admin}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleSaveCelebration} disabled={saving}>
                {saving ? "Salvando..." : "🎉 Salvar e Celebrar!"}
              </Button>
              <Button variant="ghost" onClick={() => setCelebrationLead(null)}>
                Preencher depois
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
