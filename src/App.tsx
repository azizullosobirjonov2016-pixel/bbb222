import { Navigate, Route, Routes } from 'react-router-dom';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { SetupScreen } from '@/pages/SetupScreen';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Organizations } from '@/pages/Organizations';
import { Contracts } from '@/pages/Contracts';
import { ContractDetail } from '@/pages/ContractDetail';
import { ContractForm } from '@/pages/ContractForm';
import { Deliveries } from '@/pages/Deliveries';
import { Finance } from '@/pages/Finance';
import { Activity } from '@/pages/Activity';
import { Settings } from '@/pages/Settings';
import { NotFound } from '@/pages/NotFound';
import { Loader2 } from 'lucide-react';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuth();

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (loading) return <FullScreenLoader />;
  if (!session) return <Login />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/contracts/new" element={<ContractForm />} />
        <Route path="/contracts/:id" element={<ContractDetail />} />
        <Route path="/contracts/:id/edit" element={<ContractForm />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
