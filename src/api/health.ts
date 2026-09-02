import axios from 'axios';

import { BFF_URL, LIVENESS_URL } from '@/api/client';
import type { HealthStatus } from '@/types/domain';

/**
 * Lightweight health checks for the Truepas dev backend.
 * Uses a bare `axios.get` (no auth header, short timeout) so it works
 * even before the user is logged in.
 */

const HEALTH_TIMEOUT = 8_000;

export async function checkBffHealth(): Promise<HealthStatus> {
  try {
    const { data } = await axios.get<{ status?: string; service?: string; version?: string }>(
      `${BFF_URL}/health`,
      { timeout: HEALTH_TIMEOUT }
    );
    return {
      healthy: data.status === 'healthy' || data.status === 'ok',
      service: data.service,
      version: data.version,
    };
  } catch {
    return { healthy: false };
  }
}

export async function checkLivenessHealth(): Promise<HealthStatus> {
  try {
    const { data } = await axios.get<{ status?: string; service?: string; version?: string }>(
      `${LIVENESS_URL}/health`,
      { timeout: HEALTH_TIMEOUT }
    );
    return {
      healthy: data.status === 'healthy' || data.status === 'ok',
      service: data.service,
      version: data.version,
    };
  } catch {
    return { healthy: false };
  }
}

/** Check both services in parallel. */
export async function checkAllHealth(): Promise<{
  bff: HealthStatus;
  liveness: HealthStatus;
}> {
  const [bff, liveness] = await Promise.all([checkBffHealth(), checkLivenessHealth()]);
  return { bff, liveness };
}
