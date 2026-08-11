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
  public: {
    Tables: {
      admissions: {
        Row: {
          aadhaar_back_url: string | null
          aadhaar_front_url: string | null
          aadhaar_number: string | null
          address: string | null
          admission_no: string
          alternate_mobile: string | null
          application_no: string | null
          approved_at: string | null
          approved_by: string | null
          batch_id: string | null
          blood_group: string | null
          board: string | null
          branch_id: string | null
          category: string | null
          city: string | null
          course_id: string | null
          course_preference: string | null
          created_at: string
          date_of_birth: string | null
          district: string | null
          documents_requested_at: string | null
          documents_requested_note: string | null
          email: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          marksheet_url: string | null
          mother_name: string | null
          notes: string | null
          other_documents: Json
          passing_year: string | null
          passport_photo_url: string | null
          percentage: number | null
          phone: string
          photo_url: string | null
          pincode: string | null
          preferred_timing: string | null
          qualification: string | null
          qualification_url: string | null
          rejected_at: string | null
          rejected_by: string | null
          remarks: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school: string | null
          session: string | null
          signature_url: string | null
          source: string | null
          state: string | null
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_number?: string | null
          address?: string | null
          admission_no?: string
          alternate_mobile?: string | null
          application_no?: string | null
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          blood_group?: string | null
          board?: string | null
          branch_id?: string | null
          category?: string | null
          city?: string | null
          course_id?: string | null
          course_preference?: string | null
          created_at?: string
          date_of_birth?: string | null
          district?: string | null
          documents_requested_at?: string | null
          documents_requested_note?: string | null
          email?: string | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          marksheet_url?: string | null
          mother_name?: string | null
          notes?: string | null
          other_documents?: Json
          passing_year?: string | null
          passport_photo_url?: string | null
          percentage?: number | null
          phone: string
          photo_url?: string | null
          pincode?: string | null
          preferred_timing?: string | null
          qualification?: string | null
          qualification_url?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          remarks?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school?: string | null
          session?: string | null
          signature_url?: string | null
          source?: string | null
          state?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_number?: string | null
          address?: string | null
          admission_no?: string
          alternate_mobile?: string | null
          application_no?: string | null
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          blood_group?: string | null
          board?: string | null
          branch_id?: string | null
          category?: string | null
          city?: string | null
          course_id?: string | null
          course_preference?: string | null
          created_at?: string
          date_of_birth?: string | null
          district?: string | null
          documents_requested_at?: string | null
          documents_requested_note?: string | null
          email?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          marksheet_url?: string | null
          mother_name?: string | null
          notes?: string | null
          other_documents?: Json
          passing_year?: string | null
          passport_photo_url?: string | null
          percentage?: number | null
          phone?: string
          photo_url?: string | null
          pincode?: string | null
          preferred_timing?: string | null
          qualification?: string | null
          qualification_url?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          remarks?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school?: string | null
          session?: string | null
          signature_url?: string | null
          source?: string | null
          state?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          batch_id: string | null
          branch_id: string | null
          check_in_time: string | null
          check_out_time: string | null
          course_id: string | null
          created_at: string
          id: string
          marked_by: string | null
          remarks: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance_date: string
          batch_id?: string | null
          branch_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          batch_id?: string | null
          branch_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      batches: {
        Row: {
          branch_id: string
          capacity: number
          code: string
          course_id: string
          created_at: string
          created_by: string | null
          current_strength: number
          days: string[]
          deleted_at: string | null
          end_date: string | null
          end_time: string | null
          faculty_id: string | null
          id: string
          mode: string
          name: string
          remarks: string | null
          room_number: string | null
          session: string | null
          start_date: string | null
          start_time: string | null
          status: string
          teacher_id: string | null
          timing: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          branch_id: string
          capacity?: number
          code: string
          course_id: string
          created_at?: string
          created_by?: string | null
          current_strength?: number
          days?: string[]
          deleted_at?: string | null
          end_date?: string | null
          end_time?: string | null
          faculty_id?: string | null
          id?: string
          mode?: string
          name: string
          remarks?: string | null
          room_number?: string | null
          session?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: string
          teacher_id?: string | null
          timing?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          branch_id?: string
          capacity?: number
          code?: string
          course_id?: string
          created_at?: string
          created_by?: string | null
          current_strength?: number
          days?: string[]
          deleted_at?: string | null
          end_date?: string | null
          end_time?: string | null
          faculty_id?: string | null
          id?: string
          mode?: string
          name?: string
          remarks?: string | null
          room_number?: string | null
          session?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: string
          teacher_id?: string | null
          timing?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["auth_user_id"]
          },
          {
            foreignKeyName: "batches_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          background_image: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          id: string
          seal_image: string | null
          signature_image: string | null
          status: Database["public"]["Enums"]["template_status"]
          template_file: string | null
          template_name: string
          updated_at: string
        }
        Insert: {
          background_image?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          seal_image?: string | null
          signature_image?: string | null
          status?: Database["public"]["Enums"]["template_status"]
          template_file?: string | null
          template_name: string
          updated_at?: string
        }
        Update: {
          background_image?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          seal_image?: string | null
          signature_image?: string | null
          status?: Database["public"]["Enums"]["template_status"]
          template_file?: string | null
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          branch_id: string | null
          certificate_number: string
          certificate_type: Database["public"]["Enums"]["certificate_type"]
          completion_date: string | null
          course_id: string | null
          created_at: string
          grade: string | null
          id: string
          issue_date: string
          issued_by: string | null
          pdf_url: string | null
          percentage: number | null
          qr_code_url: string | null
          reissued_from: string | null
          revoked_reason: string | null
          status: Database["public"]["Enums"]["certificate_status"]
          student_id: string
          template_id: string | null
          updated_at: string
          verification_token: string
        }
        Insert: {
          branch_id?: string | null
          certificate_number?: string
          certificate_type?: Database["public"]["Enums"]["certificate_type"]
          completion_date?: string | null
          course_id?: string | null
          created_at?: string
          grade?: string | null
          id?: string
          issue_date?: string
          issued_by?: string | null
          pdf_url?: string | null
          percentage?: number | null
          qr_code_url?: string | null
          reissued_from?: string | null
          revoked_reason?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          student_id: string
          template_id?: string | null
          updated_at?: string
          verification_token?: string
        }
        Update: {
          branch_id?: string | null
          certificate_number?: string
          certificate_type?: Database["public"]["Enums"]["certificate_type"]
          completion_date?: string | null
          course_id?: string | null
          created_at?: string
          grade?: string | null
          id?: string
          issue_date?: string
          issued_by?: string | null
          pdf_url?: string | null
          percentage?: number | null
          qr_code_url?: string | null
          reissued_from?: string | null
          revoked_reason?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          student_id?: string
          template_id?: string | null
          updated_at?: string
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_reissued_from_fkey"
            columns: ["reissued_from"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      configuration_history: {
        Row: {
          changed_by: string | null
          changed_by_email: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          label: string | null
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          label?: string | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          label?: string | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string | null
          certificate: boolean
          certificate_type: string | null
          code: string
          course_fee: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          duration: string | null
          duration_months: number | null
          duration_unit: string
          eligibility: string | null
          exam_fee: number
          exam_pattern: string | null
          fees: number
          hours: number | null
          id: string
          is_active: boolean
          medium: string | null
          mode: string
          name: string
          prospectus_url: string | null
          registration_fee: number
          short_name: string | null
          slug: string
          sort_order: number
          status: string
          study_material: string | null
          syllabus: Json | null
          syllabus_url: string | null
          thumbnail_url: string | null
          training_partner: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          certificate?: boolean
          certificate_type?: string | null
          code: string
          course_fee?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          duration_months?: number | null
          duration_unit?: string
          eligibility?: string | null
          exam_fee?: number
          exam_pattern?: string | null
          fees?: number
          hours?: number | null
          id?: string
          is_active?: boolean
          medium?: string | null
          mode?: string
          name: string
          prospectus_url?: string | null
          registration_fee?: number
          short_name?: string | null
          slug: string
          sort_order?: number
          status?: string
          study_material?: string | null
          syllabus?: Json | null
          syllabus_url?: string | null
          thumbnail_url?: string | null
          training_partner?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          certificate?: boolean
          certificate_type?: string | null
          code?: string
          course_fee?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          duration_months?: number | null
          duration_unit?: string
          eligibility?: string | null
          exam_fee?: number
          exam_pattern?: string | null
          fees?: number
          hours?: number | null
          id?: string
          is_active?: boolean
          medium?: string | null
          mode?: string
          name?: string
          prospectus_url?: string | null
          registration_fee?: number
          short_name?: string | null
          slug?: string
          sort_order?: number
          status?: string
          study_material?: string | null
          syllabus?: Json | null
          syllabus_url?: string | null
          thumbnail_url?: string | null
          training_partner?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          created_at: string
          footer: string | null
          header: string | null
          id: string
          is_enabled: boolean
          key: string
          logo_url: string | null
          name: string
          signature_url: string | null
          terms: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          footer?: string | null
          header?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          logo_url?: string | null
          name: string
          signature_url?: string | null
          terms?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          footer?: string | null
          header?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          logo_url?: string | null
          name?: string
          signature_url?: string | null
          terms?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      download_categories: {
        Row: {
          category_name: string
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      download_history: {
        Row: {
          device: string | null
          downloaded_at: string
          id: string
          ip_address: string | null
          student_id: string | null
          study_material_id: string
          user_id: string | null
        }
        Insert: {
          device?: string | null
          downloaded_at?: string
          id?: string
          ip_address?: string | null
          student_id?: string | null
          study_material_id: string
          user_id?: string | null
        }
        Update: {
          device?: string | null
          downloaded_at?: string
          id?: string
          ip_address?: string | null
          student_id?: string | null
          study_material_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "download_history_study_material_id_fkey"
            columns: ["study_material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          batch_id: string | null
          branch_id: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          exam_date: string | null
          exam_name: string
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          result_publish_date: string | null
          status: Database["public"]["Enums"]["exam_status"]
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          branch_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          exam_date?: string | null
          exam_name: string
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          result_publish_date?: string | null
          status?: Database["public"]["Enums"]["exam_status"]
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          branch_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          exam_date?: string | null
          exam_name?: string
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          result_publish_date?: string | null
          status?: Database["public"]["Enums"]["exam_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_installments: {
        Row: {
          amount: number
          collected_by: string | null
          created_at: string
          discount_amount: number
          due_date: string | null
          fine_amount: number
          id: string
          installment_number: number
          paid_amount: number
          payment_date: string | null
          payment_mode: Database["public"]["Enums"]["fee_payment_mode"] | null
          receipt_number: string | null
          remarks: string | null
          status: Database["public"]["Enums"]["fee_payment_status"]
          student_fee_id: string
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          collected_by?: string | null
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          fine_amount?: number
          id?: string
          installment_number?: number
          paid_amount?: number
          payment_date?: string | null
          payment_mode?: Database["public"]["Enums"]["fee_payment_mode"] | null
          receipt_number?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["fee_payment_status"]
          student_fee_id: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          collected_by?: string | null
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          fine_amount?: number
          id?: string
          installment_number?: number
          paid_amount?: number
          payment_date?: string | null
          payment_mode?: Database["public"]["Enums"]["fee_payment_mode"] | null
          receipt_number?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["fee_payment_status"]
          student_fee_id?: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_installments_student_fee_id_fkey"
            columns: ["student_fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structure: {
        Row: {
          admission_fee: number
          branch_id: string | null
          certificate_fee: number
          course_id: string | null
          created_at: string
          created_by: string | null
          discount_allowed: number
          exam_fee: number
          id: string
          name: string | null
          registration_fee: number
          status: string
          study_material_fee: number
          total_fee: number
          updated_at: string
        }
        Insert: {
          admission_fee?: number
          branch_id?: string | null
          certificate_fee?: number
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_allowed?: number
          exam_fee?: number
          id?: string
          name?: string | null
          registration_fee?: number
          status?: string
          study_material_fee?: number
          total_fee?: number
          updated_at?: string
        }
        Update: {
          admission_fee?: number
          branch_id?: string | null
          certificate_fee?: number
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_allowed?: number
          exam_fee?: number
          id?: string
          name?: string | null
          registration_fee?: number
          status?: string
          study_material_fee?: number
          total_fee?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structure_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structure_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      form_configs: {
        Row: {
          created_at: string
          description: string | null
          form_key: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          form_key: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          form_key?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      form_fields: {
        Row: {
          created_at: string
          default_value: string | null
          field_key: string
          field_type: string
          form_config_id: string
          help_text: string | null
          id: string
          is_required: boolean
          is_visible: boolean
          label: string
          placeholder: string | null
          roles: Database["public"]["Enums"]["app_role"][]
          sort_order: number
          updated_at: string
          validation: Json
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          field_key: string
          field_type?: string
          form_config_id: string
          help_text?: string | null
          id?: string
          is_required?: boolean
          is_visible?: boolean
          label: string
          placeholder?: string | null
          roles?: Database["public"]["Enums"]["app_role"][]
          sort_order?: number
          updated_at?: string
          validation?: Json
        }
        Update: {
          created_at?: string
          default_value?: string | null
          field_key?: string
          field_type?: string
          form_config_id?: string
          help_text?: string | null
          id?: string
          is_required?: boolean
          is_visible?: boolean
          label?: string
          placeholder?: string | null
          roles?: Database["public"]["Enums"]["app_role"][]
          sort_order?: number
          updated_at?: string
          validation?: Json
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          category: string
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          provider: string
          secret_keys: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          provider: string
          secret_keys?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          provider?: string
          secret_keys?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      master_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_system: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      master_values: {
        Row: {
          category_id: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_values_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "master_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      material_favorites: {
        Row: {
          created_at: string
          id: string
          study_material_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          study_material_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          study_material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_favorites_study_material_id_fkey"
            columns: ["study_material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_config: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_enabled: boolean
          is_public: boolean
          key: string
          label: string
          path: string | null
          roles: Database["public"]["Enums"]["app_role"][]
          section: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          is_public?: boolean
          key: string
          label: string
          path?: string | null
          roles?: Database["public"]["Enums"]["app_role"][]
          section?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          is_public?: boolean
          key?: string
          label?: string
          path?: string | null
          roles?: Database["public"]["Enums"]["app_role"][]
          section?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          draft_body: string | null
          draft_subject: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          subject: string | null
          updated_at: string
          variables: string[]
        }
        Insert: {
          body?: string
          channel?: string
          created_at?: string
          draft_body?: string | null
          draft_subject?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          subject?: string | null
          updated_at?: string
          variables?: string[]
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          draft_body?: string | null
          draft_subject?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          subject?: string | null
          updated_at?: string
          variables?: string[]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          link: string | null
          student_id: string | null
          target_role: Database["public"]["Enums"]["app_role"] | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          link?: string | null
          student_id?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          link?: string | null
          student_id?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      numbering_settings: {
        Row: {
          created_at: string
          format: string
          id: string
          key: string
          name: string
          next_number: number
          padding: number
          prefix: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id?: string
          key: string
          name: string
          next_number?: number
          padding?: number
          prefix?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          key?: string
          name?: string
          next_number?: number
          padding?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          emergency_contact: string | null
          employee_id: string | null
          full_name: string | null
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          last_login: string | null
          phone: string | null
          photo_url: string | null
          rejection_reason: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          employee_id?: string | null
          full_name?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id: string
          last_login?: string | null
          phone?: string | null
          photo_url?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          employee_id?: string | null
          full_name?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          last_login?: string | null
          phone?: string | null
          photo_url?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      result_details: {
        Row: {
          created_at: string
          grade: string | null
          id: string
          internal_marks: number
          practical_marks: number
          remarks: string | null
          student_result_id: string
          subject_id: string
          theory_marks: number
          total_marks: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          grade?: string | null
          id?: string
          internal_marks?: number
          practical_marks?: number
          remarks?: string | null
          student_result_id: string
          subject_id: string
          theory_marks?: number
          total_marks?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          grade?: string | null
          id?: string
          internal_marks?: number
          practical_marks?: number
          remarks?: string | null
          student_result_id?: string
          subject_id?: string
          theory_marks?: number
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_details_student_result_id_fkey"
            columns: ["student_result_id"]
            isOneToOne: false
            referencedRelation: "student_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_details_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          module: string
          permissions: string[]
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          permissions?: string[]
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
          permissions?: string[]
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      student_documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          kind: string
          mime_type: string | null
          student_id: string
          title: string | null
          updated_at: string
          uploaded_by: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          kind: string
          mime_type?: string | null
          student_id: string
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          student_id?: string
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_edit_history: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_email: string | null
          changes: Json
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          action?: string
          changed_by?: string | null
          changed_by_email?: string | null
          changes?: Json
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_email?: string | null
          changes?: Json
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_edit_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fees: {
        Row: {
          created_at: string
          created_by: string | null
          discount_amount: number
          due_amount: number
          fee_structure_id: string | null
          final_fee: number
          id: string
          notes: string | null
          paid_amount: number
          payment_status: Database["public"]["Enums"]["fee_payment_status"]
          student_id: string
          total_fee: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_amount?: number
          fee_structure_id?: string | null
          final_fee?: number
          id?: string
          notes?: string | null
          paid_amount?: number
          payment_status?: Database["public"]["Enums"]["fee_payment_status"]
          student_id: string
          total_fee?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_amount?: number
          fee_structure_id?: string | null
          final_fee?: number
          id?: string
          notes?: string | null
          paid_amount?: number
          payment_status?: Database["public"]["Enums"]["fee_payment_status"]
          student_id?: string
          total_fee?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fees_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_results: {
        Row: {
          created_at: string
          division: string | null
          exam_id: string
          grade: string | null
          id: string
          obtained_marks: number
          pass_fail: string | null
          percentage: number
          published_at: string | null
          published_by: string | null
          remarks: string | null
          result_status: Database["public"]["Enums"]["result_status"]
          student_id: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          division?: string | null
          exam_id: string
          grade?: string | null
          id?: string
          obtained_marks?: number
          pass_fail?: string | null
          percentage?: number
          published_at?: string | null
          published_by?: string | null
          remarks?: string | null
          result_status?: Database["public"]["Enums"]["result_status"]
          student_id: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          division?: string | null
          exam_id?: string
          grade?: string | null
          id?: string
          obtained_marks?: number
          pass_fail?: string | null
          percentage?: number
          published_at?: string | null
          published_by?: string | null
          remarks?: string | null
          result_status?: Database["public"]["Enums"]["result_status"]
          student_id?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          aadhaar_number: string | null
          address: string | null
          admission_fee: number
          admission_id: string | null
          admission_number: string | null
          alternate_mobile: string | null
          batch_id: string | null
          blood_group: string | null
          branch_id: string
          category: string | null
          city: string | null
          course_fee: number
          course_id: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          discount: number
          district: string | null
          duration: string | null
          email: string | null
          emergency_contact: string | null
          enrollment_no: string
          faculty_id: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          installments: number
          joined_at: string
          mother_name: string | null
          notes: string | null
          occupation: string | null
          payment_mode: string | null
          phone: string
          photo_url: string | null
          pincode: string | null
          qualification: string | null
          receipt_number: string | null
          registration_fee: number
          remarks: string | null
          roll_no: string | null
          session: string | null
          state: string | null
          status: string
          student_code: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          address?: string | null
          admission_fee?: number
          admission_id?: string | null
          admission_number?: string | null
          alternate_mobile?: string | null
          batch_id?: string | null
          blood_group?: string | null
          branch_id: string
          category?: string | null
          city?: string | null
          course_fee?: number
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          discount?: number
          district?: string | null
          duration?: string | null
          email?: string | null
          emergency_contact?: string | null
          enrollment_no?: string
          faculty_id?: string | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          installments?: number
          joined_at?: string
          mother_name?: string | null
          notes?: string | null
          occupation?: string | null
          payment_mode?: string | null
          phone: string
          photo_url?: string | null
          pincode?: string | null
          qualification?: string | null
          receipt_number?: string | null
          registration_fee?: number
          remarks?: string | null
          roll_no?: string | null
          session?: string | null
          state?: string | null
          status?: string
          student_code?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          address?: string | null
          admission_fee?: number
          admission_id?: string | null
          admission_number?: string | null
          alternate_mobile?: string | null
          batch_id?: string | null
          blood_group?: string | null
          branch_id?: string
          category?: string | null
          city?: string | null
          course_fee?: number
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          discount?: number
          district?: string | null
          duration?: string | null
          email?: string | null
          emergency_contact?: string | null
          enrollment_no?: string
          faculty_id?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          installments?: number
          joined_at?: string
          mother_name?: string | null
          notes?: string | null
          occupation?: string | null
          payment_mode?: string | null
          phone?: string
          photo_url?: string | null
          pincode?: string | null
          qualification?: string | null
          receipt_number?: string | null
          registration_fee?: number
          remarks?: string | null
          roll_no?: string | null
          session?: string | null
          state?: string | null
          status?: string
          student_code?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["auth_user_id"]
          },
          {
            foreignKeyName: "students_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_materials: {
        Row: {
          batch_id: string | null
          branch_id: string | null
          bucket: string | null
          category_id: string | null
          course_id: string | null
          created_at: string
          description: string | null
          download_count: number
          external_link: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_featured: boolean
          status: Database["public"]["Enums"]["material_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          visibility: Database["public"]["Enums"]["material_visibility"]
          youtube_url: string | null
        }
        Insert: {
          batch_id?: string | null
          branch_id?: string | null
          bucket?: string | null
          category_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          external_link?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean
          status?: Database["public"]["Enums"]["material_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["material_visibility"]
          youtube_url?: string | null
        }
        Update: {
          batch_id?: string | null
          branch_id?: string | null
          bucket?: string | null
          category_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          external_link?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean
          status?: Database["public"]["Enums"]["material_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["material_visibility"]
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "download_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          maximum_marks: number
          minimum_passing_marks: number
          practical_marks: number
          status: string
          subject_code: string
          subject_name: string
          theory_marks: number
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          maximum_marks?: number
          minimum_passing_marks?: number
          practical_marks?: number
          status?: string
          subject_code: string
          subject_name: string
          theory_marks?: number
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          maximum_marks?: number
          minimum_passing_marks?: number
          practical_marks?: number
          status?: string
          subject_code?: string
          subject_name?: string
          theory_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          group_key: string
          id: string
          is_public: boolean
          setting_key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          group_key: string
          id?: string
          is_public?: boolean
          setting_key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          group_key?: string
          id?: string
          is_public?: boolean
          setting_key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      teacher_batches: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          teacher_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          teacher_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_batches_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_batches_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          teacher_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          teacher_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_edit_history: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_email: string | null
          changes: Json
          created_at: string
          id: string
          teacher_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_by_email?: string | null
          changes?: Json
          created_at?: string
          id?: string
          teacher_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_email?: string | null
          changes?: Json
          created_at?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_edit_history_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          aadhaar_number: string | null
          aadhaar_url: string | null
          address: string | null
          alternate_mobile: string | null
          blood_group: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          department: string | null
          designation: string | null
          district: string | null
          dob: string | null
          email: string | null
          employee_code: string
          experience: string | null
          experience_url: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          id: string
          joining_date: string | null
          mobile: string
          mother_name: string | null
          pan_number: string | null
          pan_url: string | null
          photo_url: string | null
          pin_code: string | null
          preferred_timings: string | null
          qualification: string | null
          qualification_url: string | null
          remarks: string | null
          salary: number
          signature_url: string | null
          state: string | null
          status: string
          subjects: string | null
          teacher_id: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
          working_days: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          aadhaar_url?: string | null
          address?: string | null
          alternate_mobile?: string | null
          blood_group?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department?: string | null
          designation?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          employee_code: string
          experience?: string | null
          experience_url?: string | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          joining_date?: string | null
          mobile: string
          mother_name?: string | null
          pan_number?: string | null
          pan_url?: string | null
          photo_url?: string | null
          pin_code?: string | null
          preferred_timings?: string | null
          qualification?: string | null
          qualification_url?: string | null
          remarks?: string | null
          salary?: number
          signature_url?: string | null
          state?: string | null
          status?: string
          subjects?: string | null
          teacher_id: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          working_days?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          aadhaar_url?: string | null
          address?: string | null
          alternate_mobile?: string | null
          blood_group?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department?: string | null
          designation?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          employee_code?: string
          experience?: string | null
          experience_url?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          joining_date?: string | null
          mobile?: string
          mother_name?: string | null
          pan_number?: string | null
          pan_url?: string | null
          photo_url?: string | null
          pin_code?: string | null
          preferred_timings?: string | null
          qualification?: string | null
          qualification_url?: string | null
          remarks?: string | null
          salary?: number
          signature_url?: string | null
          state?: string | null
          status?: string
          subjects?: string | null
          teacher_id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          working_days?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auth_user_id: string | null
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          full_name: string | null
          id: string | null
          last_login: string | null
          mobile: string | null
          photo_url: string | null
          rejection_reason: string | null
          requested_role: Database["public"]["Enums"]["app_role"] | null
          role: Database["public"]["Enums"]["app_role"] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auth_user_id?: string | null
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          last_login?: string | null
          mobile?: string | null
          photo_url?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          role?: never
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auth_user_id?: string | null
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          last_login?: string | null
          mobile?: string | null
          photo_url?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          role?: never
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_approve_user: {
        Args: {
          _branch?: string
          _role?: Database["public"]["Enums"]["app_role"]
          _uid: string
        }
        Returns: undefined
      }
      admin_assign_role: {
        Args: {
          _branch?: string
          _role: Database["public"]["Enums"]["app_role"]
          _uid: string
        }
        Returns: undefined
      }
      admin_delete_user: { Args: { _uid: string }; Returns: undefined }
      admin_set_user_status: {
        Args: { _reason?: string; _status: string; _uid: string }
        Returns: undefined
      }
      calc_division: { Args: { _pct: number }; Returns: string }
      calc_grade: { Args: { _pct: number }; Returns: string }
      claim_super_admin: {
        Args: {
          _branch_name: string
          _full_name: string
          _institute_name: string
          _phone: string
        }
        Returns: Json
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_material_admin: { Args: { _uid: string }; Returns: boolean }
      is_user_admin: { Args: { _uid: string }; Returns: boolean }
      log_logout: { Args: never; Returns: undefined }
      my_branch_id: { Args: never; Returns: string }
      next_admission_no: { Args: never; Returns: string }
      next_admission_number: { Args: never; Returns: string }
      next_application_no: { Args: never; Returns: string }
      next_batch_code: { Args: never; Returns: string }
      next_certificate_no: { Args: never; Returns: string }
      next_course_code: { Args: never; Returns: string }
      next_employee_code: { Args: never; Returns: string }
      next_enrollment_no: { Args: never; Returns: string }
      next_receipt_no: { Args: never; Returns: string }
      next_student_code: { Args: never; Returns: string }
      next_teacher_id: { Args: never; Returns: string }
      recalc_student_fee: { Args: { _sf: string }; Returns: undefined }
      record_login: { Args: never; Returns: string }
      role_of: {
        Args: { _uid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      student_can_see_material: {
        Args: { _mid: string; _uid: string }
        Returns: boolean
      }
      submit_admission: {
        Args: { payload: Json }
        Returns: {
          admission_no: string
          application_no: string
          id: string
        }[]
      }
      super_admin_exists: { Args: never; Returns: boolean }
      update_my_student_profile: {
        Args: {
          _address: string
          _alternate_mobile: string
          _blood_group: string
          _city: string
          _email: string
          _emergency_contact: string
          _guardian_name: string
          _guardian_phone: string
          _occupation: string
          _phone: string
          _photo_url: string
          _pincode: string
          _state: string
        }
        Returns: {
          aadhaar_number: string | null
          address: string | null
          admission_fee: number
          admission_id: string | null
          admission_number: string | null
          alternate_mobile: string | null
          batch_id: string | null
          blood_group: string | null
          branch_id: string
          category: string | null
          city: string | null
          course_fee: number
          course_id: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          discount: number
          district: string | null
          duration: string | null
          email: string | null
          emergency_contact: string | null
          enrollment_no: string
          faculty_id: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          installments: number
          joined_at: string
          mother_name: string | null
          notes: string | null
          occupation: string | null
          payment_mode: string | null
          phone: string
          photo_url: string | null
          pincode: string | null
          qualification: string | null
          receipt_number: string | null
          registration_fee: number
          remarks: string | null
          roll_no: string | null
          session: string | null
          state: string | null
          status: string
          student_code: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "branch_manager"
        | "faculty"
        | "student"
        | "guest"
      attendance_status:
        | "present"
        | "absent"
        | "late"
        | "half_day"
        | "leave"
        | "holiday"
      certificate_status:
        | "draft"
        | "issued"
        | "revoked"
        | "expired"
        | "reissued"
      certificate_type:
        | "course_completion"
        | "diploma"
        | "advanced_diploma"
        | "training"
        | "internship"
        | "excellence"
        | "participation"
      exam_status: "scheduled" | "ongoing" | "completed" | "cancelled"
      exam_type:
        | "monthly_test"
        | "quarterly_exam"
        | "half_yearly"
        | "annual_exam"
        | "practical_exam"
        | "internal_assessment"
        | "final_examination"
      fee_payment_mode:
        | "cash"
        | "upi"
        | "bank_transfer"
        | "card"
        | "cheque"
        | "online"
      fee_payment_status:
        | "pending"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
      material_status: "draft" | "published" | "unpublished" | "archived"
      material_visibility: "public" | "course" | "branch" | "batch" | "private"
      result_status:
        | "draft"
        | "published"
        | "withheld"
        | "re_evaluation"
        | "cancelled"
      template_status: "active" | "inactive"
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
        "admin",
        "branch_manager",
        "faculty",
        "student",
        "guest",
      ],
      attendance_status: [
        "present",
        "absent",
        "late",
        "half_day",
        "leave",
        "holiday",
      ],
      certificate_status: ["draft", "issued", "revoked", "expired", "reissued"],
      certificate_type: [
        "course_completion",
        "diploma",
        "advanced_diploma",
        "training",
        "internship",
        "excellence",
        "participation",
      ],
      exam_status: ["scheduled", "ongoing", "completed", "cancelled"],
      exam_type: [
        "monthly_test",
        "quarterly_exam",
        "half_yearly",
        "annual_exam",
        "practical_exam",
        "internal_assessment",
        "final_examination",
      ],
      fee_payment_mode: [
        "cash",
        "upi",
        "bank_transfer",
        "card",
        "cheque",
        "online",
      ],
      fee_payment_status: [
        "pending",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      material_status: ["draft", "published", "unpublished", "archived"],
      material_visibility: ["public", "course", "branch", "batch", "private"],
      result_status: [
        "draft",
        "published",
        "withheld",
        "re_evaluation",
        "cancelled",
      ],
      template_status: ["active", "inactive"],
    },
  },
} as const
