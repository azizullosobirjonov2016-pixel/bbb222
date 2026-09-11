import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ActivityLog } from '@/types/db';
import { qk, SHORT_CACHE_TIME, unwrap } from './helpers';

export function useActivity(opts?: {
  entityType?: string;
  contractId?: string;
  limit?: number;
}) {
  const key = opts?.contractId
    ? `contract:${opts.contractId}`
    : (opts?.entityType ?? 'all');
  return useQuery({
    queryKey: qk.activity(key),
    queryFn: async (): Promise<ActivityLog[]> => {
      let q = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(opts?.limit ?? 100);
      if (opts?.entityType) q = q.eq('entity_type', opts.entityType);
      if (opts?.contractId) q = q.eq('contract_id', opts.contractId);
      return unwrap(await q, 'activity.list');
    },
    ...SHORT_CACHE_TIME,
  });
}
