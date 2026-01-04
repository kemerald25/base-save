export type Database = {
  public: {
    Tables: {
      savings_plans: {
        Row: {
          id: string;
          user_address: string;
          user_fid: number | null;
          plan_id: number;
          daily_amount: string; // Stored as string to handle bigint
          duration: number; // 0: ONE_MONTH, 1: THREE_MONTHS, 2: SIX_MONTHS, 3: ONE_YEAR
          start_date: string;
          end_date: string;
          total_target: string;
          accumulated_balance: string;
          principal_deposited: string;
          yield_earned: string;
          successful_deductions: number;
          missed_deductions: number;
          is_active: boolean;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_address: string;
          user_fid?: number | null;
          plan_id: number;
          daily_amount: string;
          duration: number;
          start_date: string;
          end_date: string;
          total_target: string;
          accumulated_balance: string;
          principal_deposited: string;
          yield_earned: string;
          successful_deductions?: number;
          missed_deductions?: number;
          is_active?: boolean;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_address?: string;
          user_fid?: number | null;
          plan_id?: number;
          daily_amount?: string;
          duration?: number;
          start_date?: string;
          end_date?: string;
          total_target?: string;
          accumulated_balance?: string;
          principal_deposited?: string;
          yield_earned?: string;
          successful_deductions?: number;
          missed_deductions?: number;
          is_active?: boolean;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      plan_events: {
        Row: {
          id: string;
          plan_id: number;
          user_address: string;
          event_type: string; // 'created' | 'deduction' | 'withdrawal' | 'completed' | 'yield_claimed'
          amount: string | null;
          transaction_hash: string | null;
          block_number: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: number;
          user_address: string;
          event_type: string;
          amount?: string | null;
          transaction_hash?: string | null;
          block_number?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: number;
          user_address?: string;
          event_type?: string;
          amount?: string | null;
          transaction_hash?: string | null;
          block_number?: number | null;
          created_at?: string;
        };
      };
    };
  };
};

export type SavingsPlan = Database['public']['Tables']['savings_plans']['Row'];
export type PlanEvent = Database['public']['Tables']['plan_events']['Row'];

