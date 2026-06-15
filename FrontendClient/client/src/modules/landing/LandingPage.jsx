import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
/* REST POINT — Premium Funeral Home Management Platform | Built by Welt Tallis Technologies */
const C = { navy900:'#0A1F3D',navy800:'#0F2847',navy50:'#F9FAFB',char700:'#374151',char600:'#4B5563',char500:'#6B7280',char300:'#D1D5DB',char200:'#E5E7EB',char100:'#F3F4F6',gold:'#A67C52',goldD:'#8B6340',emerald:'#059669' };
const Svg = ({d,sw=2}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const Icons = {
  arrow:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  check:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  lock:<Svg d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>,
  shield:<Svg d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>,
  users:<Svg d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>,
  zap:<Svg d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>,
  file:<Svg d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="13" x2="8" y2="13"/><line x1="12" y1="17" x2="8" y2="17"/></>}/>,
  globe:<Svg d={<><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>,
  heart:<Svg d={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>}/>,
  menu:<Svg d={<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}/>,
  close:<Svg d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>,
  flame:<Svg d={<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>}/>,
  star:<svg width="16" height="16" viewBox="0 0 24 24" fill={C.gold}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  shop:<Svg d={<><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>}/>,
  clock:<Svg d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>,
  dollar:<Svg d={<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>}/>,
  truck:<Svg d={<><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>}/>,
  award:<Svg d={<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>}/>,
  barChart:<Svg d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>,
  sms:<Svg d={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}/>,
  calendar:<Svg d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>,
};

const FEATURES = [
  { icon:Icons.zap, title:'Case Management', desc:'Track every service from first call to final arrangements. Real-time updates, timeline tracking, auto-notifications, and complete digital case history.', color:'#059669' },
  { icon:Icons.heart, title:'Family Portal', desc:'Families get a secure SMS link (no app needed) to view documents, track progress, receive billing, make M-PESA payments, and communicate with your team.', color:C.gold },
  { icon:Icons.file, title:'Document Editor', desc:'Built-in canvas-based document creator with smart templates for burial permits, death certificates, invoices, and release forms. Generate, sign, and share in minutes.', color:'#3B82F6' },
  { icon:Icons.globe, title:'Integrated Marketplace', desc:'Turn your funeral home into a one-stop shop. Connect families with trusted florists, caterers, keepsake vendors. Earn up to 20% commission on every transaction.', color:'#8B5CF6' },
  { icon:Icons.users, title:'Team Collaboration', desc:'Real-time coordination across directors, drivers, embalmers, and admin staff. Role-based permissions, shared calendars, task assignments, and full audit trails.', color:'#EC4899' },
  { icon:Icons.barChart, title:'Reporting & Analytics', desc:'Live dashboard tracking revenue, case volumes, billing status, and staff performance. Export custom reports. Data-driven decisions for business growth.', color:'#F59E0B' },
  { icon:Icons.truck, title:'Dispatch & Hearse Tracking', desc:'GPS-enabled dispatch tracking for hearses and vehicles. Real-time location updates, route optimization, and automated family notifications on arrival.', color:'#10B981' },
  { icon:Icons.calendar, title:'Calendar & Scheduling', desc:'Manage funeral services, viewings, and team schedules in one place. Automated reminders, conflict detection, and shared team calendars.', color:'#6366F1' },
  { icon:Icons.dollar, title:'Billing & Invoicing', desc:'Automated invoicing with M-PESA integration, payment tracking, and financial reporting. Reduce billing errors and accelerate payment collection.', color:'#14B8A6' },
];

const REASONS = [
  { icon:Icons.clock, title:'Save 60% of Admin Time', desc:'Automate repetitive tasks like scheduling, billing, and document generation. Your team focuses on serving families.' },
  { icon:Icons.heart, title:'Families Love It', desc:'The Family Portal gives loved ones real-time updates, document access, and secure communication—no app download required.' },
  { icon:Icons.dollar, title:'New Revenue Streams', desc:'The integrated marketplace lets you earn commission on flowers, catering, and memorial items. Additional income with zero extra work.' },
  { icon:Icons.shield, title:'Enterprise Security', desc:'Bank-level encryption, role-based access, and complete audit trails. Your data and families\' information are always protected.' },
  { icon:Icons.globe, title:'Global Memorial Board', desc:'Families worldwide can light candles, leave messages, and participate in memorials. A powerful emotional connection.' },
  { icon:Icons.award, title:'Trusted by 100+ Homes', desc:'Across Kenya and East Africa, funeral professionals trust Rest Point to manage their operations and serve families with dignity.' },
  { icon:Icons.sms, title:'SMS Notifications', desc:'Automated SMS updates at every milestone. Families stay informed without calling. Reduce phone calls by 70%.' },
  { icon:Icons.truck, title:'GPS Dispatch Tracking', desc:'Track hearses in real-time. Families receive automated arrival notifications. Optimize routes and reduce fuel costs.' },
  { icon:Icons.barChart, title:'Data-Driven Decisions', desc:'Live dashboards with revenue, case volumes, and staff performance. Export custom reports.' },
];

const TESTIMONIALS = [
  { author:'Sarah Chen', role:'Director, Eternal Rest', text:'Welt Tallis cut our admin time by 60%. Families are more satisfied.', stat:'60% time savings' },
  { author:'James Okonkwo', role:'Manager, Heritage Services', text:'The Family Portal has been transformative. We\'ve seen more 5-star reviews.', stat:'45% more reviews' },
  { author:'Maria Santos', role:'Owner, Compassionate Care', text:'The marketplace integration has opened new revenue opportunities.', stat:'+$8K/month' },
  { author:'David Mwangi', role:'Director, Grace & Peace', text:'The memorial board is incredible. Families worldwide can light candles.', stat:'3x engagement' },
  { author:'Grace Wanjiku', role:'Manager, Serene Rest', text:'GPS dispatch tracking has been a game-changer. Families love real-time updates.', stat:'70% fewer calls' },
  { author:'Peter Ochieng', role:'Owner, Legacy Services', text:'The document editor saved us hours every week. Permits in minutes.', stat:'4x faster docs' },
];

const TRUST = [
  { icon:Icons.lock, title:'Bank-Level Security', desc:'Enterprise-grade encryption, role-based access, and secure cloud infrastructure.' },
  { icon:Icons.shield, title:'99.9% Uptime', desc:'Redundant systems, daily backups, and disaster recovery.' },
  { icon:Icons.file, title:'Compliance Ready', desc:'Built for HIPAA, GDPR, and local regulations. Audit trails for every action.' },
  { icon:Icons.globe, title:'Global Reach', desc:'Support families worldwide. Anyone can light candles and stay connected.' },
];

const INITIAL_CANDLES = [
  { name:'Michael R.', message:'Forever in our hearts', lit:true },
  { name:'Elena S.', message:'Rest peacefully', lit:true },
  { name:'Light one', message:'', lit:false },
  { name:'James P.', message:'Your legacy lives on', lit:true },
  { name:'Light one', message:'', lit:false },
  { name:'Grace T.', message:'In loving memory', lit:true },
  { name:'Light one', message:'', lit:false },
  { name:'David W.', message:'Always remembered', lit:true },
  { name:'Light one', message:'', lit:false },
  { name:'Anna K.', message:'Gone but never forgotten', lit:true },
  { name:'Light one', message:'', lit:false },
  { name:'Robert M.', message:'Your light shines on', lit:true },
  { name:'Light one', message:'', lit:false },
  { name:'Light one', message:'', lit:false },
  { name:'Light one', message:'', lit:false },
  { name:'Light one', message:'', lit:false },
];

function Candle({ name, message, lit, onLight, delay = 0 }) {
  return (
    <div onClick={onLight} style={{ display:'flex', flexDirection:'column', alignItems:'center', cursor:lit?'default':'pointer', gap:'.6rem', animation:`fadeInUp 0.6s ease ${delay}ms both`, transition:'transform 0.2s' }} onMouseEnter={e=>{if(!lit)e.currentTarget.style.transform='scale(1.1)'}} onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)'}}>
      <div style={{ position:'relative', height:'56px', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
        {lit ? (
          <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ position:'absolute', bottom:'0', left:'50%', transform:'translateX(-50%)', width:'40px', height:'40px', borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)', animation:'glow 2.2s ease-in-out infinite' }} />
            <div style={{ width:'12px', height:'30px', background:'radial-gradient(ellipse at 50% 80%, #F59E0B 0%, #FBBF24 40%, #F97316 100%)', borderRadius:'50% 50% 30% 30%', animation:'flame 1.8s ease-in-out infinite', filter:'blur(0.5px)', boxShadow:'0 0 14px #F59E0B, 0 0 28px rgba(245,158,11,0.35)' }} />
          </div>
        ) : (
          <div style={{ width:'18px', height:'18px', borderRadius:'50%', border:`2px dashed ${C.char200}`, display:'flex', alignItems:'center', justifyContent:'center', color:C.char300, fontSize:'.7rem' }}>+</div>
        )}
      </div>
      <div style={{ width:'16px', height:'56px', borderRadius:'3px', background:lit?'linear-gradient(180deg,#FEF3C7 0%,#FCD34D 30%,#F59E0B 70%,#B45309 100%)':`linear-gradient(180deg,${C.char200} 0%,${C.char300} 100%)`, position:'relative', boxShadow:lit?'0 0 24px rgba(245,158,11,0.3)':'none', transition:'all 0.6s ease' }}>
        <div style={{ position:'absolute', top:'-7px', left:'50%', transform:'translateX(-50%)', width:'2.5px', height:'7px', background:lit?'#78350F':C.char300, borderRadius:'1px' }} />
      </div>
      <div style={{ fontFamily:"'Lora',serif", fontSize:'.75rem', color:lit?C.gold:C.char300, textAlign:'center', maxWidth:'80px', lineHeight:1.3, fontStyle:'italic', fontWeight:500 }}>{name}</div>
      {lit && message && <div style={{ fontFamily:"'Inter',sans-serif", fontSize:'.62rem', color:C.char500, textAlign:'center', maxWidth:'88px', lineHeight:1.4 }}>"{message}"</div>}
    </div>
  );
}

function Loader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => setProgress(p => {
      if (p >= 100) { clearInterval(iv); setFadeOut(true); setTimeout(onComplete, 600); return 100; }
      return p + Math.random() * 15 + 5;
    }), 120);
    return () => clearInterval(iv);
  }, [onComplete]);
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'linear-gradient(135deg,#0A1F3D 0%,#0F2847 50%,#1a3a52 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', transition:'opacity 0.6s', opacity:fadeOut?0:1, pointerEvents:fadeOut?'none':'auto' }}>
      <style>{`@keyframes lp{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}@keyframes lf{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'2rem', animation:'lf 0.8s ease' }}>
        <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:C.emerald, animation:'lp 2s ease-in-out infinite' }} />
        <span style={{ fontFamily:"'Lora',serif", fontSize:'1.5rem', fontWeight:700, color:'white' }}>Rest Point</span>
      </div>
      <div style={{ display:'flex', gap:'1.5rem', marginBottom:'2rem', animation:'lf 1s ease 0.2s both' }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.5rem' }}>
            <div style={{ width:'10px', height:'24px', background:'radial-gradient(ellipse at 50% 80%,#F59E0B 0%,#FBBF24 40%,#F97316 100%)', borderRadius:'50% 50% 30% 30%', animation:`flame 1.8s ease-in-out ${i*0.3}s infinite`, filter:'blur(0.5px)', boxShadow:'0 0 14px #F59E0B' }} />
            <div style={{ width:'12px', height:'40px', borderRadius:'3px', background:'linear-gradient(180deg,#FEF3C7,#F59E0B 70%,#B45309)', boxShadow:'0 0 16px rgba(245,158,11,0.3)' }} />
          </div>
        ))}
      </div>
      <div style={{ width:'200px', height:'3px', background:'rgba(255,255,255,0.1)', borderRadius:'2px', overflow:'hidden', animation:'lf 1s ease 0.4s both' }}>
        <div style={{ width:`${Math.min(progress,100)}%`, height:'100%', background:'linear-gradient(90deg,#A67C52,#C9A876)', borderRadius:'2px', transition:'width 0.3s' }} />
      </div>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'.75rem', marginTop:'1rem', animation:'lf 1s ease 0.6s both' }}>Preparing your experience...</p>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [candles, setCandles] = useState(INITIAL_CANDLES);
  const [candleName, setCandleName] = useState('');
  const [litCount, setLitCount] = useState(INITIAL_CANDLES.filter(c=>c.lit).length);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('authToken');
    if (t && t !== 'undefined' && t !== 'null') setIsLoggedIn(true);
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const lightCandle = useCallback((idx) => {
    if (candles[idx].lit) return;
    const n = candleName.trim() || 'Anonymous';
    setCandles(p => { const x = [...p]; x[idx] = {...x[idx], name:n, message:'In our hearts', lit:true}; return x; });
    setLitCount(c => c + 1);
    setCandleName('');
  }, [candles, candleName]);

  const goLogin = () => navigate('/login');
  const goStart = () => { if (isLoggedIn) navigate('/dashboard'); else navigate('/register'); };
  const goPortal = () => navigate('/portal/login');

  if (loading) return <Loader onComplete={()=>setLoading(false)} />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth;background:${C.navy50}}
        body{font-family:'Inter',sans-serif;color:${C.char700};background:${C.navy50}}
        ::selection{background:rgba(166,124,82,0.15);color:${C.gold}}
        .wrap{max-width:1200px;margin:0 auto;padding:0 clamp(1rem,5vw,2.5rem)}
        .section{padding:clamp(4rem,10vw,7rem) 0}
        h1,h2,h3{font-family:'Lora',serif;font-weight:500;line-height:1.2}
        h1{font-size:clamp(2.5rem,8vw,4.5rem)}h2{font-size:clamp(1.8rem,6vw,3.2rem)}h3{font-size:clamp(1.2rem,3vw,1.8rem)}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:${C.gold};margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}
        .eyebrow::before{content:'';width:16px;height:1px;background:currentColor}
        .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.75rem;font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border:none;border-radius:8px;cursor:pointer;transition:all .22s;white-space:nowrap;font-family:'Inter',sans-serif}
        .btn-primary{background:${C.navy900};color:#fff;box-shadow:0 4px 16px -4px rgba(10,31,61,.4)}
        .btn-primary:hover{background:${C.navy800};transform:translateY(-2px);box-shadow:0 8px 24px -4px rgba(10,31,61,.6)}
        .btn-secondary{background:transparent;color:${C.navy900};border:1.5px solid ${C.navy900}}
        .btn-secondary:hover{background:rgba(10,31,61,.05)}
        .btn-text{background:none;color:${C.navy900};padding:.5rem 0}.btn-text:hover{opacity:.8}
        .btn-gold{background:${C.gold};color:#fff;box-shadow:0 4px 16px -4px rgba(166,124,82,.4)}
        .btn-gold:hover{background:${C.goldD};transform:translateY(-2px)}
        nav{position:fixed;top:0;left:0;right:0;z-index:100;background:${scrolled?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.7)'};backdrop-filter:blur(12px);border-bottom:1px solid ${scrolled?C.char200:'transparent'};padding:1.2rem 0;transition:all .3s}
        .nav-wrap{display:flex;justify-content:space-between;align-items:center}
        .logo{display:flex;align-items:center;gap:.5rem;font-size:1rem;font-weight:700;color:${C.navy900};font-family:'Lora',serif;cursor:pointer}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:${C.emerald}}
        .nav-links{display:flex;gap:2.5rem}
        .nav-link{font-size:.75rem;font-weight:600;color:${C.char600};text-decoration:none;transition:color .2s;cursor:pointer}.nav-link:hover{color:${C.gold}}
        .nav-cta{display:flex;gap:1rem;align-items:center}
        .hamburger{display:none;background:none;border:none;cursor:pointer;color:${C.navy900};padding:.5rem;z-index:101;position:relative}
        .mobile-menu{display:none;position:fixed;top:60px;left:0;right:0;background:#fff;border-bottom:2px solid ${C.char200};padding:1.25rem;z-index:99;box-shadow:0 8px 24px rgba(0,0,0,.12)}
        .mobile-menu.open{display:block!important}
        .mobile-link{display:block;padding:.9rem 0;font-size:.9rem;font-weight:600;color:${C.char700};text-decoration:none;border-bottom:1px solid ${C.char100};transition:color .2s}.mobile-link:last-child{border-bottom:none}.mobile-link:hover{color:${C.gold}}
        .mobile-cta{width:100%;margin-top:.75rem}
        @media(max-width:768px){.nav-links{display:none!important}.nav-cta{display:none!important}.hamburger{display:block!important}}
        @media(min-width:769px){.mobile-menu{display:none!important}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes flame{0%,100%{transform:scaleX(1)scaleY(1)rotate(-1deg)}25%{transform:scaleX(1.04)scaleY(0.97)rotate(1deg)}50%{transform:scaleX(0.97)scaleY(1.04)rotate(-.5deg)}75%{transform:scaleX(1.03)scaleY(0.98)rotate(.8deg)}}
        @keyframes glow{0%,100%{opacity:.8;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .hero{padding:clamp(6rem,12vw,8rem) 0 clamp(3rem,6vw,4rem);background:linear-gradient(135deg,${C.navy50} 0%,rgba(5,150,105,.03) 100%);position:relative;overflow:hidden}
        .hero-inner{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;position:relative;z-index:1}
        @media(max-width:768px){.hero-inner{grid-template-columns:1fr;gap:2rem}}
        .hero-text h1{color:${C.navy900};margin-bottom:1.5rem}
        .hero-text p{font-size:1rem;color:${C.char700};line-height:1.7;margin-bottom:1.5rem}
        .hero-cta{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:2rem}
        @media(max-width:640px){.hero-cta{flex-wrap:nowrap;gap:.75rem}.hero-cta .btn{flex:1;padding:.7rem 1rem;font-size:.65rem}}
        .hero-trust{display:flex;gap:1.5rem;font-size:.85rem;color:${C.char600};flex-wrap:wrap}
        .hero-trust-item{display:flex;align-items:center;gap:.5rem}
        .trust-icon{color:${C.emerald};flex-shrink:0}
        .hero-image{position:relative}
        .dashboard-shell{background:#fff;border:1px solid ${C.char200};border-radius:12px;overflow:hidden;box-shadow:0 20px 60px -10px rgba(0,0,0,.08)}
        .chrome{display:flex;gap:.5rem;align-items:center;padding:.75rem 1rem;background:${C.char100};border-bottom:1px solid ${C.char200}}
        .dot{width:8px;height:8px;border-radius:50%}.d-red{background:#FF5F57}.d-yellow{background:#FEBC2E}.d-green{background:#28C840}
        .url{flex:1;background:#fff;border-radius:4px;padding:.4rem .7rem;font-size:.65rem;color:${C.char500};font-family:monospace}
        .dash-img{width:100%;display:block;background:linear-gradient(135deg,${C.char100},${C.navy50})}
        .trust-section{background:#fff;padding:clamp(4rem,8vw,6rem) 0;border-top:1px solid ${C.char200};border-bottom:1px solid ${C.char200}}
        .trust-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2rem}
        @media(max-width:1024px){.trust-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.trust-grid{grid-template-columns:1fr}}
        .trust-card{padding:2rem;text-align:center}
        .trust-card h3{font-size:1.1rem;margin-bottom:.75rem;color:${C.navy900}}
        .trust-card p{font-size:.9rem;color:${C.char600};line-height:1.6}
        .features-section{background:${C.navy50}}
        .features-header{text-align:center;margin-bottom:4rem}
        .features-header h2{color:${C.navy900};margin-bottom:1rem}
        .features-header p{font-size:1rem;color:${C.char700};max-width:600px;margin:0 auto}
        .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}
        @media(max-width:1024px){.features-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.features-grid{grid-template-columns:1fr}}
        .feature-card{background:#fff;padding:2rem;border-radius:12px;border:1px solid ${C.char200};transition:all .3s}
        .feature-card:hover{border-color:${C.gold};transform:translateY(-4px);box-shadow:0 12px 36px -8px rgba(166,124,82,.2)}
        .feature-card h3{margin-bottom:.75rem;color:${C.navy900}}
        .feature-card p{font-size:.9rem;color:${C.char600};line-height:1.6}
        .reasons-section{background:linear-gradient(135deg,rgba(5,150,105,.05) 0%,rgba(166,124,82,.03) 100%)}
        .reasons-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
        @media(max-width:1024px){.reasons-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.reasons-grid{grid-template-columns:1fr}}
        .reason-card{display:flex;gap:1rem;padding:1.25rem;background:#fff;border-radius:10px;border:1px solid ${C.char200};transition:all .3s}
        .reason-card:hover{border-color:${C.gold};transform:translateY(-2px);box-shadow:0 8px 24px -8px rgba(166,124,82,.15)}
        .reason-card h4{font-size:.95rem;color:${C.navy900};margin-bottom:.25rem}
        .reason-card p{font-size:.85rem;color:${C.char600};line-height:1.5}
        .family-section{background:linear-gradient(135deg,rgba(5,150,105,.05) 0%,rgba(166,124,82,.03) 100%)}
        .family-inner{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}
        @media(max-width:768px){.family-inner{grid-template-columns:1fr;gap:2rem}}
        .family-text h2{color:${C.navy900};margin-bottom:1.5rem}
        .family-text p{font-size:1rem;color:${C.char700};line-height:1.7;margin-bottom:1.5rem}
        .family-benefits{display:flex;flex-direction:column;gap:1rem}
        .benefit-item{display:flex;gap:1rem;font-size:.95rem;color:${C.char700}}
        .benefit-item strong{color:${C.navy900}}
        .family-image{background:#fff;border-radius:12px;border:1px solid ${C.char200};min-height:300px;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .family-image img{width:100%;height:100%;object-fit:cover;border-radius:12px}
        .marketplace-section{background:#fff;position:relative;overflow:hidden}
        .marketplace-inner{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}
        @media(max-width:768px){.marketplace-inner{grid-template-columns:1fr}}
        .marketplace-text h2{color:${C.navy900};margin-bottom:1.5rem}
        .marketplace-text p{font-size:1rem;color:${C.char700};line-height:1.7;margin-bottom:1.5rem}
        .marketplace-image{border-radius:12px;border:1px solid ${C.char200};min-height:300px;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .marketplace-image img{width:100%;height:100%;object-fit:cover;border-radius:12px}
        .security-section{background:#fff}
        .security-inner{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}
        @media(max-width:768px){.security-inner{grid-template-columns:1fr}}
        .security-text h2{color:${C.navy900};margin-bottom:1.5rem}
        .security-items{display:flex;flex-direction:column;gap:1.5rem}
        .security-item{display:flex;gap:1rem}
        .security-item h4{color:${C.navy900};margin-bottom:.25rem;font-size:.95rem}
        .security-item p{font-size:.85rem;color:${C.char600}}
        .security-image{border-radius:12px;border:1px solid ${C.char200};min-height:300px;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .security-image img{width:100%;height:100%;object-fit:cover;border-radius:12px}
        .memorial-section{background:linear-gradient(180deg,${C.navy900} 0%,${C.navy800} 50%,${C.navy900} 100%);color:#fff;position:relative;overflow:hidden}
        .memorial-section::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,rgba(5,150,105,.08) 0%,transparent 60%);pointer-events:none}
        .memorial-inner{position:relative;z-index:1;text-align:center}
        .memorial-quote{font-family:'Lora',serif;font-size:1.2rem;font-style:italic;color:rgba(255,255,255,.9);max-width:600px;margin:0 auto 2.5rem;line-height:1.8}
        .candle-input-row{display:flex;gap:.75rem;justify-content:center;margin-bottom:2rem;flex-wrap:wrap}
        .candle-input{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:.75rem 1rem;color:#fff;font-family:'Inter',sans-serif;font-size:.9rem;outline:none;min-width:250px}
        .candle-input::placeholder{color:rgba(255,255,255,.5)}
        .candle-input:focus{border-color:${C.gold}}
        .candle-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:1.5rem 1rem;justify-items:center;margin:2rem 0}
        @media(max-width:1024px){.candle-grid{grid-template-columns:repeat(4,1fr)}}
        @media(max-width:640px){.candle-grid{grid-template-columns:repeat(3,1fr)}}
        .candle-counter{display:flex;align-items:center;gap:1rem;justify-content:center;margin:2rem 0;font-size:.85rem;color:rgba(255,255,255,.7)}
        .candle-counter span{color:${C.gold};font-weight:700;font-size:1.2rem}
        .memorial-cta{background:rgba(166,124,82,.15);border:1px solid rgba(166,124,82,.3);border-radius:12px;padding:2rem;margin-top:2rem}
        .memorial-cta h3{color:#fff;margin-bottom:1rem}
        .memorial-cta p{color:rgba(255,255,255,.8);font-size:.95rem;line-height:1.6;margin-bottom:1.5rem}
        .testimonials-section{background:${C.navy50}}
        .testimonials-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}
        @media(max-width:1024px){.testimonials-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.testimonials-grid{grid-template-columns:1fr}}
        .testimonial-card{background:#fff;padding:2rem;border-radius:12px;border:1px solid ${C.char200}}
        .testimonial-stat{font-size:1.4rem;font-weight:700;color:${C.gold};margin-bottom:1rem}
        .testimonial-text{font-size:.95rem;color:${C.char700};line-height:1.7;margin-bottom:1.5rem;font-style:italic}
        .testimonial-author{font-weight:600;color:${C.navy900};font-size:.9rem}
        .testimonial-role{font-size:.8rem;color:${C.char600}}
        .pricing-section{background:linear-gradient(135deg,rgba(5,150,105,.05) 0%,rgba(166,124,82,.03) 100%)}
        .pricing-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2rem;max-width:900px;margin:0 auto}
        @media(max-width:768px){.pricing-grid{grid-template-columns:1fr}}
        .pricing-card{background:#fff;padding:2.5rem;border-radius:12px;border:1px solid ${C.char200};position:relative}
        .pricing-card.featured{border-color:${C.gold};box-shadow:0 20px 40px -10px rgba(166,124,82,.2)}
        .pricing-badge{position:absolute;top:-12px;left:2rem;background:${C.gold};color:#fff;padding:.4rem 1rem;border-radius:20px;font-size:.7rem;font-weight:700;letter-spacing:.1em}
        .pricing-label{font-size:.8rem;color:${C.gold};text-transform:uppercase;letter-spacing:.1em;margin-bottom:.5rem}
        .pricing-amount{font-size:2.5rem;font-weight:700;color:${C.navy900};margin-bottom:.25rem}
        .pricing-period{font-size:.85rem;color:${C.char600};margin-bottom:1.5rem}
        .pricing-divider{height:1px;background:${C.char200};margin:1.5rem 0}
        .pricing-item{display:flex;gap:.75rem;font-size:.9rem;color:${C.char700};margin-bottom:.75rem}
        .pricing-cta{width:100%;margin-top:2rem}
        .cta-final{background:linear-gradient(135deg,${C.navy900} 0%,${C.navy800} 100%);color:#fff;text-align:center;padding:clamp(4rem,10vw,6rem) 0}
        .cta-final-inner{max-width:700px;margin:0 auto;padding:0 1rem}
        .cta-final h2{color:#fff;margin-bottom:1rem}
        .cta-final p{font-size:1rem;color:rgba(255,255,255,.9);margin-bottom:2rem;line-height:1.7}
        .cta-final-buttons{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
        footer{background:${C.navy900};color:#fff;border-top:1px solid ${C.navy800};padding:4rem 0 2rem}
        .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:3rem;margin-bottom:3rem}
        @media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr;gap:2rem}}
        .footer-col h4{font-family:'Lora',serif;margin-bottom:1.5rem}
        .footer-col p{font-size:.9rem;line-height:1.6;opacity:.8;margin-bottom:1rem}
        .footer-link{display:block;font-size:.85rem;color:rgba(255,255,255,.7);margin-bottom:.75rem;transition:color .2s;text-decoration:none;cursor:pointer}.footer-link:hover{color:${C.gold}}
        .footer-divider{height:1px;background:${C.navy800};margin:2rem 0}
        .footer-bottom{display:flex;justify-content:space-between;align-items:center;font-size:.85rem;color:rgba(255,255,255,.6);flex-wrap:wrap;gap:1rem}
        @media(max-width:480px){h1{font-size:1.8rem}h2{font-size:1.4rem}.btn{padding:.65rem 1.1rem;font-size:.65rem}.hero-cta .btn{flex:1}.hero-trust{flex-direction:column;gap:.6rem;font-size:.8rem}.candle-grid{gap:1rem .75rem}.cta-final-buttons{flex-direction:column}.cta-final-buttons .btn{width:100%}}
      `}</style>

      <nav>
        <div className="wrap nav-wrap">
          <div className="logo" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}><span className="logo-dot"/><span>Rest Point</span></div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Platform</a>
            <a href="#why" className="nav-link">Why Rest Point</a>
            <a href="#family" className="nav-link">Family Portal</a>
            <a href="#marketplace" className="nav-link">Marketplace</a>
            <a href="#security" className="nav-link">Security</a>
            <a href="#pricing" className="nav-link">Pricing</a>
          </div>
          <div className="nav-cta">
            {isLoggedIn ? <button className="btn btn-text" onClick={()=>navigate('/dashboard')}>Dashboard {Icons.arrow}</button> : <><button className="btn btn-text" onClick={goLogin}>Log In</button><button className="btn btn-primary" onClick={goStart}>Start Free Trial {Icons.arrow}</button></>}
          </div>
          <button className="hamburger" onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?Icons.close:Icons.menu}</button>
        </div>
      </nav>

      <div className={`mobile-menu ${mobileOpen?'open':''}`}>
        <a href="#features" className="mobile-link" onClick={()=>setMobileOpen(false)}>Platform</a>
        <a href="#why" className="mobile-link" onClick={()=>setMobileOpen(false)}>Why Rest Point</a>
        <a href="#family" className="mobile-link" onClick={()=>setMobileOpen(false)}>Family Portal</a>
        <a href="#marketplace" className="mobile-link" onClick={()=>setMobileOpen(false)}>Marketplace</a>
        <a href="#security" className="mobile-link" onClick={()=>setMobileOpen(false)}>Security</a>
        <a href="#pricing" className="mobile-link" onClick={()=>setMobileOpen(false)}>Pricing</a>
        <div className="mobile-cta">
          {isLoggedIn ? <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={()=>{setMobileOpen(false);navigate('/dashboard')}}>Dashboard {Icons.arrow}</button> : <>
            <button className="btn btn-secondary" style={{width:'100%',justifyContent:'center',marginBottom:'.5rem'}} onClick={()=>{setMobileOpen(false);goLogin()}}>Log In</button>
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={()=>{setMobileOpen(false);goStart()}}>Start Free Trial {Icons.arrow}</button>
          </>}
        </div>
      </div>

      <main style={{paddingTop:'60px'}}>
        {/* HERO */}
        <section className="hero">
          <div className="wrap">
            <div className="hero-inner">
              <div className="hero-text">
                <div className="eyebrow">{Icons.star} Modern Funeral Home Management</div>
                <h1>One platform. Complete peace of mind.</h1>
                <p>Manage funeral operations, serve families through a dedicated portal, create documents with integrated tools, and grow revenue through our marketplace—all in one secure place built for compassion and excellence.</p>
                <div className="hero-cta">
                  <button className="btn btn-primary" onClick={goStart}>{isLoggedIn?'Dashboard':'Start Free Trial'} {Icons.arrow}</button>
                  <button className="btn btn-gold" onClick={goPortal}>Family Portal {Icons.arrow}</button>
                </div>
                <div className="hero-trust">
                  <div className="hero-trust-item"><span className="trust-icon">{Icons.check}</span>30-day free trial</div>
                  <div className="hero-trust-item"><span className="trust-icon">{Icons.check}</span>No credit card needed</div>
                  <div className="hero-trust-item"><span className="trust-icon">{Icons.check}</span>Full onboarding support</div>
                </div>
              </div>
              <div className="hero-image">
                <div className="dashboard-shell">
                  <div className="chrome">
                    <div style={{display:'flex',gap:'.4rem'}}><div className="dot d-red"/><div className="dot d-yellow"/><div className="dot d-green"/></div>
                    <div className="url">restpoint.app/dashboard</div>
                  </div>
                  <div className="dash-img" style={{minHeight:'auto',position:'relative'}}>
                    <img src="/landing.png" alt="Rest Point Dashboard" style={{width:'100%',height:'auto',display:'block',borderRadius:'0 0 12px 12px'}} onError={e=>{e.target.style.display='none';e.target.parentElement.innerHTML='<div style="padding:3rem;text-align:center;background:linear-gradient(135deg,#F3F4F6,#F9FAFB)"><div style="font-size:2.5rem;margin-bottom:1rem">📊</div><div style="color:#6B7280">Rest Point Dashboard</div></div>'}}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="trust-section">
          <div className="wrap">
            <div style={{textAlign:'center',marginBottom:'3rem'}}>
              <h2 style={{color:C.navy900,marginBottom:'.5rem'}}>Built for Funeral Professionals</h2>
              <p style={{color:C.char600}}>Enterprise-grade reliability meets compassionate family service.</p>
            </div>
            <div className="trust-grid">
              {TRUST.map((t,i)=>(
                <div key={i} className="trust-card">
                  <div style={{fontSize:'2.5rem',marginBottom:'1rem',color:C.gold}}>{t.icon}</div>
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="section features-section">
          <div className="wrap">
            <div className="features-header">
              <div className="eyebrow" style={{justifyContent:'center'}}>{Icons.zap} Core Platform</div>
              <h2>Everything Your Funeral Home Needs</h2>
              <p>Nine integrated modules designed around the real workflows of modern funeral homes.</p>
            </div>
            <div className="features-grid">
              {FEATURES.map((f,i)=>(
                <div key={i} className="feature-card">
                  <div style={{marginBottom:'1rem',color:f.color}}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY REST POINT */}
        <section id="why" className="section reasons-section">
          <div className="wrap">
            <div className="features-header">
              <div className="eyebrow" style={{justifyContent:'center'}}>{Icons.award} Why Choose Rest Point</div>
              <h2>9 Reasons Funeral Homes Love Us</h2>
              <p>Join 100+ funeral homes across East Africa already transforming their operations.</p>
            </div>
            <div className="reasons-grid">
              {REASONS.map((r,i)=>(
                <div key={i} className="reason-card">
                  <div style={{color:C.gold,flexShrink:0,marginTop:'2px'}}>{r.icon}</div>
                  <div>
                    <h4>{r.title}</h4>
                    <p>{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAMILY PORTAL */}
        <section id="family" className="section family-section">
          <div className="wrap">
            <div className="family-inner">
              <div className="family-text">
                <div className="eyebrow">{Icons.heart} Family Portal</div>
                <h2>Keep Families Connected & Informed</h2>
                <p>Your families receive a secure SMS link—no app download required. They can view documents, track case progress, receive billing, make payments, and communicate with your team—all from their phone.</p>
                <div className="family-benefits">
                  <div className="benefit-item"><span style={{color:C.emerald,fontWeight:600}}>✓</span><div><strong>Instant Communication</strong> — Automated SMS updates at every milestone</div></div>
                  <div className="benefit-item"><span style={{color:C.emerald,fontWeight:600}}>✓</span><div><strong>Document Access</strong> — Families download permits, certificates, and invoices</div></div>
                  <div className="benefit-item"><span style={{color:C.emerald,fontWeight:600}}>✓</span><div><strong>Secure Billing</strong> — View invoices and pay via M-PESA, card, or bank</div></div>
                  <div className="benefit-item"><span style={{color:C.emerald,fontWeight:600}}>✓</span><div><strong>Memorial Tributes</strong> — Light candles and leave messages of remembrance</div></div>
                </div>
                <div style={{marginTop:'1.5rem'}}><button className="btn btn-primary" onClick={goPortal}>Access Family Portal {Icons.arrow}</button></div>
              </div>
              <div className="family-image">
                <img src="/familyportal.png" alt="Family Portal" onError={e=>{e.target.style.display='none';e.target.parentElement.innerHTML='<div style="padding:3rem;text-align:center">👨‍👩‍👧‍👦 Family Portal</div>'}}/>
              </div>
            </div>
          </div>
        </section>

        {/* MARKETPLACE */}
        <section id="marketplace" className="section marketplace-section">
          <div className="wrap">
            <div className="marketplace-inner">
              <div className="marketplace-text">
                <div className="eyebrow">{Icons.shop} Integrated Marketplace</div>
                <h2>New Revenue Streams for Your Funeral Home</h2>
                <p>Our integrated marketplace connects families with trusted vendors for flowers, keepsakes, memorial items, catering, and more. Generate additional revenue while providing comprehensive service.</p>
                <div className="family-benefits">
                  <div className="benefit-item"><span style={{color:C.emerald,fontWeight:600}}>✓</span><div><strong>Curated Vendors</strong> — Pre-screened, reliable local partners</div></div>
                  <div className="benefit-item"><span style={{color:C.emerald,fontWeight:600}}>✓</span><div><strong>Commission Revenue</strong> — Earn on every marketplace transaction</div></div>
                  <div className="benefit-item"><span style={{color:C.emerald,fontWeight:600}}>✓</span><div><strong>Seamless Integration</strong> — Vendors and families connect through your platform</div></div>
                </div>
                <div style={{marginTop:'1.5rem'}}><button className="btn btn-primary" onClick={()=>navigate('/register')}>Learn More {Icons.arrow}</button></div>
              </div>
              <div className="marketplace-image">
                <img src="/flower.png" alt="Marketplace" onError={e=>{e.target.style.display='none';e.target.parentElement.innerHTML='<div style="padding:3rem;text-align:center;color:#6B7280">🛍️ Marketplace Platform</div>'}}/>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section id="security" className="section security-section">
          <div className="wrap">
            <div className="security-inner">
              <div className="security-text">
                <div className="eyebrow">{Icons.shield} Enterprise Security</div>
                <h2>Your Data. Protected. Always.</h2>
                <p>We take data security seriously. Your funeral home's sensitive information and families' personal data are protected by enterprise-grade security infrastructure.</p>
                <div className="security-items" style={{marginTop:'2rem'}}>
                  <div className="security-item"><div style={{color:C.emerald,flexShrink:0}}>{Icons.lock}</div><div><h4>Contobo Security Family</h4><p>Enterprise-grade encryption at rest and in transit. SOC 2 compliant infrastructure with multi-layered security controls.</p></div></div>
                  <div className="security-item"><div style={{color:C.emerald,flexShrink:0}}>{Icons.shield}</div><div><h4>Role-Based Access Control</h4><p>Granular permissions for directors, managers, staff, and families. Every action is logged with complete audit trails.</p></div></div>
                  <div className="security-item"><div style={{color:C.emerald,flexShrink:0}}>{Icons.file}</div><div><h4>Compliance & Regulatory</h4><p>Built to meet HIPAA, GDPR, and local East African regulatory requirements for data protection.</p></div></div>
                  <div className="security-item"><div style={{color:C.emerald,flexShrink:0}}>{Icons.globe}</div><div><h4>Disaster Recovery</h4><p>Automated daily backups, multi-region redundancy, and 99.9% uptime SLA.</p></div></div>
                </div>
              </div>
              <div className="security-image">
                <img src="/cloud.png" alt="Security" onError={e=>{e.target.style.display='none';e.target.parentElement.innerHTML='<div style="padding:3rem;text-align:center;color:#6B7280">🔒 Enterprise Security</div>'}}/>
              </div>
            </div>
          </div>
        </section>

        {/* MEMORIAL */}
        <section className="section memorial-section">
          <div className="wrap">
            <div className="memorial-inner">
              <div style={{marginBottom:'1.5rem'}}>
                <div className="eyebrow" style={{color:C.gold,justifyContent:'center'}}>{Icons.flame} Global Memorial Board</div>
                <h2 style={{color:'#fff'}}>Light a Candle. Leave a Memory.</h2>
              </div>
              <p className="memorial-quote">"Every life leaves a mark. Join our global community in honoring those we've loved and lost."</p>
              <div className="candle-input-row">
                <input className="candle-input" placeholder="Your name..." value={candleName} onChange={e=>setCandleName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){const idx=candles.findIndex(c=>!c.lit);if(idx>=0)lightCandle(idx)}}}/>
              </div>
              <div className="candle-grid">
                {candles.map((c,i)=><Candle key={i} {...c} delay={i*80} onLight={()=>lightCandle(i)}/>)}
              </div>
              <div className="candle-counter">
                <span>{litCount}</span> lights burning <span style={{opacity:.5}}>•</span> Join the community
              </div>
              <div className="memorial-cta">
                <h3>Create a Memorial Page</h3>
                <p>Funeral homes can create dedicated memorial pages for each family, allowing friends and relatives worldwide to participate, share memories, and offer support.</p>
                <button className="btn btn-gold" onClick={goStart}>Learn More {Icons.arrow}</button>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="section testimonials-section">
          <div className="wrap">
            <div style={{textAlign:'center',marginBottom:'3rem'}}>
              <div className="eyebrow" style={{justifyContent:'center'}}>{Icons.star} Trusted by Professionals</div>
              <h2 style={{color:C.navy900}}>What Funeral Directors Say</h2>
            </div>
            <div className="testimonials-grid">
              {TESTIMONIALS.map((t,i)=>(
                <div key={i} className="testimonial-card">
                  <div className="testimonial-stat">{t.stat}</div>
                  <p className="testimonial-text">"{t.text}"</p>
                  <div className="testimonial-author">{t.author}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="section pricing-section">
          <div className="wrap">
            <div style={{textAlign:'center',marginBottom:'3rem'}}>
              <div className="eyebrow" style={{justifyContent:'center'}}>Simple Pricing</div>
              <h2 style={{color:C.navy900}}>Plans That Scale With You</h2>
              <p style={{color:C.char600,marginTop:'1rem'}}>No hidden fees. Cancel anytime. 30-day free trial included.</p>
            </div>
            <div className="pricing-grid">
              <div className="pricing-card">
                <div className="pricing-label">Starter</div>
                <div className="pricing-amount">KES 7,500</div>
                <div className="pricing-period">per month</div>
                <div className="pricing-divider"/>
                {['Up to 50 deceased/month','Family Portal SMS','Basic Billing & Invoicing','Single Branch','WhatsApp Support'].map((f,i)=>(
                  <div key={i} className="pricing-item"><span style={{color:C.emerald,flexShrink:0}}>{Icons.check}</span>{f}</div>
                ))}
                <button className="btn btn-secondary pricing-cta" onClick={goStart}>Get Started {Icons.arrow}</button>
              </div>
              <div className="pricing-card featured">
                <div className="pricing-badge">MOST POPULAR</div>
                <div className="pricing-label">Enterprise</div>
                <div className="pricing-amount">KES 18,000</div>
                <div className="pricing-period">per month</div>
                <div className="pricing-divider"/>
                {['Unlimited deceased','Multi-branch Management','Advanced Analytics & Reports','Custom Compliance Settings','GPS Dispatch Tracking','Integrated Marketplace','24/7 Priority Support','Dedicated Account Manager'].map((f,i)=>(
                  <div key={i} className="pricing-item"><span style={{color:C.emerald,flexShrink:0}}>{Icons.check}</span>{f}</div>
                ))}
                <button className="btn btn-primary pricing-cta" onClick={goStart}>Start Free Trial {Icons.arrow}</button>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="cta-final">
          <div className="cta-final-inner">
            <h2>Ready to Transform Your Funeral Home Operations?</h2>
            <p>Join 100+ funeral homes across Kenya and East Africa already using Rest Point to streamline operations, serve families better, and grow their business.</p>
            <div className="cta-final-buttons">
              <button className="btn btn-gold" onClick={goStart}>{isLoggedIn?'Go to Dashboard':'Start Free Trial'} {Icons.arrow}</button>
              <button className="btn btn-secondary" style={{background:'transparent',color:'#fff',borderColor:'rgba(255,255,255,.5)'}} onClick={goLogin}>Schedule a Demo {Icons.arrow}</button>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-col">
              <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'1rem'}}><div className="logo-dot"/><h4 style={{margin:0}}>Rest Point</h4></div>
              <p>Enterprise funeral home management platform built for compassion, compliance, and growth. Built by <span style={{color:C.gold}}>Welt Tallis Technologies</span>.</p>
              <div style={{display:'flex',gap:'1rem',marginTop:'1.25rem'}}>
                {[{l:'Twitter',p:'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'},{l:'Facebook',p:'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'},{l:'LinkedIn',p:'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'},{l:'Instagram',p:'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z'}].map((s,i)=>(
                  <a key={i} href="#" style={{color:'rgba(255,255,255,.6)',transition:'color .2s',cursor:'pointer'}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.6)'} title={s.l}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={s.p}/></svg>
                  </a>
                ))}
              </div>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#features" className="footer-link">Features</a>
              <a href="#marketplace" className="footer-link">Marketplace</a>
              <a href="#security" className="footer-link">Security</a>
              <a href="#pricing" className="footer-link">Pricing</a>
              <a className="footer-link" onClick={()=>navigate('/register')}>Start Free Trial</a>
            </div>
            <div className="footer-col">
              <h4>Family Portal</h4>
              <a href="/portal/login" className="footer-link">Access Portal</a>
              <a className="footer-link" onClick={()=>document.querySelector('.memorial-section')?.scrollIntoView({behavior:'smooth'})}>Memorial Board</a>
              <a href="#family" className="footer-link">Family Features</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a className="footer-link" onClick={()=>navigate('/about')}>About Us</a>
              <a className="footer-link" onClick={()=>navigate('/contact')}>Contact</a>
              <a className="footer-link" onClick={()=>navigate('/privacy')}>Privacy Policy</a>
              <a className="footer-link" onClick={()=>navigate('/terms')}>Terms of Service</a>
              <a className="footer-link" href="mailto:info@restpoint.co.ke">info@restpoint.co.ke</a>
            </div>
          </div>
          <div className="footer-divider"/>
          <div className="footer-bottom">
            <div>© 2024 Rest Point by Welt Tallis Technologies. All rights reserved.</div>
            <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
              <span style={{width:'6px',height:'6px',borderRadius:'50%',background:C.emerald,display:'inline-block'}}/>
              Built with compassion for funeral professionals across Africa.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}