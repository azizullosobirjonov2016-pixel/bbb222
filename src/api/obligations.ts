import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Obligation } from '@/types/db';
import { currentUserId, qk, unwrap } from './helpers';

export type ObligationInput = Omit<
  Obligation,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'contract_id'
>;

export function useObligations(contractId: string | undefined) {
  return useQuery({
    queryKey: qk.obligations(contractId ?? ''),
    enabled: !!contractId,
    queryFn: async (): Promise<Obligation[]> =>
      unwrap(
        await supabase
          .from('obligations')
          .select('*')
          .eq('contract_id', contractId)
          .order('due_date', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true }),
      ),
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, contractId: string) {
  qc.invalidateQueries({ queryKey: qk.obligations(contractId) });
  qc.invalidateQueries({ queryKey: qk.contract(contractId) });
  qc.invalidateQueries({ queryKey: qk.activity() });
}

export function useSaveObligation(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: ObligationInput;
    }): Promise<Obligation> => {
      if (id) {
        return unwrap(
          await supabase
            .from('obligations')
            .update(values)
            .eq('id', id)
            .select()
            .single(),
        );
      }
      const user_id = await currentUserId();
      return unwrap(
        await supabase
          .from('obligations')
          .insert({ ...values, contract_id: contractId, user_id })
          .select()
          .single(),
      );
    },
    onSuccess: () => invalidate(qc, contractId),
  });
}

export function useDeleteObligation(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(
        await supabase
          .from('obligations')
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle(),
      );
    },
    onSuccess: () => invalidate(qc, contractId),
  });
}
