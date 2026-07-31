export type DeviceCondition = "nuevo" | "usado";
export type DeviceGrade = "A" | "B" | "C";
export type DeviceStatus = "in_stock" | "reserved" | "sold";
export type CurrencyCode = "USD" | "ARS";
export type PaymentType = "contado" | "cuotas";
export type WarrantyStatus = "abierto" | "en_reparacion" | "resuelto";
export type ReservationStatus = "activa" | "convertida" | "cancelada";

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          document_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["suppliers"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Row"]>;
        Relationships: [];
      };
      devices: {
        Row: {
          id: string;
          model: string;
          storage_gb: number | null;
          color: string | null;
          condition: DeviceCondition;
          grade: DeviceGrade | null;
          battery_health_pct: number | null;
          imei: string;
          serial_number: string | null;
          status: DeviceStatus;
          list_price_amount: number | null;
          list_price_currency: CurrencyCode | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["devices"]["Row"]> & {
          model: string;
          condition: DeviceCondition;
          imei: string;
        };
        Update: Partial<Database["public"]["Tables"]["devices"]["Row"]>;
        Relationships: [];
      };
      device_photos: {
        Row: {
          id: string;
          device_id: string;
          storage_path: string;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["device_photos"]["Row"]
        > & {
          device_id: string;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["device_photos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "device_photos_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
        ];
      };
      purchases: {
        Row: {
          id: string;
          device_id: string;
          supplier_id: string | null;
          trade_in_client_id: string | null;
          purchase_date: string;
          cost_amount: number;
          cost_currency: CurrencyCode;
          exchange_rate_snapshot: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["purchases"]["Row"]> & {
          device_id: string;
          cost_amount: number;
          cost_currency: CurrencyCode;
        };
        Update: Partial<Database["public"]["Tables"]["purchases"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "purchases_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: true;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_trade_in_client_id_fkey";
            columns: ["trade_in_client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          id: string;
          device_id: string;
          client_id: string | null;
          sale_date: string;
          sale_amount: number;
          sale_currency: CurrencyCode;
          exchange_rate_snapshot: number | null;
          payment_type: PaymentType;
          trade_in_device_id: string | null;
          trade_in_value_amount: number | null;
          trade_in_value_currency: CurrencyCode | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sales"]["Row"]> & {
          device_id: string;
          sale_amount: number;
          sale_currency: CurrencyCode;
        };
        Update: Partial<Database["public"]["Tables"]["sales"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "sales_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: true;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_trade_in_device_id_fkey";
            columns: ["trade_in_device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
        ];
      };
      installments: {
        Row: {
          id: string;
          sale_id: string;
          installment_number: number;
          due_date: string;
          amount: number;
          currency: CurrencyCode;
          paid: boolean;
          paid_date: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["installments"]["Row"]
        > & {
          sale_id: string;
          installment_number: number;
          due_date: string;
          amount: number;
          currency: CurrencyCode;
        };
        Update: Partial<Database["public"]["Tables"]["installments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "installments_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      reservations: {
        Row: {
          id: string;
          device_id: string;
          client_id: string | null;
          reservation_date: string;
          deposit_amount: number;
          deposit_currency: CurrencyCode;
          status: ReservationStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reservations"]["Row"]> & {
          device_id: string;
          deposit_amount: number;
          deposit_currency: CurrencyCode;
        };
        Update: Partial<Database["public"]["Tables"]["reservations"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "reservations_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: true;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      warranty_claims: {
        Row: {
          id: string;
          device_id: string;
          client_id: string | null;
          claim_date: string;
          description: string;
          status: WarrantyStatus;
          resolution_notes: string | null;
          resolved_date: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["warranty_claims"]["Row"]
        > & {
          device_id: string;
          description: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["warranty_claims"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "warranty_claims_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warranty_claims_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          key: string;
          value: unknown;
        };
        Insert: {
          key: string;
          value: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
