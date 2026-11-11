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
  Calendar,
} from 'lucide-react';

export function AdminDashboard({ onExitAdmin }) {
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('overview');

  // Additional admin data states
  const [overviewStats, setOverviewStats] = useState({ totalEvents: 0, latestEvent: null });
  const [zones, setZones] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [participants, setParticipants] = useState([]);

  // Load overview stats
  const loadOverview = async () => {
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      const total = data.length;
      const latest = data[0] || null;
      setOverviewStats({ totalEvents: total, latestEvent: latest });
    } catch (e) {
      console.error(e);
    }
  };

  // Load zones for selected event
  const loadZones = async (eventId) => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/events/${eventId}/zones`);
      if (!res.ok) throw new Error('Failed to fetch zones');
      const data = await res.json();
      setZones(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Load participants (placeholder)
  const loadParticipants = () => {
    setParticipants([]);
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'overview') loadOverview();
    else if (activeTab === 'zones' && selectedEventId) loadZones(selectedEventId);
    else if (activeTab === 'participants') loadParticipants();
  }, [activeTab, selectedEventId]);

  // Event management state
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    description: '',
    num_zones: 4,
    code: '',
  });
  const [allEvents, setAllEvents] = useState([]);
  const [createMsg, setCreateMsg] = useState('');

  // Load all events from API
  const loadAllEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setAllEvents(data);
    } catch (e) {
      console.error(e);
      setCreateMsg(`Erreur : ${e.message}`);
    }
  };

  // Create a new event via API
  const handleCreateEvent = async () => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateMsg(`Événement créé : ${data.name} (code ${data.code})`);
        loadAllEvents();
      } else {
        setCreateMsg(`Erreur : ${data.error || 'Impossible de créer l’événement'}`);
      }
    } catch (e) {
      console.error(e);
      setCreateMsg(`Erreur : ${e.message}`);
    }
  };

  // Navigation tabs definition
  const navTabs = [
    { id: 'overview', label: 'Aperçu', icon: BarChart3 },
    { id: 'zones', label: 'Zones', icon: MapPin },
    { id: 'engine', label: 'Moteur', icon: Play },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'events', label: 'Événements', icon: Calendar },
  ];

  // Initial load of events list
  useEffect(() => {
    loadAllEvents();
  }, []);

  return (
    <div className="admin-dashboard">
      {/* Tab navigation */}
      <nav className="tabs mb-4 flex gap-2">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded ${activeTab === tab.id ? 'bg-gray-200' : 'bg-gray-100'}`}
          >
            <tab.icon className="inline-block mr-1" size={16} />
            {tab.label}
          </button>
        ))}
        <button onClick={onExitAdmin} className="ml-auto px-4 py-2 bg-red-200 rounded">
          <Shield className="inline-block mr-1" size={16} />Quitter Admin
        </button>
      </nav>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div>
          <h3>Statistiques d'aperçu</h3>
          <p>Total événements: {overviewStats.totalEvents}</p>
          {overviewStats.latestEvent && (
            <div>
              <strong>Dernier événement créé:</strong>
              <ul>
                <li>Nom: {overviewStats.latestEvent.name}</li>
                <li>Code: {overviewStats.latestEvent.code}</li>
                <li>Date: {new Date(overviewStats.latestEvent.date).toLocaleString()}</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Zones */}
      {activeTab === 'zones' && (
        <div>
          <h3>Gestion des zones</h3>
          <div>
            <label>Choisir un événement: </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">-- Sélectionner --</option>
              {allEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.code})
                </option>
              ))}
            </select>
          </div>
          {zones.length > 0 && (
            <table className="table-auto w-full" style={{ borderCollapse: 'collapse', marginTop: '12px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th>ID</th>
                  <th>Zone</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td>{z.id}</td>
                    <td>{z.zone_number}</td>
                    <td>{z.is_active ? 'Oui' : 'Non'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Engine */}
      {activeTab === 'engine' && (
        <div>
          <h3>Gestion du moteur</h3>
          <p>Fonctionnalités du moteur de matchmaking à implémenter.</p>
        </div>
      )}

      {/* Participants */}
      {activeTab === 'participants' && (
        <div>
          <h3>Gestion des participants</h3>
          {participants.length === 0 ? (
            <p>Aucun participant chargé. Sélectionnez un événement dans l'onglet Zones.</p>
          ) : (
            <ul>
              {participants.map((p) => (
                <li key={p.id}>{p.first_name} ({p.gender})</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Events */}
      {activeTab === 'events' && (
        <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
          <h3>Gestion des événements</h3>
          <div style={{ display: 'grid', gap: '8px', maxWidth: '400px' }}>
            <input
              placeholder="Nom"
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
            />
            <input
              type="datetime-local"
              placeholder="Date/Heure"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            />
            <input
              placeholder="Code (facultatif)"
              value={newEvent.code}
              onChange={(e) => setNewEvent({ ...newEvent, code: e.target.value })}
            />
            <input
              type="number"
              placeholder="Nombre de zones"
              value={newEvent.num_zones}
              onChange={(e) => setNewEvent({ ...newEvent, num_zones: +e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
            <button className="btn-primary" onClick={handleCreateEvent}>
              Créer l'événement
            </button>
            {createMsg && <p>{createMsg}</p>}
          </div>
          <h4 style={{ marginTop: '24px' }}>Événements existants</h4>
          <button onClick={loadAllEvents} className="btn-secondary" style={{ marginBottom: '8px' }}>
            Actualiser
          </button>
          <table className="table-auto w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th>ID</th>
                <th>Code</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Status</th>
                <th>Zt</th>
              </tr>
            </thead>
            <tbody>
              {allEvents.map((ev) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td>{ev.id}</td>
                  <td>{ev.code}</td>
                  <td>{ev.name}</td>
                  <td>{ev.date}</td>
                  <td>{ev.status}</td>
                  <td>{ev.num_zones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
