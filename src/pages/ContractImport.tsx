import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileUp, Loader2, AlertTriangle } from 'lucide-react';
import { t } from '@/i18n';
import { extractPdfText } from '@/lib/pdf/extractText';
import { parseUzexContract, type ParsedContract } from '@/lib/pdf/parseUzexContract';
import { useCompanies } from '@/api/companies';
import { useOrganizations } from '@/api/organizations';
import { useImportContract, type ImportPayload } from '@/api/importContract';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Field } from '@/components/common/Field';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const CREATE = '__create__';

function digits(s: string | null): string {
  return (s ?? '').replace(/\D/g, '');
}

export function ContractImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: companies } = useCompanies();
  const { data: orgs } = useOrganizations();
  const importMut = useImportContract();

  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedContract | null>(null);

  // Tahrirlanadigan holat
  const [f, setF] = useState({
    number: '',
    signed_date: '',
    subject: '',
    total_amount: '0',
    currency: 'UZS' as 'UZS' | 'USD',
    status: 'active' as ImportPayload['contract']['status'],
    external_ref: '',
    note: '',
    companySel: CREATE,
    companyName: '',
    companyStir: '',
    orgSel: CREATE,
    orgName: '',
    orgStir: '',
    oblDesc: '',
    oblQty: '1',
    oblUnit: '',
    oblPrice: '0',
    oblAmount: '0',
  });
  const set = (k: keyof typeof f, v: string) =>
    setF((s) => ({ ...s, [k]: v }));

  const matchedCompany = useMemo(() => {
    const stir = digits(parsed?.executor.stir ?? null);
    return stir
      ? (companies ?? []).find((c) => digits(c.inn_stir) === stir)
      : undefined;
  }, [companies, parsed]);
  const matchedOrg = useMemo(() => {
    const stir = digits(parsed?.customer.stir ?? null);
    return stir
      ? (orgs ?? []).find((o) => digits(o.inn_stir) === stir)
      : undefined;
  }, [orgs, parsed]);

  async function onPick(file: File) {
    setBusy(true);
    setFileName(file.name);
    try {
      const text = await extractPdfText(file);
      const p = parseUzexContract(text);
      setParsed(p);
      const it = p.items[0];
      setF((s) => ({
        ...s,
        number: p.number ?? '',
        signed_date: p.signed_date ?? '',
        subject: p.subject ?? '',
        total_amount: String(p.total_amount ?? 0),
        currency: p.currency,
        external_ref: p.lot_number ?? '',
        note: [p.place && `Tuzilgan joy: ${p.place}`, p.portal && `Portal: ${p.portal}`]
          .filter(Boolean)
          .join(' · '),
        companySel: CREATE,
        companyName: p.executor.name ?? '',
        companyStir: p.executor.stir ?? '',
        orgSel: CREATE,
        orgName: p.customer.name ?? '',
        orgStir: p.customer.stir ?? '',
        oblDesc: it?.name ?? p.subject ?? '',
        oblQty: String(it?.qty ?? 1),
        oblUnit: it?.unit ?? '',
        oblPrice: String(it?.agreed_price ?? 0),
        oblAmount: String(it?.amount ?? p.total_amount ?? 0),
      }));
      // avtomatik moslik topilsa — o'shani tanlaймиз
      const stirC = digits(p.executor.stir);
      const mc = stirC
        ? (companies ?? []).find((c) => digits(c.inn_stir) === stirC)
        : undefined;
      if (mc) setF((s) => ({ ...s, companySel: mc.id }));
      const stirO = digits(p.customer.stir);
      const mo = stirO
        ? (orgs ?? []).find((o) => digits(o.inn_stir) === stirO)
        : undefined;
      if (mo) setF((s) => ({ ...s, orgSel: mo.id }));
    } catch (e) {
      toast((e as Error).message || t.import.parseFailed, 'error');
      setParsed(null);
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!f.number.trim()) {
      toast(t.import.needNumber, 'error');
      return;
    }
    const company: ImportPayload['company'] =
      f.companySel === CREATE
        ? { create: { name: f.companyName.trim(), inn_stir: f.companyStir.trim() || null } }
        : { id: f.companySel };
    if (f.companySel === CREATE && !f.companyName.trim()) {
      toast(t.import.needCompany, 'error');
      return;
    }
    const organization: ImportPayload['organization'] =
      !f.orgName.trim() && f.orgSel === CREATE
        ? null
        : f.orgSel === CREATE
          ? { create: { name: f.orgName.trim(), inn_stir: f.orgStir.trim() || null } }
          : { id: f.orgSel };

    const amount = Number(f.total_amount) || 0;
    const payload: ImportPayload = {
      company,
      organization,
      contract: {
        number: f.number.trim(),
        signed_date: f.signed_date || null,
        subject: f.subject.trim() || null,
        total_amount: amount,
        currency: f.currency,
        status: f.status,
        our_role: 'seller',
        external_ref: f.external_ref.trim() || null,
        external_url: null,
        note: f.note.trim() || null,
      },
      obligations: f.oblDesc.trim()
        ? [
            {
              description: f.oblDesc.trim(),
              qty: Number(f.oblQty) || null,
              unit: f.oblUnit.trim() || null,
              unit_price: Number(f.oblPrice) || null,
              amount: Number(f.oblAmount) || null,
              note: parsed?.items[0]?.specs ?? null,
            },
          ]
        : [],
    };

    importMut.mutate(payload, {
      onSuccess: ({ id }) => {
        toast(t.import.done);
        navigate(`/contracts/${id}`);
      },
      onError: (e) => toast((e as Error).message, 'error'),
    });
  }

  const companyOptions = [
    ...(companies ?? []).map((c) => ({ value: c.id, label: c.name })),
    { value: CREATE, label: t.import.createNew },
  ];
  const orgOptions = [
    ...(orgs ?? []).map((o) => ({ value: o.id, label: o.name })),
    { value: CREATE, label: t.import.createNew },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t.import.title}
        description={t.import.subtitle}
        actions={
          <Button variant="outline" onClick={() => navigate('/contracts')}>
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
        }
      />

      {!parsed && (
        <Card>
          <CardContent className="pt-6">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-input py-12 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <FileUp className="h-8 w-8" />
              )}
              <span className="text-sm font-medium">
                {busy ? t.import.reading : t.import.pick}
              </span>
              <span className="text-xs">{fileName ?? t.import.hint}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPick(file);
                e.target.value = '';
              }}
            />
          </CardContent>
        </Card>
      )}

      {parsed && (
        <div className="space-y-4">
          {!parsed.isUzexTemplate && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>{t.import.notTemplate}</span>
            </div>
          )}
          {parsed.warnings.length > 0 && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <p className="mb-1 flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {t.import.checkFields}
              </p>
              <ul className="ml-6 list-disc space-y-0.5 text-muted-foreground">
                {parsed.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <Card>
            <CardContent className="space-y-4 pt-5">
              <p className="text-xs text-muted-foreground">
                {fileName} — {t.import.reviewNote}
              </p>

              {/* Mening tashkilotim */}
              <Field
                label={t.contract.company}
                hint={
                  matchedCompany
                    ? `${t.import.matched}: ${matchedCompany.name}`
                    : t.import.willCreate
                }
              >
                <Select
                  options={companyOptions}
                  value={f.companySel}
                  onChange={(e) => set('companySel', e.target.value)}
                />
              </Field>
              {f.companySel === CREATE && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    placeholder={t.company.name}
                    value={f.companyName}
                    onChange={(e) => set('companyName', e.target.value)}
                  />
                  <Input
                    placeholder={t.company.innStir}
                    value={f.companyStir}
                    onChange={(e) => set('companyStir', e.target.value)}
                  />
                </div>
              )}

              {/* Kontragent */}
              <Field
                label={t.contract.organization}
                hint={
                  matchedOrg
                    ? `${t.import.matched}: ${matchedOrg.name}`
                    : t.import.willCreate
                }
              >
                <Select
                  options={orgOptions}
                  value={f.orgSel}
                  onChange={(e) => set('orgSel', e.target.value)}
                />
              </Field>
              {f.orgSel === CREATE && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    placeholder={t.org.name}
                    value={f.orgName}
                    onChange={(e) => set('orgName', e.target.value)}
                  />
                  <Input
                    placeholder={t.org.innStir}
                    value={f.orgStir}
                    onChange={(e) => set('orgStir', e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t.contract.number}>
                  <Input
                    value={f.number}
                    onChange={(e) => set('number', e.target.value)}
                  />
                </Field>
                <Field label={t.contract.signedDate} optional>
                  <Input
                    type="date"
                    value={f.signed_date}
                    onChange={(e) => set('signed_date', e.target.value)}
                  />
                </Field>
                <Field label={t.contract.totalAmount}>
                  <Input
                    type="number"
                    value={f.total_amount}
                    onChange={(e) => set('total_amount', e.target.value)}
                  />
                </Field>
                <Field label={t.contract.currency}>
                  <Select
                    options={[
                      { value: 'UZS', label: "so'm (UZS)" },
                      { value: 'USD', label: 'USD' },
                    ]}
                    value={f.currency}
                    onChange={(e) => set('currency', e.target.value)}
                  />
                </Field>
                <Field label={t.contract.externalRef} optional>
                  <Input
                    value={f.external_ref}
                    onChange={(e) => set('external_ref', e.target.value)}
                  />
                </Field>
                <Field label={t.contract.status}>
                  <Select
                    options={(
                      ['draft', 'active', 'partially_fulfilled', 'fulfilled', 'cancelled'] as const
                    ).map((s) => ({ value: s, label: t.contract.statusLabels[s] }))}
                    value={f.status}
                    onChange={(e) => set('status', e.target.value)}
                  />
                </Field>
              </div>

              <Field label={t.contract.subject} optional>
                <Textarea
                  rows={2}
                  value={f.subject}
                  onChange={(e) => set('subject', e.target.value)}
                />
              </Field>
              <Field label={t.contract.note} optional>
                <Textarea
                  rows={2}
                  value={f.note}
                  onChange={(e) => set('note', e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Bajarish talabi */}
          <Card>
            <CardContent className="space-y-4 pt-5">
              <p className="text-sm font-medium">{t.import.obligation}</p>
              <Field label={t.obligation.description}>
                <Input
                  value={f.oblDesc}
                  onChange={(e) => set('oblDesc', e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label={t.obligation.qty} optional>
                  <Input
                    type="number"
                    value={f.oblQty}
                    onChange={(e) => set('oblQty', e.target.value)}
                  />
                </Field>
                <Field label={t.obligation.unit} optional>
                  <Input
                    value={f.oblUnit}
                    onChange={(e) => set('oblUnit', e.target.value)}
                  />
                </Field>
                <Field label={t.obligation.unitPrice} optional>
                  <Input
                    type="number"
                    value={f.oblPrice}
                    onChange={(e) => set('oblPrice', e.target.value)}
                  />
                </Field>
                <Field label={t.obligation.amount} optional>
                  <Input
                    type="number"
                    value={f.oblAmount}
                    onChange={(e) => set('oblAmount', e.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setParsed(null);
                setFileName(null);
              }}
            >
              {t.import.another}
            </Button>
            <Button onClick={save} loading={importMut.isPending}>
              {t.import.save}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
