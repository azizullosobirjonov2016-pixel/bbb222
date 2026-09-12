import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Contract, ContractStatus } from '@/types/db';
import { CACHE_TIME, currentUserId, qk, unwrap } from './helpers';

export type ContractInput = Omit<
  Contract,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;

export interface ContractRow extends Contract {
  organization: { id: string; name: string } | null;
  company: { id: string; name: string } | null;
}

const SELECT =
  '*, organization:organizations(id, name), company:companies(id, name)';

export function useContracts() {
  return useQuery({
    queryKey: qk.contracts,
    queryFn: async (): Promise<ContractRow[]> =>
      unwrap(
        await supabase
          .from('contracts')
          .select(SELECT)
          .order('signed_date', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false }),
        'contracts.list',
      ) as ContractRow[],
    ...CACHE_TIME,
  });
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: qk.contract(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<ContractRow> =>
      unwrap(
        await supabase.from('contracts').select(SELECT).eq('id', id).single(),
        'contracts.get',
      ) as ContractRow,
    ...CACHE_TIME,
  });
}

export function useSaveContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: ContractInput;
    }): Promise<Contract> => {
      if (id) {
        return unwrap(
          await supabase
            .from('contracts')
            .update(values)
            .eq('id', id)
            .select()
            .single(),
          'contracts.update',
        );
      }
      const user_id = await currentUserId();
      return unwrap(
        await supabase
          .from('contracts')
          .insert({ ...values, user_id })
          .select()
          .single(),
        'contracts.create',
      );
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: qk.contracts });
      qc.invalidateQueries({ queryKey: qk.contract(row.id) });
      qc.invalidateQueries({ queryKey: qk.finance });
      qc.invalidateQueries({ queryKey: qk.activity() });
    },
  });
}

/** Faqat statusni yangilash (masalan, topshirish to'liq bo'lganda avtomatik) */
export function useUpdateContractStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: ContractStatus;
    }): Promise<Contract> =>
      unwrap(
        await supabase
          .from('contracts')
          .update({ status })
          .eq('id', id)
          .select()
          .single(),
        'contracts.updateStatus',
      ),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: qk.contracts });
      qc.invalidateQueries({ queryKey: qk.contract(row.id) });
      qc.invalidateQueries({ queryKey: qk.activity() });
    },
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(
        await supabase
          .from('contracts')
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle(),
        'contracts.delete',
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.contracts });
      qc.invalidateQueries({ queryKey: qk.finance });
      qc.invalidateQueries({ queryKey: qk.activity() });
    },
  });
}
