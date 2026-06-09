import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './modules/landing/LandingPage';
import OnboardingFlow from './modules/onboarding/OnboardingFlow';
import LoginPage from './components/auth/login';
import AppRouter from './routes/AppRouter';
import { initManifest } from './services/manifestService';

// Simple wrapper for backward compatibility
const App = () => {
  // Initialize dynamic manifest on app load
  useEffect(() => {
    initManifest();
  }, []);

  // Check if we're using subdomain routing or path-based routing
  const hostname = window.location.hostname;
  const isTenantSubdomain = hostname !== 'localhost' && 
                             hostname !== 'restpoint.co.ke' && 
                             !hostname.startsWith('www.') &&
                             !hostname.includes('127.0.0.1') &&
                             !hostname.includes('trycloudflare.com'); // Ignore cloudflare tunnels for tenant logic

  // If using subdomain routing (tenant.domain.com)
  if (isTenantSubdomain) {
    // Extract tenant slug from subdomain
    const tenantSlug = hostname.split('.')[0];
    
    return (
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to={`/t/${tenantSlug}`} replace />} />
          <Route path="*" element={<AppRouter />} />
        </Routes>
      </HashRouter>
    );
  }

  // Default: hash-based routing (/#/t/tenant-slug)
  return (
    <HashRouter>
      <AppRouter />
    </HashRouter>
  );
};

export default App;