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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          address: string | null
          city_id: string | null
          commission_rate: number | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city_id?: string | null
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string | null
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      another_hotels: {
        Row: {
          address: string | null
          city_id: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          packages: string | null
          phone: string | null
          rating: number | null
          room_types: string | null
          state: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          city_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          packages?: string | null
          phone?: string | null
          rating?: number | null
          room_types?: string | null
          state?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          packages?: string | null
          phone?: string | null
          rating?: number | null
          room_types?: string | null
          state?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "another_hotels_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoice_items: {
        Row: {
          amount: number | null
          cgst_amount: number | null
          cgst_percent: number | null
          created_at: string
          hsn_code: string | null
          id: string
          invoice_id: string
          is_custom: boolean | null
          item_date: string | null
          particulars: string
          quantity: number | null
          rate: number | null
          sgst_amount: number | null
          sgst_percent: number | null
          sr_no: number
          total: number | null
        }
        Insert: {
          amount?: number | null
          cgst_amount?: number | null
          cgst_percent?: number | null
          created_at?: string
          hsn_code?: string | null
          id?: string
          invoice_id: string
          is_custom?: boolean | null
          item_date?: string | null
          particulars: string
          quantity?: number | null
          rate?: number | null
          sgst_amount?: number | null
          sgst_percent?: number | null
          sr_no: number
          total?: number | null
        }
        Update: {
          amount?: number | null
          cgst_amount?: number | null
          cgst_percent?: number | null
          created_at?: string
          hsn_code?: string | null
          id?: string
          invoice_id?: string
          is_custom?: boolean | null
          item_date?: string | null
          particulars?: string
          quantity?: number | null
          rate?: number | null
          sgst_amount?: number | null
          sgst_percent?: number | null
          sr_no?: number
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount_in_words: string | null
          booking_id: string | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_gstin: string | null
          customer_name: string | null
          customer_pan: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          subtotal: number | null
          total_amount: number | null
          total_cgst: number | null
          total_sgst: number | null
          updated_at: string
        }
        Insert: {
          amount_in_words?: string | null
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name?: string | null
          customer_pan?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          subtotal?: number | null
          total_amount?: number | null
          total_cgst?: number | null
          total_sgst?: number | null
          updated_at?: string
        }
        Update: {
          amount_in_words?: string | null
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name?: string | null
          customer_pan?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          subtotal?: number | null
          total_amount?: number | null
          total_cgst?: number | null
          total_sgst?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          adults: number | null
          agent_commission: number | null
          agent_id: string | null
          booking_number: string
          booking_type: string | null
          check_in_date: string
          check_out_date: string
          cheque_no: string | null
          children: number | null
          contact_no: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          due_amount: number | null
          email: string | null
          enquiry_id: string | null
          guest_id: string | null
          hold_until: string | null
          id: string
          include_additional_vehicle: boolean | null
          include_another_hotel: boolean | null
          include_booking: boolean | null
          include_delhi_manali: boolean | null
          include_group_expenses: boolean | null
          include_manali_delhi: boolean | null
          include_safari: boolean | null
          is_hold: boolean | null
          notes: string | null
          paid_amount: number | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          reference: string | null
          reference_email: string | null
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          adults?: number | null
          agent_commission?: number | null
          agent_id?: string | null
          booking_number: string
          booking_type?: string | null
          check_in_date: string
          check_out_date: string
          cheque_no?: string | null
          children?: number | null
          contact_no?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          due_amount?: number | null
          email?: string | null
          enquiry_id?: string | null
          guest_id?: string | null
          hold_until?: string | null
          id?: string
          include_additional_vehicle?: boolean | null
          include_another_hotel?: boolean | null
          include_booking?: boolean | null
          include_delhi_manali?: boolean | null
          include_group_expenses?: boolean | null
          include_manali_delhi?: boolean | null
          include_safari?: boolean | null
          is_hold?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          reference?: string | null
          reference_email?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          adults?: number | null
          agent_commission?: number | null
          agent_id?: string | null
          booking_number?: string
          booking_type?: string | null
          check_in_date?: string
          check_out_date?: string
          cheque_no?: string | null
          children?: number | null
          contact_no?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          due_amount?: number | null
          email?: string | null
          enquiry_id?: string | null
          guest_id?: string | null
          hold_until?: string | null
          id?: string
          include_additional_vehicle?: boolean | null
          include_another_hotel?: boolean | null
          include_booking?: boolean | null
          include_delhi_manali?: boolean | null
          include_group_expenses?: boolean | null
          include_manali_delhi?: boolean | null
          include_safari?: boolean | null
          is_hold?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          reference?: string | null
          reference_email?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellations: {
        Row: {
          booking_id: string | null
          cancellation_charges: number | null
          cancellation_date: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          refund_amount: number | null
        }
        Insert: {
          booking_id?: string | null
          cancellation_charges?: number | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          refund_amount?: number | null
        }
        Update: {
          booking_id?: string | null
          cancellation_charges?: number | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          refund_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellations_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          name: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          account_no: string | null
          address: string | null
          bank_name: string | null
          branch_name: string | null
          company_name: string
          contact_no: string | null
          created_at: string
          gstin: string | null
          hsn_code: string | null
          id: string
          ifsc_code: string | null
          logo_url: string | null
          pan_no: string | null
          sub_title: string | null
          terms_conditions: string | null
          updated_at: string
        }
        Insert: {
          account_no?: string | null
          address?: string | null
          bank_name?: string | null
          branch_name?: string | null
          company_name?: string
          contact_no?: string | null
          created_at?: string
          gstin?: string | null
          hsn_code?: string | null
          id?: string
          ifsc_code?: string | null
          logo_url?: string | null
          pan_no?: string | null
          sub_title?: string | null
          terms_conditions?: string | null
          updated_at?: string
        }
        Update: {
          account_no?: string | null
          address?: string | null
          bank_name?: string | null
          branch_name?: string | null
          company_name?: string
          contact_no?: string | null
          created_at?: string
          gstin?: string | null
          hsn_code?: string | null
          id?: string
          ifsc_code?: string | null
          logo_url?: string | null
          pan_no?: string | null
          sub_title?: string | null
          terms_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          adults: number | null
          agent_id: string | null
          budget_amount: number | null
          check_in_date: string | null
          check_out_date: string | null
          children: number | null
          created_at: string | null
          created_by: string | null
          destination_city_id: string | null
          enquiry_number: string
          guest_id: string | null
          id: string
          notes: string | null
          rooms_required: number | null
          special_requests: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          adults?: number | null
          agent_id?: string | null
          budget_amount?: number | null
          check_in_date?: string | null
          check_out_date?: string | null
          children?: number | null
          created_at?: string | null
          created_by?: string | null
          destination_city_id?: string | null
          enquiry_number: string
          guest_id?: string | null
          id?: string
          notes?: string | null
          rooms_required?: number | null
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          adults?: number | null
          agent_id?: string | null
          budget_amount?: number | null
          check_in_date?: string | null
          check_out_date?: string | null
          children?: number | null
          created_at?: string | null
          created_by?: string | null
          destination_city_id?: string | null
          enquiry_number?: string
          guest_id?: string | null
          id?: string
          notes?: string | null
          rooms_required?: number | null
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_destination_city_id_fkey"
            columns: ["destination_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      food_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      food_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          gst_percentage: number | null
          hsn_code: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_vegetarian: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "food_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipt_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          grn_number: string
          id: string
          notes: string | null
          po_id: string
          receipt_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          grn_number: string
          id?: string
          notes?: string | null
          po_id: string
          receipt_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          grn_number?: string
          id?: string
          notes?: string | null
          po_id?: string
          receipt_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_notes_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      grn_items: {
        Row: {
          accepted_quantity: number | null
          created_at: string | null
          damaged_quantity: number | null
          grn_id: string
          id: string
          item_id: string
          notes: string | null
          po_item_id: string
          received_quantity: number
        }
        Insert: {
          accepted_quantity?: number | null
          created_at?: string | null
          damaged_quantity?: number | null
          grn_id: string
          id?: string
          item_id: string
          notes?: string | null
          po_item_id: string
          received_quantity?: number
        }
        Update: {
          accepted_quantity?: number | null
          created_at?: string | null
          damaged_quantity?: number | null
          grn_id?: string
          id?: string
          item_id?: string
          notes?: string | null
          po_item_id?: string
          received_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "grn_items_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "purchase_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_items_po_item_id_fkey"
            columns: ["po_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      group_expenses: {
        Row: {
          amount: number
          booking_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          expense_date: string | null
          id: string
          notes: string | null
          paid_by: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          paid_by?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          paid_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_expenses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          address: string | null
          city_id: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          id_proof_number: string | null
          id_proof_type: string | null
          last_name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          id_proof_number?: string | null
          id_proof_type?: string | null
          last_name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          id_proof_number?: string | null
          id_proof_type?: string | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_bookings: {
        Row: {
          booking_id: string | null
          check_in_date: string
          check_out_date: string
          created_at: string | null
          due_amount: number | null
          hotel_id: string | null
          id: string
          notes: string | null
          number_of_rooms: number | null
          own_hotel_id: string | null
          paid_amount: number | null
          room_rate: number | null
          room_type: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          check_in_date: string
          check_out_date: string
          created_at?: string | null
          due_amount?: number | null
          hotel_id?: string | null
          id?: string
          notes?: string | null
          number_of_rooms?: number | null
          own_hotel_id?: string | null
          paid_amount?: number | null
          room_rate?: number | null
          room_type?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          check_in_date?: string
          check_out_date?: string
          created_at?: string | null
          due_amount?: number | null
          hotel_id?: string | null
          id?: string
          notes?: string | null
          number_of_rooms?: number | null
          own_hotel_id?: string | null
          paid_amount?: number | null
          room_rate?: number | null
          room_type?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "another_hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_own_hotel_id_fkey"
            columns: ["own_hotel_id"]
            isOneToOne: false
            referencedRelation: "own_hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          current_stock: number | null
          id: string
          item_id: string
          last_updated: string | null
        }
        Insert: {
          current_stock?: number | null
          id?: string
          item_id: string
          last_updated?: string | null
        }
        Update: {
          current_stock?: number | null
          id?: string
          item_id?: string
          last_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "purchase_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_history: {
        Row: {
          change_type: string
          created_at: string | null
          created_by: string | null
          grn_id: string | null
          id: string
          item_id: string
          new_stock: number | null
          notes: string | null
          previous_stock: number | null
          quantity_change: number
        }
        Insert: {
          change_type: string
          created_at?: string | null
          created_by?: string | null
          grn_id?: string | null
          id?: string
          item_id: string
          new_stock?: number | null
          notes?: string | null
          previous_stock?: number | null
          quantity_change: number
        }
        Update: {
          change_type?: string
          created_at?: string | null
          created_by?: string | null
          grn_id?: string | null
          id?: string
          item_id?: string
          new_stock?: number | null
          notes?: string | null
          previous_stock?: number | null
          quantity_change?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "purchase_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          account_no: string | null
          address: string | null
          bank_name: string | null
          branch_name: string | null
          company_name: string
          contact_no: string | null
          created_at: string
          gstin: string | null
          hsn_code: string | null
          id: string
          ifsc_code: string | null
          is_default: boolean | null
          logo_url: string | null
          pan_no: string | null
          sub_title: string | null
          template_name: string
          terms_conditions: string | null
          updated_at: string
        }
        Insert: {
          account_no?: string | null
          address?: string | null
          bank_name?: string | null
          branch_name?: string | null
          company_name: string
          contact_no?: string | null
          created_at?: string
          gstin?: string | null
          hsn_code?: string | null
          id?: string
          ifsc_code?: string | null
          is_default?: boolean | null
          logo_url?: string | null
          pan_no?: string | null
          sub_title?: string | null
          template_name: string
          terms_conditions?: string | null
          updated_at?: string
        }
        Update: {
          account_no?: string | null
          address?: string | null
          bank_name?: string | null
          branch_name?: string | null
          company_name?: string
          contact_no?: string | null
          created_at?: string
          gstin?: string | null
          hsn_code?: string | null
          id?: string
          ifsc_code?: string | null
          is_default?: boolean | null
          logo_url?: string | null
          pan_no?: string | null
          sub_title?: string | null
          template_name?: string
          terms_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      own_hotels: {
        Row: {
          address: string | null
          amenities: string[] | null
          city_id: string | null
          contact_person: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          city_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          city_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "own_hotels_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          booking_id: string | null
          city_id: string | null
          created_at: string | null
          created_by: string | null
          hotel_id: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_mode: string | null
          payment_type: string | null
          reference_number: string | null
          transporter_id: string | null
        }
        Insert: {
          amount: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          city_id?: string | null
          created_at?: string | null
          created_by?: string | null
          hotel_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_mode?: string | null
          payment_type?: string | null
          reference_number?: string | null
          transporter_id?: string | null
        }
        Update: {
          amount?: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          city_id?: string | null
          created_at?: string | null
          created_by?: string | null
          hotel_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_mode?: string | null
          payment_type?: string | null
          reference_number?: string | null
          transporter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "another_hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "transporters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          plain_password: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          plain_password?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          plain_password?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      purchase_invoices: {
        Row: {
          balance_amount: number | null
          cgst_amount: number | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          grn_id: string | null
          id: string
          igst_amount: number | null
          invoice_date: string | null
          invoice_number: string
          notes: string | null
          paid_amount: number | null
          payment_status:
            | Database["public"]["Enums"]["invoice_payment_status"]
            | null
          po_id: string
          sgst_amount: number | null
          subtotal: number | null
          total_amount: number | null
          updated_at: string | null
          vendor_id: string
          vendor_invoice_number: string | null
        }
        Insert: {
          balance_amount?: number | null
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          grn_id?: string | null
          id?: string
          igst_amount?: number | null
          invoice_date?: string | null
          invoice_number: string
          notes?: string | null
          paid_amount?: number | null
          payment_status?:
            | Database["public"]["Enums"]["invoice_payment_status"]
            | null
          po_id: string
          sgst_amount?: number | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vendor_id: string
          vendor_invoice_number?: string | null
        }
        Update: {
          balance_amount?: number | null
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          grn_id?: string | null
          id?: string
          igst_amount?: number | null
          invoice_date?: string | null
          invoice_number?: string
          notes?: string | null
          paid_amount?: number | null
          payment_status?:
            | Database["public"]["Enums"]["invoice_payment_status"]
            | null
          po_id?: string
          sgst_amount?: number | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vendor_id?: string
          vendor_invoice_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          created_at: string | null
          created_by: string | null
          description: string | null
          gst_percentage: number | null
          hsn_code: string | null
          id: string
          is_active: boolean | null
          item_name: string
          reorder_level: number | null
          unit: Database["public"]["Enums"]["item_unit"]
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["item_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          item_name: string
          reorder_level?: number | null
          unit?: Database["public"]["Enums"]["item_unit"]
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          item_name?: string
          reorder_level?: number | null
          unit?: Database["public"]["Enums"]["item_unit"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          gst_amount: number | null
          gst_percentage: number | null
          id: string
          item_id: string
          po_id: string
          pr_id: string | null
          quantity: number
          rate: number
          received_quantity: number | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          gst_amount?: number | null
          gst_percentage?: number | null
          id?: string
          item_id: string
          po_id: string
          pr_id?: string | null
          quantity?: number
          rate?: number
          received_quantity?: number | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          gst_amount?: number | null
          gst_percentage?: number | null
          id?: string
          item_id?: string
          po_id?: string
          pr_id?: string | null
          quantity?: number
          rate?: number
          received_quantity?: number | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "purchase_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          po_number: string
          status: Database["public"]["Enums"]["po_status"] | null
          subtotal: number | null
          total_amount: number | null
          total_gst: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          po_number: string
          status?: Database["public"]["Enums"]["po_status"] | null
          subtotal?: number | null
          total_amount?: number | null
          total_gst?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          status?: Database["public"]["Enums"]["po_status"] | null
          subtotal?: number | null
          total_amount?: number | null
          total_gst?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string | null
          payment_mode: string
          reference_number: string | null
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string | null
          payment_mode: string
          reference_number?: string | null
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string | null
          payment_mode?: string
          reference_number?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          department: Database["public"]["Enums"]["department_type"]
          id: string
          item_id: string
          pr_number: string
          priority: Database["public"]["Enums"]["priority_level"] | null
          quantity: number
          rejection_reason: string | null
          remarks: string | null
          status: Database["public"]["Enums"]["pr_status"] | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          department: Database["public"]["Enums"]["department_type"]
          id?: string
          item_id: string
          pr_number: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          quantity?: number
          rejection_reason?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["pr_status"] | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: Database["public"]["Enums"]["department_type"]
          id?: string
          item_id?: string
          pr_number?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          quantity?: number
          rejection_reason?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["pr_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "purchase_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          author: string | null
          created_at: string
          created_by: string | null
          id: string
          text: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          text: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          booking_id: string | null
          cancellation_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          processed_by: string | null
          reference_number: string | null
          refund_amount: number
          refund_date: string | null
          refund_mode: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          cancellation_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          reference_number?: string | null
          refund_amount: number
          refund_date?: string | null
          refund_mode?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          cancellation_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          reference_number?: string | null
          refund_amount?: number
          refund_date?: string | null
          refund_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_cancellation_id_fkey"
            columns: ["cancellation_id"]
            isOneToOne: false
            referencedRelation: "cancellations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_invoices: {
        Row: {
          cgst_amount: number | null
          created_at: string | null
          created_by: string | null
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number | null
          id: string
          invoice_date: string | null
          invoice_number: string
          notes: string | null
          order_id: string | null
          payment_mode: string | null
          payment_status: string | null
          sgst_amount: number | null
          subtotal: number | null
          total_amount: number | null
        }
        Insert: {
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number: string
          notes?: string | null
          order_id?: string | null
          payment_mode?: string | null
          payment_status?: string | null
          sgst_amount?: number | null
          subtotal?: number | null
          total_amount?: number | null
        }
        Update: {
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          notes?: string | null
          order_id?: string | null
          payment_mode?: string | null
          payment_status?: string | null
          sgst_amount?: number | null
          subtotal?: number | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_order_items: {
        Row: {
          cgst_amount: number | null
          created_at: string | null
          food_item_id: string | null
          food_item_name: string
          gst_percentage: number | null
          id: string
          order_id: string
          quantity: number
          sgst_amount: number | null
          special_instructions: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          cgst_amount?: number | null
          created_at?: string | null
          food_item_id?: string | null
          food_item_name: string
          gst_percentage?: number | null
          id?: string
          order_id: string
          quantity?: number
          sgst_amount?: number | null
          special_instructions?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          cgst_amount?: number | null
          created_at?: string | null
          food_item_id?: string | null
          food_item_name?: string
          gst_percentage?: number | null
          id?: string
          order_id?: string
          quantity?: number
          sgst_amount?: number | null
          special_instructions?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_order_items_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_orders: {
        Row: {
          booking_id: string | null
          cgst_amount: number | null
          created_at: string | null
          created_by: string | null
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          gst_percentage: number | null
          gst_type: string | null
          id: string
          order_number: string
          order_type: string | null
          room_number: string | null
          sgst_amount: number | null
          special_instructions: string | null
          status: string | null
          subtotal: number | null
          table_id: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          gst_percentage?: number | null
          gst_type?: string | null
          id?: string
          order_number: string
          order_type?: string | null
          room_number?: string | null
          sgst_amount?: number | null
          special_instructions?: string | null
          status?: string | null
          subtotal?: number | null
          table_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          gst_percentage?: number | null
          gst_type?: string | null
          id?: string
          order_number?: string
          order_type?: string | null
          room_number?: string | null
          sgst_amount?: number | null
          special_instructions?: string | null
          status?: string | null
          subtotal?: number | null
          table_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_orders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_payments: {
        Row: {
          amount: number
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string | null
          payment_mode: string
          reference_number: string | null
        }
        Insert: {
          amount: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_mode: string
          reference_number?: string | null
        }
        Update: {
          amount?: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_mode?: string
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "restaurant_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          notes: string | null
          status: string | null
          table_name: string | null
          table_number: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          table_name?: string | null
          table_number: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          table_name?: string | null
          table_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      room_blocks: {
        Row: {
          block_date: string
          blocked_quantity: number
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          room_id: string
          updated_at: string
        }
        Insert: {
          block_date: string
          blocked_quantity?: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          room_id: string
          updated_at?: string
        }
        Update: {
          block_date?: string
          blocked_quantity?: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_blocks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          adult_capacity: number | null
          amenities: string[] | null
          base_price: number
          capacity: number | null
          child_capacity: number | null
          created_at: string | null
          description: string | null
          floor_number: number | null
          hotel_id: string
          id: string
          is_available: boolean | null
          notes: string | null
          room_number: string
          room_type: string
          total_quantity: number
          updated_at: string | null
        }
        Insert: {
          adult_capacity?: number | null
          amenities?: string[] | null
          base_price?: number
          capacity?: number | null
          child_capacity?: number | null
          created_at?: string | null
          description?: string | null
          floor_number?: number | null
          hotel_id: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          room_number: string
          room_type: string
          total_quantity?: number
          updated_at?: string | null
        }
        Update: {
          adult_capacity?: number | null
          amenities?: string[] | null
          base_price?: number
          capacity?: number | null
          child_capacity?: number | null
          created_at?: string | null
          description?: string | null
          floor_number?: number | null
          hotel_id?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          room_number?: string
          room_type?: string
          total_quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "own_hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      safari_bookings: {
        Row: {
          booking_id: string | null
          created_at: string | null
          due_amount: number | null
          id: string
          notes: string | null
          number_of_persons: number | null
          paid_amount: number | null
          rate_per_person: number | null
          safari_date: string
          safari_name: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          due_amount?: number | null
          id?: string
          notes?: string | null
          number_of_persons?: number | null
          paid_amount?: number | null
          rate_per_person?: number | null
          safari_date: string
          safari_name: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          due_amount?: number | null
          id?: string
          notes?: string | null
          number_of_persons?: number | null
          paid_amount?: number | null
          rate_per_person?: number | null
          safari_date?: string
          safari_name?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safari_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      transporters: {
        Row: {
          address: string | null
          city_id: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          vehicle_types: string[] | null
        }
        Insert: {
          address?: string | null
          city_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          vehicle_types?: string[] | null
        }
        Update: {
          address?: string | null
          city_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          vehicle_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "transporters_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_menu_permissions: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          menu_key: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          menu_key: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          menu_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          property_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_bookings: {
        Row: {
          booking_id: string | null
          created_at: string | null
          dropoff_date: string | null
          due_amount: number | null
          from_location: string | null
          id: string
          notes: string | null
          paid_amount: number | null
          pickup_date: string | null
          rate: number | null
          to_location: string | null
          total_amount: number | null
          transporter_id: string | null
          updated_at: string | null
          vehicle_number: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          dropoff_date?: string | null
          due_amount?: number | null
          from_location?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          pickup_date?: string | null
          rate?: number | null
          to_location?: string | null
          total_amount?: number | null
          transporter_id?: string | null
          updated_at?: string | null
          vehicle_number?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          dropoff_date?: string | null
          due_amount?: number | null
          from_location?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          pickup_date?: string | null
          rate?: number | null
          to_location?: string | null
          total_amount?: number | null
          transporter_id?: string | null
          updated_at?: string | null
          vehicle_number?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_bookings_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "transporters"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          gst_number: string | null
          id: string
          is_active: boolean | null
          mobile_number: string | null
          notes: string | null
          payment_terms: number | null
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          mobile_number?: string | null
          notes?: string | null
          payment_terms?: number | null
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          mobile_number?: string | null
          notes?: string | null
          payment_terms?: number | null
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volvo_bookings: {
        Row: {
          booking_id: string | null
          created_at: string | null
          due_amount: number | null
          id: string
          notes: string | null
          number_of_seats: number | null
          paid_amount: number | null
          rate_per_seat: number | null
          route: string
          total_amount: number | null
          travel_date: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          due_amount?: number | null
          id?: string
          notes?: string | null
          number_of_seats?: number | null
          paid_amount?: number | null
          rate_per_seat?: number | null
          route: string
          total_amount?: number | null
          travel_date: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          due_amount?: number | null
          id?: string
          notes?: string | null
          number_of_seats?: number | null
          paid_amount?: number | null
          rate_per_seat?: number | null
          route?: string
          total_amount?: number | null
          travel_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volvo_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_approve_payment: {
        Args: { _payment_mode: string; _user_id: string }
        Returns: boolean
      }
      get_email_by_username: { Args: { _username: string }; Returns: string }
      has_menu_access: {
        Args: { _menu_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "front_desk" | "housekeeping" | "manager" | "account"
      booking_status:
        | "enquiry"
        | "hold"
        | "confirmed"
        | "cancelled"
        | "completed"
      department_type:
        | "kitchen"
        | "housekeeping"
        | "maintenance"
        | "front_desk"
        | "admin"
        | "other"
      invoice_payment_status: "pending" | "partially_paid" | "paid"
      item_category:
        | "kitchen_items"
        | "housekeeping_items"
        | "linen"
        | "toiletries"
        | "maintenance"
        | "other"
      item_unit:
        | "kg"
        | "liter"
        | "piece"
        | "box"
        | "packet"
        | "dozen"
        | "meter"
        | "set"
      payment_status: "pending" | "partial" | "paid" | "refunded"
      po_status:
        | "created"
        | "sent_to_vendor"
        | "partially_received"
        | "closed"
        | "cancelled"
        | "pending"
        | "approved"
        | "rejected"
      pr_status: "pending" | "approved" | "rejected"
      priority_level: "low" | "medium" | "high"
      vehicle_type: "bus" | "car" | "tempo_traveller" | "other"
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
      app_role: ["admin", "front_desk", "housekeeping", "manager", "account"],
      booking_status: [
        "enquiry",
        "hold",
        "confirmed",
        "cancelled",
        "completed",
      ],
      department_type: [
        "kitchen",
        "housekeeping",
        "maintenance",
        "front_desk",
        "admin",
        "other",
      ],
      invoice_payment_status: ["pending", "partially_paid", "paid"],
      item_category: [
        "kitchen_items",
        "housekeeping_items",
        "linen",
        "toiletries",
        "maintenance",
        "other",
      ],
      item_unit: [
        "kg",
        "liter",
        "piece",
        "box",
        "packet",
        "dozen",
        "meter",
        "set",
      ],
      payment_status: ["pending", "partial", "paid", "refunded"],
      po_status: [
        "created",
        "sent_to_vendor",
        "partially_received",
        "closed",
        "cancelled",
        "pending",
        "approved",
        "rejected",
      ],
      pr_status: ["pending", "approved", "rejected"],
      priority_level: ["low", "medium", "high"],
      vehicle_type: ["bus", "car", "tempo_traveller", "other"],
    },
  },
} as const
