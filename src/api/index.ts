import { mockApi } from '@/api/mock';
import { realApi } from '@/api/endpoints';

/**
 * Single source of truth used by every hook/screen in the app.
 *
 * - While the backend is not ready, `mockApi` serves data from JSON
 *   fixtures in `src/api/data/`.
 * - Once the backend team exposes real endpoints, set
 *   `EXPO_PUBLIC_USE_MOCK_API=false` in `.env` (and `EXPO_PUBLIC_API_URL`
 *   to the real base URL) — no other code needs to change.
 */
const useMockApi = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';

export const api = useMockApi ? mockApi : realApi;
