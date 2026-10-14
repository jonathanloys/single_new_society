import React, { useState } from 'react';
import { Sparkles, Heart, Clock, Check, AlertCircle } from 'lucide-react';

export function SuggestionCard({
  suggestion,
  onSendInvitation,
  onDeferSuggestion,
  isSending
}) {
  const [feedback, setFeedback] = useState(null);

  if (!suggestion) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '36px 20px', marginBottom: '20px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px auto',
          color: 'var(--text-dim)'
        }}>
          <Clock size={24} />
        </div>
        <h3 style={{ fontSize: '17px', marginBottom: '6px' }}>En attente de la prochaine suggestion</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '320px', margin: '0 auto' }}>
          Profitez de la musique et d'un verre ! L'Application analyse le rythme de la soirée pour vous proposer de nouvelles rencontres au bon moment.
        </p>
      </div>
    );
  }

  const handleSend = async () => {
    try {
      const res = await onSendInvitation(suggestion.target_participant_id, suggestion.id);
      if (res?.mutual_confirmed) {
        setFeedback({
          type: 'success',
          msg: `C’est réciproque ! Rencontre confirmée avec ${suggestion.target_first_name} en Zone ${res.zone_number} !`
        });
      } else {
        setFeedback({
          type: 'info',
          msg: 'Ton invitation a été envoyée. Nous te préviendrons si votre rencontre se confirme.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.message || 'Impossible d’envoyer l’invitation pour le moment.'
      });
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: '20px', borderTop: '3px solid #f43f5e' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span className="badge badge-primary">
          <Sparkles size={13} /> Suggestion de rencontre
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Discrète & sans obligation</span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          {suggestion.target_first_name}
        </h3>

        {/* Custom icebreaker / conversation starter */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderLeft: '3px solid #6366f1',
          padding: '12px 14px',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          fontSize: '14px',
          color: 'var(--text-main)',
          lineHeight: 1.5,
          fontStyle: 'normal'
        }}>
          « {suggestion.icebreaker} »
        </div>
      </div>

      {feedback ? (
        <div style={{
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${feedback.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          color: feedback.type === 'error' ? '#fca5a5' : '#6ee7b7',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          lineHeight: 1.5,
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {feedback.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{feedback.msg}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onDeferSuggestion(suggestion.id)}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            Plus tard
          </button>

          <button
            onClick={handleSend}
            disabled={isSending}
            className="btn-primary"
            style={{ flex: 2 }}
          >
            <Heart size={16} /> J'aimerais rencontrer
          </button>
        </div>
      )}
    </div>
  );
}
