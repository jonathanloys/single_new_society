import React, { useState } from 'react';
import { ShieldCheck, Lock, EyeOff, Clock, UserCheck, AlertCircle } from 'lucide-react';

export function PrivacyModal({ isOpen, onClose, onAccept }) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            color: '#818cf8'
          }}>
            <ShieldCheck size={30} />
          </div>
          <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>Transparence et Protection de vos Données</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Avant de préparer votre soirée, voici exactement comment vos informations sont protégées et utilisées.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Lock size={18} style={{ color: '#fb7185', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--text-main)', display: 'block' }}>Zéro donnée intrusive en V1</strong>
              Aucun nom de famille, email, téléphone ou compte de réseau social n'est demandé. Seul votre prénom d'usage est partagé.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <EyeOff size={18} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--text-main)', display: 'block' }}>Préférences et réponses strictement privées</strong>
              Vos préférences de rencontre (« femmes », « hommes », « les deux ») et vos réponses détaillées ne sont JAMAIS affichées publiquement. Elles servent uniquement au moteur pour vous proposer des personnes pertinentes.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <UserCheck size={18} style={{ color: '#34d399', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--text-main)', display: 'block' }}>Signe vestimentaire sous protection mutuelle</strong>
              Le petit détail vestimentaire que vous indiquerez ne sera révélé qu'à une personne avec laquelle vous avez TOUS LES DEUX confirmé l'envie de vous rencontrer.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Clock size={18} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--text-main)', display: 'block' }}>Durée de conservation & Suppression</strong>
              Les données sont conservées uniquement pour le déroulement de la soirée pilote. Vous disposez d'un droit de suppression immédiate sur simple demande à l'organisateur.
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid #6366f1',
            fontSize: '12px'
          }}>
            <strong>Important :</strong> Nous ne prétendons pas offrir un anonymat absolu : dans le contexte physique d'une soirée, un prénom et une tenue permettent naturellement de se repérer.
          </div>
        </div>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px',
          padding: '12px',
          background: 'rgba(99, 102, 241, 0.1)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          border: '1px solid rgba(99, 102, 241, 0.25)'
        }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#f43f5e' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
            J'ai lu et j'accepte le traitement de mes réponses pour cette soirée.
          </span>
        </label>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {onClose && (
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Retour
            </button>
          )}
          <button
            onClick={() => {
              if (agreed) onAccept();
            }}
            disabled={!agreed}
            className="btn-primary"
            style={{ flex: 2, opacity: agreed ? 1 : 0.5 }}
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
