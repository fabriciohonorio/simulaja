import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
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

  const getNestedValue = (keys: string[]) => {
    if (!form.dados_cadastro) return "";
    for (const k of keys) {
      if (form.dados_cadastro[k]) return form.dados_cadastro[k];
      if (form.dados_cadastro[k.toLowerCase()]) return form.dados_cadastro[k.toLowerCase()];
    }
    return "";
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
    };
    
    onSubmit(formattedData);
  };

  const isVendaFechada = STATUS_FECHADOS.includes(form.status);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="font-bold">Nome Completo</Label>
            <Input id="nome" required value={form.nome} onChange={handleChange} placeholder="Ex: João Silva" className="rounded-xl h-11" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="celular" className="font-bold">Celular</Label>
              <Input id="celular" required value={form.celular} onChange={handleChange} placeholder="Ex: (11) 99999-9999" className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold">E-mail</Label>
              <Input id="email" type="email" value={form.email} onChange={handleChange} placeholder="Ex: joao@email.com" className="rounded-xl h-11" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade" className="font-bold">Cidade</Label>
              <Input id="cidade" value={form.cidade} onChange={handleChange} placeholder="Ex: São Paulo" className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_consorcio" className="font-bold">Tipo Consórcio</Label>
              <Select value={form.tipo_consorcio} onValueChange={(val) => handleSelectChange("tipo_consorcio", val)}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
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
              <Label htmlFor="valor_credito" className="font-bold">Valor Crédito</Label>
              <Input id="valor_credito" type="number" value={form.valor_credito} onChange={handleChange} placeholder="Ex: 150000" className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prazo_meses" className="font-bold">Prazo (meses)</Label>
              <Input id="prazo_meses" type="number" value={form.prazo_meses} onChange={handleChange} placeholder="Ex: 120" className="rounded-xl h-11" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold">Status</Label>
              <Select value={form.status} onValueChange={(val) => handleSelectChange("status", val)}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Temperatura</Label>
              <Select value={form.lead_temperatura} onValueChange={(val) => handleSelectChange("lead_temperatura", val)}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPERATURA_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold">Score</Label>
              <Select value={form.lead_score_valor} onValueChange={(val) => handleSelectChange("lead_score_valor", val)}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCORE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Administradora</Label>
              <Select value={form.administradora} onValueChange={(val) => handleSelectChange("administradora", val)}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {ADMINISTRADORAS.map(admin => (
                    <SelectItem key={admin} value={admin}>{admin}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Venda Fechada Panel */}
          {isVendaFechada && (
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-4">
               <h4 className="text-[10px] uppercase font-black text-emerald-600 tracking-widest">💰 Detalhes da Venda</h4>
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="grupo" className="text-[10px] font-bold">Grupo</Label>
                  <Input id="grupo" value={form.grupo || ""} onChange={handleChange} className="rounded-lg h-9 bg-white" placeholder="0000" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cota" className="text-[10px] font-bold">Cota</Label>
                  <Input id="cota" value={form.cota || ""} onChange={handleChange} className="rounded-lg h-9 bg-white" placeholder="000" />
                </div>
               </div>
               <div className="space-y-1">
                  <Label htmlFor="status_updated_at" className="text-[10px] font-bold">Data do Fechamento</Label>
                  <Input id="status_updated_at" type="date" value={form.status_updated_at ? form.status_updated_at.split('T')[0] : ""} onChange={handleChange} className="rounded-lg h-9 bg-white" />
               </div>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
             <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">🤝 Indicador</h4>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="indicador_nome" className="text-[10px] font-bold">Nome</Label>
                  <Input id="indicador_nome" value={form.indicador_nome || ""} onChange={handleChange} className="rounded-lg h-9 bg-white" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="indicador_celular" className="text-[10px] font-bold">Celular</Label>
                  <Input id="indicador_celular" value={form.indicador_celular || ""} onChange={handleChange} className="rounded-lg h-9 bg-white" />
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200 shadow-inner">
        <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          FICHA MAGALU - CAMPOS ADICIONAIS
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sessão 1: Pessoal */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-primary uppercase tracking-widest border-b pb-1">👤 Pessoal & Filiação</h5>
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400">Nome da Mãe</Label>
                <Input 
                  value={getNestedValue(["MAE_NOME", "NOMEMAE", "NOME_MAE"])}
                  onChange={(e) => handleNestedChange("MAE_NOME", e.target.value)}
                  className="bg-white rounded-lg h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400">CPF / CNPJ</Label>
                  <Input 
                    value={getNestedValue(["CPF", "CNPJ", "CPFCNPJ", "DOCUMENTO_PRINCIPAL"])}
                    onChange={(e) => handleNestedChange("CPF", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                   <Label className="text-[10px] uppercase text-slate-400">Nº Documento (RG/CNH)</Label>
                   <Input 
                    value={getNestedValue(["RG", "CNH", "DOCUMENTO_NUMERO", "NUMERO_DOCUMENTO"])}
                    onChange={(e) => handleNestedChange("RG", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400">Emissão / Órgão</Label>
                  <Input 
                    value={getNestedValue(["DATA_EMISSAO", "EMISSAO"])}
                    onChange={(e) => handleNestedChange("DATA_EMISSAO", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                   <Label className="text-[10px] uppercase text-slate-400">Naturalidade (Cidade/UF)</Label>
                   <Input 
                    value={getNestedValue(["NATURALIDADE", "CIDADE_NATAL"])}
                    onChange={(e) => handleNestedChange("NATURALIDADE", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400">Nome do Pai</Label>
                <Input 
                  value={getNestedValue(["PAI_NOME", "NOMEPAI", "NOME_PAI"])}
                  onChange={(e) => handleNestedChange("PAI_NOME", e.target.value)}
                  className="bg-white rounded-lg h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400">Nascimento</Label>
                  <Input 
                    value={getNestedValue(["NASCIMENTO", "DATANASCIMENTO", "DATA_NASCIMENTO"])}
                    onChange={(e) => handleNestedChange("NASCIMENTO", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400">Sexo</Label>
                  <Input 
                    value={getNestedValue(["SEXO"])}
                    onChange={(e) => handleNestedChange("SEXO", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400">Estado Civil</Label>
                <Input 
                  value={getNestedValue(["ESTADO_CIVIL", "ESTADOCIVIL"])}
                  onChange={(e) => handleNestedChange("ESTADO_CIVIL", e.target.value)}
                  className="bg-white rounded-lg h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Sessão 2: Profissional */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-primary uppercase tracking-widest border-b pb-1">🏢 Profissional & Renda</h5>
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400">Empresa / Local Trabalho</Label>
                <Input 
                  value={getNestedValue(["EMPRESA", "LOCAL_TRABALHO"])}
                  onChange={(e) => handleNestedChange("EMPRESA", e.target.value)}
                  className="bg-white rounded-lg h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400">Profissão / Cargo</Label>
                <Input 
                  value={getNestedValue(["PROFISSAO", "CARGO", "OCUPACAO"])}
                  onChange={(e) => handleNestedChange("PROFISSAO", e.target.value)}
                  className="bg-white rounded-lg h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400">Renda Mensal</Label>
                  <Input 
                    value={getNestedValue(["RENDA", "RENDA_MENSAL"])}
                    onChange={(e) => handleNestedChange("RENDA", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400">Admissão</Label>
                  <Input 
                    value={getNestedValue(["ADMISSAO", "DATA_ADMISSAO"])}
                    onChange={(e) => handleNestedChange("ADMISSAO", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400">Residência</Label>
                  <Input 
                    value={getNestedValue(["TIPO_RESIDENCIA", "TIPORESIDENCIA"])}
                    onChange={(e) => handleNestedChange("TIPO_RESIDENCIA", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400">Tempo Res.</Label>
                  <Input 
                    value={getNestedValue(["TEMPO_RESIDENCIA", "TEMPORESIDENCIA"])}
                    onChange={(e) => handleNestedChange("TEMPO_RESIDENCIA", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sessão 3: Localização */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-primary uppercase tracking-widest border-b pb-1">📍 Endereço Atendimento</h5>
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <Label className="text-[10px] uppercase text-slate-400">CEP</Label>
                  <Input 
                    value={getNestedValue(["CEP"])}
                    onChange={(e) => handleNestedChange("CEP", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-[10px] uppercase text-slate-400">Logradouro / Bairro</Label>
                  <Input 
                    value={`${getNestedValue(["LOGRADOURO", "RUA"])} - ${getNestedValue(["BAIRRO"])}`.replace(/^- |-$/g, "")}
                    readOnly
                    className="bg-slate-100 rounded-lg h-9 text-[10px] text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400">Logradouro / Complemento</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input 
                    value={getNestedValue(["LOGRADOURO", "RUA", "ENDERECO"])}
                    onChange={(e) => handleNestedChange("LOGRADOURO", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs col-span-2"
                  />
                  <Input 
                    placeholder="Compl."
                    value={getNestedValue(["COMPLEMENTO", "CPL"])}
                    onChange={(e) => handleNestedChange("COMPLEMENTO", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400">Cidade</Label>
                  <Input 
                    value={getNestedValue(["CIDADE", "MUNICIPIO"])}
                    onChange={(e) => handleNestedChange("CIDADE", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400">UF / Estado</Label>
                  <Input 
                    value={getNestedValue(["UF", "ESTADO"])}
                    onChange={(e) => handleNestedChange("UF", e.target.value)}
                    className="bg-white rounded-lg h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl px-10 h-11 uppercase font-black text-xs tracking-widest">Descartar</Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-xl px-12 h-11 bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
          {isSubmitting ? "Gravando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
};
