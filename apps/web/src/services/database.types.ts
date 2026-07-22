export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      asset_blobs: {
        Row: {
          byte_size: number
          created_at: string
          created_by: string | null
          id: string
          mime_type: string
          project_id: string | null
          sanitization_status: string
          sha256: string
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          byte_size: number
          created_at?: string
          created_by?: string | null
          id?: string
          mime_type?: string
          project_id?: string | null
          sanitization_status?: string
          sha256: string
          storage_bucket: string
          storage_path: string
        }
        Update: {
          byte_size?: number
          created_at?: string
          created_by?: string | null
          id?: string
          mime_type?: string
          project_id?: string | null
          sanitization_status?: string
          sha256?: string
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_blobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          metadata: Json
          organization_id: string
          project_id: string | null
          request_id: string
          source: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          organization_id: string
          project_id?: string | null
          request_id?: string
          source?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          organization_id?: string
          project_id?: string | null
          request_id?: string
          source?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          asset_id: string
          created_at: string
          created_by: string
          description: string
          draft_id: string
          id: string
          issue: string | null
          name: string
          validation_run_id: string | null
          variant: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          created_by: string
          description?: string
          draft_id: string
          id?: string
          issue?: string | null
          name: string
          validation_run_id?: string | null
          variant?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          created_by?: string
          description?: string
          draft_id?: string
          id?: string
          issue?: string | null
          name?: string
          validation_run_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset_blobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_validation_run_id_fkey"
            columns: ["validation_run_id"]
            isOneToOne: false
            referencedRelation: "validation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          created_at: string
          created_by: string
          description: string
          icon_id: string | null
          id: string
          keywords: string[]
          name: string
          project_id: string
          selected_candidate_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          icon_id?: string | null
          id?: string
          keywords?: string[]
          name: string
          project_id: string
          selected_candidate_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          icon_id?: string | null
          id?: string
          keywords?: string[]
          name?: string
          project_id?: string
          selected_candidate_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drafts_icon_id_fkey"
            columns: ["icon_id"]
            isOneToOne: false
            referencedRelation: "icons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drafts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drafts_selected_candidate_id_fkey"
            columns: ["selected_candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      icon_aliases: {
        Row: {
          alias: string
          created_at: string
          created_by: string | null
          icon_id: string
          id: string
          kind: string
          locale: string
          reviewed: boolean
        }
        Insert: {
          alias: string
          created_at?: string
          created_by?: string | null
          icon_id: string
          id?: string
          kind?: string
          locale?: string
          reviewed?: boolean
        }
        Update: {
          alias?: string
          created_at?: string
          created_by?: string | null
          icon_id?: string
          id?: string
          kind?: string
          locale?: string
          reviewed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "icon_aliases_icon_id_fkey"
            columns: ["icon_id"]
            isOneToOne: false
            referencedRelation: "icons"
            referencedColumns: ["id"]
          },
        ]
      }
      icon_versions: {
        Row: {
          content_hash: string
          created_at: string
          created_by: string
          icon_id: string
          id: string
          metadata: Json
          optimized_asset_id: string | null
          provenance: Json
          source_asset_id: string
          validation_run_id: string | null
          variant: string
          version: string
        }
        Insert: {
          content_hash: string
          created_at?: string
          created_by: string
          icon_id: string
          id?: string
          metadata?: Json
          optimized_asset_id?: string | null
          provenance?: Json
          source_asset_id: string
          validation_run_id?: string | null
          variant: string
          version: string
        }
        Update: {
          content_hash?: string
          created_at?: string
          created_by?: string
          icon_id?: string
          id?: string
          metadata?: Json
          optimized_asset_id?: string | null
          provenance?: Json
          source_asset_id?: string
          validation_run_id?: string | null
          variant?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "icon_versions_icon_id_fkey"
            columns: ["icon_id"]
            isOneToOne: false
            referencedRelation: "icons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icon_versions_optimized_asset_id_fkey"
            columns: ["optimized_asset_id"]
            isOneToOne: false
            referencedRelation: "asset_blobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icon_versions_source_asset_id_fkey"
            columns: ["source_asset_id"]
            isOneToOne: false
            referencedRelation: "asset_blobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icon_versions_validation_run_id_fkey"
            columns: ["validation_run_id"]
            isOneToOne: false
            referencedRelation: "validation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      icons: {
        Row: {
          canonical_name: string
          category: string
          created_at: string
          created_by: string
          current_version_id: string | null
          description: string
          directionality: string
          id: string
          label: string
          licence: string
          project_id: string
          stable_id: string
          status: string
          updated_at: string
        }
        Insert: {
          canonical_name: string
          category?: string
          created_at?: string
          created_by: string
          current_version_id?: string | null
          description?: string
          directionality?: string
          id?: string
          label: string
          licence?: string
          project_id: string
          stable_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          canonical_name?: string
          category?: string
          created_at?: string
          created_by?: string
          current_version_id?: string | null
          description?: string
          directionality?: string
          id?: string
          label?: string
          licence?: string
          project_id?: string
          stable_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "icons_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "icon_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icons_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
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
          created_by: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          created_by: string
          default_style_profile_id: string | null
          id: string
          name: string
          organization_id: string
          slug: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by: string
          default_style_profile_id?: string | null
          id?: string
          name: string
          organization_id: string
          slug: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          default_style_profile_id?: string | null
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_default_style_profile_id_fkey"
            columns: ["default_style_profile_id"]
            isOneToOne: false
            referencedRelation: "style_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          author_id: string
          candidate_id: string
          created_at: string
          decided_at: string | null
          draft_id: string
          id: string
          project_id: string
          public_id: string
          published_at: string | null
          status: string
          submitted_at: string | null
          target_version: string
          updated_at: string
        }
        Insert: {
          author_id: string
          candidate_id: string
          created_at?: string
          decided_at?: string | null
          draft_id: string
          id?: string
          project_id: string
          public_id?: string
          published_at?: string | null
          status?: string
          submitted_at?: string | null
          target_version?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          candidate_id?: string
          created_at?: string
          decided_at?: string | null
          draft_id?: string
          id?: string
          project_id?: string
          public_id?: string
          published_at?: string | null
          status?: string
          submitted_at?: string | null
          target_version?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string
          created_at: string
          decision: string
          id: string
          proposal_id: string
          resolved: boolean
          reviewer_id: string
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          decision: string
          id?: string
          proposal_id: string
          resolved?: boolean
          reviewer_id: string
          title?: string
        }
        Update: {
          body?: string
          created_at?: string
          decision?: string
          id?: string
          proposal_id?: string
          resolved?: boolean
          reviewer_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      style_profile_versions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          rules: Json
          status: string
          style_profile_id: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          rules?: Json
          status?: string
          style_profile_id: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          rules?: Json
          status?: string
          style_profile_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "style_profile_versions_style_profile_id_fkey"
            columns: ["style_profile_id"]
            isOneToOne: false
            referencedRelation: "style_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      style_profiles: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          project_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_issues: {
        Row: {
          created_at: string
          id: string
          location: string | null
          message: string
          remediation: string | null
          rule_id: string
          severity: string
          validation_run_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          message: string
          remediation?: string | null
          rule_id: string
          severity: string
          validation_run_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          message?: string
          remediation?: string | null
          rule_id?: string
          severity?: string
          validation_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_issues_validation_run_id_fkey"
            columns: ["validation_run_id"]
            isOneToOne: false
            referencedRelation: "validation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_runs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          project_id: string
          status: string
          summary: Json
          target_id: string
          target_type: string
          validator_version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          project_id: string
          status: string
          summary?: Json
          target_id: string
          target_type: string
          validator_version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          project_id?: string
          status?: string
          summary?: Json
          target_id?: string
          target_type?: string
          validator_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_workspace: {
        Args: {
          p_organization_name: string
          p_organization_slug: string
          p_project_name: string
          p_project_slug: string
        }
        Returns: {
          organization_id: string
          project_id: string
          project_slug: string
        }[]
      }
      publish_proposal: {
        Args: { p_proposal_id: string }
        Returns: {
          content_hash: string
          created_at: string
          created_by: string
          icon_id: string
          id: string
          metadata: Json
          optimized_asset_id: string | null
          provenance: Json
          source_asset_id: string
          validation_run_id: string | null
          variant: string
          version: string
        }
        SetofOptions: {
          from: "*"
          to: "icon_versions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_proposal: {
        Args: { p_body?: string; p_decision: string; p_proposal_id: string }
        Returns: {
          author_id: string
          candidate_id: string
          created_at: string
          decided_at: string | null
          draft_id: string
          id: string
          project_id: string
          public_id: string
          published_at: string | null
          status: string
          submitted_at: string | null
          target_version: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "proposals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_proposal: {
        Args: {
          p_candidate_id: string
          p_draft_id: string
          p_target_version?: string
        }
        Returns: {
          author_id: string
          candidate_id: string
          created_at: string
          decided_at: string | null
          draft_id: string
          id: string
          project_id: string
          public_id: string
          published_at: string | null
          status: string
          submitted_at: string | null
          target_version: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "proposals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
