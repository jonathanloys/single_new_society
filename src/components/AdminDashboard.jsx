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

// AdminDashboard component
export function AdminDashboard({ onExitAdmin }) {
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('overview');

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

      {/* Overview tab placeholder */}
      {activeTab === 'overview' && <div>Contenu d'aperçu</div>}
      {/* Zones tab placeholder */}
      {activeTab === 'zones' && <div>Gestion des zones</div>}
      {/* Engine tab placeholder */}
      {activeTab === 'engine' && <div>Gestion du moteur</div>}
      {/* Participants tab placeholder */}
      {activeTab === 'participants' && <div>Gestion des participants</div>}

      {/* Events tab */}
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
