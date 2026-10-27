import React, { useState } from 'react';
import { Sparkles, Heart, Check, Clock, RefreshCw, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export function DiscoverView({
  suggestion,
  invitations = [],
  onSendInvitation,
  onPassSuggestion,
  onRespondInvitation,
  onRefresh,
  onNavigateToMeetings
}) {
  const [actionFeedback, setActionFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInterest = async () => {
    if (!suggestion || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await onSendInvitation(suggestion.target_participant_id, suggestion.id);
      if (res?.mutual_confirmed) {
        setActionFeedback({
          type: 'success',
          isMutual: true,
          zone: res.zone_number,
          name: suggestion.target_first_name,
          msg: `C’est réciproque ! Rencontre confirmée avec ${suggestion.target_first_name}.`
        });
      } else {
        setActionFeedback({
          type: 'info',
          isMutual: false,
          name: suggestion.target_first_name,
          msg: `Votre intérêt a été transmis à ${suggestion.target_first_name}. Vous serez prévenu(e) dès qu'elle/il aura répondu !`
        });
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        msg: err.message || 'Impossible d’envoyer votre réponse pour le moment.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePass = async () => {
    if (!suggestion || isSubmitting) return;
    setActionFeedback(null);
    try {
      await onPassSuggestion(suggestion.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptInvite = async (inv) => {
    setIsSubmitting(true);
    try {
      await onRespondInvitation(inv.id, true);
      setActionFeedback({
        type: 'success',
        isMutual: true,
        name: inv.sender_first_name,
        msg: `Rencontre confirmée avec ${inv.sender_first_name} ! Retrouvez les informations dans « Mes rencontres ».`
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclineInvite = async (inv) => {
    try {
      await onRespondInvitation(inv.id, false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* Invitations reçues en attente */}
      {invitations.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {invitations.map(inv => (
            <div
              key={inv.id}
              className="glass-card highlight"
              style={{
                marginBottom: '12px',
                borderLeft: '4px solid #f43f5e',
                background: 'rgba(244, 63, 94, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-primary" style={{ fontSize: '12px' }}>
                  <Heart size={12} /> Invitation reçue
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                {inv.sender_first_name} aimerait faire ta connaissance !
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
                Si tu acceptes, un point de rencontre vous sera immédiatement attribué dans l'établissement.
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleDeclineInvite(inv)}
                  disabled={isSubmitting}
                  className="btn-secondary"
                  style={{ flex: 1, fontSize: '13px' }}
                >
                  Passer
                </button>
                <button
                  type="button"
                  onClick={() => handleAcceptInvite(inv)}
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ flex: 2, fontSize: '13px' }}
                >
                  <Check size={16} /> Accepter la rencontre
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestion Card */}
      {suggestion ? (
        <div className="glass-card" style={{ borderTop: '3px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span className="badge badge-primary">
              <Sparkles size={13} /> Découvrir une personne
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Discrétion garantie
            </span>
          </div>

          {/* Prénom */}
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>
            {suggestion.target_first_name}
          </h2>

          {/* Phrase personnalisée pour faciliter le premier échange */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderLeft: '3px solid #818cf8',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            padding: '14px 16px',
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'var(--text-main)',
            marginBottom: '20px'
          }}>
            « {suggestion.icebreaker} »
          </div>

          {/* Feedback après action */}
          {actionFeedback ? (
            <div>
              <div style={{
                background: actionFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${actionFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                color: actionFeedback.type === 'error' ? '#fca5a5' : '#6ee7b7',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                lineHeight: 1.5,
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                {actionFeedback.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
                <span>{actionFeedback.msg}</span>
              </div>

              {actionFeedback.isMutual && (
                <button
                  type="button"
                  onClick={onNavigateToMeetings}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '14px' }}
                >
                  Voir mes rencontres <ArrowRight size={16} />
                </button>
              )}
            </div>
          ) : (
            /* Les 2 boutons exigés par la spécification */
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={handlePass}
                disabled={isSubmitting}
                className="btn-secondary"
                style={{ flex: 1, padding: '12px', fontSize: '14px' }}
              >
                Passer
              </button>

              <button
                type="button"
                onClick={handleInterest}
                disabled={isSubmitting}
                className="btn-primary"
                style={{ flex: 2, padding: '12px', fontSize: '14px' }}
              >
                <Heart size={16} /> J'aimerais rencontrer cette personne
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: 'var(--text-dim)'
          }}>
            <Clock size={28} />
          </div>

          <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '8px' }}>
            Aucune nouvelle suggestion pour le moment
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '360px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
            Profite de la soirée, d'un verre ou d'une discussion ! L'Application prépare de nouvelles rencontres au bon moment pour préserver la spontanéité des échanges.
          </p>

          <button
            type="button"
            onClick={onRefresh}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <RefreshCw size={14} /> Vérifier les nouvelles suggestions
          </button>
        </div>
      )}
    </div>
  );
}
