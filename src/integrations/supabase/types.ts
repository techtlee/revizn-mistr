export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      inspection_reports: {
        Row: {
          id: string
          ev_cislo_zpravy: string | null
          vytisk_cislo: number | null
          pocet_listu: number | null
          pocet_priloh: number | null
          typ_revize: string | null
          datum_zahajeni: string | null
          datum_ukonceni: string | null
          datum_vypracovani: string | null
          revizni_technik: string | null
          adresa_technika: string | null
          ev_cislo_osvedceni: string | null
          ev_cislo_opravneni: string | null
          revizi_pritomni: string | null
          nazev_adresa_objektu: string | null
          objednatel_revize: string | null
          majitel_objektu: string | null
          provozovatel_objektu: string | null
          montazni_firma_nazev: string | null
          montazni_firma_ico: string | null
          montazni_firma_ev_opravneni: string | null
          katastr_map_url: string | null
          katastr_annotations: string | null
          rozsah_vnejsi_ochrana: boolean | null
          rozsah_vnitrni_ochrana: boolean | null
          poveternostni_podminky: string | null
          typ_objektu: string | null
          typ_objektu_jiny: string | null
          el_zarizeni_na_strese: string | null
          trida_lps: string | null
          typ_jimaci_soustavy: string[] | null
          velikost_ok_mrizove: string | null
          vyska_tycoveho_jimace: string | null
          material_strechy: string | null
          typ_zemnci_soustavy: string | null
          druh_zeminy: string[] | null
          stav_zeminy: string[] | null
          zony_ochrany_lpz: string[] | null
          potencialove_vyrovnani: string[] | null
          predmet_revize: string | null
          predmet_revize_nebylo: string | null
          rozsah_vnejsi: boolean | null
          rozsah_vnitrni: boolean | null
          rozsah_staticka: boolean | null
          rozsah_uzemneni: boolean | null
          predlozene_doklady: Json | null
          technicky_popis: string | null
          inspection_checklist: Json | null
          metoda_mereni: string | null
          zjistene_zavady: string | null
          zaver_text: string | null
          stav_od_posledni_revize: string | null
          celkovy_posudek: string | null
          termin_lps_kriticke: string | null
          termin_lps_ostatni: string | null
          termin_lps_vybuch: string | null
          misto_podpisu: string | null
          datum_predani: string | null
          podpis_objednavatele: string | null
          podpis_technika: string | null
          razitko_url: string | null
          rozdelovnik: string | null
          seznam_priloh: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ev_cislo_zpravy?: string | null
          vytisk_cislo?: number | null
          pocet_listu?: number | null
          pocet_priloh?: number | null
          typ_revize?: string | null
          datum_zahajeni?: string | null
          datum_ukonceni?: string | null
          datum_vypracovani?: string | null
          revizni_technik?: string | null
          adresa_technika?: string | null
          ev_cislo_osvedceni?: string | null
          ev_cislo_opravneni?: string | null
          revizi_pritomni?: string | null
          nazev_adresa_objektu?: string | null
          objednatel_revize?: string | null
          majitel_objektu?: string | null
          provozovatel_objektu?: string | null
          montazni_firma_nazev?: string | null
          montazni_firma_ico?: string | null
          montazni_firma_ev_opravneni?: string | null
          katastr_map_url?: string | null
          katastr_annotations?: string | null
          rozsah_vnejsi_ochrana?: boolean | null
          rozsah_vnitrni_ochrana?: boolean | null
          poveternostni_podminky?: string | null
          typ_objektu?: string | null
          typ_objektu_jiny?: string | null
          el_zarizeni_na_strese?: string | null
          trida_lps?: string | null
          typ_jimaci_soustavy?: string[] | null
          velikost_ok_mrizove?: string | null
          vyska_tycoveho_jimace?: string | null
          material_strechy?: string | null
          typ_zemnci_soustavy?: string | null
          druh_zeminy?: string[] | null
          stav_zeminy?: string[] | null
          zony_ochrany_lpz?: string[] | null
          potencialove_vyrovnani?: string[] | null
          predmet_revize?: string | null
          predmet_revize_nebylo?: string | null
          rozsah_vnejsi?: boolean | null
          rozsah_vnitrni?: boolean | null
          rozsah_staticka?: boolean | null
          rozsah_uzemneni?: boolean | null
          predlozene_doklady?: Json | null
          technicky_popis?: string | null
          inspection_checklist?: Json | null
          metoda_mereni?: string | null
          zjistene_zavady?: string | null
          zaver_text?: string | null
          stav_od_posledni_revize?: string | null
          celkovy_posudek?: string | null
          termin_lps_kriticke?: string | null
          termin_lps_ostatni?: string | null
          termin_lps_vybuch?: string | null
          misto_podpisu?: string | null
          datum_predani?: string | null
          podpis_objednavatele?: string | null
          podpis_technika?: string | null
          razitko_url?: string | null
          rozdelovnik?: string | null
          seznam_priloh?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ev_cislo_zpravy?: string | null
          vytisk_cislo?: number | null
          pocet_listu?: number | null
          pocet_priloh?: number | null
          typ_revize?: string | null
          datum_zahajeni?: string | null
          datum_ukonceni?: string | null
          datum_vypracovani?: string | null
          revizni_technik?: string | null
          adresa_technika?: string | null
          ev_cislo_osvedceni?: string | null
          ev_cislo_opravneni?: string | null
          revizi_pritomni?: string | null
          nazev_adresa_objektu?: string | null
          objednatel_revize?: string | null
          majitel_objektu?: string | null
          provozovatel_objektu?: string | null
          montazni_firma_nazev?: string | null
          montazni_firma_ico?: string | null
          montazni_firma_ev_opravneni?: string | null
          katastr_map_url?: string | null
          katastr_annotations?: string | null
          rozsah_vnejsi_ochrana?: boolean | null
          rozsah_vnitrni_ochrana?: boolean | null
          poveternostni_podminky?: string | null
          typ_objektu?: string | null
          typ_objektu_jiny?: string | null
          el_zarizeni_na_strese?: string | null
          trida_lps?: string | null
          typ_jimaci_soustavy?: string[] | null
          velikost_ok_mrizove?: string | null
          vyska_tycoveho_jimace?: string | null
          material_strechy?: string | null
          typ_zemnci_soustavy?: string | null
          druh_zeminy?: string[] | null
          stav_zeminy?: string[] | null
          zony_ochrany_lpz?: string[] | null
          potencialove_vyrovnani?: string[] | null
          predmet_revize?: string | null
          predmet_revize_nebylo?: string | null
          rozsah_vnejsi?: boolean | null
          rozsah_vnitrni?: boolean | null
          rozsah_staticka?: boolean | null
          rozsah_uzemneni?: boolean | null
          predlozene_doklady?: Json | null
          technicky_popis?: string | null
          inspection_checklist?: Json | null
          metoda_mereni?: string | null
          zjistene_zavady?: string | null
          zaver_text?: string | null
          stav_od_posledni_revize?: string | null
          celkovy_posudek?: string | null
          termin_lps_kriticke?: string | null
          termin_lps_ostatni?: string | null
          termin_lps_vybuch?: string | null
          misto_podpisu?: string | null
          datum_predani?: string | null
          podpis_objednavatele?: string | null
          podpis_technika?: string | null
          razitko_url?: string | null
          rozdelovnik?: string | null
          seznam_priloh?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_form_settings: {
        Row: {
          user_id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      report_spd_devices: {
        Row: {
          id: string
          report_id: string
          vyrobce: string | null
          typove_oznaceni: string | null
          misto_instalace: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          report_id: string
          vyrobce?: string | null
          typove_oznaceni?: string | null
          misto_instalace?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          report_id?: string
          vyrobce?: string | null
          typove_oznaceni?: string | null
          misto_instalace?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_spd_devices_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "inspection_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_instruments: {
        Row: {
          id: string
          report_id: string
          nazev_pristroje: string | null
          typ_pristroje: string | null
          vyrobni_cislo: string | null
          cislo_kalibracniho_listu: string | null
          datum_kalibrace: string | null
          firma_kalibrace: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          report_id: string
          nazev_pristroje?: string | null
          typ_pristroje?: string | null
          vyrobni_cislo?: string | null
          cislo_kalibracniho_listu?: string | null
          datum_kalibrace?: string | null
          firma_kalibrace?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          report_id?: string
          nazev_pristroje?: string | null
          typ_pristroje?: string | null
          vyrobni_cislo?: string | null
          cislo_kalibracniho_listu?: string | null
          datum_kalibrace?: string | null
          firma_kalibrace?: string | null
          sort_order?: number | null
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
          report_id: string
          oznaceni_zkusebni_svorky: string | null
          odpor_s_vodicem: number | null
          odpor_bez_vodice: number | null
          prechodovy_odpor: number | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          report_id: string
          oznaceni_zkusebni_svorky?: string | null
          odpor_s_vodicem?: number | null
          odpor_bez_vodice?: number | null
          prechodovy_odpor?: number | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          report_id?: string
          oznaceni_zkusebni_svorky?: string | null
          odpor_s_vodicem?: number | null
          odpor_bez_vodice?: number | null
          prechodovy_odpor?: number | null
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
