import { z } from 'zod';

export const API_VERSION = 1 as const;
export const HEALTH_PATH = '/api/health';

export const healthViewModelSchema = z.object({
  available: z.boolean(),
  apiVersion: z.literal(API_VERSION),
  service: z.string().min(1),
  checkedAt: z.string().min(1),
});

export type HealthViewModel = z.infer<typeof healthViewModelSchema>;
