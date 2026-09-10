import {
  LayoutDashboard,
  Building2,
  Briefcase,
  FileText,
  PackageCheck,
  Wallet,
  History,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { t } from '@/i18n';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** mobil pastki panelda ko'rsatilsinmi */
  primary?: boolean;
}

export const navItems: NavItem[] = [
  { to: '/', label: t.nav.dashboard, icon: LayoutDashboard, primary: true },
  {
    to: '/contracts',
    label: t.nav.contracts,
    icon: FileText,
    primary: true,
  },
  { to: '/finance', label: t.nav.finance, icon: Wallet, primary: true },
  {
    to: '/companies',
    label: t.nav.companies,
    icon: Briefcase,
  },
  {
    to: '/organizations',
    label: t.nav.organizations,
    icon: Building2,
    primary: true,
  },
  { to: '/deliveries', label: t.nav.deliveries, icon: PackageCheck },
  { to: '/activity', label: t.nav.activity, icon: History },
  { to: '/settings', label: t.nav.settings, icon: Settings },
];
