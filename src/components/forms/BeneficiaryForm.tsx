import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@/i18n';
import type { BeneficiaryPayout, CurrencyCode } from '@/types/db';
import { useSaveBeneficiary, type BeneficiaryInput } from '@/api/beneficiaries';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/common/Field';

const schema = z.object({
  name: z.string().min(1, t.common.required),
  phone: z.string().optional(),
  date: z.string().min(1, t.common.required),
  amount: z.string().min(1, t.common.required),
  currency: z.enum(['UZS', 'USD']),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const curOptions: { value: CurrencyCode; label: string }[] = [
  { value: 'UZS', label: "so'm" },
  { value: 'USD', label: 'USD' },
];
const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  open: boolean;
  onClose: () => void;
  contractId: string;
  defaultCurrency?: CurrencyCode;
  beneficiary?: BeneficiaryPayout | null;
}

export function BeneficiaryForm({
  open,
  onClose,
  contractId,
  defaultCurrency = 'UZS',
  beneficiary,
}: Props) {
  const { toast } = useToast();
  const save = useSaveBeneficiary(contractId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: beneficiary?.name ?? '',
      phone: beneficiary?.phone ?? '',
      date: beneficiary?.date ?? today(),
      amount: beneficiary?.amount?.toString() ?? '',
      currency: beneficiary?.currency ?? defaultCurrency,
      note: beneficiary?.note ?? '',
    },
  });

  const onSubmit = (v: FormValues) => {
    const payload: BeneficiaryInput = {
      name: v.name.trim(),
      phone: v.phone?.trim() || null,
      date: v.date,
      amount: Number(v.amount),
      currency: v.currency,
      note: v.note?.trim() || null,
    };
    save.mutate(
      { id: beneficiary?.id, values: payload },
      {
        onSuccess: () => {
          toast(t.common.saved);
          onClose();
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={beneficiary ? t.common.edit : t.beneficiary.new}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label={t.beneficiary.name} error={errors.name?.message}>
          <Input autoFocus {...register('name')} />
        </Field>
        <Field label={t.beneficiary.phone} optional>
          <Input {...register('phone')} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t.beneficiary.date} error={errors.date?.message}>
            <Input type="date" {...register('date')} />
          </Field>
          <Field label={t.beneficiary.amount} error={errors.amount?.message}>
            <Input type="number" step="any" {...register('amount')} />
          </Field>
          <Field label={t.contract.currency}>
            <Select options={curOptions} {...register('currency')} />
          </Field>
        </div>
        <Field label={t.beneficiary.note} optional>
          <Textarea rows={2} {...register('note')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={save.isPending}>
            {t.common.save}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
