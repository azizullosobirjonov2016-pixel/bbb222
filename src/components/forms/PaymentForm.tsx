import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@/i18n';
import type { Payment, PaymentDirection, CurrencyCode } from '@/types/db';
import { useSavePayment, type PaymentInput } from '@/api/payments';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/common/Field';

const schema = z.object({
  direction: z.enum(['in', 'out']),
  date: z.string().min(1, t.common.required),
  amount: z.string().min(1, t.common.required),
  currency: z.enum(['UZS', 'USD']),
  purpose: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const dirOptions: { value: PaymentDirection; label: string }[] = [
  { value: 'in', label: t.payment.in },
  { value: 'out', label: t.payment.out },
];
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
  payment?: Payment | null;
}

export function PaymentForm({
  open,
  onClose,
  contractId,
  defaultCurrency = 'UZS',
  payment,
}: Props) {
  const { toast } = useToast();
  const save = useSavePayment(contractId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      direction: payment?.direction ?? 'in',
      date: payment?.date ?? today(),
      amount: payment?.amount?.toString() ?? '',
      currency: payment?.currency ?? defaultCurrency,
      purpose: payment?.purpose ?? '',
    },
  });

  const onSubmit = (v: FormValues) => {
    const payload: PaymentInput = {
      direction: v.direction,
      date: v.date,
      amount: Number(v.amount),
      currency: v.currency,
      purpose: v.purpose?.trim() || null,
    };
    save.mutate(
      { id: payment?.id, values: payload },
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
      title={payment ? t.common.edit : t.payment.new}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t.payment.direction}>
            <Select options={dirOptions} {...register('direction')} />
          </Field>
          <Field label={t.payment.date} error={errors.date?.message}>
            <Input type="date" {...register('date')} />
          </Field>
          <Field label={t.payment.amount} error={errors.amount?.message}>
            <Input type="number" step="any" autoFocus {...register('amount')} />
          </Field>
          <Field label={t.contract.currency}>
            <Select options={curOptions} {...register('currency')} />
          </Field>
        </div>
        <Field label={t.payment.purpose} optional>
          <Input {...register('purpose')} />
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
