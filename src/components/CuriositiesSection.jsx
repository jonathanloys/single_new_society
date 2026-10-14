import React, { useState } from 'react';
import { HelpCircle, Send, CheckCircle2, MessageSquare, ChevronDown } from 'lucide-react';

export const PRESET_CURIOSITIES = [
  "Quel talent aimerais-tu posséder instantanément ?",
  "Quelle petite chose peut immédiatement te mettre de bonne humeur ?",
  "Si tu pouvais revivre une journée de ta vie, laquelle choisirais-tu ?",
  "Quel est le voyage qui t'a le plus transformé(e) jusqu'ici ?",
  "Quelle est la discussion la plus mémorable que tu aies eue récemment ?",
  "Qu'est-ce qui te passionne tellement que tu pourrais en parler des heures ?"
];

export function CuriositiesSection({
  curiosities,
  onAnswer,
  isOpenSendModal,
  sendTarget,
  onCloseSendModal,
  onSendCuriosity
}) {
  const [selectedQuestion, setSelectedQuestion] = useState(PRESET_CURIOSITIES[0]);
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { received = [], sent = [] } = curiosities;

  const handleSend = async () => {
    if (!sendTarget?.id) return;
    setIsSubmitting(true);
    await onSendCuriosity(sendTarget.id, selectedQuestion);
    setIsSubmitting(false);
    onCloseSendModal();
  };

  const handleAnswerSubmit = async (curiosityId) => {
    const text = answerDrafts[curiosityId];
    if (!text?.trim()) return;
    setIsSubmitting(true);
    await onAnswer(curiosityId, text.trim());
    setIsSubmitting(false);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <HelpCircle size={18} color="#38bdf8" />
        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Curiosités & Questions</h3>
      </div>

      {received.length === 0 && sent.length === 0 ? (
        <div className="glass-card" style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Envoyez une « Curiosité » à une personne rencontrée pour approfondir votre échange à la fin de la soirée.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Received curiosities */}
          {received.map(c => (
            <div key={c.id} className="glass-card" style={{ padding: '16px', borderLeft: '3px solid #38bdf8' }}>
              <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>
                {c.sender_first_name} t'a envoyé une Curiosité :
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>
                « {c.question} »
              </div>

              {c.status === 'answered' ? (
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: '11px', marginBottom: '2px' }}>Ta réponse partagée :</div>
                  <div style={{ fontStyle: 'italic' }}>« {c.response} »</div>
                </div>
              ) : (
                <div style={{ marginTop: '8px' }}>
                  <textarea
                    rows={2}
                    placeholder="Écris ta réponse ici..."
                    value={answerDrafts[c.id] || ''}
                    onChange={(e) => setAnswerDrafts({ ...answerDrafts, [c.id]: e.target.value })}
                    style={{ marginBottom: '8px', fontSize: '13px' }}
                  />
                  <button
                    onClick={() => handleAnswerSubmit(c.id)}
                    disabled={isSubmitting || !answerDrafts[c.id]?.trim()}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    <Send size={12} /> Partager ma réponse
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Sent curiosities */}
          {sent.map(c => (
            <div key={c.id} className="glass-card" style={{ padding: '16px', borderLeft: '3px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Curiosité envoyée à <strong>{c.receiver_first_name}</strong> :
              </div>
              <div style={{ fontSize: '13px', fontStyle: 'italic', marginBottom: '8px' }}>
                « {c.question} »
              </div>

              {c.status === 'answered' ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#a7f3d0' }}>
                  <div style={{ fontWeight: 600, fontSize: '11px', marginBottom: '2px', color: '#34d399' }}>
                    Réponse de {c.receiver_first_name} :
                  </div>
                  <div>« {c.response} »</div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  En attente de réponse...
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal to send curiosity */}
      {isOpenSendModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>Envoyer une Curiosité</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Pose une question inspirante à <strong>{sendTarget?.first_name}</strong> pour prolonger l'échange.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {PRESET_CURIOSITIES.map((q) => (
                <div
                  key={q}
                  className={`choice-card ${selectedQuestion === q ? 'selected' : ''}`}
                  onClick={() => setSelectedQuestion(q)}
                  style={{ padding: '12px 14px' }}
                >
                  <span style={{ fontSize: '13px' }}>{q}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onCloseSendModal} className="btn-secondary" style={{ flex: 1 }}>
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={isSubmitting}
                className="btn-primary"
                style={{ flex: 1.5 }}
              >
                <Send size={14} /> Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
