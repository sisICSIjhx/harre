export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }
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
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_name: string | null
          changed_fields: string[] | null
          employee_id: string | null
          id: number
          new_data: Json | null
          occurred_at: string
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
        }
        ComputedFields: never
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          changed_fields?: string[] | null
          employee_id?: string | null
          id?: never
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          changed_fields?: string[] | null
          employee_id?: string | null
          id?: never
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      banks: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          created_at: string
          employee_id: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          relationship: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          employee_id: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'beneficiaries_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'beneficiaries_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'beneficiaries_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          required_evidence: string | null
          standard_or_body: string | null
          updated_at: string
          validity_months: number | null
        }
        ComputedFields: never
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          required_evidence?: string | null
          standard_or_body?: string | null
          updated_at?: string
          validity_months?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          required_evidence?: string | null
          standard_or_body?: string | null
          updated_at?: string
          validity_months?: number | null
        }
        Relationships: []
      }
      document_types: {
        Row: {
          applicability_rule: string | null
          code: string
          created_at: string
          document_group: string | null
          expected_validity: string | null
          id: string
          instructions: string | null
          name: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          applicability_rule?: string | null
          code: string
          created_at?: string
          document_group?: string | null
          expected_validity?: string | null
          id?: string
          instructions?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          applicability_rule?: string | null
          code?: string
          created_at?: string
          document_group?: string | null
          expected_validity?: string | null
          id?: string
          instructions?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_document_rules: {
        Row: {
          applies: string
          document_type_id: string
          education_level: string
        }
        ComputedFields: never
        Insert: {
          applies: string
          document_type_id: string
          education_level: string
        }
        Update: {
          applies?: string
          document_type_id?: string
          education_level?: string
        }
        Relationships: [
          {
            foreignKeyName: 'education_document_rules_document_type_id_fkey'
            columns: ['document_type_id']
            isOneToOne: false
            referencedRelation: 'document_types'
            referencedColumns: ['id']
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          employee_id: string
          full_name: string
          id: string
          is_primary: boolean
          notes: string | null
          phone: string | null
          relationship: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          employee_id: string
          full_name: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          full_name?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'emergency_contacts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'emergency_contacts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'emergency_contacts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_addresses: {
        Row: {
          address_type: string
          city: string | null
          country: string | null
          created_at: string
          document_url: string | null
          employee_id: string
          exterior_number: string | null
          id: string
          interior_number: string | null
          is_current: boolean
          neighborhood: string | null
          notes: string | null
          postal_code: string | null
          state: string | null
          street: string | null
          updated_at: string
          verified_on: string | null
        }
        ComputedFields: never
        Insert: {
          address_type: string
          city?: string | null
          country?: string | null
          created_at?: string
          document_url?: string | null
          employee_id: string
          exterior_number?: string | null
          id?: string
          interior_number?: string | null
          is_current?: boolean
          neighborhood?: string | null
          notes?: string | null
          postal_code?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          verified_on?: string | null
        }
        Update: {
          address_type?: string
          city?: string | null
          country?: string | null
          created_at?: string
          document_url?: string | null
          employee_id?: string
          exterior_number?: string | null
          id?: string
          interior_number?: string | null
          is_current?: boolean
          neighborhood?: string | null
          notes?: string | null
          postal_code?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          verified_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'employee_addresses_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_addresses_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_addresses_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_assignments: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          is_primary: boolean
          job_profile_id: string
          notes: string | null
          project_id: string | null
          start_date: string | null
          updated_at: string
          work_center: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          is_primary?: boolean
          job_profile_id: string
          notes?: string | null
          project_id?: string | null
          start_date?: string | null
          updated_at?: string
          work_center?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean
          job_profile_id?: string
          notes?: string | null
          project_id?: string | null
          start_date?: string | null
          updated_at?: string
          work_center?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'employee_assignments_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_assignments_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_assignments_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
          {
            foreignKeyName: 'employee_assignments_job_profile_id_fkey'
            columns: ['job_profile_id']
            isOneToOne: false
            referencedRelation: 'job_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_assignments_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      employee_bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string
          bank_id: string
          clabe: string
          created_at: string
          document_url: string | null
          employee_id: string
          holder_name: string | null
          id: string
          notes: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          account_number?: string | null
          account_type: string
          bank_id: string
          clabe: string
          created_at?: string
          document_url?: string | null
          employee_id: string
          holder_name?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string
          bank_id?: string
          clabe?: string
          created_at?: string
          document_url?: string | null
          employee_id?: string
          holder_name?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_bank_accounts_bank_id_fkey'
            columns: ['bank_id']
            isOneToOne: false
            referencedRelation: 'banks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_bank_accounts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_bank_accounts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_bank_accounts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_confidentiality_agreements: {
        Row: {
          amount: number | null
          contract_id: string | null
          created_at: string
          document_kind: string
          document_url: string | null
          employee_id: string
          id: string
          notes: string | null
          signed_on: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          amount?: number | null
          contract_id?: string | null
          created_at?: string
          document_kind: string
          document_url?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          signed_on: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          contract_id?: string | null
          created_at?: string
          document_kind?: string
          document_url?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          signed_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_confidentiality_agreements_contract_fkey'
            columns: ['contract_id', 'employee_id']
            isOneToOne: false
            referencedRelation: 'employee_contracts'
            referencedColumns: ['id', 'employee_id']
          },
          {
            foreignKeyName: 'employee_confidentiality_agreements_contract_fkey'
            columns: ['contract_id', 'employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_contract_options'
            referencedColumns: ['id', 'employee_id']
          },
          {
            foreignKeyName: 'employee_confidentiality_agreements_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_confidentiality_agreements_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_confidentiality_agreements_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_contracts: {
        Row: {
          contract_type: string
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          contract_type: string
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          contract_type?: string
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_contracts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_contracts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_contracts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_control_numbers: {
        Row: {
          assigned_on: string | null
          control_number: string
          created_at: string
          employee_id: string
          ended_on: string | null
          id: string
          notes: string | null
          status: string
          system_id: string
          updated_at: string
          verified_on: string | null
          work_center: string | null
        }
        ComputedFields: never
        Insert: {
          assigned_on?: string | null
          control_number: string
          created_at?: string
          employee_id: string
          ended_on?: string | null
          id?: string
          notes?: string | null
          status?: string
          system_id: string
          updated_at?: string
          verified_on?: string | null
          work_center?: string | null
        }
        Update: {
          assigned_on?: string | null
          control_number?: string
          created_at?: string
          employee_id?: string
          ended_on?: string | null
          id?: string
          notes?: string | null
          status?: string
          system_id?: string
          updated_at?: string
          verified_on?: string | null
          work_center?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'employee_control_numbers_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_control_numbers_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_control_numbers_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
          {
            foreignKeyName: 'employee_control_numbers_system_id_fkey'
            columns: ['system_id']
            isOneToOne: false
            referencedRelation: 'external_systems'
            referencedColumns: ['id']
          },
        ]
      }
      employee_course_requirements: {
        Row: {
          course_id: string
          created_at: string
          deadline: string | null
          employee_id: string
          id: string
          is_mandatory: boolean
          job_profile_id: string | null
          notes: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          course_id: string
          created_at?: string
          deadline?: string | null
          employee_id: string
          id?: string
          is_mandatory?: boolean
          job_profile_id?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          deadline?: string | null
          employee_id?: string
          id?: string
          is_mandatory?: boolean
          job_profile_id?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_course_requirements_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_course_requirements_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['course_id']
          },
          {
            foreignKeyName: 'employee_course_requirements_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_course_requirements_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_course_requirements_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
          {
            foreignKeyName: 'employee_course_requirements_job_profile_id_fkey'
            columns: ['job_profile_id']
            isOneToOne: false
            referencedRelation: 'job_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      employee_courses: {
        Row: {
          certificate_folio: string | null
          completed_on: string | null
          course_id: string
          created_at: string
          document_url: string | null
          duration_hours: number | null
          employee_id: string
          evidence_document_id: string | null
          evidence_type: string | null
          expires_on: string | null
          id: string
          issuer: string | null
          notes: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          certificate_folio?: string | null
          completed_on?: string | null
          course_id: string
          created_at?: string
          document_url?: string | null
          duration_hours?: number | null
          employee_id: string
          evidence_document_id?: string | null
          evidence_type?: string | null
          expires_on?: string | null
          id?: string
          issuer?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          certificate_folio?: string | null
          completed_on?: string | null
          course_id?: string
          created_at?: string
          document_url?: string | null
          duration_hours?: number | null
          employee_id?: string
          evidence_document_id?: string | null
          evidence_type?: string | null
          expires_on?: string | null
          id?: string
          issuer?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_courses_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_courses_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['course_id']
          },
          {
            foreignKeyName: 'employee_courses_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_courses_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_courses_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
          {
            foreignKeyName: 'employee_courses_evidence_document_id_employee_id_fkey'
            columns: ['evidence_document_id', 'employee_id']
            isOneToOne: false
            referencedRelation: 'employee_documents'
            referencedColumns: ['id', 'employee_id']
          },
        ]
      }
      employee_credits: {
        Row: {
          created_at: string
          credit_number: string
          credit_type: string
          employee_id: string
          id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          credit_number: string
          credit_type: string
          employee_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_number?: string
          credit_type?: string
          employee_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_credits_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_credits_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_credits_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_document_checklist: {
        Row: {
          created_at: string
          document_id: string | null
          document_type_id: string
          document_url: string | null
          employee_id: string
          expires_on: string | null
          id: string
          ine_cic: string | null
          ine_elector_key: string | null
          ine_ocr: string | null
          is_current: boolean
          issued_on: string | null
          license_number: string | null
          license_organ_donor: string | null
          license_restrictions: string | null
          license_state: string | null
          license_type: string | null
          manual_decision: string
          notes: string | null
          received_on: string | null
          review_status: string
          updated_at: string
          validated_by: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          document_id?: string | null
          document_type_id: string
          document_url?: string | null
          employee_id: string
          expires_on?: string | null
          id?: string
          ine_cic?: string | null
          ine_elector_key?: string | null
          ine_ocr?: string | null
          is_current?: boolean
          issued_on?: string | null
          license_number?: string | null
          license_organ_donor?: string | null
          license_restrictions?: string | null
          license_state?: string | null
          license_type?: string | null
          manual_decision?: string
          notes?: string | null
          received_on?: string | null
          review_status?: string
          updated_at?: string
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          document_type_id?: string
          document_url?: string | null
          employee_id?: string
          expires_on?: string | null
          id?: string
          ine_cic?: string | null
          ine_elector_key?: string | null
          ine_ocr?: string | null
          is_current?: boolean
          issued_on?: string | null
          license_number?: string | null
          license_organ_donor?: string | null
          license_restrictions?: string | null
          license_state?: string | null
          license_type?: string | null
          manual_decision?: string
          notes?: string | null
          received_on?: string | null
          review_status?: string
          updated_at?: string
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'employee_document_checklist_document_id_employee_id_fkey'
            columns: ['document_id', 'employee_id']
            isOneToOne: false
            referencedRelation: 'employee_documents'
            referencedColumns: ['id', 'employee_id']
          },
          {
            foreignKeyName: 'employee_document_checklist_document_type_id_fkey'
            columns: ['document_type_id']
            isOneToOne: false
            referencedRelation: 'document_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_document_checklist_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_document_checklist_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_document_checklist_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_documents: {
        Row: {
          bucket: string | null
          created_at: string
          document_type: string
          employee_id: string
          expires_on: string | null
          id: string
          mime_type: string | null
          original_filename: string
          sharepoint_item_id: string | null
          size_bytes: number | null
          storage_path: string | null
          updated_at: string
          uploaded_by: string | null
          web_url: string | null
        }
        ComputedFields: never
        Insert: {
          bucket?: string | null
          created_at?: string
          document_type: string
          employee_id: string
          expires_on?: string | null
          id?: string
          mime_type?: string | null
          original_filename: string
          sharepoint_item_id?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          updated_at?: string
          uploaded_by?: string | null
          web_url?: string | null
        }
        Update: {
          bucket?: string | null
          created_at?: string
          document_type?: string
          employee_id?: string
          expires_on?: string | null
          id?: string
          mime_type?: string | null
          original_filename?: string
          sharepoint_item_id?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          updated_at?: string
          uploaded_by?: string | null
          web_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'employee_documents_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_documents_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_documents_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_education: {
        Row: {
          certificate_status: string
          country: string | null
          created_at: string
          degree_title: string | null
          diploma_status: string
          document_id: string | null
          employee_id: string
          end_date: string | null
          id: string
          institution: string | null
          is_highest_level: boolean
          level: string
          license_status: string
          municipality: string | null
          notes: string | null
          professional_license: string | null
          reviewed_by: string | null
          reviewed_on: string | null
          start_date: string | null
          state: string | null
          updated_at: string
          validation_status: string
        }
        ComputedFields: never
        Insert: {
          certificate_status?: string
          country?: string | null
          created_at?: string
          degree_title?: string | null
          diploma_status?: string
          document_id?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          institution?: string | null
          is_highest_level?: boolean
          level: string
          license_status?: string
          municipality?: string | null
          notes?: string | null
          professional_license?: string | null
          reviewed_by?: string | null
          reviewed_on?: string | null
          start_date?: string | null
          state?: string | null
          updated_at?: string
          validation_status?: string
        }
        Update: {
          certificate_status?: string
          country?: string | null
          created_at?: string
          degree_title?: string | null
          diploma_status?: string
          document_id?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          institution?: string | null
          is_highest_level?: boolean
          level?: string
          license_status?: string
          municipality?: string | null
          notes?: string | null
          professional_license?: string | null
          reviewed_by?: string | null
          reviewed_on?: string | null
          start_date?: string | null
          state?: string | null
          updated_at?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_education_document_id_employee_id_fkey'
            columns: ['document_id', 'employee_id']
            isOneToOne: false
            referencedRelation: 'employee_documents'
            referencedColumns: ['id', 'employee_id']
          },
          {
            foreignKeyName: 'employee_education_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_education_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_education_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_emails: {
        Row: {
          created_at: string
          email: string
          email_type: string
          employee_id: string
          id: string
          is_active: boolean
          is_primary: boolean
          notes: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          email: string
          email_type: string
          employee_id: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_type?: string
          employee_id?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_emails_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_emails_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_emails_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_experience: {
        Row: {
          activities: string | null
          company: string | null
          company_type: string | null
          country: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          municipality: string | null
          notes: string | null
          period_text: string | null
          position_title: string | null
          project_name: string | null
          start_date: string | null
          state: string | null
          updated_at: string
          verification_status: string
          work_location_detail: string | null
          work_reference: string | null
        }
        ComputedFields: never
        Insert: {
          activities?: string | null
          company?: string | null
          company_type?: string | null
          country?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          municipality?: string | null
          notes?: string | null
          period_text?: string | null
          position_title?: string | null
          project_name?: string | null
          start_date?: string | null
          state?: string | null
          updated_at?: string
          verification_status?: string
          work_location_detail?: string | null
          work_reference?: string | null
        }
        Update: {
          activities?: string | null
          company?: string | null
          company_type?: string | null
          country?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          municipality?: string | null
          notes?: string | null
          period_text?: string | null
          position_title?: string | null
          project_name?: string | null
          start_date?: string | null
          state?: string | null
          updated_at?: string
          verification_status?: string
          work_location_detail?: string | null
          work_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'employee_experience_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_experience_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_experience_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_leave_permits: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          end_time: string | null
          id: string
          permit_type: string
          reason: string
          start_date: string
          start_time: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          end_time?: string | null
          id?: string
          permit_type: string
          reason: string
          start_date: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          end_time?: string | null
          id?: string
          permit_type?: string
          reason?: string
          start_date?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_leave_permits_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_leave_permits_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_leave_permits_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_phones: {
        Row: {
          created_at: string
          employee_id: string
          extension: string | null
          id: string
          is_current: boolean
          is_primary: boolean
          notes: string | null
          phone_number: string
          phone_type: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          employee_id: string
          extension?: string | null
          id?: string
          is_current?: boolean
          is_primary?: boolean
          notes?: string | null
          phone_number: string
          phone_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          extension?: string | null
          id?: string
          is_current?: boolean
          is_primary?: boolean
          notes?: string | null
          phone_number?: string
          phone_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_phones_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_phones_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_phones_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_sensitive_data: {
        Row: {
          allergies: string | null
          birth_date: string | null
          blood_type: string | null
          created_at: string
          curp: string | null
          employee_id: string
          has_medical_certificate: string | null
          medical_certificate_date: string | null
          nss: string | null
          rfc: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          allergies?: string | null
          birth_date?: string | null
          blood_type?: string | null
          created_at?: string
          curp?: string | null
          employee_id: string
          has_medical_certificate?: string | null
          medical_certificate_date?: string | null
          nss?: string | null
          rfc?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          birth_date?: string | null
          blood_type?: string | null
          created_at?: string
          curp?: string | null
          employee_id?: string
          has_medical_certificate?: string | null
          medical_certificate_date?: string | null
          nss?: string | null
          rfc?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_sensitive_data_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: true
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_sensitive_data_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: true
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_sensitive_data_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: true
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_sharepoint_folders: {
        Row: {
          created_at: string
          employee_id: string
          folder_name: string
          item_id: string
          updated_at: string
          web_url: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          employee_id: string
          folder_name: string
          item_id: string
          updated_at?: string
          web_url?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          folder_name?: string
          item_id?: string
          updated_at?: string
          web_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'employee_sharepoint_folders_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: true
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_sharepoint_folders_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: true
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_sharepoint_folders_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: true
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employee_work_sites: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          is_current: boolean
          notes: string | null
          site: string
          site_type: string | null
          start_date: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          notes?: string | null
          site: string
          site_type?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          notes?: string | null
          site?: string
          site_type?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_work_sites_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_work_sites_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_work_sites_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          employee_number: string
          employment_status: string
          first_name: string
          id: string
          last_name: string | null
          notes: string | null
          second_last_name: string | null
          updated_at: string
          version: number
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          employee_number: string
          employment_status?: string
          first_name: string
          id?: string
          last_name?: string | null
          notes?: string | null
          second_last_name?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          employee_number?: string
          employment_status?: string
          first_name?: string
          id?: string
          last_name?: string | null
          notes?: string | null
          second_last_name?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      employment_records: {
        Row: {
          area: string | null
          company: string
          created_at: string
          employee_id: string
          hire_date: string | null
          id: string
          imss_registration_date: string | null
          notes: string | null
          status: string
          termination_date: string | null
          updated_at: string
          work_center: string | null
        }
        ComputedFields: never
        Insert: {
          area?: string | null
          company?: string
          created_at?: string
          employee_id: string
          hire_date?: string | null
          id?: string
          imss_registration_date?: string | null
          notes?: string | null
          status?: string
          termination_date?: string | null
          updated_at?: string
          work_center?: string | null
        }
        Update: {
          area?: string | null
          company?: string
          created_at?: string
          employee_id?: string
          hire_date?: string | null
          id?: string
          imss_registration_date?: string | null
          notes?: string | null
          status?: string
          termination_date?: string | null
          updated_at?: string
          work_center?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'employment_records_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employment_records_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employment_records_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      external_systems: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          purpose: string | null
          responsible_area: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          purpose?: string | null
          responsible_area?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          purpose?: string | null
          responsible_area?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_profiles: {
        Row: {
          area: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          profile_version: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          area?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          profile_version?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          profile_version?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_required_courses: {
        Row: {
          course_id: string
          created_at: string
          is_mandatory: boolean
          job_profile_id: string
          notes: string | null
          periodicity_months: number | null
        }
        ComputedFields: never
        Insert: {
          course_id: string
          created_at?: string
          is_mandatory?: boolean
          job_profile_id: string
          notes?: string | null
          periodicity_months?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          is_mandatory?: boolean
          job_profile_id?: string
          notes?: string | null
          periodicity_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'job_required_courses_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_required_courses_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['course_id']
          },
          {
            foreignKeyName: 'job_required_courses_job_profile_id_fkey'
            columns: ['job_profile_id']
            isOneToOne: false
            referencedRelation: 'job_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          employee_id: string | null
          full_name: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          employee_id?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      project_required_courses: {
        Row: {
          course_id: string
          created_at: string
          is_mandatory: boolean
          job_profile_id: string
          notes: string | null
          project_id: string
          source: string | null
        }
        ComputedFields: never
        Insert: {
          course_id: string
          created_at?: string
          is_mandatory?: boolean
          job_profile_id: string
          notes?: string | null
          project_id: string
          source?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          is_mandatory?: boolean
          job_profile_id?: string
          notes?: string | null
          project_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'project_required_courses_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_required_courses_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['course_id']
          },
          {
            foreignKeyName: 'project_required_courses_job_profile_id_fkey'
            columns: ['job_profile_id']
            isOneToOne: false
            referencedRelation: 'job_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_required_courses_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          client: string | null
          created_at: string
          end_date: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          start_date: string | null
          status: string
          tender_number: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          client?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string
          tender_number?: string | null
          updated_at?: string
        }
        Update: {
          client?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          tender_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          code: string
          id: string
          name: string
        }
        ComputedFields: never
        Insert: {
          code: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sync_jobs: {
        Row: {
          attempt: number
          error_summary: string | null
          finished_at: string | null
          id: string
          published_etag: string | null
          revision: number | null
          started_at: string
          status: string
          target: string
        }
        ComputedFields: never
        Insert: {
          attempt: number
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          published_etag?: string | null
          revision?: number | null
          started_at?: string
          status?: string
          target: string
        }
        Update: {
          attempt?: number
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          published_etag?: string | null
          revision?: number | null
          started_at?: string
          status?: string
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sync_jobs_target_fkey'
            columns: ['target']
            isOneToOne: false
            referencedRelation: 'sync_state'
            referencedColumns: ['target']
          },
        ]
      }
      sync_state: {
        Row: {
          attempts: number
          drive_item_id: string | null
          last_error: string | null
          last_success_at: string | null
          lease_expires_at: string | null
          lease_token: string | null
          next_attempt_at: string | null
          pending_revision: number
          published_etag: string | null
          published_revision: number
          target: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          attempts?: number
          drive_item_id?: string | null
          last_error?: string | null
          last_success_at?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          next_attempt_at?: string | null
          pending_revision?: number
          published_etag?: string | null
          published_revision?: number
          target: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          drive_item_id?: string | null
          last_error?: string | null
          last_success_at?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          next_attempt_at?: string | null
          pending_revision?: number
          published_etag?: string | null
          published_revision?: number
          target?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          role_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_roles_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_roles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      vw_audit_history: {
        Row: {
          action_label: string | null
          actor_email: string | null
          actor_id: string | null
          actor_name: string | null
          change_date: string | null
          change_time: string | null
          changed_fields: string[] | null
          employee_id: string | null
          employee_number: string | null
          id: number
          new_data: Json | null
          occurred_at: string
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
        }
        ComputedFields: never
        Relationships: []
      }
      vw_employee_assignments: {
        Row: {
          assignment_status: string | null
          employee_id: string
          employee_number: string
          end_date: string | null
          full_name: string | null
          id: string
          is_primary: boolean
          job_profile_id: string
          job_profile_name: string
          project_id: string | null
          project_name: string | null
          start_date: string | null
          work_center: string | null
        }
        ComputedFields: never
        Relationships: [
          {
            foreignKeyName: 'employee_assignments_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_assignments_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_assignments_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
          {
            foreignKeyName: 'employee_assignments_job_profile_id_fkey'
            columns: ['job_profile_id']
            isOneToOne: false
            referencedRelation: 'job_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_assignments_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      vw_employee_contacts: {
        Row: {
          contact_kind: string | null
          contact_type: string | null
          contact_value: string | null
          employee_id: string | null
          employee_number: string | null
          is_primary: boolean | null
        }
        ComputedFields: never
        Relationships: []
      }
      vw_employee_contract_options: {
        Row: {
          employee_id: string
          id: string
          label: string | null
        }
        ComputedFields: never
        Insert: {
          employee_id?: string | null
          id?: string | null
          label?: never
        }
        Update: {
          employee_id?: string | null
          id?: string | null
          label?: never
        }
        Relationships: [
          {
            foreignKeyName: 'employee_contracts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_contracts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_directory'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_contracts_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'vw_employee_training_status'
            referencedColumns: ['employee_id']
          },
        ]
      }
      vw_employee_directory: {
        Row: {
          employee_number: string
          employment_status: string
          full_name: string | null
          has_payroll_account: boolean | null
          hire_date: string | null
          id: string
          job_profile_id: string | null
          job_profile_name: string | null
          project_name: string | null
          site: string | null
          termination_date: string | null
        }
        ComputedFields: never
        Relationships: [
          {
            foreignKeyName: 'employee_assignments_job_profile_id_fkey'
            columns: ['job_profile_id']
            isOneToOne: false
            referencedRelation: 'job_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      vw_employee_training_status: {
        Row: {
          completed_on: string | null
          course_id: string
          course_name: string
          employee_id: string
          employee_number: string
          expires_on: string | null
          training_status: string | null
        }
        ComputedFields: never
        Relationships: []
      }
    }
    Functions: {
      candidates_for_job_profile: {
        Args: { p_job_profile_id: string; p_project_id?: string }
        Returns: {
          assigned_to_project: boolean
          covered_count: number
          employee_id: string
          employee_number: string
          employment_status: string
          full_name: string
          missing_courses: string[]
          pending_courses: string[]
          required_count: number
          result: string
        }[]
      }
      create_employee: {
        Args: {
          p_employee_number?: string
          p_employment_status?: string
          p_first_name: string
          p_hire_date?: string
          p_last_name?: string
          p_notes?: string
          p_second_last_name?: string
          p_termination_date?: string
        }
        Returns: string
      }
      sync_acquire_lease: {
        Args: { p_lease_seconds?: number; p_target: string }
        Returns: {
          attempt: number
          job_id: string
          lease_token: string
        }[]
      }
      sync_complete: {
        Args: {
          p_drive_item_id: string
          p_etag: string
          p_job_id: string
          p_lease_token: string
          p_message_ids: number[]
          p_revision: number
          p_target: string
        }
        Returns: undefined
      }
      sync_fail: {
        Args: {
          p_error: string
          p_job_id: string
          p_lease_token: string
          p_permanent?: boolean
          p_retry_after_seconds?: number
          p_target: string
        }
        Returns: undefined
      }
      sync_mark_dirty: { Args: { p_target: string }; Returns: undefined }
      sync_read_snapshot: { Args: { p_lease_token: string; p_target: string }; Returns: Json }
      sync_request_retry: { Args: { p_target: string }; Returns: undefined }
      update_employee: {
        Args: {
          p_employee_number?: string
          p_employment_status: string
          p_first_name: string
          p_hire_date?: string
          p_id: string
          p_last_name?: string
          p_notes?: string
          p_second_last_name?: string
          p_termination_date?: string
          p_version: number
        }
        Returns: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
