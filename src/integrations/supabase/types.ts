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
          batch_id: string | null
          branch_id: string | null
          city: string | null
          course_id: string | null
          course_preference: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          mother_name: string | null
          notes: string | null
          passport_photo_url: string | null
          phone: string
          photo_url: string | null
          pincode: string | null
          preferred_timing: string | null
          qualification: string | null
          qualification_url: string | null
          remarks: string | null
          reviewed_at: string | null
          reviewed_by: string | null
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
          batch_id?: string | null
          branch_id?: string | null
          city?: string | null
          course_id?: string | null
          course_preference?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          mother_name?: string | null
          notes?: string | null
          passport_photo_url?: string | null
          phone: string
          photo_url?: string | null
          pincode?: string | null
          preferred_timing?: string | null
          qualification?: string | null
          qualification_url?: string | null
          remarks?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          batch_id?: string | null
          branch_id?: string | null
          city?: string | null
          course_id?: string | null
          course_preference?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          mother_name?: string | null
          notes?: string | null
          passport_photo_url?: string | null
          phone?: string
          photo_url?: string | null
          pincode?: string | null
          preferred_timing?: string | null
          qualification?: string | null
          qualification_url?: string | null
          remarks?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          end_date: string | null
          faculty_id: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          timing: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          capacity?: number
          code: string
          course_id: string
          created_at?: string
          end_date?: string | null
          faculty_id?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          timing?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          capacity?: number
          code?: string
          course_id?: string
          created_at?: string
          end_date?: string | null
          faculty_id?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          timing?: string | null
          updated_at?: string
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
      courses: {
        Row: {
          category: string | null
          certificate: boolean
          code: string
          created_at: string
          description: string | null
          duration: string | null
          duration_months: number | null
          eligibility: string | null
          fees: number
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          syllabus: Json | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          certificate?: boolean
          code: string
          created_at?: string
          description?: string | null
          duration?: string | null
          duration_months?: number | null
          eligibility?: string | null
          fees?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          syllabus?: Json | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          certificate?: boolean
          code?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          duration_months?: number | null
          eligibility?: string | null
          fees?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          syllabus?: Json | null
          updated_at?: string
        }
        Relationships: []
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
      profiles: {
        Row: {
          address: string | null
          branch_id: string | null
          created_at: string
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
          phone: string | null
          photo_url: string | null
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          created_at?: string
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
          phone?: string | null
          photo_url?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          created_at?: string
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
          phone?: string | null
          photo_url?: string | null
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
          admission_id: string | null
          alternate_mobile: string | null
          batch_id: string | null
          blood_group: string | null
          branch_id: string
          city: string | null
          course_id: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          emergency_contact: string | null
          enrollment_no: string
          full_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          joined_at: string
          notes: string | null
          occupation: string | null
          phone: string
          photo_url: string | null
          pincode: string | null
          qualification: string | null
          roll_no: string | null
          state: string | null
          status: string
          student_code: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          address?: string | null
          admission_id?: string | null
          alternate_mobile?: string | null
          batch_id?: string | null
          blood_group?: string | null
          branch_id: string
          city?: string | null
          course_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          enrollment_no?: string
          full_name: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          occupation?: string | null
          phone: string
          photo_url?: string | null
          pincode?: string | null
          qualification?: string | null
          roll_no?: string | null
          state?: string | null
          status?: string
          student_code?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          address?: string | null
          admission_id?: string | null
          alternate_mobile?: string | null
          batch_id?: string | null
          blood_group?: string | null
          branch_id?: string
          city?: string | null
          course_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          enrollment_no?: string
          full_name?: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          occupation?: string | null
          phone?: string
          photo_url?: string | null
          pincode?: string | null
          qualification?: string | null
          roll_no?: string | null
          state?: string | null
          status?: string
          student_code?: string
          updated_at?: string
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
      [_ in never]: never
    }
    Functions: {
      calc_division: { Args: { _pct: number }; Returns: string }
      calc_grade: { Args: { _pct: number }; Returns: string }
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
      next_admission_no: { Args: never; Returns: string }
      next_application_no: { Args: never; Returns: string }
      next_certificate_no: { Args: never; Returns: string }
      next_enrollment_no: { Args: never; Returns: string }
      next_receipt_no: { Args: never; Returns: string }
      next_student_code: { Args: never; Returns: string }
      recalc_student_fee: { Args: { _sf: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
          admission_id: string | null
          alternate_mobile: string | null
          batch_id: string | null
          blood_group: string | null
          branch_id: string
          city: string | null
          course_id: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          emergency_contact: string | null
          enrollment_no: string
          full_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          joined_at: string
          notes: string | null
          occupation: string | null
          phone: string
          photo_url: string | null
          pincode: string | null
          qualification: string | null
          roll_no: string | null
          state: string | null
          status: string
          student_code: string
          updated_at: string
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
