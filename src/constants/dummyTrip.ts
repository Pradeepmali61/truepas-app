import type { Booking } from '@/types/domain';

/** Always-present sample trip — shows in the Upcoming sections (home +
 *  history) even when the user has no real upcoming bookings, and is
 *  appended to the real ones. Not pressable (no detail page). */
export const DUMMY_TRIP: Booking = {
  id: 'dummy-trip',
  venue: 'Hayat Hotel',
  location: 'Goa, India',
  type: 'Hotel',
  image: 'hayat hotel',
  checkIn: 'Jul 21',
  checkOut: 'Jul 24',
  status: 'upcoming',
  guests: 2,
  amount: 14200,
  checkedInMembers: [],
};

/** Always-present sample past trip — shows in Recent Trips (home) and the
 *  Past tab (history) even when the user has no real completed bookings.
 *  Not pressable (no detail page). */
export const DUMMY_PAST_TRIP: Booking = {
  id: 'dummy-past-trip',
  venue: 'Disney Cruise',
  location: 'Miami, USA',
  type: 'Cruise',
  image: 'disney cruise',
  checkIn: 'Jun 10',
  checkOut: 'Jun 14',
  status: 'completed',
  guests: 4,
  amount: 86000,
  checkedInMembers: [],
};
