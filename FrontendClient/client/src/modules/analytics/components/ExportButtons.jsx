import React, { useState } from 'react';
import styled from 'styled-components';
import { Download, FileText, Mail } from 'lucide-react';
import AnalyticsService from '../../../services/analyticsService';

const ExportWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

const ExportButton = styled.button`
  padding: 10px 16px;
  background: ${props => props.primary ? '#667eea' : 'white'};
  color: ${props => props.primary ? 'white' : '#667eea'};
  border: ${props => props.primary ? 'none' : '2px solid #667eea'};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 8px;
  z-index: 10;
  min-width: 200px;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #333;
  font-size: 14px;
  transition: background 0.3s ease;

  &:first-child {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  &:last-child {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  &:hover {
    background: #f5f5f5;
  }
`;

const ExportButtons = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async (format) => {
    try {
      setLoading(true);
      const now = new Date();
      const startDate = new Date(now.setMonth(now.getMonth() - 1));

      switch (format) {
        case 'pdf':
          await AnalyticsService.exportPDF(startDate, new Date(), 'Analytics Report');
          break;
        case 'excel':
          await AnalyticsService.exportExcel(startDate, new Date(), 'Analytics Report');
          break;
        case 'csv':
          await AnalyticsService.exportCSV(startDate, new Date(), 'Analytics Report');
          break;
        default:
          break;
      }
      setShowDropdown(false);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExportWrapper>
      <ExportButton primary onClick={() => setShowDropdown(!showDropdown)} disabled={loading}>
        <Download size={18} />
        Export
      </ExportButton>
      {showDropdown && (
        <DropdownMenu>
          <DropdownItem onClick={() => handleExport('pdf')}>
            <FileText size={16} />
            Download PDF
          </DropdownItem>
          <DropdownItem onClick={() => handleExport('excel')}>
            <FileText size={16} />
            Download Excel
          </DropdownItem>
          <DropdownItem onClick={() => handleExport('csv')}>
            <FileText size={16} />
            Download CSV
          </DropdownItem>
        </DropdownMenu>
      )}
    </ExportWrapper>
  );
};

export default ExportButtons;
