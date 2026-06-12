import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../api/endpoints';
import { 
  UserPlus,
  Check,
  Loader2,
  ClipboardList,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  Calendar as CalendarIcon,
  User,
  MapPin,
  Crosshair,
  Fingerprint,
  Building2 as Hospital,
  HeartPulse,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

// --- FIXED Smart Calendar Component (No Hidden Dropdown, Proper Z-Index, No Clipping) ---
const SmartCalendar = ({ selectedDate, onChange, maxDate = new Date(), placeholder = "Select Date", fieldErrors = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const [view, setView] = useState('days');
  const calendarRef = useRef(null);
  const buttonRef = useRef(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Ensure maxDate is a Date object with time normalized
  const maxDateObj = useMemo(() => {
    const date = maxDate instanceof Date ? maxDate : new Date(maxDate);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [maxDate]);

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonthIndex);
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonthIndex, i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }
    
    return days;
  };

  const handleDateSelect = (date) => {
    if (date) {
      const selectedDateObj = new Date(date);
      selectedDateObj.setHours(0, 0, 0, 0);
      
      if (selectedDateObj <= maxDateObj) {
        onChange(selectedDateObj);
        setIsOpen(false);
        setView('days');
      }
    }
  };

  const handleMonthSelect = (monthIndex) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    setCurrentMonth(newDate);
    setView('days');
  };

  const handleYearSelect = (year) => {
    const newDate = new Date(year, currentMonthIndex, 1);
    setCurrentMonth(newDate);
    setView('months');
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentYear, currentMonthIndex + direction, 1);
    setCurrentMonth(newDate);
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    return date > maxDateObj;
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const formatDateDisplay = (date) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
        setView('days');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const days = generateDays();

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: 20 }}>
      <div ref={buttonRef} style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          value={formatDateDisplay(selectedDate)}
          readOnly
          placeholder={placeholder}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${fieldErrors ? '#dc2626' : '#d1d5db'}`,
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: 'white',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <CalendarIcon 
          size={18} 
          style={{ 
            position: 'absolute', 
            right: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            pointerEvents: 'none'
          }} 
        />
      </div>

      {isOpen && (
        <div 
          ref={calendarRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: '0',
            width: '320px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            zIndex: 9999,
            overflow: 'visible'
          }}>
          {/* Calendar Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            borderBottom: '1px solid #e9ecef',
            backgroundColor: '#f8f9fa',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={16} color="#0d6efd" />
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Select Date</span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setView('days');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
          
          <div style={{ padding: '12px' }}>
            {/* Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => navigateMonth(-1)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setView(view === 'months' ? 'days' : 'months')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: view === 'months' ? '#0d6efd' : '#f8f9fa',
                    color: view === 'months' ? 'white' : '#333',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {months[currentMonthIndex]}
                </button>
                <button
                  onClick={() => setView(view === 'years' ? 'days' : 'years')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: view === 'years' ? '#0d6efd' : '#f8f9fa',
                    color: view === 'years' ? 'white' : '#333',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {currentYear}
                </button>
              </div>

              <button
                onClick={() => navigateMonth(1)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Days View */}
            {view === 'days' && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '4px',
                  marginBottom: '8px'
                }}>
                  {weekDays.map(day => (
                    <div key={day} style={{
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#6c757d',
                      padding: '4px'
                    }}>
                      {day}
                    </div>
                  ))}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '4px'
                }}>
                  {days.map((date, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(date)}
                      disabled={isDateDisabled(date)}
                      style={{
                        padding: '8px 4px',
                        textAlign: 'center',
                        backgroundColor: date && isSameDay(date, selectedDate)
                          ? '#0d6efd'
                          : isToday(date)
                            ? '#e7f1ff'
                            : 'white',
                        color: date && isSameDay(date, selectedDate)
                          ? 'white'
                          : isToday(date)
                            ? '#0d6efd'
                            : date
                              ? '#333'
                              : 'transparent',
                        border: '1px solid',
                        borderColor: date && isSameDay(date, selectedDate)
                          ? '#0d6efd'
                          : isToday(date)
                            ? '#0d6efd'
                            : '#e9ecef',
                        borderRadius: '6px',
                        cursor: date && !isDateDisabled(date) ? 'pointer' : 'default',
                        fontSize: '13px',
                        opacity: isDateDisabled(date) ? 0.5 : 1
                      }}
                    >
                      {date ? date.getDate() : ''}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Months View */}
            {view === 'months' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                {months.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    style={{
                      padding: '10px',
                      backgroundColor: index === currentMonthIndex ? '#0d6efd' : '#f8f9fa',
                      color: index === currentMonthIndex ? 'white' : '#333',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}

            {/* Years View */}
            {view === 'years' && (
              <div style={{
                maxHeight: '250px',
                overflowY: 'auto'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px'
                }}>
                  {years.map(year => (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      style={{
                        padding: '10px',
                        backgroundColor: year === currentYear ? '#0d6efd' : '#f8f9fa',
                        color: year === currentYear ? 'white' : '#333',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6c757d' }}>Selected</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                {selectedDate ? formatDateDisplay(selectedDate) : 'None'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleDateSelect(today)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Today
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setView('days');
                }}
                style={{
                  padding: '6px 16px',
                  backgroundColor: '#0d6efd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Toast Notification
const NotificationToast = ({ notification, setNotification }) => {
  useEffect(() => {
    if (notification.isVisible) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, isVisible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  if (!notification.isVisible) return null;

  const bgColor = notification.type === 'success' ? '#10b981' : '#ef4444';
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      backgroundColor: bgColor,
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      minWidth: '250px'
    }}>
      {notification.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{notification.title}</div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>{notification.message}</div>
      </div>
      <button onClick={() => setNotification(prev => ({ ...prev, isVisible: false }))} style={{
        background: 'none',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        marginLeft: 'auto'
      }}>
        <X size={14} />
      </button>
    </div>
  );
};

// Simple Stepper
const Stepper = ({ currentStep, steps }) => {
  return (
    <div style={{ marginBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: index <= currentStep ? '#0d6efd' : '#e9ecef',
                color: index <= currentStep ? 'white' : '#6c757d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {index < currentStep ? <Check size={20} /> : index + 1}
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: index === currentStep ? '#0d6efd' : '#6c757d', fontWeight: index === currentStep ? 'bold' : 'normal' }}>
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', backgroundColor: '#e9ecef' }}>
                <div style={{ width: index < currentStep ? '100%' : '0%', height: '100%', backgroundColor: '#0d6efd', transition: 'width 0.3s' }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Simple Form Input
const FormInput = ({ label, name, value, onChange, error, required, type = "text", placeholder }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#333' }}>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${error ? '#dc2626' : '#d1d5db'}`,
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => e.target.style.borderColor = '#0d6efd'}
        onBlur={(e) => e.target.style.borderColor = error ? '#dc2626' : '#d1d5db'}
      />
      {error && (
        <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={12} />
          {error}
        </div>
      )}
    </div>
  );
};

// Simple Select Input
const FormSelect = ({ label, name, value, onChange, error, required, options }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#333' }}>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${error ? '#dc2626' : '#d1d5db'}`,
          borderRadius: '8px',
          fontSize: '14px',
          backgroundColor: 'white',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{error}</div>
      )}
    </div>
  );
};

// Smart Date Input (uses SmartCalendar)
const SmartDateInput = ({ label, name, value, onChange, error, required }) => {
  const dateObject = value ? new Date(value) : null;
  
  const handleDateChange = (date) => {
    const isoString = date ? date.toISOString().split('T')[0] : '';
    onChange({ target: { name, value: isoString } });
  };
  
  return (
    <div style={{ marginBottom: '16px', overflow: 'visible' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#333' }}>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
      </label>
      <SmartCalendar
        selectedDate={dateObject}
        onChange={handleDateChange}
        maxDate={new Date()}
        placeholder={`Select ${label}`}
        fieldErrors={error}
      />
      {error && (
        <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{error}</div>
      )}
    </div>
  );
};

// Main Component
const DeceasedRegistrationForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({
    isVisible: false, type: 'info', title: '', message: '',
  });

  const steps = [
    { id: 1, title: 'Personal Info' },
    { id: 2, title: 'Death Details' },
    { id: 3, title: 'Location' },
  ];

  const initialFormData = {
    full_name: '', national_id: '', gender: '', date_of_birth: '',
    date_of_death: '', place_of_death: '', cause_of_death: '',
    admission_number: '', date_admitted: '', county: '', location: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = () => {
    const newErrors = {};
    
    if (currentStep === 0) {
      if (!formData.full_name) newErrors.full_name = 'Full name is required';
      if (!formData.national_id) newErrors.national_id = 'National ID is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    } else if (currentStep === 1) {
      if (!formData.date_of_death) newErrors.date_of_death = 'Date of death is required';
      if (!formData.place_of_death) newErrors.place_of_death = 'Place of death is required';
      if (!formData.cause_of_death) newErrors.cause_of_death = 'Cause of death is required';
    } else if (currentStep === 2) {
      if (!formData.county) newErrors.county = 'County is required';
      if (!formData.location) newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    try {
      const tenantSlug = localStorage.getItem('tenantSlug') || 'default';
      const payload = { ...formData, registered_by: 'System User' };
      console.log('Submitting:', payload);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${ENDPOINTS.DECEASED.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }
      
      setNotification({
        isVisible: true,
        type: 'success',
        title: 'Success!',
        message: 'Deceased record registered successfully!',
      });
      
      setTimeout(() => {
        navigate(`/rptenant/${tenantSlug}/all-deceased`);
      }, 2000);
      
    } catch (error) {
      setNotification({
        isVisible: true,
        type: 'error',
        title: 'Error!',
        message: error.message || 'Registration failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      padding: '20px',
      overflow: 'visible'
    }}>
      <NotificationToast notification={notification} setNotification={setNotification} />
      
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        maxWidth: '1200px',
        margin: '0 auto 24px auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#0d6efd',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#333' }}>Register Deceased</h1>
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>Fill in the details below</p>
            </div>
          </div>
          <button
            onClick={() => {
              setFormData(initialFormData);
              setErrors({});
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear Form
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'visible'
      }}>
        <div style={{ padding: '30px', overflow: 'visible' }}>
          {/* Stepper */}
          <Stepper currentStep={currentStep} steps={steps} />

          {/* Step 0: Personal Info */}
          {currentStep === 0 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>
                Personal Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <FormInput
                    label="Full Name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    error={errors.full_name}
                    required
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <FormInput
                    label="National ID"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleChange}
                    error={errors.national_id}
                    required
                    placeholder="Enter national ID"
                  />
                </div>
                <div>
                  <FormSelect
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    error={errors.gender}
                    required
                    options={[
                      { value: '', label: 'Select gender', disabled: true },
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                    ]}
                  />
                </div>
                <div>
                  <SmartDateInput
                    label="Date of Birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    error={errors.date_of_birth}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Death Details */}
          {currentStep === 1 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>
                Death Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <SmartDateInput
                    label="Date of Death"
                    name="date_of_death"
                    value={formData.date_of_death}
                    onChange={handleChange}
                    error={errors.date_of_death}
                    required
                  />
                </div>
                <div>
                  <FormInput
                    label="Place of Death"
                    name="place_of_death"
                    value={formData.place_of_death}
                    onChange={handleChange}
                    error={errors.place_of_death}
                    required
                    placeholder="Hospital, home, etc."
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <FormInput
                    label="Cause of Death"
                    name="cause_of_death"
                    value={formData.cause_of_death}
                    onChange={handleChange}
                    error={errors.cause_of_death}
                    required
                    placeholder="Enter cause of death"
                  />
                </div>
                <div>
                  <FormInput
                    label="Admission Number (Optional)"
                    name="admission_number"
                    value={formData.admission_number}
                    onChange={handleChange}
                    placeholder="If applicable"
                  />
                </div>
                <div>
                  <SmartDateInput
                    label="Date Admitted (Optional)"
                    name="date_admitted"
                    value={formData.date_admitted}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>
                Location Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <FormInput
                    label="County / Region"
                    name="county"
                    value={formData.county}
                    onChange={handleChange}
                    error={errors.county}
                    required
                    placeholder="Enter county"
                  />
                </div>
                <div>
                  <FormInput
                    label="Location / Sub-county"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    error={errors.location}
                    required
                    placeholder="Enter location"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #e9ecef'
          }}>
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={nextStep}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#111827',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: currentStep === 0 ? 'auto' : 0
                }}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: 'auto',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Submit Registration
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div style={{
        textAlign: 'center',
        marginTop: '24px',
        fontSize: '12px',
        color: '#6c757d'
      }}>
        All fields marked with <span style={{ color: '#dc2626' }}>*</span> are required
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DeceasedRegistrationForm;
