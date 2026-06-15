import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';

/* ═══════════════════════════════════════════════════════════════
   REST POINT — Portal Login (Family Portal)
   Consistent theme with Landing Page (Navy + Gold + White)
   Detects tenant from phone number (next of kin lookup)
   ═══════════════════════════════════════════════════════════════ */

const C = {
  navy900: '#0A1F3D',
  navy800: '#0F2847',
  navy700: '#1a3a52',
  navy50:  '#F9FAFB',
  char900: '#111827',
  char700: '#374151',
  char600: '#4B5563',
  char500: '#6B7280',
  char300: '#D1D5DB',
  char200: '#E5E7EB',
  char100: '#F3F4F6',
  gold:    '#A67C52',
  goldL:   '#C9A876',
  goldD:   '#8B6340',
  emerald: '#059669',
  emeraldL:'#10B981',
};

function PortalLoginPage() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Format phone number as XXX XXX XXX
  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (message.text) setMessage({ type: '', text: '' });
  };

  const getRawPhoneDigits = () => phoneNumber.replace(/\D/g, '');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const rawDigits = getRawPhoneDigits();

    if (!rawDigits || rawDigits.length < 10) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid 10-digit phone number'
      });
      setIsLoading(false);
      return;
    }

    try {
      // Call the portal login API - it will:
      // 1. Find deceased with next of kin matching this phone
      // 2. Return the tenant slug for that deceased
      // 3. Return session token and deceased info
      const data = await authApi.portalLogin({
        phone: rawDigits
      });

      if (data && data.success) {
        // Store session data
        localStorage.setItem('sessionToken', data.sessionToken || data.session_token);
        localStorage.setItem('tenantSlug', data.tenantSlug);
        localStorage.setItem('deceasedId', data.deceased?.deceased_id);
        
        if (data.deceased) {
          localStorage.setItem('deceased', JSON.stringify(data.deceased));
        }

        setMessage({ type: 'success', text: 'Welcome. Redirecting...' });

        // Redirect to the correct tenant's portal
        setTimeout(() => {
          navigate(`/portal/${data.tenantSlug}/dashboard`);
        }, 1500);

      } else {
        setMessage({
          type: 'error',
          text: data?.message || 'Phone number not found. Please check and try again.'
        });
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Portal login error:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Unable to connect. Please check your phone number.'
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', sans-serif;
          height: 100vh;
          overflow: hidden;
          background: linear-gradient(135deg, #0A1F3D 0%, #0F2847 100%);
        }

        .portal {
          position: relative;
          width: 100%;
          height: 100vh;
          background: linear-gradient(135deg, #0A1F3D 0%, #0F2847 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .portal::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .portal-glow {
          position: absolute;
          top: -20%;
          right: -10%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(166,124,82,.08) 0%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
        }

        .content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 420px;
          padding: 0 24px;
        }

        .card {
          background: white;
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.6);
          border: 1px solid #e5e7eb;
        }

        .logo {
          margin-bottom: 2rem;
          text-align: center;
        }

        .logo-icon {
          width: 64px;
          height: 64px;
          background: rgba(5, 150, 105, 0.08);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          border: 1px solid rgba(5, 150, 105, 0.15);
        }

        .logo-icon svg {
          width: 30px;
          height: 30px;
          color: #059669;
        }

        .logo h1 {
          font-family: 'Lora', Georgia, serif;
          font-size: 1.8rem;
          font-weight: 600;
          color: #0A1F3D;
          margin-bottom: 8px;
        }

        .logo p {
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          color: #6B7280;
        }

        .info {
          background: rgba(5, 150, 105, 0.04);
          border: 1px solid rgba(5, 150, 105, 0.1);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 0.8rem;
          color: #6B7280;
          margin-bottom: 1.5rem;
          text-align: center;
          line-height: 1.5;
        }

        .info strong {
          color: #059669;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .input-label {
          display: block;
          font-family: 'Inter', sans-serif;
          font-size: 0.65rem;
          font-weight: 600;
          color: #6B7280;
          margin-bottom: 8px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .input-field {
          width: 100%;
          padding: 14px 18px;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          outline: none;
          transition: all 0.2s;
          color: #111827;
        }

        .input-field:focus {
          background: #ffffff;
          border-color: #A67C52;
          box-shadow: 0 0 0 3px rgba(166,124,82,0.12);
        }

        .input-field::placeholder {
          color: #aaa;
        }

        .btn {
          width: 100%;
          padding: 14px 18px;
          background: #0A1F3D;
          color: white;
          font-family: 'Inter', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.22s;
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 16px -4px rgba(10,31,61,0.4);
        }

        .btn:hover:not(:disabled) {
          background: #0F2847;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -4px rgba(10,31,61,0.6);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.8rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .message.error {
          background: rgba(229, 62, 62, 0.08);
          color: #e74c3c;
          border: 1px solid rgba(229, 62, 62, 0.2);
        }

        .message.success {
          background: rgba(5, 150, 105, 0.08);
          color: #059669;
          border: 1px solid rgba(5, 150, 105, 0.2);
        }

        .footer {
          margin-top: 1.5rem;
          text-align: center;
        }

        .footer a {
          color: #888;
          text-decoration: none;
          font-size: 0.78rem;
          transition: color 0.2s;
        }

        .footer a:hover {
          color: #A67C52;
        }

        .footer span {
          color: #ddd;
          margin: 0 8px;
        }

        .divider {
          height: 1px;
          background: #E5E7EB;
          margin: 1.25rem 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }

        @media (max-width: 480px) {
          .content {
            padding: 0 16px;
          }
          .card {
            padding: 1.5rem;
          }
          .logo h1 {
            font-size: 1.5rem;
          }
          .logo-icon {
            width: 56px;
            height: 56px;
          }
          .input-field, .btn {
            padding: 12px 16px;
          }
        }
      `}</style>

      <div className="portal">
        <div className="portal-glow"></div>
        <div className="content">
          <div className="card">
            <div className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h1>Rest Point</h1>
              <p>Family Memorial Portal</p>
            </div>

            <div className="info">
              Enter the <strong>phone number</strong> of the next of kin registered with the funeral home. We'll locate your loved one's records automatically.
            </div>

            {message.text && (
              <div className={`message ${message.type}`} style={{ animation: 'fadeIn 0.3s ease' }}>
                <span>{message.type === 'error' ? '⚠️' : '✓'}</span>
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="input-label">Next of Kin Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="07XX XXX XXX"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={isLoading}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    Access Memorial
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </form>

            <div className="divider"></div>

            <div className="footer">
              <a href="/">← Back to Rest Point</a>
              <span>•</span>
              <a href="mailto:info@restpoint.co.ke">Support</a>
              <span>•</span>
              <a href="/login">Staff Login</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PortalLoginPage;