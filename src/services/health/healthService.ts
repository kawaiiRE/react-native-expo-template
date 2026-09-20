import {
  HEALTH_PATH,
  healthViewModelSchema,
  type HealthViewModel,
} from '@/contracts/health';
import { request, type ApiResult } from '@/services/api/apiClient';

export function readHealth(): Promise<ApiResult<HealthViewModel>> {
  return request(HEALTH_PATH, (value) => healthViewModelSchema.parse(value));
}
