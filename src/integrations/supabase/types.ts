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
      agendamentos: {
        Row: {
          concluido_em: string | null
          created_at: string | null
          criado_por: string | null
          data_agendada: string
          descricao: string | null
          id: string
          lead_id: string | null
          observacoes: string | null
          status: string | null
          tipo: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_agendada: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          status?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          concluido_em?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_agendada?: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      carteira: {
        Row: {
          administradora: string | null
          boleto_url: string | null
          celular: string | null
          cota: string | null
          cota_contemplada: string | null
          created_at: string
          data_adesao: string | null
          data_contemplacao: string | null
          grupo: string | null
          id: string
          lead_id: string | null
          nome: string
          organizacao_id: string | null
          protocolo_lance_fixo: string | null
          status: string
          tipo_consorcio: string | null
          updated_at: string
          valor_credito: number | null
        }
        Insert: {
          administradora?: string | null
          boleto_url?: string | null
          celular?: string | null
          cota?: string | null
          cota_contemplada?: string | null
          created_at?: string
          data_adesao?: string | null
          data_contemplacao?: string | null
          grupo?: string | null
          id?: string
          lead_id?: string | null
          nome: string
          organizacao_id?: string | null
          protocolo_lance_fixo?: string | null
          status?: string
          tipo_consorcio?: string | null
          updated_at?: string
          valor_credito?: number | null
        }
        Update: {
          administradora?: string | null
          boleto_url?: string | null
          celular?: string | null
          cota?: string | null
          cota_contemplada?: string | null
          created_at?: string
          data_adesao?: string | null
          data_contemplacao?: string | null
          grupo?: string | null
          id?: string
          lead_id?: string | null
          nome?: string
          organizacao_id?: string | null
          protocolo_lance_fixo?: string | null
          status?: string
          tipo_consorcio?: string | null
          updated_at?: string
          valor_credito?: number | null
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
          },
        ]
      }
      comissoes: {
        Row: {
          administradora: string | null
          carteira_id: string | null
          cliente_nome: string
          comissao_total: number
          cota: string | null
          created_at: string
          data_venda: string
          grupo: string | null
          id: string
          lead_id: string | null
          meses_inadimplentes: number
          organizacao_id: string | null
          pagamentos_retroativos: number
          parcela_atual: number | null
          parcelas_comissao: number
          regra_comissao: string
          status: string
          taxa_comissao: number
          tipo_comissionamento: string
          updated_at: string
          usuario_id: string | null
          valor_estorno: number
          valor_venda: number
        }
        Insert: {
          administradora?: string | null
          carteira_id?: string | null
          cliente_nome: string
          comissao_total?: number
          cota?: string | null
          created_at?: string
          data_venda?: string
          grupo?: string | null
          id?: string
          lead_id?: string | null
          meses_inadimplentes?: number
          organizacao_id?: string | null
          pagamentos_retroativos?: number
          parcela_atual?: number | null
          parcelas_comissao?: number
          regra_comissao: string
          status?: string
          taxa_comissao: number
          tipo_comissionamento: string
          updated_at?: string
          usuario_id?: string | null
          valor_estorno?: number
          valor_venda?: number
        }
        Update: {
          administradora?: string | null
          carteira_id?: string | null
          cliente_nome?: string
          comissao_total?: number
          cota?: string | null
          created_at?: string
          data_venda?: string
          grupo?: string | null
          id?: string
          lead_id?: string | null
          meses_inadimplentes?: number
          organizacao_id?: string | null
          pagamentos_retroativos?: number
          parcela_atual?: number | null
          parcelas_comissao?: number
          regra_comissao?: string
          status?: string
          taxa_comissao?: number
          tipo_comissionamento?: string
          updated_at?: string
          usuario_id?: string | null
          valor_estorno?: number
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_carteira_id_fkey"
            columns: ["carteira_id"]
            isOneToOne: false
            referencedRelation: "carteira"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      contemplacoes_grupo: {
        Row: {
          cota: string
          created_at: string
          grupo: string
          id: string
          mes_referencia: string
          organizacao_id: string | null
          tipo: string
          valor_percentage: number | null
        }
        Insert: {
          cota: string
          created_at?: string
          grupo: string
          id?: string
          mes_referencia: string
          organizacao_id?: string | null
          tipo: string
          valor_percentage?: number | null
        }
        Update: {
          cota?: string
          created_at?: string
          grupo?: string
          id?: string
          mes_referencia?: string
          organizacao_id?: string | null
          tipo?: string
          valor_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contemplacoes_grupo_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      convites: {
        Row: {
          convidado_por: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          organizacao_id: string | null
          status: string | null
          tipo_acesso: string
          token: string
          updated_at: string | null
        }
        Insert: {
          convidado_por?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          organizacao_id?: string | null
          status?: string | null
          tipo_acesso?: string
          token: string
          updated_at?: string | null
        }
        Update: {
          convidado_por?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          organizacao_id?: string | null
          status?: string | null
          tipo_acesso?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      cotas_contempladas: {
        Row: {
          administradora: string | null
          cota: string
          created_at: string
          grupo: string
          id: string
          organizacao_id: string
          segmento: string | null
        }
        Insert: {
          administradora?: string | null
          cota: string
          created_at?: string
          grupo: string
          id?: string
          organizacao_id: string
          segmento?: string | null
        }
        Update: {
          administradora?: string | null
          cota?: string
          created_at?: string
          grupo?: string
          id?: string
          organizacao_id?: string
          segmento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotas_contempladas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      dicas_estrategicas: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          descricao: string
          emoji: string | null
          id: string
          organizacao_id: string | null
          prioridade: number | null
          termometro_id: string | null
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao: string
          emoji?: string | null
          id?: string
          organizacao_id?: string | null
          prioridade?: number | null
          termometro_id?: string | null
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string
          emoji?: string | null
          id?: string
          organizacao_id?: string | null
          prioridade?: number | null
          termometro_id?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "dicas_estrategicas_termometro_id_fkey"
            columns: ["termometro_id"]
            isOneToOne: false
            referencedRelation: "termometro_mercado"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_contatos: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          observacao: string | null
          organizacao_id: string | null
          resultado: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          observacao?: string | null
          organizacao_id?: string | null
          resultado?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          observacao?: string | null
          organizacao_id?: string | null
          resultado?: string | null
          tipo?: string | null
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
          },
        ]
      }
      historico_loteria: {
        Row: {
          created_at: string
          id: string
          mes_referencia: string
          organizacao_id: string | null
          resultado_federal: number
        }
        Insert: {
          created_at?: string
          id?: string
          mes_referencia: string
          organizacao_id?: string | null
          resultado_federal: number
        }
        Update: {
          created_at?: string
          id?: string
          mes_referencia?: string
          organizacao_id?: string | null
          resultado_federal?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_loteria_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
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
          organizacao_id: string | null
          parcelas_atrasadas: number | null
          parcelas_pagas: number | null
          status: string
          tipo_consorcio: string | null
          updated_at: string
          valor_parcela: number | null
        }
        Insert: {
          administradora?: string | null
          celular?: string | null
          cota?: string | null
          created_at?: string
          grupo?: string | null
          id?: string
          nome: string
          organizacao_id?: string | null
          parcelas_atrasadas?: number | null
          parcelas_pagas?: number | null
          status?: string
          tipo_consorcio?: string | null
          updated_at?: string
          valor_parcela?: number | null
        }
        Update: {
          administradora?: string | null
          celular?: string | null
          cota?: string | null
          created_at?: string
          grupo?: string | null
          id?: string
          nome?: string
          organizacao_id?: string | null
          parcelas_atrasadas?: number | null
          parcelas_pagas?: number | null
          status?: string
          tipo_consorcio?: string | null
          updated_at?: string
          valor_parcela?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inadimplentes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      interacoes: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          lead_id: string | null
          organizacao_id: string | null
          tipo: string
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          lead_id?: string | null
          organizacao_id?: string | null
          tipo: string
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          lead_id?: string | null
          organizacao_id?: string | null
          tipo?: string
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
          },
        ]
      }
      leads: {
        Row: {
          administradora: string | null
          celular: string | null
          cidade: string | null
          cota: string | null
          created_at: string | null
          dados_cadastro: Json | null
          data_adesao: string | null
          data_vencimento: string | null
          email: string | null
          grupo: string | null
          id: string
          indicador_celular: string | null
          indicador_nome: string | null
          last_interaction_at: string | null
          lead_score_valor: string | null
          lead_temperatura: string | null
          nome: string
          organizacao_id: string | null
          prazo_meses: number | null
          propensity_reason: string | null
          propensity_score: number | null
          responsavel_id: string | null
          status: string | null
          status_updated_at: string | null
          tipo_consorcio: string | null
          ultimo_contato: string | null
          updated_at: string | null
          valor_credito: number | null
        }
        Insert: {
          administradora?: string | null
          celular?: string | null
          cidade?: string | null
          cota?: string | null
          created_at?: string | null
          dados_cadastro?: Json | null
          data_adesao?: string | null
          data_vencimento?: string | null
          email?: string | null
          grupo?: string | null
          id?: string
          indicador_celular?: string | null
          indicador_nome?: string | null
          last_interaction_at?: string | null
          lead_score_valor?: string | null
          lead_temperatura?: string | null
          nome: string
          organizacao_id?: string | null
          prazo_meses?: number | null
          propensity_reason?: string | null
          propensity_score?: number | null
          responsavel_id?: string | null
          status?: string | null
          status_updated_at?: string | null
          tipo_consorcio?: string | null
          ultimo_contato?: string | null
          updated_at?: string | null
          valor_credito?: number | null
        }
        Update: {
          administradora?: string | null
          celular?: string | null
          cidade?: string | null
          cota?: string | null
          created_at?: string | null
          dados_cadastro?: Json | null
          data_adesao?: string | null
          data_vencimento?: string | null
          email?: string | null
          grupo?: string | null
          id?: string
          indicador_celular?: string | null
          indicador_nome?: string | null
          last_interaction_at?: string | null
          lead_score_valor?: string | null
          lead_temperatura?: string | null
          nome?: string
          organizacao_id?: string | null
          prazo_meses?: number | null
          propensity_reason?: string | null
          propensity_score?: number | null
          responsavel_id?: string | null
          status?: string | null
          status_updated_at?: string | null
          tipo_consorcio?: string | null
          ultimo_contato?: string | null
          updated_at?: string | null
          valor_credito?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_leads_organizacao"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          created_at: string
          destinatario_id: string | null
          id: string
          lida: boolean
          mensagem: string
          organizacao_id: string
          remetente_id: string
        }
        Insert: {
          created_at?: string
          destinatario_id?: string | null
          id?: string
          lida?: boolean
          mensagem: string
          organizacao_id: string
          remetente_id: string
        }
        Update: {
          created_at?: string
          destinatario_id?: string | null
          id?: string
          lida?: boolean
          mensagem?: string
          organizacao_id?: string
          remetente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
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
          meta_motos: number | null
          meta_outros: number | null
          meta_veiculos: number | null
          organizacao_id: string | null
        }
        Insert: {
          ano?: number | null
          created_at?: string
          id?: number
          meta_anual?: number | null
          meta_imoveis?: number | null
          meta_motos?: number | null
          meta_outros?: number | null
          meta_veiculos?: number | null
          organizacao_id?: string | null
        }
        Update: {
          ano?: number | null
          created_at?: string
          id?: number
          meta_anual?: number | null
          meta_imoveis?: number | null
          meta_motos?: number | null
          meta_outros?: number | null
          meta_veiculos?: number | null
          organizacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_vendedor: {
        Row: {
          ano: number
          created_at: string
          id: string
          meta_anual: number
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          ano: number
          created_at?: string
          id?: string
          meta_anual?: number
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          ano?: number
          created_at?: string
          id?: string
          meta_anual?: number
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metas_vendedor_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_segmentos: {
        Row: {
          created_at: string | null
          id: string
          mes_referencia: string
          meta_vendas: number | null
          organizacao_id: string | null
          progresso_meta: number | null
          segmento: string
          taxa_conversao: number | null
          ticket_medio: number | null
          total_leads: number | null
          total_vendas: number | null
          valor_total: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mes_referencia: string
          meta_vendas?: number | null
          organizacao_id?: string | null
          progresso_meta?: number | null
          segmento: string
          taxa_conversao?: number | null
          ticket_medio?: number | null
          total_leads?: number | null
          total_vendas?: number | null
          valor_total?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mes_referencia?: string
          meta_vendas?: number | null
          organizacao_id?: string | null
          progresso_meta?: number | null
          segmento?: string
          taxa_conversao?: number | null
          ticket_medio?: number | null
          total_leads?: number | null
          total_vendas?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_segmentos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      missoes_concluidas: {
        Row: {
          created_at: string
          data: string | null
          id: string
          missao_id: string
          organizacao_id: string | null
          subref_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: string | null
          id?: string
          missao_id: string
          organizacao_id?: string | null
          subref_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: string | null
          id?: string
          missao_id?: string
          organizacao_id?: string | null
          subref_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missoes_concluidas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
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
      organizacoes: {
        Row: {
          created_at: string | null
          id: string
          max_leads: number | null
          max_usuarios: number | null
          nome: string
          plano: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_leads?: number | null
          max_usuarios?: number | null
          nome: string
          plano?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_leads?: number | null
          max_usuarios?: number | null
          nome?: string
          plano?: string | null
          slug?: string
          updated_at?: string | null
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
          tipo_acesso: string
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
          tipo_acesso: string
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
          tipo_acesso?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
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
          },
        ]
      }
      Prompts: {
        Row: {
          created_at: string
          id: number
          organizacao_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          organizacao_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          organizacao_id?: string | null
        }
        Relationships: []
      }
      propostas: {
        Row: {
          created_at: string | null
          fundo_reserva: number
          id: string
          lead_id: string | null
          organizacao_id: string | null
          pdf_url: string | null
          prazo_meses: number
          status: string | null
          taxa_administrativa: number
          valor_credito: number
          valor_parcela: number
          valor_total: number
        }
        Insert: {
          created_at?: string | null
          fundo_reserva: number
          id?: string
          lead_id?: string | null
          organizacao_id?: string | null
          pdf_url?: string | null
          prazo_meses: number
          status?: string | null
          taxa_administrativa: number
          valor_credito: number
          valor_parcela: number
          valor_total: number
        }
        Update: {
          created_at?: string | null
          fundo_reserva?: number
          id?: string
          lead_id?: string | null
          organizacao_id?: string | null
          pdf_url?: string | null
          prazo_meses?: number
          status?: string | null
          taxa_administrativa?: number
          valor_credito?: number
          valor_parcela?: number
          valor_total?: number
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
          },
        ]
      }
      simulador_config: {
        Row: {
          categorias: Json
          grupos: Json
          id: string
          organizacao_id: string
          updated_at: string | null
        }
        Insert: {
          categorias?: Json
          grupos?: Json
          id?: string
          organizacao_id: string
          updated_at?: string | null
        }
        Update: {
          categorias?: Json
          grupos?: Json
          id?: string
          organizacao_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      termometro_mercado: {
        Row: {
          contemplacoes: number | null
          contemplacoes_variacao: number | null
          created_at: string | null
          creditos_comercializados: number | null
          creditos_comercializados_variacao: number | null
          creditos_disponibilizados: number | null
          creditos_disponibilizados_variacao: number | null
          id: string
          mes_referencia: string
          organizacao_id: string | null
          participantes_ativos: number | null
          participantes_ativos_variacao: number | null
          temperatura: string | null
          temperatura_score: number | null
          ticket_medio: number | null
          ticket_medio_variacao: number | null
          updated_at: string | null
          vendas_cotas: number | null
          vendas_cotas_variacao: number | null
        }
        Insert: {
          contemplacoes?: number | null
          contemplacoes_variacao?: number | null
          created_at?: string | null
          creditos_comercializados?: number | null
          creditos_comercializados_variacao?: number | null
          creditos_disponibilizados?: number | null
          creditos_disponibilizados_variacao?: number | null
          id?: string
          mes_referencia: string
          organizacao_id?: string | null
          participantes_ativos?: number | null
          participantes_ativos_variacao?: number | null
          temperatura?: string | null
          temperatura_score?: number | null
          ticket_medio?: number | null
          ticket_medio_variacao?: number | null
          updated_at?: string | null
          vendas_cotas?: number | null
          vendas_cotas_variacao?: number | null
        }
        Update: {
          contemplacoes?: number | null
          contemplacoes_variacao?: number | null
          created_at?: string | null
          creditos_comercializados?: number | null
          creditos_comercializados_variacao?: number | null
          creditos_disponibilizados?: number | null
          creditos_disponibilizados_variacao?: number | null
          id?: string
          mes_referencia?: string
          organizacao_id?: string | null
          participantes_ativos?: number | null
          participantes_ativos_variacao?: number | null
          temperatura?: string | null
          temperatura_score?: number | null
          ticket_medio?: number | null
          ticket_medio_variacao?: number | null
          updated_at?: string | null
          vendas_cotas?: number | null
          vendas_cotas_variacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "termometro_mercado_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
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
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          id: string
          nome: string
          organizacao_id: string
          role: string | null
          senha_hash: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          nome: string
          organizacao_id: string
          role?: string | null
          senha_hash: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          organizacao_id?: string
          role?: string | null
          senha_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizacao"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_usuarios_organizacao"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_temperatura_mercado: {
        Args: {
          p_creditos_var: number
          p_ticket_var: number
          p_vendas_var: number
        }
        Returns: Json
      }
      get_my_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_member_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: undefined
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
