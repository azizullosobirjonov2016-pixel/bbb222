import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@/i18n';
import type { Delivery, Obligation } from '@/types/db';
import { useSaveDelivery, type DeliveryInput } from '@/api/deliveries';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/common/Field';

const schema = z.object({
  date: z.string().min(1, t.common.required),
  obligation_id: z.string().optional(),
  qty: z.string().optional(),
  amount: z.string().min(1, t.common.required),
  document_ref: z.string().optional(),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const num = (v?: string) =>
  v === undefined || v.trim() === '' ? null : Number(v);

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  open: boolean;
  onClose: () => void;
  contractId: string;
  obligations: Obligation[];
  delivery?: Delivery | null;
}

export function DeliveryForm({
  open,
  onClose,
  contractId,
  obligations,
  delivery,
}: Props) {
  const { toast } = useToast();
  const save = useSaveDelivery(contractId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      date: delivery?.date ?? today(),
      obligation_id: delivery?.obligation_id ?? '',
      qty: delivery?.qty?.toString() ?? '',
      amount: delivery?.amount?.toString() ?? '',
      document_ref: delivery?.document_ref ?? '',
      note: delivery?.note ?? '',
    },
  });

  const onSubmit = (v: FormValues) => {
    const payload: DeliveryInput = {
      date: v.date,
      obligation_id: v.obligation_id || null,
      qty: num(v.qty),
      amount: Number(v.amount),
      document_ref: v.document_ref?.trim() || null,
      note: v.note?.trim() || null,
    };
    save.mutate(
      { id: delivery?.id, values: payload },
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
      title={delivery ? t.common.edit : t.delivery.new}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t.delivery.date} error={errors.date?.message}>
            <Input type="date" {...register('date')} />
          </Field>
          <Field label={t.delivery.amount} error={errors.amount?.message}>
            <Input type="number" step="any" autoFocus {...register('amount')} />
          </Field>
        </div>
        {obligations.length > 0 && (
          <Field label={t.delivery.obligation} optional>
            <Select
              placeholder={t.common.none}
              options={obligations.map((o) => ({
                value: o.id,
                label:
                  o.description.length > 60
                    ? o.description.slice(0, 60) + '…'
                    : o.description,
              }))}
              {...register('obligation_id')}
            />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label={t.delivery.qty} optional>
            <Input type="number" step="any" {...register('qty')} />
          </Field>
          <Field label={t.delivery.documentRef} optional>
            <Input {...register('document_ref')} />
          </Field>
        </div>
        <Field label={t.delivery.note} optional>
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
