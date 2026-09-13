import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * `useState`ga o'xshaydi, lekin qiymatni URL query-parametrida saqlaydi —
 * sahifa yangilansa yoki havola ulashilsa, filtr holati saqlanib qoladi.
 */
export function useQueryParamState(
  key: string,
  defaultValue = '',
): [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (v: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (v) next.set(key, v);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [key, setSearchParams],
  );

  return [value, setValue];
}
