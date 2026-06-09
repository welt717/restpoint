import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   REST POINT — Onboarding Flow
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

const API_BASE_URL = 'http://localhost:8002/api';

/* ── SVG Icons ────────────────────────────────────────────────── */
const I = {
  eye:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>,
  arr:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>,
  upload: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  x:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  lock:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  cloud:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
};

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  const [formData, setFormData] = useState({
    organizationName: '',
    email: '',
    location: '',
    password: '',
    verifyPassword: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
    return errors;
  };

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength === 0) return T.dim;
    if (strength === 1) return '#c94c4c';
    if (strength === 2) return T.g;
    return T.gl;
  };

  const getPasswordStrengthText = (strength) => {
    if (strength === 0) return 'Enter password';
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Medium';
    return 'Strong';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (name === 'password' || name === 'verifyPassword') {
      if (errors.passwordMatch) {
        setErrors(prev => ({ ...prev, passwordMatch: '' }));
      }
    }
    setApiError('');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'Logo size should be less than 10MB' }));
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
        setErrors(prev => ({ ...prev, logo: 'Only JPG, PNG, or SVG images are allowed' }));
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, logo: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.organizationName.trim()) newErrors.organizationName = 'Organization name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Valid email is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must have: ${passwordErrors.join(', ')}`;
      }
    }
    
    if (!formData.verifyPassword) {
      newErrors.verifyPassword = 'Please verify your password';
    } else if (formData.password !== formData.verifyPassword) {
      newErrors.passwordMatch = 'Passwords do not match';
    }
    
    if (!agreeTerms) newErrors.terms = 'You must agree to the terms and conditions';
    if (!logoFile && !logoPreview) newErrors.logo = 'Organization logo is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');
    setApiSuccess('');

    try {
      const submitData = new FormData();
      submitData.append('organizationName', formData.organizationName);
      submitData.append('email', formData.email);
      submitData.append('location', formData.location);
      submitData.append('password', formData.password);
      submitData.append('termsAccepted', agreeTerms);
      
      if (logoFile) {
        submitData.append('logo', logoFile);
      }

      const response = await axios.post(`${API_BASE_URL}/onboarding/organization`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.success || response.status === 200 || response.status === 201) {
        setApiSuccess(response.data.message || 'Organization setup completed successfully! Redirecting to login...');
        
        const onboardingData = {
          organizationName: formData.organizationName,
          email: formData.email,
          location: formData.location,
          logo: logoPreview,
          organizationId: response.data.organizationId,
          userId: response.data.userId,
          completedAt: new Date().toISOString(),
        };
        localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
        localStorage.setItem('onboardingComplete', 'true');
        
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        setTimeout(() => {
          setIsSubmitting(false);
          navigate('/login');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Setup failed. Please try again.');
      }
    } catch (error) {
      setIsSubmitting(false);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Server error occurred';
        
        if (status === 400) {
          setApiError(message || 'Invalid data provided. Please check your inputs.');
        } else if (status === 401) {
          setApiError('Authentication required. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else if (status === 409) {
          setApiError('Organization with this email already exists. Please use a different email.');
        } else if (status === 500) {
          setApiError('Server error. Please try again later.');
        } else {
          setApiError(message || `Error ${status}: Unable to complete setup`);
        }
      } else if (error.request) {
        setApiError('Network error. Please check your internet connection and try again.');
      } else {
        setApiError(error.message || 'An unexpected error occurred. Please try again.');
      }
      
      console.error('Onboarding API Error:', error);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

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

        /* Input focus styles */
        .inp:focus{outline:none;border-color:${T.g}!important;box-shadow:0 0 0 3px ${T.ga};}
        
        /* Checkbox custom style */
        .chk:checked{accent-color:${T.g};}

        /* Button hover */
        .btn-g{background:${T.g};color:#000;box-shadow:0 4px 24px -6px rgba(4,200,0,.5);transition:all .22s;}
        .btn-g:hover{background:${T.gl};transform:translateY(-2px);box-shadow:0 8px 32px -6px rgba(4,200,0,.6);}
        .btn-g:active{transform:translateY(0);}
      `}</style>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.92)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              backdropFilter: 'blur(6px)',
            }}
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: T.bg3,
                border: `1px solid ${T.line}`,
                borderRadius: '14px',
                maxWidth: '580px',
                maxHeight: '80vh',
                overflow: 'auto',
                padding: '2rem',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowTermsModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: T.muted,
                  padding: '.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color .2s',
                }}
                onMouseEnter={(e) => e.target.style.color = T.white}
                onMouseLeave={(e) => e.target.style.color = T.muted}
              >
                {I.x}
              </button>
              <div className="eye" style={{ marginBottom: '1rem' }}>Terms & Conditions</div>
              <h2 className="cg" style={{ fontSize: '1.8rem', color: T.white, marginBottom: '1.5rem', fontWeight: 600 }}>
                Rest Point <span style={{ color: T.g }}>Service Agreement</span>
              </h2>
              <div style={{ color: T.mid, lineHeight: 1.7, fontSize: '.85rem' }}>
                <p style={{ marginBottom: '1.25rem' }}>By using RestPoint, you agree to these terms:</p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {[
                    'Subscription payments must be made on time.',
                    'A 5-day grace period is provided after the due date.',
                    'Accounts may be suspended if payment is not received within 5 days.',
                    'Customer data remains securely stored during account suspension.',
                    'All customer data is securely isolated to prevent unauthorized access.',
                    'RestPoint uses multiple layers of security and encryption.',
                    'The platform is built on modern cloud and microservices architecture.',
                    'Customers retain ownership of their data at all times.',
                    'RestPoint supports integrations across Kenya, Uganda, and Tanzania.',
                    'Users are responsible for maintaining account credential confidentiality.',
                    'Misuse or unauthorized access may result in account termination.',
                  ].map((item, i) => (
                    <li key={i} style={{ marginBottom: '.65rem', display: 'flex', alignItems: 'start', gap: '.65rem' }}>
                      <span style={{ color: T.g, marginTop: '.2rem' }}>{I.check}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <h3 className="syne" style={{ color: T.light, marginTop: '1.5rem', marginBottom: '.75rem', fontSize: '.95rem', fontWeight: 700, letterSpacing: '.03em' }}>Ownership</h3>
                <p>RestPoint is independently owned, operated, and managed. All software, branding, intellectual property, and platform services remain the exclusive property of RestPoint.</p>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="syne"
                style={{
                  marginTop: '1.5rem',
                  width: '100%',
                  background: T.g,
                  color: '#000',
                  border: 'none',
                  padding: '.8rem',
                  borderRadius: '8px',
                  fontSize: '.7rem',
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all .22s',
                }}
                onMouseEnter={(e) => { e.target.style.background = T.gl; e.target.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.target.style.background = T.g; e.target.style.transform = 'translateY(0)'; }}
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: T.ga, border: `1px solid rgba(4,200,0,.2)`, borderRadius: '8px', padding: '.4rem .9rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.g, boxShadow: `0 0 10px ${T.g}` }} />
              <span className="syne" style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.16em', color: T.g }}>REST POINT</span>
            </div>
            <span className="syne" style={{ fontSize: '.5rem', color: T.sub, letterSpacing: '.14em', textTransform: 'uppercase' }}>Mortuary OS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="syne" style={{ fontSize: '.6rem', color: T.muted, letterSpacing: '.12em', textTransform: 'uppercase' }}>Create Account</span>
            <button onClick={() => navigate('/login')} className="syne" style={{ background: 'rgba(255,255,255,.04)', color: T.light, border: `1px solid rgba(255,255,255,.1)`, padding: '.44rem .9rem', borderRadius: '8px', fontSize: '.62rem', cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={(e) => { e.target.style.color = T.g; e.target.style.borderColor = 'rgba(4,200,0,.4)'; }} onMouseLeave={(e) => { e.target.style.color = T.light; e.target.style.borderColor = 'rgba(255,255,255,.1)'; }}>Log in</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ paddingTop: '80px', minHeight: '100vh' }}>
        {/* Hero Section with Form */}
        <section style={{ padding: '3rem 0 5rem', position: 'relative', overflow: 'hidden' }}>
          {/* Background grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.012) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
          
          {/* Glow orbs */}
          <div style={{ position: 'absolute', top: '-20%', right: '-8%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(4,200,0,.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '10%', width: '400px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(4,200,0,.03) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 1.75rem', position: 'relative', zIndex: 1 }}>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ textAlign: 'center', marginBottom: '2.5rem' }}
            >
              <div className="hbadge" style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: T.ga, border: `1px solid rgba(4,200,0,.2)`, borderRadius: '8px', padding: '.45rem .9rem', fontFamily: 'Syne,sans-serif', fontSize: '.58rem', color: T.g, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill={T.g}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Enterprise Onboarding
              </div>
              <h1 className="cg" style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)', fontWeight: 600, color: T.white, marginBottom: '.75rem', letterSpacing: '-.02em', lineHeight: 1.2 }}>
                Create your<br /><span style={{ color: T.g, fontStyle: 'italic' }}>organization</span> account
              </h1>
              <p style={{ fontSize: '.88rem', color: T.mid, lineHeight: 1.7, maxWidth: '400px', margin: '0 auto' }}>
                Set up your mortuary on Rest Point. Complete the form below to get started with your free trial.
              </p>
            </motion.div>

            {/* Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{
                background: 'rgba(255,255,255,.022)',
                border: `1px solid ${T.line}`,
                borderRadius: '14px',
                padding: '2rem',
                boxShadow: '0 20px 50px -15px rgba(0,0,0,.7)',
              }}
            >
              <form onSubmit={handleSubmit}>
                {/* API Success Message */}
                <AnimatePresence>
                  {apiSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        background: T.ga,
                        border: `1px solid rgba(4,200,0,.3)`,
                        color: T.g,
                        padding: '.75rem',
                        borderRadius: '8px',
                        marginBottom: '1.25rem',
                        fontSize: '.8rem',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '.5rem',
                      }}
                    >
                      {I.check} {apiSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* API Error Message */}
                <AnimatePresence>
                  {apiError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        background: 'rgba(201,76,76,.1)',
                        border: `1px solid rgba(201,76,76,.3)`,
                        color: '#ff6b6b',
                        padding: '.75rem',
                        borderRadius: '8px',
                        marginBottom: '1.25rem',
                        fontSize: '.8rem',
                        textAlign: 'center',
                      }}
                    >
                      ⚠️ {apiError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Logo Upload */}
                <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
                  <label className="syne" style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: T.muted, marginBottom: '.75rem', fontWeight: 600 }}>
                    Organization Logo <span style={{ color: T.g }}>*</span>
                  </label>
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      margin: '0 auto',
                      border: `2px dashed ${errors.logo ? '#c94c4c' : (logoPreview ? T.g : T.dim)}`,
                      borderRadius: '50%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      background: T.bg4,
                      transition: 'all .25s',
                    }}
                    onClick={() => document.getElementById('logoUpload').click()}
                    onMouseEnter={(e) => { if (!logoPreview) { e.target.style.borderColor = T.g; e.target.style.background = T.ga; } }}
                    onMouseLeave={(e) => { if (!logoPreview) { e.target.style.borderColor = errors.logo ? '#c94c4c' : T.dim; e.target.style.background = T.bg4; } }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <div style={{ color: T.muted, marginBottom: '.25rem' }}>{I.upload}</div>
                        <span className="syne" style={{ fontSize: '.55rem', color: T.muted, letterSpacing: '.05em' }}>Upload</span>
                      </>
                    )}
                  </div>
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/svg+xml"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  {errors.logo && <div style={{ color: '#c94c4c', fontSize: '.65rem', marginTop: '.5rem' }}>{errors.logo}</div>}
                  <div className="syne" style={{ fontSize: '.55rem', color: T.sub, marginTop: '.5rem', letterSpacing: '.03em' }}>PNG, JPG or SVG (Max 10MB)</div>
                </div>

                {/* Organization Name */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="syne" style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: T.muted, marginBottom: '.5rem', fontWeight: 600 }}>Organization Name <span style={{ color: T.g }}>*</span></label>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    placeholder="e.g., Nairobi Funeral Home"
                    className="inp"
                    style={{
                      width: '100%',
                      padding: '.75rem',
                      background: T.bg4,
                      border: `1px solid ${errors.organizationName ? '#c94c4c' : T.line2}`,
                      borderRadius: '8px',
                      fontSize: '.88rem',
                      color: T.light,
                      transition: 'all .2s',
                    }}
                  />
                  {errors.organizationName && <div style={{ color: '#c94c4c', fontSize: '.65rem', marginTop: '.25rem' }}>{errors.organizationName}</div>}
                </div>

                {/* Email */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="syne" style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: T.muted, marginBottom: '.5rem', fontWeight: 600 }}>Email Address <span style={{ color: T.g }}>*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="info@funeralhome.co.ke"
                    className="inp"
                    style={{
                      width: '100%',
                      padding: '.75rem',
                      background: T.bg4,
                      border: `1px solid ${errors.email ? '#c94c4c' : T.line2}`,
                      borderRadius: '8px',
                      fontSize: '.88rem',
                      color: T.light,
                      transition: 'all .2s',
                    }}
                  />
                  {errors.email && <div style={{ color: '#c94c4c', fontSize: '.65rem', marginTop: '.25rem' }}>{errors.email}</div>}
                </div>

                {/* Location */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="syne" style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: T.muted, marginBottom: '.5rem', fontWeight: 600 }}>Location <span style={{ color: T.g }}>*</span></label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Nairobi, Kenya"
                    className="inp"
                    style={{
                      width: '100%',
                      padding: '.75rem',
                      background: T.bg4,
                      border: `1px solid ${errors.location ? '#c94c4c' : T.line2}`,
                      borderRadius: '8px',
                      fontSize: '.88rem',
                      color: T.light,
                      transition: 'all .2s',
                    }}
                  />
                  {errors.location && <div style={{ color: '#c94c4c', fontSize: '.65rem', marginTop: '.25rem' }}>{errors.location}</div>}
                </div>

                {/* Password */}
                <div style={{ marginBottom: '1rem' }}>
                  <label className="syne" style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: T.muted, marginBottom: '.5rem', fontWeight: 600 }}>Password <span style={{ color: T.g }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      className="inp"
                      style={{
                        width: '100%',
                        padding: '.75rem',
                        paddingRight: '2.5rem',
                        background: T.bg4,
                        border: `1px solid ${errors.password ? '#c94c4c' : T.line2}`,
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
                  {formData.password && (
                    <div style={{ marginTop: '.5rem' }}>
                      <div style={{ display: 'flex', gap: '.25rem', marginBottom: '.25rem' }}>
                        {[1, 2, 3].map((level) => (
                          <div key={level} style={{ flex: 1, height: '3px', background: passwordStrength >= level ? getPasswordStrengthColor(passwordStrength) : T.dim, borderRadius: '2px', transition: 'background .2s' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: '.65rem', color: getPasswordStrengthColor(passwordStrength) }}>
                        {getPasswordStrengthText(passwordStrength)} password
                      </div>
                    </div>
                  )}
                  {errors.password && <div style={{ color: '#c94c4c', fontSize: '.65rem', marginTop: '.25rem' }}>{errors.password}</div>}
                </div>

                {/* Verify Password */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="syne" style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: T.muted, marginBottom: '.5rem', fontWeight: 600 }}>Verify Password <span style={{ color: T.g }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showVerifyPassword ? 'text' : 'password'}
                      name="verifyPassword"
                      value={formData.verifyPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className="inp"
                      style={{
                        width: '100%',
                        padding: '.75rem',
                        paddingRight: '2.5rem',
                        background: T.bg4,
                        border: `1px solid ${errors.verifyPassword || errors.passwordMatch ? '#c94c4c' : T.line2}`,
                        borderRadius: '8px',
                        fontSize: '.88rem',
                        color: T.light,
                        transition: 'all .2s',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowVerifyPassword(!showVerifyPassword)}
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
                      {showVerifyPassword ? I.eyeOff : I.eye}
                    </button>
                  </div>
                  {formData.verifyPassword && formData.password === formData.verifyPassword && formData.password && (
                    <div style={{ fontSize: '.65rem', color: T.g, marginTop: '.25rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                      {I.check} Passwords match
                    </div>
                  )}
                  {errors.verifyPassword && <div style={{ color: '#c94c4c', fontSize: '.65rem', marginTop: '.25rem' }}>{errors.verifyPassword}</div>}
                  {errors.passwordMatch && <div style={{ color: '#c94c4c', fontSize: '.65rem', marginTop: '.25rem' }}>{errors.passwordMatch}</div>}
                </div>

                {/* Terms and Conditions */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                      }}
                      className="chk"
                      style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', marginTop: '.15rem', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '.78rem', color: T.muted, lineHeight: 1.5 }}>
                      I agree to the{' '}
                      <button 
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        style={{ background: 'none', border: 'none', color: T.g, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(4,200,0,.4)', transition: 'color .2s' }}
                        onMouseEnter={(e) => e.target.style.color = T.gl}
                        onMouseLeave={(e) => e.target.style.color = T.g}
                      >
                        Terms and Conditions
                      </button>
                      . I confirm that I am authorized to set up an organization account.
                    </span>
                  </label>
                  {errors.terms && <div style={{ color: '#c94c4c', fontSize: '.65rem', marginTop: '.5rem' }}>{errors.terms}</div>}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.01 } : undefined}
                  whileTap={!isSubmitting ? { scale: 0.99 } : undefined}
                  className="syne"
                  style={{
                    width: '100%',
                    background: isSubmitting ? T.dim : T.g,
                    color: isSubmitting ? T.muted : '#000',
                    border: 'none',
                    padding: '.9rem',
                    borderRadius: '8px',
                    fontSize: '.7rem',
                    fontWeight: 700,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                    boxShadow: isSubmitting ? 'none' : '0 4px 24px -6px rgba(4,200,0,.5)',
                    transition: 'all .22s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '.5rem',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account {I.arr}
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '.75rem', justifyContent: 'center' }}
            >
              {[
                [I.lock, 'AES-256 Encryption'],
                [I.shield, 'ISO 27001 Compliant'],
                [I.cloud, 'Contabo Cloud'],
              ].map(([ic, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: T.ga, border: `1px solid rgba(4,200,0,.12)`, borderRadius: '7px', padding: '.4rem .7rem' }}>
                  <span style={{ color: T.g }}>{ic}</span>
                  <span className="syne" style={{ fontSize: '.55rem', color: T.g, fontWeight: 600, letterSpacing: '.05em' }}>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        background: T.bg1,
        borderTop: `1px solid ${T.line}`,
        padding: '2.5rem 0 2rem',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.g, boxShadow: `0 0 8px ${T.g}` }} />
                <span className="syne" style={{ fontSize: '.78rem', fontWeight: 800, color: T.white, letterSpacing: '.14em' }}>REST POINT</span>
              </div>
              <p style={{ fontSize: '.72rem', color: T.sub, lineHeight: 1.7, maxWidth: '200px' }}>The complete mortuary operating system, built for East Africa.</p>
            </div>
            {/* Product */}
            <div>
              <div className="syne" style={{ fontSize: '.58rem', color: T.muted, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '1rem' }}>Product</div>
              {['Features', 'Family Portal', 'Marketplace', 'Pricing'].map(l => (
                <div key={l} style={{ fontSize: '.73rem', color: T.sub, marginBottom: '.55rem', cursor: 'pointer', transition: 'color .18s' }} onMouseEnter={e => e.target.style.color = T.g} onMouseLeave={e => e.target.style.color = T.sub}>{l}</div>
              ))}
            </div>
            {/* Company */}
            <div>
              <div className="syne" style={{ fontSize: '.58rem', color: T.muted, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '1rem' }}>Company</div>
              {['About', 'Blog', 'Careers', 'Contact'].map(l => (
                <div key={l} style={{ fontSize: '.73rem', color: T.sub, marginBottom: '.55rem', cursor: 'pointer', transition: 'color .18s' }} onMouseEnter={e => e.target.style.color = T.g} onMouseLeave={e => e.target.style.color = T.sub}>{l}</div>
              ))}
            </div>
            {/* Legal */}
            <div>
              <div className="syne" style={{ fontSize: '.58rem', color: T.muted, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '1rem' }}>Legal</div>
              {['Privacy Policy', 'Terms of Service', 'Security'].map(l => (
                <div key={l} style={{ fontSize: '.73rem', color: T.sub, marginBottom: '.55rem', cursor: 'pointer', transition: 'color .18s' }} onMouseEnter={e => e.target.style.color = T.g} onMouseLeave={e => e.target.style.color = T.sub}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', paddingTop: '1.5rem', borderTop: `1px solid ${T.line}` }}>
            <div style={{ fontSize: '.65rem', color: T.sub }}>© {new Date().getFullYear()} Rest Point. All rights reserved.</div>
            <div className="vtag" style={{ fontFamily: 'Syne,sans-serif', fontSize: '.55rem', color: T.g, background: T.ga, border: `1px solid rgba(4,200,0,.18)`, borderRadius: '5px', padding: '.2rem .55rem', letterSpacing: '.08em' }}>v2cloud.2026.RP</div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default OnboardingFlow;