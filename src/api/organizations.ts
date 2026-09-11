import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Organization } from '@/types/db';
import { CACHE_TIME, currentUserId, qk, unwrap } from './helpers';

export type OrgInput = Omit<
  Organization,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;

export interface OrgWithStats extends Organization {
  contracts_count: number;
}

export function useOrganizations() {
  return useQuery({
    queryKey: qk.organizations,
    queryFn: async (): Promise<OrgWithStats[]> => {
      const orgs = unwrap(
        await supabase
          .from('organizations')
          .select('*')
          .order('name', { ascending: true }),
        'organizations.list',
      );
      const counts = unwrap(
        await supabase.from('contracts').select('organization_id'),
        'organizations.list.counts',
      );
      const map = new Map<string, number>();
      for (const row of counts as { organization_id: string | null }[]) {
        if (row.organization_id)
          map.set(row.organization_id, (map.get(row.organization_id) ?? 0) + 1);
      }
      return (orgs as Organization[]).map((o) => ({
        ...o,
        contracts_count: map.get(o.id) ?? 0,
      }));
    },
    ...CACHE_TIME,
  });
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: qk.organization(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<Organization> =>
      unwrap(
        await supabase.from('organizations').select('*').eq('id', id).single(),
        'organizations.get',
      ),
    ...CACHE_TIME,
  });
}

export function useSaveOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: OrgInput;
    }): Promise<Organization> => {
      if (id) {
        return unwrap(
          await supabase
            .from('organizations')
            .update(values)
            .eq('id', id)
            .select()
            .single(),
          'organizations.update',
        );
      }
      const user_id = await currentUserId();
      return unwrap(
        await supabase
          .from('organizations')
          .insert({ ...values, user_id })
          .select()
          .single(),
        'organizations.create',
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.organizations });
    },
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(
        await supabase
          .from('organizations')
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle(),
        'organizations.delete',
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.organizations });
      qc.invalidateQueries({ queryKey: qk.contracts });
    },
  });
}
