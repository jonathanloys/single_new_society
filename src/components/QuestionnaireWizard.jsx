import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Sparkles, Shirt, Heart, MessageSquare, Compass, Shield, Lock, Smile, Zap } from 'lucide-react';

const INTEREST_CATEGORIES = [
  'Voyages et découvertes',
  'Culture, cinéma et séries',
  'Gastronomie, vins et sorties',
  'Musique, concerts et festivals',
  'Sport, outdoor et bien-être',
  'Projets, ambitions et entrepreneuriat',
  'Société, idées et actualité',
  'Nature et mode de vie éco',
  'Art, design & création',
  'Lectures et développement personnel',
  'Jeux, tech & univers geek',
  'Fêtes, danse et vie nocturne'
];

const VALUE_OPTIONS = [
  'L’humour et l’autodérision',
  'La curiosité d’esprit',
  'La sincérité et loyauté',
  'La spontanéité',
  'La bienveillance et l’écoute',
  'L’ambition et le dépassement',
  'L’ouverture d’esprit'
];

const MOOD_OPTIONS = [
  { id: 'zen', label: 'Détendu(e) et curieux(se)', sub: 'Pour passer un moment agréable et sans pression' },
  { id: 'energie', label: 'Plein(e) d’énergie et sociable', sub: 'Très ouvert(e) aux discussions et aux rires' },
  { id: 'observe', label: 'Un peu réservé(e) au départ', sub: 'Besoin d’un petit temps pour observer et être à l’aise' },
  { id: 'deconnexion', label: 'Envie de décompresser', sub: 'Profiter de la soirée et laisser faire le feeling' }
];

const ATTRACTION_TRAITS = [
  'Le regard, le sourire et l’énergie chaleureuse',
  'L’humour fin et la répartie spontanée',
  'L’écoute sincère et la douceur dans l’échange',
  'La passion quand la personne parle de ce qui l’anime',
  'La simplicité naturelle et l’authenticité sans filtre',
  'La vivacité d’esprit et la culture générale'
];

export function QuestionnaireWizard({ participant, initialQuestionnaire, onComplete }) {
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Form states
  const [targetPref, setTargetPref] = useState(initialQuestionnaire?.target_preference || '');
  const [mood, setMood] = useState(initialQuestionnaire?.mood || 'Détendu(e) et curieux(se)');
  const [convStyle, setConvStyle] = useState(initialQuestionnaire?.conversation_style || 'Mélange de légèreté et de profondeur');
  const [spontaneity, setSpontaneity] = useState('Spontané');
  const [interests, setInterests] = useState(initialQuestionnaire?.interests || ['Culture, cinéma et séries', 'Gastronomie, vins et sorties']);
  const [customInterest, setCustomInterest] = useState(initialQuestionnaire?.custom_interest || '');
  const [attractionTraits, setAttractionTraits] = useState(initialQuestionnaire?.attraction_traits || ['Le regard, le sourire et l’énergie chaleureuse']);
  const [values, setValues] = useState(initialQuestionnaire?.values || ['La curiosité d’esprit', 'L’humour et l’autodérision']);
  const [secretBrainNotes, setSecretBrainNotes] = useState(initialQuestionnaire?.secret_brain_notes || '');
  const [outfit, setOutfit] = useState(initialQuestionnaire?.distinctive_outfit || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleInterest = (item) => {
    setInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleValue = (item) => {
    setValues(prev => prev.includes(item) ? prev.filter(v => v !== item) : [...prev, item]);
  };

  const toggleAttractionTrait = (trait) => {
    setAttractionTraits(prev => prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]);
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
    if (step === 6) {
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
        mood,
        conversation_style: `${convStyle} — Plutôt ${spontaneity.toLowerCase()}`,
        interests,
        custom_interest: customInterest,
        attraction_traits: attractionTraits,
        values,
        relational_expectations: values,
        secret_brain_notes: secretBrainNotes.trim(),
        distinctive_outfit: outfit.trim()
      });
    } catch (err) {
      setError(err.message || 'Erreur lors de l’enregistrement.');
      setSaving(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '540px', margin: '0 auto', padding: '24px' }}>
      {/* Step progress bar */}
      <div style={{ marginBottom: '22px' }}>
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

      {/* ========================================================
          STEP 1: PREFERENCES DE RENCONTRE (MANDATORY)
          ======================================================== */}
      {step === 1 && (
        <div>
          <div className="badge badge-primary" style={{ marginBottom: '8px' }}>Question Obligatoire</div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'var(--text-main)' }}>Tu souhaites rencontrer…</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
            Cette information est strictement confidentielle. Elle garantit que les suggestions respectent toujours les souhaits des deux personnes.
          </p>

          <div
            className={`choice-card ${targetPref === 'femmes' ? 'selected' : ''}`}
            onClick={() => setTargetPref('femmes')}
            style={{ marginBottom: '10px', cursor: 'pointer' }}
          >
            <div>
              <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>Des femmes</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Proposez-moi des profils féminins</div>
            </div>
            {targetPref === 'femmes' && <Check size={20} color="#f43f5e" />}
          </div>

          <div
            className={`choice-card ${targetPref === 'hommes' ? 'selected' : ''}`}
            onClick={() => setTargetPref('hommes')}
            style={{ marginBottom: '10px', cursor: 'pointer' }}
          >
            <div>
              <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>Des hommes</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Proposez-moi des profils masculins</div>
            </div>
            {targetPref === 'hommes' && <Check size={20} color="#f43f5e" />}
          </div>

          <div
            className={`choice-card ${targetPref === 'deux' ? 'selected' : ''}`}
            onClick={() => setTargetPref('deux')}
            style={{ marginBottom: '10px', cursor: 'pointer' }}
          >
            <div>
              <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>Les deux</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ouvert(e) à toutes les belles rencontres</div>
            </div>
            {targetPref === 'deux' && <Check size={20} color="#f43f5e" />}
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 2: ENERGIE & STYLE D'ECHANGE
          ======================================================== */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'var(--text-main)' }}>Ton énergie & ton rythme</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '18px', lineHeight: 1.5 }}>
            Pour vous suggérer des personnes dans une dynamique harmonieuse ce soir.
          </p>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
            Dans quel état d'esprit abordes-tu cette soirée ?
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {MOOD_OPTIONS.map(opt => (
              <div
                key={opt.id}
                className={`choice-card ${mood === opt.label ? 'selected' : ''}`}
                onClick={() => setMood(opt.label)}
                style={{ padding: '10px 14px', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opt.sub}</div>
                </div>
                {mood === opt.label && <Check size={18} color="#f43f5e" />}
              </div>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
            Ton style de discussion préféré :
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
            {[
              'Discussions légères, rires et anecdotes spontanées',
              'Mélange de légèreté et de profondeur',
              'Conversations riches et passionnées dès le début'
            ].map(opt => (
              <div
                key={opt}
                className={`choice-card ${convStyle === opt ? 'selected' : ''}`}
                onClick={() => setConvStyle(opt)}
                style={{ padding: '10px 14px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{opt}</span>
                {convStyle === opt && <Check size={18} color="#f43f5e" />}
              </div>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
            Dans une rencontre, es-tu plutôt…
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Spontané(e)', 'Réfléchi(e) & observateur', 'Un juste équilibre'].map(sp => (
              <button
                key={sp}
                type="button"
                className={`chip ${spontaneity === sp ? 'selected' : ''}`}
                onClick={() => setSpontaneity(sp)}
                style={{ flex: 1, textAlign: 'center', fontSize: '12px', padding: '8px 4px' }}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 3: CENTRES D'INTERET ELARGIS
          ======================================================== */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'var(--text-main)' }}>Tes centres d'intérêt</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}>
            Sélectionne les thèmes qui te font vibrer pour trouver des affinités naturelles.
          </p>

          <div className="chip-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
            {INTEREST_CATEGORIES.map(cat => {
              const selected = interests.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  className={`chip ${selected ? 'selected' : ''}`}
                  onClick={() => toggleInterest(cat)}
                  style={{ fontSize: '13px' }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Une passion spécifique ou un sujet favori ? (Optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Le cinéma des années 90, la salsa, la rando en montagne, le jazz..."
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 4: ATTIRANCE & VALEURS
          ======================================================== */}
      {step === 4 && (
        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'var(--text-main)' }}>Ce qui te touche chez quelqu'un</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}>
            Quelles attitudes ou dynamiques retiennent particulièrement ton attention ?
          </p>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
            Ce qui te séduit lors d'un premier échange :
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {ATTRACTION_TRAITS.map(trait => {
              const selected = attractionTraits.includes(trait);
              return (
                <div
                  key={trait}
                  className={`choice-card ${selected ? 'selected' : ''}`}
                  onClick={() => toggleAttractionTrait(trait)}
                  style={{ padding: '10px 14px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{trait}</span>
                  {selected && <Check size={18} color="#f43f5e" />}
                </div>
              );
            })}
          </div>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
            Les valeurs qui te parlent :
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {VALUE_OPTIONS.map(val => {
              const selected = values.includes(val);
              return (
                <button
                  key={val}
                  type="button"
                  className={`chip ${selected ? 'selected' : ''}`}
                  onClick={() => toggleValue(val)}
                  style={{ fontSize: '12px' }}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 5: ZONE LIBRE SECRETE POUR LE CERVEAU DE L'APP
          ======================================================== */}
      {step === 5 && (
        <div>
          <div className="badge badge-info" style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} /> Moteur d'affinités
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'var(--text-main)' }}>
            Un mot pour le cerveau de l'application
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}>
            Partage librement ce qui est important pour toi. Plus tu es sincère, plus l'application saura te guider vers les bonnes personnes.
          </p>

          {/* Privacy reassurance banner */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#c7d2fe',
              lineHeight: 1.6
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#a5b4fc', marginBottom: '4px' }}>
              <Lock size={15} /> 100% Confidentiel — Strictement aucun regard humain
            </div>
            <div>
              <strong>Personne ne lira jamais ce que tu écris ici</strong> : ni les organisateurs, ni aucun autre participant. Ce texte est analysé uniquement par l’intelligence algorithmique de l'application afin de capter ta personnalité, tes affinités et ce que tu espères d'une rencontre.
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
              Dis-nous ce qui te caractérise ou ce que tu aimerais trouver :
            </label>
            <textarea
              rows="5"
              placeholder="Exemple : J’adore rire de tout, je suis passionné(e) par la musique live, je recherche quelqu’un qui a le sens de l’écoute et de l’humour, je suis un peu timide les 5 premières minutes puis très bavard(e)..."
              value={secretBrainNotes}
              onChange={(e) => setSecretBrainNotes(e.target.value)}
              style={{
                fontSize: '14px',
                lineHeight: 1.5,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)'
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'right' }}>
            {secretBrainNotes.length} caractères (optionnel mais vivement recommandé)
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 6: SIGNE VESTIMENTAIRE DISTINCTIF
          ======================================================== */}
      {step === 6 && (
        <div>
          <div className="badge badge-info" style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Shirt size={13} /> Repère Physique
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'var(--text-main)' }}>
            Un petit détail pour se retrouver
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
            Lorsqu'une rencontre mutuelle est confirmée, l'application vous assignera une zone numérotée dans le lieu. Ce détail permettra à l'autre personne de te repérer immédiatement.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Quel signe distinctif porteras-tu ce soir ? *
            </label>
            <input
              type="text"
              placeholder="Exemple : une veste en velours bleu, des baskets rouges, un pull vert sauge..."
              value={outfit}
              onChange={(e) => setOutfit(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>

          <div style={{
            background: 'rgba(14, 165, 233, 0.1)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: '#7dd3fc',
            lineHeight: 1.5
          }}>
            <Shield size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
            <strong>Révélé uniquement après accord mutuel :</strong> Ce détail n'est JAMAIS affiché publiquement. Il n'est transmis qu'à une personne avec qui vous avez tous les deux accepté d'échanger.
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 7: RESUME ET VALIDATION
          ======================================================== */}
      {step === 7 && (
        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'var(--text-main)' }}>Tout est prêt !</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
            Voici un récapitulatif de ton profil. Tu pourras ajuster ton signe vestimentaire à tout moment pendant la soirée.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Prénom d'usage : </span>
              <strong style={{ color: 'var(--text-main)' }}>{participant?.first_name}</strong>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Préférence de rencontre : </span>
              <strong style={{ color: 'var(--text-main)' }}>
                {targetPref === 'femmes' ? 'Des femmes' : targetPref === 'hommes' ? 'Des hommes' : 'Les deux'}
              </strong>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-dim)' }}>État d’esprit ce soir : </span>
              <strong style={{ color: 'var(--text-main)' }}>{mood}</strong>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Centres d’intérêt : </span>
              <strong style={{ color: 'var(--text-main)' }}>{interests.join(', ')}</strong>
            </div>
            {secretBrainNotes && (
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Message secret pour le cerveau de l'app : </span>
                <span style={{ color: '#a5b4fc', fontStyle: 'italic' }}>✓ Enregistré en toute confidentialité</span>
              </div>
            )}
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
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> Retour
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          className="btn-primary"
          style={{ flex: step > 1 ? 2 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {saving ? 'Enregistrement...' : step === totalSteps ? 'Valider et commencer' : 'Continuer'}
          {step < totalSteps && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
