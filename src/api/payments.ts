import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Payment } from '@/types/db';
import { currentUserId, qk, unwrap } from './helpers';

export type PaymentInput = Omit<
  Payment,
  'id' | 'user_id' | 'created_at' | 'contract_id'
>;

export function usePayments(contractId: string | undefined) {
  return useQuery({
    queryKey: qk.payments(contractId ?? ''),
    enabled: !!contractId,
    queryFn: async (): Promise<Payment[]> =>
      unwrap(
        await supabase
          .from('payments')
          .select('*')
          .eq('contract_id', contractId)
          .order('date', { ascending: false }),
      ),
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, contractId: string) {
  qc.invalidateQueries({ queryKey: qk.payments(contractId) });
  qc.invalidateQueries({ queryKey: qk.contract(contractId) });
  qc.invalidateQueries({ queryKey: qk.finance });
  qc.invalidateQueries({ queryKey: qk.activity() });
}

export function useSavePayment(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: PaymentInput;
    }): Promise<Payment> => {
      if (id) {
        return unwrap(
          await supabase
            .from('payments')
            .update(values)
            .eq('id', id)
            .select()
            .single(),
        );
      }
      const user_id = await currentUserId();
      return unwrap(
        await supabase
          .from('payments')
          .insert({ ...values, contract_id: contractId, user_id })
          .select()
          .single(),
      );
    },
    onSuccess: () => invalidate(qc, contractId),
  });
}

export function useDeletePayment(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(
        await supabase
          .from('payments')
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle(),
      );
    },
    onSuccess: () => invalidate(qc, contractId),
  });
}
