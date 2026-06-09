import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';

/* ═══════════════════════════════════════════════════════════════
   REST POINT — Login Page
   Design System: Matches Landing Page (Cinematic dark luxury)
   ═══════════════════════════════════════════════════════════════ */

const T = {
  bg0:   '#040404',
  bg1:   '#070707',
  bg2:   '#0b0b0b',
  bg3:   '#0f0f0f',
  bg4:   '#131313',
  line:  '#1e1e1e',
  line2: '#282828',
  dim:   '#333333',
  sub:   '#555555',
  muted: '#777777',
  mid:   '#aaaaaa',
  light: '#e0e0e0',
  white: '#f8f8f8',
  g:     '#04c800',
  gd:    '#038b00',
  gl:    '#09ff09',
  ga:    'rgba(4,200,0,0.12)',
  ga2:   'rgba(4,200,0,0.06)',
  ga3:   'rgba(4,200,0,0.04)',
  gs:    '0 0 30px rgba(4,200,0,0.2)',
};

/* ── SVG Icons ────────────────────────────────────────────────── */
const I = {
  eye:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>,
  arr:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>,
  mail:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  lock:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  cloud:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  users:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 15h-6"/></svg>,
  log:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
};

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentTime, setCurrentTime] = useState('');
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [authPopupData, setAuthPopupData] = useState({ success: false, message: '' });
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      setCurrentTime(`${dateString} • ${timeString}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Syne:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;background:${T.bg0};}
        body{overflow-x:hidden;background:${T.bg0};color:${T.light};font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        ::selection{background:rgba(4,200,0,.2);color:${T.g};}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:${T.bg0};}
        ::-webkit-scrollbar-thumb{background:${T.dim};border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:${T.g};}

        .cg{font-family:'Cormorant Garamond',Georgia,serif;}
        .syne{font-family:'Syne',sans-serif;}

        .inp:focus{outline:none;border-color:${T.g}!important;box-shadow:0 0 0 3px ${T.ga};}

        @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn .5s ease forwards;}
      `}</style>

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        background: navScrolled ? `rgba(4,4,4,.94)` : 'transparent',
        borderBottom: navScrolled ? `1px solid ${T.line}` : '1px solid transparent',
        padding: '.9rem 0',
        transition: 'all .3s ease',
        backdropFilter: navScrolled ? 'blur(24px) saturate(1.4)' : 'none',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: T.ga, border: `1px solid rgba(4,200,0,.2)`, borderRadius: '8px', padding: '.4rem .9rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.g, boxShadow: `0 0 10px ${T.g}` }} />
              <span className="syne" style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.16em', color: T.g }}>REST POINT</span>
            </div>
            <span className="syne" style={{ fontSize: '.5rem', color: T.sub, letterSpacing: '.14em', textTransform: 'uppercase' }}>Mortuary OS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="syne" style={{ fontSize: '.6rem', color: T.muted, letterSpacing: '.12em', textTransform: 'uppercase' }}>Sign In</span>
            <button onClick={() => navigate('/register')} className="syne" style={{ background: T.g, color: '#000', border: 'none', padding: '.44rem 1rem', borderRadius: '8px', fontSize: '.62rem', fontWeight: 700, letterSpacing: '.08em', cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={(e) => { e.target.style.background = T.gl; e.target.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.target.style.background = T.g; e.target.style.transform = 'translateY(0)'; }}>Start Trial</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', position: 'relative', overflow: 'hidden' }}>
        {/* Background grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.012) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
        
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '-20%', right: '-8%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(4,200,0,.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '10%', width: '400px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(4,200,0,.03) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '2rem 1.75rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${T.line}`, boxShadow: '0 40px 80px -20px rgba(0,0,0,.8)' }}>
            
            {/* Left Panel - Branding */}
            <div style={{
              background: `linear-gradient(135deg, ${T.bg2} 0%, ${T.bg0} 100%)`,
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
              <div style={{ position: 'absolute', top: '-30%', left: '-30%', width: '200px', height: '200px', borderRadius: '50%', background: `radial-gradient(circle, ${T.ga} 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: T.ga, border: `1px solid rgba(4,200,0,.2)`, borderRadius: '8px', padding: '.35rem .75rem' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: T.g, boxShadow: `0 0 8px ${T.g}` }} />
                    <span className="syne" style={{ fontSize: '.65rem', fontWeight: 800, letterSpacing: '.16em', color: T.g }}>REST POINT</span>
                  </div>
                </div>

                <h1 className="cg" style={{ fontSize: '2.2rem', fontWeight: 600, color: T.white, marginBottom: '.75rem', letterSpacing: '-.02em', lineHeight: 1.2 }}>
                  Mortuary<br /><span style={{ color: T.g, fontStyle: 'italic' }}>Management</span> System
                </h1>

                <p style={{ fontSize: '.88rem', color: T.mid, lineHeight: 1.7, marginBottom: '2rem', maxWidth: '300px' }}>
                  Secure access portal for modern funeral home operations. Built for East Africa.
                </p>

                {/* Features */}
                <div style={{ marginBottom: '2.5rem' }}>
                  {[
                    [I.shield, 'AES-256 Encryption'],
                    [I.users, 'Multi-Branch Access'],
                    [I.cloud, 'Cloud Sync'],
                    [I.log, 'Audit Logging'],
                  ].map(([ic, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.75rem' }}>
                      <span style={{ color: T.g }}>{ic}</span>
                      <span className="syne" style={{ fontSize: '.72rem', color: T.light, fontWeight: 500, letterSpacing: '.03em' }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Time display */}
                {currentTime && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: T.ga, border: `1px solid rgba(4,200,0,.15)`, borderRadius: '8px', padding: '.5rem .85rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.g} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span className="syne" style={{ fontSize: '.62rem', color: T.g, fontWeight: 600, letterSpacing: '.05em' }}>{currentTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Login Form */}
            <div style={{
              background: T.bg3,
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <div style={{ marginBottom: '2rem' }}>
                <div className="eye" style={{ marginBottom: '.5rem' }}>Welcome Back</div>
                <h2 className="cg" style={{ fontSize: '1.6rem', fontWeight: 600, color: T.white, marginBottom: '.25rem' }}>Sign in to your account</h2>
                <p style={{ fontSize: '.8rem', color: T.muted }}>Enter your credentials to access the dashboard</p>
              </div>

              <form onSubmit={handleLogin}>
                {/* Message */}
                {message.text && (
                  <div className="fade-in" style={{
                    background: message.type === 'error' ? 'rgba(201,76,76,.1)' : T.ga,
                    border: `1px solid ${message.type === 'error' ? 'rgba(201,76,76,.3)' : 'rgba(4,200,0,.3)'}`,
                    color: message.type === 'error' ? '#ff6b6b' : T.g,
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
                  <label className="syne" style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: T.muted, marginBottom: '.5rem', fontWeight: 600 }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: T.muted }}>{I.mail}</div>
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin@funeralhome.co.ke"
                      className="inp"
                      style={{
                        width: '100%',
                        padding: '.75rem .85rem .75rem 2.5rem',
                        background: T.bg4,
                        border: `1px solid ${hasError && !identifier ? '#c94c4c' : T.line2}`,
                        borderRadius: '8px',
                        fontSize: '.88rem',
                        color: T.light,
                        transition: 'all .2s',
                      }}
                    />
                  </div>
                  {hasError && !identifier && <div style={{ color: '#c94c4c', fontSize: '.65rem', marginTop: '.25rem' }}>Email is required</div>}
                </div>

                {/* Password */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="syne" style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: T.muted, marginBottom: '.5rem', fontWeight: 600 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: T.muted }}>{I.lock}</div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="inp"
                      style={{
                        width: '100%',
                        padding: '.75rem .85rem .75rem 2.5rem',
                        background: T.bg4,
                        border: `1px solid ${hasError && !password ? '#c94c4c' : T.line2}`,
                        borderRadius: '8px',
                        fontSize: '.88rem',
                        color: T.light,
                        transition: 'all .2s',
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
                        color: T.muted,
                        padding: '.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color .2s',
                      }}
                      onMouseEnter={(e) => e.target.style.color = T.light}
                      onMouseLeave={(e) => e.target.style.color = T.muted}
                    >
                      {showPassword ? I.eyeOff : I.eye}
                    </button>
                  </div>
                  {hasError && !password && <div style={{ color: '#c94c4c', fontSize: '.65rem', marginTop: '.25rem' }}>Password is required</div>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="syne"
                  style={{
                    width: '100%',
                    background: isLoading ? T.dim : T.g,
                    color: isLoading ? T.muted : '#000',
                    border: 'none',
                    padding: '.85rem',
                    borderRadius: '8px',
                    fontSize: '.7rem',
                    fontWeight: 700,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    boxShadow: isLoading ? 'none' : '0 4px 24px -6px rgba(4,200,0,.5)',
                    transition: 'all .22s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '.5rem',
                  }}
                  onMouseEnter={(e) => { if (!isLoading) { e.target.style.background = T.gl; e.target.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={(e) => { if (!isLoading) { e.target.style.background = T.g; e.target.style.transform = 'translateY(0)'; } }}
                >
                  {isLoading ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In {I.arr}
                    </>
                  )}
                </button>

                {/* Footer links */}
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '.75rem', color: T.muted }}>
                    Don't have an account?{' '}
                    <button 
                      type="button"
                      onClick={() => navigate('/register')}
                      style={{ background: 'none', border: 'none', color: T.g, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(4,200,0,.4)', transition: 'color .2s', fontSize: '.75rem' }}
                      onMouseEnter={(e) => e.target.style.color = T.gl}
                      onMouseLeave={(e) => e.target.style.color = T.g}
                    >
                      Start free trial
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
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div className="fade-in" style={{
            background: T.bg3,
            border: `1px solid ${T.line}`,
            borderRadius: '14px',
            padding: '2.5rem',
            textAlign: 'center',
            maxWidth: '380px',
            width: '100%',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: T.ga,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: T.g,
            }}>
              {I.check}
            </div>
            <h3 className="cg" style={{ fontSize: '1.4rem', color: T.white, marginBottom: '.5rem', fontWeight: 600 }}>
              {authPopupData.success ? 'Success!' : 'Signing In...'}
            </h3>
            <p style={{ fontSize: '.85rem', color: T.mid, lineHeight: 1.6 }}>{authPopupData.message}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default LoginPage;