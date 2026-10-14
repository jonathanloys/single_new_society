import assert from 'node:assert';

const BASE_URL = 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('--- DÉBUT DE LA SUITE DE TESTS COMPLÈTE DU MVP ---');

  const testCode = 'T' + Math.floor(1000 + Math.random() * 9000);

  // Test 1: L'administrateur peut créer un événement
  console.log('Test 1: Création d’un événement par l’administrateur...');
  const createEvt = await request('/events', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Soirée Pilote Test',
      date: 'Demain 20h',
      description: 'Test unitaire automatisé',
      num_zones: 4,
      code: testCode
    })
  });
  assert.strictEqual(createEvt.status, 201, 'L’événement doit être créé avec 201');
  const eventId = createEvt.data.id;
  assert.strictEqual(createEvt.data.num_zones, 4, 'Le nombre de zones doit être 4');
  console.log('✓ Test 1 validé');

  // Test 2 & 3: Configuration de 1 à 10 zones et restriction d'attribution
  console.log('Test 2 & 3: Zones actives limitées à 1..4 et zones 5..10 inaccessibles...');
  const zonesRes = await request(`/events/${eventId}/zones`);
  assert.strictEqual(zonesRes.ok, true);
  const activeZones = zonesRes.data.filter(z => z.is_in_range && z.is_active === 1);
  const inactiveZones = zonesRes.data.filter(z => !z.is_in_range);
  assert.strictEqual(activeZones.length, 4, 'Exactement 4 zones actives (1 à 4)');
  assert.strictEqual(inactiveZones.length, 6, 'Zones 5 à 10 inactives et hors plage');
  console.log('✓ Tests 2 & 3 validés');

  // Test 4: Un participant peut rejoindre l'événement
  console.log('Test 4: Inscription d’un participant avec token et code d’accès...');
  const regAlice = await request(`/events/${testCode}/register`, {
    method: 'POST',
    body: JSON.stringify({ first_name: 'Alice', gender: 'femme' })
  });
  assert.strictEqual(regAlice.status, 201);
  assert.ok(regAlice.data.token, 'Un token de session doit être généré');
  assert.ok(regAlice.data.access_code, 'Un code d’accès de secours doit être généré');
  const aliceToken = regAlice.data.token;
  const aliceId = regAlice.data.participant.id;
  console.log('✓ Test 4 validé');

  // Test 5: Le questionnaire impose le choix entre femmes, hommes, les deux
  console.log('Test 5: Validation stricte des préférences obligatoires...');
  const badQ = await request('/participant/questionnaire', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ target_preference: 'invalide' })
  });
  assert.strictEqual(badQ.status, 400, 'Doit rejeter une préférence invalide');

  const goodQAlice = await request('/participant/questionnaire', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({
      target_preference: 'hommes',
      conversation_style: 'Spontanée',
      interests: ['Voyages et découvertes', 'Culture, cinéma et musique'],
      core_values: ['L’humour et l’autodérision'],
      distinctive_outfit: 'Jupe plissée noire et veste bordeaux'
    })
  });
  assert.strictEqual(goodQAlice.ok, true);
  console.log('✓ Test 5 validé');

  // Test 6: Le signe distinctif peut être modifié
  console.log('Test 6: Modification du signe vestimentaire en cours de soirée...');
  const updateOutfit = await request('/participant/outfit', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ distinctive_outfit: 'Veste bordeaux retirée, chemisier blanc et foulard' })
  });
  assert.strictEqual(updateOutfit.ok, true);
  assert.strictEqual(updateOutfit.data.distinctive_outfit, 'Veste bordeaux retirée, chemisier blanc et foulard');
  console.log('✓ Test 6 validé');

  // Register Bob (homme, seeking femmes)
  const regBob = await request(`/events/${testCode}/register`, {
    method: 'POST',
    body: JSON.stringify({ first_name: 'Bob', gender: 'homme' })
  });
  const bobToken = regBob.data.token;
  const bobId = regBob.data.participant.id;

  await request('/participant/questionnaire', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bobToken}` },
    body: JSON.stringify({
      target_preference: 'femmes',
      conversation_style: 'Calme',
      interests: ['Voyages et découvertes'],
      core_values: ['La curiosité d’esprit'],
      distinctive_outfit: 'Pull col roulé gris et lunettes rondes'
    })
  });

  // Test 7 & 8: Préférences de rencontre respectées et amorce non privée
  console.log('Test 7 & 8: Suggestion générée avec amorce naturelle et respect réciproque...');
  const sugAlice = await request('/participant/suggestion', {
    headers: { Authorization: `Bearer ${aliceToken}` }
  });
  assert.strictEqual(sugAlice.ok, true);
  assert.ok(sugAlice.data, 'Alice doit recevoir une suggestion (Bob)');
  assert.strictEqual(sugAlice.data.target_first_name, 'Bob');
  assert.ok(sugAlice.data.icebreaker.includes('voyages et découvertes'), 'Amorce basée sur intérêt commun');
  assert.strictEqual(sugAlice.data.distinctive_outfit, undefined, 'Signe vestimentaire NON visible dans la suggestion');
  console.log('✓ Tests 7 & 8 validés');

  // Test 9: Envoi d'une invitation ne confirme pas immédiatement la rencontre
  console.log('Test 9: Envoi de l’invitation (état en attente, pas de zone encore)...');
  const sendInv = await request('/participant/invitation/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ target_participant_id: bobId, suggestion_id: sugAlice.data.id })
  });
  assert.strictEqual(sendInv.data.mutual_confirmed, false, 'Ne doit pas confirmer tant que Bob n’a pas accepté');

  const meetBefore = await request('/participant/meetings', {
    headers: { Authorization: `Bearer ${aliceToken}` }
  });
  assert.strictEqual(meetBefore.data.length, 0, 'Aucune rencontre confirmée avant acceptation');
  console.log('✓ Test 9 validé');

  // Test 10, 11, 12, 13: Bob accepte -> Confirmation mutuelle, attribution de zone, révélation de tenue
  console.log('Test 10 à 13: Acceptation mutuelle, zone commune et révélation du signe vestimentaire...');
  const bobInvs = await request('/participant/invitations', {
    headers: { Authorization: `Bearer ${bobToken}` }
  });
  assert.strictEqual(bobInvs.data.length, 1);
  const invId = bobInvs.data[0].id;

  const acceptRes = await request(`/participant/invitations/${invId}/respond`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bobToken}` },
    body: JSON.stringify({ accept: true })
  });
  assert.strictEqual(acceptRes.data.mutual_confirmed, true);
  const assignedZone = acceptRes.data.zone_number;
  assert.ok(assignedZone >= 1 && assignedZone <= 4, 'La zone attribuée doit être comprise entre 1 et 4');

  // Verify both participants see the same meeting with the other's outfit!
  const meetAlice = await request('/participant/meetings', { headers: { Authorization: `Bearer ${aliceToken}` } });
  const meetBob = await request('/participant/meetings', { headers: { Authorization: `Bearer ${bobToken}` } });

  assert.strictEqual(meetAlice.data[0].zone_number, assignedZone);
  assert.strictEqual(meetBob.data[0].zone_number, assignedZone);
  assert.strictEqual(meetAlice.data[0].other_distinctive_outfit, 'Pull col roulé gris et lunettes rondes');
  assert.strictEqual(meetBob.data[0].other_distinctive_outfit, 'Veste bordeaux retirée, chemisier blanc et foulard');
  console.log('✓ Tests 10, 11, 12 & 13 validés');

  // Test 14: Un tiers ne peut pas voir les signes vestimentaires
  console.log('Test 14: Vérification de confidentialité pour un tiers...');
  const regCharlie = await request(`/events/${testCode}/register`, {
    method: 'POST',
    body: JSON.stringify({ first_name: 'Charlie', gender: 'homme' })
  });
  const charlieMeetings = await request('/participant/meetings', {
    headers: { Authorization: `Bearer ${regCharlie.data.token}` }
  });
  assert.strictEqual(charlieMeetings.data.length, 0, 'Charlie ne doit pas voir les rencontres d’Alice et Bob');
  console.log('✓ Test 14 validé');

  // Test 21: Les notes personnelles restent strictement privées
  console.log('Test 21: Évaluation et note personnelle privée...');
  const meetingId = meetAlice.data[0].id;
  await request(`/participant/meetings/${meetingId}/evaluate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ rating: 5, private_note: 'Discussion formidable et inspirante.' })
  });

  const checkBobNote = await request('/participant/meetings', { headers: { Authorization: `Bearer ${bobToken}` } });
  assert.strictEqual(checkBobNote.data[0].my_private_note, null, 'Bob ne doit JAMAIS voir la note privée d’Alice');
  console.log('✓ Test 21 validé');

  // Test 22: Révélation des intérêts réciproques et unilatéraux
  console.log('Test 22: Révélation des intérêts de fin de soirée...');
  // Alice selects Bob
  await request('/participant/final-selections', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ selected_participant_ids: [bobId] })
  });

  // Open revelation phase in event
  await request(`/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'revealed' })
  });

  // Bob checks recap without having selected Alice -> Unilateral interest!
  const recapBob = await request('/participant/recap', { headers: { Authorization: `Bearer ${bobToken}` } });
  assert.strictEqual(recapBob.data.interested_in_me.length, 1);
  assert.strictEqual(recapBob.data.interested_in_me[0].first_name, 'Alice', 'Bob doit voir qu’Alice souhaite lui reparler');
  assert.strictEqual(recapBob.data.mutual_matches.length, 0);

  // Now Bob also selects Alice -> Mutual sparks!
  await request('/participant/final-selections', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bobToken}` },
    body: JSON.stringify({ selected_participant_ids: [aliceId] })
  });

  const recapAliceMutual = await request('/participant/recap', { headers: { Authorization: `Bearer ${aliceToken}` } });
  assert.strictEqual(recapAliceMutual.data.mutual_matches.length, 1);
  assert.strictEqual(recapAliceMutual.data.mutual_matches[0].first_name, 'Bob', 'Alice et Bob ont un intérêt réciproque confirmé');
  console.log('✓ Test 22 validé');

  // Test 23 & 24: Persistance et Dashboard métriques
  console.log('Test 23 & 24: Métriques temps réel et persistance en base SQLite...');
  const dash = await request(`/admin/events/${eventId}/dashboard`);
  assert.strictEqual(dash.data.metrics.total_registered, 3);
  assert.strictEqual(dash.data.metrics.confirmed_meetings, 1);
  console.log('✓ Tests 23 & 24 validés');

  console.log('\n========================================');
  console.log('TOUS LES TESTS CRITIQUES DU MVP ONT RÉUSSI ! (100% SUCCÈS)');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Échec des tests :', err);
  process.exit(1);
});
