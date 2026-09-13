import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AppError, getErrorMessage } from '@/lib/errors';

function unwrapRpc<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) {
    throw new AppError('API_ERROR', getErrorMessage(res.error), res.error);
  }
  return res.data as T;
}

export function useAddTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      role,
    }: {
      email: string;
      role: 'admin' | 'member';
    }) =>
      unwrapRpc(
        await supabase.rpc('add_team_member', {
          member_email: email,
          member_role: role,
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team_members'] });
    },
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      unwrapRpc(
        await supabase.rpc('remove_team_member', { member_user_id: userId }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team_members'] });
    },
  });
}

export function useSetTeamMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: 'admin' | 'member';
    }) =>
      unwrapRpc(
        await supabase.rpc('set_team_member_role', {
          member_user_id: userId,
          new_role: role,
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team_members'] });
    },
  });
}
