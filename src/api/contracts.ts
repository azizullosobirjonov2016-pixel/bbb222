import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Contract } from '@/types/db';
import { currentUserId, qk, unwrap } from './helpers';

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
      ) as ContractRow[],
  });
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: qk.contract(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<ContractRow> =>
      unwrap(
        await supabase
          .from('contracts')
          .select(SELECT)
          .eq('id', id)
          .single(),
      ) as ContractRow,
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
        );
      }
      const user_id = await currentUserId();
      return unwrap(
        await supabase
          .from('contracts')
          .insert({ ...values, user_id })
          .select()
          .single(),
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
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.contracts });
      qc.invalidateQueries({ queryKey: qk.finance });
      qc.invalidateQueries({ queryKey: qk.activity() });
    },
  });
}
