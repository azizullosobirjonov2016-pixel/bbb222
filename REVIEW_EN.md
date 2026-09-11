# 📋 Birja Project - Code Review & Recommendations (English)

## 🎯 Overall Assessment
**Status:** Well-structured, professional project. React + TypeScript + Supabase stack is appropriate.

✅ **Strengths:**
- Strong type safety (TypeScript, strict mode enabled)
- Security with Supabase RLS
- Efficient caching with React Query
- Full Uzbek language support
- PWA + Dark/Light mode
- Comprehensive audit logging

⚠️ **Areas for Improvement:**

---

## 1. 🔴 CRITICAL - Error Handling & User Feedback

### Issue 1.1: Inconsistent Error Handling Pattern
**Files:** `src/api/finance.ts`, `src/pages/ContractForm.tsx`

**Problem:**
- Some API calls use `unwrap()`, others don't properly validate errors
- User gets no feedback if an operation fails silently
- Inconsistent error messaging approach

**Recommendation:**
```tsx
// Good example (ContractForm.tsx shows this correctly)
onError: (e) => toast(e.message, 'error'),

// BUT: Not all mutations have onError handlers
// ❌ Bad
const mutation = useSomeAction();
mutation.mutate(data); // No error handler!

// ✅ Good
mutation.mutate(data, {
  onError: (error) => toast(error.message, 'error'),
});
```

**Action Items:**
- [ ] Add `onError` handler to ALL mutations
- [ ] Create error utility in `@/lib/errors.ts`:

```tsx
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return 'An unknown error occurred';
}
```

### Issue 1.2: Missing Error UI States
**Files:** `src/pages/Dashboard.tsx`, `src/pages/Contracts.tsx`

**Problem:**
```tsx
// Only checks isLoading, ignores isError
const { data, isLoading, isError } = useContracts();

if (isLoading) return <Skeleton />;
// ❌ If isError is true, renders nothing!
return <YourContent />;
```

**Recommendation:**
```tsx
// ✅ Proper error boundary
if (isError) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Error Loading Data"
      description="Failed to load. Try refreshing the page."
      action={<Button onClick={() => queryClient.refetchQueries()}>Retry</Button>}
    />
  );
}

if (isLoading) return <Skeleton />;
return <YourContent />;
```

---

## 2. ⚡ Performance Optimizations

### Recommendation 2.1: React Query Configuration
**Files:** All API hooks in `src/api/`

**Current Issue:** No `staleTime` or `gcTime` configured - queries re-fetch too frequently.

**Implementation:**
```tsx
export function useContracts() {
  return useQuery({
    queryKey: qk.contracts,
    queryFn: async (): Promise<ContractRow[]> => {
      return unwrap(
        await supabase
          .from('contracts')
          .select(SELECT)
          .order('signed_date', { ascending: false, nullsFirst: false })
      ) as ContractRow[];
    },
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes (was: cacheTime)
  });
}
```

### Recommendation 2.2: Memoization Strategy
**Current:** Good use of `useMemo` in Dashboard

**Extend to:**
```tsx
const handleStatusChange = useCallback((newStatus: ContractStatus) => {
  setStatus(newStatus);
  // Avoid recreating filter function on every render
}, []);

const contractOptions = useMemo(
  () => (companies ?? []).map(c => ({ value: c.id, label: c.name })),
  [companies]
);
```

### Recommendation 2.3: Lazy Loading Routes
```tsx
// src/App.tsx - use React.lazy for route components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Contracts = lazy(() => import('@/pages/Contracts'));

// Wrap in Suspense
<Suspense fallback={<Loader />}>
  <Route path="/" element={<Dashboard />} />
</Suspense>
```

---

## 3. 📝 Code Organization

### Recommendation 3.1: Consolidate Validation Schemas
**Problem:** Each form has its own Zod schema duplicating logic.

**Solution:** Create `src/lib/schemas.ts`:
```tsx
export const contractSchema = z.object({
  number: z.string().min(1, 'Contract number required'),
  amount: z.coerce.number().positive(),
  currency: z.enum(['UZS', 'USD']),
  status: z.enum(['draft', 'active', 'fulfilled', 'cancelled']),
  // ...
});

export type ContractFormData = z.infer<typeof contractSchema>;
```

### Recommendation 3.2: Extract Common Patterns
**Opportunity:** API response unwrapping is repetitive

```tsx
// src/lib/supabase-helpers.ts
export async function fetchWithAuth<T>(
  query: () => Promise<{ data: T | null; error: unknown }>
): Promise<T> {
  try {
    const res = await query();
    if (res.error) {
      throw new AppError('SUPABASE_ERROR', getErrorMessage(res.error), res.error);
    }
    return res.data as T;
  } catch (error) {
    throw error instanceof AppError ? error : new AppError('UNKNOWN', 'Unknown error');
  }
}

// Usage:
const contract = await fetchWithAuth(() =>
  supabase.from('contracts').select('*').eq('id', id).single()
);
```

---

## 4. 🔐 Type Safety & Security

### Issue 4.1: Type Casting Anti-Pattern
**Current:**
```tsx
// ❌ Dangerous type gymnastics
const msg = (res.error as { message?: string }).message ?? 'Unknown error';
```

**Better:**
```tsx
// ✅ Type-safe guard
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

const msg = isErrorWithMessage(res.error)
  ? res.error.message
  : 'Unknown error';
```

### Issue 4.2: Environment Variable Validation
**Current:** `.env.example` is missing

**Add:**
```env
# .env.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_UZEX_FETCH_URL=https://api.example.com

# Optional
VITE_SENTRY_DSN=
VITE_API_TIMEOUT_MS=30000
```

**Validate at startup:**
```tsx
// src/lib/env.ts
function validateEnv() {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}

validateEnv();
```

### Issue 4.3: Session Handling
**Good:** `useAuth()` properly initializes auth state

**Enhance:**
```tsx
// Detect session refresh failures
useEffect(() => {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session && user) {
      // Session was revoked - redirect to login
      navigate('/login');
      toast('Session expired. Please log in again.', 'error');
    }
    setSession(session);
  });
  return () => sub.subscription.unsubscribe();
}, [user, navigate, toast]);
```

---

## 5. ♿ Accessibility (A11y)

### Recommendation 5.1: Form Accessibility
**Current - Good:**
```tsx
<Field label={t.contract.number} htmlFor="contract_number">
  <Input id="contract_number" {...register('number')} />
</Field>
```

**Enhance:**
```tsx
// Add ARIA labels for better screen reader support
<Input
  id="contract_number"
  aria-required="true"
  aria-describedby="contract_number_error"
  aria-invalid={!!errors.number}
  {...register('number')}
/>
{errors.number && (
  <span id="contract_number_error" className="text-red-600">
    {errors.number.message}
  </span>
)}
```

### Recommendation 5.2: Dialog Accessibility
- [ ] Trap focus inside modal (only Tab within modal)
- [ ] Close on Escape key
- [ ] Return focus to trigger button when closed

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

### Recommendation 5.3: Color Contrast
- [ ] Verify status badges meet WCAG AA (4.5:1 for text)
- [ ] Test with: https://webaim.org/resources/contrastchecker/

---

## 6. 📊 UI/UX Improvements

### Recommendation 6.1: Enhanced Empty States
**Current - Good, but:**
```tsx
{filtered.length === 0 && <EmptyState ... />}
```

**Enhance:**
```tsx
// Distinguish between:
if (data?.length === 0 && !q) {
  return <EmptyState title="No contracts yet" action={<CreateButton />} />;
}

if (filtered.length === 0 && q) {
  return <EmptyState title="No results for your search" hint={q} />;
}
```

### Recommendation 6.2: Optimistic Updates
**Problem:** User waits for server response before seeing change

**Implementation:**
```tsx
useMutation({
  mutationFn: updateContract,
  onMutate: async (newData) => {
    // Cancel ongoing queries
    await qc.cancelQueries({ queryKey: qk.contract(id) });
    
    // Snapshot old data
    const prevData = qc.getQueryData(qk.contract(id));
    
    // Optimistically update
    qc.setQueryData(qk.contract(id), (old) => ({
      ...old,
      ...newData,
    }));
    
    return { prevData };
  },
  onError: (error, vars, context) => {
    // Revert on error
    if (context?.prevData) {
      qc.setQueryData(qk.contract(id), context.prevData);
    }
    toast(error.message, 'error');
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: qk.contract(id) });
  },
});
```

### Recommendation 6.3: Confirmation Dialogs
**Good - you have ConfirmDialog component**

Ensure ALL destructive actions use it:
- [ ] Delete contract → Confirmation
- [ ] Cancel deliveries → Confirmation
- [ ] Export data → Optional (less critical)

---

## 7. 🧪 Testing Strategy

**Current Status:** No tests ❌

**Setup:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/user-event
```

**Example Test Structure:**
```tsx
// src/api/__tests__/contracts.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContracts } from '../contracts';

describe('useContracts', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it('should fetch and return contracts', async () => {
    const { result } = renderHook(() => useContracts(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('should handle fetch errors', async () => {
    // Mock Supabase to return error
    vi.mock('@/lib/supabase', () => ({
      supabase: {
        from: () => ({
          select: () => ({
            order: () => Promise.resolve({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      },
    }));

    const { result } = renderHook(() => useContracts(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

**Test Coverage Goals:**
- [ ] API hooks (contracts, companies, finance)
- [ ] Form validation schemas
- [ ] Utility functions (format.ts, export.ts)
- [ ] Critical user flows

---

## 8. 📚 Documentation & Code Quality

### Recommendation 8.1: JSDoc Comments
**Add to functions:**
```tsx
/**
 * Fetches all contracts for the current user.
 * 
 * @returns Promise resolving to array of contracts with related data
 * @throws Error if user is not authenticated
 * 
 * @example
 * const { data, isLoading } = useContracts();
 */
export function useContracts() {
  // ...
}
```

### Recommendation 8.2: Add Logging
```tsx
// src/lib/logger.ts
export const logger = {
  debug: (msg: string, data?: any) => {
    if (import.meta.env.DEV) console.debug(`[DEBUG] ${msg}`, data);
  },
  info: (msg: string) => console.info(`[INFO] ${msg}`),
  error: (msg: string, error?: unknown) => {
    console.error(`[ERROR] ${msg}`, error);
    // Could also send to Sentry
  },
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
};

// Usage:
import { logger } from '@/lib/logger';
logger.error('Failed to save contract', error);
```

### Recommendation 8.3: Add TypeScript Strict Checks
**Current tsconfig.json - Already Good!** ✅

But add:
```json
{
  "compilerOptions": {
    "forceConsistentCasingInFileNames": true,
    "noImplicitThis": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## 9. 🚀 Deployment & Monitoring

### Recommendation 9.1: Performance Monitoring
```bash
npm install web-vitals
```

```tsx
// src/main.tsx
import { getCLS, getFID, getLCP, getFCP } from 'web-vitals';

const vitals = [
  { name: 'CLS', fn: getCLS },
  { name: 'FID', fn: getFID },
  { name: 'LCP', fn: getLCP },
  { name: 'FCP', fn: getFCP },
];

vitals.forEach(({ name, fn }) => {
  fn((metric) => {
    console.log(`${name}:`, metric.value);
    // Send to analytics service
  });
});
```

### Recommendation 9.2: Error Tracking (Optional - Sentry)
```bash
npm install @sentry/react
```

```tsx
// src/main.tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}
```

---

## 10. 🔄 Feature Recommendations

### 10.1: Bulk Operations
```tsx
// Multi-select + bulk actions
- [ ] Select multiple contracts
- [ ] Bulk status change
- [ ] Bulk delete (with confirmation)
```

### 10.2: Advanced Filtering
```tsx
// Add filters for:
- [ ] Date range (from-to)
- [ ] Amount range (min-max)
- [ ] Multiple status selection
- [ ] Save filter presets
```

### 10.3: Export Enhancements
- [ ] Excel export (`.xlsx`) with @excelize/xlsx
- [ ] PDF reports with charts (use `html2pdf` or `pdfkit`)
- [ ] Email export (via edge function)
- [ ] Scheduled exports

### 10.4: Real-time Updates
```tsx
// Subscribe to contract changes
useEffect(() => {
  const subscription = supabase
    .from('contracts')
    .on('*', (payload) => {
      qc.invalidateQueries({ queryKey: qk.contracts });
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
}, [qc]);
```

---

## 11. 🛠️ Development Tools

### Recommendation 11.1: ESLint Configuration
**Enhance .eslintrc:**
```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "react-hooks/exhaustive-deps": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error"],
    "react/no-unescaped-entities": "warn"
  }
}
```

### Recommendation 11.2: Pre-commit Hooks (Husky)
```bash
npm install --save-dev husky lint-staged

npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run typecheck"
```

**package.json:**
```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### Recommendation 11.3: CI/CD Pipeline
Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
```

---

## 📋 Implementation Roadmap

| Priority | Task | Effort | Impact | Timeline |
|----------|------|--------|--------|----------|
| 🔴 1 | Consistent error handling | 3h | High | Week 1 |
| 🔴 2 | Error state UI | 2h | High | Week 1 |
| 🔴 3 | Environment validation | 1h | High | Week 1 |
| 🟠 4 | React Query optimization | 2h | Medium | Week 2 |
| 🟠 5 | Type safety improvements | 3h | Medium | Week 2 |
| 🟡 6 | Testing setup + core tests | 5h | Medium | Week 3 |
| 🟡 7 | Accessibility audit | 3h | Medium | Week 3 |
| 🟢 8 | Documentation | 2h | Low | Week 4 |
| 🟢 9 | Performance monitoring | 2h | Low | Week 4 |

---

## ✅ Conclusion

**Verdict:** This is a well-built application with solid fundamentals.

**Quick Wins (Do First):**
1. Add error handlers to all mutations
2. Add error state UI to pages
3. Validate environment variables
4. Extend ESLint rules

**For Production:**
1. Set up monitoring (error tracking + performance)
2. Add tests for critical paths
3. Document deployment process
4. Set up CI/CD pipeline

**Contact for Implementation Help:** Happy to assist with any of these recommendations! 🚀
