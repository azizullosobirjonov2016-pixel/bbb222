import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@/i18n';
import type { Company } from '@/types/db';
import { useSaveCompany, type CompanyInput } from '@/api/companies';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/common/Field';

const schema = z.object({
  name: z.string().min(1, t.common.required),
  inn_stir: z.string().optional(),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  company?: Company | null;
}

export function CompanyForm({ open, onClose, company }: Props) {
  const { toast } = useToast();
  const save = useSaveCompany();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: company?.name ?? '',
      inn_stir: company?.inn_stir ?? '',
      note: company?.note ?? '',
    },
  });

  const onSubmit = (v: FormValues) => {
    const payload: CompanyInput = {
      name: v.name.trim(),
      inn_stir: v.inn_stir?.trim() || null,
      note: v.note?.trim() || null,
    };
    save.mutate(
      { id: company?.id, values: payload },
      {
        onSuccess: () => {
          toast(t.common.saved);
          reset();
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
      title={company ? t.common.edit : t.company.new}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label={t.company.name} error={errors.name?.message}>
          <Input autoFocus {...register('name')} />
        </Field>
        <Field label={t.company.innStir} optional>
          <Input inputMode="numeric" {...register('inn_stir')} />
        </Field>
        <Field label={t.company.note} optional>
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
