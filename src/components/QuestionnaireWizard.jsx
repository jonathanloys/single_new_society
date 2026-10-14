import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Sparkles, Shirt, Heart, MessageSquare, Compass, Shield } from 'lucide-react';

const INTEREST_CATEGORIES = [
  'Voyages et découvertes',
  'Culture, cinéma et musique',
  'Gastronomie et sorties',
  'Sport et activités',
  'Projets, ambitions et travail',
  'Société, idées et actualité',
  'Nature et mode de vie',
  'Art & Création',
];

const VALUE_OPTIONS = [
  'L’humour et l’autodérision',
  'La curiosité d’esprit',
  'La sincérité et loyauté',
  'La spontanéité',
  'La bienveillance et écoute',
  'L’ambition et le dépassement',
  'La découverte d’avis différents'
];

export function QuestionnaireWizard({ participant, initialQuestionnaire, onComplete }) {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Form states
  const [targetPref, setTargetPref] = useState(initialQuestionnaire?.target_preference || '');
  const [convStyle, setConvStyle] = useState(initialQuestionnaire?.conversation_style || 'Mélange de légèreté et de profondeur');
  const [spontaneity, setSpontaneity] = useState('Spontané');
  const [interests, setInterests] = useState(initialQuestionnaire?.interests || ['Culture, cinéma et musique', 'Gastronomie et sorties']);
  const [customInterest, setCustomInterest] = useState(initialQuestionnaire?.custom_interest || '');
  const [values, setValues] = useState(initialQuestionnaire?.values || ['La curiosité d’esprit', 'L’humour et l’autodérision']);
  const [outfit, setOutfit] = useState(initialQuestionnaire?.distinctive_outfit || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleInterest = (item) => {
    setInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleValue = (item) => {
    setValues(prev => prev.includes(item) ? prev.filter(v => v !== item) : [...prev, item]);
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!targetPref) {
        setError('Veuillez sélectionner qui vous souhaitez rencontrer pour continuer.');
        return;
      }
    }
    if (step === 3) {
      if (interests.length === 0) {
        setError('Sélectionnez au moins un centre d’intérêt.');
        return;
      }
    }
    if (step === 5) {
      if (!outfit.trim()) {
        setError('Veuillez indiquer un petit détail vestimentaire pour vous retrouver.');
        return;
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      submitForm();
    }
  };

  const submitForm = async () => {
    setSaving(true);
    setError('');
    try {
      await onComplete({
        target_preference: targetPref,
        conversation_style: `${convStyle} — Plutôt ${spontaneity.toLowerCase()}`,
        interests,
        custom_interest: customInterest,
        values,
        relational_expectations: values,
        distinctive_outfit: outfit.trim()
      });
    } catch (err) {
      setError(err.message || 'Erreur lors de l’enregistrement.');
      setSaving(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
      {/* Step progress bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>
          <span>Étape {step} sur {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            width: `${(step / totalSteps) * 100}%`,
            height: '100%',
            background: 'var(--primary-gradient)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* STEP 1: PREFERENCES DE RENCONTRE (MANDATORY) */}
      {step === 1 && (
        <div>
          <div className="badge badge-primary" style={{ marginBottom: '8px' }}>Question Obligatoire</div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Tu souhaites rencontrer…</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
            Cette information est strictement confidentielle. Elle garantit que les suggestions respectent toujours les souhaits des deux personnes.
          </p>

          <div
            className={`choice-card ${targetPref === 'femmes' ? 'selected' : ''}`}
            onClick={() => setTargetPref('femmes')}
          >
            <div>
              <strong style={{ fontSize: '16px' }}>Des femmes</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Proposez-moi des profils féminins</div>
            </div>
            {targetPref === 'femmes' && <Check size={20} color="#f43f5e" />}
          </div>

          <div
            className={`choice-card ${targetPref === 'hommes' ? 'selected' : ''}`}
            onClick={() => setTargetPref('hommes')}
          >
            <div>
              <strong style={{ fontSize: '16px' }}>Des hommes</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Proposez-moi des profils masculins</div>
            </div>
            {targetPref === 'hommes' && <Check size={20} color="#f43f5e" />}
          </div>

          <div
            className={`choice-card ${targetPref === 'deux' ? 'selected' : ''}`}
            onClick={() => setTargetPref('deux')}
          >
            <div>
              <strong style={{ fontSize: '16px' }}>Les deux</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ouvert(e) à toutes les belles rencontres</div>
            </div>
            {targetPref === 'deux' && <Check size={20} color="#f43f5e" />}
          </div>
        </div>
      )}

      {/* STEP 2: MANIERE D'ECHANGER */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Ton style d'échange</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
            Pour vous suggérer des personnes avec un rythme de conversation complémentaire.
          </p>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            Préfères-tu les discussions légères ou profondes ?
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
            {[
              'Discussions légères, rires et anecdotes',
              'Mélange de légèreté et de profondeur',
              'Conversations riches et passionnées dès le départ'
            ].map(opt => (
              <div
                key={opt}
                className={`choice-card ${convStyle === opt ? 'selected' : ''}`}
                onClick={() => setConvStyle(opt)}
                style={{ padding: '12px 14px' }}
              >
                <span style={{ fontSize: '14px' }}>{opt}</span>
                {convStyle === opt && <Check size={18} color="#f43f5e" />}
              </div>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            Dans une rencontre, es-tu plutôt…
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Spontané(e)', 'Réfléchi(e) et observateur', 'Un juste équilibre'].map(sp => (
              <button
                key={sp}
                type="button"
                className={`chip ${spontaneity === sp ? 'selected' : ''}`}
                onClick={() => setSpontaneity(sp)}
                style={{ flex: 1, textAlign: 'center' }}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: CENTRES D'INTERET */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Tes centres d'intérêt</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
            Sélectionne les thèmes qui te font vibrer (plusieurs choix possibles).
          </p>

          <div className="chip-grid">
            {INTEREST_CATEGORIES.map(cat => {
              const selected = interests.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  className={`chip ${selected ? 'selected' : ''}`}
                  onClick={() => toggleInterest(cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Un sujet ou une passion particulière ? (Optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Le jazz, la cuisine japonaise, le cinéma des 90s..."
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              maxLength={80}
            />
          </div>
        </div>
      )}

      {/* STEP 4: VALEURS & ATTENTES */}
      {step === 4 && (
        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Ce qui compte pour toi</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
            Quelles qualités ou dynamiques apprécies-tu particulièrement chez les autres ?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {VALUE_OPTIONS.map(val => {
              const selected = values.includes(val);
              return (
                <div
                  key={val}
                  className={`choice-card ${selected ? 'selected' : ''}`}
                  onClick={() => toggleValue(val)}
                  style={{ padding: '12px 14px' }}
                >
                  <span style={{ fontSize: '14px' }}>{val}</span>
                  {selected && <Check size={18} color="#f43f5e" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 5: SIGNE VESTIMENTAIRE DISTINCTIF (DERNIÈRE ÉTAPE) */}
      {step === 5 && (
        <div>
          <div className="badge badge-info" style={{ marginBottom: '8px' }}>
            <Shirt size={13} /> Repère Physique
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Un petit détail pour faciliter les rencontres</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
            Lorsque l'Application organisera une rencontre, elle vous indiquera une zone numérotée dans l'établissement. Pour vous retrouver facilement, indique-nous un détail permettant de te reconnaître pendant la soirée.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
              Quel signe distinctif porteras-tu ce soir ?
            </label>
            <input
              type="text"
              placeholder="Exemple : une chemise bleue, un gilet beige, des lunettes rouges..."
              value={outfit}
              onChange={(e) => setOutfit(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>

          <div style={{
            background: 'rgba(14, 165, 233, 0.1)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: '#7dd3fc',
            lineHeight: 1.5
          }}>
            <Shield size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
            <strong>Confidentialité garantie :</strong> Cette information sera communiquée uniquement à la personne avec laquelle une rencontre aura été confirmée, afin de vous permettre de vous reconnaître plus facilement. Elle ne sera pas affichée publiquement et reste modifiable à tout moment !
          </div>
        </div>
      )}

      {/* STEP 6: RÉSUMÉ ET VALIDATION */}
      {step === 6 && (
        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Prêt(e) pour la soirée !</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
            Vérifie tes réponses avant de finaliser. Tu pourras modifier ton signe vestimentaire à tout moment pendant la soirée.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Prénom d'usage : </span>
              <strong>{participant?.first_name}</strong>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Préférence de rencontre : </span>
              <strong>{targetPref === 'femmes' ? 'Des femmes' : targetPref === 'hommes' ? 'Des hommes' : 'Les deux'}</strong>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Centres d’intérêt : </span>
              <strong>{interests.join(', ')}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Signe distinctif : </span>
              <strong style={{ color: '#38bdf8' }}>« {outfit} »</strong>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            <ArrowLeft size={16} /> Retour
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          className="btn-primary"
          style={{ flex: step > 1 ? 2 : 1 }}
        >
          {saving ? 'Enregistrement...' : step === totalSteps ? 'Valider et commencer' : 'Continuer'}
          {step < totalSteps && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
