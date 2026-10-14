import React, { useState, useEffect } from 'react';
import { Heart, Check, Users, ShieldCheck, ArrowRight } from 'lucide-react';

export function FinalSelectionView({ token, onComplete }) {
  const [eligible, setEligible] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/participant/eligible-for-selection', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEligible(data.met || []);
        setSelectedIds(data.selected_ids || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/participant/final-selections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ selected_participant_ids: selectedIds })
      });
      setSaved(true);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>Chargement des personnes rencontrées...</div>;
  }

  return (
    <div className="glass-card" style={{ maxWidth: '520px', margin: '0 auto 20px auto' }}>
      <div className="badge badge-primary" style={{ marginBottom: '8px' }}>
        <Heart size={12} /> Fin de soirée
      </div>
      <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Poursuivre la conversation</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '18px', lineHeight: 1.5 }}>
        Sélectionne les personnes avec lesquelles tu aimerais continuer à échanger. Tes choix sont <strong>strictement confidentiels</strong> et ne seront révélés que lors de la phase finale.
      </p>

      {eligible.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-muted)' }}>
          Tu n'as pas encore de rencontres enregistrées pour cette soirée.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {eligible.map(person => {
            const isSelected = selectedIds.includes(person.id);
            return (
              <div
                key={person.id}
                className={`choice-card ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleSelect(person.id)}
              >
                <div>
                  <strong style={{ fontSize: '16px' }}>{person.first_name}</strong>
                  {person.private_note && (
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '2px' }}>
                      Ta note : « {person.private_note.substring(0, 45)}... »
                    </div>
                  )}
                </div>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid #f43f5e' : '2px solid rgba(255,255,255,0.2)',
                  background: isSelected ? '#f43f5e' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  {isSelected && <Check size={14} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        padding: '12px',
        borderRadius: 'var(--radius-md)',
        fontSize: '12px',
        color: '#c7d2fe',
        marginBottom: '20px'
      }}>
        <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
        <strong>Discrétion totale :</strong> Les personnes que tu ne sélectionnes pas ne recevront aucun refus ni message négatif.
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary"
        style={{ width: '100%' }}
      >
        {saving ? 'Enregistrement...' : saved ? 'Sélection mise à jour !' : `Confirmer ma sélection (${selectedIds.length})`}
      </button>
    </div>
  );
}
