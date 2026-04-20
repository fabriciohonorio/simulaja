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
  dados_cadastro?: any;
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

  const handleNestedChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      dados_cadastro: {
        ...(prev.dados_cadastro || {}),
        [field]: value
      }
    }));
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

      {/* ━━━ DADOS COMPLETO (MAGALU) ━━━ */}
      <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h4 className="text-sm font-black text-slate-700 flex items-center gap-2">
          📋 Ficha de Cadastro Completa (Magalu)
        </h4>
        
        <div className="space-y-4">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-1">DADOS MÃE / PAI</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Nome Mãe/Pai</Label>
              <Input value={form.dados_cadastro?.MAE_PAI_NOME || form.dados_cadastro?.CPFCONJUGE || ""} onChange={(e) => handleNestedChange("MAE_PAI_NOME", e.target.value)} placeholder="Nome" className="bg-white text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">CPF</Label>
              <Input value={form.dados_cadastro?.MAE_PAI_CPF || form.dados_cadastro?.CPFCONJUGE || ""} onChange={(e) => handleNestedChange("MAE_PAI_CPF", e.target.value)} placeholder="000.000.000-00" className="bg-white text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Documento</Label>
              <Input value={form.dados_cadastro?.MAE_PAI_DOCUMENTO || form.dados_cadastro?.DOCUMENTO || ""} onChange={(e) => handleNestedChange("MAE_PAI_DOCUMENTO", e.target.value)} placeholder="RG" className="bg-white text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Emissão</Label>
              <Input value={form.dados_cadastro?.MAE_PAI_EMISSAO || form.dados_cadastro?.DATAEMISSAO || ""} onChange={(e) => handleNestedChange("MAE_PAI_EMISSAO", e.target.value)} placeholder="00/00/0000" className="bg-white text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Órgão Emissor</Label>
              <Input value={form.dados_cadastro?.MAE_PAI_ORGAO_EMISSOR || form.dados_cadastro?.ORGAO_EMISSOR || ""} onChange={(e) => handleNestedChange("MAE_PAI_ORGAO_EMISSOR", e.target.value)} placeholder="SSP" className="bg-white text-xs" />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-1">DADOS PESSOAIS</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Nascimento</Label>
              <Input value={form.dados_cadastro?.NASCIMENTO || form.dados_cadastro?.DATANASCIMENTO || ""} onChange={(e) => handleNestedChange("NASCIMENTO", e.target.value)} placeholder="00/00/0000" className="bg-white text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Sexo</Label>
              <Input value={form.dados_cadastro?.SEXO || ""} onChange={(e) => handleNestedChange("SEXO", e.target.value)} placeholder="M/F" className="bg-white text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Nacionalidade</Label>
              <Input value={form.dados_cadastro?.NACIONALIDADE || "Brasileira"} onChange={(e) => handleNestedChange("NACIONALIDADE", e.target.value)} placeholder="Nacionalidade" className="bg-white text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Estado Civil</Label>
              <Input value={form.dados_cadastro?.ESTADO_CIVIL || form.dados_cadastro?.ESTADOCIVIL || ""} onChange={(e) => handleNestedChange("ESTADOCIVIL", e.target.value)} placeholder="Casado..." className="bg-white text-xs" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase">Nome da Mãe</Label>
              <Input value={form.dados_cadastro?.NOMEMAE || form.dados_cadastro?.MAE_NOME || ""} onChange={(e) => handleNestedChange("NOMEMAE", e.target.value)} placeholder="Nome completo" className="bg-white text-xs" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase">Nome do Pai</Label>
              <Input value={form.dados_cadastro?.NOMEPAI || form.dados_cadastro?.PAI_NOME || ""} onChange={(e) => handleNestedChange("NOMEPAI", e.target.value)} placeholder="Nome completo" className="bg-white text-xs" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase">Profissão</Label>
              <Input value={form.dados_cadastro?.PROFISSAO || ""} onChange={(e) => handleNestedChange("PROFISSAO", e.target.value)} placeholder="Ex: Empresário" className="bg-white text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Renda</Label>
              <Input value={form.dados_cadastro?.RENDA || ""} onChange={(e) => handleNestedChange("RENDA", e.target.value)} placeholder="R$ 0.000" className="bg-white text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Admissão</Label>
              <Input value={form.dados_cadastro?.ADMISSAO || ""} onChange={(e) => handleNestedChange("ADMISSAO", e.target.value)} placeholder="00/00/0000" className="bg-white text-xs" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase">Empresa</Label>
              <Input value={form.dados_cadastro?.EMPRESA || ""} onChange={(e) => handleNestedChange("EMPRESA", e.target.value)} placeholder="Nome da empresa" className="bg-white text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Residência</Label>
              <Input value={form.dados_cadastro?.TIPO_RESIDENCIA || form.dados_cadastro?.TIPORESIDENCIA || ""} onChange={(e) => handleNestedChange("TIPO_RESIDENCIA", e.target.value)} placeholder="Própria..." className="bg-white text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Tempo Res.</Label>
              <Input value={form.dados_cadastro?.TEMPO_RESIDENCIA || form.dados_cadastro?.TEMPORESIDENCIA || ""} onChange={(e) => handleNestedChange("TEMPO_RESIDENCIA", e.target.value)} placeholder="Ex: 5 anos" className="bg-white text-xs" />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-1">ENDEREÇO</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1 col-span-3">
              <Label className="text-[10px] uppercase">Rua / Logradouro</Label>
              <Input value={form.dados_cadastro?.LOGRADOURO || form.dados_cadastro?.RUA || ""} onChange={(e) => handleNestedChange("LOGRADOURO", e.target.value)} placeholder="Rua..." className="bg-white text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">CEP</Label>
              <Input value={form.dados_cadastro?.CEP || ""} onChange={(e) => handleNestedChange("CEP", e.target.value)} placeholder="00000-000" className="bg-white text-xs" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase">Bairro</Label>
              <Input value={form.dados_cadastro?.BAIRRO || ""} onChange={(e) => handleNestedChange("BAIRRO", e.target.value)} placeholder="Bairro" className="bg-white text-xs" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase">Cidade / UF</Label>
              <Input value={`${form.dados_cadastro?.CIDADE || ""} ${form.dados_cadastro?.UF || ""}`.trim()} onChange={(e) => handleNestedChange("CIDADE", e.target.value)} placeholder="Cidade" className="bg-white text-xs" />
            </div>
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
