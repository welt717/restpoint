import React, { useState } from 'react';
import styled from 'styled-components';
import { Calendar } from 'lucide-react';

const SelectorWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  background: white;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const DateInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const DateRangeSelector = ({ onChange }) => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleStartChange = (e) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    onChange({
      startDate: new Date(newStart),
      endDate: new Date(endDate)
    });
  };

  const handleEndChange = (e) => {
    const newEnd = e.target.value;
    setEndDate(newEnd);
    onChange({
      startDate: new Date(startDate),
      endDate: new Date(newEnd)
    });
  };

  return (
    <SelectorWrapper>
      <Calendar size={18} color="#667eea" />
      <DateInput type="date" value={startDate} onChange={handleStartChange} />
      <span style={{ color: '#999' }}>to</span>
      <DateInput type="date" value={endDate} onChange={handleEndChange} />
    </SelectorWrapper>
  );
};

export default DateRangeSelector;
