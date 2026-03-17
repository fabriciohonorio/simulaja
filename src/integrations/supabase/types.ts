export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      carteira: {
        Row: {
          boleto_url: string | null
          cota: string | null
          cota_contemplada: string | null
          created_at: string
          data_contemplacao: string | null
          grupo: string | null
          id: string
          lead_id: string | null
          nome: string
          status: string
          tipo_consorcio: string | null
          updated_at: string
          valor_credito: number | null
          organizacao_id: string | null
        }
        Insert: {
          boleto_url?: string | null
          cota?: string | null
          cota_contemplada?: string | null
          created_at?: string
          data_contemplacao?: string | null
          grupo?: string | null
          id?: string
          lead_id?: string | null
          nome: string
          status?: string
          tipo_consorcio?: string | null
          updated_at?: string
          valor_credito?: number | null
          organizacao_id?: string | null
        }
        Update: {
          boleto_url?: string | null
          cota?: string | null
          cota_contemplada?: string | null
          created_at?: string
          data_contemplacao?: string | null
          grupo?: string | null
          id?: string
          lead_id?: string | null
          nome?: string
          status?: string
          tipo_consorcio?: string | null
          updated_at?: string
          valor_credito?: number | null
          organizacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carteira_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteira_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          }
        ]
      }
      historico_contatos: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          observacao: string | null
          resultado: string | null
          tipo: string | null
          organizacao_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          observacao?: string | null
          resultado?: string | null
          tipo?: string | null
          organizacao_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          observacao?: string | null
          resultado?: string | null
          tipo?: string | null
          organizacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_contatos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_contatos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          }
        ]
      }
      inadimplentes: {
        Row: {
          administradora: string | null
          celular: string | null
          cota: string | null
          created_at: string
          grupo: string | null
          id: string
          nome: string
          parcelas_atrasadas: number | null
          parcelas_pagas: number | null
          status: string
          tipo_consorcio: string | null
          updated_at: string
          valor_parcela: number | null
          organizacao_id: string | null
        }
        Insert: {
          administradora?: string | null
          celular?: string | null
          cota?: string | null
          created_at?: string
          grupo?: string | null
          id?: string
          nome: string
          parcelas_atrasadas?: number | null
          parcelas_pagas?: number | null
          status?: string
          tipo_consorcio?: string | null
          updated_at?: string
          valor_parcela?: number | null
          organizacao_id?: string | null
        }
        Update: {
          administradora?: string | null
          celular?: string | null
          cota?: string | null
          created_at?: string
          grupo?: string | null
          id?: string
          nome?: string
          parcelas_atrasadas?: number | null
          parcelas_pagas?: number | null
          status?: string
          tipo_consorcio?: string | null
          updated_at?: string
          valor_parcela?: number | null
          organizacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inadimplentes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          }
        ]
      }
      interacoes: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          lead_id: string | null
          tipo: string
          organizacao_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          lead_id?: string | null
          tipo: string
          organizacao_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          lead_id?: string | null
          tipo?: string
          organizacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          celular: string | null
          cidade: string | null
          created_at: string | null
          data_vencimento: string | null
          email: string | null
          id: string
          indicador_celular: string | null
          indicador_nome: string | null
          lead_score_valor: string | null
          lead_temperatura: string | null
          nome: string
          prazo_meses: number | null
          status: string | null
          tipo_consorcio: string | null
          ultimo_contato: string | null
          updated_at: string | null
          valor_credito: number | null
          organizacao_id: string | null
          origem: string | null
          status_updated_at: string | null
          last_interaction_at: string | null
          propensity_score: number | null
          propensity_reason: string | null
        }
        Insert: {
          celular?: string | null
          cidade?: string | null
          created_at?: string | null
          data_vencimento?: string | null
          email?: string | null
          id?: string
          indicador_celular?: string | null
          indicador_nome?: string | null
          lead_score_valor?: string | null
          lead_temperatura?: string | null
          nome: string
          prazo_meses?: number | null
          status?: string | null
          tipo_consorcio?: string | null
          ultimo_contato?: string | null
          updated_at?: string | null
          valor_credito?: number | null
          organizacao_id?: string | null
          origem?: string | null
          status_updated_at?: string | null
          last_interaction_at?: string | null
          propensity_score?: number | null
          propensity_reason?: string | null
        }
        Update: {
          celular?: string | null
          cidade?: string | null
          created_at?: string | null
          data_vencimento?: string | null
          email?: string | null
          id?: string
          indicador_celular?: string | null
          indicador_nome?: string | null
          lead_score_valor?: string | null
          lead_temperatura?: string | null
          nome?: string
          prazo_meses?: number | null
          status?: string | null
          tipo_consorcio?: string | null
          ultimo_contato?: string | null
          updated_at?: string | null
          valor_credito?: number | null
          organizacao_id?: string | null
          origem?: string | null
          status_updated_at?: string | null
          last_interaction_at?: string | null
          propensity_score?: number | null
          propensity_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          }
        ]
      }
      mercado_termometro: {
        Row: {
          created_at: string | null
          id: number
          percentual: number
          segmento: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          percentual?: number
          segmento: string
        }
        Update: {
          created_at?: string | null
          id?: never
          percentual?: number
          segmento?: string
        }
        Relationships: []
      }
      meta: {
        Row: {
          ano: number | null
          created_at: string
          id: number
          meta_anual: number | null
          meta_imoveis: number | null
          meta_investimentos: number | null
          meta_motos: number | null
          meta_outros: number | null
          meta_pesados: number | null
          meta_veiculos: number | null
          ticket_medio_imoveis: number | null
          ticket_medio_investimentos: number | null
          ticket_medio_motos: number | null
          ticket_medio_pesados: number | null
          ticket_medio_veiculos: number | null
          organizacao_id: string | null
        }
        Insert: {
          ano?: number | null
          created_at?: string
          id?: number
          meta_anual?: number | null
          meta_imoveis?: number | null
          meta_investimentos?: number | null
          meta_motos?: number | null
          meta_outros?: number | null
          meta_pesados?: number | null
          meta_veiculos?: number | null
          ticket_medio_imoveis?: number | null
          ticket_medio_investimentos?: number | null
          ticket_medio_motos?: number | null
          ticket_medio_pesados?: number | null
          ticket_medio_veiculos?: number | null
          organizacao_id?: string | null
        }
        Update: {
          ano?: number | null
          created_at?: string
          id?: number
          meta_anual?: number | null
          meta_imoveis?: number | null
          meta_investimentos?: number | null
          meta_motos?: number | null
          meta_outros?: number | null
          meta_pesados?: number | null
          meta_veiculos?: number | null
          ticket_medio_imoveis?: number | null
          ticket_medio_investimentos?: number | null
          ticket_medio_motos?: number | null
          ticket_medio_pesados?: number | null
          ticket_medio_veiculos?: number | null
          organizacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          }
        ]
      }
      Prompts: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      propostas: {
        Row: {
          created_at: string | null
          fundo_reserva: number
          id: string
          lead_id: string | null
          pdf_url: string | null
          prazo_meses: number
          status: string | null
          taxa_administrativa: number
          valor_credito: number
          valor_parcela: number
          valor_total: number
          organizacao_id: string | null
        }
        Insert: {
          created_at?: string | null
          fundo_reserva: number
          id?: string
          lead_id?: string | null
          pdf_url?: string | null
          prazo_meses: number
          status?: string | null
          taxa_administrativa: number
          valor_credito: number
          valor_parcela: number
          valor_total: number
          organizacao_id?: string | null
        }
        Update: {
          created_at?: string | null
          fundo_reserva?: number
          id?: string
          lead_id?: string | null
          pdf_url?: string | null
          prazo_meses?: number
          status?: string | null
          taxa_administrativa?: number
          valor_credito?: number
          valor_parcela?: number
          valor_total?: number
          organizacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          id: string
          nome: string
          role: string | null
          senha_hash: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          nome: string
          role?: string | null
          senha_hash: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          role?: string | null
          senha_hash?: string
        }
        Relationships: []
      }
      organizacoes: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          logo_url: string | null
          max_leads: number
          max_usuarios: number
          nome: string
          plano: "free" | "starter" | "pro" | "enterprise"
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          max_leads?: number
          max_usuarios?: number
          nome: string
          plano: "free" | "starter" | "pro" | "enterprise"
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          max_leads?: number
          max_usuarios?: number
          nome?: string
          plano?: "free" | "starter" | "pro" | "enterprise"
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          cargo: string | null
          created_at: string
          id: string
          nome_completo: string | null
          organizacao_id: string | null
          telefone: string | null
          tipo_acesso: "total" | "parcial"
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          id: string
          nome_completo?: string | null
          organizacao_id?: string | null
          telefone?: string | null
          tipo_acesso: "total" | "parcial"
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome_completo?: string | null
          organizacao_id?: string | null
          telefone?: string | null
          tipo_acesso?: "total" | "parcial"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfis_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          }
        ]
      }
      modulos: {
        Row: {
          ativo: boolean
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          ativo?: boolean
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          ativo?: boolean
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      permissoes: {
        Row: {
          acao: string
          descricao: string | null
          id: string
          modulo_id: string
        }
        Insert: {
          acao: string
          descricao?: string | null
          id?: string
          modulo_id: string
        }
        Update: {
          acao?: string
          descricao?: string | null
          id?: string
          modulo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          }
        ]
      }
      usuario_permissoes: {
        Row: {
          concedida: boolean
          id: string
          perfil_id: string
          permissao_id: string
        }
        Insert: {
          concedida?: boolean
          id?: string
          perfil_id: string
          permissao_id: string
        }
        Update: {
          concedida?: boolean
          id?: string
          perfil_id?: string
          permissao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_permissoes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_permissoes_permissao_id_fkey"
            columns: ["permissao_id"]
            isOneToOne: false
            referencedRelation: "permissoes"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendedor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "vendedor"],
    },
  },
} as const
