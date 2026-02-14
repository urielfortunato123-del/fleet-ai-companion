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
      fines: {
        Row: {
          amount: number
          auto_number: string | null
          code: string
          created_at: string
          date: string
          discount_amount: number | null
          driver_name: string
          due_date: string | null
          id: string
          infraction: string
          location: string
          plate: string
          points: number
          severity: string
          status: string
          unit: string
          vehicle_label: string
        }
        Insert: {
          amount?: number
          auto_number?: string | null
          code: string
          created_at?: string
          date?: string
          discount_amount?: number | null
          driver_name?: string
          due_date?: string | null
          id?: string
          infraction: string
          location?: string
          plate: string
          points?: number
          severity?: string
          status?: string
          unit?: string
          vehicle_label?: string
        }
        Update: {
          amount?: number
          auto_number?: string | null
          code?: string
          created_at?: string
          date?: string
          discount_amount?: number | null
          driver_name?: string
          due_date?: string | null
          id?: string
          infraction?: string
          location?: string
          plate?: string
          points?: number
          severity?: string
          status?: string
          unit?: string
          vehicle_label?: string
        }
        Relationships: []
      }
      fuel_logs: {
        Row: {
          cost_per_liter: number
          created_at: string
          date: string
          driver: string | null
          fuel_type: string
          id: string
          liters: number
          odometer: number
          plate: string
          station: string
          total_cost: number
          unit: string
          vehicle_label: string
        }
        Insert: {
          cost_per_liter?: number
          created_at?: string
          date?: string
          driver?: string | null
          fuel_type?: string
          id?: string
          liters?: number
          odometer?: number
          plate: string
          station?: string
          total_cost?: number
          unit?: string
          vehicle_label?: string
        }
        Update: {
          cost_per_liter?: number
          created_at?: string
          date?: string
          driver?: string | null
          fuel_type?: string
          id?: string
          liters?: number
          odometer?: number
          plate?: string
          station?: string
          total_cost?: number
          unit?: string
          vehicle_label?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          code: string
          created_at: string
          damage_estimate: number
          date: string
          description: string
          driver_name: string
          has_injury: boolean
          id: string
          insurance_claim: string | null
          location: string
          notes: string | null
          plate: string
          police_report: string | null
          resolved_at: string | null
          severity: string
          status: string
          time: string
          type: string
          unit: string
          vehicle_label: string
        }
        Insert: {
          code: string
          created_at?: string
          damage_estimate?: number
          date?: string
          description?: string
          driver_name?: string
          has_injury?: boolean
          id?: string
          insurance_claim?: string | null
          location?: string
          notes?: string | null
          plate: string
          police_report?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          time?: string
          type?: string
          unit?: string
          vehicle_label?: string
        }
        Update: {
          code?: string
          created_at?: string
          damage_estimate?: number
          date?: string
          description?: string
          driver_name?: string
          has_injury?: boolean
          id?: string
          insurance_claim?: string | null
          location?: string
          notes?: string | null
          plate?: string
          police_report?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          time?: string
          type?: string
          unit?: string
          vehicle_label?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tires: {
        Row: {
          brand: string
          cost_unit: number
          created_at: string
          current_km: number
          depth_mm: number
          id: string
          installed_at: string | null
          installed_km: number
          life_expected_km: number
          model: string
          plate: string
          position: string
          size: string
          status: string
          unit: string
        }
        Insert: {
          brand: string
          cost_unit?: number
          created_at?: string
          current_km?: number
          depth_mm?: number
          id?: string
          installed_at?: string | null
          installed_km?: number
          life_expected_km?: number
          model: string
          plate: string
          position: string
          size?: string
          status?: string
          unit?: string
        }
        Update: {
          brand?: string
          cost_unit?: number
          created_at?: string
          current_km?: number
          depth_mm?: number
          id?: string
          installed_at?: string | null
          installed_km?: number
          life_expected_km?: number
          model?: string
          plate?: string
          position?: string
          size?: string
          status?: string
          unit?: string
        }
        Relationships: []
      }
      vehicle_documents: {
        Row: {
          code: string
          cost: number | null
          created_at: string
          description: string
          doc_type: string
          expiry_date: string
          id: string
          issue_date: string
          notes: string | null
          plate: string
          responsible: string
          status: string
          unit: string
          vehicle_label: string
        }
        Insert: {
          code: string
          cost?: number | null
          created_at?: string
          description?: string
          doc_type: string
          expiry_date: string
          id?: string
          issue_date?: string
          notes?: string | null
          plate: string
          responsible?: string
          status?: string
          unit?: string
          vehicle_label?: string
        }
        Update: {
          code?: string
          cost?: number | null
          created_at?: string
          description?: string
          doc_type?: string
          expiry_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          plate?: string
          responsible?: string
          status?: string
          unit?: string
          vehicle_label?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string
          cost_month: number
          created_at: string
          current_km: number
          driver: string | null
          fuel_avg: number
          health_score: number
          id: string
          last_maintenance: string | null
          model: string
          next_maintenance: string | null
          plate: string
          region: string
          status: string
          unit: string
          updated_at: string
          year: number
        }
        Insert: {
          brand: string
          cost_month?: number
          created_at?: string
          current_km?: number
          driver?: string | null
          fuel_avg?: number
          health_score?: number
          id?: string
          last_maintenance?: string | null
          model: string
          next_maintenance?: string | null
          plate: string
          region?: string
          status?: string
          unit?: string
          updated_at?: string
          year: number
        }
        Update: {
          brand?: string
          cost_month?: number
          created_at?: string
          current_km?: number
          driver?: string | null
          fuel_avg?: number
          health_score?: number
          id?: string
          last_maintenance?: string | null
          model?: string
          next_maintenance?: string | null
          plate?: string
          region?: string
          status?: string
          unit?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          closed_at: string | null
          code: string
          cost_total: number
          created_at: string
          description: string
          id: string
          km_at_service: number
          opened_at: string
          plate: string
          priority: string
          status: string
          supplier: string
          type: string
          unit: string
          vehicle_id: string | null
          vehicle_label: string
        }
        Insert: {
          closed_at?: string | null
          code: string
          cost_total?: number
          created_at?: string
          description?: string
          id?: string
          km_at_service?: number
          opened_at?: string
          plate: string
          priority?: string
          status?: string
          supplier?: string
          type?: string
          unit?: string
          vehicle_id?: string | null
          vehicle_label?: string
        }
        Update: {
          closed_at?: string | null
          code?: string
          cost_total?: number
          created_at?: string
          description?: string
          id?: string
          km_at_service?: number
          opened_at?: string
          plate?: string
          priority?: string
          status?: string
          supplier?: string
          type?: string
          unit?: string
          vehicle_id?: string | null
          vehicle_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
  public: {
    Enums: {},
  },
} as const
