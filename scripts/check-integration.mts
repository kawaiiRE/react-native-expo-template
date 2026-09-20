import { z } from 'zod';

const HEALTH_PATH = '/api/health';
const healthViewModelSchema = z.object({
  available: z.boolean(),
  apiVersion: z.literal(1),
  service: z.string().min(1),
  checkedAt: z.string().min(1),
});

const gatewayOrigin = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

if (!gatewayOrigin) {
  throw new Error(
    'Set EXPO_PUBLIC_API_BASE_URL to the running Next.js application origin.',
  );
}

const healthUrl = new URL(HEALTH_PATH, `${gatewayOrigin.replace(/\/+$/, '')}/`);
const response = await fetch(healthUrl, {
  headers: { Accept: 'application/json' },
  signal: AbortSignal.timeout(10_000),
});

if (!response.ok) {
  throw new Error(`Next.js returned HTTP ${response.status}.`);
}

const health = healthViewModelSchema.parse(await response.json());

if (!health.available) {
  throw new Error('Next.js reported that PocketBase is unavailable.');
}

console.log(
  `Integration healthy: mobile -> Next.js -> ${health.service} API v${health.apiVersion}.`,
);
