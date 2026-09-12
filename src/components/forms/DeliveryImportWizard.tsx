import { useRef, useState } from 'react';
import { FileUp, Loader2, AlertTriangle } from 'lucide-react';
import { t } from '@/i18n';
import { extractPdfText } from '@/lib/pdf/extractText';
import { parseDeliveryInvoice } from '@/lib/pdf/parseDeliveryInvoice';
import type { ContractRow } from '@/api/contracts';
import { useUpdateContractStatus } from '@/api/contracts';
import { useSaveDelivery } from '@/api/deliveries';
import { useSaveCost } from '@/api/costs';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/common/Field';

type Step = 'upload' | 'delivery' | 'cost' | 'more';

interface Props {
  open: boolean;
  onClose: () => void;
  contract: ContractRow;
  deliveredSoFar: number;
}

const today = () => new Date().toISOString().slice(0, 10);

export function DeliveryImportWizard({
  open,
  onClose,
  contract,
  deliveredSoFar,
}: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const saveDelivery = useSaveDelivery(contract.id);
  const saveCost = useSaveCost(contract.id);
  const updateStatus = useUpdateContractStatus();

  const [step, setStep] = useState<Step>('upload');
  const [busy, setBusy] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [contractMismatch, setContractMismatch] = useState<string | null>(null);
  const [newlyDeliveredAmount, setNewlyDeliveredAmount] = useState(0);

  const [d, setD] = useState({
    date: today(),
    qty: '',
    amount: '',
    document_ref: '',
    note: '',
  });
  const [cost, setCost] = useState({
    source: '',
    amount: '',
    buyer_name: '',
    buyer_phone: '',
  });
  const [extra, setExtra] = useState({
    category: '',
    amount: '',
    description: '',
  });

  function reset() {
    setStep('upload');
    setWarnings([]);
    setContractMismatch(null);
    setNewlyDeliveredAmount(0);
    setD({ date: today(), qty: '', amount: '', document_ref: '', note: '' });
    setCost({ source: '', amount: '', buyer_name: '', buyer_phone: '' });
    setExtra({ category: '', amount: '', description: '' });
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function onPick(file: File) {
    setBusy(true);
    try {
      const text = await extractPdfText(file);
      const p = parseDeliveryInvoice(text);
      const it = p.items[0];
      setD({
        date: p.date ?? today(),
        qty: it?.qty != null ? String(it.qty) : '',
        amount: p.total_amount != null ? String(p.total_amount) : '',
        document_ref: p.document_ref ?? '',
        note: p.lot_number ? `Lot ID: ${p.lot_number}` : '',
      });
      setWarnings(p.warnings);
      setContractMismatch(
        p.contract_number && p.contract_number !== contract.number
          ? `${t.deliveryImport.contractMismatch}: № ${p.contract_number}`
          : null,
      );
      setStep('delivery');
    } catch (e) {
      toast((e as Error).message || t.import.parseFailed, 'error');
    } finally {
      setBusy(false);
    }
  }

  function saveDeliveryStep() {
    if (!d.amount.trim()) {
      toast(t.delivery.amount + ': ' + t.common.required, 'error');
      return;
    }
    const amount = Number(d.amount) || 0;
    saveDelivery.mutate(
      {
        values: {
          date: d.date,
          obligation_id: null,
          qty: d.qty.trim() ? Number(d.qty) : null,
          amount,
          document_ref: d.document_ref.trim() || null,
          note: d.note.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setNewlyDeliveredAmount(amount);
          setStep('cost');
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );
  }

  function saveCostStep() {
    if (!cost.amount.trim()) {
      setStep('more');
      return;
    }
    saveCost.mutate(
      {
        values: {
          category: t.deliveryImport.purchaseCategory,
          date: today(),
          amount: Number(cost.amount) || 0,
          currency: contract.currency,
          description: cost.source.trim() || null,
          buyer_name: cost.buyer_name.trim() || null,
          buyer_phone: cost.buyer_phone.trim() || null,
        },
      },
      {
        onSuccess: () => setStep('more'),
        onError: (e) => toast(e.message, 'error'),
      },
    );
  }

  function addExtraCost() {
    if (!extra.amount.trim()) return;
    saveCost.mutate(
      {
        values: {
          category: extra.category.trim() || null,
          date: today(),
          amount: Number(extra.amount) || 0,
          currency: contract.currency,
          description: extra.description.trim() || null,
          buyer_name: null,
          buyer_phone: null,
        },
      },
      {
        onSuccess: () => {
          toast(t.common.saved);
          setExtra({ category: '', amount: '', description: '' });
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );
  }

  function finish() {
    const totalDelivered = deliveredSoFar + newlyDeliveredAmount;
    if (
      contract.total_amount > 0 &&
      totalDelivered >= contract.total_amount &&
      contract.status !== 'fulfilled'
    ) {
      updateStatus.mutate(
        { id: contract.id, status: 'fulfilled' },
        {
          onSuccess: () => toast(t.deliveryImport.autoFulfilled),
          onError: (e) => toast(e.message, 'error'),
        },
      );
    }
    toast(t.deliveryImport.done);
    handleClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={t.deliveryImport.title}
      size="sm"
    >
      {step === 'upload' && (
        <div>
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
        </div>
      )}

      {step === 'delivery' && (
        <div className="space-y-4">
          {contractMismatch && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>{contractMismatch}</span>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.delivery.date}>
              <Input
                type="date"
                value={d.date}
                onChange={(e) => setD((s) => ({ ...s, date: e.target.value }))}
              />
            </Field>
            <Field label={t.delivery.amount}>
              <Input
                type="number"
                step="any"
                value={d.amount}
                onChange={(e) =>
                  setD((s) => ({ ...s, amount: e.target.value }))
                }
              />
            </Field>
            <Field label={t.delivery.qty} optional>
              <Input
                type="number"
                step="any"
                value={d.qty}
                onChange={(e) => setD((s) => ({ ...s, qty: e.target.value }))}
              />
            </Field>
            <Field label={t.delivery.documentRef} optional>
              <Input
                value={d.document_ref}
                onChange={(e) =>
                  setD((s) => ({ ...s, document_ref: e.target.value }))
                }
              />
            </Field>
          </div>
          <Field label={t.delivery.note} optional>
            <Textarea
              rows={2}
              value={d.note}
              onChange={(e) => setD((s) => ({ ...s, note: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              {t.common.cancel}
            </Button>
            <Button onClick={saveDeliveryStep} loading={saveDelivery.isPending}>
              {t.common.confirm}
            </Button>
          </div>
        </div>
      )}

      {step === 'cost' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t.deliveryImport.costPrompt}
          </p>
          <Field label={t.deliveryImport.purchaseSource} optional>
            <Input
              value={cost.source}
              onChange={(e) =>
                setCost((s) => ({ ...s, source: e.target.value }))
              }
            />
          </Field>
          <Field label={t.deliveryImport.purchasePrice} optional>
            <Input
              type="number"
              step="any"
              value={cost.amount}
              onChange={(e) =>
                setCost((s) => ({ ...s, amount: e.target.value }))
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.cost.buyerName} optional>
              <Input
                value={cost.buyer_name}
                onChange={(e) =>
                  setCost((s) => ({ ...s, buyer_name: e.target.value }))
                }
              />
            </Field>
            <Field label={t.cost.buyerPhone} optional>
              <Input
                value={cost.buyer_phone}
                onChange={(e) =>
                  setCost((s) => ({ ...s, buyer_phone: e.target.value }))
                }
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep('more')}>
              {t.deliveryImport.skip}
            </Button>
            <Button onClick={saveCostStep} loading={saveCost.isPending}>
              {t.common.confirm}
            </Button>
          </div>
        </div>
      )}

      {step === 'more' && (
        <div className="space-y-4">
          <p className="text-sm font-medium">
            {t.deliveryImport.moreCostsPrompt}
          </p>
          <Field label={t.cost.category} optional>
            <Input
              value={extra.category}
              onChange={(e) =>
                setExtra((s) => ({ ...s, category: e.target.value }))
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.cost.amount} optional>
              <Input
                type="number"
                step="any"
                value={extra.amount}
                onChange={(e) =>
                  setExtra((s) => ({ ...s, amount: e.target.value }))
                }
              />
            </Field>
            <Field label={t.cost.description} optional>
              <Input
                value={extra.description}
                onChange={(e) =>
                  setExtra((s) => ({ ...s, description: e.target.value }))
                }
              />
            </Field>
          </div>
          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={addExtraCost}
              loading={saveCost.isPending}
            >
              {t.deliveryImport.addAnotherCost}
            </Button>
            <Button onClick={finish}>{t.deliveryImport.finish}</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
