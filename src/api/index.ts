import { IS_MOCK } from '../config/env';
import type { TrendPreneurService } from './service';
import { MockTrendPreneurService } from './mockService';
import { HttpTrendPreneurService } from './httpService';

let _service: TrendPreneurService | null = null;

export function getService(): TrendPreneurService {
  if (!_service) {
    _service = IS_MOCK ? new MockTrendPreneurService() : new HttpTrendPreneurService();
  }
  return _service;
}

export { IS_MOCK } from '../config/env';
export type { TrendPreneurService } from './service';
export * from './types';
export { ApiError } from './errors';
export { ERROR_CODES } from './errors';
export type { ErrorCode } from './errors';
