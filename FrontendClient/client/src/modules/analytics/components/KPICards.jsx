import React from 'react';
import styled from 'styled-components';
import { TrendingUp, Users, DollarSign, Clock } from 'lucide-react';

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const KPICard = styled.div`
  background: ${props => props.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  .kpi-content {
    flex: 1;
  }

  .kpi-label {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .kpi-value {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 5px;
  }

  .kpi-change {
    font-size: 12px;
    opacity: 0.8;
  }

  .kpi-icon {
    margin-left: 20px;
    opacity: 0.7;
  }
`;

const KPICards = ({ data }) => {
  if (!data) return null;

  const kpis = [
    {
      label: 'Total Cases',
      value: data.total_cases || 0,
      icon: Users,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      change: '+12% from last month'
    },
    {
      label: 'Total Revenue',
      value: `KES ${(data.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      change: `Released: ${data.released_cases || 0}`
    },
    {
      label: 'Average Stay',
      value: `${(data.avg_stay_days || 0).toFixed(1)} days`,
      icon: Clock,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      change: 'From admission to discharge'
    },
    {
      label: 'Outstanding Balance',
      value: `KES ${(data.outstanding_balance || 0).toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      change: `Pending: ${data.outstanding_balance ? 'Review needed' : 'All clear'}`
    }
  ];

  return (
    <KPIGrid>
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <KPICard key={index} gradient={kpi.gradient}>
            <div className="kpi-content">
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-change">{kpi.change}</div>
            </div>
            <Icon className="kpi-icon" size={40} />
          </KPICard>
        );
      })}
    </KPIGrid>
  );
};

export default KPICards;
