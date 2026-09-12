import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CurrencyCode } from '@/types/db';
import { CACHE_TIME, qk, unwrap } from './helpers';

/**
 * Kassadagi pul mablag'i — barcha shartnomalar bo'ylab:
 * balance = kirim to'lovlar - chiqim to'lovlar
 *           - to'langan xarajatlar - foyda oluvchilarga berilgan pul
 */
export interface CashboxBalance {
  currency: CurrencyCode;
  paidIn: number;
  paidOut: number;
  paidCosts: number;
  beneficiaryPayouts: number;
  balance: number;
}

export function useCashbox() {
  return useQuery({
    queryKey: qk.cashbox,
    queryFn: async (): Promise<CashboxBalance[]> => {
      const [paymentsRes, costsRes, beneficiariesRes] = await Promise.all([
        supabase.from('payments').select('direction, amount, currency'),
        supabase.from('costs').select('amount, currency').eq('is_paid', true),
        supabase.from('beneficiary_payouts').select('amount, currency'),
      ]);
      const payments = unwrap(paymentsRes, 'cashbox.payments') as {
        direction: 'in' | 'out';
        amount: number;
        currency: CurrencyCode;
      }[];
      const costs = unwrap(costsRes, 'cashbox.costs') as {
        amount: number;
        currency: CurrencyCode;
      }[];
      const beneficiaries = unwrap(
        beneficiariesRes,
        'cashbox.beneficiaries',
      ) as {
        amount: number;
        currency: CurrencyCode;
      }[];

      const byCurrency = new Map<CurrencyCode, CashboxBalance>();
      const get = (c: CurrencyCode) => {
        let v = byCurrency.get(c);
        if (!v) {
          v = {
            currency: c,
            paidIn: 0,
            paidOut: 0,
            paidCosts: 0,
            beneficiaryPayouts: 0,
            balance: 0,
          };
          byCurrency.set(c, v);
        }
        return v;
      };

      for (const p of payments) {
        const b = get(p.currency);
        if (p.direction === 'in') b.paidIn += Number(p.amount);
        else b.paidOut += Number(p.amount);
      }
      for (const c of costs) {
        get(c.currency).paidCosts += Number(c.amount);
      }
      for (const b of beneficiaries) {
        get(b.currency).beneficiaryPayouts += Number(b.amount);
      }

      for (const v of byCurrency.values()) {
        v.balance = v.paidIn - v.paidOut - v.paidCosts - v.beneficiaryPayouts;
      }

      return [...byCurrency.values()].sort((a) =>
        a.currency === 'UZS' ? -1 : 1,
      );
    },
    ...CACHE_TIME,
  });
}
