# single_new_society

# Webapp Soirées Célibataires — MVP Pilote

Application web mobile-first conçue pour faciliter les rencontres naturelles et spontanées lors de soirées célibataires, sans imposer de speed dating rigide.

---

## 🌟 Vision & Principes Fondamentaux

- **Pas de rotations imposées ni de rendez-vous chronométrés.**
- **Pas de compatibilité amoureuse affichée en pourcentage ni de classement public.**
- **Repères physiques clairs** : attribution automatique de zones numérotées fixes (1 à 10) dans l'établissement pour se retrouver facilement.
- **Protection stricte de l'intimité** :
  - Le détail vestimentaire distinctif d'une personne n'est révélé qu'**après confirmation mutuelle** de l'envie d'échanger.
  - Les préférences de rencontre (« femmes », « hommes », « les deux ») et les notes personnelles sont **strictement confidentielles**.
  - Zéro donnée superflue : aucun nom de famille, numéro de téléphone, email ou réseau social demandé en V1.

---

## 🏗️ Architecture & Technologies

- **Frontend** : React 18, Vite, Lucide Icons, Design System sur-mesure en Vanilla CSS (Glassmorphism, Dark Mode chic et élégant, typographies *Outfit* et *Plus Jakarta Sans*, navigation mobile-first).
- **Backend & Logique Métier** : Node.js, Express, moteur d'amorces de conversation, algorithme d'attribution équilibrée des zones physiques, gestion anti-saturation des invitations.
- **Base de Données & Persistance** : SQLite natif (`node:sqlite`) stocké dans `./data/soiree.db` (Zéro dépendance native instable, transactions fiables, mode WAL).

---

## 🚀 Démarrage Rapide

### 1. Installation
```bash
npm install
```

### 2. Lancement du serveur et de l'application
```bash
npm start
```
L'application est immédiatement accessible sur : **http://localhost:3001**

### 3. Exécution de la suite de tests automatisés (25 scénarios)
```bash
node test_suite.js
```

---

## 📱 Parcours Fonctionnels Implémentés

### 1. Espace Participant
- **Accueil & Concept** : Présentation discrète et claire du concept.
- **Transparence & Consentement RGPD** : Modal d'explication détaillée avant toute collecte (durée de conservation, utilisation des données, droits).
- **Session Sécurisée** : Attribution d'un jeton de session chiffré et d'un code de récupération individuel (ex: `CAM-88`) sans mot de passe complexe.
- **Questionnaire en 6 étapes rapides** :
  1. *Préférences de rencontre obligatoires* : « Des femmes », « Des hommes », « Les deux » (vérification bidirectionnelle stricte).
  2. *Style d'échange* : Discussion légère, profonde, spontanéité.
  3. *Centres d'intérêt* : Multi-sélection de thèmes et passions.
  4. *Valeurs & attentes relationnelles*.
  5. *Signe vestimentaire distinctif* : « Je porte une chemise bleue... » (modifiable à tout moment pendant la soirée !).
  6. *Validation & Récapitulatif*.
- **Suggestions de Rencontre** : Carte avec prénom et amorce contextuelle naturelle rédigée sur mesure, boutons « J'aimerais rencontrer » ou « Plus tard ».
- **Invitations & Confirmation Mutuelle** :
  - L'invitation est envoyée discrètement.
  - Le destinataire peut accepter ou décliner discrètement.
  - La rencontre ne se confirme que si **les deux participants** ont accepté.
- **Attribution Immédiate de Zone** :
  - Badge géant de Zone numérotée (1 à 10) avec repère physique (ex: *Zone 2 : Salon Verrière*).
  - Révélation sécurisée du signe vestimentaire de l'autre personne.
- **Débrief Privé & Notes Personnelles** : Évaluation à étoiles et bloc-notes secret (jamais partagé).
- **Fonctionnalité « Curiosité »** : Envoi de questions inspirantes pour approfondir l'échange et partage des réponses.
- **Fin de Soirée en 2 temps** :
  1. *Phase de sélection* : Choix secret des personnes avec qui continuer à discuter.
  2. *Phase de révélation* : Affichage des intérêts unilatéraux (« Natalia souhaite te reparler ») et des coups de cœur réciproques.
  3. *Bilan personnel* : Historique des rencontres, notes privées et curiosités.

### 2. Espace Administrateur
- **Tableau de Bord & Métriques Temps Réel** : Inscrits, questionnaires complétés, suggestions actives, invitations en attente, rencontres confirmées et effectuées, curiosités échangées.
- **Configuration des Zones (1 à 10)** : Définition du nombre exact de zones actives pour l'établissement, noms des repères physiques, capacités indicatives et suivi en direct de la charge.
- **Pilotage des Phases** :
  - Inscriptions ouvertes
  - Soirée en cours (suggestions actives / pause)
  - Déclenchement manuel de vague de suggestions
  - Ouverture de la sélection finale
  - Ouverture de la révélation des affinités
- **Paramètres Anti-Saturation** :
  - Maximum 1 suggestion active par participant (configurable).
  - Plafond d'invitations reçues en attente simultanées (configurable, défaut 2).
  - Expiration automatique des invitations non répondues.
- **Liste Administrative des Participants** : Suivi des statuts sans aucune violation d'intimité (pas de lecture des notes privées ni des réponses brutes).
- **Mode Démo Intégré** : 10 participants réalistes pré-remplis avec interactions prêtes à tester, et sélecteur rapide en haut d'écran pour basculer d'un profil à l'autre en un clic.

---

## 🔒 Sécurité & Protection des Données

1. **Cloisonnement strict** : Les signes vestimentaires sont inaccessibles tant qu'une rencontre n'a pas été confirmée par les deux parties.
2. **Confidentialité absolue des notes** : Les évaluations privées ne sont visibles que par leur auteur.
3. **Préférences bilatérales** : Une personne ne peut être proposée que si les deux profils correspondent mutuellement aux préférences de genre déclarées.
4. **Zéro exposition de clés ou d'identifiants sensibles** côté client.
