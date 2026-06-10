import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route, useParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTenantStore } from '../store/useTenantStore';
import { tenantApi } from '../api/tenant.api';
import ModernSidebar from '../components/layout/ModernSidebar';

import LandingPage from '../modules/landing/LandingPage';
import OnboardingFlow from '../modules/onboarding/OnboardingFlow';
import LoginPage from '../components/auth/login';
import PortalLoginPage from '../components/auth/PortalLogin';
import Notifications from '../components/notifications/notifications';
import InvoiceManager from '../components/invoices/invoicemanager';
import DocumentsPage from '../components/documents/documentspage';
import DeceasedRegistrationForm from '../components/deceasedinfo/registerDeceased';
import RegisterCoffin from '../components/coffins/registerCoffin';
import CoffinInventory from '../components/coffins/coffininventory';
import AllDeceasedPage from '../components/deceasedinfo/listDeceased';
import NotFound from '../components/common/NotFound';
import DeceasedDetails from '../components/deceasedprofile/deceasedDetailPage';
import DeceasedInfoSection from '../components/deceasedinfo/deceasedInfoSection';

// Import marketplace components directly (not lazy) for reliability
import MarketplacePage from '../components/marketplace/MarketplacePage';
import UploadProduct from '../components/marketplace/UploadProduct';

// Import Settings page
import SettingsPage from '../components/settings/SettingsPage';
import ReleaseFormPage from '../components/releaseform/ReleaseFormPage';

// Import Calendar, EDocuments, and Reports components
import CalendarPage from '../components/calender/CalendarPage';
import EDocumentsPage from '../components/edocuments/EDocumentsPage';
import ReportGenerator from '../components/reports/reportGenerator';

// Loading fallback component
const RouteLoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F7F9FB' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
      <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Loading...</p>
    </div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  const location = useLocation();
  
  if (!token || !user || token === 'undefined' || token === 'null') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantSlug');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
};

// Dashboard Layout with Unified Sidebar
const DashboardLayout = ({ children, tenantData }) => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('tenantSlug');
    navigate('/login');
  };

  const handleSidebarToggle = (isOpen) => {
    setSidebarOpen(isOpen);
  };

  // Calculate margin based on sidebar state (desktop only)
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const marginLeft = isMobile ? '0' : (sidebarOpen ? '260px' : '56px');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F9FB' }}>
      <ModernSidebar 
        tenantData={tenantData} 
        userData={{ name: user?.full_name || user?.name, role: user?.role || 'Administrator' }}
        onLogout={handleLogout}
        onToggle={handleSidebarToggle}
      />
      
      <main style={{ 
        flex: 1, 
        marginLeft: marginLeft, 
        padding: '2rem', 
        minHeight: '100vh', 
        background: '#F7F9FB',
        transition: 'margin-left 0.3s ease'
      }}>
        <Suspense fallback={<RouteLoadingFallback />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
};

// Tenant Dashboard Home
const TenantDashboardHome = () => {
  const { tenantData } = useTenantStore();
  
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a1a1a' }}>
        Welcome back, {tenantData?.name || 'User'}!
      </h1>
      <p style={{ color: '#6B7280', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Here's what's happening with your operations today.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Active Cases</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1a1a1a' }}>24</p>
        </div>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Pending Billing</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1a1a1a' }}>KES 345K</p>
        </div>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>This Month</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1a1a1a' }}>42</p>
        </div>
      </div>
    </div>
  );
};

// Tenant Resolver Component
const TenantResolver = () => {
  const { slug } = useParams();
  const { setTenantData, setLoading, error, setError, tenantData, loading } = useTenantStore();
  const token = localStorage.getItem('authToken');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenant = async () => {
      setLoading(true);
      try {
        console.log('Fetching tenant data for slug:', slug);
        const data = await tenantApi.getBranding(slug);
        console.log('Tenant data received:', data);
        const safeData = data || {};
        setTenantData(safeData);
        document.documentElement.style.setProperty('--tenant-primary', safeData.primaryColor || '#2b5a82');
        document.title = `${safeData.name || slug} | REST POINT`;
      } catch (err) {
        console.error('Tenant fetch error:', err);
        setError('Tenant not found: ' + err.message);
        // Redirect to login if tenant not found
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    
    if (slug && token) {
      fetchTenant();
    } else if (!token) {
      navigate('/login', { replace: true });
    }
  }, [slug, setTenantData, setLoading, setError, token, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Loading tenant...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <Navigate to="/login" replace />;
  }

  if (!token || token === 'undefined' || token === 'null') {
    return <Navigate to="/login" replace />;
  }

  return <TenantDashboardRoutes tenantData={tenantData || {}} />;
};

// Tenant Dashboard Routes - All routes using unified sidebar
const TenantDashboardRoutes = ({ tenantData }) => {
  const { slug } = useParams();
  
  console.log('TenantDashboardRoutes rendering with tenantData:', tenantData);
  
  return (
    <>
      <AIAssistant tenantSlug={slug} />
      
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="all-deceased" replace />} />
        <Route path="/dashboard" element={<Navigate to="../all-deceased" replace />} />
        
        {/* Main routes */}
        <Route path="all-deceased" element={
          <DashboardLayout tenantData={tenantData}>
            <AllDeceasedPage />
          </DashboardLayout>
        } />
        
        <Route path="deceased" element={
          <DashboardLayout tenantData={tenantData}>
            <AllDeceasedPage />
          </DashboardLayout>
        } />
        
        <Route path="deceased/register" element={
          <DashboardLayout tenantData={tenantData}>
            <DeceasedRegistrationForm />
          </DashboardLayout>
        } />
        
        {/* Deceased Details Route - FIXED: Properly handles ID parameter */}
        <Route path="deceased/:id" element={
          <DashboardLayout tenantData={tenantData}>
            <DeceasedDetails />
          </DashboardLayout>
        } />
        
        <Route path="deceased-details/:id" element={
          <DashboardLayout tenantData={tenantData}>
            <DeceasedDetails />
          </DashboardLayout>
        } />
        
        {/* Coffin routes */}
        <Route path="coffins" element={
          <DashboardLayout tenantData={tenantData}>
            <CoffinInventory />
          </DashboardLayout>
        } />
        
        <Route path="coffins/register" element={
          <DashboardLayout tenantData={tenantData}>
            <RegisterCoffin />
          </DashboardLayout>
        } />
        
        {/* Document routes */}
        <Route path="documents" element={
          <DashboardLayout tenantData={tenantData}>
            <DocumentsPage />
          </DashboardLayout>
        } />
        
        {/* Invoice routes */}
        <Route path="invoices" element={
          <DashboardLayout tenantData={tenantData}>
            <InvoiceManager />
          </DashboardLayout>
        } />
        
        {/* Calendar routes */}
        <Route path="calendar" element={
          <DashboardLayout tenantData={tenantData}>
            <CalendarPage />
          </DashboardLayout>
        } />
        
        {/* EDocuments routes */}
        <Route path="edocuments" element={
          <DashboardLayout tenantData={tenantData}>
            <EDocumentsPage />
          </DashboardLayout>
        } />
        
        {/* Reports routes */}
        <Route path="reports" element={
          <DashboardLayout tenantData={tenantData}>
            <ReportGenerator />
          </DashboardLayout>
        } />
        
        {/* Notifications routes */}
        <Route path="notifications" element={
          <DashboardLayout tenantData={tenantData}>
            <Notifications />
          </DashboardLayout>
        } />
        
        {/* Marketplace Routes */}
        <Route path="marketplace" element={
          <DashboardLayout tenantData={tenantData}>
            <MarketplacePage />
          </DashboardLayout>
        } />
        
        <Route path="marketplace/upload" element={
          <DashboardLayout tenantData={tenantData}>
            <UploadProduct />
          </DashboardLayout>
        } />
        
        {/* Settings Route */}
        <Route path="settings" element={
          <DashboardLayout tenantData={tenantData}>
            <SettingsPage />
          </DashboardLayout>
        } />
        
        {/* Release Form Route */}
        <Route path="release-form/:id" element={
          <DashboardLayout tenantData={tenantData}>
            <ReleaseFormPage />
          </DashboardLayout>
        } />
        
        {/* 404 Not Found Route - Keep within dashboard layout */}
        <Route path="not-found" element={
          <DashboardLayout tenantData={tenantData}>
            <NotFound />
          </DashboardLayout>
        } />
        
        {/* Analytics routes */}
        <Route path="analytics" element={
          <DashboardLayout tenantData={tenantData}>
            <div style={{ padding: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a' }}>Analytics</h1>
              <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>Analytics dashboard coming soon.</p>
            </div>
          </DashboardLayout>
        } />
        
        {/* Hearse routes */}
        <Route path="hearse" element={
          <DashboardLayout tenantData={tenantData}>
            <div style={{ padding: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a' }}>Hearse Management</h1>
              <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>Hearse management module coming soon.</p>
            </div>
          </DashboardLayout>
        } />
        
        {/* Catch-all route for dashboard - shows 404 instead of redirecting to landing */}
        <Route path="*" element={
          <DashboardLayout tenantData={tenantData}>
            <NotFound />
          </DashboardLayout>
        } />
      </Routes>
    </>
  );
};

// Dashboard Redirect after login
const DashboardRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;
  
  useEffect(() => {
    const tenantSlug = localStorage.getItem('tenantSlug');
    const userStr = localStorage.getItem('user');
    let userSlug = '';
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userSlug = user.organization?.slug || user.tenantSlug || user.tenant?.slug;
      } catch (e) {
        console.error('Error parsing user', e);
      }
    }
    
    const finalSlug = tenantSlug || userSlug || 'default';
    
    // If there was a specific route they were trying to access, redirect there
    if (from && from !== '/login' && from !== '/') {
      navigate(`/rptenant/${finalSlug}${from}`, { replace: true });
    } else {
      navigate(`/rptenant/${finalSlug}/all-deceased`, { replace: true });
    }
  }, [navigate, location]);
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6B7280' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p>Loading dashboard...</p>
      </div>
    </div>
  );
};

// Main App Router
const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<OnboardingFlow />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/portal" element={<Navigate to="/portal/login" replace />} />
      <Route path="/portal/login" element={<PortalLoginPage />} />
      
      {/* Legacy dashboard redirect */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <DashboardRedirect />
        </ProtectedRoute>
      } />
      
      {/* Tenant Routes: /rptenant/:slug/* - Protected */}
      <Route path="/rptenant/:slug/*" element={
        <ProtectedRoute>
          <TenantResolver />
        </ProtectedRoute>
      } />
      
      {/* 404 - Stay on landing page, don't redirect to login */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
};

export default AppRouter;