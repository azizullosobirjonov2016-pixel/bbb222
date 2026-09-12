import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BeneficiaryPayout } from '@/types/db';
import { CACHE_TIME, currentUserId, qk, unwrap, unwrapDelete } from './helpers';

export type BeneficiaryInput = Omit<
  BeneficiaryPayout,
  'id' | 'user_id' | 'created_at' | 'contract_id'
>;

export function useBeneficiaries(contractId: string | undefined) {
  return useQuery({
    queryKey: qk.beneficiaries(contractId ?? ''),
    enabled: !!contractId,
    queryFn: async (): Promise<BeneficiaryPayout[]> =>
      unwrap(
        await supabase
          .from('beneficiary_payouts')
          .select('*')
          .eq('contract_id', contractId)
          .order('date', { ascending: false }),
        'beneficiaries.list',
      ),
    ...CACHE_TIME,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, contractId: string) {
  qc.invalidateQueries({ queryKey: qk.beneficiaries(contractId) });
  qc.invalidateQueries({ queryKey: qk.activity() });
}

export function useSaveBeneficiary(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: BeneficiaryInput;
    }): Promise<BeneficiaryPayout> => {
      if (id) {
        return unwrap(
          await supabase
            .from('beneficiary_payouts')
            .update(values)
            .eq('id', id)
            .select()
            .single(),
          'beneficiaries.update',
        );
      }
      const user_id = await currentUserId();
      return unwrap(
        await supabase
          .from('beneficiary_payouts')
          .insert({ ...values, contract_id: contractId, user_id })
          .select()
          .single(),
        'beneficiaries.create',
      );
    },
    onSuccess: () => invalidate(qc, contractId),
  });
}

export function useDeleteBeneficiary(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrapDelete(
        await supabase
          .from('beneficiary_payouts')
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle(),
        'beneficiaries.delete',
      );
    },
    onSuccess: () => invalidate(qc, contractId),
  });
}
