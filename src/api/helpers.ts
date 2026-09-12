import { supabase } from '@/lib/supabase';
import { AppError, getErrorMessage, logError } from '@/lib/errors';

/** Joriy foydalanuvchi id sini qaytaradi (kirmagan bo'lsa xato) */
export async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Avval tizimga kiring');
  return id;
}

/**
 * Supabase javobidagi xatoni AppError ga aylantiradi
 * @param res Supabase response {data, error}
 * @param context Optional context for logging
 * @throws AppError if res.error exists
 */
export function unwrap<T>(
  res: { data: T | null; error: unknown },
  context?: string,
): T {
  if (res.error) {
    const message = getErrorMessage(res.error);
    if (context) {
      logError(context, res.error);
    }
    throw new AppError('API_ERROR', message, res.error);
  }
  return res.data as T;
}

/** Standart query keshlash muddati (ko'p ma'lumotlar uchun) */
export const CACHE_TIME = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
} as const;

/** Tez-tez o'zgaruvchi ma'lumotlar (masalan, activity log) uchun qisqaroq kesh */
export const SHORT_CACHE_TIME = {
  staleTime: 2 * 60 * 1000,
  gcTime: 5 * 60 * 1000,
} as const;

/** Ilova bo'ylab bir xil query kalitlari */
export const qk = {
  organizations: ['organizations'] as const,
  organization: (id: string) => ['organizations', id] as const,
  contracts: ['contracts'] as const,
  contract: (id: string) => ['contracts', id] as const,
  obligations: (contractId: string) => ['obligations', contractId] as const,
  deliveries: (contractId?: string) =>
    contractId
      ? (['deliveries', contractId] as const)
      : (['deliveries'] as const),
  payments: (contractId: string) => ['payments', contractId] as const,
  costs: (contractId: string) => ['costs', contractId] as const,
  beneficiaries: (contractId: string) =>
    ['beneficiary_payouts', contractId] as const,
  finance: ['contract_finance'] as const,
  financeOne: (id: string) => ['contract_finance', id] as const,
  activity: (filter?: string) =>
    filter ? (['activity', filter] as const) : (['activity'] as const),
  templates: ['templates'] as const,
};
