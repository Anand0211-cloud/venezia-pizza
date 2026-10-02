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
          height: '4px',
          width: '100%',
          background: 'linear-gradient(to right, #008c45 33.3%, #ffffff 33.3%, #ffffff 66.6%, #cd212a 66.6%)'
        }}
      />

      <style>{`
        .admin-login-header {
          background: #0f172a;
          color: #ffffff;
          padding: 14px 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        }
        .admin-login-header-inner {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .admin-login-back-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          border-radius: 8px;
          padding: 7px 12px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: background 0.15s ease;
          flex-shrink: 0;
        }
        .admin-login-back-btn:hover {
          background: rgba(255, 255, 255, 0.18);
        }
        .admin-login-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .admin-login-brand h1 {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.3px;
          color: #ffffff;
        }
        .admin-login-secure-badge {
          background: #e30613;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 12px;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .admin-login-subtitle {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 12px;
        }
        .admin-login-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 16px 48px;
        }
        .admin-login-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          overflow: hidden;
          animation: modalSlideUp 0.25s ease-out;
        }
        .admin-login-card-body {
          padding: 28px 24px 22px;
        }
        .back-text-mobile {
          display: none;
        }
        .back-text-desktop {
          display: inline;
        }

        @media (max-width: 640px) {
          .admin-login-header {
            padding: 10px 14px !important;
          }
          .admin-login-header-inner {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
          }
          .admin-login-back-btn {
            padding: 6px 10px !important;
            font-size: 12px !important;
            border-radius: 7px !important;
          }
          .back-text-desktop {
            display: none !important;
          }
          .back-text-mobile {
            display: inline !important;
          }
          .admin-login-brand h1 {
            font-size: 14.5px !important;
          }
          .admin-login-subtitle {
            display: none !important;
          }
          .admin-login-main {
            padding: 16px 12px 32px !important;
            align-items: flex-start !important;
          }
          .admin-login-card {
            border-radius: 14px !important;
          }
          .admin-login-card-body {
            padding: 22px 16px 18px !important;
          }
          .admin-login-icon-wrap {
            width: 46px !important;
            height: 46px !important;
            margin-bottom: 10px !important;
          }
          .admin-login-icon-wrap svg {
            width: 20px !important;
            height: 20px !important;
          }
          .admin-login-card h2 {
            font-size: 18px !important;
            margin-bottom: 4px !important;
          }
          .admin-login-card p {
            font-size: 12px !important;
          }
          .admin-login-submit-btn {
            padding: 11px 14px !important;
            font-size: 13.5px !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <header className="admin-login-header">
        <div className="admin-login-header-inner">
          <button
            type="button"
            className="admin-login-back-btn"
            onClick={onBackToStore}
          >
            <ArrowLeft size={15} />
            <span className="back-text-desktop">Zurück zum Shop</span>
            <span className="back-text-mobile">Shop</span>
          </button>

          <div className="admin-login-brand">
            <h1>Venezia Admin</h1>
            <span className="admin-login-secure-badge">
              <ShieldCheck size={11} />
              <span>Geschützt</span>
            </span>
          </div>

          <div className="admin-login-subtitle">
            <span>Pizzeria Venezia Plauen</span>
            <span>•</span>
            <span style={{ color: '#ffffff', fontWeight: '600' }}>Management</span>
          </div>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="admin-login-main">
        <div className="admin-login-card">
          {/* Italian Ribbon Inside Card Header Accent */}
          <div
            style={{
              height: '4px',
              width: '100%',
              background: 'linear-gradient(to right, #008c45 33.3%, #ffffff 33.3%, #ffffff 66.6%, #cd212a 66.6%)'
            }}
          />

          <div className="admin-login-card-body">
            {/* Header info */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                className="admin-login-icon-wrap"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#fff1f2',
                  color: '#e30613',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  boxShadow: '0 4px 14px rgba(227, 6, 19, 0.15)'
                }}
              >
                <Lock size={24} />
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: '21px', fontWeight: '800', color: '#0f172a' }}>
                Administrator-Anmeldung
              </h2>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>
                Melden Sie sich mit Ihren Zugangsdaten an, um Bestellungen, Speisekarte und Fahrer zu verwalten.
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
                className="admin-login-submit-btn"
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
