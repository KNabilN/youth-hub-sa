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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          cover_letter: string
          created_at: string
          id: string
          price: number
          project_id: string
          provider_id: string
          status: Database["public"]["Enums"]["bid_status"]
          timeline_days: number
          updated_at: string
        }
        Insert: {
          cover_letter?: string
          created_at?: string
          id?: string
          price: number
          project_id: string
          provider_id: string
          status?: Database["public"]["Enums"]["bid_status"]
          timeline_days: number
          updated_at?: string
        }
        Update: {
          cover_letter?: string
          created_at?: string
          id?: string
          price?: number
          project_id?: string
          provider_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
          timeline_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      commission_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          rate?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          association_id: string
          association_signed_at: string | null
          created_at: string
          id: string
          project_id: string
          provider_id: string
          provider_signed_at: string | null
          terms: string
        }
        Insert: {
          association_id: string
          association_signed_at?: string | null
          created_at?: string
          id?: string
          project_id: string
          provider_id: string
          provider_signed_at?: string | null
          terms?: string
        }
        Update: {
          association_id?: string
          association_signed_at?: string | null
          created_at?: string
          id?: string
          project_id?: string
          provider_id?: string
          provider_signed_at?: string | null
          terms?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_responses: {
        Row: {
          author_id: string
          created_at: string
          dispute_id: string
          id: string
          message: string
        }
        Insert: {
          author_id: string
          created_at?: string
          dispute_id: string
          id?: string
          message?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          dispute_id?: string
          id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_responses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_responses_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          description: string
          id: string
          project_id: string
          raised_by: string
          resolution_notes: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          project_id: string
          raised_by: string
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          project_id?: string
          raised_by?: string
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_contributions: {
        Row: {
          amount: number
          created_at: string
          donor_id: string
          id: string
          project_id: string | null
          service_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          donor_id: string
          id?: string
          project_id?: string | null
          service_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          donor_id?: string
          id?: string
          project_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_contributions_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_contributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_contributions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "micro_services"
            referencedColumns: ["id"]
          },
        ]
      }
      edit_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          requested_by: string
          requested_changes: Json
          status: string
          target_id: string
          target_table: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          requested_by: string
          requested_changes?: Json
          status?: string
          target_id: string
          target_table: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          requested_by?: string
          requested_changes?: Json
          status?: string
          target_id?: string
          target_table?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          payee_id: string
          payer_id: string
          project_id: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["escrow_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payee_id: string
          payer_id: string
          project_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payee_id?: string
          payer_id?: string
          project_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "micro_services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          commission_amount: number
          created_at: string
          escrow_id: string | null
          id: string
          invoice_number: string
          issued_to: string
        }
        Insert: {
          amount: number
          commission_amount: number
          created_at?: string
          escrow_id?: string | null
          id?: string
          invoice_number: string
          issued_to: string
        }
        Update: {
          amount?: number
          commission_amount?: number
          created_at?: string
          escrow_id?: string | null
          id?: string
          invoice_number?: string
          issued_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_issued_to_fkey"
            columns: ["issued_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_services: {
        Row: {
          approval: Database["public"]["Enums"]["approval_status"]
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          price: number
          provider_id: string
          region_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          title: string
          updated_at: string
        }
        Insert: {
          approval?: Database["public"]["Enums"]["approval_status"]
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          price: number
          provider_id: string
          region_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          title: string
          updated_at?: string
        }
        Update: {
          approval?: Database["public"]["Enums"]["approval_status"]
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          price?: number
          provider_id?: string
          region_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "micro_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "micro_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "micro_services_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          hourly_rate: number | null
          id: string
          is_suspended: boolean
          is_verified: boolean
          organization_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          hourly_rate?: number | null
          id: string
          is_suspended?: boolean
          is_verified?: boolean
          organization_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_suspended?: boolean
          is_verified?: boolean
          organization_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_provider_id: string | null
          association_id: string
          budget: number | null
          category_id: string | null
          created_at: string
          description: string
          estimated_hours: number | null
          id: string
          is_private: boolean
          region_id: string | null
          required_skills: string[] | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_provider_id?: string | null
          association_id: string
          budget?: number | null
          category_id?: string | null
          created_at?: string
          description?: string
          estimated_hours?: number | null
          id?: string
          is_private?: boolean
          region_id?: string | null
          required_skills?: string[] | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_provider_id?: string | null
          association_id?: string
          budget?: number | null
          category_id?: string | null
          created_at?: string
          description?: string
          estimated_hours?: number | null
          id?: string
          is_private?: boolean
          region_id?: string | null
          required_skills?: string[] | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_provider_id_fkey"
            columns: ["assigned_provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          communication_score: number
          contract_id: string
          created_at: string
          id: string
          quality_score: number
          rater_id: string
          timing_score: number
        }
        Insert: {
          comment?: string | null
          communication_score: number
          contract_id: string
          created_at?: string
          id?: string
          quality_score: number
          rater_id: string
          timing_score: number
        }
        Update: {
          comment?: string | null
          communication_score?: number
          contract_id?: string
          created_at?: string
          id?: string
          quality_score?: number
          rater_id?: string
          timing_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          approval: Database["public"]["Enums"]["approval_status"]
          created_at: string
          description: string
          hours: number
          id: string
          log_date: string
          project_id: string
          provider_id: string
        }
        Insert: {
          approval?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          description?: string
          hours: number
          id?: string
          log_date?: string
          project_id: string
          provider_id: string
        }
        Update: {
          approval?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          description?: string
          hours?: number
          id?: string
          log_date?: string
          project_id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          provider_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          provider_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          provider_id?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_not_suspended: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "youth_association"
        | "service_provider"
        | "donor"
      approval_status: "pending" | "approved" | "rejected"
      bid_status: "pending" | "accepted" | "rejected" | "withdrawn"
      dispute_status: "open" | "under_review" | "resolved" | "closed"
      escrow_status: "held" | "released" | "frozen" | "refunded"
      project_status:
        | "draft"
        | "pending_approval"
        | "open"
        | "in_progress"
        | "completed"
        | "disputed"
        | "cancelled"
      service_type: "fixed_price" | "hourly"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: [
        "super_admin",
        "youth_association",
        "service_provider",
        "donor",
      ],
      approval_status: ["pending", "approved", "rejected"],
      bid_status: ["pending", "accepted", "rejected", "withdrawn"],
      dispute_status: ["open", "under_review", "resolved", "closed"],
      escrow_status: ["held", "released", "frozen", "refunded"],
      project_status: [
        "draft",
        "pending_approval",
        "open",
        "in_progress",
        "completed",
        "disputed",
        "cancelled",
      ],
      service_type: ["fixed_price", "hourly"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
