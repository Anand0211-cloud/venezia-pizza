import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { signInAdminUser } from '../lib/supabaseClient';

export default function AdminLogin({ onLoginSuccess, onBackToStore }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Bitte geben Sie E-Mail-Adresse und Passwort ein.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Authenticate directly through Supabase Auth backend (no browser/frontend credential check)
      const res = await signInAdminUser({
        email: email.trim(),
        password: password
      });

      if (res.success && res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        setError(res.error || 'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Verbindungsfehler beim Anmelden an Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="admin-login-page"
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* Italian Ribbon Top Accent (matching frontend Navbar & Account page) */}
      <div
        style={{
          height: '5px',
          width: '100%',
          background: 'linear-gradient(to right, #008c45 33.3%, #ffffff 33.3%, #ffffff 66.6%, #cd212a 66.6%)'
        }}
      />

      {/* Header Bar matching AccountPage.jsx / Store Header */}
      <header
        style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '18px 20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)'
        }}
      >
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={onBackToStore}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <ArrowLeft size={16} />
              <span>Zurück zum Shop</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' }}>
                Venezia Admin-Portal
              </h1>
              <span
                style={{
                  background: '#e30613',
                  color: '#ffffff',
                  fontSize: '10.5px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase'
                }}
              >
                Geschützt
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12.5px' }}>
            <span>Pizzeria Venezia Plauen</span>
            <span>•</span>
            <span style={{ color: '#ffffff', fontWeight: '600' }}>Management</span>
          </div>
        </div>
      </header>

      {/* Main Login Container */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '36px 16px 64px'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 10px 35px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            animation: 'modalSlideUp 0.25s ease-out'
          }}
        >
          {/* Italian Ribbon Inside Card Header Accent */}
          <div
            style={{
              height: '4px',
              width: '100%',
              background: 'linear-gradient(to right, #008c45 33.3%, #ffffff 33.3%, #ffffff 66.6%, #cd212a 66.6%)'
            }}
          />

          <div style={{ padding: '32px 28px 24px' }}>
            {/* Header info matching AccountModal / AccountPage */}
            <div style={{ textAlign: 'center', marginBottom: '26px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#fff1f2',
                  color: '#e30613',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 4px 14px rgba(227, 6, 19, 0.15)'
                }}
              >
                <Lock size={26} />
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                Administrator-Anmeldung
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Melden Sie sich mit Ihren autorisierten Zugangsdaten an, um Bestellungen, Speisekarte und Fahrer zu verwalten.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                style={{
                  background: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  lineHeight: 1.4
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              {/* Email Input */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="admin-email"
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    color: '#334155',
                    marginBottom: '6px'
                  }}
                >
                  Administrator-E-Mail *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    color="#94a3b8"
                    style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@veneziapizzas.de"
                    autoComplete="username"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 12px 11px 38px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#e30613';
                      e.target.style.boxShadow = '0 0 0 3px rgba(227, 6, 19, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  htmlFor="admin-password"
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    color: '#334155',
                    marginBottom: '6px'
                  }}
                >
                  Passwort *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    color="#94a3b8"
                    style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 40px 11px 38px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#e30613';
                      e.target.style.boxShadow = '0 0 0 3px rgba(227, 6, 19, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button matching AccountModal / AccountPage */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--red, #e30613)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '13px 18px',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(227, 6, 19, 0.3)',
                  transition: 'all 0.15s ease',
                  opacity: loading ? 0.75 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#c9000b';
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(227, 6, 19, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'var(--red, #e30613)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(227, 6, 19, 0.3)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Wird angemeldet...</span>
                  </>
                ) : (
                  <>
                    <span>Im Admin-Portal anmelden</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card Footer matching Frontend UI */}
          <div
            style={{
              background: '#f8fafc',
              borderTop: '1px solid #f1f5f9',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              fontSize: '12px',
              color: '#64748b'
            }}
          >
            <ShieldCheck size={15} color="#15803d" />
            <span>Geschützt via Supabase PostgreSQL Auth API</span>
          </div>
        </div>
      </main>
    </div>
  );
}
