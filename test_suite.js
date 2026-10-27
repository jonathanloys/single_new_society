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
  console.log('========================================================');
  console.log('--- VALIDATION COMPLÈTE DES 14 SCÉNARIOS OBLIGATOIRES ---');
  console.log('========================================================\n');

  const testCode = 'E' + Math.floor(1000 + Math.random() * 9000);
  const otherEventCode = 'O' + Math.floor(1000 + Math.random() * 9000);

  // Initialisation : Événement Principal (num_zones = 3)
  const createEvt = await request('/events', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Soirée Printemps Étoile',
      date: 'Vendredi 20h00',
      description: 'Événement de test',
      num_zones: 3,
      code: testCode
    })
  });
  console.log('createEvt:', createEvt);
  assert.strictEqual(createEvt.status, 201, 'L’événement principal doit être créé');
  const eventId = createEvt.data.id;

  // Création d’un deuxième événement distinct pour tester l’isolation (Scénario 13)
  const createOtherEvt = await request('/events', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Deuxième Soirée Isolée',
      date: 'Samedi 20h00',
      description: 'Test isolation',
      num_zones: 2,
      code: otherEventCode
    })
  });
  const otherEventId = createOtherEvt.data.id;

  // Inscription de 3 participants dans l'événement principal : Alice, Bob, Claire
  const regAlice = await request(`/events/${testCode}/register`, {
    method: 'POST',
    body: JSON.stringify({ first_name: 'Alice', gender: 'femme' })
  });
  console.log('regAlice:', regAlice);
  const aliceToken = regAlice.data?.token;
  const aliceId = regAlice.data.participant.id;

  const regBob = await request(`/events/${testCode}/register`, {
    method: 'POST',
    body: JSON.stringify({ first_name: 'Bob', gender: 'homme' })
  });
  const bobToken = regBob.data.token;
  const bobId = regBob.data.participant.id;

  const regClaire = await request(`/events/${testCode}/register`, {
    method: 'POST',
    body: JSON.stringify({ first_name: 'Claire', gender: 'femme' })
  });
  const claireToken = regClaire.data.token;
  const claireId = regClaire.data.participant.id;

  // Questionnaires initiaux
  await request('/participant/questionnaire', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({
      target_preference: 'hommes',
      conversation_style: 'Mélange de légèreté et de profondeur',
      interests: ['Voyages et découvertes', 'Gastronomie et sorties'],
      distinctive_outfit: 'Robe rouge et collier perle'
    })
  });

  await request('/participant/questionnaire', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bobToken}` },
    body: JSON.stringify({
      target_preference: 'femmes',
      conversation_style: 'Spontanée et animée',
      interests: ['Voyages et découvertes', 'Culture, cinéma et musique'],
      distinctive_outfit: 'Chemise en lin bleu ciel'
    })
  });

  await request('/participant/questionnaire', {
    method: 'POST',
    headers: { Authorization: `Bearer ${claireToken}` },
    body: JSON.stringify({
      target_preference: 'femmes',
      conversation_style: 'Calme et posée',
      interests: ['Culture, cinéma et musique'],
      distinctive_outfit: 'Veste noire satinée'
    })
  });

  // SCÉNARIO 1 : Un participant peut consulter et modifier son questionnaire initial
  console.log('Scénario 1: Consultation du profil et pré-remplissage...');
  const meBefore = await request('/participant/me', { headers: { Authorization: `Bearer ${aliceToken}` } });
  assert.strictEqual(meBefore.ok, true);
  assert.strictEqual(meBefore.data.participant.first_name, 'Alice');
  assert.strictEqual(meBefore.data.questionnaire.target_preference, 'hommes');
  assert.strictEqual(meBefore.data.questionnaire.distinctive_outfit, 'Robe rouge et collier perle');
  console.log('✓ Scénario 1 validé');

  // SCÉNARIO 2 : Les modifications sont sauvegardées dans la base de données et persistent après actualisation
  console.log('Scénario 2: Sauvegarde des modifications du profil et persistance...');
  const updateRes = await request('/participant/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({
      first_name: 'Alice-Marie',
      target_preference: 'hommes',
      conversation_style: 'Conversations passionnées',
      interests: ['Culture, cinéma et musique', 'Gastronomie et sorties'],
      distinctive_outfit: 'Robe verte émeraude'
    })
  });
  assert.strictEqual(updateRes.ok, true, 'PUT /participant/profile doit réussir');

  const meAfter = await request('/participant/me', { headers: { Authorization: `Bearer ${aliceToken}` } });
  assert.strictEqual(meAfter.data.participant.first_name, 'Alice-Marie');
  assert.strictEqual(meAfter.data.questionnaire.conversation_style, 'Conversations passionnées');
  assert.strictEqual(meAfter.data.questionnaire.distinctive_outfit, 'Robe verte émeraude');
  assert.deepStrictEqual(meAfter.data.questionnaire.interests, ['Culture, cinéma et musique', 'Gastronomie et sorties']);
  console.log('✓ Scénario 2 validé');

  // SCÉNARIO 3 : Les préférences modifiées sont prises en compte dans les nouvelles suggestions
  console.log('Scénario 3: Prise en compte immédiate des préférences modifiées par le moteur...');
  // Actuellement, Alice cherche des 'hommes' -> Elle doit recevoir Bob (homme cherchant femmes)
  const sugBob = await request('/participant/suggestion', { headers: { Authorization: `Bearer ${aliceToken}` } });
  assert.strictEqual(sugBob.ok, true);
  assert.strictEqual(sugBob.data.target_participant_id, bobId, 'Alice doit recevoir Bob comme suggestion');

  // Alice change d'avis et modifie ses préférences vers 'femmes'
  await request('/participant/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({
      target_preference: 'femmes',
      first_name: 'Alice-Marie',
      distinctive_outfit: 'Robe verte émeraude'
    })
  });

  // Dès la prochaine suggestion, Bob ne doit plus lui être proposé ; Claire (femme cherchant femmes) est compatible !
  const sugClaire = await request('/participant/suggestion', { headers: { Authorization: `Bearer ${aliceToken}` } });
  assert.strictEqual(sugClaire.ok, true);
  assert.strictEqual(sugClaire.data.target_participant_id, claireId, 'Le moteur propose désormais Claire et non plus Bob');
  console.log('✓ Scénario 3 validé');

  // Rétablissons les préférences pour les scénarios de rencontre Alice <-> Bob
  await request('/participant/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({
      target_preference: 'hommes',
      first_name: 'Alice',
      distinctive_outfit: 'Gilet beige et foulard bleu'
    })
  });

  // SCÉNARIO 4 : Le signe vestimentaire peut être modifié et reste privé avant confirmation d’une rencontre
  console.log('Scénario 4: Confidentialité du signe vestimentaire avant confirmation...');
  const sugForBob = await request('/participant/suggestion', { headers: { Authorization: `Bearer ${bobToken}` } });
  assert.strictEqual(sugForBob.ok, true);
  assert.strictEqual(sugForBob.data.target_participant_id, aliceId);
  assert.strictEqual(sugForBob.data.distinctive_outfit, undefined, 'Le signe vestimentaire ne doit JAMAIS apparaître dans la suggestion');
  console.log('✓ Scénario 4 validé');

  // SCÉNARIO 5 : Une invitation envoyée ne devient pas automatiquement une rencontre confirmée
  console.log('Scénario 5: Envoi d’une invitation -> en attente, pas de confirmation immédiate...');
  const sendInv = await request('/participant/invitation/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bobToken}` },
    body: JSON.stringify({ target_participant_id: aliceId, suggestion_id: sugForBob.data.id })
  });
  assert.strictEqual(sendInv.ok, true);
  assert.strictEqual(sendInv.data.mutual_confirmed, false, 'Non confirmée unilatéralement');

  const meetAliceBefore = await request('/participant/meetings', { headers: { Authorization: `Bearer ${aliceToken}` } });
  assert.strictEqual(meetAliceBefore.data.length, 0, 'Aucune rencontre confirmée pour Alice');
  console.log('✓ Scénario 5 validé');

  // SCÉNARIO 6 & 7 : Rencontre confirmée après acceptation mutuelle + même numéro de zone et infos appropriées
  console.log('Scénarios 6 & 7: Acceptation mutuelle, confirmation et zone commune (1..3)...');
  const aliceInvites = await request('/participant/invitations', { headers: { Authorization: `Bearer ${aliceToken}` } });
  assert.strictEqual(aliceInvites.data.length, 1);
  const invId = aliceInvites.data[0].id;

  const acceptRes = await request(`/participant/invitations/${invId}/respond`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ accept: true })
  });
  assert.strictEqual(acceptRes.ok, true);
  assert.strictEqual(acceptRes.data.mutual_confirmed, true);
  const assignedZone = acceptRes.data.zone_number;
  assert.ok(assignedZone >= 1 && assignedZone <= 3, 'Zone attribuée doit être entre 1 et 3');

  // Vérification de la cohérence stricte des données pour les deux participants
  const aliceMeetings = await request('/participant/meetings', { headers: { Authorization: `Bearer ${aliceToken}` } });
  const bobMeetings = await request('/participant/meetings', { headers: { Authorization: `Bearer ${bobToken}` } });

  assert.strictEqual(aliceMeetings.data.length, 1);
  assert.strictEqual(bobMeetings.data.length, 1);
  assert.strictEqual(aliceMeetings.data[0].zone_number, assignedZone, 'Même numéro de zone pour Alice');
  assert.strictEqual(bobMeetings.data[0].zone_number, assignedZone, 'Même numéro de zone pour Bob');
  assert.strictEqual(aliceMeetings.data[0].other_distinctive_outfit, 'Chemise en lin bleu ciel', 'Alice voit la tenue de Bob');
  assert.strictEqual(bobMeetings.data[0].other_distinctive_outfit, 'Gilet beige et foulard bleu', 'Bob voit la tenue d’Alice');
  console.log('✓ Scénarios 6 & 7 validés');

  // SCÉNARIO 8 : La rubrique « Fin de soirée » affiche uniquement son message d’attente avant la clôture
  console.log('Scénario 8: Rubrique Fin de soirée affiche message d’attente avant clôture...');
  const recapAliceBeforeClose = await request('/participant/recap', { headers: { Authorization: `Bearer ${aliceToken}` } });
  assert.strictEqual(recapAliceBeforeClose.ok, true);
  assert.strictEqual(recapAliceBeforeClose.data.is_closed, false);
  assert.strictEqual(recapAliceBeforeClose.data.title, 'Ton bilan de soirée sera bientôt disponible');
  assert.strictEqual(recapAliceBeforeClose.data.text, 'Tu retrouveras ici les personnes qui souhaitent poursuivre les échanges avec toi et le bilan de tes rencontres lorsque l’organisateur aura clôturé la soirée.');
  assert.strictEqual(recapAliceBeforeClose.data.meetings, undefined, 'Aucune rencontre ne doit être révélée dans le bilan avant clôture');
  assert.strictEqual(recapAliceBeforeClose.data.mutual_matches, undefined, 'Aucun match réciproque divulgué');
  console.log('✓ Scénario 8 validé');

  // SCÉNARIO 9 : Le dépassement de l’heure prévue ne révèle pas automatiquement le bilan
  console.log('Scénario 9: Dépassement temporel sans clôture explicite -> bilan toujours protégé...');
  // Mettons à jour la date/heure de l'événement dans le passé
  await request(`/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify({ date: 'Hier 20h00 (Terminé en apparence)' })
  });
  const recapTimeExceeded = await request('/participant/recap', { headers: { Authorization: `Bearer ${aliceToken}` } });
  assert.strictEqual(recapTimeExceeded.data.is_closed, false, 'Le bilan reste verrouillé même si l’heure est dépassée');
  assert.strictEqual(recapTimeExceeded.data.title, 'Ton bilan de soirée sera bientôt disponible');
  console.log('✓ Scénario 9 validé');

  // SCÉNARIO 12 : Avant clôture, les résultats restent protégés même en accédant directement aux API
  console.log('Scénario 12: Protection stricte de l’API recap avant clôture...');
  assert.strictEqual(recapTimeExceeded.data.interested_in_me, undefined);
  assert.strictEqual(recapTimeExceeded.data.mutual_matches, undefined);
  console.log('✓ Scénario 12 validé');

  // Alice et Bob manifestent réciproquement leur souhait de garder contact (en toute discrétion)
  await request('/participant/final-selections/toggle', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ target_participant_id: bobId })
  });

  await request('/participant/final-selections/toggle', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bobToken}` },
    body: JSON.stringify({ target_participant_id: aliceId })
  });

  // SCÉNARIO 10 : L’administrateur peut clôturer explicitement un événement
  console.log('Scénario 10: Clôture explicite par l’administrateur...');
  const closeRes = await request(`/events/${eventId}/close`, { method: 'POST' });
  assert.strictEqual(closeRes.ok, true);
  assert.strictEqual(closeRes.data.event.status, 'revealed');
  console.log('✓ Scénario 10 validé');

  // SCÉNARIO 11 : Après clôture, les participants concernés peuvent consulter leur bilan réel
  console.log('Scénario 11: Consultation du bilan réel après clôture explicite...');
  const recapAliceAfterClose = await request('/participant/recap', { headers: { Authorization: `Bearer ${aliceToken}` } });
  assert.strictEqual(recapAliceAfterClose.data.is_closed, true);
  assert.strictEqual(recapAliceAfterClose.data.mutual_matches.length, 1);
  assert.strictEqual(recapAliceAfterClose.data.mutual_matches[0].first_name, 'Bob');
  assert.strictEqual(recapAliceAfterClose.data.meetings.length, 1);
  console.log('✓ Scénario 11 validé');

  // SCÉNARIO 13 : La clôture d’un événement n’affecte pas les autres événements
  console.log('Scénario 13: Isolation stricte entre événements...');
  const otherEvtStatus = await request(`/events/${otherEventId}`);
  assert.strictEqual(otherEvtStatus.data.status, 'open_registration', 'L’autre événement ne doit pas être clôturé');

  // Inscrivons un participant dans l'autre événement et vérifions son bilan
  const regOther = await request(`/events/${otherEventCode}/register`, {
    method: 'POST',
    body: JSON.stringify({ first_name: 'David', gender: 'homme' })
  });
  const recapDavid = await request('/participant/recap', { headers: { Authorization: `Bearer ${regOther.data.token}` } });
  assert.strictEqual(recapDavid.data.is_closed, false, 'Le bilan de David dans l’autre soirée reste verrouillé');
  console.log('✓ Scénario 13 validé');

  console.log('\n========================================================');
  console.log('TOUS LES SCÉNARIOS BACKEND & MÉTIER (1 à 13) SONT 100% VALIDÉS !');
  console.log('========================================================\n');
}

runTests().catch(err => {
  console.error('ERREUR LORS DES TESTS :', err);
  process.exit(1);
});
