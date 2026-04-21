// lib/locations/active.ts
import { cookies } from 'next/headers'

const COOKIE_NAME = 'active_location_id'

export function getActiveLocationId(): string | undefined {
  return cookies().get(COOKIE_NAME)?.value
}
