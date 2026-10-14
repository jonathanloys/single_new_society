import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  MapPin,
  Sliders,
  Play,
  Pause,
  Sparkles,
  RefreshCw,
  Eye,
  PlusCircle,
  Shield,
  Layers,
  CheckCircle,
  HelpCircle,
  Award
} from 'lucide-react';

export function AdminDashboard({ onExitAdmin }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'zones', 'engine', 'participants', 'events'
  const [eventId, setEventId] = useState('demo-soiree-paris');
  const [data, setData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Load dashboard data
  const loadDashboard = async () => {
    try {
      const [dashRes, partsRes] = await Promise.all([
        fetch(`/api/admin/events/${eventId}/dashboard`),
        fetch(`/api/admin/events/${eventId}/participants`)
      ]);
      const dashData = await dashRes.json();
      const partsData = await partsRes.json();
      setData(dashData);
      setParticipants(partsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 6000);
    return () => clearInterval(interval);
  }, [eventId]);

  const updateEventSetting = async (fields) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        setActionMsg('Configuration mise à jour.');
        loadDashboard();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
      setTimeout(() => setActionMsg(''), 3000);
    }
  };

  const triggerWave = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/events/${eventId}/trigger-wave`, { method: 'POST' });
      const json = await res.json();
      setActionMsg(`Vague lancée : ${json.suggestions_generated} nouvelles suggestions créées.`);
      loadDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const updateZone = async (zoneNumber, fields) => {
    try {
      await fetch(`/api/events/${eventId}/zones/${zoneNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        Chargement de l'espace administrateur...
      </div>
    );
  }

  const { event, metrics = {}, zones = [] } = data || {};

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Header */}
      <div className="glass-card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary">Supervision Événement</span>
            <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Code : <strong>{event?.code}</strong></span>
          </div>
          <h1 style={{ fontSize: '24px', marginTop: '4px' }}>{event?.name}</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{event?.date}</div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={loadDashboard} className="btn-secondary" style={{ padding: '8px 12px' }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <button onClick={onExitAdmin} className="btn-primary" style={{ padding: '8px 16px' }}>
            Quitter l'Admin
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#6ee7b7',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 600
        }}>
          ✓ {actionMsg}
        </div>
      )}

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'overview', label: 'Vue d’ensemble & Stats', icon: BarChart3 },
          { id: 'zones', label: `Zones (${event?.num_zones} actives)`, icon: MapPin },
          { id: 'engine', label: 'Moteur & Phases', icon: Sliders },
          { id: 'participants', label: `Participants (${participants.length})`, icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '10px 18px', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & REAL-TIME STATS */}
      {activeTab === 'overview' && (
        <div>
          {/* Quick controls bar */}
          <div className="glass-card" style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '14px' }}>Contrôle direct de la soirée :</strong>

            <button
              onClick={() => updateEventSetting({ suggestions_active: event?.suggestions_active === 1 ? 0 : 1 })}
              className={event?.suggestions_active === 1 ? 'btn-secondary' : 'btn-primary'}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              {event?.suggestions_active === 1 ? <><Pause size={14} /> Suspendre suggestions</> : <><Play size={14} /> Reprendre suggestions</>}
            </button>

            <button
              onClick={triggerWave}
              disabled={isUpdating}
              className="btn-primary"
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              <Sparkles size={14} /> Lancer une vague de suggestions
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <span className={`badge ${event?.status === 'in_progress' ? 'badge-success' : event?.status === 'revealed' ? 'badge-primary' : 'badge-warning'}`}>
                Phase actuelle : {event?.status}
              </span>
            </div>
          </div>

          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-card">
              <div style={{ color: 'var(--text-dim)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Participants Inscrits</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {metrics.total_registered}
              </div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                {metrics.completed_questionnaires} questionnaires remplis
              </div>
            </div>

            <div className="glass-card">
              <div style={{ color: 'var(--text-dim)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Suggestions Présentées</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                {metrics.suggestions_count}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Rythme fluide sans saturation
              </div>
            </div>

            <div className="glass-card">
              <div style={{ color: 'var(--text-dim)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Invitations en Attente</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                {metrics.pending_invitations}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Plafond max : {event?.max_pending_received_invitations} / pers.
              </div>
            </div>

            <div className="glass-card highlight">
              <div style={{ color: 'var(--text-dim)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Rencontres Confirmées</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#fb7185', marginTop: '4px' }}>
                {metrics.confirmed_meetings}
              </div>
              <div style={{ fontSize: '12px', color: '#34d399', marginTop: '4px' }}>
                {metrics.completed_meetings} déclarées effectuées
              </div>
            </div>

            <div className="glass-card">
              <div style={{ color: 'var(--text-dim)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Curiosités Échangées</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#818cf8', marginTop: '4px' }}>
                {metrics.curiosities_sent}
              </div>
              <div style={{ fontSize: '12px', color: '#a7f3d0', marginTop: '4px' }}>
                {metrics.curiosities_answered} réponses partagées
              </div>
            </div>

            <div className="glass-card">
              <div style={{ color: 'var(--text-dim)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Sélections Finales</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#ec4899', marginTop: '4px' }}>
                {metrics.final_selections_count}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                {event?.status === 'revealed' ? 'Révélation ouverte' : 'Choix confidentiels'}
              </div>
            </div>
          </div>

          {/* Zones load distribution */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#0ea5e9" /> Répartition des Rencontres Actives par Zone
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {zones.filter(z => z.is_in_range).map(z => (
                <div
                  key={z.zone_number}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '15px' }}>Zone {z.zone_number}</strong>
                    <span className={`badge ${z.active_meetings > 0 ? 'badge-primary' : 'badge-info'}`}>
                      {z.active_meetings} / {z.capacity}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {z.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ZONES CONFIGURATION (1 TO 10 STRICT) */}
      {activeTab === 'zones' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '20px' }}>Configuration des Zones de Rencontre</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Chaque soirée utilise entre 1 et 10 zones physiques marquées d'un grand chiffre visible sur place.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Nombre de zones actives :</label>
              <select
                value={event?.num_zones}
                onChange={(e) => updateEventSetting({ num_zones: parseInt(e.target.value, 10) })}
                style={{ width: '80px', padding: '6px 10px' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {zones.map(z => {
              const inRange = z.zone_number <= event?.num_zones;
              return (
                <div
                  key={z.zone_number}
                  style={{
                    background: inRange ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                    border: inRange ? '1px solid var(--border-subtle)' : '1px dashed rgba(255,255,255,0.06)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    opacity: inRange ? 1 : 0.4
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    background: inRange ? 'var(--accent-zone)' : 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '18px',
                    color: inRange ? 'white' : 'var(--text-dim)'
                  }}>
                    {z.zone_number}
                  </div>

                  <div style={{ flex: 2 }}>
                    <input
                      type="text"
                      defaultValue={z.name}
                      onBlur={(e) => updateZone(z.zone_number, { name: e.target.value })}
                      placeholder={`Description Zone ${z.zone_number}...`}
                      disabled={!inRange}
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Capacité :</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      defaultValue={z.capacity}
                      onBlur={(e) => updateZone(z.zone_number, { capacity: parseInt(e.target.value, 10) || 2 })}
                      disabled={!inRange}
                      style={{ width: '60px', padding: '6px 8px', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <span className={`badge ${inRange ? (z.active_meetings > 0 ? 'badge-primary' : 'badge-success') : 'badge-warning'}`}>
                      {inRange ? `${z.active_meetings} rencontre(s)` : 'Zone inactive'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ENGINE SETTINGS & PHASES */}
      {activeTab === 'engine' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Phases control */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Phases de la Soirée</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Contrôlez le tempo de l'événement et l'ouverture des moments clés.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'open_registration', title: '1. Inscriptions ouvertes', desc: 'Les participants peuvent rejoindre et remplir le questionnaire.' },
                { key: 'in_progress', title: '2. Soirée en cours (Suggestions)', desc: 'Suggestions actives, invitations et attribution des zones.' },
                { key: 'final_selection', title: '3. Sélection finale', desc: 'Les participants choisissent secrètement avec qui continuer à discuter.' },
                { key: 'revealed', title: '4. Révélation des affinités', desc: 'Révélation des intérêts réciproques et unilatéraux.' },
                { key: 'archived', title: '5. Soirée archivée', desc: 'Consultation uniquement, fin de l’événement.' }
              ].map(phase => (
                <div
                  key={phase.key}
                  className={`choice-card ${event?.status === phase.key ? 'selected' : ''}`}
                  onClick={() => updateEventSetting({ status: phase.key })}
                  style={{ padding: '12px 14px' }}
                >
                  <div>
                    <strong style={{ fontSize: '14px' }}>{phase.title}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{phase.desc}</div>
                  </div>
                  {event?.status === phase.key && <CheckCircle size={18} color="#f43f5e" />}
                </div>
              ))}
            </div>
          </div>

          {/* Engine Parameters */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Règles & Anti-Saturation</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Paramètres appliqués au moteur pour garantir des échanges fluides.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Suggestions actives max par participant :
              </label>
              <input
                type="number"
                min="1"
                max="3"
                defaultValue={event?.max_active_suggestions}
                onBlur={(e) => updateEventSetting({ max_active_suggestions: parseInt(e.target.value, 10) || 1 })}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Par défaut : 1 suggestion à la fois</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Invitations en attente max reçues par participant :
              </label>
              <input
                type="number"
                min="1"
                max="5"
                defaultValue={event?.max_pending_received_invitations}
                onBlur={(e) => updateEventSetting({ max_pending_received_invitations: parseInt(e.target.value, 10) || 2 })}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Évite de sur-solliciter les mêmes personnes (défaut : 2)</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Délai d'expiration des invitations (minutes) :
              </label>
              <input
                type="number"
                min="5"
                max="60"
                defaultValue={event?.invitation_expiry_minutes}
                onBlur={(e) => updateEventSetting({ invitation_expiry_minutes: parseInt(e.target.value, 10) || 20 })}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Libère la capacité d'invitation automatiquement</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PARTICIPANTS LIST (PRIVACY-PRESERVING) */}
      {activeTab === 'participants' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px' }}>Liste Administrative des Participants</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Conformément aux règles de confidentialité, les réponses détaillées et notes privées ne sont pas affichées.
              </p>
            </div>
            <span className="badge badge-info">{participants.length} inscrits</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '10px 12px' }}>Prénom</th>
                  <th style={{ padding: '10px 12px' }}>Statut</th>
                  <th style={{ padding: '10px 12px' }}>Questionnaire</th>
                  <th style={{ padding: '10px 12px' }}>Suggestions reçues</th>
                  <th style={{ padding: '10px 12px' }}>Invitations reçues</th>
                  <th style={{ padding: '10px 12px' }}>Rencontres confirmées</th>
                </tr>
              </thead>
              <tbody>
                {participants.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{p.first_name}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-success" style={{ fontSize: '11px' }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {p.questionnaire_completed === 1 ? (
                        <span style={{ color: '#34d399' }}>✓ Complété</span>
                      ) : (
                        <span style={{ color: '#fbbf24' }}>En attente</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.suggestions_received}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.pending_invitations}</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                        {p.confirmed_meetings_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
