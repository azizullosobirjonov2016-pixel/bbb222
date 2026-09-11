import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ContractStatus, CurrencyCode, OurRole } from '@/types/db';
import { currentUserId, qk, unwrap } from './helpers';

type PartyRef =
  { id: string } | { create: { name: string; inn_stir: string | null } };

export interface ImportPayload {
  company: PartyRef;
  organization: PartyRef | null;
  contract: {
    number: string;
    signed_date: string | null;
    subject: string | null;
    total_amount: number;
    currency: CurrencyCode;
    status: ContractStatus;
    our_role: OurRole;
    external_ref: string | null;
    external_url: string | null;
    note: string | null;
  };
  obligations: {
    description: string;
    qty: number | null;
    unit: string | null;
    unit_price: number | null;
    amount: number | null;
    note: string | null;
  }[];
}

async function resolveCompany(ref: PartyRef, userId: string): Promise<string> {
  if ('id' in ref) return ref.id;
  return unwrap<{ id: string }>(
    await supabase
      .from('companies')
      .insert({
        user_id: userId,
        name: ref.create.name,
        inn_stir: ref.create.inn_stir,
      })
      .select('id')
      .single(),
    'importContract.resolveCompany',
  ).id;
}

async function resolveOrg(ref: PartyRef, userId: string): Promise<string> {
  if ('id' in ref) return ref.id;
  return unwrap<{ id: string }>(
    await supabase
      .from('organizations')
      .insert({
        user_id: userId,
        name: ref.create.name,
        inn_stir: ref.create.inn_stir,
        type: 'customer',
      })
      .select('id')
      .single(),
    'importContract.resolveOrg',
  ).id;
}

export function useImportContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: ImportPayload): Promise<{ id: string }> => {
      const userId = await currentUserId();

      const company_id = await resolveCompany(p.company, userId);
      const organization_id = p.organization
        ? await resolveOrg(p.organization, userId)
        : null;

      const contract = unwrap<{ id: string }>(
        await supabase
          .from('contracts')
          .insert({
            user_id: userId,
            company_id,
            organization_id,
            source: 'uzex',
            template_id: null,
            ...p.contract,
          })
          .select('id')
          .single(),
        'importContract.createContract',
      );

      if (p.obligations.length) {
        unwrap(
          await supabase
            .from('obligations')
            .insert(
              p.obligations.map((o) => ({
                ...o,
                user_id: userId,
                contract_id: contract.id,
              })),
            )
            .select('id'),
          'importContract.createObligations',
        );
      }

      return { id: contract.id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.contracts });
      qc.invalidateQueries({ queryKey: qk.organizations });
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: qk.finance });
      qc.invalidateQueries({ queryKey: qk.activity() });
    },
  });
}
