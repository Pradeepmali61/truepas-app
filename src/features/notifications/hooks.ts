import { useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/api';
import type { Notification } from '@/types/domain';

const PAGE_SIZE = 50;

/** Notifications inbox — GET /cb/notifications with limit/offset pagination.
 *  Push delivery isn't implemented; this is an inbox read only. */
export function useNotifications(unreadOnly = false) {
  return useInfiniteQuery<Notification[]>({
    queryKey: ['notifications', { unreadOnly }],
    queryFn: ({ pageParam }) =>
      api.getNotifications({ limit: PAGE_SIZE, offset: pageParam as number, unreadOnly }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
  });
}
