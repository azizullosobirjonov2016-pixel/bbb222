import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ContractFinance } from '@/types/db';
import { qk, unwrap } from './helpers';

/** Barcha shartnomalar bo'yicha moliyaviy ko'rsatkichlar (view) */
export function useAllFinance() {
  return useQuery({
    queryKey: qk.finance,
    queryFn: async (): Promise<ContractFinance[]> =>
      unwrap(await supabase.from('contract_finance').select('*')),
  });
}

export function useContractFinance(id: string | undefined) {
  return useQuery({
    queryKey: qk.financeOne(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<ContractFinance | null> => {
      const { data, error } = await supabase
        .from('contract_finance')
        .select('*')
        .eq('contract_id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}
