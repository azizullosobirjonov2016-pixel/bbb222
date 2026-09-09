import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { t } from '@/i18n';
import type {
  ContractStatus,
  CurrencyCode,
  OurRole,
  ContractSource,
} from '@/types/db';
import { useContract, useSaveContract, type ContractInput } from '@/api/contracts';
import { useOrganizations } from '@/api/organizations';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Field } from '@/components/common/Field';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

const schema = z.object({
  number: z.string().min(1, t.common.required),
  organization_id: z.string().optional(),
  signed_date: z.string().optional(),
  subject: z.string().optional(),
  our_role: z.enum(['seller', 'buyer']),
  total_amount: z.coerce.number().min(0).default(0),
  currency: z.enum(['UZS', 'USD']),
  status: z.enum([
    'draft',
    'active',
    'partially_fulfilled',
    'fulfilled',
    'cancelled',
  ]),
  deadline: z.string().optional(),
  source: z.enum(['manual', 'uzex']),
  external_ref: z.string().optional(),
  external_url: z.string().optional(),
  note: z.string().optional(),
});
type FormValues = z.input<typeof schema>;

const roleOptions: { value: OurRole; label: string }[] = [
  { value: 'seller', label: t.contract.roleSeller },
  { value: 'buyer', label: t.contract.roleBuyer },
];
const currencyOptions: { value: CurrencyCode; label: string }[] = [
  { value: 'UZS', label: "so'm (UZS)" },
  { value: 'USD', label: 'dollar (USD)' },
];
const statusOptions: { value: ContractStatus; label: string }[] = (
  ['draft', 'active', 'partially_fulfilled', 'fulfilled', 'cancelled'] as const
).map((s) => ({ value: s, label: t.contract.statusLabels[s] }));
const sourceOptions: { value: ContractSource; label: string }[] = [
  { value: 'manual', label: t.contract.sourceManual },
  { value: 'uzex', label: t.contract.sourceUzex },
];

export function ContractForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: orgs } = useOrganizations();
  const { data: existing, isLoading } = useContract(id);
  const save = useSaveContract();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      number: existing?.number ?? '',
      organization_id: existing?.organization_id ?? '',
      signed_date: existing?.signed_date ?? '',
      subject: existing?.subject ?? '',
      our_role: existing?.our_role ?? 'seller',
      total_amount: existing?.total_amount ?? 0,
      currency: existing?.currency ?? 'UZS',
      status: existing?.status ?? 'draft',
      deadline: existing?.deadline ?? '',
      source: existing?.source ?? 'manual',
      external_ref: existing?.external_ref ?? '',
      external_url: existing?.external_url ?? '',
      note: existing?.note ?? '',
    },
  });

  if (isEdit && isLoading) {
    return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;
  }

  const onSubmit = (raw: FormValues) => {
    const v = schema.parse(raw);
    const payload: ContractInput = {
      number: v.number.trim(),
      organization_id: v.organization_id || null,
      signed_date: v.signed_date || null,
      subject: v.subject?.trim() || null,
      our_role: v.our_role,
      total_amount: v.total_amount,
      currency: v.currency,
      status: v.status,
      deadline: v.deadline || null,
      source: v.source,
      external_ref: v.external_ref?.trim() || null,
      external_url: v.external_url?.trim() || null,
      template_id: existing?.template_id ?? null,
      note: v.note?.trim() || null,
    };
    save.mutate(
      { id, values: payload },
      {
        onSuccess: (row) => {
          toast(t.common.saved);
          navigate(`/contracts/${row.id}`);
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={isEdit ? t.common.edit : t.contract.new}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t.contract.number} error={errors.number?.message}>
                <Input autoFocus {...register('number')} />
              </Field>
              <Field label={t.contract.organization} optional>
                <Select
                  placeholder={t.common.none}
                  options={(orgs ?? []).map((o) => ({
                    value: o.id,
                    label: o.name,
                  }))}
                  {...register('organization_id')}
                />
              </Field>
              <Field label={t.contract.signedDate} optional>
                <Input type="date" {...register('signed_date')} />
              </Field>
              <Field label={t.contract.deadline} optional>
                <Input type="date" {...register('deadline')} />
              </Field>
              <Field label={t.contract.ourRole}>
                <Select options={roleOptions} {...register('our_role')} />
              </Field>
              <Field label={t.contract.status}>
                <Select options={statusOptions} {...register('status')} />
              </Field>
              <Field
                label={t.contract.totalAmount}
                error={errors.total_amount?.message}
              >
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('total_amount')}
                />
              </Field>
              <Field label={t.contract.currency}>
                <Select options={currencyOptions} {...register('currency')} />
              </Field>
              <Field label={t.contract.source}>
                <Select options={sourceOptions} {...register('source')} />
              </Field>
              <Field label={t.contract.externalRef} optional>
                <Input {...register('external_ref')} />
              </Field>
            </div>
            <Field label={t.contract.externalUrl} optional>
              <Input type="url" placeholder="https://xarid.uzex.uz/..." {...register('external_url')} />
            </Field>
            <Field label={t.contract.subject} optional>
              <Textarea {...register('subject')} />
            </Field>
            <Field label={t.contract.note} optional>
              <Textarea {...register('note')} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" loading={save.isPending}>
                {t.common.save}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
