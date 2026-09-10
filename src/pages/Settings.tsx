import { useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, LogOut, XCircle } from 'lucide-react';
import { t } from '@/i18n';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/toast';
import { exportAllJson, exportContractsCsv } from '@/lib/export';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

const APP_VERSION = '0.2.0';

export function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [busy, setBusy] = useState<'json' | 'csv' | null>(null);

  const runExport = async (kind: 'json' | 'csv') => {
    setBusy(kind);
    try {
      if (kind === 'json') await exportAllJson();
      else await exportContractsCsv();
      toast(t.common.saved);
    } catch (e) {
      toast(e instanceof Error ? e.message : t.common.error, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={t.settings.title} />

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.account}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            {t.auth.signOut}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.theme}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            className="max-w-[240px]"
            value={theme}
            onChange={(e) =>
              setTheme(e.target.value as 'light' | 'dark' | 'system')
            }
            options={[
              { value: 'system', label: t.settings.themeSystem },
              { value: 'light', label: t.settings.themeLight },
              { value: 'dark', label: t.settings.themeDark },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.dataExport}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => runExport('json')}
            loading={busy === 'json'}
          >
            <Download className="h-4 w-4" />
            {t.settings.exportJson}
          </Button>
          <Button
            variant="outline"
            onClick={() => runExport('csv')}
            loading={busy === 'csv'}
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t.settings.exportCsv}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.connection}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span>
              {isSupabaseConfigured
                ? t.settings.connected
                : t.settings.notConnected}
            </span>
          </div>
          <p className="text-muted-foreground">
            {t.settings.version}: {APP_VERSION}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
