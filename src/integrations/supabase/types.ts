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
      inspection_reports: {
        Row: {
          adresa_objektu: string | null
          adresa_technika: string | null
          budova: string | null
          byly_zjisteny_zavady: boolean | null
          celkovy_posudek: string | null
          cislo_revize: string | null
          created_at: string
          datum_provedeni: string | null
          datum_ukonceni: string | null
          datum_vystaveni: string | null
          druh_revize: string | null
          druh_zeminy: string | null
          ekvipotencialni_pospojeni: string | null
          elektricka_zarizeni_na_strese: boolean | null
          elektricka_zarizeni_popis: string | null
          evidencni_cislo: string | null
          id: string
          krytina_strechy: string | null
          montazni_firma: string | null
          nazev_objektu: string | null
          objednavatel: string | null
          oblasti_kontroly: string[] | null
          pocasi_behem_revize: string | null
          pocet_pomocnych_jimacu: number | null
          pocet_stran: number | null
          pocet_svodu: number | null
          pocet_tycovych_jimacu: number | null
          pocet_vyhotoveni: number | null
          podklad_revize: string[] | null
          podpis_objednavatele: string | null
          podpis_technika: string | null
          popis_zavad: string | null
          poveternostni_podminky: string | null
          poznamka: string | null
          prechodovy_odpor: string | null
          predmet_revize: string | null
          projektova_dokumentace: boolean | null
          razitko_url: string | null
          revizni_technik: string | null
          rozdelovnik: string | null
          rozsah_revize: string | null
          soucast_revize_neni: string[] | null
          technicky_popis: string | null
          telefon_montazni_firmy: string | null
          telefon_technika: string | null
          termin_dalsi_revize: string | null
          termin_vizualni_kontroly: string | null
          trida_lps: string | null
          typ_jimaci_soustavy: string | null
          typ_strechy: string | null
          typ_uzemnovaci_soustavy: string | null
          updated_at: string
          vzdalenost_svodu: string | null
          zaver_revize: string | null
          zona_ochrany_lpz: string | null
        }
        Insert: {
          adresa_objektu?: string | null
          adresa_technika?: string | null
          budova?: string | null
          byly_zjisteny_zavady?: boolean | null
          celkovy_posudek?: string | null
          cislo_revize?: string | null
          created_at?: string
          datum_provedeni?: string | null
          datum_ukonceni?: string | null
          datum_vystaveni?: string | null
          druh_revize?: string | null
          druh_zeminy?: string | null
          ekvipotencialni_pospojeni?: string | null
          elektricka_zarizeni_na_strese?: boolean | null
          elektricka_zarizeni_popis?: string | null
          evidencni_cislo?: string | null
          id?: string
          krytina_strechy?: string | null
          montazni_firma?: string | null
          nazev_objektu?: string | null
          objednavatel?: string | null
          oblasti_kontroly?: string[] | null
          pocasi_behem_revize?: string | null
          pocet_pomocnych_jimacu?: number | null
          pocet_stran?: number | null
          pocet_svodu?: number | null
          pocet_tycovych_jimacu?: number | null
          pocet_vyhotoveni?: number | null
          podklad_revize?: string[] | null
          podpis_objednavatele?: string | null
          podpis_technika?: string | null
          popis_zavad?: string | null
          poveternostni_podminky?: string | null
          poznamka?: string | null
          prechodovy_odpor?: string | null
          predmet_revize?: string | null
          projektova_dokumentace?: boolean | null
          razitko_url?: string | null
          revizni_technik?: string | null
          rozdelovnik?: string | null
          rozsah_revize?: string | null
          soucast_revize_neni?: string[] | null
          technicky_popis?: string | null
          telefon_montazni_firmy?: string | null
          telefon_technika?: string | null
          termin_dalsi_revize?: string | null
          termin_vizualni_kontroly?: string | null
          trida_lps?: string | null
          typ_jimaci_soustavy?: string | null
          typ_strechy?: string | null
          typ_uzemnovaci_soustavy?: string | null
          updated_at?: string
          vzdalenost_svodu?: string | null
          zaver_revize?: string | null
          zona_ochrany_lpz?: string | null
        }
        Update: {
          adresa_objektu?: string | null
          adresa_technika?: string | null
          budova?: string | null
          byly_zjisteny_zavady?: boolean | null
          celkovy_posudek?: string | null
          cislo_revize?: string | null
          created_at?: string
          datum_provedeni?: string | null
          datum_ukonceni?: string | null
          datum_vystaveni?: string | null
          druh_revize?: string | null
          druh_zeminy?: string | null
          ekvipotencialni_pospojeni?: string | null
          elektricka_zarizeni_na_strese?: boolean | null
          elektricka_zarizeni_popis?: string | null
          evidencni_cislo?: string | null
          id?: string
          krytina_strechy?: string | null
          montazni_firma?: string | null
          nazev_objektu?: string | null
          objednavatel?: string | null
          oblasti_kontroly?: string[] | null
          pocasi_behem_revize?: string | null
          pocet_pomocnych_jimacu?: number | null
          pocet_stran?: number | null
          pocet_svodu?: number | null
          pocet_tycovych_jimacu?: number | null
          pocet_vyhotoveni?: number | null
          podklad_revize?: string[] | null
          podpis_objednavatele?: string | null
          podpis_technika?: string | null
          popis_zavad?: string | null
          poveternostni_podminky?: string | null
          poznamka?: string | null
          prechodovy_odpor?: string | null
          predmet_revize?: string | null
          projektova_dokumentace?: boolean | null
          razitko_url?: string | null
          revizni_technik?: string | null
          rozdelovnik?: string | null
          rozsah_revize?: string | null
          soucast_revize_neni?: string[] | null
          technicky_popis?: string | null
          telefon_montazni_firmy?: string | null
          telefon_technika?: string | null
          termin_dalsi_revize?: string | null
          termin_vizualni_kontroly?: string | null
          trida_lps?: string | null
          typ_jimaci_soustavy?: string | null
          typ_strechy?: string | null
          typ_uzemnovaci_soustavy?: string | null
          updated_at?: string
          vzdalenost_svodu?: string | null
          zaver_revize?: string | null
          zona_ochrany_lpz?: string | null
        }
        Relationships: []
      }
      report_instruments: {
        Row: {
          cislo_kalibrace: string | null
          id: string
          nazev_pristroje: string | null
          report_id: string
          sort_order: number | null
          typ_pristroje: string | null
          vyrobni_cislo: string | null
        }
        Insert: {
          cislo_kalibrace?: string | null
          id?: string
          nazev_pristroje?: string | null
          report_id: string
          sort_order?: number | null
          typ_pristroje?: string | null
          vyrobni_cislo?: string | null
        }
        Update: {
          cislo_kalibrace?: string | null
          id?: string
          nazev_pristroje?: string | null
          report_id?: string
          sort_order?: number | null
          typ_pristroje?: string | null
          vyrobni_cislo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_instruments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "inspection_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_measurements: {
        Row: {
          id: string
          odpor_zemnice: number | null
          oznaceni_svodu: string | null
          report_id: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          odpor_zemnice?: number | null
          oznaceni_svodu?: string | null
          report_id: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          odpor_zemnice?: number | null
          oznaceni_svodu?: string | null
          report_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_measurements_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "inspection_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_standards: {
        Row: {
          id: string
          norma: string
          report_id: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          norma: string
          report_id: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          norma?: string
          report_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_standards_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "inspection_reports"
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
