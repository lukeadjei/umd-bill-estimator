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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          full_time_fee_credit_threshold: number
          id: string
          label: string
          undergrad_tuition_full_time_credit_threshold: number
        }
        Insert: {
          full_time_fee_credit_threshold: number
          id?: string
          label: string
          undergrad_tuition_full_time_credit_threshold: number
        }
        Update: {
          full_time_fee_credit_threshold?: number
          id?: string
          label?: string
          undergrad_tuition_full_time_credit_threshold?: number
        }
        Relationships: []
      }
      academic_years_staging: {
        Row: {
          academic_year_id: string
          full_time_fee_credit_threshold: number
          id: string
          scraped_at: string
          undergrad_tuition_full_time_credit_threshold: number
        }
        Insert: {
          academic_year_id: string
          full_time_fee_credit_threshold: number
          id?: string
          scraped_at?: string
          undergrad_tuition_full_time_credit_threshold: number
        }
        Update: {
          academic_year_id?: string
          full_time_fee_credit_threshold?: number
          id?: string
          scraped_at?: string
          undergrad_tuition_full_time_credit_threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_staging_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      block_dining_plans: {
        Row: {
          academic_year_id: string
          dining_dollars: number
          id: string
          meal_count: number
          plan_label: string
          price: number
        }
        Insert: {
          academic_year_id: string
          dining_dollars: number
          id?: string
          meal_count: number
          plan_label: string
          price: number
        }
        Update: {
          academic_year_id?: string
          dining_dollars?: number
          id?: string
          meal_count?: number
          plan_label?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "block_dining_plans_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      block_dining_plans_staging: {
        Row: {
          academic_year_id: string
          dining_dollars: number
          id: string
          meal_count: number
          plan_label: string
          price: number
          scraped_at: string
        }
        Insert: {
          academic_year_id: string
          dining_dollars: number
          id?: string
          meal_count: number
          plan_label: string
          price: number
          scraped_at?: string
        }
        Update: {
          academic_year_id?: string
          dining_dollars?: number
          id?: string
          meal_count?: number
          plan_label?: string
          price?: number
          scraped_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_dining_plans_staging_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      differential_tuition: {
        Row: {
          academic_year_id: string
          full_time_rate: number
          id: string
          per_credit_rate: number
        }
        Insert: {
          academic_year_id: string
          full_time_rate: number
          id?: string
          per_credit_rate: number
        }
        Update: {
          academic_year_id?: string
          full_time_rate?: number
          id?: string
          per_credit_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "differential_tuition_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      differential_tuition_staging: {
        Row: {
          academic_year_id: string
          full_time_rate: number
          id: string
          per_credit_rate: number
          scraped_at: string
        }
        Insert: {
          academic_year_id: string
          full_time_rate: number
          id?: string
          per_credit_rate: number
          scraped_at?: string
        }
        Update: {
          academic_year_id?: string
          full_time_rate?: number
          id?: string
          per_credit_rate?: number
          scraped_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "differential_tuition_staging_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      graduate_fees: {
        Row: {
          academic_year_id: string
          full_time_rate: number
          id: string
          part_time_rate: number
        }
        Insert: {
          academic_year_id: string
          full_time_rate: number
          id?: string
          part_time_rate: number
        }
        Update: {
          academic_year_id?: string
          full_time_rate?: number
          id?: string
          part_time_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "graduate_fees_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      graduate_fees_staging: {
        Row: {
          academic_year_id: string
          full_time_rate: number
          id: string
          part_time_rate: number
          scraped_at: string
        }
        Insert: {
          academic_year_id: string
          full_time_rate: number
          id?: string
          part_time_rate: number
          scraped_at?: string
        }
        Update: {
          academic_year_id?: string
          full_time_rate?: number
          id?: string
          part_time_rate?: number
          scraped_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduate_fees_staging_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      graduate_tuition_rates: {
        Row: {
          academic_year_id: string
          id: string
          per_credit_rate: number
          residency: string
        }
        Insert: {
          academic_year_id: string
          id?: string
          per_credit_rate: number
          residency: string
        }
        Update: {
          academic_year_id?: string
          id?: string
          per_credit_rate?: number
          residency?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduate_tuition_rates_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      graduate_tuition_rates_staging: {
        Row: {
          academic_year_id: string
          id: string
          per_credit_rate: number
          residency: string
          scraped_at: string
        }
        Insert: {
          academic_year_id: string
          id?: string
          per_credit_rate: number
          residency: string
          scraped_at?: string
        }
        Update: {
          academic_year_id?: string
          id?: string
          per_credit_rate?: number
          residency?: string
          scraped_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduate_tuition_rates_staging_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      health_insurance_rates: {
        Row: {
          academic_year_id: string
          fall_price: number
          id: string
          spring_price: number
        }
        Insert: {
          academic_year_id: string
          fall_price: number
          id?: string
          spring_price: number
        }
        Update: {
          academic_year_id?: string
          fall_price?: number
          id?: string
          spring_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "health_insurance_rates_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      health_insurance_rates_staging: {
        Row: {
          academic_year_id: string
          fall_price: number
          id: string
          scraped_at: string
          spring_price: number
        }
        Insert: {
          academic_year_id: string
          fall_price: number
          id?: string
          scraped_at?: string
          spring_price: number
        }
        Update: {
          academic_year_id?: string
          fall_price?: number
          id?: string
          scraped_at?: string
          spring_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "health_insurance_rates_staging_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      housing_rates: {
        Row: {
          academic_year_id: string
          building_category: string
          id: string
          rate: number
          room_type: string
        }
        Insert: {
          academic_year_id: string
          building_category: string
          id?: string
          rate: number
          room_type: string
        }
        Update: {
          academic_year_id?: string
          building_category?: string
          id?: string
          rate?: number
          room_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "housing_rates_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      housing_rates_staging: {
        Row: {
          academic_year_id: string
          building_category: string
          id: string
          rate: number
          room_type: string
          scraped_at: string
        }
        Insert: {
          academic_year_id: string
          building_category: string
          id?: string
          rate: number
          room_type: string
          scraped_at?: string
        }
        Update: {
          academic_year_id?: string
          building_category?: string
          id?: string
          rate?: number
          room_type?: string
          scraped_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "housing_rates_staging_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      mandatory_fees: {
        Row: {
          academic_year_id: string
          full_time_rate: number
          id: string
          part_time_rate: number
        }
        Insert: {
          academic_year_id: string
          full_time_rate: number
          id?: string
          part_time_rate: number
        }
        Update: {
          academic_year_id?: string
          full_time_rate?: number
          id?: string
          part_time_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "mandatory_fees_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      mandatory_fees_staging: {
        Row: {
          academic_year_id: string
          full_time_rate: number
          id: string
          part_time_rate: number
          scraped_at: string
        }
        Insert: {
          academic_year_id: string
          full_time_rate: number
          id?: string
          part_time_rate: number
          scraped_at?: string
        }
        Update: {
          academic_year_id?: string
          full_time_rate?: number
          id?: string
          part_time_rate?: number
          scraped_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandatory_fees_staging_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_permits: {
        Row: {
          academic_year_id: string
          id: string
          permit_type: string
          price: number
          term: string
        }
        Insert: {
          academic_year_id: string
          id?: string
          permit_type: string
          price: number
          term: string
        }
        Update: {
          academic_year_id?: string
          id?: string
          permit_type?: string
          price?: number
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_permits_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_permits_staging: {
        Row: {
          academic_year_id: string
          id: string
          permit_type: string
          price: number
          scraped_at: string
          term: string
        }
        Insert: {
          academic_year_id: string
          id?: string
          permit_type: string
          price: number
          scraped_at?: string
          term: string
        }
        Update: {
          academic_year_id?: string
          id?: string
          permit_type?: string
          price?: number
          scraped_at?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_permits_staging_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_dining_plans: {
        Row: {
          academic_year_id: string
          dining_dollars: number
          fall_price: number
          guest_passes: number
          id: string
          plan_name: string
          spring_price: number
        }
        Insert: {
          academic_year_id: string
          dining_dollars: number
          fall_price: number
          guest_passes: number
          id?: string
          plan_name: string
          spring_price: number
        }
        Update: {
          academic_year_id?: string
          dining_dollars?: number
          fall_price?: number
          guest_passes?: number
          id?: string
          plan_name?: string
          spring_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "resident_dining_plans_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_dining_plans_staging: {
        Row: {
          academic_year_id: string
          dining_dollars: number
          fall_price: number
          guest_passes: number
          id: string
          plan_name: string
          scraped_at: string
          spring_price: number
        }
        Insert: {
          academic_year_id: string
          dining_dollars: number
          fall_price: number
          guest_passes: number
          id?: string
          plan_name: string
          scraped_at?: string
          spring_price: number
        }
        Update: {
          academic_year_id?: string
          dining_dollars?: number
          fall_price?: number
          guest_passes?: number
          id?: string
          plan_name?: string
          scraped_at?: string
          spring_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "resident_dining_plans_staging_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          academic_year_id: string
          applies_differential_tuition: boolean
          block_dining_plan_id: string | null
          computed_total: number
          created_at: string
          credit_hours: number
          housing_rate_id: string | null
          id: string
          living_situation: string
          major: string | null
          name: string
          parking_permit_id: string | null
          resident_dining_plan_id: string | null
          tuition_rate_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_year_id: string
          applies_differential_tuition?: boolean
          block_dining_plan_id?: string | null
          computed_total: number
          created_at?: string
          credit_hours: number
          housing_rate_id?: string | null
          id?: string
          living_situation: string
          major?: string | null
          name: string
          parking_permit_id?: string | null
          resident_dining_plan_id?: string | null
          tuition_rate_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_year_id?: string
          applies_differential_tuition?: boolean
          block_dining_plan_id?: string | null
          computed_total?: number
          created_at?: string
          credit_hours?: number
          housing_rate_id?: string | null
          id?: string
          living_situation?: string
          major?: string | null
          name?: string
          parking_permit_id?: string | null
          resident_dining_plan_id?: string | null
          tuition_rate_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_block_dining_plan_id_fkey"
            columns: ["block_dining_plan_id"]
            isOneToOne: false
            referencedRelation: "block_dining_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_housing_rate_id_fkey"
            columns: ["housing_rate_id"]
            isOneToOne: false
            referencedRelation: "housing_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_parking_permit_id_fkey"
            columns: ["parking_permit_id"]
            isOneToOne: false
            referencedRelation: "parking_permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_resident_dining_plan_id_fkey"
            columns: ["resident_dining_plan_id"]
            isOneToOne: false
            referencedRelation: "resident_dining_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_tuition_rate_id_fkey"
            columns: ["tuition_rate_id"]
            isOneToOne: false
            referencedRelation: "tuition_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      tuition_rates: {
        Row: {
          academic_year_id: string
          full_time_rate: number
          id: string
          per_credit_rate: number
          residency: string
        }
        Insert: {
          academic_year_id: string
          full_time_rate: number
          id?: string
          per_credit_rate: number
          residency: string
        }
        Update: {
          academic_year_id?: string
          full_time_rate?: number
          id?: string
          per_credit_rate?: number
          residency?: string
        }
        Relationships: [
          {
            foreignKeyName: "tuition_rates_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      tuition_rates_staging: {
        Row: {
          academic_year_id: string
          full_time_rate: number
          id: string
          per_credit_rate: number
          residency: string
          scraped_at: string
        }
        Insert: {
          academic_year_id: string
          full_time_rate: number
          id?: string
          per_credit_rate: number
          residency: string
          scraped_at?: string
        }
        Update: {
          academic_year_id?: string
          full_time_rate?: number
          id?: string
          per_credit_rate?: number
          residency?: string
          scraped_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tuition_rates_staging_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
