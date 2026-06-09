
 import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createGlobalStyle } from 'styled-components';
import styled from 'styled-components';
import { 
  Home,
  FileText,
  Users,
  User,
  CreditCard,
  ArrowLeft,
  LogOut,
  ArrowUp
} from 'lucide-react';
import LoginPage from './pages/login';

// Colors configuration - Black & Green Theme
const Colors = {
  primaryDark: '#0a0e27',
  accentGreen: '#22c55e',
  darkGreen: '#16a34a',
  lightGreen: '#dcfce7',
  white: '#FFFFFF',
  lightGray: '#f3f4f6',
  mediumGray: '#e5e7eb',
  darkGray: '#6b7280',
  successGreen: '#22c55e',
  dangerRed: '#ef4444',
  warningYellow: '#f59e0b',
  infoBlue: '#3b82f6',
  tableBorder: '#e5e7eb',
  headerBg: '#0f172a',
  hoverGray: '#f9fafb',
  purple: '#8b5cf6',
  teal: '#06b6d4',
  lightTeal: '#ccfbf1',
  vibrantGreen: '#22c55e',
  deepGreen: '#166534',
  shadowLight: 'rgba(0, 0, 0, 0.08)',
  shadowMedium: 'rgba(0, 0, 0, 0.12)',
  shadowDark: 'rgba(0, 0, 0, 0.1)'
};

// Global Styles - FIXED SCROLLBARS
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Hide default scrollbar for all browsers */
  *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  *::-webkit-scrollbar-track {
    background: rgba(241, 241, 241, 0.5);
    border-radius: 10px;
  }

  *::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  *::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* For Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 rgba(241, 241, 241, 0.5);
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1626 100%);
    line-height: 1.6;
    color: #f3f4f6;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    overflow-x: hidden;
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    font-family: inherit;
  }

  input, select, textarea {
    font-family: inherit;
    outline: none;
  }

  /* Ensure all scrollable elements use our custom scrollbar */
  .custom-scroll {
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 rgba(241, 241, 241, 0.5);
  }

  .custom-scroll::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scroll::-webkit-scrollbar-track {
    background: rgba(241, 241, 241, 0.5);
    border-radius: 10px;
  }

  .custom-scroll::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  .custom-scroll::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
`;

// Main App Container - Mobile First
const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1626 100%);
  max-width: 100%;
  overflow-x: hidden;
  position: relative;
  
  /* Hide scrollbar but keep functionality */
  &::-webkit-scrollbar {
    display: none;
  }
  
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const MainContent = styled.main`
  padding-bottom: 60px;
  min-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  
  /* Custom scrollbar for main content */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(241, 241, 241, 0.5);
    border-radius: 10px;
    margin: 4px 0;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  /* For Firefox */
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 rgba(241, 241, 241, 0.5);
`;

// Sleek Professional Bottom Navigation
const BottomNavigation = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(10, 14, 39, 0.95);
  backdrop-filter: blur(20px);
  display: flex;
  padding: 0;
  z-index: 100;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(34, 197, 94, 0.15);
  height: 64px;
  align-items: center;
`;

const NavButton = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: ${props => props.active ? Colors.successGreen : 'rgba(255, 255, 255, 0.5)'};
  font-size: 0.65rem;
  font-weight: ${props => props.active ? '600' : '400'};
  transition: all 0.2s ease;
  position: relative;
  min-height: 56px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: ${props => props.active ? '40px' : '0px'};
    height: 2px;
    background: ${Colors.successGreen};
    border-radius: 0 0 2px 2px;
    transition: all 0.3s ease;
  }

  &:hover {
    color: rgba(255, 255, 255, 0.8);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const NavIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  
  svg {
    width: 20px;
    height: 20px;
    stroke-width: ${props => props.active ? 2.5 : 2};
  }

`;

const NavLabel = styled.span`
  position: relative;
  z-index: 1;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.02em;
`;

// Simple page header component
const PageHeader = styled.div`
  background: ${Colors.primaryDark};
  color: ${Colors.white};
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const PageHeaderContent = styled.div`
  display: flex;       
  align-items: center;        
  gap: 1rem;    
`;

const BackButton = styled.button`
  background: none;            
  border: none;   
  color: ${Colors.white};      
  cursor: pointer;             
  padding: 0.5rem;         
  display: flex;              
  align-items: center;
  justify-content: center;       
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

// Scroll to Top Button Component
const ScrollToTopButton = styled.button`
  position: fixed;
  bottom: 70px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${Colors.vibrantBlue};
  color: ${Colors.white};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 99;
  box-shadow: 0 4px 12px rgba(5, 102, 141, 0.3);
  transition: all 0.3s ease;
  opacity: ${props => props.visible ? '1' : '0'};
  transform: ${props => props.visible ? 'translateY(0)' : 'translateY(10px)'};
  pointer-events: ${props => props.visible ? 'auto' : 'none'};

  &:hover {
    background: ${Colors.primaryDark};
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(5, 102, 141, 0.4);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

// Import Pages
import DashboardPage from './pages/dashboardPage';
import BillingPage from './pages/billingPage';
import MarketplacePage from './pages/marketplacePage';
import ProfilePage from './pages/profilePage';
import DocumentsPage from './pages/documentsPage';
import PaymentsPage from './pages/paymentsPage';
import AIAssistant from './components/AIAssistant';
import NotificationSystem from './components/NotificationSystem';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentPage, setCurrentPage] = useState('main');
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Create refs for scrolling
  const mainContentRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Reset scroll position when page changes
  useEffect(() => {
    // Reset main content scroll to top
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    
    // Also reset window scroll (as backup)
    window.scrollTo(0, 0);
    
    // Hide scroll to top button on page change
    setShowScrollTop(false);
  }, [activeTab, currentPage]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (mainContentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = mainContentRef.current;
        // Show button if scrolled more than 200px and not at bottom
        const shouldShow = scrollTop > 200 && scrollTop < (scrollHeight - clientHeight - 100);
        setShowScrollTop(shouldShow);
      }
    }, 100);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowScrollTop(false);
  };

  // Attach scroll event listener
  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll);
      
      // Check initial scroll position
      handleScroll();
      
      return () => {
        if (mainContent) {
          mainContent.removeEventListener('scroll', handleScroll);
        }
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [handleScroll]);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = () => {
      const deceasedId = localStorage.getItem('deceased_id');
      const sessionToken = localStorage.getItem('session_token');
      
      // If we have both deceased_id and session_token, consider user authenticated
      if (deceasedId && sessionToken) {
        setIsAuthenticated(true);
        
        // Try to load user data from localStorage or set dummy data
        const storedUser = localStorage.getItem('funeralPortalUser');
        if (storedUser) {
          setUserData(JSON.parse(storedUser));
        } else {
          const dummyUser = {
            name: 'Sarah Johnson',
            relationship: 'Spouse'
          };
          setUserData(dummyUser);
          localStorage.setItem('funeralPortalUser', JSON.stringify(dummyUser));
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = (loginResponse) => {
    // Store the deceased_id from the response
    if (loginResponse.deceased && loginResponse.deceased.deceased_id) {
      localStorage.setItem('deceased_id', loginResponse.deceased.deceased_id);
    }
    
    // Store session token
    if (loginResponse.session_token) {
      localStorage.setItem('session_token', loginResponse.session_token);
    }
    
    // Set user data
    const userData = {
      name: loginResponse.deceased?.full_name || 'User',
      relationship: 'Next of Kin',
      admissionNumber: loginResponse.deceased?.admission_number,
      deceasedId: loginResponse.deceased?.deceased_id
    };
    
    setUserData(userData);
    localStorage.setItem('funeralPortalUser', JSON.stringify(userData));
    
    // Mark as authenticated
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('deceased_id');
    localStorage.removeItem('session_token');
    localStorage.removeItem('funeralPortalUser');
    setUserData(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setCurrentPage('main');
    setShowScrollTop(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage('main');
  };

  // New function to handle page navigation (for payments page)
  const handlePageNavigation = (page) => {
    if (page === 'payments') {
      setCurrentPage('payments');
    } else {
      handleTabChange(page);
    }
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    // If not authenticated, show login page
    if (!isAuthenticated) {
      return <LoginPage onLogin={handleLogin} />;
    }

    // Handle special pages (payments)
    if (currentPage === 'payments') {
      return (
        <>
          <PaymentsPage 
            userData={userData}
            onNavigate={handlePageNavigation}
          />
        </>
      );
    }

    // Handle main navigation tabs
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage 
            userData={userData} 
            onLogout={handleLogout} 
            onNavigate={handlePageNavigation}
          />
        );
      case 'billing':
        return <BillingPage onLogout={handleLogout} />;
      case 'vendors':
        return <MarketplacePage onLogout={handleLogout} />;
      case 'documents':
        return <DocumentsPage onLogout={handleLogout} />;
      case 'profile':
        return <ProfilePage userData={userData} onLogout={handleLogout} />;
      default:
        return (
          <DashboardPage 
            userData={userData} 
            onLogout={handleLogout} 
            onNavigate={handlePageNavigation}
          />
        );
    }
  };

  const navItems = [
    { id: 'dashboard', icon: <Home />, label: 'home' },
    { id: 'billing', icon: <CreditCard />, label: 'billing' },
    { id: 'vendors', icon: <Users />, label: 'marketplace' },
    { id: 'documents', icon: <FileText />, label: 'docs' },
    { id: 'profile', icon: <User />, label: 'profile' },
  ];

  return (
    <>
      <GlobalStyle />
      <AppContainer className="custom-scroll">
        <MainContent 
          ref={mainContentRef}
          className="custom-scroll"
        >
          {renderContent()}
        </MainContent>

        {/* Scroll to top button - only show when authenticated */}
        {isAuthenticated && (
          <ScrollToTopButton 
            visible={showScrollTop}
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <ArrowUp />
          </ScrollToTopButton>
        )}

        {/* AI Assistant - Available on all authenticated pages */}
        {isAuthenticated && (
          <AIAssistant 
            userData={userData}
            tenantSlug={localStorage.getItem('tenantSlug') || 'restpoint'}
            deceasedId={localStorage.getItem('deceased_id')}
          />
        )}

        {/* Real-time Notification System */}
        {isAuthenticated && (
          <NotificationSystem 
            userData={userData}
            tenantSlug={localStorage.getItem('tenantSlug') || 'restpoint'}
            deceasedId={localStorage.getItem('deceased_id')}
          />
        )}

        {isAuthenticated && currentPage === 'main' && (
          <BottomNavigation>
            {navItems.map(item => (
              <NavButton
                key={item.id}
                active={activeTab === item.id}
                onClick={() => handleTabChange(item.id)}
              >
                <NavIcon active={activeTab === item.id}>
                  {React.cloneElement(item.icon, {
                    size: 18,
                    strokeWidth: activeTab === item.id ? 2.5 : 2
                  })}
                </NavIcon>
                <NavLabel>{item.label}</NavLabel>
              </NavButton>
            ))}
          </BottomNavigation>
        )}
      </AppContainer>
    </>
  );
}

export default App;