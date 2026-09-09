import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@/i18n';
import type { Cost, CurrencyCode } from '@/types/db';
import { useSaveCost, type CostInput } from '@/api/costs';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/common/Field';

const schema = z.object({
  category: z.string().optional(),
  date: z.string().min(1, t.common.required),
  amount: z.string().min(1, t.common.required),
  currency: z.enum(['UZS', 'USD']),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const curOptions: { value: CurrencyCode; label: string }[] = [
  { value: 'UZS', label: "so'm" },
  { value: 'USD', label: 'USD' },
];
const today = () => new Date().toISOString().slice(0, 10);

const categories = [
  'Tannarx / mahsulot',
  'Logistika',
  'Bojxona / soliq',
  'Komissiya / birja yigʻimi',
  'Bank xizmati',
  'Ish haqi',
  'Boshqa',
];

interface Props {
  open: boolean;
  onClose: () => void;
  contractId: string;
  defaultCurrency?: CurrencyCode;
  cost?: Cost | null;
}

export function CostForm({
  open,
  onClose,
  contractId,
  defaultCurrency = 'UZS',
  cost,
}: Props) {
  const { toast } = useToast();
  const save = useSaveCost(contractId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      category: cost?.category ?? '',
      date: cost?.date ?? today(),
      amount: cost?.amount?.toString() ?? '',
      currency: cost?.currency ?? defaultCurrency,
      description: cost?.description ?? '',
    },
  });

  const onSubmit = (v: FormValues) => {
    const payload: CostInput = {
      category: v.category?.trim() || null,
      date: v.date,
      amount: Number(v.amount),
      currency: v.currency,
      description: v.description?.trim() || null,
    };
    save.mutate(
      { id: cost?.id, values: payload },
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
      title={cost ? t.common.edit : t.cost.new}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label={t.cost.category} optional>
          <Select
            placeholder={t.common.none}
            options={categories.map((c) => ({ value: c, label: c }))}
            {...register('category')}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t.cost.date} error={errors.date?.message}>
            <Input type="date" {...register('date')} />
          </Field>
          <Field label={t.cost.amount} error={errors.amount?.message}>
            <Input type="number" step="any" autoFocus {...register('amount')} />
          </Field>
          <Field label={t.contract.currency}>
            <Select options={curOptions} {...register('currency')} />
          </Field>
        </div>
        <Field label={t.cost.description} optional>
          <Textarea rows={2} {...register('description')} />
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
