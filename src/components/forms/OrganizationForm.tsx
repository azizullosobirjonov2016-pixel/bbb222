import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@/i18n';
import type { Organization, OrgType } from '@/types/db';
import { useSaveOrganization, type OrgInput } from '@/api/organizations';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/common/Field';

const schema = z.object({
  name: z.string().min(1, t.common.required),
  inn_stir: z.string().optional(),
  type: z.enum(['customer', 'supplier', 'both']),
  phone: z.string().optional(),
  email: z.string().email('Email notoʻgʻri').optional().or(z.literal('')),
  address: z.string().optional(),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const typeOptions: { value: OrgType; label: string }[] = [
  { value: 'customer', label: t.org.typeCustomer },
  { value: 'supplier', label: t.org.typeSupplier },
  { value: 'both', label: t.org.typeBoth },
];

interface Props {
  open: boolean;
  onClose: () => void;
  organization?: Organization | null;
}

export function OrganizationForm({ open, onClose, organization }: Props) {
  const { toast } = useToast();
  const save = useSaveOrganization();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: organization?.name ?? '',
      inn_stir: organization?.inn_stir ?? '',
      type: organization?.type ?? 'customer',
      phone: organization?.phone ?? '',
      email: organization?.email ?? '',
      address: organization?.address ?? '',
      note: organization?.note ?? '',
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload: OrgInput = {
      name: values.name.trim(),
      inn_stir: values.inn_stir?.trim() || null,
      type: values.type,
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      address: values.address?.trim() || null,
      note: values.note?.trim() || null,
    };
    save.mutate(
      { id: organization?.id, values: payload },
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
      title={organization ? t.common.edit : t.org.new}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label={t.org.name} error={errors.name?.message}>
          <Input autoFocus {...register('name')} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t.org.type} error={errors.type?.message}>
            <Select options={typeOptions} {...register('type')} />
          </Field>
          <Field label={t.org.innStir} optional>
            <Input inputMode="numeric" {...register('inn_stir')} />
          </Field>
          <Field label={t.org.phone} optional>
            <Input type="tel" {...register('phone')} />
          </Field>
          <Field label={t.org.email} optional error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </Field>
        </div>
        <Field label={t.org.address} optional>
          <Input {...register('address')} />
        </Field>
        <Field label={t.org.note} optional>
          <Textarea {...register('note')} />
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
