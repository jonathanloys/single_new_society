import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  MapPin,
  Play,
  Calendar,
  Shield,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Activity,
  Heart,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export function AdminDashboard({ onExitAdmin }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Events list & current selected event
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Tab-specific data
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const [zones, setZones] = useState([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);

  const [participants, setParticipants] = useState([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  // Engine wave action state
  const [waveStatus, setWaveStatus] = useState('');
  const [isTriggeringWave, setIsTriggeringWave] = useState(false);

  // New Event Form State
  const defaultDateTime = () => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [newEvent, setNewEvent] = useState({
    name: '',
    date: defaultDateTime(),
    code: '',
    num_zones: 4,
    description: ''
  });
  const [eventCreationStatus, setEventCreationStatus] = useState(null); // { type: 'success' | 'error', message: '' }
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // 1. Fetch all events
  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Impossible de charger les événements');
      const data = await res.json();
      setEvents(data);
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // 2. Fetch dashboard data for selected event
  const loadDashboardData = async (eventId) => {
    if (!eventId) return;
    setIsLoadingDashboard(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else {
        setDashboardData(null);
      }
    } catch (err) {
      console.error(err);
      setDashboardData(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // 3. Fetch zones for selected event
  const loadZones = async (eventId) => {
    if (!eventId) return;
    setIsLoadingZones(true);
    try {
      const res = await fetch(`/api/events/${eventId}/zones`);
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      } else {
        setZones([]);
      }
    } catch (err) {
      console.error(err);
      setZones([]);
    } finally {
      setIsLoadingZones(false);
    }
  };

  // 4. Fetch participants for selected event
  const loadParticipants = async (eventId) => {
    if (!eventId) return;
    setIsLoadingParticipants(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/participants`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(data);
      } else {
        setParticipants([]);
      }
    } catch (err) {
      console.error(err);
      setParticipants([]);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  // Toggle zone active status
  const toggleZone = async (zoneNumber, currentStatus) => {
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/api/events/${selectedEventId}/zones/${zoneNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: currentStatus ? 0 : 1 })
      });
      if (res.ok) {
        loadZones(selectedEventId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger matching engine wave
  const handleTriggerWave = async () => {
    if (!selectedEventId) return;
    setIsTriggeringWave(true);
    setWaveStatus('');
    try {
      const res = await fetch(`/api/events/${selectedEventId}/trigger-wave`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setWaveStatus(`Vague déclenchée avec succès : ${data.suggestions_created || 0} suggestion(s) générée(s).`);
        loadDashboardData(selectedEventId);
      } else {
        setWaveStatus(`Erreur : ${data.error || 'Échec du déclenchement'}`);
      }
    } catch (err) {
      setWaveStatus(`Erreur réseau : ${err.message}`);
    } finally {
      setIsTriggeringWave(false);
    }
  };

  // Create new event
  const handleCreateEvent = async (e) => {
    if (e) e.preventDefault();
    setEventCreationStatus(null);

    if (!newEvent.name.trim()) {
      setEventCreationStatus({ type: 'error', message: 'Veuillez saisir un nom pour l’événement.' });
      return;
    }
    if (!newEvent.date) {
      setEventCreationStatus({ type: 'error', message: 'Veuillez renseigner une date et une heure.' });
      return;
    }

    setIsSubmittingEvent(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEvent.name.trim(),
          date: newEvent.date,
          code: newEvent.code.trim().toUpperCase() || undefined,
          num_zones: parseInt(newEvent.num_zones, 10) || 4,
          description: newEvent.description.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEventCreationStatus({
          type: 'success',
          message: `Événement « ${data.name} » créé avec succès ! Code d'accès : ${data.code}`
        });
        setNewEvent({
          name: '',
          date: defaultDateTime(),
          code: '',
          num_zones: 4,
          description: ''
        });
        await loadEvents();
        setSelectedEventId(data.id);
      } else {
        setEventCreationStatus({
          type: 'error',
          message: data.error || 'Erreur lors de la création de l’événement.'
        });
      }
    } catch (err) {
      setEventCreationStatus({
        type: 'error',
        message: `Erreur de connexion : ${err.message}`
      });
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadEvents();
  }, []);

  // When selected event or active tab changes, reload the relevant data
  useEffect(() => {
    if (!selectedEventId) return;

    if (activeTab === 'overview') {
      loadDashboardData(selectedEventId);
    } else if (activeTab === 'zones') {
      loadZones(selectedEventId);
    } else if (activeTab === 'participants') {
      loadParticipants(selectedEventId);
    } else if (activeTab === 'engine') {
      loadDashboardData(selectedEventId);
    }
  }, [selectedEventId, activeTab]);

  const navTabs = [
    { id: 'overview', label: 'Aperçu', icon: BarChart3 },
    { id: 'zones', label: 'Zones', icon: MapPin },
    { id: 'engine', label: 'Moteur', icon: Play },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'events', label: 'Événements', icon: Calendar }
  ];

  const currentEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
      {/* Top Header */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          borderLeft: '4px solid var(--color-primary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Espace Administrateur
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Supervision de la soirée, gestion des zones et configuration des événements
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {events.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Soirée :</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onExitAdmin}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
          >
            Quitter Admin
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="desktop-nav-tabs" style={{ marginBottom: '20px' }}>
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`desktop-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          1. SECTION APERÇU (OVERVIEW)
          ======================================================== */}
      {activeTab === 'overview' && (
        <div>
          {isLoadingDashboard ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw className="spin" size={24} style={{ margin: '0 auto 10px auto' }} />
              Chargement des indicateurs...
            </div>
          ) : !dashboardData ? (
            <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Aucune donnée disponible pour cet événement.</p>
              <button onClick={() => loadDashboardData(selectedEventId)} className="btn-secondary" style={{ marginTop: '12px' }}>
                <RefreshCw size={14} style={{ marginRight: '6px' }} /> Actualiser
              </button>
            </div>
          ) : (
            <div>
              {/* Event Quick Info Banner */}
              <div
                className="glass-card"
                style={{
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {dashboardData.event?.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Code d'accès : <strong style={{ color: 'var(--color-primary)' }}>{dashboardData.event?.code}</strong> · Statut : {dashboardData.event?.status}
                  </p>
                </div>
                <button
                  onClick={() => loadDashboardData(selectedEventId)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <RefreshCw size={12} style={{ marginRight: '6px' }} /> Actualiser
                </button>
              </div>

              {/* KPI Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                  marginBottom: '20px'
                }}
              >
                <div className="glass-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                    <span style={{ fontSize: '12px' }}>Inscrits</span>
                    <Users size={16} />
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
                    {dashboardData.metrics?.total_registered || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {dashboardData.metrics?.completed_questionnaires || 0} questionnaires remplis
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                    <span style={{ fontSize: '12px' }}>Suggestions</span>
                    <Sparkles size={16} />
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
                    {dashboardData.metrics?.suggestions_count || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Générées par le moteur
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                    <span style={{ fontSize: '12px' }}>Invitations envoyées</span>
                    <Heart size={16} />
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
                    {dashboardData.metrics?.accepted_invitations || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {dashboardData.metrics?.pending_invitations || 0} en attente
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                    <span style={{ fontSize: '12px' }}>Rencontres confirmées</span>
                    <MapPin size={16} />
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#10b981' }}>
                    {dashboardData.metrics?.confirmed_meetings || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {dashboardData.metrics?.completed_meetings || 0} terminées
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                    <span style={{ fontSize: '12px' }}>Curiosités</span>
                    <MessageSquare size={16} />
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
                    {dashboardData.metrics?.curiosities_sent || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {dashboardData.metrics?.curiosities_answered || 0} répondues
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                    <span style={{ fontSize: '12px' }}>Coups de cœur finaux</span>
                    <CheckCircle2 size={16} />
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}>
                    {dashboardData.metrics?.final_selections_count || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Sélections enregistrées
                  </div>
                </div>
              </div>

              {/* Zones Live State */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
                  Occupation instantanée des zones
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {dashboardData.zones?.map((z) => (
                    <div
                      key={z.zone_number}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        background: z.is_occupied ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        border: z.is_occupied ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                        {z.name || `Zone ${z.zone_number}`}
                      </div>
                      <div style={{ fontSize: '11px', color: z.is_occupied ? '#f87171' : '#34d399', marginTop: '4px' }}>
                        {z.is_occupied ? 'Occupée' : 'Disponible'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          2. SECTION ZONES
          ======================================================== */}
      {activeTab === 'zones' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                Configuration des Zones Physiques
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Activez ou désactivez les zones selon la configuration de votre lieu.
              </p>
            </div>
            <button onClick={() => loadZones(selectedEventId)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              <RefreshCw size={12} style={{ marginRight: '6px' }} /> Actualiser
            </button>
          </div>

          {isLoadingZones ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw className="spin" size={20} style={{ margin: '0 auto 8px auto' }} /> Chargement des zones...
            </div>
          ) : zones.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Aucune zone configurée pour cet événement.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {zones.map((z) => (
                <div
                  key={z.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                        {z.name || `Zone ${z.zone_number}`}
                      </span>
                      <span
                        className={z.is_active ? 'badge badge-success' : 'badge badge-dim'}
                        style={{ fontSize: '10px' }}
                      >
                        {z.is_active ? 'Active' : 'Inhibée'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Capacité : 2 participants (rencontre 1:1)
                    </p>
                  </div>
                  <button
                    onClick={() => toggleZone(z.zone_number, z.is_active)}
                    className={z.is_active ? 'btn-secondary' : 'btn-primary'}
                    style={{ marginTop: '12px', padding: '6px 10px', fontSize: '12px', width: '100%' }}
                  >
                    {z.is_active ? 'Désactiver cette zone' : 'Activer cette zone'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          3. SECTION MOTEUR (MATCHMAKING ENGINE)
          ======================================================== */}
      {activeTab === 'engine' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            Moteur de Matchmaking & Déclenchement des Vagues
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
            Le moteur analyse les questionnaires des participants arrivés, calcule les affinités mutuelles et propose des rencontres sobres et pertinentes aux participants disponibles.
          </p>

          <div
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px'
            }}
          >
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#a5b4fc', marginBottom: '6px' }}>
              Déclencher manuellement une vague de suggestions
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Utile en début de soirée lorsque plusieurs participants viennent de terminer leur questionnaire d'arrivée.
            </p>

            <button
              onClick={handleTriggerWave}
              disabled={isTriggeringWave}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
            >
              <Play size={16} />
              {isTriggeringWave ? 'Calcul des affinités...' : 'Lancer une vague de suggestions'}
            </button>

            {waveStatus && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  background: waveStatus.startsWith('Erreur') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: waveStatus.startsWith('Erreur') ? '#fca5a5' : '#86efac',
                  border: waveStatus.startsWith('Erreur') ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                {waveStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          4. SECTION PARTICIPANTS
          ======================================================== */}
      {activeTab === 'participants' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                Participants enregistrés ({participants.length})
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Liste anonymisée respectant la vie privée (seuls les prénoms d'usage et indicateurs techniques sont affichés).
              </p>
            </div>
            <button onClick={() => loadParticipants(selectedEventId)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              <RefreshCw size={12} style={{ marginRight: '6px' }} /> Actualiser
            </button>
          </div>

          {isLoadingParticipants ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw className="spin" size={20} style={{ margin: '0 auto 8px auto' }} /> Chargement...
            </div>
          ) : participants.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Aucun participant inscrit pour le moment.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '10px 8px' }}>Prénom</th>
                    <th style={{ padding: '10px 8px' }}>Statut</th>
                    <th style={{ padding: '10px 8px' }}>Questionnaire</th>
                    <th style={{ padding: '10px 8px' }}>Suggestions</th>
                    <th style={{ padding: '10px 8px' }}>Rencontres</th>
                    <th style={{ padding: '10px 8px' }}>Arrivée</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {p.first_name}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span className="badge badge-info" style={{ fontSize: '10px' }}>
                          {p.status || 'actif'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {p.questionnaire_completed ? (
                          <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> Complété
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>En attente</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                        {p.suggestions_received || 0}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                        {p.confirmed_meetings_count || 0}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-dim)', fontSize: '11px' }}>
                        {p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          5. SECTION ÉVÉNEMENTS (CREATION & LISTE)
          ======================================================== */}
      {activeTab === 'events' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {/* Create Event Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Créer une nouvelle soirée
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Renseignez les détails ci-dessous. Le code permettra aux invités de se connecter et d'accéder à l'application lors de la soirée.
            </p>

            {eventCreationStatus && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background:
                    eventCreationStatus.type === 'success'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  color: eventCreationStatus.type === 'success' ? '#86efac' : '#fca5a5',
                  border:
                    eventCreationStatus.type === 'success'
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                {eventCreationStatus.type === 'success' ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{eventCreationStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Nom de la soirée *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Soirée Célibataires Paris 11"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Date et Heure *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Code d'accès personnalisé (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PARIS25 (généré auto si vide)"
                    value={newEvent.code}
                    onChange={(e) => setNewEvent({ ...newEvent, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Nombre de zones physiques (1 à 10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newEvent.num_zones}
                    onChange={(e) => setNewEvent({ ...newEvent, num_zones: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Description ou consignes du lieu (optionnel)
                </label>
                <textarea
                  rows="2"
                  placeholder="Ex: Lieu : Bar Le Comptoir. 4 tables identifiées pour les tête-à-tête."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingEvent}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
              >
                <PlusCircle size={16} />
                {isSubmittingEvent ? 'Création en cours...' : 'Créer cette soirée'}
              </button>
            </form>
          </div>

          {/* Existing Events List */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                Toutes les soirées ({events.length})
              </h3>
              <button onClick={loadEvents} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                <RefreshCw size={12} style={{ marginRight: '6px' }} /> Actualiser
              </button>
            </div>

            {isLoadingEvents ? (
              <p style={{ color: 'var(--text-muted)' }}>Chargement des événements...</p>
            ) : events.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Aucune soirée enregistrée.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                      <th style={{ padding: '10px 8px' }}>Code</th>
                      <th style={{ padding: '10px 8px' }}>Nom</th>
                      <th style={{ padding: '10px 8px' }}>Date</th>
                      <th style={{ padding: '10px 8px' }}>Statut</th>
                      <th style={{ padding: '10px 8px' }}>Zones</th>
                      <th style={{ padding: '10px 8px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => {
                      const isSelected = ev.id === selectedEventId;
                      return (
                        <tr
                          key={ev.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {ev.code}
                          </td>
                          <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--text-main)' }}>
                            {ev.name}
                          </td>
                          <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                            {ev.date ? new Date(ev.date).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span className="badge badge-info" style={{ fontSize: '10px' }}>
                              {ev.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                            {ev.num_zones || 4}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <button
                              onClick={() => {
                                setSelectedEventId(ev.id);
                                setActiveTab('overview');
                              }}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                              Gérer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
