import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Cost } from '@/types/db';
import { CACHE_TIME, currentUserId, qk, unwrap } from './helpers';

export type CostInput = Omit<
  Cost,
  'id' | 'user_id' | 'created_at' | 'contract_id'
>;

export function useCosts(contractId: string | undefined) {
  return useQuery({
    queryKey: qk.costs(contractId ?? ''),
    enabled: !!contractId,
    queryFn: async (): Promise<Cost[]> =>
      unwrap(
        await supabase
          .from('costs')
          .select('*')
          .eq('contract_id', contractId)
          .order('date', { ascending: false }),
        'costs.list',
      ),
    ...CACHE_TIME,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, contractId: string) {
  qc.invalidateQueries({ queryKey: qk.costs(contractId) });
  qc.invalidateQueries({ queryKey: qk.contract(contractId) });
  qc.invalidateQueries({ queryKey: qk.finance });
  qc.invalidateQueries({ queryKey: qk.activity() });
}

export function useSaveCost(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: CostInput;
    }): Promise<Cost> => {
      if (id) {
        return unwrap(
          await supabase
            .from('costs')
            .update(values)
            .eq('id', id)
            .select()
            .single(),
          'costs.update',
        );
      }
      const user_id = await currentUserId();
      return unwrap(
        await supabase
          .from('costs')
          .insert({ ...values, contract_id: contractId, user_id })
          .select()
          .single(),
        'costs.create',
      );
    },
    onSuccess: () => invalidate(qc, contractId),
  });
}

export function useToggleCostPaid(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      is_paid,
    }: {
      id: string;
      is_paid: boolean;
    }): Promise<Cost> =>
      unwrap(
        await supabase
          .from('costs')
          .update({ is_paid })
          .eq('id', id)
          .select()
          .single(),
        'costs.togglePaid',
      ),
    onSuccess: () => invalidate(qc, contractId),
  });
}

export function useDeleteCost(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(
        await supabase
          .from('costs')
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle(),
        'costs.delete',
      );
    },
    onSuccess: () => invalidate(qc, contractId),
  });
}
