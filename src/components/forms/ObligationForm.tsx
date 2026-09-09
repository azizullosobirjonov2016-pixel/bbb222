import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@/i18n';
import type { Obligation, ObligationStatus } from '@/types/db';
import {
  useSaveObligation,
  type ObligationInput,
} from '@/api/obligations';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/common/Field';

const schema = z.object({
  description: z.string().min(1, t.common.required),
  qty: z.string().optional(),
  unit: z.string().optional(),
  unit_price: z.string().optional(),
  amount: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(['pending', 'partial', 'done']),
  done_date: z.string().optional(),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const statusOptions: { value: ObligationStatus; label: string }[] = (
  ['pending', 'partial', 'done'] as const
).map((s) => ({ value: s, label: t.obligation.statusLabels[s] }));

const num = (v?: string) =>
  v === undefined || v.trim() === '' ? null : Number(v);

interface Props {
  open: boolean;
  onClose: () => void;
  contractId: string;
  obligation?: Obligation | null;
}

export function ObligationForm({
  open,
  onClose,
  contractId,
  obligation,
}: Props) {
  const { toast } = useToast();
  const save = useSaveObligation(contractId);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      description: obligation?.description ?? '',
      qty: obligation?.qty?.toString() ?? '',
      unit: obligation?.unit ?? '',
      unit_price: obligation?.unit_price?.toString() ?? '',
      amount: obligation?.amount?.toString() ?? '',
      due_date: obligation?.due_date ?? '',
      status: obligation?.status ?? 'pending',
      done_date: obligation?.done_date ?? '',
      note: obligation?.note ?? '',
    },
  });

  const qty = num(watch('qty'));
  const unitPrice = num(watch('unit_price'));
  const autoAmount =
    qty !== null && unitPrice !== null ? qty * unitPrice : null;

  const onSubmit = (v: FormValues) => {
    const amount = num(v.amount) ?? autoAmount;
    const payload: ObligationInput = {
      description: v.description.trim(),
      qty: num(v.qty),
      unit: v.unit?.trim() || null,
      unit_price: num(v.unit_price),
      amount,
      due_date: v.due_date || null,
      status: v.status,
      done_date: v.status === 'done' ? v.done_date || null : null,
      note: v.note?.trim() || null,
    };
    save.mutate(
      { id: obligation?.id, values: payload },
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
      title={obligation ? t.common.edit : t.obligation.new}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label={t.obligation.description} error={errors.description?.message}>
          <Textarea autoFocus rows={2} {...register('description')} />
        </Field>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label={t.obligation.qty} optional>
            <Input type="number" step="any" {...register('qty')} />
          </Field>
          <Field label={t.obligation.unit} optional>
            <Input placeholder="dona, kg, m³" {...register('unit')} />
          </Field>
          <Field label={t.obligation.unitPrice} optional>
            <Input type="number" step="any" {...register('unit_price')} />
          </Field>
        </div>
        <Field
          label={t.obligation.amount}
          optional
          hint={
            autoAmount !== null
              ? `Avto: ${autoAmount.toLocaleString('uz-UZ')}`
              : undefined
          }
        >
          <Input
            type="number"
            step="any"
            placeholder={autoAmount?.toString() ?? ''}
            {...register('amount')}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t.obligation.dueDate} optional>
            <Input type="date" {...register('due_date')} />
          </Field>
          <Field label={t.obligation.status}>
            <Select options={statusOptions} {...register('status')} />
          </Field>
        </div>
        {watch('status') === 'done' && (
          <Field label={t.obligation.doneDate} optional>
            <Input type="date" {...register('done_date')} />
          </Field>
        )}
        <Field label={t.obligation.note} optional>
          <Input {...register('note')} />
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
