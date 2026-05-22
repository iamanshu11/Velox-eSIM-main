import db from '@config/database';

let cachedSupport: boolean | null = null;

export async function supportsUserCountryFields(): Promise<boolean> {
  if (cachedSupport !== null) {
    return cachedSupport;
  }

  try {
    const result = await db.$queryRawUnsafe<Array<{ exists: boolean }>>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'countryCode'
      ) AS "exists"
    `);

    cachedSupport = Boolean(result?.[0]?.exists);
    return cachedSupport;
  } catch {
    cachedSupport = false;
    return false;
  }
}
