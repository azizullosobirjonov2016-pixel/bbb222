import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TeamMember {
  user_id: string;
  email: string | null;
  role: 'admin' | 'member';
  created_at: string;
}

function useMyRole() {
  return useQuery({
    queryKey: ['team_members', 'me'],
    queryFn: async (): Promise<'admin' | 'member' | null> => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', uid)
        .maybeSingle();
      if (error) return null;
      return (data?.role as 'admin' | 'member' | undefined) ?? null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/** Joriy foydalanuvchi jamoada "admin" rolida ekanini tekshiradi */
export function useIsAdmin(): boolean {
  const { data } = useMyRole();
  return data === 'admin';
}

/** Butun jamoa ro'yxati (Sozlamalarda ko'rsatish uchun) */
export function useTeamMembers() {
  return useQuery({
    queryKey: ['team_members', 'all'],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from('team_members')
        .select('user_id, email, role, created_at')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
