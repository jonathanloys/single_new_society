import React, { useState } from 'react';
import { MapPin, CheckCircle, XCircle, Sparkles, Shirt, MessageSquarePlus, Star } from 'lucide-react';

export function ConfirmedMeetingCard({
  meeting,
  onComplete,
  onCancel,
  onOpenCuriosity,
  onSaveEvaluation
}) {
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [rating, setRating] = useState(meeting.my_rating || 5);
  const [note, setNote] = useState(meeting.my_private_note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConfirmed = meeting.status === 'confirmed';
  const isCompleted = meeting.status === 'completed';

  const handleSaveEval = async () => {
    setIsSubmitting(true);
    await onSaveEvaluation(meeting.id, rating, note);
    setIsSubmitting(false);
    setShowEvalModal(false);
  };

  return (
    <div className="glass-card highlight" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span className="badge badge-success">
          <Sparkles size={13} /> {isConfirmed ? 'Rencontre Confirmée' : 'Rencontre Effectuée'}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
          {new Date(meeting.confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Giant prominent Zone Banner */}
      <div className="zone-badge-giant" style={{ marginBottom: '18px' }}>
        <div className="label">Rendez-vous dans l'établissement</div>
        <div className="number">ZONE {meeting.zone_number}</div>
        {meeting.zone_name && (
          <div style={{ fontSize: '14px', opacity: 0.95, marginTop: '4px', fontWeight: 600 }}>
            {meeting.zone_name}
          </div>
        )}
      </div>

      <div style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '16px' }}>
        <p style={{ marginBottom: '8px' }}>
          <strong>C'est réciproque !</strong> {meeting.other_first_name} aimerait aussi te rencontrer.
        </p>

        {/* Distinctive clothing detail revealed ONLY after mutual confirmation */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginTop: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>
            <Shirt size={14} /> SIGNE POUR VOUS RECONNAÎTRE :
          </div>
          <div style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--text-main)' }}>
            « {meeting.other_distinctive_outfit || 'Tenue élégante'} »
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Retrouvez-vous près du chiffre <strong>{meeting.zone_number}</strong> lorsque vous êtes prêts. Prenez votre temps, aucun horaire rigide n'est imposé !
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        {isConfirmed && (
          <button
            onClick={() => onComplete(meeting.id)}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            <CheckCircle size={16} /> Rencontre effectuée
          </button>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowEvalModal(true)}
            className="btn-secondary"
            style={{ flex: 1, fontSize: '12px' }}
          >
            <Star size={14} color="#f59e0b" /> Note privée
          </button>

          <button
            onClick={() => onOpenCuriosity(meeting.other_participant_id, meeting.other_first_name)}
            className="btn-secondary"
            style={{ flex: 1, fontSize: '12px' }}
          >
            <MessageSquarePlus size={14} color="#38bdf8" /> Curiosité
          </button>

          {isConfirmed && (
            <button
              onClick={() => onCancel(meeting.id)}
              className="btn-outline-danger"
              style={{ fontSize: '12px' }}
              title="Annuler cette rencontre"
            >
              <XCircle size={14} /> Annuler
            </button>
          )}
        </div>
      </div>

      {/* Private evaluation modal */}
      {showEvalModal && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Votre débrief privé</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Comment s'est passée votre conversation avec {meeting.other_first_name} ? Ces notes sont <strong>strictement personnelles</strong> et ne seront JAMAIS partagées.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Impression générale (1 à 5 étoiles) :
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    style={{
                      background: s <= rating ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: s <= rating ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      color: s <= rating ? '#fbbf24' : 'var(--text-dim)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ★ {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Notes personnelles (sujets abordés, détails pour vous souvenir) :
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Passionné d'Italie, très bon feeling, adore le cinéma..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowEvalModal(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleSaveEval}
                disabled={isSubmitting}
                className="btn-primary"
                style={{ flex: 2 }}
              >
                {isSubmitting ? 'Sauvegarde...' : 'Enregistrer la note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
