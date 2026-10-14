import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp/data' : path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'soiree.db');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys (WAL works in /tmp or local)
try {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);
} catch (e) {
  // Fallback if WAL is not supported in environment
  db.exec('PRAGMA foreign_keys = ON;');
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open_registration', -- 'draft', 'open_registration', 'in_progress', 'final_selection', 'revealed', 'archived'
      num_zones INTEGER NOT NULL DEFAULT 4, -- Configurable 1 to 10
      suggestions_active INTEGER NOT NULL DEFAULT 1,
      max_active_suggestions INTEGER NOT NULL DEFAULT 1,
      max_pending_received_invitations INTEGER NOT NULL DEFAULT 2,
      invitation_expiry_minutes INTEGER NOT NULL DEFAULT 20,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      zone_number INTEGER NOT NULL, -- 1 to 10
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 2, -- indicative pairs capacity
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE(event_id, zone_number)
    );

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      access_code TEXT UNIQUE NOT NULL,
      gender TEXT NOT NULL, -- 'femme', 'homme', 'autre' (strictly private for mutual matching)
      status TEXT NOT NULL DEFAULT 'active', -- 'registered', 'active', 'paused'
      created_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questionnaires (
      id TEXT PRIMARY KEY,
      participant_id TEXT UNIQUE NOT NULL,
      target_preference TEXT NOT NULL, -- 'femmes', 'hommes', 'deux' (strictly private)
      conversation_style TEXT, -- JSON string or description
      interests TEXT, -- JSON array of strings
      custom_interest TEXT,
      core_values TEXT, -- JSON array of strings
      relational_expectations TEXT, -- JSON array of strings
      distinctive_outfit TEXT, -- e.g. "Je porte une chemise bleue" (strictly private until mutual match)
      completed_at TEXT NOT NULL,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      source_participant_id TEXT NOT NULL,
      target_participant_id TEXT NOT NULL,
      icebreaker TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'presented', -- 'presented', 'interested', 'deferred', 'dismissed'
      presented_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (source_participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (target_participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      UNIQUE(event_id, source_participant_id, target_participant_id)
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
      sent_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES participants(id) ON DELETE CASCADE,
      UNIQUE(event_id, sender_id, receiver_id)
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      participant1_id TEXT NOT NULL,
      participant2_id TEXT NOT NULL,
      zone_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'completed', 'cancelled'
      confirmed_at TEXT NOT NULL,
      completed_at TEXT,
      cancelled_at TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (participant1_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (participant2_id) REFERENCES participants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS private_evaluations (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      rating INTEGER,
      private_note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES participants(id) ON DELETE CASCADE,
      UNIQUE(meeting_id, author_id)
    );

    CREATE TABLE IF NOT EXISTS curiosities (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      question TEXT NOT NULL,
      response TEXT,
      status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'answered'
      sent_at TEXT NOT NULL,
      answered_at TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES participants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS final_selections (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      selected_participant_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (selected_participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      UNIQUE(event_id, author_id, selected_participant_id)
    );

    CREATE TABLE IF NOT EXISTS blocks_reports (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (author_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES participants(id) ON DELETE CASCADE,
      UNIQUE(author_id, target_id)
    );
  `);

  // Ensure default demo event exists if none
  const existing = db.prepare('SELECT COUNT(*) as count FROM events').get();
  if (existing.count === 0) {
    seedDemoEvent();
  }
}

export function seedDemoEvent() {
  const eventId = 'demo-soiree-paris';
  const now = new Date().toISOString();

  // Delete existing demo data if any
  db.prepare('DELETE FROM events WHERE id = ?').run(eventId);

  db.prepare(`
    INSERT INTO events (
      id, code, name, date, description, status, num_zones, suggestions_active,
      max_active_suggestions, max_pending_received_invitations, invitation_expiry_minutes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    'PARIS24',
    'Soirée Découverte — Le Pavillon Étoile',
    'Ce soir, 20h00',
    'Une atmosphère détendue pour des rencontres spontanées et de vraies conversations.',
    'in_progress', // 'in_progress' so participants can interact right away
    5, // 5 active zones (from 1 to 5)
    1, // suggestions active
    1,
    2,
    25,
    now
  );

  // Initialize 10 zones in DB, but only 1..5 are active according to num_zones
  const zoneDescriptions = [
    { num: 1, name: "Près du bar central (Comptoir en bois)", cap: 3, active: 1 },
    { num: 2, name: "Salon Verrière (Canapés en cuir)", cap: 2, active: 1 },
    { num: 3, name: "Alcôve Bibliothèque (Ambiance feutrée)", cap: 2, active: 1 },
    { num: 4, name: "Terrasse Chauffée (Vue Jardin)", cap: 3, active: 1 },
    { num: 5, name: "Coin Mezzanine (Lumières douces)", cap: 2, active: 1 },
    { num: 6, name: "Espace Vinothèque", cap: 2, active: 0 },
    { num: 7, name: "Salon Lounge Ouest", cap: 2, active: 0 },
    { num: 8, name: "Grande Table Haute", cap: 2, active: 0 },
    { num: 9, name: "Galerie d'Art", cap: 2, active: 0 },
    { num: 10, name: "Jardin d'Hiver", cap: 2, active: 0 },
  ];

  for (const z of zoneDescriptions) {
    db.prepare(`
      INSERT INTO zones (id, event_id, zone_number, name, capacity, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`zone-${eventId}-${z.num}`, eventId, z.num, z.name, z.cap, z.active);
  }

  // 10 realistic fictional participants with diverse preferences and outfits
  const demoParticipants = [
    {
      id: 'p-camille',
      first_name: 'Camille',
      gender: 'femme',
      access_code: 'CAM-88',
      token: 'token-camille-demo',
      target_pref: 'hommes',
      conv_style: 'Mélange de légèreté et de profondeur',
      interests: ['Voyages et découvertes', 'Culture, cinéma et musique', 'Gastronomie et sorties'],
      custom_interest: 'Architecture italienne et jazz',
      values: ['Curiosité d esprit', 'Humour bienveillant', 'Authenticité'],
      expectations: ['Partage d idées', 'Rire ensemble', 'Spontanéité'],
      outfit: 'Je porte une veste blazer vert émeraude et un foulard soyeux',
    },
    {
      id: 'p-thomas',
      first_name: 'Thomas',
      gender: 'homme',
      access_code: 'THO-42',
      token: 'token-thomas-demo',
      target_pref: 'femmes',
      conv_style: 'Spontané et curieux d histoires vécues',
      interests: ['Voyages et découvertes', 'Sport et activités', 'Nature et mode de vie'],
      custom_interest: 'Trekking en montagne et photographie argentique',
      values: ['Aventure', 'Simplicité', 'Sens de l écoute'],
      expectations: ['Échanges chaleureux', 'Curiosité mutuelle'],
      outfit: 'Je porte une chemise en lin beige clair et une montre à bracelet marron',
    },
    {
      id: 'p-natalia',
      first_name: 'Natalia',
      gender: 'femme',
      access_code: 'NAT-19',
      token: 'token-natalia-demo',
      target_pref: 'les deux',
      conv_style: 'Conversations profondes et passionnées',
      interests: ['Culture, cinéma et musique', 'Société, idées et actualité', 'Gastronomie et sorties'],
      custom_interest: 'Cinéma d auteur des années 70 et cuisine du monde',
      values: ['Ouverture d esprit', 'Empathie', 'Sensibilité artistique'],
      expectations: ['Découverte de nouveaux points de vue', 'Connexion intellectuelle'],
      outfit: 'Je porte une robe noire mi-longue et un pendentif doré en croissant de lune',
    },
    {
      id: 'p-jonathan',
      first_name: 'Jonathan',
      gender: 'homme',
      access_code: 'JON-93',
      token: 'token-jonathan-demo',
      target_pref: 'femmes',
      conv_style: 'Posé, observateur avec beaucoup d autodérision',
      interests: ['Culture, cinéma et musique', 'Projets, ambitions et travail', 'Gastronomie et sorties'],
      custom_interest: 'Création d entreprises et dégustation de cafés de spécialité',
      values: ['Loyauté', 'Créativité', 'Dépassement de soi'],
      expectations: ['Partage de visions', 'Bonne humeur communicative'],
      outfit: 'Je porte un pull col roulé bleu marine et des lunettes fines écailles',
    },
    {
      id: 'p-sophie',
      first_name: 'Sophie',
      gender: 'femme',
      access_code: 'SOP-27',
      token: 'token-sophie-demo',
      target_pref: 'hommes',
      conv_style: 'Pétillante, rires faciles et questions directes',
      interests: ['Gastronomie et sorties', 'Nature et mode de vie', 'Sport et activités'],
      custom_interest: 'Pâtisserie moderne et randonnées côtières',
      values: ['Générosité', 'Optimisme', 'Partage'],
      expectations: ['Complicité immédiate', 'Énergie positive'],
      outfit: 'Je porte un chemisier blanc brodé et une bague argentée très large',
    },
    {
      id: 'p-lucas',
      first_name: 'Lucas',
      gender: 'homme',
      access_code: 'LUC-55',
      token: 'token-lucas-demo',
      target_pref: 'les deux',
      conv_style: 'Réfléchi mais adore les improvisations',
      interests: ['Société, idées et actualité', 'Culture, cinéma et musique', 'Voyages et découvertes'],
      custom_interest: 'Philosophie contemporaine et musique électronique ambient',
      values: ['Intégrité', 'Curiosité insatiable', 'Bienveillance'],
      expectations: ['Discussions stimulantes sans jugement'],
      outfit: 'Je porte une surchemise grise en flanelle et des baskets blanches immaculées',
    },
    {
      id: 'p-emma',
      first_name: 'Emma',
      gender: 'femme',
      access_code: 'EMM-63',
      token: 'token-emma-demo',
      target_pref: 'hommes',
      conv_style: 'Directe, joyeuse et sans filtre',
      interests: ['Projets, ambitions et travail', 'Voyages et découvertes', 'Gastronomie et sorties'],
      custom_interest: 'Voyages en van et street food asiatique',
      values: ['Liberté', 'Sincérité', 'Audace'],
      expectations: ['Quelqu un d enthousiaste et autonome'],
      outfit: 'Je porte une veste en jean oversize avec des pins colorés',
    },
    {
      id: 'p-marc',
      first_name: 'Marc',
      gender: 'homme',
      access_code: 'MAR-71',
      token: 'token-marc-demo',
      target_pref: 'femmes',
      conv_style: 'Calme, attentionné et amateur de bonnes tables',
      interests: ['Gastronomie et sorties', 'Nature et mode de vie', 'Voyages et découvertes'],
      custom_interest: 'Œnologie bio et apiculture urbaine',
      values: ['Respect du vivant', 'Patience', 'Douceur'],
      expectations: ['Rencontre simple et apaisante'],
      outfit: 'Je porte un gilet en laine bordeaux et une écharpe fine grise',
    },
    {
      id: 'p-chloe',
      first_name: 'Chloé',
      gender: 'femme',
      access_code: 'CHL-34',
      token: 'token-chloe-demo',
      target_pref: 'hommes',
      conv_style: 'Douce, souriante et passionnée d écriture',
      interests: ['Culture, cinéma et musique', 'Nature et mode de vie', 'Voyages et découvertes'],
      custom_interest: 'Romans graphiques et yoga au lever du soleil',
      values: ['Écoute mutuelle', 'Douceur de vivre', 'Humour subtil'],
      expectations: ['Partage d émotions sincères'],
      outfit: 'Je porte une blouse terracotta et des créoles dorées torsadées',
    },
    {
      id: 'p-alexandre',
      first_name: 'Alexandre',
      gender: 'homme',
      access_code: 'ALX-12',
      token: 'token-alexandre-demo',
      target_pref: 'femmes',
      conv_style: 'Dynamique, voyageur et spontané',
      interests: ['Sport et activités', 'Voyages et découvertes', 'Projets, ambitions et travail'],
      custom_interest: 'Plongée sous-marine et roadtrips spontanés',
      values: ['Énergie', 'Franchise', 'Curiosité'],
      expectations: ['Rires partagés et esprit d aventure'],
      outfit: 'Je porte une chemise en denim bleu clair aux manches retroussées',
    },
  ];

  for (const p of demoParticipants) {
    db.prepare(`
      INSERT INTO participants (id, event_id, first_name, session_token, access_code, gender, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.id, eventId, p.first_name, p.token, p.access_code, p.gender, 'active', now);

    db.prepare(`
      INSERT INTO questionnaires (
        id, participant_id, target_preference, conversation_style, interests,
        custom_interest, core_values, relational_expectations, distinctive_outfit, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `q-${p.id}`,
      p.id,
      p.target_pref,
      p.conv_style,
      JSON.stringify(p.interests),
      p.custom_interest,
      JSON.stringify(p.values),
      JSON.stringify(p.expectations),
      p.outfit,
      now
    );
  }

  // Pre-seed a confirmed meeting between Camille and Thomas in Zone 2
  const meeting1Id = 'meet-camille-thomas';
  db.prepare(`
    INSERT INTO meetings (id, event_id, participant1_id, participant2_id, zone_number, status, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(meeting1Id, eventId, 'p-camille', 'p-thomas', 2, 'confirmed', now);

  // Private evaluation by Camille on Thomas (strictly private!)
  db.prepare(`
    INSERT INTO private_evaluations (id, meeting_id, author_id, rating, private_note, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('eval-1', meeting1Id, 'p-camille', 5, 'Super discussion sur l architecture et l Italie, très respectueux et drôle.', now);

  // Pre-seed an invitation in pending state: Jonathan invited Natalia
  db.prepare(`
    INSERT INTO invitations (id, event_id, sender_id, receiver_id, status, sent_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'inv-jon-nat',
    eventId,
    'p-jonathan',
    'p-natalia',
    'pending',
    now,
    new Date(Date.now() + 20 * 60 * 1000).toISOString()
  );

  // Pre-seed a suggestion for Natalia: Lucas
  db.prepare(`
    INSERT INTO suggestions (id, event_id, source_participant_id, target_participant_id, icebreaker, status, presented_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'sug-nat-luc',
    eventId,
    'p-natalia',
    'p-lucas',
    'Vous pourriez avoir une conversation très stimulante autour du cinéma d auteur, de la musique et de votre goût pour les idées contemporaines.',
    'presented',
    now
  );

  // Pre-seed a curiosity: Natalia sent a question to Jonathan
  db.prepare(`
    INSERT INTO curiosities (id, event_id, sender_id, receiver_id, question, response, status, sent_at, answered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'cur-nat-jon',
    eventId,
    'p-natalia',
    'p-jonathan',
    'Quelle petite chose peut immédiatement te mettre de bonne humeur ?',
    'Une odeur de café fraîchement moulu le matin et un bon vinyle de jazz !',
    'answered',
    now,
    now
  );

  // Pre-seed final selection: Camille selected Thomas; Thomas selected Camille (mutual match!)
  // And Natalia selected Jonathan (unilateral)
  db.prepare(`
    INSERT INTO final_selections (id, event_id, author_id, selected_participant_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run('fs-cam-tho', eventId, 'p-camille', 'p-thomas', now);

  db.prepare(`
    INSERT INTO final_selections (id, event_id, author_id, selected_participant_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run('fs-tho-cam', eventId, 'p-thomas', 'p-camille', now);

  db.prepare(`
    INSERT INTO final_selections (id, event_id, author_id, selected_participant_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run('fs-nat-jon', eventId, 'p-natalia', 'p-jonathan', now);

  console.log('Demo event initialized successfully with 10 participants, zones, and interactions.');
}
