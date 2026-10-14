import React from 'react';
import { Users, Shield, RefreshCw, UserCheck, Sparkles } from 'lucide-react';

export function DemoSwitcher({
  demoParticipants,
  currentParticipant,
  onSelectParticipant,
  onOpenAdmin,
  isAdmin,
  onResetDemo,
  isResetting
}) {
  return (
    <div className="demo-switcher">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="badge badge-primary" style={{ padding: '2px 8px', fontSize: '10px' }}>
          <Sparkles size={12} /> MODE PILOTE / DÉMO
        </span>
        <select
          className="demo-select"
          value={isAdmin ? 'admin' : (currentParticipant?.id || '')}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'admin') {
              onOpenAdmin();
            } else if (val === 'new') {
              onSelectParticipant(null);
            } else {
              const p = demoParticipants.find(dp => dp.id === val);
              if (p) onSelectParticipant(p);
            }
          }}
        >
          <option value="new">+ Nouveau participant (Inscription)</option>
          <optgroup label="Participants Fictifs (Soirée Démo)">
            {demoParticipants.map(dp => (
              <option key={dp.id} value={dp.id}>
                {dp.first_name} ({dp.gender === 'femme' ? 'F' : 'H'} · {dp.active_meetings_count > 0 ? 'En rencontre' : `${dp.pending_invitations_count} inv.`})
              </option>
            ))}
          </optgroup>
          <optgroup label="Gestion">
            <option value="admin">Espace Administrateur ⚙️</option>
          </optgroup>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onResetDemo}
          disabled={isResetting}
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
          title="Réinitialiser les données de démonstration"
        >
          <RefreshCw size={12} className={isResetting ? 'spin' : ''} />
          {isResetting ? 'Reset...' : 'Réinitialiser'}
        </button>

        <button
          onClick={onOpenAdmin}
          className={isAdmin ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
        >
          <Shield size={12} />
          Admin
        </button>
      </div>
    </div>
  );
}
