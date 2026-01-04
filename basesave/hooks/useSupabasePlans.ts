'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { SavingsPlan, PlanEvent } from '@/lib/supabase/types';
import { useAccount } from 'wagmi';
import { useQuickAuth } from './useQuickAuth';

/**
 * Hook to fetch all plans for the current user
 */
export function useUserPlans() {
  const { address } = useAccount();
  const { userData } = useQuickAuth();

  return useQuery({
    queryKey: ['supabasePlans', address, userData?.fid],
    queryFn: async () => {
      if (!address || !isSupabaseConfigured()) return [];

      const query = supabase
        .from('savings_plans')
        .select('*')
        .eq('user_address', address.toLowerCase())
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching plans:', error);
        throw error;
      }

      return (data || []) as SavingsPlan[];
    },
    enabled: !!address && isSupabaseConfigured(),
  });
}

/**
 * Hook to fetch a specific plan by plan ID
 */
export function usePlanById(planId: number | null) {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['supabasePlan', planId, address],
    queryFn: async () => {
      if (!planId || !address || !isSupabaseConfigured()) return null;

      const { data, error } = await supabase
        .from('savings_plans')
        .select('*')
        .eq('plan_id', planId)
        .eq('user_address', address.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error fetching plan:', error);
        throw error;
      }

      return data as SavingsPlan;
    },
    enabled: !!planId && !!address && isSupabaseConfigured(),
  });
}

/**
 * Hook to save a plan to Supabase after creation
 */
export function useSavePlan() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { userData } = useQuickAuth();

  return useMutation({
    mutationFn: async (planData: {
      planId: number;
      dailyAmount: string;
      duration: number;
      startDate: string;
      endDate: string;
      totalTarget: string;
    }) => {
      if (!address) throw new Error('No address available');
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, skipping plan save to database');
        return null;
      }

      const { data, error } = await supabase
        .from('savings_plans')
        .insert({
          user_address: address.toLowerCase(),
          user_fid: userData?.fid || null,
          plan_id: planData.planId,
          daily_amount: planData.dailyAmount,
          duration: planData.duration,
          start_date: planData.startDate,
          end_date: planData.endDate,
          total_target: planData.totalTarget,
          accumulated_balance: '0',
          principal_deposited: '0',
          yield_earned: '0',
          successful_deductions: 0,
          missed_deductions: 0,
          is_active: true,
          is_completed: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving plan:', error);
        throw error;
      }

      return data as SavingsPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabasePlans'] });
    },
  });
}

/**
 * Hook to update a plan in Supabase
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      updates,
    }: {
      planId: number;
      updates: Partial<SavingsPlan>;
    }) => {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, skipping plan update');
        return null;
      }

      const { data, error } = await supabase
        .from('savings_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('plan_id', planId)
        .select()
        .single();

      if (error) {
        console.error('Error updating plan:', error);
        throw error;
      }

      return data as SavingsPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabasePlans'] });
      queryClient.invalidateQueries({ queryKey: ['supabasePlan'] });
    },
  });
}

/**
 * Hook to save a plan event
 */
export function useSavePlanEvent() {
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (eventData: {
      planId: number;
      eventType: string;
      amount?: string;
      transactionHash?: string;
      blockNumber?: number;
    }) => {
      if (!address) throw new Error('No address available');
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, skipping event save');
        return null;
      }

      const { data, error } = await supabase
        .from('plan_events')
        .insert({
          plan_id: eventData.planId,
          user_address: address.toLowerCase(),
          event_type: eventData.eventType,
          amount: eventData.amount || null,
          transaction_hash: eventData.transactionHash || null,
          block_number: eventData.blockNumber || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving plan event:', error);
        throw error;
      }

      return data as PlanEvent;
    },
  });
}

/**
 * Hook to fetch plan events
 */
export function usePlanEvents(planId: number | null) {
  return useQuery({
    queryKey: ['planEvents', planId],
    queryFn: async () => {
      if (!planId || !isSupabaseConfigured()) return [];

      const { data, error } = await supabase
        .from('plan_events')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching plan events:', error);
        throw error;
      }

      return (data || []) as PlanEvent[];
    },
    enabled: !!planId && isSupabaseConfigured(),
  });
}

