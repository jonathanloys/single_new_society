import React, { useState, useEffect } from 'react';
import { User, Heart, Sparkles, Shirt, MessageSquare, Check, Copy, LogOut, CheckCircle, AlertCircle, Shield } from 'lucide-react';

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

export function ProfileView({ participant, questionnaire, onUpdateProfile, onLogout }) {
  const [firstName, setFirstName] = useState(participant?.first_name || '');
  const [targetPref, setTargetPref] = useState(questionnaire?.target_preference || 'deux');
  const [convStyle, setConvStyle] = useState(questionnaire?.conversation_style || 'Mélange de légèreté et de profondeur');
  const [interests, setInterests] = useState(questionnaire?.interests || []);
  const [customInterest, setCustomInterest] = useState(questionnaire?.custom_interest || '');
  const [values, setValues] = useState(questionnaire?.values || []);
  const [outfit, setOutfit] = useState(questionnaire?.distinctive_outfit || '');
  const [secretBrainNotes, setSecretBrainNotes] = useState(questionnaire?.secret_brain_notes || '');
  const [mood, setMood] = useState(questionnaire?.mood || 'Détendu(e) et curieux(se)');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (participant) {
      setFirstName(participant.first_name || '');
    }
  }, [participant]);

  useEffect(() => {
    if (questionnaire) {
      setTargetPref(questionnaire.target_preference || 'deux');
      setConvStyle(questionnaire.conversation_style || 'Mélange de légèreté et de profondeur');
      setInterests(questionnaire.interests || []);
      setCustomInterest(questionnaire.custom_interest || '');
      setValues(questionnaire.values || []);
      setOutfit(questionnaire.distinctive_outfit || '');
      setSecretBrainNotes(questionnaire.secret_brain_notes || '');
      setMood(questionnaire.mood || 'Détendu(e) et curieux(se)');
    }
  }, [questionnaire]);

  const toggleInterest = (cat) => {
    setInterests(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const toggleValue = (val) => {
    setValues(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    if (!firstName.trim()) {
      setSaveError('Le prénom est obligatoire.');
      return;
    }

    if (!['femmes', 'hommes', 'deux'].includes(targetPref)) {
      setSaveError('Veuillez sélectionner vos préférences de rencontre (Femmes, Hommes, ou Les deux).');
      return;
    }

    if (!outfit.trim()) {
      setSaveError('Veuillez indiquer un signe vestimentaire pour vous retrouver facilement.');
      return;
    }

    setSaving(true);
    try {
      await onUpdateProfile({
        first_name: firstName.trim(),
        target_preference: targetPref,
        conversation_style: convStyle,
        interests,
        custom_interest: customInterest.trim(),
        values,
        distinctive_outfit: outfit.trim(),
        secret_brain_notes: secretBrainNotes.trim(),
        mood
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* Header card */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="badge badge-primary">
            <User size={13} /> Mon profil
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Modifiable à tout moment
          </span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
          {firstName || participant?.first_name}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
          Consulte et ajuste tes réponses à tout moment. Tes préférences de rencontre et ton signe vestimentaire sont actualisés en temps réel.
        </p>

        {/* Code de secours */}
        <div style={{
          marginTop: '16px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ton code d'accès personnel
            </span>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#fb7185', letterSpacing: '0.06em' }}>
              {participant?.access_code}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (participant?.access_code) {
                navigator.clipboard.writeText(participant.access_code);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }
            }}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <Copy size={13} /> {copiedCode ? 'Copié !' : 'Copier'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#6ee7b7',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 600
        }}>
          <CheckCircle size={18} /> Vos modifications ont bien été enregistrées !
        </div>
      )}

      {saveError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px'
        }}>
          <AlertCircle size={18} /> {saveError}
        </div>
      )}

      {/* Formulaire complet */}
      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Prénom */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Prénom d'usage
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ton prénom..."
            maxLength={40}
            required
          />
        </div>

        {/* Préférences de rencontre */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
            Préférences de rencontre
          </label>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '10px' }}>
            Strictement confidentiel. Deux personnes ne peuvent être mises en relation que si leurs préférences sont mutuellement compatibles.
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { val: 'femmes', label: 'Des femmes', desc: 'Recevoir uniquement des suggestions de profils féminins' },
              { val: 'hommes', label: 'Des hommes', desc: 'Recevoir uniquement des suggestions de profils masculins' },
              { val: 'deux', label: 'Les deux', desc: 'Ouvert(e) aux rencontres avec des femmes et des hommes' }
            ].map(opt => (
              <div
                key={opt.val}
                className={`choice-card ${targetPref === opt.val ? 'selected' : ''}`}
                onClick={() => setTargetPref(opt.val)}
                style={{ padding: '12px 14px' }}
              >
                <div>
                  <strong style={{ fontSize: '14px' }}>{opt.label}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{opt.desc}</div>
                </div>
                {targetPref === opt.val && <Check size={18} color="#f43f5e" />}
              </div>
            ))}
          </div>
        </div>

        {/* Signe vestimentaire */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>
              Signe vestimentaire
            </label>
            <span style={{ fontSize: '11px', color: '#38bdf8' }}>
              <Shirt size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
              Modifiable à tout moment
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '8px' }}>
            Un détail permettant de te repérer dans la zone de rencontre (ex: veste bordeaux, chemise blanche, lunettes rondes).
          </span>
          <input
            type="text"
            value={outfit}
            onChange={(e) => setOutfit(e.target.value)}
            placeholder="Ex : Je porte une chemise bleue en lin..."
            maxLength={100}
            required
          />

          <div style={{
            marginTop: '8px',
            background: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#7dd3fc',
            lineHeight: 1.4
          }}>
            <Shield size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
            <strong>Règle de discrétion :</strong> Ce signe n'est jamais public et ne sera révélé à l'autre personne qu'après acceptation mutuelle de la rencontre.
          </div>
        </div>

        {/* Centres d'intérêt */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Centres d'intérêt
          </label>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '10px' }}>
            Utilisés pour générer une phrase personnalisée lors des suggestions.
          </span>

          <div className="chip-grid" style={{ marginBottom: '10px' }}>
            {INTEREST_CATEGORIES.map(cat => {
              const isSelected = interests.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  className={`chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleInterest(cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            placeholder="Autre passion ou sujet qui te tient à cœur (optionnel)..."
            maxLength={80}
            style={{ fontSize: '13px' }}
          />
        </div>

        {/* Style d'échange */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Style d'échange & conversation
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Discussions légères, rires et anecdotes',
              'Mélange de légèreté et de profondeur',
              'Conversations riches et passionnées dès le départ'
            ].map(style => (
              <div
                key={style}
                className={`choice-card ${convStyle.startsWith(style) ? 'selected' : ''}`}
                onClick={() => setConvStyle(style)}
                style={{ padding: '10px 14px' }}
              >
                <span style={{ fontSize: '13px' }}>{style}</span>
                {convStyle.startsWith(style) && <Check size={16} color="#f43f5e" />}
              </div>
            ))}
          </div>
        </div>

        {/* Valeurs */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Ce qui compte pour toi
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {VALUE_OPTIONS.map(val => {
              const isSelected = values.includes(val);
              return (
                <div
                  key={val}
                  className={`choice-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleValue(val)}
                  style={{ padding: '10px 14px' }}
                >
                  <span style={{ fontSize: '13px' }}>{val}</span>
                  {isSelected && <Check size={16} color="#f43f5e" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Message secret pour le cerveau de l'app */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Confidences pour le cerveau de l'application
          </label>
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#c7d2fe',
            marginBottom: '8px',
            lineHeight: 1.5
          }}>
            <strong>100% Confidentiel :</strong> Aucun organisateur ni participant n'a accès à ce texte. Il sert exclusivement au moteur algorithmique pour affiner les suggestions selon ta sensibilité.
          </div>
          <textarea
            rows="3"
            value={secretBrainNotes}
            onChange={(e) => setSecretBrainNotes(e.target.value)}
            placeholder="Dis au cerveau de l'app ce qui te caractérise ou ce que tu aimerais trouver..."
            style={{ fontSize: '13px', lineHeight: 1.5 }}
          />
        </div>

        {/* Bouton d'enregistrement */}
        <div style={{ paddingTop: '8px' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
          >
            {saving ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>

      {/* Déconnexion */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={onLogout}
          className="btn-secondary"
          style={{ padding: '8px 16px', fontSize: '13px', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          <LogOut size={14} /> Déconnexion de ma session
        </button>
      </div>
    </div>
  );
}
