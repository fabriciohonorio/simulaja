export interface Organizacao {
  id: string;
  nome: string;
  slug: string;
  logo_url?: string;
  plano: 'free' | 'starter' | 'pro' | 'enterprise';
  max_usuarios: number;
  max_leads: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Perfil {
  id: string;
  organizacao_id?: string;
  nome_completo?: string;
  avatar_url?: string;
  cargo?: string;
  telefone?: string;
  tipo_acesso: 'total' | 'parcial';
  ativo: boolean;
  created_at: string;
  updated_at: string;
  organizacao?: Organizacao;
}

export interface Modulo {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  ordem: number;
  ativo: boolean;
}

export interface Permissao {
  id: string;
  modulo_id: string;
  acao: string;
  descricao?: string;
  modulo?: Modulo;
}

export interface UsuarioPermissao {
  id: string;
  perfil_id: string;
  permissao_id: string;
  concedida: boolean;
  permissao?: Permissao;
}

export interface ConviteUsuario {
  email: string;
  nome_completo: string;
  cargo?: string;
  tipo_acesso: 'total' | 'parcial';
  permissoes_ids?: string[];
}
