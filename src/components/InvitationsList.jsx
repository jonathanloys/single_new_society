import React, { useState } from 'react';
import { Mail, Check, X, ShieldAlert } from 'lucide-react';

export function InvitationsList({ invitations, onRespond, isResponding }) {
  if (!invitations || invitations.length === 0) return null;

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Mail size={16} color="#fb7185" />
        <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
          Invitation reçue ({invitations.length})
        </h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {invitations.map(inv => (
          <div
            key={inv.id}
            className="glass-card"
            style={{
              padding: '16px',
              borderLeft: '3px solid #f43f5e',
              background: 'rgba(244, 63, 94, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>
                  {inv.sender_first_name}
                </strong>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  aimerait te rencontrer !
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {new Date(inv.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onRespond(inv.id, false)}
                disabled={isResponding}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }}
              >
                <X size={14} /> Décliner discrètement
              </button>

              <button
                onClick={() => onRespond(inv.id, true)}
                disabled={isResponding}
                className="btn-primary"
                style={{ flex: 1.5, padding: '10px 14px', fontSize: '13px' }}
              >
                <Check size={14} /> Oui, rencontrer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
