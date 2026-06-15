import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';

/* ═══════════════════════════════════════════════════════════════
   REST POINT — Login Page
   Consistent theme with Landing Page (Navy + Gold + White)
   Mobile Responsive · Clean · Modern
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

const T = {
  bg0:   C.navy900,
  bg1:   C.navy800,
  bg2:   C.navy700,
  bg3:   '#f8f9fa',
  bg4:   '#ffffff',
  line:  C.char200,
  line2: C.char300,
  dim:   C.char500,
  sub:   C.char600,
  muted: C.char500,
  mid:   C.char700,
  light: C.char900,
  white: '#111827',
  g:     C.gold,
  gd:    C.goldD,
  gl:    C.goldL,
  ga:    'rgba(166,124,82,0.12)',
  ga2:   'rgba(166,124,82,0.06)',
  ga3:   'rgba(166,124,82,0.04)',
  gs:    '0 0 30px rgba(166,124,82,0.2)',
};

/* ── SVG Icons ────────────────────────────────────────────────── */
const I = {
  eye:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>,
  arr:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>,
  mail:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  lock:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  star:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [authPopupData, setAuthPopupData] = useState({ success: false, message: '' });
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token === 'undefined' || token === 'null') {
      localStorage.clear();
    }
  }, []);

  const setCookie = (name, value, days) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    if (!identifier.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Please enter both email and password' });
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.login({
        email: identifier.trim(),
        password: password.trim()
      });

      if (data && data.success) {
        const token = data.accessToken || data.token;
        
        if (!token) {
          throw new Error('No token received from server');
        }

        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('loginTime', new Date().toISOString());

        if (data.tenant) {
          localStorage.setItem('tenant', JSON.stringify(data.tenant));
          if (data.tenant.tenantSlug) {
            localStorage.setItem('tenantSlug', data.tenant.tenantSlug);
          }
          if (data.tenant.tenantId) {
            localStorage.setItem('tenantId', data.tenant.tenantId.toString());
          }
          if (data.tenant.dbName) {
            localStorage.setItem('dbName', data.tenant.dbName);
          }
        }

        if (data.tenantSlug) {
          localStorage.setItem('tenantSlug', data.tenantSlug);
        }

        if (data.user?.role) {
          localStorage.setItem('userRole', data.user.role);
        }

        setCookie('authToken', token, 7);
        if (data.user?.role) setCookie('userRole', data.user.role, 7);
        if (data.tenant?.tenantSlug) setCookie('tenantSlug', data.tenant.tenantSlug, 7);

        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });

        setAuthPopupData({ 
          success: true, 
          message: `Welcome ${data.user?.fullName || 'User'}! Redirecting to dashboard...` 
        });
        setShowAuthPopup(true);

        setTimeout(() => {
          setShowAuthPopup(false);
          navigate('/dashboard');
        }, 1500);

      } else {
        setMessage({
          type: 'error',
          text: data?.message || 'Login failed. Please check your credentials.'
        });
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Unable to connect to server. Please check your connection.'
      });
      setIsLoading(false);
    }
  };

  const hasError = message.type === 'error';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;background:${T.bg0};}
        body{overflow-x:hidden;background:${T.bg0};color:${T.light};font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;}
        ::selection{background:rgba(166,124,82,0.15);color:${T.g};}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:${T.bg0};}
        ::-webkit-scrollbar-thumb{background:${T.dim};border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:${T.g};}

        .inp:focus{outline:none;border-color:${T.g}!important;box-shadow:0 0 0 3px ${T.ga};}

        @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn .5s ease forwards;}

        @keyframes spin{to{transform:rotate(360deg)}}
        .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite;display:inline-block;margin-right:8px;}

        .lora{font-family:'Lora',Georgia,serif;}
        .inter{font-family:'Inter',sans-serif;}

        @media (max-width: 768px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-left { display: none !important; }
          .login-right { padding: 2rem 1.5rem !important; }
          .login-container { max-width: 100% !important; padding: 0 1rem !important; }
          .nav-container { padding: 0 1rem !important; }
        }

        @media (max-width: 480px) {
          .login-right { padding: 1.5rem 1rem !important; }
        }
      `}</style>

      {/* Navigation - Matching Landing Page */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        background: navScrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.7)',
        borderBottom: navScrolled ? `1px solid ${T.line}` : '1px solid transparent',
        padding: '.9rem 0',
        transition: 'all .3s ease',
        backdropFilter: navScrolled ? 'blur(24px) saturate(1.4)' : 'blur(12px)',
      }}>
        <div className="nav-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.emerald }} />
            <span className="lora" style={{ fontSize: '1rem', fontWeight: 700, color: C.navy900 }}>Rest Point</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="inter" style={{ fontSize: '.75rem', fontWeight: 600, color: C.char600, letterSpacing: '.1em' }}>Sign In</span>
            <button onClick={() => navigate('/register')} className="inter" style={{ background: C.navy900, color: 'white', border: 'none', padding: '.5rem 1.2rem', borderRadius: '8px', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', cursor: 'pointer', transition: 'all .22s', textTransform: 'uppercase' }} onMouseEnter={(e) => { e.target.style.background = C.navy800; e.target.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.target.style.background = C.navy900; e.target.style.transform = 'translateY(0)'; }}>Start Trial</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', position: 'relative', overflow: 'hidden', background: C.navy50 }}>
        {/* Background grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(10,31,61,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(10,31,61,.02) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
        
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '-20%', right: '-8%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(166,124,82,.06) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '10%', width: '400px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(5,150,105,.04) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div className="login-container" style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '2rem 1.75rem', position: 'relative', zIndex: 1 }}>
          <div className="login-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${T.line}`, boxShadow: '0 40px 80px -20px rgba(10,31,61,.4)' }}>
            
            {/* Left Panel - Branding (hidden on mobile) */}
            <div className="login-left" style={{
              background: `linear-gradient(135deg, ${C.navy800} 0%, ${C.navy900} 100%)`,
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative grid overlay */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
              
              {/* Glow effect */}
              <div style={{ position: 'absolute', top: '-30%', left: '-30%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(166,124,82,.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '2rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.emerald, boxShadow: '0 0 10px rgba(5,150,105,0.5)' }} />
                  <span className="lora" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', letterSpacing: '-.02em' }}>Rest Point</span>
                </div>

                <h1 className="lora" style={{ fontSize: '2.2rem', fontWeight: 600, color: 'white', marginBottom: '.75rem', letterSpacing: '-.02em', lineHeight: 1.2 }}>
                  Mortuary<br /><span style={{ color: C.gold, fontStyle: 'italic' }}>Management</span> System
                </h1>

                <p style={{ fontSize: '.88rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '300px' }}>
                  Secure access portal for modern funeral home operations. Built for East Africa.
                </p>

                {/* Features */}
                <div style={{ marginBottom: '2.5rem' }}>
                  {[
                    ['🔒', 'AES-256 Encryption'],
                    ['👥', 'Multi-Branch Access'],
                    ['☁️', 'Cloud Sync'],
                    ['📋', 'Audit Logging'],
                  ].map(([ic, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.75rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{ic}</span>
                      <span className="inter" style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="login-right" style={{
              background: 'white',
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <div style={{ marginBottom: '2rem' }}>
                <div className="lora" style={{ fontSize: '.85rem', color: C.gold, fontWeight: 600, marginBottom: '.5rem', fontStyle: 'italic' }}>Welcome Back</div>
                <h2 className="lora" style={{ fontSize: '1.6rem', fontWeight: 600, color: C.navy900, marginBottom: '.25rem' }}>Sign in to your account</h2>
                <p style={{ fontSize: '.85rem', color: C.char600 }}>Enter your credentials to access the dashboard</p>
              </div>

              <form onSubmit={handleLogin}>
                {/* Message */}
                {message.text && (
                  <div className="fade-in" style={{
                    background: message.type === 'error' ? 'rgba(201,76,76,.1)' : 'rgba(5,150,105,.1)',
                    border: `1px solid ${message.type === 'error' ? 'rgba(201,76,76,.3)' : 'rgba(5,150,105,.3)'}`,
                    color: message.type === 'error' ? '#dc2626' : C.emerald,
                    padding: '.75rem',
                    borderRadius: '8px',
                    marginBottom: '1.25rem',
                    fontSize: '.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.5rem',
                  }}>
                    {message.type === 'error' ? '⚠️' : '✅'} {message.text}
                  </div>
                )}

                {/* Email */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="inter" style={{ display: 'block', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: C.char600, marginBottom: '.5rem', fontWeight: 600 }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: C.char500 }}>{I.mail}</div>
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin@funeralhome.co.ke"
                      className="inp"
                      style={{
                        width: '100%',
                        padding: '.75rem .85rem .75rem 2.5rem',
                        background: C.navy50,
                        border: `1px solid ${hasError && !identifier ? '#dc2626' : C.char200}`,
                        borderRadius: '8px',
                        fontSize: '.88rem',
                        color: C.char900,
                        transition: 'all .2s',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    />
                  </div>
                  {hasError && !identifier && <div style={{ color: '#dc2626', fontSize: '.65rem', marginTop: '.25rem' }}>Email is required</div>}
                </div>

                {/* Password */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="inter" style={{ display: 'block', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: C.char600, marginBottom: '.5rem', fontWeight: 600 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: C.char500 }}>{I.lock}</div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="inp"
                      style={{
                        width: '100%',
                        padding: '.75rem .85rem .75rem 2.5rem',
                        background: C.navy50,
                        border: `1px solid ${hasError && !password ? '#dc2626' : C.char200}`,
                        borderRadius: '8px',
                        fontSize: '.88rem',
                        color: C.char900,
                        transition: 'all .2s',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: C.char500,
                        padding: '.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color .2s',
                      }}
                      onMouseEnter={(e) => e.target.style.color = C.char900}
                      onMouseLeave={(e) => e.target.style.color = C.char500}
                    >
                      {showPassword ? I.eyeOff : I.eye}
                    </button>
                  </div>
                  {hasError && !password && <div style={{ color: '#dc2626', fontSize: '.65rem', marginTop: '.25rem' }}>Password is required</div>}
                </div>

                {/* Submit Button - Navy theme matching landing page */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inter"
                  style={{
                    width: '100%',
                    background: isLoading ? C.char300 : C.navy900,
                    color: isLoading ? C.char500 : 'white',
                    border: 'none',
                    padding: '.85rem',
                    borderRadius: '8px',
                    fontSize: '.7rem',
                    fontWeight: 700,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    boxShadow: isLoading ? 'none' : `0 4px 16px -4px ${C.navy900}80`,
                    transition: 'all .22s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '.5rem',
                  }}
                  onMouseEnter={(e) => { if (!isLoading) { e.target.style.background = C.navy800; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = `0 8px 24px -4px ${C.navy900}99`; }}}
                  onMouseLeave={(e) => { if (!isLoading) { e.target.style.background = C.navy900; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = `0 4px 16px -4px ${C.navy900}80`; }}}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In {I.arr}
                    </>
                  )}
                </button>

                {/* Forgot Password Link */}
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    style={{ background: 'none', border: 'none', color: C.char600, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: C.gold + '60', transition: 'color .2s', fontSize: '.78rem' }}
                    onMouseEnter={(e) => e.target.style.color = C.gold}
                    onMouseLeave={(e) => e.target.style.color = C.char600}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Register link */}
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '.78rem', color: C.char600 }}>
                    Don't have an account?{' '}
                    <button 
                      type="button"
                      onClick={() => navigate('/register')}
                      style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: C.gold + '60', transition: 'color .2s', fontSize: '.78rem', fontWeight: 600 }}
                      onMouseEnter={(e) => e.target.style.color = C.goldL}
                      onMouseLeave={(e) => e.target.style.color = C.gold}
                    >
                      Start free trial
                    </button>
                  </p>
                </div>

                {/* Portal login link */}
                <div style={{ marginTop: '.75rem', paddingTop: '.75rem', borderTop: `1px solid ${C.char200}`, textAlign: 'center' }}>
                  <p style={{ fontSize: '.75rem', color: C.char500 }}>
                    Are you a family member?{' '}
                    <button 
                      type="button"
                      onClick={() => navigate('/portal/login')}
                      style={{ background: 'none', border: 'none', color: C.emerald, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: C.emerald + '60', transition: 'color .2s', fontSize: '.75rem', fontWeight: 600 }}
                      onMouseEnter={(e) => e.target.style.color = C.emeraldL}
                      onMouseLeave={(e) => e.target.style.color = C.emerald}
                    >
                      Access Family Portal
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Popup */}
      {showAuthPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10,31,61,0.92)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div className="fade-in" style={{
            background: 'white',
            border: `1px solid ${C.char200}`,
            borderRadius: '14px',
            padding: '2.5rem',
            textAlign: 'center',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 40px 80px -20px rgba(10,31,61,0.6)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(5,150,105,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: C.emerald,
            }}>
              {I.check}
            </div>
            <h3 className="lora" style={{ fontSize: '1.4rem', color: C.navy900, marginBottom: '.5rem', fontWeight: 600 }}>
              {authPopupData.success ? 'Welcome!' : 'Signing In...'}
            </h3>
            <p style={{ fontSize: '.85rem', color: C.char600, lineHeight: 1.6 }}>{authPopupData.message}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default LoginPage;