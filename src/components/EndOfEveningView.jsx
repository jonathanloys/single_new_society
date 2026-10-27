import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Star, MessageSquare, Lock, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

export function EndOfEveningView({ token, eventStatus }) {
  const [recapData, setRecapData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRecap = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/participant/recap', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecapData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecap();
    const interval = setInterval(fetchRecap, 6000);
    return () => clearInterval(interval);
  }, [token, eventStatus]);

  if (loading) {
    return (
      <div className="glass-card" style={{ maxWidth: '520px', margin: '40px auto', textAlign: 'center', padding: '36px' }}>
        <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Chargement...</div>
      </div>
    );
  }

  // ÉTAT A : Événement encore ouvert (non clôturé par l'administrateur)
  // Strictement aucun résultat, aucun leak, affichage uniquement du message attendu.
  const isClosed = recapData?.is_closed === true;

  if (!isClosed) {
    return (
      <div style={{ maxWidth: '500px', margin: '30px auto', paddingBottom: '30px' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            color: 'var(--text-dim)'
          }}>
            <Lock size={28} color="#fbbf24" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
            Ton bilan de soirée sera bientôt disponible
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto 24px auto' }}>
            Tu retrouveras ici les personnes qui souhaitent poursuivre les échanges avec toi et le bilan de tes rencontres lorsque l’organisateur aura clôturé la soirée.
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--text-dim)'
          }}>
            <Clock size={14} /> Soirée en cours
          </div>
        </div>
      </div>
    );
  }

  // ÉTAT B : Événement clôturé par l'administrateur -> Bilan final
  const {
    meetings = [],
    curiosities = [],
    interested_in_me = [],
    mutual_matches = []
  } = recapData || {};

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* Header Bilan */}
      <div className="glass-card" style={{ marginBottom: '20px', borderTop: '3px solid #6366f1' }}>
        <div className="badge badge-info" style={{ marginBottom: '8px' }}>
          <Sparkles size={12} /> Bilan de soirée
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
          Ton bilan de soirée
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
          La soirée est désormais clôturée. Retrouve ci-dessous le bilan de tes échanges et les personnes qui souhaitent poursuivre la discussion.
        </p>
      </div>

      {/* 1. Intérêts réciproques (C'est réciproque !) */}
      {mutual_matches.length > 0 && (
        <div className="glass-card highlight" style={{ marginBottom: '16px', background: 'rgba(244, 63, 94, 0.12)', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fb7185', fontWeight: 700, fontSize: '17px', marginBottom: '8px' }}>
            <Sparkles size={20} />
            C'est réciproque ! ({mutual_matches.length})
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            Vous avez tous les deux souhaité poursuivre les échanges après la soirée :
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {mutual_matches.map(m => (
              <span key={m.id} className="badge badge-primary" style={{ padding: '8px 14px', fontSize: '14px' }}>
                ✨ {m.first_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. Intérêts unilatéraux reçus (Révélés positivement) */}
      {interested_in_me.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '16px', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
            <Heart size={18} />
            Souhaite(nt) poursuivre les échanges avec toi ({interested_in_me.length})
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
            Ces personnes ont particulièrement apprécié votre échange et aimeraient continuer le contact :
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {interested_in_me.map(m => (
              <span key={m.id} className="badge badge-info" style={{ padding: '6px 12px', fontSize: '13px' }}>
                {m.first_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Si aucune affinité enregistrée */}
      {mutual_matches.length === 0 && interested_in_me.length === 0 && (
        <div className="glass-card" style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
          Aucun intérêt réciproque enregistré. L'essentiel reste les belles rencontres vécues ce soir en direct !
        </div>
      )}

      {/* 3. Personnes rencontrées & Notes privées */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={16} color="#f59e0b" /> Personnes rencontrées & Notes privées
        </h3>

        {meetings.length === 0 ? (
          <div className="glass-card" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Aucune rencontre enregistrée.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {meetings.map(m => (
              <div key={m.id} className="glass-card" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '16px' }}>{m.first_name}</strong>
                  {m.rating && (
                    <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 700 }}>
                      {'★'.repeat(m.rating)}{'☆'.repeat(5 - m.rating)}
                    </span>
                  )}
                </div>

                {m.private_note ? (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    color: 'var(--text-muted)',
                    marginTop: '4px'
                  }}>
                    « {m.private_note} »
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Pas de note rédigée
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Questions Curiosités échangées */}
      {curiosities.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} color="#38bdf8" /> Questions Curiosité & Réponses
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {curiosities.map(c => (
              <div key={c.id} className="glass-card" style={{ padding: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {c.sender_first_name} à {c.receiver_first_name} :
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  « {c.question} »
                </div>
                {c.response && (
                  <div style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: '#7dd3fc',
                    fontStyle: 'italic'
                  }}>
                    « {c.response} »
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
