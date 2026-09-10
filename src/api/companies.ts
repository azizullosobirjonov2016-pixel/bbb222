import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Company } from '@/types/db';
import { currentUserId, unwrap } from './helpers';

const KEY = ['companies'] as const;

export type CompanyInput = Omit<
  Company,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;

export interface CompanyWithStats extends Company {
  contracts_count: number;
}

export function useCompanies() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<CompanyWithStats[]> => {
      const rows = unwrap(
        await supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true }),
      ) as Company[];
      const counts = unwrap(
        await supabase.from('contracts').select('company_id'),
      ) as { company_id: string | null }[];
      const map = new Map<string, number>();
      for (const r of counts) {
        if (r.company_id)
          map.set(r.company_id, (map.get(r.company_id) ?? 0) + 1);
      }
      return rows.map((c) => ({
        ...c,
        contracts_count: map.get(c.id) ?? 0,
      }));
    },
  });
}

export function useSaveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: CompanyInput;
    }): Promise<Company> => {
      if (id) {
        return unwrap(
          await supabase
            .from('companies')
            .update(values)
            .eq('id', id)
            .select()
            .single(),
        );
      }
      const user_id = await currentUserId();
      return unwrap(
        await supabase
          .from('companies')
          .insert({ ...values, user_id })
          .select()
          .single(),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(
        await supabase
          .from('companies')
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle(),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}
