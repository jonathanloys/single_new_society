import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { db, initDatabase, seedDemoEvent } from './db.js';
import { assignMeetingZone, getZoneStats } from './zones.js';
import { findSuggestionForParticipant, expireStaleInvitations } from './matcher.js';

// Initialize SQLite schema
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper auth middleware
function authenticateParticipant(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de session manquant ou invalide.' });
  }

  const token = authHeader.substring(7);
  const participant = db.prepare('SELECT * FROM participants WHERE session_token = ?').get(token);

  if (!participant) {
    return res.status(401).json({ error: 'Session inconnue ou expirée.' });
  }

  req.participant = participant;
  next();
}

/* ============================================================
   1. SYSTEM & DEMO SWITCHER
   ============================================================ */

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Demo participants switcher list (for testing ease)
app.get('/api/demo/participants', (req, res) => {
  const participants = db.prepare(`
    SELECT p.id, p.first_name, p.session_token, p.access_code, p.gender,
           q.target_preference, q.distinctive_outfit,
           (SELECT COUNT(*) FROM meetings WHERE (participant1_id = p.id OR participant2_id = p.id) AND status = 'confirmed') as active_meetings_count,
           (SELECT COUNT(*) FROM invitations WHERE receiver_id = p.id AND status = 'pending') as pending_invitations_count
    FROM participants p
    LEFT JOIN questionnaires q ON p.id = q.participant_id
    WHERE p.event_id = 'demo-soiree-paris'
    ORDER BY p.first_name ASC
  `).all();

  res.json(participants);
});

// Reset demo data
app.post('/api/events/:id/reset-demo', (req, res) => {
  seedDemoEvent();
  res.json({ success: true, message: 'Données de démonstration réinitialisées avec succès.' });
});

/* ============================================================
   2. EVENTS (ADMIN & PUBLIC)
   ============================================================ */

// List all events
app.get('/api/events', (req, res) => {
  const events = db.prepare('SELECT * FROM events ORDER BY created_at DESC').all();
  res.json(events);
});

// Get event by public code
app.get('/api/events/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const event = db.prepare('SELECT * FROM events WHERE code = ? OR id = ?').get(code, req.params.code);
  if (!event) {
    return res.status(404).json({ error: 'Événement introuvable avec ce code.' });
  }
  res.json(event);
});

// Create event
app.post('/api/events', (req, res) => {
  const { name, date, description, num_zones = 4, code } = req.body;
  if (!name || !date) {
    return res.status(400).json({ error: 'Nom et date obligatoires.' });
  }

  const eventId = `evt-${Date.now()}`;
  const eventCode = (code || `EVT${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
  const zonesCount = Math.max(1, Math.min(10, parseInt(num_zones, 10) || 4));
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO events (id, code, name, date, description, status, num_zones, suggestions_active, created_at)
    VALUES (?, ?, ?, ?, ?, 'open_registration', ?, 1, ?)
  `).run(eventId, eventCode, name, date, description || '', zonesCount, now);

  // Initialize 10 standard zones
  for (let i = 1; i <= 10; i++) {
    db.prepare(`
      INSERT INTO zones (id, event_id, zone_number, name, capacity, is_active)
      VALUES (?, ?, ?, ?, 2, ?)
    `).run(`zone-${eventId}-${i}`, eventId, i, `Zone ${i}`, i <= zonesCount ? 1 : 0);
  }

  const created = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  res.status(201).json(created);
});

// Update event settings
app.patch('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) return res.status(404).json({ error: 'Événement non trouvé.' });

  const {
    name,
    date,
    description,
    status,
    num_zones,
    suggestions_active,
    max_active_suggestions,
    max_pending_received_invitations,
    invitation_expiry_minutes
  } = req.body;

  let newNumZones = event.num_zones;
  if (num_zones !== undefined) {
    newNumZones = Math.max(1, Math.min(10, parseInt(num_zones, 10)));
    // Synchronize is_active on zones table
    for (let i = 1; i <= 10; i++) {
      db.prepare(`
        UPDATE zones
        SET is_active = ?
        WHERE event_id = ? AND zone_number = ?
      `).run(i <= newNumZones ? 1 : 0, eventId, i);
    }
  }

  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (date !== undefined) { updates.push('date = ?'); params.push(date); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (num_zones !== undefined) { updates.push('num_zones = ?'); params.push(newNumZones); }
  if (suggestions_active !== undefined) { updates.push('suggestions_active = ?'); params.push(suggestions_active); }
  if (max_active_suggestions !== undefined) { updates.push('max_active_suggestions = ?'); params.push(max_active_suggestions); }
  if (max_pending_received_invitations !== undefined) { updates.push('max_pending_received_invitations = ?'); params.push(max_pending_received_invitations); }
  if (invitation_expiry_minutes !== undefined) { updates.push('invitation_expiry_minutes = ?'); params.push(invitation_expiry_minutes); }

  if (updates.length > 0) {
    params.push(eventId);
    db.prepare(`
      UPDATE events
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);
  }

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  res.json(updated);
});

/* ============================================================
   3. ZONES MANAGEMENT
   ============================================================ */

app.get('/api/events/:id/zones', (req, res) => {
  const stats = getZoneStats(req.params.id);
  res.json(stats);
});

app.patch('/api/events/:id/zones/:zoneNumber', (req, res) => {
  const { id: eventId, zoneNumber } = req.params;
  const { name, capacity, is_active } = req.body;

  const event = db.prepare('SELECT num_zones FROM events WHERE id = ?').get(eventId);
  if (!event) return res.status(404).json({ error: 'Événement non trouvé.' });

  const num = parseInt(zoneNumber, 10);
  if (num < 1 || num > 10) return res.status(400).json({ error: 'Zone invalide (1-10).' });

  // Disallow activating zones beyond event.num_zones
  let activeVal = is_active;
  if (num > event.num_zones && activeVal === 1) {
    return res.status(400).json({
      error: `La zone ${num} ne peut pas être activée car cet événement est configuré avec ${event.num_zones} zones.`
    });
  }

  db.prepare(`
    UPDATE zones
    SET name = COALESCE(?, name),
        capacity = COALESCE(?, capacity),
        is_active = COALESCE(?, is_active)
    WHERE event_id = ? AND zone_number = ?
  `).run(name ?? null, capacity ?? null, activeVal ?? null, eventId, num);

  const stats = getZoneStats(eventId);
  res.json(stats);
});

/* ============================================================
   4. PARTICIPANT AUTH & ONBOARDING
   ============================================================ */

// Register participant into event
app.post('/api/events/:code/register', (req, res) => {
  const code = req.params.code.toUpperCase();
  const event = db.prepare('SELECT * FROM events WHERE code = ? OR id = ?').get(code, req.params.code);

  if (!event) {
    return res.status(404).json({ error: 'Événement introuvable.' });
  }

  if (event.status === 'archived') {
    return res.status(403).json({ error: 'Les inscriptions à cet événement sont closes.' });
  }

  const { first_name, gender } = req.body;
  if (!first_name || !first_name.trim()) {
    return res.status(400).json({ error: 'Le prénom est obligatoire.' });
  }

  if (!['femme', 'homme', 'autre'].includes(gender)) {
    return res.status(400).json({ error: 'Le genre est obligatoire pour garantir le respect strict des préférences de rencontre.' });
  }

  const participantId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const accessCode = `${first_name.trim().substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO participants (id, event_id, first_name, session_token, access_code, gender, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
  `).run(participantId, event.id, first_name.trim(), sessionToken, accessCode, gender, now);

  res.status(201).json({
    token: sessionToken,
    access_code: accessCode,
    participant: {
      id: participantId,
      first_name: first_name.trim(),
      event_id: event.id
    }
  });
});

// Login using personal recovery code
app.post('/api/events/:code/login', (req, res) => {
  const code = req.params.code.toUpperCase();
  const { access_code } = req.body;

  if (!access_code) {
    return res.status(400).json({ error: 'Code d’accès requis.' });
  }

  const event = db.prepare('SELECT id FROM events WHERE code = ? OR id = ?').get(code, req.params.code);
  if (!event) return res.status(404).json({ error: 'Événement introuvable.' });

  const participant = db.prepare(`
    SELECT * FROM participants
    WHERE event_id = ? AND UPPER(access_code) = ?
  `).get(event.id, access_code.trim().toUpperCase());

  if (!participant) {
    return res.status(404).json({ error: 'Code d’accès introuvable pour cette soirée.' });
  }

  res.json({
    token: participant.session_token,
    participant: {
      id: participant.id,
      first_name: participant.first_name,
      event_id: participant.event_id
    }
  });
});

// Get current participant info & questionnaire
app.get('/api/participant/me', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(p.event_id);
  const q = db.prepare('SELECT * FROM questionnaires WHERE participant_id = ?').get(p.id);

  res.json({
    participant: {
      id: p.id,
      first_name: p.first_name,
      access_code: p.access_code,
      gender: p.gender,
      event_id: p.event_id
    },
    event,
    questionnaire: q ? {
      ...q,
      interests: JSON.parse(q.interests || '[]'),
      values: JSON.parse(q.core_values || '[]'),
      relational_expectations: JSON.parse(q.relational_expectations || '[]')
    } : null
  });
});

// Save or complete questionnaire
app.post('/api/participant/questionnaire', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const {
    target_preference,
    conversation_style,
    interests,
    custom_interest,
    values,
    relational_expectations,
    distinctive_outfit
  } = req.body;

  // Strict check: target_preference is mandatory with exact 3 choices
  if (!['femmes', 'hommes', 'deux'].includes(target_preference)) {
    return res.status(400).json({
      error: 'La question sur les préférences de rencontre est obligatoire (Femmes, Hommes, ou Les deux).'
    });
  }

  const qId = `q-${p.id}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO questionnaires (
      id, participant_id, target_preference, conversation_style,
      interests, custom_interest, core_values, relational_expectations,
      distinctive_outfit, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(participant_id) DO UPDATE SET
      target_preference = excluded.target_preference,
      conversation_style = excluded.conversation_style,
      interests = excluded.interests,
      custom_interest = excluded.custom_interest,
      core_values = excluded.core_values,
      relational_expectations = excluded.relational_expectations,
      distinctive_outfit = excluded.distinctive_outfit,
      completed_at = excluded.completed_at
  `).run(
    qId,
    p.id,
    target_preference,
    conversation_style || '',
    JSON.stringify(interests || []),
    custom_interest || '',
    JSON.stringify(values || []),
    JSON.stringify(relational_expectations || []),
    distinctive_outfit || '',
    now
  );

  res.json({ success: true, message: 'Questionnaire enregistré avec succès.' });
});

// Update distinctive outfit anytime during the evening
app.patch('/api/participant/outfit', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const { distinctive_outfit } = req.body;

  if (!distinctive_outfit || !distinctive_outfit.trim()) {
    return res.status(400).json({ error: 'Le signe distinctif ne peut pas être vide.' });
  }

  db.prepare(`
    UPDATE questionnaires
    SET distinctive_outfit = ?
    WHERE participant_id = ?
  `).run(distinctive_outfit.trim(), p.id);

  res.json({ success: true, distinctive_outfit: distinctive_outfit.trim() });
});

/* ============================================================
   5. SUGGESTIONS & INVITATIONS
   ============================================================ */

// Get current suggestion
app.get('/api/participant/suggestion', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const suggestion = findSuggestionForParticipant(p.event_id, p.id);
  res.json(suggestion);
});

// Defer current suggestion ("Plus tard")
app.post('/api/participant/suggestion/:id/defer', authenticateParticipant, (req, res) => {
  const p = req.participant;
  db.prepare(`
    UPDATE suggestions
    SET status = 'deferred'
    WHERE id = ? AND source_participant_id = ?
  `).run(req.params.id, p.id);

  res.json({ success: true });
});

// Send invitation ("J'aimerais rencontrer cette personne")
app.post('/api/participant/invitation/send', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const { target_participant_id, suggestion_id } = req.body;

  if (!target_participant_id) {
    return res.status(400).json({ error: 'Destinataire manquant.' });
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(p.event_id);
  expireStaleInvitations(p.event_id);

  // Check if target has reached pending invitation ceiling
  const targetPendingCount = db.prepare(`
    SELECT COUNT(*) as count FROM invitations
    WHERE event_id = ? AND receiver_id = ? AND status = 'pending'
  `).get(p.event_id, target_participant_id).count;

  if (targetPendingCount >= event.max_pending_received_invitations) {
    return res.status(429).json({
      error: 'Cette personne est actuellement très sollicitée. Nous vous proposerons d’autres suggestions en attendant !'
    });
  }

  // Update suggestion status
  if (suggestion_id) {
    db.prepare(`UPDATE suggestions SET status = 'interested' WHERE id = ?`).run(suggestion_id);
  }

  // Check if reciprocal invitation was ALREADY sent by the other person!
  const reciprocal = db.prepare(`
    SELECT * FROM invitations
    WHERE event_id = ? AND sender_id = ? AND receiver_id = ? AND status = 'pending'
  `).get(p.event_id, target_participant_id, p.id);

  const now = new Date().toISOString();

  if (reciprocal) {
    // MUTUAL MATCH! Trigger meeting creation and zone assignment
    const zoneNumber = assignMeetingZone(p.event_id);
    if (!zoneNumber) {
      return res.status(503).json({
        error: 'Toutes les zones sont actuellement occupées. Veuillez patienter un instant pendant qu’une zone se libère.'
      });
    }

    db.prepare(`UPDATE invitations SET status = 'accepted' WHERE id = ?`).run(reciprocal.id);

    const meetingId = `meet-${Date.now()}`;
    db.prepare(`
      INSERT INTO meetings (id, event_id, participant1_id, participant2_id, zone_number, status, confirmed_at)
      VALUES (?, ?, ?, ?, ?, 'confirmed', ?)
    `).run(meetingId, p.event_id, target_participant_id, p.id, zoneNumber, now);

    return res.json({
      mutual_confirmed: true,
      message: 'C’est réciproque ! Votre rencontre est confirmée !',
      zone_number: zoneNumber
    });
  }

  // Otherwise, create normal pending invitation
  const invId = `inv-${Date.now()}`;
  const expiryMs = (event.invitation_expiry_minutes || 20) * 60 * 1000;
  const expiresAt = new Date(Date.now() + expiryMs).toISOString();

  db.prepare(`
    INSERT INTO invitations (id, event_id, sender_id, receiver_id, status, sent_at, expires_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
    ON CONFLICT(event_id, sender_id, receiver_id) DO UPDATE SET
      status = 'pending',
      sent_at = excluded.sent_at,
      expires_at = excluded.expires_at
  `).run(invId, p.event_id, p.id, target_participant_id, now, expiresAt);

  res.json({
    mutual_confirmed: false,
    message: 'Ton invitation a été envoyée. Nous te préviendrons si votre rencontre se confirme.'
  });
});

// List received invitations for current participant (discreet: only first name)
app.get('/api/participant/invitations', authenticateParticipant, (req, res) => {
  const p = req.participant;
  expireStaleInvitations(p.event_id);

  const invitations = db.prepare(`
    SELECT i.id, i.sender_id, i.sent_at, i.expires_at, p.first_name as sender_first_name
    FROM invitations i
    JOIN participants p ON i.sender_id = p.id
    WHERE i.event_id = ? AND i.receiver_id = ? AND i.status = 'pending'
    ORDER BY i.sent_at DESC
  `).all(p.event_id, p.id);

  res.json(invitations);
});

// Accept or decline invitation
app.post('/api/participant/invitations/:id/respond', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const { accept } = req.body;
  const inv = db.prepare(`
    SELECT * FROM invitations
    WHERE id = ? AND receiver_id = ? AND status = 'pending'
  `).get(req.params.id, p.id);

  if (!inv) {
    return res.status(404).json({ error: 'Invitation introuvable ou expirée.' });
  }

  const now = new Date().toISOString();

  if (!accept) {
    // Discreet decline: mark declined, no notification sent to sender
    db.prepare(`UPDATE invitations SET status = 'declined' WHERE id = ?`).run(inv.id);
    return res.json({ success: true, message: 'Invitation déclinée discrètement.' });
  }

  // Accepted! Assign zone
  const zoneNumber = assignMeetingZone(p.event_id);
  if (!zoneNumber) {
    return res.status(503).json({
      error: 'Toutes les zones actives sont actuellement occupées. Veuillez réessayer dans quelques instants.'
    });
  }

  db.prepare(`UPDATE invitations SET status = 'accepted' WHERE id = ?`).run(inv.id);

  const meetingId = `meet-${Date.now()}`;
  db.prepare(`
    INSERT INTO meetings (id, event_id, participant1_id, participant2_id, zone_number, status, confirmed_at)
    VALUES (?, ?, ?, ?, ?, 'confirmed', ?)
  `).run(meetingId, p.event_id, inv.sender_id, p.id, zoneNumber, now);

  res.json({
    success: true,
    mutual_confirmed: true,
    zone_number: zoneNumber
  });
});

/* ============================================================
   6. MEETINGS & EVALUATIONS
   ============================================================ */

// List meetings for participant.
// STRICT PRIVACY: Outfit detail is only included if meeting is confirmed or completed!
app.get('/api/participant/meetings', authenticateParticipant, (req, res) => {
  const p = req.participant;

  const rawMeetings = db.prepare(`
    SELECT m.*,
           p1.id as p1_id, p1.first_name as p1_first_name,
           p2.id as p2_id, p2.first_name as p2_first_name,
           q1.distinctive_outfit as p1_outfit,
           q2.distinctive_outfit as p2_outfit,
           z.name as zone_name,
           pe.rating as my_rating,
           pe.private_note as my_private_note
    FROM meetings m
    JOIN participants p1 ON m.participant1_id = p1.id
    JOIN participants p2 ON m.participant2_id = p2.id
    LEFT JOIN questionnaires q1 ON p1.id = q1.participant_id
    LEFT JOIN questionnaires q2 ON p2.id = q2.participant_id
    LEFT JOIN zones z ON z.event_id = m.event_id AND z.zone_number = m.zone_number
    LEFT JOIN private_evaluations pe ON pe.meeting_id = m.id AND pe.author_id = ?
    WHERE m.event_id = ? AND (m.participant1_id = ? OR m.participant2_id = ?)
    ORDER BY m.confirmed_at DESC
  `).all(p.id, p.event_id, p.id, p.id);

  const sanitized = rawMeetings.map(m => {
    const isP1 = m.participant1_id === p.id;
    const otherId = isP1 ? m.p2_id : m.p1_id;
    const otherFirstName = isP1 ? m.p2_first_name : m.p1_first_name;
    const otherOutfit = isP1 ? m.p2_outfit : m.p1_outfit;

    return {
      id: m.id,
      status: m.status,
      zone_number: m.zone_number,
      zone_name: m.zone_name,
      confirmed_at: m.confirmed_at,
      completed_at: m.completed_at,
      other_participant_id: otherId,
      other_first_name: otherFirstName,
      // Outfit is only visible because meeting is mutual & confirmed!
      other_distinctive_outfit: (m.status === 'confirmed' || m.status === 'completed') ? otherOutfit : null,
      my_rating: m.my_rating,
      my_private_note: m.my_private_note
    };
  });

  res.json(sanitized);
});

// Mark meeting as completed ("Rencontre effectuée")
app.post('/api/participant/meetings/:id/complete', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE meetings
    SET status = 'completed', completed_at = ?
    WHERE id = ? AND (participant1_id = ? OR participant2_id = ?) AND status = 'confirmed'
  `).run(now, req.params.id, p.id, p.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Rencontre introuvable ou déjà terminée.' });
  }

  res.json({ success: true, message: 'Rencontre marquée comme effectuée.' });
});

// Cancel meeting
app.post('/api/participant/meetings/:id/cancel', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE meetings
    SET status = 'cancelled', cancelled_at = ?
    WHERE id = ? AND (participant1_id = ? OR participant2_id = ?) AND status = 'confirmed'
  `).run(now, req.params.id, p.id, p.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Rencontre introuvable ou déjà terminée.' });
  }

  res.json({ success: true, message: 'Rencontre annulée.' });
});

// Save private evaluation & note (strictly private!)
app.post('/api/participant/meetings/:id/evaluate', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const { rating, private_note } = req.body;
  const meetingId = req.params.id;

  const meeting = db.prepare(`
    SELECT id FROM meetings
    WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
  `).get(meetingId, p.id, p.id);

  if (!meeting) return res.status(404).json({ error: 'Rencontre introuvable.' });

  const evalId = `eval-${meetingId}-${p.id}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO private_evaluations (id, meeting_id, author_id, rating, private_note, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(meeting_id, author_id) DO UPDATE SET
      rating = excluded.rating,
      private_note = excluded.private_note,
      created_at = excluded.created_at
  `).run(evalId, meetingId, p.id, rating || null, private_note || '', now);

  res.json({ success: true, message: 'Note privée enregistrée en toute confidentialité.' });
});

/* ============================================================
   7. CURIOSITÉ FEATURE
   ============================================================ */

app.get('/api/participant/curiosities', authenticateParticipant, (req, res) => {
  const p = req.participant;

  const received = db.prepare(`
    SELECT c.*, sender.first_name as sender_first_name
    FROM curiosities c
    JOIN participants sender ON c.sender_id = sender.id
    WHERE c.event_id = ? AND c.receiver_id = ?
    ORDER BY c.sent_at DESC
  `).all(p.event_id, p.id);

  const sent = db.prepare(`
    SELECT c.*, receiver.first_name as receiver_first_name
    FROM curiosities c
    JOIN participants receiver ON c.receiver_id = receiver.id
    WHERE c.event_id = ? AND c.sender_id = ?
    ORDER BY c.sent_at DESC
  `).all(p.event_id, p.id);

  res.json({ received, sent });
});

app.post('/api/participant/curiosities/send', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const { receiver_id, question } = req.body;

  if (!receiver_id || !question) {
    return res.status(400).json({ error: 'Destinataire et question requis.' });
  }

  const curId = `cur-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO curiosities (id, event_id, sender_id, receiver_id, question, status, sent_at)
    VALUES (?, ?, ?, ?, ?, 'sent', ?)
  `).run(curId, p.event_id, p.id, receiver_id, question, now);

  res.json({ success: true, message: 'Curiosité envoyée avec succès !' });
});

app.post('/api/participant/curiosities/:id/answer', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const { response } = req.body;

  if (!response || !response.trim()) {
    return res.status(400).json({ error: 'Réponse obligatoire.' });
  }

  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE curiosities
    SET response = ?, status = 'answered', answered_at = ?
    WHERE id = ? AND receiver_id = ?
  `).run(response.trim(), now, req.params.id, p.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Curiosité introuvable.' });
  }

  res.json({ success: true, message: 'Ta réponse a bien été enregistrée et partagée.' });
});

/* ============================================================
   8. END OF EVENING: SELECTION & REVELATION & RECAP
   ============================================================ */

// List people the participant has met or interacted with (eligible for final selection)
app.get('/api/participant/eligible-for-selection', authenticateParticipant, (req, res) => {
  const p = req.participant;

  const met = db.prepare(`
    SELECT DISTINCT
      CASE WHEN m.participant1_id = ? THEN p2.id ELSE p1.id END as id,
      CASE WHEN m.participant1_id = ? THEN p2.first_name ELSE p1.first_name END as first_name,
      m.status as meeting_status,
      pe.private_note
    FROM meetings m
    JOIN participants p1 ON m.participant1_id = p1.id
    JOIN participants p2 ON m.participant2_id = p2.id
    LEFT JOIN private_evaluations pe ON pe.meeting_id = m.id AND pe.author_id = ?
    WHERE m.event_id = ? AND (m.participant1_id = ? OR m.participant2_id = ?)
  `).all(p.id, p.id, p.id, p.event_id, p.id, p.id);

  const mySelections = db.prepare(`
    SELECT selected_participant_id FROM final_selections
    WHERE event_id = ? AND author_id = ?
  `).all(p.event_id, p.id).map(s => s.selected_participant_id);

  res.json({ met, selected_ids: mySelections });
});

// Save final selection
app.post('/api/participant/final-selections', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const { selected_participant_ids } = req.body;

  if (!Array.isArray(selected_participant_ids)) {
    return res.status(400).json({ error: 'Format invalide.' });
  }

  const now = new Date().toISOString();

  // Clear previous selections for this participant
  db.prepare('DELETE FROM final_selections WHERE event_id = ? AND author_id = ?').run(p.event_id, p.id);

  for (const targetId of selected_participant_ids) {
    db.prepare(`
      INSERT INTO final_selections (id, event_id, author_id, selected_participant_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(`fs-${p.id}-${targetId}`, p.event_id, p.id, targetId, now);
  }

  res.json({ success: true, count: selected_participant_ids.length });
});

// Full personal recap screen
app.get('/api/participant/recap', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const event = db.prepare('SELECT status FROM events WHERE id = ?').get(p.event_id);

  // 1. Meetings & private notes
  const meetings = db.prepare(`
    SELECT m.id, m.status, m.confirmed_at, m.completed_at,
           CASE WHEN m.participant1_id = ? THEN p2.first_name ELSE p1.first_name END as first_name,
           CASE WHEN m.participant1_id = ? THEN p2.id ELSE p1.id END as participant_id,
           pe.rating, pe.private_note
    FROM meetings m
    JOIN participants p1 ON m.participant1_id = p1.id
    JOIN participants p2 ON m.participant2_id = p2.id
    LEFT JOIN private_evaluations pe ON pe.meeting_id = m.id AND pe.author_id = ?
    WHERE m.event_id = ? AND (m.participant1_id = ? OR m.participant2_id = ?)
  `).all(p.id, p.id, p.id, p.event_id, p.id, p.id);

  // 2. Curiosities sent & received with answers
  const curiosities = db.prepare(`
    SELECT c.*,
           sender.first_name as sender_first_name,
           receiver.first_name as receiver_first_name
    FROM curiosities c
    JOIN participants sender ON c.sender_id = sender.id
    JOIN participants receiver ON c.receiver_id = receiver.id
    WHERE c.event_id = ? AND (c.sender_id = ? OR c.receiver_id = ?)
    ORDER BY c.sent_at DESC
  `).all(p.event_id, p.id, p.id);

  // 3. Selection & Revelation logic
  // Only reveal who selected you if event.status === 'revealed'
  let interestedInMe = [];
  let mutualMatches = [];

  if (event.status === 'revealed') {
    // Who selected me?
    const selectors = db.prepare(`
      SELECT fs.author_id, p.first_name
      FROM final_selections fs
      JOIN participants p ON fs.author_id = p.id
      WHERE fs.event_id = ? AND fs.selected_participant_id = ?
    `).all(p.event_id, p.id);

    // Who did I select?
    const mySelections = db.prepare(`
      SELECT selected_participant_id
      FROM final_selections
      WHERE event_id = ? AND author_id = ?
    `).all(p.event_id, p.id).map(s => s.selected_participant_id);

    for (const sel of selectors) {
      const isMutual = mySelections.includes(sel.author_id);
      if (isMutual) {
        mutualMatches.push({ id: sel.author_id, first_name: sel.first_name });
      } else {
        interestedInMe.push({ id: sel.author_id, first_name: sel.first_name });
      }
    }
  }

  res.json({
    event_status: event.status,
    meetings,
    curiosities,
    interested_in_me: interestedInMe,
    mutual_matches: mutualMatches,
  });
});

/* ============================================================
   9. ADMIN DASHBOARD & ANALYTICS
   ============================================================ */

app.get('/api/admin/events/:id/dashboard', (req, res) => {
  const eventId = req.params.id;
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) return res.status(404).json({ error: 'Événement non trouvé.' });

  const totalRegistered = db.prepare('SELECT COUNT(*) as count FROM participants WHERE event_id = ?').get(eventId).count;
  const completedQuestionnaires = db.prepare(`
    SELECT COUNT(*) as count
    FROM questionnaires q
    JOIN participants p ON q.participant_id = p.id
    WHERE p.event_id = ?
  `).get(eventId).count;

  const suggestionsCount = db.prepare('SELECT COUNT(*) as count FROM suggestions WHERE event_id = ?').get(eventId).count;
  const pendingInvitations = db.prepare("SELECT COUNT(*) as count FROM invitations WHERE event_id = ? AND status = 'pending'").get(eventId).count;
  const acceptedInvitations = db.prepare("SELECT COUNT(*) as count FROM invitations WHERE event_id = ? AND status = 'accepted'").get(eventId).count;
  const expiredInvitations = db.prepare("SELECT COUNT(*) as count FROM invitations WHERE event_id = ? AND status = 'expired'").get(eventId).count;

  const confirmedMeetings = db.prepare("SELECT COUNT(*) as count FROM meetings WHERE event_id = ? AND status = 'confirmed'").get(eventId).count;
  const completedMeetings = db.prepare("SELECT COUNT(*) as count FROM meetings WHERE event_id = ? AND status = 'completed'").get(eventId).count;

  const curiositiesSent = db.prepare('SELECT COUNT(*) as count FROM curiosities WHERE event_id = ?').get(eventId).count;
  const curiositiesAnswered = db.prepare("SELECT COUNT(*) as count FROM curiosities WHERE event_id = ? AND status = 'answered'").get(eventId).count;

  const finalSelectionsCount = db.prepare('SELECT COUNT(*) as count FROM final_selections WHERE event_id = ?').get(eventId).count;

  const zoneStats = getZoneStats(eventId);

  res.json({
    event,
    metrics: {
      total_registered: totalRegistered,
      completed_questionnaires: completedQuestionnaires,
      active_participants: totalRegistered,
      suggestions_count: suggestionsCount,
      pending_invitations: pendingInvitations,
      accepted_invitations: acceptedInvitations,
      expired_invitations: expiredInvitations,
      confirmed_meetings: confirmedMeetings,
      completed_meetings: completedMeetings,
      curiosities_sent: curiositiesSent,
      curiosities_answered: curiositiesAnswered,
      final_selections_count: finalSelectionsCount
    },
    zones: zoneStats
  });
});

// Admin list of participants (privacy preserving: no raw private answers or notes)
app.get('/api/admin/events/:id/participants', (req, res) => {
  const eventId = req.params.id;

  const participants = db.prepare(`
    SELECT p.id, p.first_name, p.status, p.created_at,
           CASE WHEN q.id IS NOT NULL THEN 1 ELSE 0 END as questionnaire_completed,
           (SELECT COUNT(*) FROM suggestions WHERE event_id = ? AND source_participant_id = p.id) as suggestions_received,
           (SELECT COUNT(*) FROM invitations WHERE event_id = ? AND receiver_id = p.id AND status = 'pending') as pending_invitations,
           (SELECT COUNT(*) FROM meetings WHERE event_id = ? AND (participant1_id = p.id OR participant2_id = p.id) AND status = 'confirmed') as confirmed_meetings_count
    FROM participants p
    LEFT JOIN questionnaires q ON p.id = q.participant_id
    WHERE p.event_id = ?
    ORDER BY p.created_at DESC
  `).all(eventId, eventId, eventId, eventId);

  res.json(participants);
});

// Trigger suggestions wave for all ready participants
app.post('/api/events/:id/trigger-wave', (req, res) => {
  const eventId = req.params.id;
  const participants = db.prepare(`
    SELECT p.id
    FROM participants p
    JOIN questionnaires q ON p.id = q.participant_id
    WHERE p.event_id = ? AND p.status = 'active'
  `).all(eventId);

  let generatedCount = 0;
  for (const p of participants) {
    const sug = findSuggestionForParticipant(eventId, p.id);
    if (sug) generatedCount++;
  }

  res.json({ success: true, participants_evaluated: participants.length, suggestions_generated: generatedCount });
});

// Block or report a participant
app.post('/api/participant/report', authenticateParticipant, (req, res) => {
  const p = req.participant;
  const { target_id, reason } = req.body;

  if (!target_id) return res.status(400).json({ error: 'Cible manquante.' });

  const id = `rep-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO blocks_reports (id, author_id, target_id, reason, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(author_id, target_id) DO UPDATE SET reason = excluded.reason
  `).run(id, p.id, target_id, reason || 'Signalement discrétion', now);

  res.json({ success: true, message: 'Personne bloquée. Aucune suggestion ne vous sera plus proposée ensemble.' });
});

// Serve frontend in production (when running standalone Express)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Only listen if executed directly (not in Vercel Serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Serveur Soirée Célibataires démarré sur http://localhost:${PORT}`);
  });
}

export default app;
