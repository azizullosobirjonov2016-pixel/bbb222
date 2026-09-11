/**
 * Environment variable validation
 * Ensures all required environment variables are set before app starts
 */

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

/**
 * Validate that all required environment variables are set
 * @throws Error if any required variable is missing or invalid
 */
export function validateEnv(): void {
  const missing: string[] = [];
  const invalid: string[] = [];

  // Check required variables
  for (const key of REQUIRED_ENV_VARS) {
    const value = import.meta.env[key];

    if (!value || value.length === 0) {
      missing.push(key);
    } else if (key === 'VITE_SUPABASE_URL') {
      // Faqat https URL ekanini tekshiramiz — self-hosted yoki custom
      // domenli Supabase o'rnatmalari "supabase.co" bo'lmasligi mumkin.
      let validUrl = false;
      try {
        validUrl = new URL(value).protocol === 'https:';
      } catch {
        validUrl = false;
      }
      if (!validUrl) {
        invalid.push(`${key} (noto'g'ri format)`);
      }
    } else if (key === 'VITE_SUPABASE_ANON_KEY') {
      // Anon key should be reasonably long
      if (value.length < 20) {
        invalid.push(`${key} (juda qisqa)`);
      }
    }
  }

  // Combine errors
  const errors = [...missing, ...invalid];

  if (errors.length > 0) {
    const message = `Environment o'zgaruvchilari xatosida:\n${errors.map((e) => `  - ${e}`).join('\n')}\n\n.env faylini tekshiring yoki .env.example'ni ko'ring.`;
    console.error(message);
    throw new Error(message);
  }

  // Optional: Log environment info
  if (import.meta.env.DEV) {
    console.debug('✅ Environment variables validated successfully');
  }
}

/**
 * Get optional environment variable with default value
 */
export function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return import.meta.env[key] ?? defaultValue;
}
