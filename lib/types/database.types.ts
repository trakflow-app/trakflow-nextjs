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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          org_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_sessions: {
        Row: {
          checked_in_at: string | null
          checked_out_at: string
          id: string
          org_id: string
          session_name: string | null
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string
          id?: string
          org_id: string
          session_name?: string | null
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string
          id?: string
          org_id?: string
          session_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_user_id_org_id_fkey"
            columns: ["user_id", "org_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      material_usage: {
        Row: {
          id: string
          logged_at: string
          material_id: string
          notes: string | null
          org_id: string
          project_id: string
          quantity_used: number
          total_cost: number
          user_id: string
        }
        Insert: {
          id?: string
          logged_at?: string
          material_id: string
          notes?: string | null
          org_id: string
          project_id: string
          quantity_used: number
          total_cost: number
          user_id: string
        }
        Update: {
          id?: string
          logged_at?: string
          material_id?: string
          notes?: string | null
          org_id?: string
          project_id?: string
          quantity_used?: number
          total_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_usage_material_id_org_id_fkey"
            columns: ["material_id", "org_id"]
            isOneToOne: false
            referencedRelation: "low_stock_materials"
            referencedColumns: ["id", "org_id"]
          },
          {
            foreignKeyName: "material_usage_material_id_org_id_fkey"
            columns: ["material_id", "org_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id", "org_id"]
          },
          {
            foreignKeyName: "material_usage_project_id_org_id_fkey"
            columns: ["project_id", "org_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "org_id"]
          },
          {
            foreignKeyName: "material_usage_user_id_org_id_fkey"
            columns: ["user_id", "org_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          id: string
          low_stock_threshold: number
          name: string
          org_id: string
          project_id: string | null
          unit_cost: number
          unit_qty: number
        }
        Insert: {
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name: string
          org_id: string
          project_id?: string | null
          unit_cost: number
          unit_qty?: number
        }
        Update: {
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name?: string
          org_id?: string
          project_id?: string | null
          unit_cost?: number
          unit_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "materials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_project_id_org_id_fkey"
            columns: ["project_id", "org_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      org_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          invited_email: string | null
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          invited_email?: string | null
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          invited_email?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_invites_created_by_org_id_fkey"
            columns: ["created_by", "org_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "org_id"]
          },
          {
            foreignKeyName: "org_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_invites_used_by_org_id_fkey"
            columns: ["used_by", "org_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      org_tool_counters: {
        Row: {
          next_tag: number
          org_id: string
        }
        Insert: {
          next_tag?: number
          org_id: string
        }
        Update: {
          next_tag?: number
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_tool_counters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          join_code: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          join_code: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          join_code?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_amount: number | null
          created_at: string
          end_date: string | null
          id: string
          org_id: string
          project_name: string
          start_date: string
          status: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          budget_amount?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          org_id: string
          project_name: string
          start_date: string
          status?: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          budget_amount?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          org_id?: string
          project_name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_management: {
        Row: {
          checked_in: string | null
          checked_out: string
          condition_checkout: Database["public"]["Enums"]["tool_condition"]
          condition_return: Database["public"]["Enums"]["tool_condition"] | null
          id: string
          notes: string | null
          org_id: string
          return_image_path: string | null
          session_id: string
          tool_id: string
          user_id: string
        }
        Insert: {
          checked_in?: string | null
          checked_out?: string
          condition_checkout: Database["public"]["Enums"]["tool_condition"]
          condition_return?:
            | Database["public"]["Enums"]["tool_condition"]
            | null
          id?: string
          notes?: string | null
          org_id: string
          return_image_path?: string | null
          session_id: string
          tool_id: string
          user_id: string
        }
        Update: {
          checked_in?: string | null
          checked_out?: string
          condition_checkout?: Database["public"]["Enums"]["tool_condition"]
          condition_return?:
            | Database["public"]["Enums"]["tool_condition"]
            | null
          id?: string
          notes?: string | null
          org_id?: string
          return_image_path?: string | null
          session_id?: string
          tool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_management_session_id_org_id_fkey"
            columns: ["session_id", "org_id"]
            isOneToOne: false
            referencedRelation: "checkout_sessions"
            referencedColumns: ["id", "org_id"]
          },
          {
            foreignKeyName: "tool_management_tool_id_org_id_fkey"
            columns: ["tool_id", "org_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id", "org_id"]
          },
          {
            foreignKeyName: "tool_management_user_id_org_id_fkey"
            columns: ["user_id", "org_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      tools: {
        Row: {
          condition: Database["public"]["Enums"]["tool_condition"]
          created_at: string
          id: string
          image_path: string | null
          name: string
          notes: string | null
          org_id: string
          project_id: string | null
          status: Database["public"]["Enums"]["tool_status"]
          tag_number: number
        }
        Insert: {
          condition?: Database["public"]["Enums"]["tool_condition"]
          created_at?: string
          id?: string
          image_path?: string | null
          name: string
          notes?: string | null
          org_id: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["tool_status"]
          tag_number: number
        }
        Update: {
          condition?: Database["public"]["Enums"]["tool_condition"]
          created_at?: string
          id?: string
          image_path?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["tool_status"]
          tag_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "tools_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tools_project_id_org_id_fkey"
            columns: ["project_id", "org_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
    }
    Views: {
      low_stock_materials: {
        Row: {
          created_at: string | null
          id: string | null
          low_stock_threshold: number | null
          name: string | null
          org_id: string | null
          project_id: string | null
          unit_cost: number | null
          unit_qty: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          low_stock_threshold?: number | null
          name?: string | null
          org_id?: string | null
          project_id?: string | null
          unit_cost?: number | null
          unit_qty?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          low_stock_threshold?: number | null
          name?: string | null
          org_id?: string | null
          project_id?: string | null
          unit_cost?: number | null
          unit_qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_project_id_org_id_fkey"
            columns: ["project_id", "org_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
    }
    Functions: {
      can_manage_ops: { Args: never; Returns: boolean }
      checkout_tools: {
        Args: {
          condition: Database["public"]["Enums"]["tool_condition"]
          notes: string
          session_name?: string
          tool_ids: string[]
        }
        Returns: string
      }
      claim_org_invite: { Args: { token: string }; Returns: string }
      create_org: { Args: { name: string }; Returns: string }
      create_org_invite: {
        Args: {
          invited_email?: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Returns: string
      }
      get_invite_details: {
        Args: { token_input: string }
        Returns: {
          error_message: string
          invited_email: string
          is_valid: boolean
          org_id: string
          org_name: string
          role: string
        }[]
      }
      get_my_org_id: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_org_id_by_code: { Args: { join_code_input: string }; Returns: string }
      get_org_name_by_code: {
        Args: { join_code_input: string }
        Returns: string
      }
      join_org_by_code: { Args: { code: string }; Returns: string }
      log_material_usage: {
        Args: {
          material_id: string
          notes?: string
          project_id: string
          quantity_used: number
        }
        Returns: string
      }
      regenerate_join_code: { Args: never; Returns: string }
      return_tool: {
        Args: {
          condition_return: Database["public"]["Enums"]["tool_condition"]
          notes?: string
          return_image_path?: string
          tool_management_id: string
        }
        Returns: undefined
      }
      update_my_profile: { Args: { name: string }; Returns: undefined }
      verify_org_code: { Args: { join_code_input: string }; Returns: boolean }
    }
    Enums: {
      project_status: "ACTIVE" | "COMPLETED"
      tool_condition: "GOOD" | "FAIR" | "DAMAGED" | "OUT_OF_SERVICE"
      tool_status: "AVAILABLE" | "CHECKEDOUT" | "OUT_OF_SERVICE" | "ARCHIVED"
      user_role: "OWNER" | "FOREMAN" | "CREW"
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
      project_status: ["ACTIVE", "COMPLETED"],
      tool_condition: ["GOOD", "FAIR", "DAMAGED", "OUT_OF_SERVICE"],
      tool_status: ["AVAILABLE", "CHECKEDOUT", "OUT_OF_SERVICE", "ARCHIVED"],
      user_role: ["OWNER", "FOREMAN", "CREW"],
    },
  },
} as const
