import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/common/Field';

const schema = z.object({
  email: z.string().email('Email notoʻgʻri'),
  password: z.string().min(6, t.auth.passwordHint),
});
type FormValues = z.infer<typeof schema>;

export function Login() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setBusy(true);
    try {
      if (mode === 'in') {
        await signIn(values.email, values.password);
      } else {
        const { needsConfirm } = await signUp(values.email, values.password);
        if (needsConfirm) {
          toast(t.auth.checkEmail, 'info');
          setMode('in');
        }
      }
    } catch (e) {
      toast(
        e instanceof Error && /invalid/i.test(e.message)
          ? t.auth.signInError
          : e instanceof Error
            ? e.message
            : t.common.error,
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            B
          </div>
          <div>
            <p className="font-semibold">{t.app.name}</p>
            <p className="text-xs text-muted-foreground">{t.app.tagline}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label={t.auth.email} error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="siz@example.com"
              {...register('email')}
            />
          </Field>
          <Field
            label={t.auth.password}
            error={errors.password?.message}
            hint={mode === 'up' ? t.auth.passwordHint : undefined}
          >
            <Input
              type="password"
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              {...register('password')}
            />
          </Field>
          <Button type="submit" className="w-full" loading={busy}>
            {mode === 'in' ? t.auth.signIn : t.auth.signUp}
          </Button>
        </form>

        <button
          onClick={() => setMode(mode === 'in' ? 'up' : 'in')}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === 'in' ? t.auth.noAccount : t.auth.haveAccount}{' '}
          <span className="font-medium text-primary">
            {mode === 'in' ? t.auth.signUp : t.auth.signIn}
          </span>
        </button>
      </Card>
    </div>
  );
}
