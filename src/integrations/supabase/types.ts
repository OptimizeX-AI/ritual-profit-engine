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
      bank_accounts: {
        Row: {
          agencia: string | null
          banco: string | null
          conta: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          organization_id: string
          saldo_atual_centavos: number
          saldo_inicial_centavos: number
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          saldo_atual_centavos?: number
          saldo_inicial_centavos?: number
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          saldo_atual_centavos?: number
          saldo_inicial_centavos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contrato_fim: string | null
          contrato_inicio: string | null
          created_at: string
          fee_mensal_centavos: number | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          contrato_fim?: string | null
          contrato_inicio?: string | null
          created_at?: string
          fee_mensal_centavos?: number | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          contrato_fim?: string | null
          contrato_inicio?: string | null
          created_at?: string
          fee_mensal_centavos?: number | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          company: string
          contact: string | null
          created_at: string
          days_in_stage: number
          expected_close_date: string | null
          id: string
          loss_reason: string | null
          notes: string | null
          organization_id: string
          origin: string | null
          probability: number
          salesperson_id: string | null
          stage: string
          updated_at: string
          value_centavos: number
        }
        Insert: {
          company: string
          contact?: string | null
          created_at?: string
          days_in_stage?: number
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          notes?: string | null
          organization_id: string
          origin?: string | null
          probability?: number
          salesperson_id?: string | null
          stage?: string
          updated_at?: string
          value_centavos?: number
        }
        Update: {
          company?: string
          contact?: string | null
          created_at?: string
          days_in_stage?: number
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          notes?: string | null
          organization_id?: string
          origin?: string | null
          probability?: number
          salesperson_id?: string | null
          stage?: string
          updated_at?: string
          value_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_goals: {
        Row: {
          achieved_value_centavos: number
          created_at: string
          id: string
          month: string
          organization_id: string
          target_value_centavos: number
          type: string
          updated_at: string
        }
        Insert: {
          achieved_value_centavos?: number
          created_at?: string
          id?: string
          month: string
          organization_id: string
          target_value_centavos?: number
          type: string
          updated_at?: string
        }
        Update: {
          achieved_value_centavos?: number
          created_at?: string
          id?: string
          month?: string
          organization_id?: string
          target_value_centavos?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          imposto_percentual: number | null
          meta_receita_liquida_centavos: number | null
          name: string
          teto_custos_fixos_centavos: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          imposto_percentual?: number | null
          meta_receita_liquida_centavos?: number | null
          name: string
          teto_custos_fixos_centavos?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          imposto_percentual?: number | null
          meta_receita_liquida_centavos?: number | null
          name?: string
          teto_custos_fixos_centavos?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          comissao_percentual: number | null
          created_at: string
          custo_hora_centavos: number | null
          id: string
          name: string
          organization_id: string | null
          tipo_comissao: string | null
        }
        Insert: {
          comissao_percentual?: number | null
          created_at?: string
          custo_hora_centavos?: number | null
          id: string
          name: string
          organization_id?: string | null
          tipo_comissao?: string | null
        }
        Update: {
          comissao_percentual?: number | null
          created_at?: string
          custo_hora_centavos?: number | null
          id?: string
          name?: string
          organization_id?: string | null
          tipo_comissao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_addendums: {
        Row: {
          approved_by_client: boolean
          cost_added_centavos: number
          created_at: string
          created_by: string | null
          description: string
          hours_added: number
          id: string
          project_id: string
        }
        Insert: {
          approved_by_client?: boolean
          cost_added_centavos?: number
          created_at?: string
          created_by?: string | null
          description: string
          hours_added?: number
          id?: string
          project_id: string
        }
        Update: {
          approved_by_client?: boolean
          cost_added_centavos?: number
          created_at?: string
          created_by?: string | null
          description?: string
          hours_added?: number
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_addendums_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          current_budget_hours: number
          horas_contratadas: number | null
          id: string
          initial_budget_hours: number
          name: string
          scope_type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          current_budget_hours?: number
          horas_contratadas?: number | null
          id?: string
          initial_budget_hours?: number
          name: string
          scope_type?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          current_budget_hours?: number
          horas_contratadas?: number | null
          id?: string
          initial_budget_hours?: number
          name?: string
          scope_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          deadline: string | null
          description: string | null
          estimated_time_minutes: number
          id: string
          organization_id: string
          project_id: string | null
          sla_paused_at: string | null
          status: string
          time_spent_minutes: number
          title: string
          total_paused_minutes: number
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          estimated_time_minutes?: number
          id?: string
          organization_id: string
          project_id?: string | null
          sla_paused_at?: string | null
          status?: string
          time_spent_minutes?: number
          title: string
          total_paused_minutes?: number
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          estimated_time_minutes?: number
          id?: string
          organization_id?: string
          project_id?: string | null
          sla_paused_at?: string | null
          status?: string
          time_spent_minutes?: number
          title?: string
          total_paused_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_categories: {
        Row: {
          cost_classification: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          parent_id: string | null
          type: string
        }
        Insert: {
          cost_classification?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
          type: string
        }
        Update: {
          cost_classification?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          bank_account_id: string | null
          category: string
          commission_transaction_id: string | null
          competence_date: string | null
          cost_type: string
          created_at: string
          date: string
          description: string
          id: string
          is_repasse: boolean
          nature: string
          notes: string | null
          organization_id: string
          payment_date: string | null
          project_id: string | null
          salesperson_id: string | null
          status: string
          type: string
          updated_at: string
          value_centavos: number
        }
        Insert: {
          bank_account_id?: string | null
          category: string
          commission_transaction_id?: string | null
          competence_date?: string | null
          cost_type?: string
          created_at?: string
          date?: string
          description: string
          id?: string
          is_repasse?: boolean
          nature?: string
          notes?: string | null
          organization_id: string
          payment_date?: string | null
          project_id?: string | null
          salesperson_id?: string | null
          status?: string
          type: string
          updated_at?: string
          value_centavos: number
        }
        Update: {
          bank_account_id?: string | null
          category?: string
          commission_transaction_id?: string | null
          competence_date?: string | null
          cost_type?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_repasse?: boolean
          nature?: string
          notes?: string | null
          organization_id?: string
          payment_date?: string | null
          project_id?: string | null
          salesperson_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          value_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_commission_transaction_id_fkey"
            columns: ["commission_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_commission: {
        Args: { deal_value: number; salesperson_id: string }
        Returns: number
      }
      can_view_custo_hora: { Args: never; Returns: boolean }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      provision_sales_commission: {
        Args: {
          p_deal_id: string
          p_deal_value: number
          p_organization_id: string
          p_salesperson_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
