import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Heart,
  Shirt,
  MessageSquare,
  HelpCircle,
  Award,
  Users,
  Compass,
  CheckCircle,
  Copy,
  LogOut,
  Edit3,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

import { DemoSwitcher } from './components/DemoSwitcher.jsx';
import { PrivacyModal } from './components/PrivacyModal.jsx';
import { QuestionnaireWizard } from './components/QuestionnaireWizard.jsx';
import { ConfirmedMeetingCard } from './components/ConfirmedMeetingCard.jsx';
import { SuggestionCard } from './components/SuggestionCard.jsx';
import { InvitationsList } from './components/InvitationsList.jsx';
import { CuriositiesSection } from './components/CuriositiesSection.jsx';
import { FinalSelectionView } from './components/FinalSelectionView.jsx';
import { PersonalRecapView } from './components/PersonalRecapView.jsx';
import { AdminDashboard } from './components/AdminDashboard.jsx';

export default function App() {
  // Navigation & session state
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('soiree_token') || '');
  const [participant, setParticipant] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [event, setEvent] = useState(null);

  // Demo participants list for top bar
  const [demoParticipants, setDemoParticipants] = useState([]);
  const [isResettingDemo, setIsResettingDemo] = useState(false);

  // Active view for participant
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'curiosities', 'final', 'profile'

  // Modals
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [outfitDraft, setOutfitDraft] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Signup / Join flow
  const [eventCode, setEventCode] = useState('PARIS24');
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState('femme');
  const [loginAccessCode, setLoginAccessCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // Live interaction state
  const [suggestion, setSuggestion] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [curiosities, setCuriosities] = useState({ received: [], sent: [] });

  // Curiosity send modal
  const [isCuriosityModalOpen, setIsCuriosityModalOpen] = useState(false);
  const [curiosityTarget, setCuriosityTarget] = useState(null);

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

  // Fetch participant session & data
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
        if (data.questionnaire?.distinctive_outfit) {
          setOutfitDraft(data.questionnaire.distinctive_outfit);
        }
      } else {
        // Token invalid
        setToken('');
        localStorage.removeItem('soiree_token');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch interactions (suggestions, meetings, invitations, curiosities)
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
    fetchDemoParticipants();
    if (!token) {
      // Default to Camille in demo mode for instant immediate preview
      const defaultDemoToken = 'token-camille-demo';
      setToken(defaultDemoToken);
      localStorage.setItem('soiree_token', defaultDemoToken);
      fetchParticipantMe(defaultDemoToken);
    } else {
      fetchParticipantMe(token);
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
      // "+ Nouveau participant"
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
  };

  // Reset demo
  const handleResetDemo = async () => {
    setIsResettingDemo(true);
    try {
      await fetch('/api/events/demo-soiree-paris/reset-demo', { method: 'POST' });
      await fetchDemoParticipants();
      if (token) fetchParticipantMe(token);
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
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Questionnaire save
  const handleSaveQuestionnaire = async (formData) => {
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
  };

  // Outfit update
  const handleUpdateOutfit = async () => {
    if (!outfitDraft.trim()) return;
    try {
      const res = await fetch('/api/participant/outfit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ distinctive_outfit: outfitDraft })
      });
      if (res.ok) {
        setShowOutfitModal(false);
        fetchParticipantMe(token);
      }
    } catch (e) {
      console.error(e);
    }
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

  const handleDeferSuggestion = async (sugId) => {
    await fetch(`/api/participant/suggestion/${sugId}/defer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchInteractions();
  };

  // Invitation respond
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

  const handleCancelMeeting = async (meetingId) => {
    await fetch(`/api/participant/meetings/${meetingId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchInteractions();
    fetchDemoParticipants();
  };

  const handleSaveEvaluation = async (meetingId, rating, note) => {
    await fetch(`/api/participant/meetings/${meetingId}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ rating, private_note: note })
    });
    fetchInteractions();
  };

  // Curiosity send
  const handleSendCuriosity = async (receiverId, question) => {
    await fetch('/api/participant/curiosities/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ receiver_id: receiverId, question })
    });
    fetchInteractions();
  };

  // Curiosity answer
  const handleAnswerCuriosity = async (curiosityId, response) => {
    await fetch(`/api/participant/curiosities/${curiosityId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ response })
    });
    fetchInteractions();
  };

  return (
    <div>
      {/* 1. TOP DEMO / ROLE SWITCHER */}
      <DemoSwitcher
        demoParticipants={demoParticipants}
        currentParticipant={participant}
        onSelectParticipant={handleSelectDemoParticipant}
        onOpenAdmin={() => setIsAdmin(true)}
        isAdmin={isAdmin}
        onResetDemo={handleResetDemo}
        isResetting={isResettingDemo}
      />

      <div className={`app-container ${isAdmin ? 'admin-mode' : ''}`}>
        {/* =========================================================
            ADMIN INTERFACE
            ========================================================= */}
        {isAdmin ? (
          <AdminDashboard onExitAdmin={() => setIsAdmin(false)} />
        ) : (
          /* =========================================================
             PARTICIPANT INTERFACE
             ========================================================= */
          <div>
            {/* If no participant session -> Welcome & Join screen */}
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
                  Et si une conversation intéressante commençait par la bonne rencontre ?
                  <br /><br />
                  Avant la soirée, quelques questions nous permettent de préparer des suggestions personnalisées. Pendant l'événement, l'Application vous proposera des personnes avec lesquelles vous pourriez avoir des choses intéressantes à partager.
                </p>

                {authError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px' }}>
                    {authError}
                  </div>
                )}

                {!isRegistering ? (
                  <div>
                    <button
                      onClick={() => {
                        setShowPrivacyModal(true);
                      }}
                      className="btn-primary"
                      style={{ width: '100%', marginBottom: '12px' }}
                    >
                      Préparer ma soirée
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
                        Comment souhaites-tu être appelé ?
                      </label>
                      <input
                        type="text"
                        placeholder="Ton prénom d'usage..."
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Ton genre (strictement privé, nécessaire au moteur réciproque) :
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
              /* Questionnaire wizard */
              <div>
                <QuestionnaireWizard
                  participant={participant}
                  initialQuestionnaire={null}
                  onComplete={handleSaveQuestionnaire}
                />
              </div>
            ) : (
              /* Main Participant Experience */
              <div>
                {/* Header status bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Soirée en cours</span>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Bonjour {participant.first_name}</h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setOutfitDraft(questionnaire.distinctive_outfit || '');
                        setShowOutfitModal(true);
                      }}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      title="Modifier mon signe vestimentaire"
                    >
                      <Shirt size={14} color="#38bdf8" />
                      Signe vestimentaire
                    </button>
                  </div>
                </div>

                {/* TAB 1: HOME (MEETINGS, INVITATIONS, SUGGESTIONS) */}
                {activeTab === 'home' && (
                  <div>
                    {/* CONFIRMED MEETINGS FIRST (Urgent priority) */}
                    {meetings.filter(m => m.status === 'confirmed').map(meeting => (
                      <ConfirmedMeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        onComplete={handleCompleteMeeting}
                        onCancel={handleCancelMeeting}
                        onOpenCuriosity={(targetId, name) => {
                          setCuriosityTarget({ id: targetId, first_name: name });
                          setIsCuriosityModalOpen(true);
                        }}
                        onSaveEvaluation={handleSaveEvaluation}
                      />
                    ))}

                    {/* RECEIVED INVITATIONS (Waiting response) */}
                    <InvitationsList
                      invitations={invitations}
                      onRespond={handleRespondInvitation}
                    />

                    {/* CURRENT SUGGESTION */}
                    <SuggestionCard
                      suggestion={suggestion}
                      onSendInvitation={handleSendInvitation}
                      onDeferSuggestion={handleDeferSuggestion}
                    />

                    {/* PAST COMPLETED MEETINGS */}
                    {meetings.filter(m => m.status === 'completed').length > 0 && (
                      <div style={{ marginTop: '24px' }}>
                        <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-dim)', marginBottom: '10px' }}>
                          Rencontres déjà effectuées ({meetings.filter(m => m.status === 'completed').length})
                        </h4>
                        {meetings.filter(m => m.status === 'completed').map(m => (
                          <ConfirmedMeetingCard
                            key={m.id}
                            meeting={m}
                            onComplete={handleCompleteMeeting}
                            onCancel={handleCancelMeeting}
                            onOpenCuriosity={(targetId, name) => {
                              setCuriosityTarget({ id: targetId, first_name: name });
                              setIsCuriosityModalOpen(true);
                            }}
                            onSaveEvaluation={handleSaveEvaluation}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: CURIOSITIES */}
                {activeTab === 'curiosities' && (
                  <CuriositiesSection
                    curiosities={curiosities}
                    onAnswer={handleAnswerCuriosity}
                    isOpenSendModal={isCuriosityModalOpen}
                    sendTarget={curiosityTarget}
                    onCloseSendModal={() => {
                      setIsCuriosityModalOpen(false);
                      setCuriosityTarget(null);
                    }}
                    onSendCuriosity={handleSendCuriosity}
                  />
                )}

                {/* TAB 3: FIN DE SOIREE & RECAP */}
                {activeTab === 'final' && (
                  <div>
                    {event?.status === 'revealed' ? (
                      <PersonalRecapView token={token} />
                    ) : (
                      <FinalSelectionView
                        token={token}
                        onComplete={() => setActiveTab('final')}
                      />
                    )}
                  </div>
                )}

                {/* TAB 4: MON PROFIL & CODE */}
                {activeTab === 'profile' && (
                  <div className="glass-card" style={{ maxWidth: '440px', margin: '0 auto' }}>
                    <div className="badge badge-info" style={{ marginBottom: '8px' }}>
                      Mon Espace Personnel
                    </div>
                    <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>{participant.first_name}</h2>

                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                        Ton code d'accès personnel :
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '20px', letterSpacing: '0.08em', color: '#fb7185' }}>
                          {participant.access_code}
                        </strong>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(participant.access_code);
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          <Copy size={12} /> {copiedCode ? 'Copié !' : 'Copier'}
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
                        Conserve ce code pour retrouver ta session sur un autre smartphone.
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                          Signe vestimentaire pour te repérer :
                        </span>
                        <button
                          onClick={() => {
                            setOutfitDraft(questionnaire.distinctive_outfit || '');
                            setShowOutfitModal(true);
                          }}
                          style={{ background: 'transparent', color: '#38bdf8', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Modifier
                        </button>
                      </div>
                      <div style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--text-main)' }}>
                        « {questionnaire.distinctive_outfit || 'Non renseigné'} »
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setToken('');
                        localStorage.removeItem('soiree_token');
                        setParticipant(null);
                        setQuestionnaire(null);
                      }}
                      className="btn-outline-danger"
                      style={{ width: '100%' }}
                    >
                      <LogOut size={14} /> Déconnexion
                    </button>
                  </div>
                )}

                {/* BOTTOM MOBILE NAVIGATION */}
                <div className="bottom-nav">
                  <button
                    onClick={() => setActiveTab('home')}
                    className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                  >
                    <Compass size={20} />
                    <span>Ce Soir</span>
                    {invitations.length > 0 && <span className="nav-badge-dot" />}
                  </button>

                  <button
                    onClick={() => setActiveTab('curiosities')}
                    className={`nav-item ${activeTab === 'curiosities' ? 'active' : ''}`}
                  >
                    <HelpCircle size={20} />
                    <span>Curiosités</span>
                    {curiosities.received.some(c => c.status === 'sent') && <span className="nav-badge-dot" />}
                  </button>

                  <button
                    onClick={() => setActiveTab('final')}
                    className={`nav-item ${activeTab === 'final' ? 'active' : ''}`}
                  >
                    <Award size={20} />
                    <span>{event?.status === 'revealed' ? 'Récapitulatif' : 'Fin de Soirée'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  >
                    <Shirt size={20} />
                    <span>Mon Profil</span>
                  </button>
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

      {/* UPDATE OUTFIT MODAL */}
      {showOutfitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>Modifier mon signe vestimentaire</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Tu as retiré ta veste ou changé de tenue ? Mets à jour ce détail afin que ton interlocuteur te reconnaisse facilement en zone de rencontre.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Exemple : Je porte une chemise bleue..."
                value={outfitDraft}
                onChange={(e) => setOutfitDraft(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowOutfitModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                Annuler
              </button>
              <button onClick={handleUpdateOutfit} className="btn-primary" style={{ flex: 1.5 }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
