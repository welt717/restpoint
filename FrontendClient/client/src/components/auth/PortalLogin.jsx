import React, { useState } from 'react';

function PortalLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
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
      await new Promise(resolve => setTimeout(resolve, 1200));
      localStorage.setItem('authToken', 'token_' + Date.now());
      localStorage.setItem('user', JSON.stringify({ phone: rawDigits }));
      setMessage({ type: 'success', text: 'Welcome home. Redirecting...' });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: 'Unable to connect. Please check your phone number.' });
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          height: 100vh;
          overflow: hidden;
        }

        /* Full Screen Background */
        .portal {
          position: relative;
          width: 100%;
          height: 100vh;
          background-image: url('/familyportal.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        /* Dark Gradient ONLY at the bottom */
        .portal::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30%;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));
          pointer-events: none;
        }

        /* Content Container - Left Aligned */
        .content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 440px;
          padding: 0 48px;
        }

        /* Logo Section */
        .logo {
          margin-bottom: 48px;
        }

        .logo-icon {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .logo-icon svg {
          width: 30px;
          height: 30px;
          color: white;
        }

        .logo h1 {
          font-size: 32px;
          font-weight: 600;
          color: white;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }

        .logo p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        /* Form */
        .form-group {
          margin-bottom: 20px;
        }

        .input-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .input-field {
          width: 100%;
          padding: 14px 18px;
          font-size: 16px;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 10px;
          outline: none;
          transition: all 0.2s;
        }

        .input-field:focus {
          background: white;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
        }

        .input-field::placeholder {
          color: #aaa;
        }

        /* Button */
        .btn {
          width: 100%;
          padding: 14px 18px;
          background: #1a1a1a;
          color: white;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 10px;
        }

        .btn:hover:not(:disabled) {
          background: #333;
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Message */
        .message {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .message.error {
          background: rgba(229, 62, 62, 0.9);
          color: white;
        }

        .message.success {
          background: rgba(56, 161, 105, 0.9);
          color: white;
        }

        /* Footer */
        .footer {
          margin-top: 40px;
        }

        .footer a {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
        }

        .footer a:hover {
          color: white;
        }

        .footer span {
          color: rgba(255, 255, 255, 0.3);
          margin: 0 8px;
        }

        /* Spinner */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
          margin-right: 8px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .portal {
            justify-content: center;
          }
          
          .content {
            padding: 0 24px;
            text-align: center;
          }
          
          .logo {
            text-align: center;
          }
          
          .logo-icon {
            margin-left: auto;
            margin-right: auto;
          }
          
          .footer {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .content {
            padding: 0 20px;
          }
          
          .logo h1 {
            font-size: 28px;
          }
          
          .logo-icon {
            width: 50px;
            height: 50px;
          }
          
          .input-field, .btn {
            padding: 12px 16px;
          }
        }
      `}</style>

      <div className="portal">
        <div className="content">
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

          {message.text && (
            <div className={`message ${message.type}`}>
              <span>{message.type === 'error' ? '⚠️' : '✓'}</span>
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="input-label">Phone Number</label>
              <input
                type="tel"
                className="input-field"
                placeholder="(555) 123-4567"
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
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="footer">
            <a href="/support">Need help?</a>
            <span>•</span>
            <a href="/">Rest Point home</a>
          </div>
        </div>
      </div>
    </>
  );
}

export default PortalLoginPage;