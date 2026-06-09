import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import AnalyticsService from '../../services/analyticsService';
import { KPICards, DateRangeSelector, ExportButtons, NavigationTabs } from '../../modules/analytics/components';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Inter', sans-serif;
`;

const MainContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  margin-bottom: 30px;

  h1 {
    font-size: 32px;
    font-weight: 700;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 15px;
    align-items: center;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Tab = styled.button`
  padding: 10px 20px;
  border: none;
  background: ${props => props.active ? '#667eea' : 'transparent'};
  color: ${props => props.active ? 'white' : '#667eea'};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => !props.active ? '#f0f0f0' : '#667eea'};
  }
`;

const GridLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const ChartCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }

  h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
    font-size: 18px;
  }
`;

const FullWidthChart = styled(ChartCard)`
  grid-column: 1 / -1;
`;

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await AnalyticsService.getDashboard(dateRange.startDate, dateRange.endDate);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const data = await AnalyticsService.getMonthlyAnalytics();
      setMonthlyData(data);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  };

  const fetchYearlyData = async () => {
    try {
      const data = await AnalyticsService.getYearlyAnalytics();
      setYearlyData(data);
    } catch (error) {
      console.error('Error fetching yearly data:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'monthly') fetchMonthlyData();
    if (activeTab === 'yearly') fetchYearlyData();
  }, [activeTab]);

  if (loading) {
    return (
      <DashboardContainer>
        <MainContent>
          <Header>
            <h1>Loading Analytics...</h1>
          </Header>
        </MainContent>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <MainContent>
        <Header>
          <h1>📊 Analytics Dashboard</h1>
          <div className="header-actions">
            <DateRangeSelector onChange={setDateRange} />
            <ExportButtons />
          </div>
        </Header>

        <TabsContainer>
          {['overview', 'monthly', 'yearly'].map(tab => (
            <Tab key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} View
            </Tab>
          ))}
        </TabsContainer>

        {activeTab === 'overview' && dashboardData && (
          <>
            <KPICards data={dashboardData.kpis} />

            <GridLayout>
              <ChartCard>
                <h3>Revenue by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.revenueByCategory}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {dashboardData.revenueByCategory?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard>
                <h3>Case Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.caseDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <FullWidthChart>
                <h3>Daily Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="cases" stroke="#667eea" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#764ba2" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </FullWidthChart>
            </GridLayout>
          </>
        )}

        {activeTab === 'monthly' && monthlyData && (
          <GridLayout>
            <FullWidthChart>
              <h3>Monthly Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cases" stroke="#667eea" strokeWidth={2} />
                  <Line type="monotone" dataKey="revenue" stroke="#764ba2" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </FullWidthChart>
          </GridLayout>
        )}

        {activeTab === 'yearly' && yearlyData && (
          <GridLayout>
            <FullWidthChart>
              <h3>Yearly Overview</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={yearlyData.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cases" fill="#667eea" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </FullWidthChart>
          </GridLayout>
        )}
      </MainContent>
    </DashboardContainer>
  );
};

export default AnalyticsDashboard;
