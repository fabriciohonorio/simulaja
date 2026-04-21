import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Bell, RefreshCw, ClipboardList } from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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

import { LeadForm } from "@/components/admin/LeadForm";

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
    editingLead,
    setEditingLead,
    savingLead,
    handleSaveLead,
    viewingFichaLead,
    setViewingFichaLead,
  } = state;

  return (
    <>
      <HistoricoModal lead={historicoLead} onClose={handleCloseHistorico} allLeads={leads} />

      <Dialog open={!!editingLead} onOpenChange={(open: boolean) => !open && setEditingLead(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border-none shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">Editar Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <LeadForm 
              initialData={{
                nome: editingLead.nome || "",
                email: editingLead.email || "",
                celular: editingLead.celular || "",
                cidade: editingLead.cidade || "",
                tipo_consorcio: editingLead.tipo_consorcio || "imovel",
                valor_credito: String(editingLead.valor_credito || ""),
                prazo_meses: String(editingLead.prazo_meses || ""),
                status: editingLead.status || "novo_lead",
                lead_temperatura: editingLead.lead_temperatura || "morno",
                lead_score_valor: editingLead.lead_score_valor || "medio",
                administradora: editingLead.administradora || "none",
                indicador_nome: editingLead.indicador_nome || "",
                indicador_celular: editingLead.indicador_celular || "",
                grupo: editingLead.grupo || "",
                cota: editingLead.cota || "",
                status_updated_at: editingLead.status_updated_at || "",
                dados_cadastro: editingLead.dados_cadastro || null,
              }}
              onSubmit={handleSaveLead}
              onCancel={() => setEditingLead(null)}
              isSubmitting={savingLead}
            />
          )}
        </DialogContent>
      </Dialog>

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

      <Dialog open={!!viewingFichaLead} onOpenChange={(open) => !open && setViewingFichaLead(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border-none shadow-2xl p-0">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <ClipboardList className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black">{viewingFichaLead?.nome}</DialogTitle>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Ficha de Cadastro Completa</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID do Lead</p>
                  <p className="text-xs font-mono text-slate-300">#{viewingFichaLead?.id?.substring(0, 8)}</p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-8">
            {!viewingFichaLead?.dados_cadastro ? (
              <div className="py-20 text-center">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <RefreshCw className="h-10 w-10 text-slate-200 animate-spin-slow" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Aguardando Dados</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Este lead ainda não preencheu os campos adicionais da ficha de cadastro.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">💰 Consórcio</h4>
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Crédito Estimado</p>
                        <p className="text-lg font-black text-slate-900">{formatCurrency(Number(viewingFichaLead.valor_credito || (viewingFichaLead.dados_cadastro as any).VALOR || (viewingFichaLead.dados_cadastro as any).VALOR_CREDITO) || 0)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Prazo Meses</p>
                          <p className="text-sm font-bold">{viewingFichaLead.prazo_meses || (viewingFichaLead.dados_cadastro as any).PRAZO || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Segmento</p>
                          <p className="text-sm font-bold uppercase">{viewingFichaLead.tipo_consorcio || (viewingFichaLead.dados_cadastro as any).SEGMENTO || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">👤 Dados Pessoais</h4>
                    <div className="space-y-3">
                       {[
                        { label: "CPF/CNPJ", keys: ["CPF", "CNPJ", "CPFCNPJ", "DOCUMENTO_PRINCIPAL"] },
                        { label: "Documento", keys: ["RG", "CNH", "DOCUMENTO_NUMERO", "NUMERO_DOCUMENTO"] },
                        { label: "Tipo Doc", keys: ["TIPO_DOCUMENTO", "DOC_TIPO", "TIPO_DOC"] },
                        { label: "Emissão", keys: ["DATA_EMISSAO", "EMISSAO", "DATAEMISSAO"] },
                        { label: "Órgão/UF", keys: ["ORGAO_EMISSOR", "ORGAO_UF", "EMISSOR", "ORGAO_EMISSOR_UF"] },
                        { label: "Nascimento", keys: ["NASCIMENTO", "DATANASCIMENTO", "DATA_NASCIMENTO"] },
                        { label: "Sexo", keys: ["SEXO"] },
                        { label: "Est. Civil", keys: ["ESTADO_CIVIL", "ESTADOCIVIL", "ESTADO_CIVIL_"] },
                        { label: "Nacionalidade", keys: ["NACIONALIDADE"] },
                        { label: "Naturalidade", keys: ["NATURALIDADE", "CIDADE_NATAL", "NATURALIDADE_UF"] },
                        { label: "Profissão", keys: ["PROFISSAO", "CARGO", "OCUPACAO"] },
                        { label: "Renda Mensal", keys: ["RENDA", "RENDA_MENSAL"] },
                      ].map((f) => (
                        <div key={f.label} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{f.label}</span>
                          <span className="text-xs font-black text-slate-900">
                            {f.keys.map(k => (viewingFichaLead.dados_cadastro as any)[k] || (viewingFichaLead.dados_cadastro as any)[k.toLowerCase()]).find(v => !!v) || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">👨‍👩‍👦 Filiação & Resp.</h4>
                    <div className="space-y-3">
                       {[
                        { label: "Nome da Mãe", keys: ["NOMEMAE", "MAE_NOME", "NOME_MAE"] },
                        { label: "Nome do Pai", keys: ["NOMEPAI", "PAI_NOME", "NOME_PAI"] },
                        { label: "Resp. Nome", keys: ["MAE_PAI_NOME", "CPFCONJUGE"] },
                        { label: "Resp. CPF", keys: ["MAE_PAI_CPF"] },
                        { label: "Resp. RG", keys: ["MAE_PAI_DOCUMENTO", "DOCUMENTO"] },
                      ].map((f) => (
                        <div key={f.label} className="flex flex-col py-1.5 border-b border-slate-50 last:border-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{f.label}</span>
                          <span className="text-xs font-black text-slate-900 mt-0.5">
                            {f.keys.map(k => (viewingFichaLead.dados_cadastro as any)[k] || (viewingFichaLead.dados_cadastro as any)[k.toLowerCase()]).find(v => !!v) || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">🏢 Profissional & Residência</h4>
                    <div className="space-y-3">
                      {[
                        { label: "Empresa", keys: ["EMPRESA", "LOCAL_TRABALHO"] },
                        { label: "Admissão", keys: ["ADMISSAO", "DATA_ADMISSAO"] },
                        { label: "Tipo Residência", keys: ["TIPO_RESIDENCIA", "TIPORESIDENCIA"] },
                        { label: "Tempo Res.", keys: ["TEMPO_RESIDENCIA", "TEMPORESIDENCIA"] },
                      ].map((f) => (
                        <div key={f.label} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{f.label}</span>
                          <span className="text-xs font-black text-slate-900">
                            {f.keys.map(k => (viewingFichaLead.dados_cadastro as any)[k] || (viewingFichaLead.dados_cadastro as any)[k.toLowerCase()]).find(v => !!v) || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">📱 Contato</h4>
                    <div className="space-y-4">
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-2">WhatsApp / Celular</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black text-emerald-800">{viewingFichaLead.celular || "—"}</p>
                          <WhatsAppIcon className="h-6 w-6 text-emerald-500" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">E-mail</span>
                          <span className="text-xs font-black text-slate-900 truncate">{viewingFichaLead.email || (viewingFichaLead.dados_cadastro as any).EMAIL || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 pb-2 border-b border-primary/10">📍 Localização</h4>
                    <div className="space-y-3">
                      {[
                        { label: "CEP", keys: ["CEP"] },
                        { label: "Endereço", keys: ["LOGRADOURO", "RUA", "ENDERECO", "LOGRADOURO_", "LOCALIDADE"] },
                        { label: "Complemento", keys: ["COMPLEMENTO", "CPL", "LOGRADOURO_COMPLEMENTO"] },
                        { label: "Bairro", keys: ["BAIRRO"] },
                        { label: "Cidade", keys: ["CIDADE", "MUNICIPIO", "NOME_CIDADE"] },
                        { label: "Estado", keys: ["UF", "ESTADO"] },
                      ].map((f) => (
                        <div key={f.label} className="flex flex-col py-1 border-b border-slate-50 last:border-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{f.label}</span>
                          <span className="text-xs font-black text-slate-900 mt-0.5">
                            {f.keys.map(k => (viewingFichaLead.dados_cadastro as any)[k] || (viewingFichaLead.dados_cadastro as any)[k.toLowerCase()]).find(v => !!v) || (f.label === "Cidade" ? viewingFichaLead.cidade : "—")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => { const l = viewingFichaLead; setViewingFichaLead(null); setEditingLead(l); }} className="rounded-xl px-6 font-black uppercase text-[10px] tracking-widest border-primary text-primary hover:bg-primary/5">Editar Ficha</Button>
            <Button onClick={() => setViewingFichaLead(null)} className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">Fechar Ficha</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
