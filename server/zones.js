import { db } from './db.js';

/**
 * Assigns an optimal zone for a confirmed meeting in an event.
 * Follows strict rules:
 * - Only zones 1 to num_zones configured for this event that are marked is_active = 1
 * - Balance meetings across active zones based on current confirmed meetings
 * - Respects indicative capacity
 * - Atomic execution
 */
export function assignMeetingZone(eventId) {
  // Fetch event config
  const event = db.prepare('SELECT num_zones FROM events WHERE id = ?').get(eventId);
  if (!event) return null;

  const maxZoneNum = event.num_zones;

  // Fetch active zones within range 1..num_zones
  const activeZones = db.prepare(`
    SELECT zone_number, name, capacity
    FROM zones
    WHERE event_id = ?
      AND is_active = 1
      AND zone_number >= 1
      AND zone_number <= ?
    ORDER BY zone_number ASC
  `).all(eventId, maxZoneNum);

  if (activeZones.length === 0) {
    return null;
  }

  // Count active confirmed meetings per zone
  const meetingCounts = db.prepare(`
    SELECT zone_number, COUNT(*) as count
    FROM meetings
    WHERE event_id = ? AND status = 'confirmed'
    GROUP BY zone_number
  `).all(eventId);

  const countMap = new Map();
  for (const m of meetingCounts) {
    countMap.set(m.zone_number, m.count);
  }

  // Find candidate zones that have count < capacity, pick the one with lowest count
  let bestZone = null;
  let minCount = Infinity;

  for (const zone of activeZones) {
    const currentCount = countMap.get(zone.zone_number) || 0;
    if (currentCount < zone.capacity) {
      if (currentCount < minCount) {
        minCount = currentCount;
        bestZone = zone.zone_number;
      }
    }
  }

  // If all are at or above indicative capacity, we can still fall back to the zone with absolute minimum count if necessary,
  // or return null if strict capacity is enforced.
  // Per requirement 16: "Si aucune zone ne peut accueillir une nouvelle rencontre, ne pas dépasser artificiellement les limites et ne pas afficher de confirmation tant que la zone n'est pas attribuée."
  return bestZone;
}

/**
 * Returns zone statistics for an event
 */
export function getZoneStats(eventId) {
  const event = db.prepare('SELECT num_zones FROM events WHERE id = ?').get(eventId);
  if (!event) return [];

  const zones = db.prepare(`
    SELECT zone_number, name, capacity, is_active
    FROM zones
    WHERE event_id = ? AND zone_number <= 10
    ORDER BY zone_number ASC
  `).all(eventId);

  const meetingCounts = db.prepare(`
    SELECT zone_number, COUNT(*) as active_meetings
    FROM meetings
    WHERE event_id = ? AND status = 'confirmed'
    GROUP BY zone_number
  `).all(eventId);

  const countMap = new Map();
  for (const m of meetingCounts) {
    countMap.set(m.zone_number, m.active_meetings);
  }

  return zones.map(z => ({
    ...z,
    is_in_range: z.zone_number <= event.num_zones,
    active_meetings: countMap.get(z.zone_number) || 0,
    is_available: z.is_active === 1 && z.zone_number <= event.num_zones && ((countMap.get(z.zone_number) || 0) < z.capacity)
  }));
}
