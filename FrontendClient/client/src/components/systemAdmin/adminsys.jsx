// components/SystemAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
  50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
`;

// Color Palette
const Colors = {
  primary: '#3B82F6',
  primaryDark: '#1E40AF',
  primaryLight: '#60A5FA',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  
  dark: {
    bg: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      muted: '#64748B'
    }
  },
  
  light: {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    text: {
      primary: '#1E293B',
      secondary: '#475569',
      muted: '#64748B'
    }
  }
};

// Styled Components
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${Colors.dark.bg} 0%, #1a202c 100%);
  color: ${Colors.dark.text.primary};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
`;

const HeaderLeft = styled.div`
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, ${Colors.primary} 0%, ${Colors.secondary} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }
  
  .last-update {
    color: ${Colors.dark.text.secondary};
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const RefreshToggle = styled.button`
  background: ${props => props.active ? Colors.primary : 'transparent'};
  color: ${props => props.active ? 'white' : Colors.primary};
  border: 2px solid ${Colors.primary};
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${Colors.primary};
    color: white;
    transform: translateY(-2px);
  }
  
  ${props => props.active && `
    animation: ${glow} 2s infinite;
  `}
`;

const RefreshButton = styled.button`
  background: linear-gradient(135deg, ${Colors.secondary} 0%, #7C3AED 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
  }
`;

const DashboardTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: ${Colors.dark.card};
  padding: 0.5rem;
  border-radius: 16px;
  animation: ${fadeIn} 0.8s ease-out;
`;

const TabButton = styled.button`
  flex: 1;
  background: ${props => props.active ? Colors.primary : 'transparent'};
  color: ${props => props.active ? 'white' : Colors.dark.text.secondary};
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: ${props => props.active ? Colors.primary : 'rgba(59, 130, 246, 0.1)'};
    color: ${props => props.active ? 'white' : Colors.primary};
  }
  
  .tab-badge {
    background: ${Colors.danger};
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    font-size: 0.75rem;
    margin-left: auto;
  }
`;

const TabContent = styled.div`
  animation: ${fadeIn} 0.6s ease-out;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, ${Colors.dark.card} 0%, #273449 100%);
  border: 1px solid ${Colors.dark.border};
  border-radius: 20px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    border-color: ${Colors.primary};
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, 
      ${props => {
        switch(props.type) {
          case 'cpu': return Colors.danger;
          case 'memory': return Colors.warning;
          case 'process': return Colors.info;
          case 'requests': return Colors.success;
          default: return Colors.primary;
        }
      }} 0%, 
      ${props => {
        switch(props.type) {
          case 'cpu': return '#DC2626';
          case 'memory': return '#D97706';
          case 'process': return '#0891B2';
          case 'requests': return '#059669';
          default: return Colors.primaryDark;
        }
      }} 100%);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

const StatusBadge = styled.span`
  background: ${props => {
    switch(props.status) {
      case 'optimal': return Colors.success;
      case 'warning': return Colors.warning;
      case 'critical': return Colors.danger;
      default: return Colors.dark.text.muted;
    }
  }};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const MetricValue = styled.div`
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, ${Colors.dark.text.primary} 0%, ${Colors.dark.text.secondary} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${Colors.dark.border};
  border-radius: 10px;
  overflow: hidden;
  margin: 1rem 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, 
    ${props => props.color} 0%, 
    ${props => props.color}dd 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 2s infinite;
  }
`;

const MetricDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  
  .label {
    color: ${Colors.dark.text.secondary};
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .value {
    color: ${Colors.dark.text.primary};
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .small-text {
    font-size: 0.8rem;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: ${Colors.dark.card};
  border: 1px solid ${Colors.dark.border};
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    border-color: ${Colors.primary};
  }
  
  .stat-value {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, ${Colors.primary} 0%, ${Colors.secondary} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    color: ${Colors.dark.text.secondary};
    font-size: 0.9rem;
    font-weight: 500;
  }
`;

const RequestsDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const DetailSection = styled.div`
  background: ${Colors.dark.card};
  border: 1px solid ${Colors.dark.border};
  border-radius: 16px;
  padding: 1.5rem;
  
  h4 {
    margin: 0 0 1rem 0;
    color: ${Colors.dark.text.primary};
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

const MethodStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const MethodItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  
  .method-name {
    font-weight: 600;
    color: ${props => getMethodColor(props.method)};
    min-width: 60px;
  }
  
  .method-count {
    font-weight: 600;
    color: ${Colors.dark.text.primary};
    min-width: 40px;
    text-align: right;
  }
  
  .method-bar {
    flex: 1;
    height: 6px;
    background: ${Colors.dark.border};
    border-radius: 3px;
    overflow: hidden;
  }
  
  .method-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }
`;

const EndpointStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${Colors.dark.border};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${Colors.primary};
    border-radius: 3px;
  }
`;

const EndpointItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  
  .endpoint-path {
    flex: 1;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 0.85rem;
    color: ${Colors.dark.text.primary};
    word-break: break-all;
  }
  
  .endpoint-count {
    font-weight: 600;
    color: ${Colors.primary};
    min-width: 40px;
    text-align: right;
  }
  
  .endpoint-bar {
    width: 80px;
    height: 6px;
    background: ${Colors.dark.border};
    border-radius: 3px;
    overflow: hidden;
  }
  
  .endpoint-bar-fill {
    height: 100%;
    background: ${Colors.primary};
    border-radius: 3px;
    transition: width 0.5s ease;
  }
`;

// Helper functions
const getMethodColor = (method) => {
  const colors = {
    GET: Colors.success,
    POST: Colors.primary,
    PUT: Colors.warning,
    DELETE: Colors.danger,
    PATCH: Colors.secondary,
    OPTIONS: Colors.dark.text.muted
  };
  return colors[method] || Colors.dark.text.muted;
};

const getUsageColor = (usage, type = 'cpu') => {
  if (!usage || isNaN(usage)) return Colors.dark.text.muted;
  if (usage < 70) return Colors.success;
  if (usage < 85) return Colors.warning;
  return Colors.danger;
};

const getStatusLevel = (usage) => {
  if (!usage || isNaN(usage)) return 'unknown';
  if (usage < 70) return 'optimal';
  if (usage < 85) return 'warning';
  return 'critical';
};

const formatBytes = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatUptime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0m';
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatNumber = (num) => {
  if (!num || isNaN(num)) return '0';
  return new Intl.NumberFormat().format(num);
};

// Main Component
const  PerformanceDashboard = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with your actual API call
  const mockData = {
    cpu: {
      usage: 88,
      count: 4,
      model: "Intel(R) Core(TM) i5-7300U CPU @ 2.60GHz"
    },
    memory: {
      total: 8459087872,
      free: 1239113728,
      used: 7219974144,
      usage: 85
    },
    process: {
      memory: 128,
      cpu: 1,
      uptime: 748
    },
    system: {
      uptime: 382478.093,
      platform: "win32",
      arch: "x64"
    },
    load: {
      average: [0, 0, 0],
      current: 0
    },
    requests: {
      total: 28,
      perMinute: 2.27,
      byMethod: {
        "DELETE": 2,
        "GET": 25,
        "PUT": 1
      },
      byEndpoint: {
        "/api/v1/restpoint/users": 5,
        "/api/v1/restpoint/deceased-all": 4,
        "/api/v1/restpoint/all-drivers": 4,
        "/api/v1/restpoint/hearse-bookings": 4,
        "/api/v1/restpoint/performance": 4,
        "/api/v1/restpoint/users/5": 2,
        "/api/v1/restpoint/analytics/mortuary-analytics": 2,
        "/api/v1/restpoint/notifications": 2,
        "/api/v1/restpoint/users/4/status": 1
      },
      byHour: {
        "10": 28
      },
      uptime: 739
    }
  };

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      try {
        // Replace with your actual API endpoint
        const response = await fetch(' http://localhost:8009/api/v1/restpoint/performance');
        const data = await response.json();
        setPerformanceData(data.data);
        
        // Using mock data for now
        setTimeout(() => {
          setPerformanceData(mockData);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setLoading(false);
      }
    };

    fetchData();

    if (isAutoRefresh) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoRefresh]);

  if (loading) {
    return (
      <DashboardContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '3px solid #3B82F6',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: Colors.dark.text.secondary }}>Loading performance data...</p>
        </div>
      </DashboardContainer>
    );
  }

  if (!performanceData) {
    return (
      <DashboardContainer>
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem',
          color: Colors.dark.text.secondary
        }}>
          <h2>No performance data available</h2>
          <p>Unable to load system performance metrics</p>
        </div>
      </DashboardContainer>
    );
  }

  const { cpu, memory, process: processInfo, system, load, requests } = performanceData;

  return (
    <DashboardContainer>
      {/* Header */}
      <DashboardHeader>
        <HeaderLeft>
          <h1>🚀 System Administrator Dashboard</h1>
          <p className="last-update">
            Last updated: {new Date().toLocaleTimeString()}
            {requests && ` • Server uptime: ${formatUptime(requests.uptime)}`}
          </p>
        </HeaderLeft>
        
        <HeaderControls>
          <RefreshToggle 
            active={isAutoRefresh}
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            🔄 Auto-refresh: {isAutoRefresh ? 'ON' : 'OFF'}
          </RefreshToggle>
          <RefreshButton onClick={() => window.location.reload()}>
            ↻ Refresh Now
          </RefreshButton>
        </HeaderControls>
      </DashboardHeader>

      {/* Navigation Tabs */}
      <DashboardTabs>
        <TabButton 
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        >
          📈 System Overview
        </TabButton>
        <TabButton 
          active={activeTab === 'requests'}
          onClick={() => setActiveTab('requests')}
        >
          🌐 Request Analytics
          {requests && <span className="tab-badge">{formatNumber(requests.total)}</span>}
        </TabButton>
        <TabButton 
          active={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
        >
          🔍 Detailed Metrics
        </TabButton>
      </DashboardTabs>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <TabContent>
          <OverviewGrid>
            {/* CPU Card */}
            <MetricCard type="cpu">
              <CardHeader>
                <h3>⚡ CPU Usage</h3>
                <StatusBadge status={getStatusLevel(cpu?.usage)}>
                  {getStatusLevel(cpu?.usage).toUpperCase()}
                </StatusBadge>
              </CardHeader>
              <MetricValue>{cpu?.usage || 0}%</MetricValue>
              <ProgressBar>
                <ProgressFill 
                  width={`${cpu?.usage || 0}%`} 
                  color={getUsageColor(cpu?.usage)}
                />
              </ProgressBar>
              <MetricDetails>
                <DetailItem>
                  <span className="label">Cores:</span>
                  <span className="value">{cpu?.count || 0}</span>
                </DetailItem>
                <DetailItem>
                  <span className="label">Load Avg:</span>
                  <span className="value">{load?.current || 0}</span>
                </DetailItem>
                <DetailItem>
                  <span className="label">Model:</span>
                  <span className="value small-text">{cpu?.model || 'Unknown'}</span>
                </DetailItem>
              </MetricDetails>
            </MetricCard>

            {/* Memory Card */}
            <MetricCard type="memory">
              <CardHeader>
                <h3>💾 Memory Usage</h3>
                <StatusBadge status={getStatusLevel(memory?.usage)}>
                  {getStatusLevel(memory?.usage).toUpperCase()}
                </StatusBadge>
              </CardHeader>
              <MetricValue>{memory?.usage || 0}%</MetricValue>
              <ProgressBar>
                <ProgressFill 
                  width={`${memory?.usage || 0}%`} 
                  color={getUsageColor(memory?.usage, 'memory')}
                />
              </ProgressBar>
              <MetricDetails>
                <DetailItem>
                  <span className="label">Used:</span>
                  <span className="value">{formatBytes(memory?.used)}</span>
                </DetailItem>
                <DetailItem>
                  <span className="label">Free:</span>
                  <span className="value">{formatBytes(memory?.free)}</span>
                </DetailItem>
                <DetailItem>
                  <span className="label">Total:</span>
                  <span className="value">{formatBytes(memory?.total)}</span>
                </DetailItem>
              </MetricDetails>
            </MetricCard>

            {/* Process Card */}
            <MetricCard type="process">
              <CardHeader>
                <h3>🔧 Node.js Process</h3>
                <StatusBadge status={getStatusLevel(processInfo?.cpu)}>
                  {getStatusLevel(processInfo?.cpu).toUpperCase()}
                </StatusBadge>
              </CardHeader>
              <MetricValue>{processInfo?.cpu || 0}%</MetricValue>
              <ProgressBar>
                <ProgressFill 
                  width={`${processInfo?.cpu || 0}%`} 
                  color={getUsageColor(processInfo?.cpu)}
                />
              </ProgressBar>
              <MetricDetails>
                <DetailItem>
                  <span className="label">Memory:</span>
                  <span className="value">{processInfo?.memory || 0} MB</span>
                </DetailItem>
                <DetailItem>
                  <span className="label">Uptime:</span>
                  <span className="value">{formatUptime(processInfo?.uptime)}</span>
                </DetailItem>
                <DetailItem>
                  <span className="label">Platform:</span>
                  <span className="value small-text">{system?.platform || 'Unknown'}</span>
                </DetailItem>
              </MetricDetails>
            </MetricCard>

            {/* Requests Card */}
            <MetricCard type="requests">
              <CardHeader>
                <h3>🌐 HTTP Requests</h3>
                <StatusBadge status="optimal">LIVE</StatusBadge>
              </CardHeader>
              <MetricValue>{formatNumber(requests?.total || 0)}</MetricValue>
              <div style={{ color: Colors.dark.text.secondary, marginBottom: '1rem' }}>
                Total Requests
              </div>
              <MetricDetails>
                <DetailItem>
                  <span className="label">Req/Min:</span>
                  <span className="value">{requests?.perMinute || 0}</span>
                </DetailItem>
                <DetailItem>
                  <span className="label">Methods:</span>
                  <span className="value">{Object.keys(requests?.byMethod || {}).length}</span>
                </DetailItem>
                <DetailItem>
                  <span className="label">Endpoints:</span>
                  <span className="value">{Object.keys(requests?.byEndpoint || {}).length}</span>
                </DetailItem>
              </MetricDetails>
            </MetricCard>
          </OverviewGrid>
        </TabContent>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && requests && (
        <TabContent>
          <StatsGrid>
            <StatCard>
              <div className="stat-value">{formatNumber(requests.total)}</div>
              <div className="stat-label">Total Requests</div>
            </StatCard>
            <StatCard>
              <div className="stat-value">{requests.perMinute}</div>
              <div className="stat-label">Requests/Minute</div>
            </StatCard>
            <StatCard>
              <div className="stat-value">{formatUptime(requests.uptime)}</div>
              <div className="stat-label">Server Uptime</div>
            </StatCard>
            <StatCard>
              <div className="stat-value">{Object.keys(requests.byMethod).length}</div>
              <div className="stat-label">HTTP Methods</div>
            </StatCard>
          </StatsGrid>

          <RequestsDetails>
            <DetailSection>
              <h4>Requests by HTTP Method</h4>
              <MethodStats>
                {Object.entries(requests.byMethod).map(([method, count]) => (
                  <MethodItem key={method} method={method}>
                    <span className="method-name">{method}</span>
                    <span className="method-count">{formatNumber(count)}</span>
                    <div className="method-bar">
                      <div 
                        className="method-bar-fill"
                        style={{
                          width: `${(count / requests.total) * 100}%`,
                          backgroundColor: getMethodColor(method)
                        }}
                      />
                    </div>
                  </MethodItem>
                ))}
              </MethodStats>
            </DetailSection>

            <DetailSection>
              <h4>Top Endpoints</h4>
              <EndpointStats>
                {Object.entries(requests.byEndpoint).map(([endpoint, count]) => (
                  <EndpointItem key={endpoint}>
                    <span className="endpoint-path">{endpoint}</span>
                    <span className="endpoint-count">{formatNumber(count)}</span>
                    <div className="endpoint-bar">
                      <div 
                        className="endpoint-bar-fill"
                        style={{
                          width: `${(count / requests.total) * 100}%`
                        }}
                      />
                    </div>
                  </EndpointItem>
                ))}
              </EndpointStats>
            </DetailSection>
          </RequestsDetails>
        </TabContent>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <TabContent>
          <div style={{ 
            background: Colors.dark.card, 
            borderRadius: '16px', 
            padding: '2rem',
            border: `1px solid ${Colors.dark.border}`
          }}>
            <h3 style={{ margin: '0 0 2rem 0' }}>📊 Detailed System Metrics</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h4 style={{ color: Colors.dark.text.primary, marginBottom: '1rem' }}>System Information</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <DetailItem>
                    <span className="label">Platform:</span>
                    <span className="value">{system?.platform} {system?.arch}</span>
                  </DetailItem>
                  <DetailItem>
                    <span className="label">System Uptime:</span>
                    <span className="value">{formatUptime(system?.uptime)}</span>
                  </DetailItem>
                  <DetailItem>
                    <span className="label">Process Uptime:</span>
                    <span className="value">{formatUptime(processInfo?.uptime)}</span>
                  </DetailItem>
                </div>
              </div>
              
              <div>
                <h4 style={{ color: Colors.dark.text.primary, marginBottom: '1rem' }}>Load Averages</h4>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: Colors.primary }}>
                      {load?.average?.[0]?.toFixed(2) || '0.00'}
                    </div>
                    <div style={{ color: Colors.dark.text.secondary, fontSize: '0.9rem' }}>1 min</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: Colors.warning }}>
                      {load?.average?.[1]?.toFixed(2) || '0.00'}
                    </div>
                    <div style={{ color: Colors.dark.text.secondary, fontSize: '0.9rem' }}>5 min</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: Colors.danger }}>
                      {load?.average?.[2]?.toFixed(2) || '0.00'}
                    </div>
                    <div style={{ color: Colors.dark.text.secondary, fontSize: '0.9rem' }}>15 min</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabContent>
      )}
    </DashboardContainer>
  );
};



export default PerformanceDashboard;