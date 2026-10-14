import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, MessageSquare, Star, Shield, Lock, CheckCircle2 } from 'lucide-react';

export function PersonalRecapView({ token }) {
  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/participant/recap', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setRecap(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>Chargement de votre récapitulatif...</div>;
  }

  if (!recap) return null;

  const { event_status, meetings = [], curiosities = [], interested_in_me = [], mutual_matches = [] } = recap;
  const isRevealed = event_status === 'revealed';

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      <div className="glass-card" style={{ marginBottom: '20px', borderTop: '3px solid #6366f1' }}>
        <div className="badge badge-info" style={{ marginBottom: '8px' }}>
          <Sparkles size={12} /> Bilan Personnel de la Soirée
        </div>
        <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Ton Récapitulatif Privé</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5 }}>
          Retrouve ici toutes les personnes avec lesquelles tu as partagé un moment ce soir, tes notes secrètes et les intérêts confirmés.
        </p>
      </div>

      {/* REVELATION SECTION (If revealed) */}
      {isRevealed ? (
        <div style={{ marginBottom: '20px' }}>
          {/* Mutual matches */}
          {mutual_matches.length > 0 && (
            <div className="glass-card highlight" style={{ marginBottom: '14px', background: 'rgba(244, 63, 94, 0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fb7185', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
                <Sparkles size={20} />
                C'est réciproque ! ({mutual_matches.length})
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Vous avez tous les deux exprimé le souhait de poursuivre la discussion :
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

          {/* Unilateral interests */}
          {interested_in_me.length > 0 && (
            <div className="glass-card" style={{ marginBottom: '14px', borderLeft: '3px solid #38bdf8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
                <Heart size={18} />
                Souhaite(nt) te revoir ({interested_in_me.length})
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Ces personnes ont aimé votre conversation et aimeraient poursuivre le contact avec toi :
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

          {mutual_matches.length === 0 && interested_in_me.length === 0 && (
            <div className="glass-card" style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Aucun intérêt partagé n'a été enregistré pour le moment. L'important reste les belles conversations et rencontres spontanées de la soirée !
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card" style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.03)', textAlign: 'center', padding: '20px' }}>
          <Lock size={20} color="#fbbf24" style={{ margin: '0 auto 8px auto' }} />
          <strong style={{ display: 'block', fontSize: '15px', marginBottom: '4px' }}>
            Révélation des affinités bientôt disponible
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            L'organisateur ouvrira la phase de révélation à la fin de la soirée. Vos choix restent scellés d'ici là.
          </span>
        </div>
      )}

      {/* MEETINGS & PRIVATE NOTES */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={16} color="#f59e0b" /> Rencontres & Notes personnelles
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
                    <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 600 }}>
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
                    marginTop: '6px'
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

      {/* CURIOSITIES HISTORY */}
      {curiosities.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} color="#38bdf8" /> Historique des Curiosités
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
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#7dd3fc', fontStyle: 'italic' }}>
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
