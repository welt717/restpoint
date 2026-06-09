import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Home, 
  FileText, 
  ShoppingCart, 
  Settings, 
  Bell, 
  LogOut, 
  Calendar, 
  FileCode,
  UsersRound,
  Truck,
  BarChart3,
  FileBarChart,
  FolderOpen,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Hexagon
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Colors } from '../../theme/colors';

// Theme colors from system
const theme = {
  primary: Colors.primary,      // #000000 - Dark blue-gray
  secondary: Colors.secondary,  // #000000 - Slightly lighter
  accent: Colors.accent,        // #000000 - Bright blue
  background: Colors.background, // #F8F9FA
  surface: Colors.surface,      // #FFFFFF
  textPrimary: Colors.textPrimary,
  textSecondary: Colors.textSecondary,
  textMuted: Colors.textMuted,
  border: Colors.border,
  hover: 'rgba(52, 152, 219, 0.1)', // Light accent hover
  activeBg: Colors.primary,
  activeText: '#FFFFFF'
};

const SidebarContainer = styled.aside`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: ${(props) => (props.$isOpen ? '260px' : '70px')};
  background: linear-gradient(180deg, ${theme.secondary} 0%, ${theme.primary} 100%);
  display: flex;
  flex-direction: column;
  z-index: 50;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  
  @media (max-width: 767px) {
    display: none;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${(props) => (props.$isOpen ? '16px' : '12px')};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 64px;
`;

const SidebarBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  overflow: hidden;
`;

const BrandLogo = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
  background: linear-gradient(135deg, ${theme.accent} 0%, #2980B9 100%);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
`;

const BrandInfo = styled.div`
  overflow: hidden;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.2s ease;
  white-space: nowrap;
`;

const BrandName = styled.div`
  font-weight: 700;
  color: #ffffff;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.02em;
`;

const ToggleButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const SidebarNav = styled.nav`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const NavSection = styled.div`
  padding: 0 ${(props) => (props.$isOpen ? '8px' : '4px')};
  margin-bottom: 8px;
`;

const SectionLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 8px 12px 4px;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.2s ease;
  white-space: nowrap;
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: ${(props) => (props.$collapsed ? '10px' : '10px 12px')};
  margin: 2px ${(props) => (props.$collapsed ? '4px' : '4px')};
  cursor: pointer;
  border-radius: 8px;
  background: ${(props) => props.$active 
    ? 'rgba(255, 255, 255, 0.15)' 
    : 'transparent'};
  color: ${(props) => props.$active 
    ? '#ffffff' 
    : 'rgba(255, 255, 255, 0.75)'};
  transition: all 0.2s ease;
  justify-content: ${(props) => (props.$collapsed ? 'center' : 'flex-start')};
  position: relative;
  
  ${(props) => props.$active && `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: ${theme.accent};
      border-radius: 0 2px 2px 0;
    }
  `}
  
  &:hover {
    background: ${(props) => props.$active 
      ? 'rgba(255, 255, 255, 0.2)' 
      : 'rgba(255, 255, 255, 0.08)'};
    color: #ffffff;
    transform: ${(props) => !props.$collapsed ? 'translateX(2px)' : 'none'};
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const MenuItemIcon = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuItemLabel = styled.span`
  font-size: 0.875rem;
  font-weight: ${(props) => (props.$active ? '600' : '500')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.2s ease;
  white-space: nowrap;
`;

const SidebarFooter = styled.div`
  padding: ${(props) => (props.$isOpen ? '16px 8px' : '12px 4px')};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto;
`;

const UserInfo = styled.div`
  margin-bottom: 12px;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.2s ease;
`;

const UserName = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
`;

const LogoutButton = styled.button`
  background: rgba(231, 76, 60, 0.2);
  border: 1px solid rgba(231, 76, 60, 0.3);
  cursor: pointer;
  padding: ${(props) => (props.$collapsed ? '10px' : '10px 16px')};
  border-radius: 8px;
  color: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: ${(props) => (props.$collapsed ? 'auto' : '100%')};
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(231, 76, 60, 0.3);
    color: #c0392b;
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const LogoutText = styled.span`
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.2s ease;
  white-space: nowrap;
`;

const CollapsedHint = styled.div`
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background: ${theme.surface};
  color: ${theme.textPrimary};
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  margin-left: 8px;
  z-index: 100;
  
  &::after {
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-right-color: ${theme.surface};
  }
`;

const CollapsedMenuItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  margin: 2px 4px;
  cursor: pointer;
  border-radius: 8px;
  background: ${(props) => props.$active 
    ? 'rgba(255, 255, 255, 0.15)' 
    : 'transparent'};
  color: ${(props) => props.$active 
    ? '#ffffff' 
    : 'rgba(255, 255, 255, 0.75)'};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${(props) => props.$active 
      ? 'rgba(255, 255, 255, 0.2)' 
      : 'rgba(255, 255, 255, 0.08)'};
    color: #ffffff;
    
    ${CollapsedHint} {
      opacity: 1;
      visibility: visible;
    }
  }
`;

const MobileMenuButton = styled.button`
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 60;
  background: ${theme.surface};
  border: 1px solid ${theme.border};
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: ${theme.textPrimary};
  
  &:hover {
    background: ${theme.background};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  @media (min-width: 768px) {
    display: none;
  }
`;

const SidebarOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 65;
  transition: opacity 0.25s ease-in-out;
  animation: fadeIn 0.25s ease-in-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const MobileSidebar = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  max-width: 85vw;
  background: linear-gradient(180deg, ${theme.secondary} 0%, ${theme.primary} 100%);
  padding: 16px;
  display: flex;
  flex-direction: column;
  z-index: 70;
  overflow: hidden;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s ease-in-out;
  transform: ${(props) => (props.$isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  
  @media (min-width: 768px) {
    display: none;
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
  }
`;

const ModernSidebar = ({ tenantData, userData = {}, onLogout = () => {}, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const safeTenantData = tenantData || {};
  const tenantSlug = slug || safeTenantData.slug || localStorage.getItem('tenantSlug') || '';
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile) {
      setIsOpen(false);
    } else {
      const savedState = localStorage.getItem('sidebarOpen');
      setIsOpen(savedState !== null ? savedState === 'true' : true);
    }
  }, []);

  useEffect(() => {
    checkMobile();
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [checkMobile]);

  useEffect(() => {
    if (isMobile && isOpen) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile, isOpen]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebarOpen', isOpen.toString());
    }
  }, [isOpen, isMobile]);

  const basePath = `/rptenant/${tenantSlug}`;

  // Group menu items by category
  const mainMenuItems = [
    { icon: Home, label: 'Dashboard', path: `${basePath}/dashboard` },
    { icon: FileText, label: 'Deceased', path: `${basePath}/all-deceased` },
    { icon: FileText, label: 'Invoices', path: `${basePath}/invoices` },
    { icon: Calendar, label: 'Calendar', path: `${basePath}/calendar` },
  ];

  const documentsMenuItems = [
    { icon: FileCode, label: 'E-Documents', path: `${basePath}/edocuments` },
    { icon: FolderOpen, label: 'Documents', path: `${basePath}/documents` },
  ];

  const businessMenuItems = [
    { icon: ShoppingCart, label: 'Marketplace', path: `${basePath}/marketplace` },
    { icon: UsersRound, label: 'Coffins', path: `${basePath}/coffins` },
    { icon: Truck, label: 'Hearse', path: `${basePath}/hearse` },
  ];

  const systemMenuItems = [
    { icon: Bell, label: 'Notifications', path: `${basePath}/notifications` },
    { icon: BarChart3, label: 'Analytics', path: `${basePath}/analytics` },
    { icon: FileBarChart, label: 'Reports', path: `${basePath}/reports` },
    { icon: Settings, label: 'Settings', path: `${basePath}/settings` },
  ];

  const isActive = (path) => {
    return location.pathname === path || 
           location.pathname.startsWith(path + '/') ||
           location.pathname === path.replace('/dashboard', '');
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const toggleSidebar = useCallback(() => {
    setIsTransitioning(true);
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) onToggle(newState);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isOpen, onToggle]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    onLogout();
    navigate('/login');
  }, [onLogout, navigate]);

  // Get tenant initials for logo (only show if name exists)
  const getTenantInitials = () => {
    if (!safeTenantData.name) return 'RP';
    return safeTenantData.name.slice(0, 2).toUpperCase();
  };

  // Render menu items helper
  const renderMenuItems = (items, collapsed = false) => {
    return items.map((item) => (
      <MenuItem
        key={item.path}
        $active={isActive(item.path)}
        $collapsed={collapsed}
        $visible={isOpen}
        onClick={() => handleNavClick(item.path)}
        role="button"
        tabIndex={0}
        aria-current={isActive(item.path) ? 'page' : undefined}
        title={collapsed ? item.label : undefined}
      >
        <MenuItemIcon><item.icon size={18} /></MenuItemIcon>
        <MenuItemLabel $active={isActive(item.path)} $visible={isOpen}>
          {item.label}
        </MenuItemLabel>
      </MenuItem>
    ));
  };

  // Render collapsed menu items with tooltips
  const renderCollapsedMenuItems = (items) => {
    return items.map((item) => (
      <CollapsedMenuItem
        key={item.path}
        $active={isActive(item.path)}
        onClick={() => handleNavClick(item.path)}
        role="button"
        tabIndex={0}
        aria-current={isActive(item.path) ? 'page' : undefined}
        title={item.label}
      >
        <CollapsedHint>{item.label}</CollapsedHint>
        <MenuItemIcon><item.icon size={18} /></MenuItemIcon>
      </CollapsedMenuItem>
    ));
  };

  if (isMobile) {
    return (
      <React.Fragment>
        <MobileMenuButton
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          aria-expanded={isOpen}
        >
          <Menu size={20} />
        </MobileMenuButton>

        {isOpen && (
          <SidebarOverlay
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}

        <MobileSidebar $isOpen={isOpen}>
          <SidebarHeader>
            <SidebarBrand>
              <BrandLogo>
                {getTenantInitials()}
              </BrandLogo>
              {safeTenantData.name && (
                <BrandInfo $visible={true}>
                  <BrandName>{safeTenantData.name}</BrandName>
                </BrandInfo>
              )}
            </SidebarBrand>
            <CloseButton onClick={() => setIsOpen(false)} aria-label="Close sidebar">
              <X size={18} />
            </CloseButton>
          </SidebarHeader>

          <SidebarNav>
            <NavSection $isOpen={true}>
              <SectionLabel $visible={true}>Main</SectionLabel>
              {renderMenuItems(mainMenuItems, false)}
            </NavSection>
            
            <NavSection $isOpen={true}>
              <SectionLabel $visible={true}>Documents</SectionLabel>
              {renderMenuItems(documentsMenuItems, false)}
            </NavSection>
            
            <NavSection $isOpen={true}>
              <SectionLabel $visible={true}>Business</SectionLabel>
              {renderMenuItems(businessMenuItems, false)}
            </NavSection>
            
            <NavSection $isOpen={true}>
              <SectionLabel $visible={true}>System</SectionLabel>
              {renderMenuItems(systemMenuItems, false)}
            </NavSection>
          </SidebarNav>

          <SidebarFooter>
            <UserInfo $visible={true}>
              <UserName>{userData.name || 'Admin User'}</UserName>
              <UserRole>{userData.role || 'Administrator'}</UserRole>
            </UserInfo>
            <LogoutButton onClick={handleLogout} aria-label="Sign out">
              <LogOut size={16} />
              <LogoutText $visible={true}>Sign Out</LogoutText>
            </LogoutButton>
          </SidebarFooter>
        </MobileSidebar>
      </React.Fragment>
    );
  }

  // Collapsed state - show icons only with tooltips
  if (!isOpen) {
    return (
      <SidebarContainer $isOpen={false} aria-label="Collapsed sidebar">
        <SidebarHeader $isOpen={false}>
          <SidebarBrand>
            <BrandLogo style={{ width: '40px', height: '40px' }}>
              {getTenantInitials()}
            </BrandLogo>
          </SidebarBrand>
        </SidebarHeader>

        <SidebarNav>
          <NavSection $isOpen={false}>
            {renderCollapsedMenuItems(mainMenuItems)}
          </NavSection>
          
          <NavSection $isOpen={false}>
            {renderCollapsedMenuItems(documentsMenuItems)}
          </NavSection>
          
          <NavSection $isOpen={false}>
            {renderCollapsedMenuItems(businessMenuItems)}
          </NavSection>
          
          <NavSection $isOpen={false}>
            {renderCollapsedMenuItems(systemMenuItems)}
          </NavSection>
        </SidebarNav>

        <SidebarFooter $isOpen={false}>
          <LogoutButton $collapsed={true} onClick={handleLogout} aria-label="Sign out">
            <LogOut size={18} />
          </LogoutButton>
        </SidebarFooter>

        <ToggleButton
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
          style={{
            position: 'absolute',
            right: '-16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <ChevronRight size={16} />
        </ToggleButton>
      </SidebarContainer>
    );
  }

  // Expanded state
  return (
    <SidebarContainer $isOpen={isOpen} className={isTransitioning ? 'transitioning' : ''} aria-label="Main sidebar">
      <SidebarHeader $isOpen={isOpen}>
        <SidebarBrand>
          <BrandLogo>
            {getTenantInitials()}
          </BrandLogo>
          {safeTenantData.name && (
            <BrandInfo $visible={isOpen}>
              <BrandName>{safeTenantData.name}</BrandName>
            </BrandInfo>
          )}
        </SidebarBrand>
        <ToggleButton
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <ChevronLeft size={16} />
        </ToggleButton>
      </SidebarHeader>

      <SidebarNav>
        <NavSection $isOpen={isOpen}>
          <SectionLabel $visible={isOpen}>Main</SectionLabel>
          {renderMenuItems(mainMenuItems, !isOpen)}
        </NavSection>
        
        <NavSection $isOpen={isOpen}>
          <SectionLabel $visible={isOpen}>Documents</SectionLabel>
          {renderMenuItems(documentsMenuItems, !isOpen)}
        </NavSection>
        
        <NavSection $isOpen={isOpen}>
          <SectionLabel $visible={isOpen}>Business</SectionLabel>
          {renderMenuItems(businessMenuItems, !isOpen)}
        </NavSection>
        
        <NavSection $isOpen={isOpen}>
          <SectionLabel $visible={isOpen}>System</SectionLabel>
          {renderMenuItems(systemMenuItems, !isOpen)}
        </NavSection>
      </SidebarNav>

      <SidebarFooter $isOpen={isOpen}>
        <UserInfo $visible={isOpen}>
          <UserName>{userData.name || 'Admin User'}</UserName>
          <UserRole>{userData.role || 'Administrator'}</UserRole>
        </UserInfo>
        <LogoutButton $collapsed={!isOpen} onClick={handleLogout} aria-label="Sign out">
          <LogOut size={16} />
          <LogoutText $visible={isOpen}>Sign Out</LogoutText>
        </LogoutButton>
      </SidebarFooter>
    </SidebarContainer>
  );
};

export default ModernSidebar;