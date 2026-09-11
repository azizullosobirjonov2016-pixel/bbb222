import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { validateEnv } from '@/lib/env';
import { logError } from '@/lib/errors';
import { initPerformanceTracking } from '@/lib/performance';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/toast';
import App from './App';
import './index.css';

function bootstrap() {
  const rootEl = document.getElementById('root')!;
  const root = ReactDOM.createRoot(rootEl);

  // Missing/invalid env vars are already handled gracefully by App's
  // isSupabaseConfigured check (renders SetupScreen) — just log here so
  // the reason is visible in the console instead of silently failing.
  try {
    validateEnv();
  } catch (err) {
    logError('validateEnv', err);
  }

  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );

  initPerformanceTracking();
}

bootstrap();
