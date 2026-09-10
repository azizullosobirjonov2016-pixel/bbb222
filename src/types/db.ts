/**
 * Supabase sxemasi bilan mos keladigan tiplar.
 * `supabase/migrations/*.sql` bilan sinxron saqlang.
 */

export type OrgType = 'customer' | 'supplier' | 'both';
export type OurRole = 'seller' | 'buyer';
export type CurrencyCode = 'UZS' | 'USD';
export type ContractStatus =
  | 'draft'
  | 'active'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'cancelled';
export type ObligationStatus = 'pending' | 'partial' | 'done';
export type PaymentDirection = 'in' | 'out';
export type ContractSource = 'manual' | 'uzex';
export type TemplateKind = 'contract' | 'obligation_set' | 'checklist';
export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'import'
  | 'export';

export interface Company {
  id: string;
  user_id: string;
  name: string;
  inn_stir: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  user_id: string;
  name: string;
  inn_stir: string | null;
  type: OrgType;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  user_id: string;
  number: string;
  company_id: string | null;
  organization_id: string | null;
  signed_date: string | null;
  subject: string | null;
  our_role: OurRole;
  total_amount: number;
  currency: CurrencyCode;
  status: ContractStatus;
  deadline: string | null;
  source: ContractSource;
  external_ref: string | null;
  external_url: string | null;
  template_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Obligation {
  id: string;
  user_id: string;
  contract_id: string;
  description: string;
  qty: number | null;
  unit: string | null;
  unit_price: number | null;
  amount: number | null;
  due_date: string | null;
  status: ObligationStatus;
  done_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  user_id: string;
  contract_id: string;
  obligation_id: string | null;
  date: string;
  qty: number | null;
  amount: number;
  document_ref: string | null;
  note: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  contract_id: string;
  direction: PaymentDirection;
  date: string;
  amount: number;
  currency: CurrencyCode;
  purpose: string | null;
  created_at: string;
}

export interface Cost {
  id: string;
  user_id: string;
  contract_id: string;
  category: string | null;
  date: string;
  amount: number;
  currency: CurrencyCode;
  description: string | null;
  created_at: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  kind: TemplateKind;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UzexLot {
  id: string;
  user_id: string;
  lot_number: string;
  source: string;
  url: string | null;
  title: string | null;
  customer_name: string | null;
  start_price: number | null;
  currency: CurrencyCode | null;
  status: string | null;
  deadline: string | null;
  raw: Record<string, unknown> | null;
  fetched_at: string;
  contract_id: string | null;
}

export interface ActivityLog {
  id: number;
  user_id: string;
  entity_type: string;
  entity_id: string | null;
  action: ActivityAction;
  summary: string | null;
  diff: Record<string, unknown> | null;
  created_at: string;
}

/** `contract_finance` view qatori */
export interface ContractFinance {
  contract_id: string;
  user_id: string;
  company_id: string | null;
  our_role: OurRole;
  currency: CurrencyCode;
  contract_value: number;
  paid_in: number;
  paid_out: number;
  costs_total: number;
  delivered_total: number;
  revenue: number;
  spent: number;
  profit: number;
  outstanding: number;
  progress: number;
}
