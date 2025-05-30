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
      areas_planta: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      auditoria_sets: {
        Row: {
          area: string
          auditoria_id: string
          created_at: string
          evidencia: string | null
          foto_urls: string[] | null
          id: string
          levantamiento: string | null
          responsable: string | null
          updated_at: string
        }
        Insert: {
          area: string
          auditoria_id: string
          created_at?: string
          evidencia?: string | null
          foto_urls?: string[] | null
          id?: string
          levantamiento?: string | null
          responsable?: string | null
          updated_at?: string
        }
        Update: {
          area?: string
          auditoria_id?: string
          created_at?: string
          evidencia?: string | null
          foto_urls?: string[] | null
          id?: string
          levantamiento?: string | null
          responsable?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_sets_auditoria_id_fkey"
            columns: ["auditoria_id"]
            isOneToOne: false
            referencedRelation: "auditorias"
            referencedColumns: ["id"]
          },
        ]
      }
      auditorias: {
        Row: {
          auditor: string
          created_at: string
          fecha: string
          fecha_compromiso: string | null
          id: string
          planta_id: number | null
          status: string | null
          titulo_documento: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auditor: string
          created_at?: string
          fecha: string
          fecha_compromiso?: string | null
          id?: string
          planta_id?: number | null
          status?: string | null
          titulo_documento: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auditor?: string
          created_at?: string
          fecha?: string
          fecha_compromiso?: string | null
          id?: string
          planta_id?: number | null
          status?: string | null
          titulo_documento?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditorias_planta_id_fkey"
            columns: ["planta_id"]
            isOneToOne: false
            referencedRelation: "plantas"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueos: {
        Row: {
          area_planta_id: number
          cantidad: number
          created_at: string
          fecha: string
          id: string
          lote: number
          motivo: string
          planta_id: number
          producto_id: number
          quien_bloqueo: string
          turno_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          area_planta_id: number
          cantidad: number
          created_at?: string
          fecha: string
          id?: string
          lote: number
          motivo: string
          planta_id: number
          producto_id: number
          quien_bloqueo: string
          turno_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          area_planta_id?: number
          cantidad?: number
          created_at?: string
          fecha?: string
          id?: string
          lote?: number
          motivo?: string
          planta_id?: number
          producto_id?: number
          quien_bloqueo?: string
          turno_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloqueos_area_planta_id_fkey"
            columns: ["area_planta_id"]
            isOneToOne: false
            referencedRelation: "areas_planta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueos_planta_id_fkey"
            columns: ["planta_id"]
            isOneToOne: false
            referencedRelation: "plantas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueos_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      plantas: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          gerencia: string | null
          id: string
          name: string
          position: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gerencia?: string | null
          id: string
          name: string
          position: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gerencia?: string | null
          id?: string
          name?: string
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      turnos: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
