import { Database } from '@/integrations/supabase/types';

export type LeadRow = Database['public']['Tables']['leads']['Row'];
export type ProfileRow = Database['public']['Tables']['perfis']['Row'];
export type OrganizationRow = Database['public']['Tables']['organizacoes']['Row'];
export type ComissaoRow = Database['public']['Tables']['comissoes']['Row'];
export type HistoricoContatoRow = Database['public']['Tables']['historico_contatos']['Row'];
export type CarteiraRow = Database['public']['Tables']['carteira']['Row'];
export type InadimplenteRow = Database['public']['Tables']['inadimplentes']['Row'];
export type AgendamentoRow = Database['public']['Tables']['agendamentos']['Row'];
export type MetaRow = Database['public']['Tables']['meta']['Row'];
export type ConviteRow = Database['public']['Tables']['convites']['Row'];

// Extended / specific types for application usage
export type TipoAcesso = "admin" | "manager" | "vendedor";

export interface Profile extends Omit<ProfileRow, 'tipo_acesso'> {
  tipo_acesso: TipoAcesso;
  email?: string | null;
}

export interface Lead extends Omit<LeadRow, 'dados_cadastro'> {
  dados_cadastro?: Record<string, any> | null;
  atendimento_ia?: boolean;
}
