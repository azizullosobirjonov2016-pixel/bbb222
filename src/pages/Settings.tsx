import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LogOut,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { t } from '@/i18n';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useIsAdmin, useTeamMembers } from '@/hooks/useTeamRole';
import {
  useAddTeamMember,
  useRemoveTeamMember,
  useSetTeamMemberRole,
} from '@/api/team';
import { useToast } from '@/components/ui/toast';
import { exportAllJson, exportContractsCsv } from '@/lib/export';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const APP_VERSION = '0.3.0';

export function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const isAdmin = useIsAdmin();
  const { data: team } = useTeamMembers();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const setRole = useSetTeamMemberRole();
  const { toast } = useToast();
  const [busy, setBusy] = useState<'json' | 'csv' | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');

  const submitAddMember = (e: FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    addMember.mutate(
      { email: newEmail.trim(), role: newRole },
      {
        onSuccess: () => {
          toast(t.settings.memberAdded);
          setNewEmail('');
          setNewRole('member');
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );
  };

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
          <CardTitle>{t.settings.team}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t.settings.yourRole}:{' '}
            <Badge tone={isAdmin ? 'primary' : 'muted'}>
              {isAdmin ? t.settings.roleAdmin : t.settings.roleMember}
            </Badge>
          </p>
          {(team ?? []).length > 0 && (
            <ul className="divide-y text-sm">
              {(team ?? []).map((m) => (
                <li
                  key={m.user_id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <span className="truncate text-muted-foreground">
                    {m.email ?? m.user_id}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    {isAdmin ? (
                      <Select
                        className="h-8 w-[110px] py-0 text-xs"
                        value={m.role}
                        disabled={m.user_id === user?.id}
                        onChange={(e) =>
                          setRole.mutate(
                            {
                              userId: m.user_id,
                              role: e.target.value as 'admin' | 'member',
                            },
                            { onError: (er) => toast(er.message, 'error') },
                          )
                        }
                        options={[
                          { value: 'admin', label: t.settings.roleAdmin },
                          { value: 'member', label: t.settings.roleMember },
                        ]}
                      />
                    ) : (
                      <Badge tone={m.role === 'admin' ? 'primary' : 'muted'}>
                        {m.role === 'admin'
                          ? t.settings.roleAdmin
                          : t.settings.roleMember}
                      </Badge>
                    )}
                    {isAdmin && m.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        aria-label={t.common.delete}
                        loading={
                          removeMember.isPending &&
                          removeMember.variables === m.user_id
                        }
                        onClick={() =>
                          removeMember.mutate(m.user_id, {
                            onSuccess: () => toast(t.common.deleted),
                            onError: (er) => toast(er.message, 'error'),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isAdmin && (
            <form
              onSubmit={submitAddMember}
              className="flex flex-wrap items-end gap-2 border-t pt-3"
            >
              <div className="min-w-[180px] flex-1">
                <Input
                  type="email"
                  placeholder={t.settings.newMemberEmail}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <Select
                className="w-[130px]"
                value={newRole}
                onChange={(e) =>
                  setNewRole(e.target.value as 'admin' | 'member')
                }
                options={[
                  { value: 'member', label: t.settings.roleMember },
                  { value: 'admin', label: t.settings.roleAdmin },
                ]}
              />
              <Button type="submit" loading={addMember.isPending}>
                <UserPlus className="h-4 w-4" />
                {t.settings.addMember}
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground">{t.settings.teamHint}</p>
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
