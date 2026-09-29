import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Safe patch for Google Translate / browser extension DOM mutations in React
if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Intercepted React removeChild mismatch (caused by translation or autofill extension)', child, this);
      }
      if (child.parentNode) {
        return child.parentNode.removeChild(child);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Intercepted React insertBefore mismatch (caused by translation or autofill extension)', referenceNode, this);
      }
      if (referenceNode.parentNode) {
        return referenceNode.parentNode.insertBefore(newNode, referenceNode);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

window.addEventListener('error', (event) => {
  console.error('Captured window error:', event.error || event.message);
  const root = document.getElementById('root');
  if (root && root.children.length === 0) {
    root.innerHTML = `
      <div style="background:#1e293b;color:#f8fafc;padding:32px;font-family:system-ui,sans-serif;min-height:100vh;">
        <h2 style="color:#ef4444;margin-top:0;">⚠️ JavaScript Error on Client</h2>
        <p style="font-size:16px;"><b>${event.message}</b></p>
        <p style="color:#94a3b8;font-size:13px;">${event.filename}:${event.lineno}:${event.colno}</p>
        <pre style="background:#0b0f19;padding:16px;border-radius:8px;overflow:auto;color:#f87171;font-size:13px;">${event.error?.stack || 'No stack trace'}</pre>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Captured unhandled promise rejection:', event.reason);
});

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0f172a',
          color: '#f8fafc',
          padding: '40px 24px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', background: '#1e293b', borderRadius: '12px', padding: '32px', border: '1px solid #334155' }}>
            <h2 style={{ color: '#ef4444', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              ⚠️ Anwendungsfehler (Application Glitch)
            </h2>
            <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' }}>
              Beim Laden ist ein Fehler aufgetreten:
            </p>
            <div style={{ background: '#0b0f19', padding: '16px', borderRadius: '8px', color: '#f87171', fontFamily: 'monospace', fontSize: '13px', margin: '16px 0', overflowX: 'auto' }}>
              {this.state.error?.toString()}
            </div>
            <pre style={{ background: '#0b0f19', padding: '16px', borderRadius: '8px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11.5px', overflowX: 'auto', maxHeight: '200px' }}>
              {this.state.errorInfo?.componentStack || this.state.error?.stack}
            </pre>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => { window.location.href = '/'; }}
                style={{ background: '#e11d48', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '700', cursor: 'pointer' }}
              >
                Zur Startseite neu laden
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>,
)

