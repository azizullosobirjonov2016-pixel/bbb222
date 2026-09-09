import { useNavigate } from 'react-router-dom';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-5xl font-bold text-muted-foreground">404</p>
      <p className="mt-2 text-lg font-medium">{t.errors.notFound}</p>
      <Button className="mt-6" onClick={() => navigate('/')}>
        {t.errors.goHome}
      </Button>
    </div>
  );
}
