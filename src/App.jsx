import React, { useState, useEffect } from 'react';
import {
  User,
  Sparkles,
  MapPin,
  Award,
  Heart,
  Shirt,
  MessageSquare,
  Clock,
  Shield,
  HelpCircle,
  X,
  Send,
  CheckCircle2
} from 'lucide-react';

import { DemoSwitcher } from './components/DemoSwitcher.jsx';
import { PrivacyModal } from './components/PrivacyModal.jsx';
import { QuestionnaireWizard } from './components/QuestionnaireWizard.jsx';
import { ProfileView } from './components/ProfileView.jsx';
import { DiscoverView } from './components/DiscoverView.jsx';
import { MeetingsView } from './components/MeetingsView.jsx';
import { EndOfEveningView } from './components/EndOfEveningView.jsx';
import { AdminDashboard } from './components/AdminDashboard.jsx';

// 4 rubriques obligatoires dans l'ordre strict
const NAVIGATION_TABS = [
  { id: 'profile', label: 'Mon profil', icon: User },
  { id: 'discover', label: 'Découvrir une personne', icon: Sparkles },
  { id: 'meetings', label: 'Mes rencontres', icon: MapPin },
  { id: 'final', label: 'Fin de soirée', icon: Award }
];

export const PRESET_CURIOSITIES = [
  "Quel talent aimerais-tu posséder instantanément ?",
  "Quelle petite chose peut immédiatement te mettre de bonne humeur ?",
  "Si tu pouvais revivre une journée de ta vie, laquelle choisirais-tu ?",
  "Quel est le voyage qui t'a le plus transformé(e) jusqu'ici ?",
  "Quelle est la discussion la plus mémorable que tu aies eue récemment ?",
  "Qu'est-ce qui te passionne tellement que tu pourrais en parler des heures ?"
];

export default function App() {
  // Navigation & session state
  const IS_PRODUCTION = import.meta.env.PROD;
const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('soiree_token') || '');
  const [participant, setParticipant] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [event, setEvent] = useState(null);

  // 4 rubriques obligatoires (défaut sur Découvrir une personne une fois connecté)
  const [activeTab, setActiveTab] = useState('discover');

  // Demo participants list for top bar
  const [demoParticipants, setDemoParticipants] = useState([]);
  const [isResettingDemo, setIsResettingDemo] = useState(false);

  // Modals & onboarding
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [eventCode, setEventCode] = useState('PARIS24');
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState('femme');
  const [loginAccessCode, setLoginAccessCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // Live interactions data
  const [suggestion, setSuggestion] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [curiosities, setCuriosities] = useState({ received: [], sent: [] });

  // Modal Curiosité
  const [curiosityTarget, setCuriosityTarget] = useState(null);
  const [selectedCuriosityQuestion, setSelectedCuriosityQuestion] = useState(PRESET_CURIOSITIES[0]);
  const [customCuriosityQuestion, setCustomCuriosityQuestion] = useState('');
  const [isSendingCuriosity, setIsSendingCuriosity] = useState(false);

  // Load demo participants
  const fetchDemoParticipants = async () => {
    try {
      const res = await fetch('/api/demo/participants');
      if (res.ok) {
        const data = await res.json();
        setDemoParticipants(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch participant session & profile
  const fetchParticipantMe = async (authToken) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/participant/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setParticipant(data.participant);
        setQuestionnaire(data.questionnaire);
        setEvent(data.event);
      } else {
        setToken('');
        localStorage.removeItem('soiree_token');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch interactions (suggestions, invitations, meetings, curiosities)
  const fetchInteractions = async () => {
    if (!token || !questionnaire) return;
    try {
      const [sugRes, invRes, meetRes, curRes] = await Promise.all([
        fetch('/api/participant/suggestion', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/participant/invitations', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/participant/meetings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/participant/curiosities', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (sugRes.ok) setSuggestion(await sugRes.json());
      if (invRes.ok) setInvitations(await invRes.json());
      if (meetRes.ok) setMeetings(await meetRes.json());
      if (curRes.ok) setCuriosities(await curRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!IS_PRODUCTION) {
      fetchDemoParticipants();
      if (!token) {
        // Default demo login only in dev
        const defaultDemoToken = 'token-camille-demo';
        setToken(defaultDemoToken);
        localStorage.setItem('soiree_token', defaultDemoToken);
        fetchParticipantMe(defaultDemoToken);
      } else {
        fetchParticipantMe(token);
      }
    } else {
      // Production: if token exists, fetch participant, otherwise stay unauthenticated
      if (token) {
        fetchParticipantMe(token);
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchParticipantMe(token);
      fetchInteractions();
      const interval = setInterval(fetchInteractions, 4000);
      return () => clearInterval(interval);
    }
  }, [token, questionnaire?.id]);

  // Handle participant switch from demo bar
  const handleSelectDemoParticipant = (demoP) => {
    setIsAdmin(false);
    if (!demoP) {
      setToken('');
      setParticipant(null);
      setQuestionnaire(null);
      localStorage.removeItem('soiree_token');
      setIsRegistering(true);
      return;
    }
    setToken(demoP.session_token);
    localStorage.setItem('soiree_token', demoP.session_token);
    fetchParticipantMe(demoP.session_token);
    setActiveTab('discover');
  };

  // Reset demo
  const handleResetDemo = async () => {
    setIsResettingDemo(true);
    try {
      await fetch('/api/events/demo-soiree-paris/reset-demo', { method: 'POST' });
      await fetchDemoParticipants();
      if (token) fetchParticipantMe(token);
      await fetchInteractions();
    } catch (e) {
      console.error(e);
    } finally {
      setIsResettingDemo(false);
    }
  };

  // Register new participant
  const handleRegister = async () => {
    setAuthError('');
    try {
      const res = await fetch(`/api/events/${eventCode}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, gender })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToken(data.token);
      localStorage.setItem('soiree_token', data.token);
      setParticipant(data.participant);
      setIsRegistering(false);
      setShowPrivacyModal(true);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Login with access code
  const handleLoginCode = async () => {
    setAuthError('');
    try {
      const res = await fetch(`/api/events/${eventCode}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: loginAccessCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToken(data.token);
      localStorage.setItem('soiree_token', data.token);
      fetchParticipantMe(data.token);
      setActiveTab('discover');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Initial questionnaire wizard completion
  const handleCompleteInitialWizard = async (formData) => {
    const res = await fetch('/api/participant/questionnaire', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);

    await fetchParticipantMe(token);
    await fetchInteractions();
    await fetchDemoParticipants();
    setActiveTab('discover');
  };

  // Update profile from Rubrique 1: Mon profil
  const handleUpdateProfile = async (profileData) => {
    const res = await fetch('/api/participant/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);

    await fetchParticipantMe(token);
    await fetchInteractions();
    await fetchDemoParticipants();
  };

  // Suggestion actions
  const handleSendInvitation = async (targetId, sugId) => {
    const res = await fetch('/api/participant/invitation/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ target_participant_id: targetId, suggestion_id: sugId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchInteractions();
    fetchDemoParticipants();
    return data;
  };

  const handlePassSuggestion = async (sugId) => {
    await fetch(`/api/participant/suggestion/${sugId}/defer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchInteractions();
  };

  // Respond invitation
  const handleRespondInvitation = async (invId, accept) => {
    await fetch(`/api/participant/invitations/${invId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ accept })
    });
    fetchInteractions();
    fetchDemoParticipants();
  };

  // Meeting actions
  const handleCompleteMeeting = async (meetingId) => {
    await fetch(`/api/participant/meetings/${meetingId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchInteractions();
    fetchDemoParticipants();
  };

  const handleSaveEvaluation = async (meetingId, ratingVal, noteVal) => {
    await fetch(`/api/participant/meetings/${meetingId}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ rating: ratingVal, private_note: noteVal })
    });
    fetchInteractions();
  };

  const handleToggleKeepInTouch = async (targetId) => {
    await fetch('/api/participant/final-selections/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ target_participant_id: targetId })
    });
    fetchInteractions();
  };

  // Curiosity send & answer
  const handleSendCuriosity = async () => {
    if (!curiosityTarget) return;
    const questionText = customCuriosityQuestion.trim() || selectedCuriosityQuestion;
    setIsSendingCuriosity(true);
    try {
      await fetch('/api/participant/curiosities/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiver_id: curiosityTarget.id, question: questionText })
      });
      setCuriosityTarget(null);
      setCustomCuriosityQuestion('');
      fetchInteractions();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingCuriosity(false);
    }
  };

  const handleAnswerCuriosity = async (curiosityId, responseText) => {
    await fetch(`/api/participant/curiosities/${curiosityId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ response: responseText })
    });
    fetchInteractions();
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('soiree_token');
    setParticipant(null);
    setQuestionnaire(null);
    setActiveTab('discover');
  };

  const confirmedCount = meetings.filter(m => m.status === 'confirmed').length;

  return (
    <div>
      {/* 1. TOP BAR : DEMO SWITCHER & ACCÈS ADMIN */}
      {!IS_PRODUCTION && (
        <DemoSwitcher
          demoParticipants={demoParticipants}
          currentParticipant={participant}
          onSelectParticipant={handleSelectDemoParticipant}
          onOpenAdmin={() => setIsAdmin(true)}
          isAdmin={isAdmin}
          onResetDemo={handleResetDemo}
          isResetting={isResettingDemo}
          isProduction={IS_PRODUCTION}
        />
      )}

      <div className={`app-container ${isAdmin ? 'admin-mode' : ''}`}>
        {/* =========================================================
            ESPACE ADMINISTRATEUR
            ========================================================= */}
        {isAdmin ? (
          <AdminDashboard onExitAdmin={() => setIsAdmin(false)} />
        ) : (
          /* =========================================================
             ESPACE PARTICIPANT (4 RUBRIQUES STRICTES)
             ========================================================= */
          <div>
            {/* Si non connecté -> Écran d'accueil et connexion / inscription */}
            {!token || !participant ? (
              <div className="glass-card" style={{ maxWidth: '440px', margin: '40px auto 0 auto', textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  boxShadow: 'var(--shadow-glow)',
                  color: 'white'
                }}>
                  <Sparkles size={32} />
                </div>

                <h1 style={{ fontSize: '26px', marginBottom: '12px' }}>
                  Rencontres Soirée
                </h1>

                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                  Une application sobre et discrète pour faire de vraies rencontres pendant la soirée.
                  <br /><br />
                  Répondez à quelques questions à votre arrivée, l'Application vous proposera des personnes avec lesquelles partager une conversation spontanée.
                </p>

                {authError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px' }}>
                    {authError}
                  </div>
                )}

                {!isRegistering ? (
                  <div>
                    <button
                      onClick={() => setShowPrivacyModal(true)}
                      className="btn-primary"
                      style={{ width: '100%', marginBottom: '16px' }}
                    >
                      Rejoindre la soirée
                    </button>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '8px' }}>
                        Déjà inscrit ? Retrouver ma session
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Code d'accès (ex: CAM-88)"
                          value={loginAccessCode}
                          onChange={(e) => setLoginAccessCode(e.target.value)}
                          style={{ fontSize: '13px' }}
                        />
                        <button onClick={handleLoginCode} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                          Connexion
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: '18px', marginBottom: '16px', textAlign: 'left' }}>Rejoindre la soirée</h3>
                    <div style={{ textAlign: 'left', marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Code Soirée
                      </label>
                      <input
                        type="text"
                        value={eventCode}
                        onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                      />
                    </div>

                    <div style={{ textAlign: 'left', marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Ton prénom d'usage
                      </label>
                      <input
                        type="text"
                        placeholder="Ton prénom..."
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Genre (strictement confidentiel, pour le respect des préférences mutuelles) :
                      </label>
                      <select value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="femme">Femme</option>
                        <option value="homme">Homme</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setIsRegistering(false)} className="btn-secondary" style={{ flex: 1 }}>
                        Retour
                      </button>
                      <button onClick={handleRegister} className="btn-primary" style={{ flex: 2 }}>
                        Continuer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : !questionnaire ? (
              /* Questionnaire initial lors de l'arrivée */
              <div>
                <QuestionnaireWizard
                  participant={participant}
                  initialQuestionnaire={null}
                  onComplete={handleCompleteInitialWizard}
                />
              </div>
            ) : (
              /* =========================================================
                 EXPÉRIENCE PRINCIPALE AVEC LES 4 RUBRIQUES
                 ========================================================= */
              <div>
                {/* Navigation supérieure Desktop & Mobile (Ordre strict des 4 rubriques) */}
                <div className="desktop-nav-tabs" style={{ display: 'flex', marginBottom: '20px' }}>
                  {NAVIGATION_TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const hasDot =
                      (tab.id === 'discover' && invitations.length > 0) ||
                      (tab.id === 'meetings' && confirmedCount > 0);

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`desktop-tab-btn ${isActive ? 'active' : ''}`}
                      >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                        {hasDot && !isActive && <span className="nav-badge-dot" style={{ top: '8px', right: '10px' }} />}
                      </button>
                    );
                  })}
                </div>

                {/* CONTENU DES 4 RUBRIQUES */}

                {/* 1. MON PROFIL */}
                {activeTab === 'profile' && (
                  <ProfileView
                    participant={participant}
                    questionnaire={questionnaire}
                    onUpdateProfile={handleUpdateProfile}
                    onLogout={handleLogout}
                  />
                )}

                {/* 2. DÉCOUVRIR UNE PERSONNE */}
                {activeTab === 'discover' && (
                  <DiscoverView
                    suggestion={suggestion}
                    invitations={invitations}
                    onSendInvitation={handleSendInvitation}
                    onPassSuggestion={handlePassSuggestion}
                    onRespondInvitation={handleRespondInvitation}
                    onRefresh={fetchInteractions}
                    onNavigateToMeetings={() => setActiveTab('meetings')}
                  />
                )}

                {/* 3. MES RENCONTRES */}
                {activeTab === 'meetings' && (
                  <MeetingsView
                    meetings={meetings}
                    curiosities={curiosities}
                    onCompleteMeeting={handleCompleteMeeting}
                    onSaveEvaluation={handleSaveEvaluation}
                    onToggleKeepInTouch={handleToggleKeepInTouch}
                    onOpenCuriosityModal={(targetId, name) => setCuriosityTarget({ id: targetId, first_name: name })}
                    onAnswerCuriosity={handleAnswerCuriosity}
                  />
                )}

                {/* 4. FIN DE SOIRÉE */}
                {activeTab === 'final' && (
                  <EndOfEveningView
                    token={token}
                    eventStatus={event?.status}
                  />
                )}

                {/* NAVIGATION INFÉRIEURE MOBILE (Les 4 mêmes rubriques dans le même ordre) */}
                <div className="bottom-nav">
                  {NAVIGATION_TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const hasDot =
                      (tab.id === 'discover' && invitations.length > 0) ||
                      (tab.id === 'meetings' && confirmedCount > 0);

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                      >
                        <Icon size={19} />
                        <span>{tab.label}</span>
                        {hasDot && <span className="nav-badge-dot" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRIVACY CONSENT MODAL */}
      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onAccept={() => {
          setShowPrivacyModal(false);
          setIsRegistering(true);
        }}
      />

      {/* MODAL CURIOSITÉ */}
      {curiosityTarget && (
        <div className="modal-overlay" style={{ zIndex: 350 }}>
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                Poser une Curiosité à {curiosityTarget.first_name}
              </h3>
              <button
                type="button"
                onClick={() => setCuriosityTarget(null)}
                style={{ background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
              Une question inspirante pour nourrir votre conversation et découvrir une facette inattendue de sa personnalité.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Choisis une question :
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PRESET_CURIOSITIES.map((q) => (
                  <div
                    key={q}
                    className={`choice-card ${selectedCuriosityQuestion === q && !customCuriosityQuestion ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedCuriosityQuestion(q);
                      setCustomCuriosityQuestion('');
                    }}
                    style={{ padding: '10px 12px' }}
                  >
                    <span style={{ fontSize: '13px' }}>« {q} »</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Ou rédige ta propre question :
              </label>
              <input
                type="text"
                placeholder="Ex: Quel est le meilleur concert auquel tu aies assisté ?"
                value={customCuriosityQuestion}
                onChange={(e) => setCustomCuriosityQuestion(e.target.value)}
                maxLength={100}
                style={{ fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCuriosityTarget(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSendCuriosity}
                disabled={isSendingCuriosity}
                className="btn-primary"
                style={{ flex: 1.5 }}
              >
                <Send size={14} /> {isSendingCuriosity ? 'Envoi...' : 'Envoyer la question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
