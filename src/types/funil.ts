export interface Lead {
  id: string;
  nome: string;
  celular: string;
  cidade: string;
  tipo_consorcio: string;
  valor_credito: number | null;
  prazo_meses: number;
  status: string | null;
  created_at: string | null;
  lead_score_valor: string | null;
  lead_temperatura: string | null;
  origem: string | null;
  status_updated_at: string | null;
  last_interaction_at: string | null;
  propensity_score: number | null;
  propensity_reason: string | null;
  score_final?: string | null;
  qualidade?: string | null;
  urgencia?: string | null;
  temperatura?: string | null;
  indicador_nome?: string | null;
  indicador_celular?: string | null;
  data_vencimento?: string | null;
  organizacao_id: string | null;
  responsavel_id?: string | null;
  administradora?: string | null;
  grupo?: string | null;
  cota?: string | null;
  data_adesao?: string | null;
  gcal_event_id?: string | null;
  dados_cadastro?: any;
}

export interface HistoricoContato {
  id: string;
  lead_id: string | null;
  tipo: string | null;
  observacao: string | null;
  resultado: string | null;
  created_at: string | null;
  organizacao_id?: string | null;
}

export interface Membro {
  id: string;
  nome_completo: string;
}
