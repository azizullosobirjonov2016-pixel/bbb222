import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Delivery } from '@/types/db';
import { CACHE_TIME, currentUserId, qk, unwrap, unwrapDelete } from './helpers';

export type DeliveryInput = Omit<
  Delivery,
  'id' | 'user_id' | 'created_at' | 'contract_id'
>;

export interface DeliveryRow extends Delivery {
  contract: {
    id: string;
    number: string;
    currency: string;
    organization: { name: string } | null;
  } | null;
}

const selectWithContract =
  '*, contract:contracts(id, number, currency, organization:organizations(name))';

export function useDeliveries(contractId?: string) {
  return useQuery({
    queryKey: qk.deliveries(contractId),
    queryFn: async (): Promise<DeliveryRow[]> => {
      let q = supabase
        .from('deliveries')
        .select(selectWithContract)
        .order('date', { ascending: false });
      if (contractId) q = q.eq('contract_id', contractId);
      return unwrap(await q, 'deliveries.list') as DeliveryRow[];
    },
    ...CACHE_TIME,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, contractId: string) {
  qc.invalidateQueries({ queryKey: qk.deliveries(contractId) });
  qc.invalidateQueries({ queryKey: qk.deliveries() });
  qc.invalidateQueries({ queryKey: qk.contract(contractId) });
  qc.invalidateQueries({ queryKey: qk.finance });
  qc.invalidateQueries({ queryKey: qk.activity() });
}

export function useSaveDelivery(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: DeliveryInput;
    }): Promise<Delivery> => {
      if (id) {
        return unwrap(
          await supabase
            .from('deliveries')
            .update(values)
            .eq('id', id)
            .select()
            .single(),
          'deliveries.update',
        );
      }
      const user_id = await currentUserId();
      return unwrap(
        await supabase
          .from('deliveries')
          .insert({ ...values, contract_id: contractId, user_id })
          .select()
          .single(),
        'deliveries.create',
      );
    },
    onSuccess: () => invalidate(qc, contractId),
  });
}

export function useDeleteDelivery(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrapDelete(
        await supabase
          .from('deliveries')
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle(),
        'deliveries.delete',
      );
    },
    onSuccess: () => invalidate(qc, contractId),
  });
}
