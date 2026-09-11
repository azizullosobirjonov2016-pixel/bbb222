import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { validateEnv } from '@/lib/env';
import { getErrorMessage } from '@/lib/errors';
import { initPerformanceTracking } from '@/lib/performance';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/toast';
import App from './App';
import './index.css';

function bootstrap() {
  const rootEl = document.getElementById('root')!;
  const root = ReactDOM.createRoot(rootEl);

  // Validate environment variables before app starts. If this fails, show a
  // readable message instead of throwing to a blank white screen.
  try {
    validateEnv();
  } catch (err) {
    root.render(
      <div
        style={{
          padding: '2rem',
          fontFamily: 'sans-serif',
          whiteSpace: 'pre-wrap',
        }}
      >
        <h1>Ilova ishga tushmadi</h1>
        <p>{getErrorMessage(err)}</p>
      </div>,
    );
    return;
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
