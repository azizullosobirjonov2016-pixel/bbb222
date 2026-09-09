import { supabase } from '@/lib/supabase';

/** Joriy foydalanuvchi id sini qaytaradi (kirmagan bo'lsa xato) */
export async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Avval tizimga kiring');
  return id;
}

/** Supabase javobidagi xatoni JS Error ga aylantiradi */
export function unwrap<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) {
    const msg =
      (res.error as { message?: string }).message ?? 'Nomaʼlum xatolik';
    throw new Error(msg);
  }
  return res.data as T;
}

/** Ilova bo'ylab bir xil query kalitlari */
export const qk = {
  organizations: ['organizations'] as const,
  organization: (id: string) => ['organizations', id] as const,
  contracts: ['contracts'] as const,
  contract: (id: string) => ['contracts', id] as const,
  obligations: (contractId: string) => ['obligations', contractId] as const,
  deliveries: (contractId?: string) =>
    contractId ? (['deliveries', contractId] as const) : (['deliveries'] as const),
  payments: (contractId: string) => ['payments', contractId] as const,
  costs: (contractId: string) => ['costs', contractId] as const,
  finance: ['contract_finance'] as const,
  financeOne: (id: string) => ['contract_finance', id] as const,
  activity: (filter?: string) =>
    filter ? (['activity', filter] as const) : (['activity'] as const),
  templates: ['templates'] as const,
};
