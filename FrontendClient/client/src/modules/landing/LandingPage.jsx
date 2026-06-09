import React, { useState, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   REST POINT — MORTUARY OS  ·  Premium Landing Page
   Aesthetic: Cinematic dark luxury · editorial grid · surgical precision
   Fonts: Cormorant Garamond (display) + Syne (UI/caps) + Inter (body)
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

/* ── Minimal SVG Icon Set ─────────────────────────────────── */
const I = {
  menu:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7h18M3 12h12M3 17h18"/></svg>,
  x:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  arr:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>,
  arrDn:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14m-7-7 7 7 7-7"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>,
  lock:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  db:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  cloud:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  users:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  log:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  hb:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M22 12h-4l-3 9-4-18-3 9H2"/></svg>,
  track:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>,
  emb:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="6" y="8" width="12" height="8" rx="2"/><path d="M8 8V6a4 4 0 0 1 8 0v2M12 11v3"/></svg>,
  cert:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>,
  chat:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  obit:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  pay:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>,
  store:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  srv:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="5" rx="1"/><rect x="2" y="10" width="20" height="5" rx="1"/><rect x="2" y="17" width="20" height="5" rx="1"/></svg>,
  ms:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>,
  tls:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
};

const portalFeats = [
  { icon: I.track, label: 'Real-time Tracking' },
  { icon: I.emb,   label: 'Embalming Progress' },
  { icon: I.cert,  label: 'Digital Certificates' },
  { icon: I.chat,  label: 'Direct Chat' },
  { icon: I.obit,  label: 'Obituaries' },
  { icon: I.pay,   label: 'Online Payments' },
];

const features = [
  { n:'01', title:'Deceased Records & QR Tagging',  body:'Digital admission forms with instant QR code generation. Every record tracked and retrievable in under 90 seconds.',  stat:'< 90s', slabel:'admission time' },
  { n:'02', title:'Autopsy & Embalming Workflows',  body:'Structured post-mortem protocols with digital sign-off chains, timestamp logging, and progress visibility.',         stat:'100%',  slabel:'paperless' },
  { n:'03', title:'Smart Fleet Dispatch',            body:'Real-time GPS dispatch with automatic route optimisation and live status for operations and families.',               stat:'3×',    slabel:'faster dispatch' },
  { n:'04', title:'M-PESA Billing Engine',           body:'Automated daily billing, multi-currency ledger, instant M-PESA collection, and reconciliation reports.',             stat:'KES 0', slabel:'manual billing' },
  { n:'05', title:'Family Self-Service Portal',      body:'Families receive a secure SMS link — no download required. Track, view documents, and pay from any phone.',          stat:'24/7',  slabel:'family access' },
  { n:'06', title:'Analytics & Compliance',          body:'Live occupancy, revenue dashboards, and burial permit tracking built for Kenyan county health regulations.',          stat:'1-tap',  slabel:'compliance' },
];

const mktItems = [
  { name:'Welt Funeral Package', price:'KES 45,000', cat:'Premium Package', sold:234, tag:'Top Seller' },
  { name:'Memorial Casket Elite', price:'KES 28,500', cat:'Caskets & Urns',  sold:189, tag:'New In' },
  { name:'Burial Flowers Premium', price:'KES 3,200', cat:'Floral Services', sold:567, tag:'Popular' },
];

const faqs = [
  { q:'Does Rest Point work offline?',              a:'Yes — our progressive web app caches all forms locally and syncs automatically when connectivity is restored. Built for Kenyan network realities.' },
  { q:'How does multi-branch isolation work?',      a:'Every branch gets a fully isolated tenant environment: separate database, custom branding, independent admin roles, and zero data bleed.' },
  { q:'Is it compliant with Kenyan regulations?',   a:'Built for Kenya from day one. Burial permit tracking, county health API integrations, and all Kenyan documentation formats are included.' },
  { q:'How does the Family Portal work?',           a:'A secure SMS link — no app, no account needed. Families see real-time status, download documents, and pay directly from any phone.' },
  { q:'What onboarding and support is included?',   a:'All plans include guided onboarding, WhatsApp support, and training for your staff. Enterprise clients get a dedicated account manager.' },
];

const scroll = (id) => document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' });

export default function App() {
  const [faq,    setFaq]    = useState(null);
  const [nav,    setNav]    = useState(false);
  const [menu,   setMenu]   = useState(false);
  const [bill,   setBill]   = useState('monthly');
  const go = (p) => { window.location.href = p; };

  useEffect(() => {
    const fn = () => setNav(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = () => { if (window.innerWidth > 900) setMenu(false); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menu]);

  const plans = [
    { id:'standard', label:'Standard', sub:'Single branch',
      mo:7500, yr:Math.round(7500*12*.9),
      perks:['50 admissions/month','Family Portal SMS','M-PESA billing','Basic analytics','WhatsApp support'],
    },
    { id:'enterprise', label:'Enterprise', sub:'Multi-branch operations', hot:true,
      mo:18000, yr:Math.round(18000*12*.9),
      perks:['Unlimited admissions','Full branch isolation','Fleet GPS dispatch','Advanced analytics','County API integrations','Custom compliance reports','Dedicated account manager','24/7 priority support'],
    },
  ];

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
        img{display:block;max-width:100%;}

        /* ── Fonts ── */
        .cg{font-family:'Cormorant Garamond',Georgia,serif;}
        .syne{font-family:'Syne',sans-serif;}

        /* ── Nav ── */
        .nlink{font-family:'Syne',sans-serif;font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:${T.muted};cursor:pointer;transition:color .2s;padding:4px 0;position:relative;}
        .nlink::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:${T.g};transition:width .22s;}
        .nlink:hover{color:${T.white};}
        .nlink:hover::after{width:100%;}

        /* ── Buttons ── */
        .btn{font-family:'Syne',sans-serif;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:.72rem 1.4rem;border-radius:8px;cursor:pointer;transition:all .22s;border:none;display:inline-flex;align-items:center;gap:.45rem;white-space:nowrap;}
        .btn-g{background:${T.g};color:#000;box-shadow:0 4px 24px -6px rgba(4,200,0,.5);}
        .btn-g:hover{background:${T.gl};transform:translateY(-2px);box-shadow:0 8px 32px -6px rgba(4,200,0,.6);}
        .btn-g:active{transform:translateY(0);}
        .btn-o{background:rgba(255,255,255,.04);color:${T.light};border:1px solid rgba(255,255,255,.1);}
        .btn-o:hover{color:${T.g};border-color:rgba(4,200,0,.4);background:${T.ga};}
        .btn-gh{background:none;color:${T.muted};border:none;}
        .btn-gh:hover{color:${T.light};}

        /* ── Drawer ── */
        .ov{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:900;opacity:0;visibility:hidden;transition:all .28s;backdrop-filter:blur(6px);}
        .ov.on{opacity:1;visibility:visible;}
        .dr{position:fixed;top:0;right:-100%;width:min(88vw,320px);height:100dvh;background:${T.bg3};border-left:1px solid ${T.line};z-index:901;transition:right .3s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}
        .dr.on{right:0;}
        .dr-hd{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.25rem 1.25rem;border-bottom:1px solid ${T.line};flex-shrink:0;}
        .dr-body{flex:1;overflow-y:auto;padding:.75rem .875rem;}
        .dr-ft{padding:1rem .875rem 1.5rem;border-top:1px solid ${T.line};flex-shrink:0;display:flex;flex-direction:column;gap:.6rem;}
        .ml{font-family:'Syne',sans-serif;font-size:.85rem;font-weight:600;color:${T.mid};padding:.9rem .875rem;cursor:pointer;display:flex;align-items:center;gap:.65rem;border-radius:8px;transition:all .18s;letter-spacing:.04em;}
        .ml:hover{color:${T.white};background:rgba(255,255,255,.04);padding-left:1.1rem;}
        .ml-dot{width:4px;height:4px;border-radius:50%;background:${T.g};flex-shrink:0;}

        /* ── Sections ── */
        .sec{padding:7rem 0;}
        .sec-alt{background:${T.bg2};}
        .wrap{max-width:1200px;margin:0 auto;padding:0 1.75rem;}

        /* ── Labels ── */
        .eye{font-family:'Syne',sans-serif;font-size:.6rem;letter-spacing:.22em;text-transform:uppercase;color:${T.g};font-weight:700;display:inline-block;margin-bottom:.65rem;}
        .hl{font-size:clamp(2rem,5vw,3.8rem);line-height:1.1;font-weight:600;color:${T.white};letter-spacing:-.02em;}
        .hl-xl{font-size:clamp(2.5rem,7vw,5.2rem);line-height:1.05;font-weight:600;color:${T.white};letter-spacing:-.03em;}
        .body-copy{font-size:.88rem;color:${T.mid};line-height:1.75;}

        /* ── Horizontal rule ── */
        .rule{width:100%;height:1px;background:linear-gradient(90deg,transparent,${T.line2} 20%,${T.line2} 80%,transparent);}
        .rule-g{background:linear-gradient(90deg,transparent,rgba(4,200,0,.18) 30%,rgba(4,200,0,.18) 70%,transparent);}

        /* ── Cards ── */
        .card{background:rgba(255,255,255,.022);border:1px solid ${T.line};border-radius:14px;transition:border-color .25s,transform .25s,box-shadow .25s;}
        .card:hover{border-color:rgba(4,200,0,.25);transform:translateY(-4px);box-shadow:0 20px 50px -15px rgba(0,0,0,.7),0 0 0 1px rgba(4,200,0,.06);}
        .card-p{padding:1.75rem;}

        /* ── Feature grid ── */
        .fg{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;}
        @media(max-width:1024px){.fg{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:600px){.fg{grid-template-columns:1fr;gap:1rem;}}

        /* ── Portal grid ── */
        .pg{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;}
        @media(max-width:480px){.pg{grid-template-columns:1fr;}}
        .pi{display:flex;align-items:center;gap:.7rem;background:rgba(255,255,255,.022);border:1px solid ${T.line};border-radius:10px;padding:.75rem .9rem;transition:all .2s;}
        .pi:hover{border-color:rgba(4,200,0,.3);background:${T.ga2};}
        .pi-ic{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:${T.ga};color:${T.g};flex-shrink:0;}

        /* ── Market grid ── */
        .mg{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;}
        @media(max-width:900px){.mg{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:560px){.mg{grid-template-columns:1fr;gap:1rem;}}

        /* ── Pricing grid ── */
        .prg{display:grid;grid-template-columns:repeat(2,1fr);gap:1.25rem;max-width:860px;margin:0 auto;}
        @media(max-width:640px){.prg{grid-template-columns:1fr;}}

        /* ── FAQ ── */
        .fq{border-bottom:1px solid ${T.line};}
        .fq-btn{width:100%;background:none;border:none;color:${T.light};font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:400;text-align:left;padding:1.3rem 0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:1rem;transition:color .18s;}
        .fq-btn:hover{color:${T.g};}
        .fq-ic{width:24px;height:24px;border-radius:50%;border:1px solid ${T.line2};display:flex;align-items:center;justify-content:center;color:${T.g};font-size:1.1rem;font-weight:300;flex-shrink:0;transition:all .22s;}

        /* ── Cloud badges ── */
        .cb{display:inline-flex;align-items:center;gap:.45rem;background:rgba(4,200,0,.07);border:1px solid rgba(4,200,0,.15);border-radius:7px;padding:.38rem .8rem;font-family:'Syne',sans-serif;font-size:.62rem;color:${T.g};font-weight:600;letter-spacing:.05em;transition:background .2s;}
        .cb:hover{background:rgba(4,200,0,.12);}
        .cb-wrap{display:flex;flex-wrap:wrap;gap:.5rem;}

        /* ── Stat pill ── */
        .sp{display:flex;flex-direction:column;align-items:center;background:${T.ga};border:1px solid rgba(4,200,0,.15);border-radius:10px;padding:.65rem 1.1rem;min-width:88px;}
        .sp-v{font-family:'Syne',sans-serif;font-size:1.15rem;font-weight:800;color:${T.g};letter-spacing:-.02em;line-height:1;}
        .sp-l{font-size:.55rem;color:${T.muted};text-transform:uppercase;letter-spacing:.12em;margin-top:.25rem;}

        /* ── Hero layouts ── */
        .hg{display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center;}
        @media(max-width:960px){.hg{grid-template-columns:1fr;gap:2.5rem;}.hgr{text-align:center;}.hgr .trust,.hgr .ticker-row{justify-content:center;}}

        /* ── Two-col layout ── */
        .tc{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;}
        @media(max-width:900px){.tc{grid-template-columns:1fr;gap:2rem;}}

        /* ── Ticker ── */
        .ticker-row{display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;margin-bottom:2rem;}
        .ti{display:flex;align-items:center;gap:.35rem;font-family:'Syne',sans-serif;font-size:.58rem;color:${T.sub};letter-spacing:.1em;text-transform:uppercase;}
        .ti-dot{width:4px;height:4px;border-radius:50%;background:${T.g};animation:blink 2.2s infinite;}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:.3;}}

        /* ── Trust row ── */
        .trust{display:flex;flex-wrap:wrap;gap:1rem;margin-top:1.75rem;}
        .tr{display:flex;align-items:center;gap:.4rem;font-size:.7rem;color:${T.sub};}
        .tr-c{color:${T.g};}

        /* ── Floating dashboard cards ── */
        .fc{position:absolute;background:${T.bg3};border:1px solid ${T.line2};border-radius:10px;padding:.75rem 1rem;box-shadow:0 12px 40px rgba(0,0,0,.6);}

        /* ── Reserve button ── */
        .res{width:100%;padding:.65rem;border:none;background:linear-gradient(135deg,${T.g},${T.gd});color:#000;font-family:'Syne',sans-serif;font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border-radius:7px;cursor:pointer;margin-top:.9rem;transition:all .2s;box-shadow:0 3px 12px -3px rgba(4,200,0,.3);}
        .res:hover{filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 6px 20px -3px rgba(4,200,0,.45);}

        /* ── Pill toggle ── */
        .ptog{display:inline-flex;background:rgba(255,255,255,.03);border:1px solid ${T.line};border-radius:10px;padding:.3rem;}
        .popt{font-family:'Syne',sans-serif;font-size:.62rem;font-weight:700;letter-spacing:.08em;padding:.5rem 1.15rem;border-radius:7px;border:none;cursor:pointer;transition:all .2s;}
        .popt.on{background:${T.g};color:#000;box-shadow:0 2px 12px -2px rgba(4,200,0,.4);}
        .popt.off{background:none;color:${T.sub};}
        .popt.off:hover{color:${T.light};}

        /* ── CTA box ── */
        .ctabox{position:relative;background:linear-gradient(135deg,rgba(4,200,0,.08) 0%,rgba(4,200,0,.03) 100%);border:1px solid rgba(4,200,0,.15);border-radius:18px;padding:4rem 2rem;text-align:center;overflow:hidden;}
        .ctabox::before{content:'';position:absolute;top:-40%;left:50%;transform:translateX(-50%);width:70%;height:200%;background:radial-gradient(ellipse,rgba(4,200,0,.07) 0%,transparent 70%);pointer-events:none;}

        /* ── Large number feat stat ── */
        .fstat{font-family:'Cormorant Garamond',serif;font-size:2.4rem;font-weight:700;color:${T.g};line-height:1;letter-spacing:-.03em;}
        .fslbl{font-family:'Syne',sans-serif;font-size:.55rem;color:${T.sub};text-transform:uppercase;letter-spacing:.12em;margin-top:.2rem;}

        /* ── Section number ── */
        .fnum{font-family:'Cormorant Garamond',serif;font-size:.95rem;color:${T.dim};font-weight:600;letter-spacing:.05em;}

        /* ── Mkt badge ── */
        .mkt-badge{position:absolute;top:.75rem;right:.75rem;background:${T.g};color:#000;font-family:'Syne',sans-serif;font-size:.55rem;font-weight:800;letter-spacing:.08em;padding:.2rem .6rem;border-radius:20px;text-transform:uppercase;}

        /* ── FOOTER ── */
        .foot{background:${T.bg1};border-top:1px solid ${T.line};}
        .foot-inner{padding:3rem 0 0;}
        /* Top grid: logo col + 3 link cols */
        .foot-top{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:2rem;padding-bottom:2.5rem;}
        /* Trust strip: 3 cols on desktop */
        .foot-trust{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;padding:2rem 0;border-top:1px solid ${T.line};border-bottom:1px solid ${T.line};}
        .fti{display:flex;align-items:center;gap:.5rem;}
        .fti-ic{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:7px;background:${T.ga};color:${T.g};flex-shrink:0;}
        /* Bottom bar */
        .foot-bot{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.25rem 0;flex-wrap:wrap;}
        .foot-links{display:flex;gap:1.25rem;flex-wrap:wrap;}
        .fl{font-size:.68rem;color:${T.sub};cursor:pointer;transition:color .18s;font-family:'Syne',sans-serif;letter-spacing:.06em;}
        .fl:hover{color:${T.g};}

        /* ── FOOTER RESPONSIVE ── */
        @media(max-width:900px){
          .foot-top{grid-template-columns:1fr 1fr;gap:1.5rem;}
          .foot-trust{grid-template-columns:repeat(3,1fr);gap:1rem;}
        }
        @media(max-width:640px){
          .foot-top{grid-template-columns:1fr 1fr;gap:1.25rem;}
          .foot-trust{grid-template-columns:repeat(2,1fr);gap:.875rem;}
          .foot-bot{flex-direction:column;align-items:flex-start;gap:.75rem;padding:1rem 0 1.5rem;}
          .foot-links{gap:1rem;}
        }
        @media(max-width:400px){
          .foot-top{grid-template-columns:1fr;gap:1rem;}
          .foot-trust{grid-template-columns:1fr 1fr;gap:.75rem;}
        }

        /* ── General responsive ── */
        @media(max-width:960px){.sec{padding:5rem 0;}}
        @media(max-width:640px){.sec{padding:3.5rem 0;}.wrap{padding:0 1.1rem;}}
        @media(max-width:480px){.sec{padding:3rem 0;}}
        @media(min-width:901px){.mob-only{display:none!important;}}
        @media(max-width:900px){.desk-only{display:none!important;}}

        /* ── Decorative grid lines ── */
        .grid-lines{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:80px 80px;pointer-events:none;}

        /* ── Glow orbs ── */
        .orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(80px);}

        /* ── Pricing check ── */
        .pck{display:flex;align-items:center;gap:.55rem;font-size:.78rem;color:${T.mid};margin-bottom:.55rem;}
        .pck-ic{color:${T.g};flex-shrink:0;}

        /* ── Number divider line ── */
        .num-divider{display:flex;align-items:center;gap:1rem;margin-bottom:2.5rem;}
        .nd-line{flex:1;height:1px;background:${T.line};}
        .nd-num{font-family:'Cormorant Garamond',serif;font-size:.85rem;color:${T.dim};font-weight:600;}

        /* ── Version tag ── */
        .vtag{font-family:'Syne',sans-serif;font-size:.55rem;color:${T.g};background:${T.ga};border:1px solid rgba(4,200,0,.18);border-radius:5px;padding:.2rem .55rem;letter-spacing:.08em;}

        /* ── Hero badge ── */
        .hbadge{display:inline-flex;align-items:center;gap:.5rem;background:${T.ga};border:1px solid rgba(4,200,0,.2);border-radius:8px;padding:.45rem .9rem;font-family:'Syne',sans-serif;font-size:.58rem;color:${T.g};font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:1.25rem;}

        /* ── Highlight text ── */
        .hi{color:${T.g};font-style:italic;}

        /* ── Divider dot ── */
        .ddot{width:3px;height:3px;border-radius:50%;background:${T.dim};display:inline-block;margin:0 .5rem;vertical-align:middle;}

        /* ── Section count badge ── */
        .scnt{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;border:1px solid ${T.line2};font-family:'Cormorant Garamond',serif;font-size:.8rem;color:${T.sub};flex-shrink:0;}

        /* ── Feat card inner top ── */
        .fct{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem;}

        /* ── Marquee ── */
        @keyframes mq{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
        .mq-track{display:flex;white-space:nowrap;animation:mq 28s linear infinite;}
        .mq-item{display:inline-flex;align-items:center;gap:.5rem;font-family:'Syne',sans-serif;font-size:.6rem;color:${T.sub};letter-spacing:.14em;text-transform:uppercase;padding:0 2rem;}
        .mq-sep{color:${T.g};font-size:.5rem;}
      `}</style>

      {/* ── Mobile Overlay + Drawer ────────────────────────────────── */}
      <div className={`ov ${menu?'on':''}`} onClick={() => setMenu(false)} />
      <aside className={`dr ${menu?'on':''}`}>
        <div className="dr-hd">
          <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
            <div style={{width:'7px',height:'7px',borderRadius:'50%',background:T.g,boxShadow:T.gs}} />
            <span className="syne" style={{fontSize:'.78rem',fontWeight:800,color:T.white,letterSpacing:'.12em'}}>REST POINT</span>
          </div>
          <button onClick={() => setMenu(false)} style={{background:'none',border:'none',cursor:'pointer',color:T.mid,padding:'.2rem'}}>{I.x}</button>
        </div>
        <div className="dr-body">
          {[['Features','features'],['Cloud','cloud'],['Marketplace','marketplace'],['Pricing','pricing'],['FAQ','faq']].map(([l,id]) => (
            <div key={id} className="ml" onClick={() => {scroll(id);setMenu(false);}}>
              <span className="ml-dot" />{l}
            </div>
          ))}
        </div>
        <div className="dr-ft">
          <button onClick={() => go('/portal')} className="btn btn-o" style={{width:'100%',justifyContent:'center'}}>Family Portal</button>
          <button onClick={() => go('/login')} className="btn btn-o" style={{width:'100%',justifyContent:'center'}}>Log in</button>
          <button onClick={() => go('/register')} className="btn btn-g" style={{width:'100%',justifyContent:'center'}}>Start free trial {I.arr}</button>
        </div>
      </aside>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav style={{
        position:'fixed',top:0,left:0,right:0,zIndex:300,
        background: nav ? 'rgba(4,4,4,.94)' : 'transparent',
        borderBottom: nav ? `1px solid ${T.line}` : '1px solid transparent',
        padding:'.9rem 0', transition:'all .3s ease',
        backdropFilter: nav ? 'blur(24px) saturate(1.4)' : 'none',
      }}>
        <div className="wrap" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:'.8rem',cursor:'pointer'}} onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',background:T.ga,border:`1px solid rgba(4,200,0,.2)`,borderRadius:'8px',padding:'.4rem .9rem'}}>
              <div style={{width:'6px',height:'6px',borderRadius:'50%',background:T.g,boxShadow:`0 0 10px ${T.g}`}} />
              <span className="syne" style={{fontSize:'.72rem',fontWeight:800,letterSpacing:'.16em',color:T.g}}>REST POINT</span>
            </div>
            <span className="syne" style={{fontSize:'.5rem',color:T.sub,letterSpacing:'.14em',textTransform:'uppercase'}} >Mortuary OS</span>
          </div>

          {/* Desktop */}
          <div className="desk-only" style={{display:'flex',alignItems:'center',gap:'1.75rem'}}>
            {[['Features','features'],['Cloud','cloud'],['Marketplace','marketplace'],['Pricing','pricing'],['FAQ','faq']].map(([l,id]) => (
              <span key={id} className="nlink" onClick={() => scroll(id)}>{l}</span>
            ))}
            <div style={{width:'1px',height:'14px',background:T.line}} />
            <button onClick={() => go('/portal')} className="btn btn-gh" style={{padding:'.4rem .75rem',fontSize:'.62rem'}}>Portal</button>
            <button onClick={() => go('/login')} className="btn btn-o" style={{padding:'.44rem .9rem',fontSize:'.62rem'}}>Log in</button>
            <button onClick={() => go('/register')} className="btn btn-g" style={{padding:'.44rem 1.1rem',fontSize:'.62rem'}}>Start free {I.arr}</button>
          </div>

          {/* Mobile hamburger */}
          <button className="mob-only" onClick={() => setMenu(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'.5rem',color:T.light}}>{I.menu}</button>
        </div>
      </nav>

      <main style={{paddingTop:'68px'}}>

        {/* ══════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════ */}
        <section style={{padding:'5rem 0 6rem',position:'relative',overflow:'hidden'}}>
          {/* Background */}
          <div className="grid-lines" />
          <div className="orb" style={{top:'-20%',right:'-8%',width:'700px',height:'700px',background:'radial-gradient(circle,rgba(4,200,0,.06) 0%,transparent 70%)'}} />
          <div className="orb" style={{bottom:'-10%',left:'10%',width:'500px',height:'400px',background:'radial-gradient(circle,rgba(4,200,0,.04) 0%,transparent 70%)'}} />

          <div className="wrap">
            {/* Ticker */}
            <div className="ticker-row">
              <div className="ti"><span className="ti-dot" />v2.0 live</div>
              <div style={{width:'1px',height:'12px',background:T.line}} className="desk-only" />
              <div className="ti desk-only">🇰🇪 Built for East Africa</div>
              <div style={{width:'1px',height:'12px',background:T.line}} className="desk-only" />
              <div className="ti">ISO 27001:2022</div>
              <div style={{width:'1px',height:'12px',background:T.line}} className="desk-only" />
              <div className="ti desk-only">24/7 support</div>
            </div>

            <div className="hg">
              {/* Left */}
              <div className="hgr">
                <div className="hbadge">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill={T.g}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  Enterprise-grade Mortuary OS
                </div>

                <h1 className="cg hl-xl" style={{marginBottom:'1.5rem',fontWeight:600}}>
                  Run mortal care<br />
                  with <span className="hi">speed</span> &{' '}
                  <span style={{position:'relative',display:'inline-block'}}>
                    precision
                    <span style={{position:'absolute',bottom:'4px',left:0,right:0,height:'2px',background:`linear-gradient(90deg,${T.g},transparent)`,borderRadius:'2px'}} />
                  </span>.
                </h1>

                <p className="body-copy" style={{maxWidth:'480px',marginBottom:'2rem'}}>
                  From admission to billing, documents, family updates and marketplace — Rest Point centralises every mortuary workflow on one platform built for Kenya.
                </p>

                <div style={{display:'flex',flexWrap:'wrap',gap:'.8rem'}}>
                  <button onClick={() => go('/register')} className="btn btn-g" style={{padding:'.85rem 1.75rem',fontSize:'.7rem'}}>Start free trial {I.arr}</button>
                  <button onClick={() => scroll('features')} className="btn btn-o" style={{padding:'.85rem 1.75rem',fontSize:'.7rem'}}>See features {I.arrDn}</button>
                </div>

                <div className="trust">
                  {['No credit card needed','30-day free trial','Cancel anytime'].map(t => (
                    <div key={t} className="tr"><span className="tr-c">{I.check}</span>{t}</div>
                  ))}
                </div>
              </div>

              {/* Right — Dashboard image */}
              <div style={{position:'relative'}}>
                <div style={{background:'rgba(255,255,255,.02)',border:`1px solid ${T.line}`,borderRadius:'16px',padding:'1rem',position:'relative',boxShadow:'0 40px 80px -20px rgba(0,0,0,.8)'}}>
                  {/* Faux chrome bar */}
                  <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.9rem',paddingBottom:'.9rem',borderBottom:`1px solid ${T.line}`}}>
                    <div style={{display:'flex',gap:'.35rem'}}>
                      {['#FF5F57','#FEBC2E','#28C840'].map(c=><div key={c} style={{width:'9px',height:'9px',borderRadius:'50%',background:c}} />)}
                    </div>
                    <div style={{flex:1,background:T.bg4,borderRadius:'5px',padding:'.28rem .7rem',fontSize:'.58rem',fontFamily:'monospace',color:T.sub}}>restpoint.app/dashboard</div>
                  </div>
                  <img src="/landing.png" alt="Rest Point Dashboard" style={{width:'100%',borderRadius:'10px',maxHeight:'400px',objectFit:'cover'}} />
                </div>
                {/* Floating cards */}
                <div className="fc" style={{bottom:'-1.25rem',left:'-1.25rem'}}>
                  <div style={{fontSize:'.52rem',fontFamily:'Syne,sans-serif',color:T.muted,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:'.2rem'}}>Today's Admissions</div>
                  <div className="cg" style={{fontSize:'2rem',fontWeight:700,color:T.g,lineHeight:1}}>12</div>
                </div>
                <div className="fc" style={{top:'.75rem',right:'-1.25rem'}}>
                  <div style={{fontSize:'.52rem',fontFamily:'Syne,sans-serif',color:T.muted,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:'.2rem'}}>Revenue MTD</div>
                  <div className="syne" style={{fontSize:'1.05rem',fontWeight:800,color:T.white,lineHeight:1}}>KES 284k</div>
                </div>
                <div className="fc" style={{bottom:'-1.25rem',right:'10%'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.35rem'}}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',background:T.g,boxShadow:`0 0 8px ${T.g}`}} />
                    <span style={{fontSize:'.6rem',fontFamily:'Syne,sans-serif',color:T.mid}}>All systems live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee strip */}
        <div style={{overflow:'hidden',background:T.bg2,borderTop:`1px solid ${T.line}`,borderBottom:`1px solid ${T.line}`,padding:'.8rem 0'}}>
          <div className="mq-track">
            {[...Array(2)].map((_,ri) => (
              <span key={ri}>
                {['Deceased Records','M-PESA Billing','Family Portal','Fleet Dispatch','Compliance Reports','QR Tagging','Embalming Workflows','Multi-Branch','Kenya-Compliant'].map(txt => (
                  <span key={txt} className="mq-item">{txt}<span className="mq-sep">◆</span></span>
                ))}
              </span>
            ))}
          </div>
        </div>

        <div className="rule rule-g" />

        {/* ══════════════════════════════════════════════════════════
            FEATURES
        ══════════════════════════════════════════════════════════ */}
        <section id="features" className="sec sec-alt">
          <div className="wrap">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'3rem',flexWrap:'wrap',gap:'1.5rem'}}>
              <div>
                <span className="eye">Core Capabilities</span>
                <h2 className="cg hl">A single platform<br />for every workflow.</h2>
              </div>
              <p className="body-copy" style={{maxWidth:'320px'}}>Six core modules. Zero context-switching. Every workflow your mortuary needs, in one place.</p>
            </div>

            <div className="fg">
              {features.map(f => (
                <div key={f.n} className="card card-p">
                  <div className="fct">
                    <span className="fnum">{f.n}</span>
                    <div style={{textAlign:'right'}}>
                      <div className="fstat">{f.stat}</div>
                      <div className="fslbl">{f.slabel}</div>
                    </div>
                  </div>
                  <div style={{height:'1px',background:T.line,marginBottom:'1.25rem'}} />
                  <h3 className="syne" style={{fontSize:'.85rem',fontWeight:700,color:T.white,marginBottom:'.6rem',letterSpacing:'.02em'}}>{f.title}</h3>
                  <p style={{fontSize:'.78rem',color:T.muted,lineHeight:1.7}}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="rule" />

        {/* ══════════════════════════════════════════════════════════
            CLOUD
        ══════════════════════════════════════════════════════════ */}
        <section id="cloud" className="sec" style={{position:'relative',overflow:'hidden'}}>
          <div className="orb" style={{top:'20%',left:'-8%',width:'500px',height:'500px',background:'radial-gradient(circle,rgba(4,200,0,.05) 0%,transparent 70%)'}} />
          <div className="wrap" style={{position:'relative',zIndex:1}}>
            <div style={{textAlign:'center',marginBottom:'3.5rem'}}>
              <span className="eye">Infrastructure</span>
              <h2 className="cg hl">Contabo Cloud.<br /><span className="hi">Yours alone.</span></h2>
              <p className="body-copy" style={{maxWidth:'520px',margin:'1rem auto 0'}}>Dedicated enterprise servers — never shared. 99.99% uptime SLA. Your data stays in your environment.</p>
            </div>

            <div className="tc">
              <div style={{background:'rgba(255,255,255,.02)',border:`1px solid ${T.line}`,borderRadius:'16px',padding:'1rem',boxShadow:'0 30px 60px -15px rgba(0,0,0,.7)'}}>
                <img src="/cloud.png" alt="Cloud Infrastructure" style={{width:'100%',borderRadius:'10px'}} />
              </div>
              <div>
                <div className="cb-wrap" style={{marginBottom:'1.75rem'}}>
                  {[[I.srv,'Contabo Dedicated Servers'],[I.ms,'Microservices Architecture'],[I.tls,'OSI Layer 7 Gateway'],[I.lock,'TLS 1.3 End-to-End'],[I.cloud,'Auto-scaling Clusters'],[I.hb,'24/7 Monitoring']].map(([ic,l]) => (
                    <div key={l} className="cb">{ic}{l}</div>
                  ))}
                </div>
                {/* Cloudflare DDoS Protection Badge */}
                <div style={{marginBottom:'1.75rem',padding:'1rem',background:'rgba(247,140,0,0.06)',border:'1px solid rgba(247,140,0,0.2)',borderRadius:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.5rem'}}>
                    {I.shield}
                    <span className="syne" style={{fontSize:'0.85rem',fontWeight:700,color:'#f78c00',letterSpacing:'0.03em'}}>Cloudflare DDoS Protection</span>
                  </div>
                  <p style={{fontSize:'0.75rem',color:T.muted,lineHeight:1.6}}>
                    Enterprise-grade DDoS mitigation powered by Cloudflare. Your mortuary data is protected against volumetric attacks, application-layer attacks, and advanced persistent threats. 
                    <span style={{color:'#f78c00',fontWeight:600}}> Zero downtime guaranteed.</span>
                  </p>
                </div>
                <p className="body-copy" style={{marginBottom:'1.75rem'}}>Each service runs in isolated containers with independent scaling. Multi-region backups, AES-256 encryption at rest and in transit. You own your data — we own the infrastructure.</p>
                <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap'}}>
                  {[['99.99%','Uptime SLA'],['< 200ms','API Response'],['Daily','Backups'],['AES-256','Encryption']].map(([v,l]) => (
                    <div key={l} className="sp"><span className="sp-v">{v}</span><span className="sp-l">{l}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="rule rule-g" />

        {/* ══════════════════════════════════════════════════════════
            FAMILY PORTAL
        ══════════════════════════════════════════════════════════ */}
        <section className="sec sec-alt">
          <div className="wrap">
            <div className="tc">
              <div>
                <span className="eye">Family Portal</span>
                <h2 className="cg hl" style={{marginBottom:'1.25rem'}}>Families stay<br /><span className="hi">informed.</span><br />Without friction.</h2>
                <p className="body-copy" style={{marginBottom:'1.75rem'}}>A secure SMS link — no app, no account needed. Real-time status, documents, billing and direct chat. Reduces support overhead by 70%.</p>
                <div className="pg" style={{marginBottom:'1.75rem'}}>
                  {portalFeats.map((pf,i) => (
                    <div key={i} className="pi">
                      <div className="pi-ic">{pf.icon}</div>
                      <span className="syne" style={{fontSize:'.72rem',fontWeight:600,color:T.light,letterSpacing:'.03em'}}>{pf.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => go('/portal')} className="btn btn-o" style={{fontSize:'.68rem'}}>View Portal Demo {I.arr}</button>
              </div>
              <div style={{background:'rgba(255,255,255,.02)',border:`1px solid ${T.line}`,borderRadius:'16px',padding:'1rem',boxShadow:'0 30px 60px -15px rgba(0,0,0,.7)'}}>
                <img src="/familyportal.png" alt="Family Portal" style={{width:'100%',borderRadius:'10px'}} />
              </div>
            </div>
          </div>
        </section>

        <div className="rule" />

        {/* ══════════════════════════════════════════════════════════
            MARKETPLACE
        ══════════════════════════════════════════════════════════ */}
        <section id="marketplace" className="sec" style={{position:'relative',overflow:'hidden'}}>
          <div className="orb" style={{top:'-10%',right:'-5%',width:'450px',height:'450px',background:'radial-gradient(circle,rgba(4,200,0,.05) 0%,transparent 70%)'}} />
          <div className="wrap" style={{position:'relative',zIndex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'3rem',flexWrap:'wrap',gap:'1.5rem'}}>
              <div>
                <div style={{display:'inline-flex',alignItems:'center',gap:'.5rem',marginBottom:'.65rem'}}>
                  {I.store}<span className="eye" style={{marginBottom:0}}>Integrated Storefront</span>
                </div>
                <h2 className="cg hl">Sell grief care products<br /><span className="hi">directly.</span></h2>
              </div>
              <p className="body-copy" style={{maxWidth:'300px'}}>List products, manage inventory, and accept M-PESA payments — all inside your dashboard.</p>
            </div>
            <div className="mg">
              {mktItems.map((it,i) => (
                <div key={i} className="card" style={{overflow:'hidden'}}>
                  <div style={{position:'relative',width:'100%',height:'150px',background:`linear-gradient(145deg,${T.bg4} 0%,#181818 100%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'3rem'}}>
                    🕊️
                    <div className="mkt-badge">{it.tag}</div>
                  </div>
                  <div style={{padding:'1.25rem'}}>
                    <div className="syne" style={{fontSize:'.55rem',color:T.g,textTransform:'uppercase',letterSpacing:'.14em',fontWeight:700,marginBottom:'.4rem'}}>{it.cat}</div>
                    <h4 style={{fontSize:'.92rem',fontWeight:500,color:T.white,marginBottom:'.8rem'}}>{it.name}</h4>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'.3rem'}}>
                      <span style={{fontSize:'.65rem',color:T.muted}}>{it.sold}+ sold</span>
                      <span className="syne" style={{color:T.g,fontWeight:800,fontSize:'.95rem'}}>{it.price}</span>
                    </div>
                    <button className="res" onClick={() => alert(`Reserved: ${it.name}`)}>Reserve →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="rule rule-g" />

        {/* ══════════════════════════════════════════════════════════
            PRICING
        ══════════════════════════════════════════════════════════ */}
        <section id="pricing" className="sec sec-alt">
          <div className="wrap">
            <div style={{textAlign:'center',marginBottom:'3rem'}}>
              <span className="eye">Pricing</span>
              <h2 className="cg hl" style={{marginBottom:'1rem'}}>Transparent plans.<br /><span className="hi">No surprises.</span></h2>
              <div className="ptog">
                <button className={`popt ${bill==='monthly'?'on':'off'}`} onClick={()=>setBill('monthly')}>Monthly</button>
                <button className={`popt ${bill==='yearly'?'on':'off'}`} onClick={()=>setBill('yearly')}>Yearly · Save 10%</button>
              </div>
            </div>
            <div className="prg">
              {plans.map(p => {
                const price = bill==='monthly' ? p.mo : p.yr;
                return (
                  <div key={p.id} className="card card-p" style={{position:'relative',border:p.hot?`1px solid rgba(4,200,0,.4)`:`1px solid ${T.line}`,background:p.hot?'rgba(4,200,0,.05)':'rgba(255,255,255,.02)'}}>
                    {p.hot && <div className="syne" style={{position:'absolute',top:'-.7rem',left:'1.25rem',background:T.g,color:'#000',fontSize:'.55rem',fontWeight:800,padding:'.22rem .8rem',borderRadius:'20px',letterSpacing:'.1em',textTransform:'uppercase'}}>Most Popular</div>}
                    <div style={{marginBottom:'1.5rem'}}>
                      <div className="syne" style={{fontSize:'.58rem',letterSpacing:'.14em',textTransform:'uppercase',color:T.g,fontWeight:700,marginBottom:'.5rem'}}>{p.label}</div>
                      <div style={{display:'flex',alignItems:'baseline',gap:'.3rem',marginBottom:'.3rem'}}>
                        <span className="cg" style={{fontSize:'2.8rem',fontWeight:700,color:T.white,letterSpacing:'-.03em',lineHeight:1}}>KES {price.toLocaleString()}</span>
                        <span className="syne" style={{fontSize:'.62rem',color:T.muted}}>{bill==='monthly'?'/mo':'/yr'}</span>
                      </div>
                      <p style={{fontSize:'.75rem',color:T.muted}}>{p.sub}</p>
                    </div>
                    <div style={{height:'1px',background:T.line,marginBottom:'1.25rem'}} />
                    <div style={{marginBottom:'1.75rem'}}>
                      {p.perks.map(pk => (
                        <div key={pk} className="pck"><span className="pck-ic">{I.check}</span>{pk}</div>
                      ))}
                    </div>
                    <button onClick={() => go('/register')} className="btn" style={{width:'100%',justifyContent:'center',padding:'.75rem',fontSize:'.65rem',background:p.hot?T.g:'rgba(4,200,0,.12)',color:p.hot?'#000':T.g,boxShadow:p.hot?'0 4px 20px -4px rgba(4,200,0,.5)':'none',borderRadius:'8px',fontFamily:'Syne,sans-serif',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase'}}>
                      Get started {I.arr}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="rule" />

        {/* ══════════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════════ */}
        <section id="faq" className="sec">
          <div className="wrap" style={{maxWidth:'780px'}}>
            <div style={{textAlign:'center',marginBottom:'3rem'}}>
              <span className="eye">FAQ</span>
              <h2 className="cg hl">Questions?<br /><span className="hi">Answered.</span></h2>
            </div>
            {faqs.map((f,i) => (
              <div key={i} className="fq">
                <button className="fq-btn" onClick={() => setFaq(faq===i?null:i)}>
                  <span>{f.q}</span>
                  <div className="fq-ic" style={{borderColor:faq===i?T.g:`${T.line2}`,background:faq===i?T.ga:'transparent',transform:faq===i?'rotate(45deg)':'none'}}>+</div>
                </button>
                {faq===i && <p className="body-copy" style={{paddingBottom:'1.5rem',maxWidth:'640px'}}>{f.a}</p>}
              </div>
            ))}
          </div>
        </section>

        <div className="rule rule-g" />

        {/* ══════════════════════════════════════════════════════════
            CTA
        ══════════════════════════════════════════════════════════ */}
        <section className="sec sec-alt" style={{padding:'4rem 0'}}>
          <div className="wrap" style={{maxWidth:'740px'}}>
            <div className="ctabox">
              <div className="hbadge" style={{marginBottom:'1.25rem'}}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill={T.g}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Trusted by 200+ East African mortuaries
              </div>
              <h2 className="cg" style={{fontSize:'clamp(1.8rem,5vw,3rem)',color:T.white,fontWeight:600,marginBottom:'.9rem',lineHeight:1.2}}>Ready to transform<br /><span className="hi">your operations?</span></h2>
              <p className="body-copy" style={{maxWidth:'460px',margin:'0 auto 2rem'}}>Start your free 30-day trial today. No credit card required. Onboarding support included with every plan.</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:'.85rem',justifyContent:'center'}}>
                <button onClick={() => go('/register')} className="btn btn-g" style={{padding:'.9rem 2rem',fontSize:'.72rem'}}>Start free trial {I.arr}</button>
                <button onClick={() => go('/login')} className="btn btn-o" style={{padding:'.9rem 2rem',fontSize:'.72rem'}}>Book a demo</button>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════ */}
        <footer className="foot">
          <div className="wrap foot-inner">

            {/* Top grid */}
            <div className="foot-top">
              {/* Brand col */}
              <div>
                <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.75rem'}}>
                  <div style={{width:'6px',height:'6px',borderRadius:'50%',background:T.g,boxShadow:`0 0 8px ${T.g}`}} />
                  <span className="syne" style={{fontSize:'.78rem',fontWeight:800,color:T.white,letterSpacing:'.14em'}}>REST POINT</span>
                </div>
                <p style={{fontSize:'.72rem',color:T.sub,lineHeight:1.7,maxWidth:'220px',marginBottom:'1rem'}}>The complete mortuary operating system, built for East Africa.</p>
                <div className="vtag">v2cloud.2026.RP</div>
              </div>

              {/* Product col */}
              <div>
                <div className="syne" style={{fontSize:'.58rem',color:T.muted,letterSpacing:'.14em',textTransform:'uppercase',marginBottom:'1rem'}}>Product</div>
                {['Features','Family Portal','Marketplace','Pricing','API Docs'].map(l => (
                  <div key={l} style={{fontSize:'.73rem',color:T.sub,marginBottom:'.55rem',cursor:'pointer',transition:'color .18s'}} onMouseEnter={e=>e.target.style.color=T.g} onMouseLeave={e=>e.target.style.color=T.sub}>{l}</div>
                ))}
              </div>

              {/* Company col */}
              <div>
                <div className="syne" style={{fontSize:'.58rem',color:T.muted,letterSpacing:'.14em',textTransform:'uppercase',marginBottom:'1rem'}}>Company</div>
                {['About','Blog','Careers','Press','Contact'].map(l => (
                  <div key={l} style={{fontSize:'.73rem',color:T.sub,marginBottom:'.55rem',cursor:'pointer',transition:'color .18s'}} onMouseEnter={e=>e.target.style.color=T.g} onMouseLeave={e=>e.target.style.color=T.sub}>{l}</div>
                ))}
              </div>

              {/* Legal col */}
              <div>
                <div className="syne" style={{fontSize:'.58rem',color:T.muted,letterSpacing:'.14em',textTransform:'uppercase',marginBottom:'1rem'}}>Legal</div>
                {['Privacy Policy','Terms of Service','Security','Cookie Policy','GDPR'].map(l => (
                  <div key={l} style={{fontSize:'.73rem',color:T.sub,marginBottom:'.55rem',cursor:'pointer',transition:'color .18s'}} onMouseEnter={e=>e.target.style.color=T.g} onMouseLeave={e=>e.target.style.color=T.sub}>{l}</div>
                ))}
              </div>
            </div>

            {/* Trust strip */}
            <div className="foot-trust">
              {[
                [I.lock,  'AES-256 Encryption','At rest & in transit'],
                [I.db,    'Daily Backups','Point-in-time recovery'],
                [I.cloud, 'Contabo Cloud','Multi-region enterprise'],
                [I.shield,'Cloudflare DDoS','Enterprise protection'],
                [I.users, 'Tenant Isolation','DB per tenant'],
                [I.log,   'Audit Logging','Immutable records'],
              ].map(([ic,v,sub]) => (
                <div key={v} className="fti">
                  <div className="fti-ic">{ic}</div>
                  <div>
                    <div className="syne" style={{fontSize:'.62rem',fontWeight:700,color:T.light,letterSpacing:'.03em'}}>{v}</div>
                    <div style={{fontSize:'.58rem',color:T.muted,marginTop:'.1rem'}}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div className="foot-bot">
              <div style={{fontSize:'.65rem',color:T.sub}}>© {new Date().getFullYear()} Rest Point. All rights reserved. We own infrastructure · You own data.</div>
              <div className="foot-links">
                {['Privacy','Terms','Security','Support'].map(l=>(
                  <span key={l} className="fl">{l}</span>
                ))}
              </div>
            </div>

          </div>
        </footer>

      </main>
    </>
  );
}