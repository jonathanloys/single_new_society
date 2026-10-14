import { db } from './db.js';

/**
 * Checks bidirectional compatibility of target preferences
 */
export function arePreferencesCompatible(p1Gender, p1TargetPref, p2Gender, p2TargetPref) {
  // P1 accepts P2?
  let p1AcceptsP2 = false;
  if (p1TargetPref === 'deux') p1AcceptsP2 = true;
  else if (p1TargetPref === 'femmes' && p2Gender === 'femme') p1AcceptsP2 = true;
  else if (p1TargetPref === 'hommes' && p2Gender === 'homme') p1AcceptsP2 = true;

  // P2 accepts P1?
  let p2AcceptsP1 = false;
  if (p2TargetPref === 'deux') p2AcceptsP1 = true;
  else if (p2TargetPref === 'femmes' && p1Gender === 'femme') p2AcceptsP1 = true;
  else if (p2TargetPref === 'hommes' && p1Gender === 'homme') p2AcceptsP1 = true;

  return p1AcceptsP2 && p2AcceptsP1;
}

/**
 * Generates an elegant, natural French icebreaker based on overlapping categories
 */
export function generateIcebreaker(q1, q2) {
  let interests1 = [];
  let interests2 = [];
  let values1 = [];
  let values2 = [];

  try { interests1 = JSON.parse(q1.interests || '[]'); } catch (e) {}
  try { interests2 = JSON.parse(q2.interests || '[]'); } catch (e) {}
  try { values1 = JSON.parse(q1.core_values || '[]'); } catch (e) {}
  try { values2 = JSON.parse(q2.core_values || '[]'); } catch (e) {}

  const commonInterests = interests1.filter(i => interests2.includes(i));
  const commonValues = values1.filter(v => values2.includes(v));

  if (commonInterests.length >= 2) {
    const list = commonInterests.slice(0, 2).map(i => i.toLowerCase()).join(' et ');
    return `Vous partagez tous les deux une curiosité commune pour ${list}. Une belle occasion d'échanger vos impressions et anecdotes !`;
  } else if (commonInterests.length === 1) {
    return `Vous pourriez avoir des choses très intéressantes à partager autour de ${commonInterests[0].toLowerCase()} et de votre manière de voir les choses.`;
  } else if (commonValues.length > 0) {
    return `Vos sensibilités semblent se rejoindre autour de valeurs comme l'écoute et la convivialité. Une rencontre propice à un échange authentique.`;
  }

  // Graceful conversational fallback
  return `Vos manières d'aborder les rencontres et la discussion se complètent harmonieusement. Prenez quelques instants pour faire connaissance !`;
}

/**
 * Clean up expired invitations to release capacity
 */
export function expireStaleInvitations(eventId) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE invitations
    SET status = 'expired'
    WHERE event_id = ? AND status = 'pending' AND expires_at < ?
  `).run(eventId, now);
}

/**
 * Finds next candidate suggestion for a participant
 */
export function findSuggestionForParticipant(eventId, participantId) {
  // First expire stale invitations
  expireStaleInvitations(eventId);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event || event.suggestions_active !== 1) return null;

  // Check if participant already has an active pending suggestion
  const existingActive = db.prepare(`
    SELECT s.*, p.first_name as target_first_name
    FROM suggestions s
    JOIN participants p ON s.target_participant_id = p.id
    WHERE s.event_id = ? AND s.source_participant_id = ? AND s.status = 'presented'
  `).get(eventId, participantId);

  if (existingActive) {
    return existingActive;
  }

  // Fetch participant info and questionnaire
  const currentP = db.prepare('SELECT * FROM participants WHERE id = ? AND event_id = ?').get(participantId, eventId);
  const currentQ = db.prepare('SELECT * FROM questionnaires WHERE participant_id = ?').get(participantId);

  if (!currentP || !currentQ) return null;

  // Fetch blocked / reported users
  const blocks = db.prepare(`
    SELECT target_id FROM blocks_reports WHERE author_id = ?
    UNION
    SELECT author_id as target_id FROM blocks_reports WHERE target_id = ?
  `).all(participantId, participantId).map(b => b.target_id);

  // Fetch all other participants with completed questionnaires in the event
  const candidates = db.prepare(`
    SELECT p.id, p.first_name, p.gender, q.target_preference, q.interests, q.core_values, q.conversation_style
    FROM participants p
    JOIN questionnaires q ON p.id = q.participant_id
    WHERE p.event_id = ? AND p.id != ? AND p.status = 'active'
  `).all(eventId, participantId);

  for (const candidate of candidates) {
    // 1. Check blocks
    if (blocks.includes(candidate.id)) continue;

    // 2. Check bidirectional preferences
    if (!arePreferencesCompatible(currentP.gender, currentQ.target_preference, candidate.gender, candidate.target_preference)) {
      continue;
    }

    // 3. Check if already had a meeting (confirmed, completed)
    const existingMeeting = db.prepare(`
      SELECT id FROM meetings
      WHERE event_id = ?
        AND ((participant1_id = ? AND participant2_id = ?) OR (participant1_id = ? AND participant2_id = ?))
        AND status IN ('confirmed', 'completed')
    `).get(eventId, participantId, candidate.id, candidate.id, participantId);
    if (existingMeeting) continue;

    // 4. Check if active invitation in either direction exists
    const existingInv = db.prepare(`
      SELECT id FROM invitations
      WHERE event_id = ?
        AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
        AND status = 'pending'
    `).get(eventId, participantId, candidate.id, candidate.id, participantId);
    if (existingInv) continue;

    // 5. Check anti-saturation for candidate: how many pending received invitations?
    const candidatePendingReceived = db.prepare(`
      SELECT COUNT(*) as count FROM invitations
      WHERE event_id = ? AND receiver_id = ? AND status = 'pending'
    `).get(eventId, candidate.id).count;

    if (candidatePendingReceived >= event.max_pending_received_invitations) {
      continue; // Candidate is currently saturated with pending invites
    }

    // 6. Check if suggestion already dismissed or presented in the past
    const prevSuggestion = db.prepare(`
      SELECT id, status FROM suggestions
      WHERE event_id = ? AND source_participant_id = ? AND target_participant_id = ?
    `).get(eventId, participantId, candidate.id);

    if (prevSuggestion && (prevSuggestion.status === 'dismissed' || prevSuggestion.status === 'presented')) {
      continue;
    }

    // Candidate is valid! Generate icebreaker and store suggestion
    const icebreaker = generateIcebreaker(currentQ, candidate);
    const suggestionId = `sug-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO suggestions (id, event_id, source_participant_id, target_participant_id, icebreaker, status, presented_at)
      VALUES (?, ?, ?, ?, ?, 'presented', ?)
      ON CONFLICT(event_id, source_participant_id, target_participant_id)
      DO UPDATE SET icebreaker = excluded.icebreaker, status = 'presented', presented_at = excluded.presented_at
    `).run(suggestionId, eventId, participantId, candidate.id, icebreaker, now);

    return {
      id: suggestionId,
      source_participant_id: participantId,
      target_participant_id: candidate.id,
      target_first_name: candidate.first_name,
      icebreaker,
      status: 'presented'
    };
  }

  return null;
}
