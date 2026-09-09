import { Database } from 'lucide-react';
import { t } from '@/i18n';
import { Card } from '@/components/ui/card';

export function SetupScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Database className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold">{t.setup.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.setup.body}</p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-3 text-xs">
          {`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
        </pre>
        <p className="mt-4 text-xs text-muted-foreground">{t.setup.docs}</p>
      </Card>
    </div>
  );
}
