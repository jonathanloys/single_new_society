import React, { useState } from 'react';
import { Sparkles, MapPin, Shirt, CheckCircle, Star, MessageSquare, Heart, X, MessageSquarePlus, Clock } from 'lucide-react';

export function MeetingsView({
  meetings = [],
  curiosities = { received: [], sent: [] },
  onCompleteMeeting,
  onSaveEvaluation,
  onToggleKeepInTouch,
  onOpenCuriosityModal,
  onAnswerCuriosity
}) {
  const [evalMeeting, setEvalMeeting] = useState(null);
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [answeringCuriosity, setAnsweringCuriosity] = useState(null);
  const [curiosityResponse, setCuriosityResponse] = useState('');

  const confirmedMeetings = meetings.filter(m => m.status === 'confirmed');
  const completedMeetings = meetings.filter(m => m.status === 'completed');

  const openEval = (meeting) => {
    setEvalMeeting(meeting);
    setRating(meeting.my_rating || 5);
    setNote(meeting.my_private_note || '');
  };

  const handleSaveEval = async () => {
    if (!evalMeeting) return;
    setIsSubmitting(true);
    try {
      await onSaveEvaluation(evalMeeting.id, rating, note);
      setEvalMeeting(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!answeringCuriosity || !curiosityResponse.trim()) return;
    setIsSubmitting(true);
    try {
      await onAnswerCuriosity(answeringCuriosity.id, curiosityResponse.trim());
      setAnsweringCuriosity(null);
      setCuriosityResponse('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMeetingCard = (m) => {
    const isConfirmed = m.status === 'confirmed';

    return (
      <div
        key={m.id}
        className="glass-card highlight"
        style={{
          marginBottom: '20px',
          borderLeft: isConfirmed ? '4px solid #10b981' : '4px solid rgba(255,255,255,0.2)'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span className={isConfirmed ? "badge badge-success" : "badge badge-info"}>
            <Sparkles size={12} /> {isConfirmed ? 'Rencontre confirmée' : 'Rencontre effectuée'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            {new Date(m.confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* C’est réciproque ! */}
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
          C’est réciproque ! {m.other_first_name} souhaite également te rencontrer.
        </h3>

        {/* Emplacement / Zone attribuée */}
        {m.zone_number ? (
          <div className="zone-badge-giant" style={{ margin: '16px 0' }}>
            <div className="label">Votre point de rencontre</div>
            <div className="number">ZONE {m.zone_number}</div>
            {m.zone_name && (
              <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>
                {m.zone_name}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            margin: '14px 0',
            fontSize: '13px'
          }}>
            Attribution de zone en attente... Une zone vous sera affectée dès libération.
          </div>
        )}

        {/* Signe vestimentaire pour se repérer */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>
            <Shirt size={13} /> {m.other_first_name.toUpperCase()} PORTE :
          </div>
          <div style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--text-main)' }}>
            « {m.other_distinctive_outfit || 'Tenue élégante'} »
          </div>
        </div>

        {/* Instruction simple */}
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
          Retrouvez-vous près du numéro <strong>{m.zone_number}</strong> lorsque vous êtes prêts. Prenez votre temps, aucun horaire rigide n'est imposé.
        </p>

        {/* Note personnelle existante */}
        {m.my_private_note && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            fontSize: '12px',
            marginBottom: '14px'
          }}>
            <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: '2px' }}>
              Ta note privée {m.my_rating ? `(${m.my_rating}★)` : ''} :
            </div>
            <div style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>
              « {m.my_private_note} »
            </div>
          </div>
        )}

        {/* Actions principales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isConfirmed && (
            <button
              type="button"
              onClick={() => onCompleteMeeting(m.id)}
              className="btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '13px' }}
            >
              <CheckCircle size={15} /> Rencontre effectuée
            </button>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Note privée */}
            <button
              type="button"
              onClick={() => openEval(m)}
              className="btn-secondary"
              style={{ flex: 1, padding: '8px 10px', fontSize: '12px', minWidth: '100px' }}
            >
              <Star size={13} color="#f59e0b" /> {m.my_private_note ? 'Modifier la note' : 'Note privée'}
            </button>

            {/* Curiosité */}
            <button
              type="button"
              onClick={() => onOpenCuriosityModal(m.other_participant_id, m.other_first_name)}
              className="btn-secondary"
              style={{ flex: 1, padding: '8px 10px', fontSize: '12px', minWidth: '100px' }}
            >
              <MessageSquarePlus size={13} color="#38bdf8" /> Curiosité
            </button>

            {/* Toggle garder le contact */}
            <button
              type="button"
              onClick={() => onToggleKeepInTouch(m.other_participant_id)}
              className="btn-secondary"
              style={{
                flex: 1.2,
                padding: '8px 10px',
                fontSize: '12px',
                minWidth: '130px',
                background: m.is_selected_for_recap ? 'rgba(244, 63, 94, 0.2)' : undefined,
                borderColor: m.is_selected_for_recap ? '#f43f5e' : undefined,
                color: m.is_selected_for_recap ? '#fb7185' : undefined
              }}
            >
              <Heart size={13} fill={m.is_selected_for_recap ? '#f43f5e' : 'none'} color="#f43f5e" />
              {m.is_selected_for_recap ? 'Garder contact ✓' : 'Garder contact'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* Title */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Mes rencontres</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
          Retrouve ici les personnes avec lesquelles un point de rencontre t'a été attribué.
        </p>
      </div>

      {/* Confirmed meetings */}
      {confirmedMeetings.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          {confirmedMeetings.map(renderMeetingCard)}
        </div>
      )}

      {/* Completed meetings */}
      {completedMeetings.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-dim)',
            marginBottom: '12px',
            fontWeight: 700
          }}>
            Rencontres déjà effectuées ({completedMeetings.length})
          </h4>
          {completedMeetings.map(renderMeetingCard)}
        </div>
      )}

      {/* Empty State */}
      {meetings.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px', marginBottom: '24px' }}>
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
            <MapPin size={28} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
            Aucune rencontre confirmée pour le moment
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '340px', margin: '0 auto', lineHeight: 1.6 }}>
            Dès que vous et une autre personne aurez manifesté un intérêt commun, votre point de rencontre et son signe vestimentaire s'afficheront ici.
          </p>
        </div>
      )}

      {/* Section Curiosités intégrée (questions reçues & envoyées) */}
      {(curiosities.received.length > 0 || curiosities.sent.length > 0) && (
        <div className="glass-card" style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} color="#38bdf8" /> Questions Curiosité
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {curiosities.received.map(c => (
              <div key={c.id} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px'
              }}>
                <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>
                  Question de {c.sender_first_name} :
                </div>
                <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                  « {c.question} »
                </div>

                {c.response ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px' }}>
                    Ta réponse : « {c.response} »
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAnsweringCuriosity(c);
                      setCuriosityResponse('');
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                  >
                    Répondre à {c.sender_first_name}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Note Privée */}
      {evalMeeting && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Note secrète & personnelle</h3>
              <button
                type="button"
                onClick={() => setEvalMeeting(null)}
                style={{ background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
              Comment s'est passée ta rencontre avec <strong>{evalMeeting.other_first_name}</strong> ? Ces notes sont <strong>strictement personnelles</strong> et ne seront jamais partagées avec personne.
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
                      fontWeight: 700,
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
                Notes personnelles (sujets abordés, détails pour te souvenir) :
              </label>
              <textarea
                rows={3}
                placeholder="Ex : Passionné(e) de voyages, grand sens de l'humour, discussion super fluide..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setEvalMeeting(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveEval}
                disabled={isSubmitting}
                className="btn-primary"
                style={{ flex: 1.5 }}
              >
                {isSubmitting ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Répondre à une Curiosité */}
      {answeringCuriosity && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
              Répondre à {answeringCuriosity.sender_first_name}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>
              « {answeringCuriosity.question} »
            </p>

            <div style={{ marginBottom: '16px' }}>
              <textarea
                rows={3}
                placeholder="Ta réponse spontanée..."
                value={curiosityResponse}
                onChange={(e) => setCuriosityResponse(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setAnsweringCuriosity(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAnswerSubmit}
                disabled={isSubmitting || !curiosityResponse.trim()}
                className="btn-primary"
                style={{ flex: 1.5 }}
              >
                {isSubmitting ? 'Envoi...' : 'Envoyer la réponse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
