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
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          user_id?: string
        }
        Relationships: []
      }
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
      bank_transfers: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          escrow_id: string
          id: string
          receipt_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          transfer_number: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          escrow_id: string
          id?: string
          receipt_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transfer_number?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          escrow_id?: string
          id?: string
          receipt_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transfer_number?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfers_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_user_id_fkey"
            columns: ["user_id"]
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
      cart_items: {
        Row: {
          created_at: string
          id: string
          quantity: number
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "micro_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
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
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
          region_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          region_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      contract_versions: {
        Row: {
          change_note: string | null
          changed_by: string | null
          contract_id: string
          created_at: string
          id: string
          terms: string
          version_number: number
        }
        Insert: {
          change_note?: string | null
          changed_by?: string | null
          contract_id: string
          created_at?: string
          id?: string
          terms?: string
          version_number?: number
        }
        Update: {
          change_note?: string | null
          changed_by?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          terms?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
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
      dispute_status_log: {
        Row: {
          changed_by: string | null
          created_at: string
          dispute_id: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          dispute_id: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          dispute_id?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_status_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_status_log_dispute_id_fkey"
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
          deleted_at: string | null
          description: string
          dispute_number: string
          id: string
          project_id: string
          raised_by: string
          resolution_notes: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          dispute_number?: string
          id?: string
          project_id: string
          raised_by: string
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          dispute_number?: string
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
          association_id: string | null
          created_at: string
          donation_status: string
          donor_id: string
          id: string
          project_id: string | null
          service_id: string | null
        }
        Insert: {
          amount: number
          association_id?: string | null
          created_at?: string
          donation_status?: string
          donor_id: string
          id?: string
          project_id?: string | null
          service_id?: string | null
        }
        Update: {
          amount?: number
          association_id?: string | null
          created_at?: string
          donation_status?: string
          donor_id?: string
          id?: string
          project_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_contributions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          beneficiary_id: string | null
          created_at: string
          escrow_number: string
          grant_request_id: string | null
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
          beneficiary_id?: string | null
          created_at?: string
          escrow_number?: string
          grant_request_id?: string | null
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
          beneficiary_id?: string | null
          created_at?: string
          escrow_number?: string
          grant_request_id?: string | null
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
            foreignKeyName: "escrow_transactions_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_grant_request_id_fkey"
            columns: ["grant_request_id"]
            isOneToOne: false
            referencedRelation: "grant_requests"
            referencedColumns: ["id"]
          },
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
      grant_requests: {
        Row: {
          admin_note: string | null
          amount: number
          association_id: string
          created_at: string | null
          description: string | null
          donor_id: string | null
          id: string
          project_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          association_id: string
          created_at?: string | null
          description?: string | null
          donor_id?: string | null
          id?: string
          project_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          association_id?: string
          created_at?: string | null
          description?: string | null
          donor_id?: string | null
          id?: string
          project_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grant_requests_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_requests_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          archived_at: string | null
          commission_amount: number
          created_at: string
          escrow_id: string | null
          id: string
          invoice_number: string
          issued_to: string
          notes: string | null
          status: string
        }
        Insert: {
          amount: number
          archived_at?: string | null
          commission_amount: number
          created_at?: string
          escrow_id?: string | null
          id?: string
          invoice_number: string
          issued_to: string
          notes?: string | null
          status?: string
        }
        Update: {
          amount?: number
          archived_at?: string | null
          commission_amount?: number
          created_at?: string
          escrow_id?: string | null
          id?: string
          invoice_number?: string
          issued_to?: string
          notes?: string | null
          status?: string
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
      messages: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          project_id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          project_id: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
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
          city_id: string | null
          created_at: string
          deleted_at: string | null
          description: string
          faq: Json | null
          gallery: Json | null
          id: string
          image_url: string | null
          long_description: string | null
          packages: Json | null
          price: number
          provider_id: string
          region_id: string | null
          sales_count: number | null
          service_number: string
          service_type: Database["public"]["Enums"]["service_type"]
          service_views: number | null
          title: string
          updated_at: string
        }
        Insert: {
          approval?: Database["public"]["Enums"]["approval_status"]
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          faq?: Json | null
          gallery?: Json | null
          id?: string
          image_url?: string | null
          long_description?: string | null
          packages?: Json | null
          price: number
          provider_id: string
          region_id?: string | null
          sales_count?: number | null
          service_number?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          service_views?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          approval?: Database["public"]["Enums"]["approval_status"]
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          faq?: Json | null
          gallery?: Json | null
          id?: string
          image_url?: string | null
          long_description?: string | null
          packages?: Json | null
          price?: number
          provider_id?: string
          region_id?: string | null
          sales_count?: number | null
          service_number?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          service_views?: number | null
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
            foreignKeyName: "micro_services_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
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
          delivery_status: string
          id: string
          is_read: boolean
          message: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_status?: string
          id?: string
          is_read?: boolean
          message: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_status?: string
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
      pending_categories: {
        Row: {
          admin_note: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_by: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_by: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_by?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string
          provider_id: string
          title: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          provider_id: string
          title: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          provider_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_saves: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_saves_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_iban: string | null
          bank_name: string | null
          bio: string | null
          company_logo_url: string | null
          contact_officer_email: string | null
          contact_officer_name: string | null
          contact_officer_phone: string | null
          contact_officer_title: string | null
          cover_image_url: string | null
          created_at: string
          email_notifications: boolean
          full_name: string
          hourly_rate: number | null
          id: string
          is_name_visible: boolean
          is_suspended: boolean
          is_verified: boolean
          license_number: string | null
          notification_preferences: Json | null
          organization_name: string | null
          pdpl_consent_at: string | null
          pdpl_consent_version: string | null
          phone: string | null
          profile_views: number | null
          qualifications: Json | null
          skills: string[] | null
          suspension_reason: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bio?: string | null
          company_logo_url?: string | null
          contact_officer_email?: string | null
          contact_officer_name?: string | null
          contact_officer_phone?: string | null
          contact_officer_title?: string | null
          cover_image_url?: string | null
          created_at?: string
          email_notifications?: boolean
          full_name?: string
          hourly_rate?: number | null
          id: string
          is_name_visible?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          license_number?: string | null
          notification_preferences?: Json | null
          organization_name?: string | null
          pdpl_consent_at?: string | null
          pdpl_consent_version?: string | null
          phone?: string | null
          profile_views?: number | null
          qualifications?: Json | null
          skills?: string[] | null
          suspension_reason?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bio?: string | null
          company_logo_url?: string | null
          contact_officer_email?: string | null
          contact_officer_name?: string | null
          contact_officer_phone?: string | null
          contact_officer_title?: string | null
          cover_image_url?: string | null
          created_at?: string
          email_notifications?: boolean
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_name_visible?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          license_number?: string | null
          notification_preferences?: Json | null
          organization_name?: string | null
          pdpl_consent_at?: string | null
          pdpl_consent_version?: string | null
          phone?: string | null
          profile_views?: number | null
          qualifications?: Json | null
          skills?: string[] | null
          suspension_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_deliverables: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          project_id: string
          provider_id: string
          reviewed_at: string | null
          revision_note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          provider_id: string
          reviewed_at?: string | null
          revision_note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          provider_id?: string
          reviewed_at?: string | null
          revision_note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deliverables_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_provider_id: string | null
          association_id: string
          budget: number | null
          category_id: string | null
          city_id: string | null
          created_at: string
          deleted_at: string | null
          description: string
          estimated_hours: number | null
          id: string
          is_private: boolean
          region_id: string | null
          request_number: string
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
          city_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          estimated_hours?: number | null
          id?: string
          is_private?: boolean
          region_id?: string | null
          request_number?: string
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
          city_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          estimated_hours?: number | null
          id?: string
          is_private?: boolean
          region_id?: string | null
          request_number?: string
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
            foreignKeyName: "projects_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
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
      site_content: {
        Row: {
          content: Json
          id: string
          section_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: string
          section_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          section_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
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
      ticket_replies: {
        Row: {
          author_id: string
          created_at: string
          id: string
          message: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          message?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          message?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          approval: Database["public"]["Enums"]["approval_status"]
          created_at: string
          description: string
          end_time: string | null
          hours: number
          id: string
          log_date: string
          project_id: string
          provider_id: string
          rejection_reason: string | null
          start_time: string | null
        }
        Insert: {
          approval?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          description?: string
          end_time?: string | null
          hours: number
          id?: string
          log_date?: string
          project_id: string
          provider_id: string
          rejection_reason?: string | null
          start_time?: string | null
        }
        Update: {
          approval?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          description?: string
          end_time?: string | null
          hours?: number
          id?: string
          log_date?: string
          project_id?: string
          provider_id?: string
          rejection_reason?: string | null
          start_time?: string | null
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
          receipt_url: string | null
          rejection_reason: string | null
          status: string
          withdrawal_number: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          provider_id: string
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          withdrawal_number?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          provider_id?: string
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          withdrawal_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_landing_stats: { Args: never; Returns: Json }
      get_public_profile: { Args: { p_id: string }; Returns: Json }
      get_public_project: { Args: { p_id: string }; Returns: Json }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_verified_association_ids: { Args: never; Returns: string[] }
      get_verified_donor_ids: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_profile_views: { Args: { p_id: string }; Returns: undefined }
      increment_service_views: { Args: { s_id: string }; Returns: undefined }
      is_not_suspended: { Args: { _user_id: string }; Returns: boolean }
      purge_soft_deleted_records: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "youth_association"
        | "service_provider"
        | "donor"
      approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "draft"
        | "suspended"
        | "archived"
      bid_status: "pending" | "accepted" | "rejected" | "withdrawn"
      dispute_status:
        | "open"
        | "under_review"
        | "resolved"
        | "closed"
        | "waiting_response"
        | "info_requested"
        | "preliminary_decision"
        | "final_decision"
        | "archived"
      escrow_status:
        | "held"
        | "released"
        | "frozen"
        | "refunded"
        | "pending_payment"
        | "failed"
        | "under_review"
      project_status:
        | "draft"
        | "pending_approval"
        | "open"
        | "in_progress"
        | "completed"
        | "disputed"
        | "cancelled"
        | "suspended"
        | "archived"
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
      approval_status: [
        "pending",
        "approved",
        "rejected",
        "draft",
        "suspended",
        "archived",
      ],
      bid_status: ["pending", "accepted", "rejected", "withdrawn"],
      dispute_status: [
        "open",
        "under_review",
        "resolved",
        "closed",
        "waiting_response",
        "info_requested",
        "preliminary_decision",
        "final_decision",
        "archived",
      ],
      escrow_status: [
        "held",
        "released",
        "frozen",
        "refunded",
        "pending_payment",
        "failed",
        "under_review",
      ],
      project_status: [
        "draft",
        "pending_approval",
        "open",
        "in_progress",
        "completed",
        "disputed",
        "cancelled",
        "suspended",
        "archived",
      ],
      service_type: ["fixed_price", "hourly"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
