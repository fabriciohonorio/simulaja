import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatToUpper, formatToFourDigits } from "@/lib/formatters";

export const STATUS_OPTIONS = [
  { value: "novo_lead", label: "Novo Lead" },
  { value: "novo", label: "Novo (Antigo)" },
  { value: "contatado", label: "Contatado" },
  { value: "proposta_enviada", label: "Proposta Enviada" },
  { value: "em_negociacao", label: "Em Negociação" },
  { value: "aguardando_pagamento", label: "Aguard. Pagamento" },
  { value: "venda_fechada", label: "✅ Venda Fechada" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "❌ Perdido" },
];

export const TIPO_OPTIONS = [
  { value: "imovel", label: "Imóvel" },
  { value: "veiculo", label: "Veículo" },
  { value: "moto", label: "Moto" },
  { value: "pesados", label: "Pesados" },
  { value: "agricolas", label: "Agrícolas" },
  { value: "investimento", label: "Investimento" },
];

export const TEMPERATURA_OPTIONS = [
  { value: "quente", label: "🔥 Quente" },
  { value: "morno", label: "🌤 Morno" },
  { value: "frio", label: "❄️ Frio" },
  { value: "morto", label: "☠️ Morto" },
];

export const SCORE_OPTIONS = [
  { value: "premium", label: "🔥 Premium" },
  { value: "alto", label: "🚀 Alto" },
  { value: "medio", label: "⚡ Médio" },
  { value: "baixo", label: "🧊 Baixo" },
];

const ADMINISTRADORAS = ["MAGALU", "ADEMICON", "SERVOPA"];

const STATUS_FECHADOS = ["venda_fechada", "fechado"];

export interface LeadFormData {
  nome: string;
  email: string;
  celular: string;
  cidade: string;
  tipo_consorcio: string;
  valor_credito: string;
  prazo_meses: string;
  status: string;
  lead_temperatura: string;
  lead_score_valor: string;
  administradora: string;
  indicador_nome?: string;
  indicador_celular?: string;
  // Campos de venda fechada
  grupo?: string;
  cota?: string;
  status_updated_at?: string;
}

interface LeadFormProps {
  initialData: LeadFormData;
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [form, setForm] = useState<LeadFormData>(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof LeadFormData, value: string) => {
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aplicar padrões de formatação solicitados pelo usuário
    const formattedData: LeadFormData = {
      ...form,
      nome: formatToUpper(form.nome),
      grupo: formatToFourDigits(form.grupo),
      cota: formatToFourDigits(form.cota),
      indicador_nome: formatToUpper(form.indicador_nome),
      cidade: formatToUpper(form.cidade),
    };
    
    onSubmit(formattedData);
  };

  const isVendaFechada = STATUS_FECHADOS.includes(form.status);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input id="nome" required value={form.nome} onChange={handleChange} placeholder="Ex: João Silva" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="celular">Celular</Label>
          <Input id="celular" required value={form.celular} onChange={handleChange} placeholder="Ex: (11) 99999-9999" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={form.email} onChange={handleChange} placeholder="Ex: joao@email.com" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input id="cidade" value={form.cidade} onChange={handleChange} placeholder="Ex: São Paulo" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo_consorcio">Tipo</Label>
          <Select value={form.tipo_consorcio} onValueChange={(val) => handleSelectChange("tipo_consorcio", val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPO_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor_credito">Valor Crédito (R$)</Label>
          <Input id="valor_credito" type="number" value={form.valor_credito} onChange={handleChange} placeholder="Ex: 150000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prazo_meses">Prazo (meses)</Label>
          <Input id="prazo_meses" type="number" value={form.prazo_meses} onChange={handleChange} placeholder="Ex: 120" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(val) => handleSelectChange("status", val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Temperatura</Label>
          <Select value={form.lead_temperatura} onValueChange={(val) => handleSelectChange("lead_temperatura", val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TEMPERATURA_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Score</Label>
          <Select value={form.lead_score_valor} onValueChange={(val) => handleSelectChange("lead_score_valor", val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCORE_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Administradora</Label>
        <Select value={form.administradora} onValueChange={(val) => handleSelectChange("administradora", val)}>
          <SelectTrigger><SelectValue placeholder="Selecione a Administradora" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            {ADMINISTRADORAS.map(admin => (
              <SelectItem key={admin} value={admin}>{admin}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campos extras para venda fechada */}
      {isVendaFechada && (
        <div className="space-y-4 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
          <h4 className="text-sm font-black text-emerald-700 flex items-center gap-2">
            ✅ Dados do Consórcio Adquirido
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grupo">Grupo</Label>
              <Input
                id="grupo"
                value={form.grupo || ""}
                onChange={handleChange}
                placeholder="Ex: 1703"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cota">Cota</Label>
              <Input
                id="cota"
                value={form.cota || ""}
                onChange={handleChange}
                placeholder="Ex: 045"
                className="bg-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status_updated_at">Data da Venda / Fechamento</Label>
            <Input
              id="status_updated_at"
              type="date"
              value={form.status_updated_at ? form.status_updated_at.split('T')[0] : ""}
              onChange={handleChange}
              className="bg-white"
            />
          </div>
        </div>
      )}

      <hr className="my-4 border-muted" />
      
      <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-dashed border-muted-foreground/20">
        <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
          🤝 Dados do Indicador
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="indicador_nome">Nome do Indicador</Label>
            <Input id="indicador_nome" value={form.indicador_nome || ""} onChange={handleChange} placeholder="Quem indicou?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="indicador_celular">Celular do Indicador</Label>
            <Input id="indicador_celular" value={form.indicador_celular || ""} onChange={handleChange} placeholder="Celular do indicador" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Lead"}</Button>
      </div>
    </form>
  );
};
