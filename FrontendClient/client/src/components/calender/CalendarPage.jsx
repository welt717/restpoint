
import React, { useState, useEffect, useRef, useCallback } from 'react';
import moment from 'moment';
import './CalendarPage.css';
import { useParams } from 'react-router-dom';
import { useTenantStore } from '../../store/useTenantStore';
import { calendarApi } from '../../api/calendar.api';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  COLORS: {
    primaryDark: '#1E293B',
    accentRed: '#EF4444',
    accentBlue: '#3B82F6',
    successGreen: '#10B981',
    dangerRed: '#DC2626',
    warningYellow: '#F59E0B',
    infoBlue: '#0EA5E9',
    darkGray: '#334155',
    light: '#F8FAFC',
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    textPrimary: '#1E293B',
    textSecondary: '#64748B'
  },
  ENTRY_TYPES: {
    interment: { label: 'Interment', color: '#1E293B' },
    exhumation: { label: 'Exhumation', color: '#EA580C' },
    memorial: { label: 'Memorial Service', color: '#7C3AED' },
    maintenance: { label: 'Maintenance', color: '#0284C7' }
  }
};

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// LOADING COMPONENT
// ============================================
const LoadingCalendar = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
    <div>Loading Calendar...</div>
  </div>
);

// ============================================
// MAIN CALENDAR COMPONENT
// ============================================
const CalendarPage = () => {
  const { slug } = useParams();
  const { tenantData } = useTenantStore();
  const calendarRef = useRef(null);
  const [FullCalendarLoaded, setFullCalendarLoaded] = useState(false);
  const [FullCalendar, setFullCalendar] = useState(null);
  const [dayGridPlugin, setDayGridPlugin] = useState(null);
  const [timeGridPlugin, setTimeGridPlugin] = useState(null);
  const [interactionPlugin, setInteractionPlugin] = useState(null);
  
  // State
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState(['interment', 'exhumation', 'memorial', 'maintenance']);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentEditingId, setCurrentEditingId] = useState(null);
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0, byType: {} });
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    entryType: 'interment',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    description: '',
    status: 'pending',
    assignedTo: '',
    reference: ''
  });

  // Settings state
  const [settings, setSettings] = useState({
    defaultView: 'dayGridMonth',
    showWeekends: true,
    timeFormat24: false,
    dailyReminders: true
  });

  // Load FullCalendar from local public directory
  useEffect(() => {
    const loadFullCalendar = async () => {
      // Check if already loaded
      if (window.FullCalendar) {
        setFullCalendar(() => window.FullCalendar);
        setDayGridPlugin(() => window.FullCalendarDayGrid);
        setTimeGridPlugin(() => window.FullCalendarTimeGrid);
        setInteractionPlugin(() => window.FullCalendarInteraction);
        setFullCalendarLoaded(true);
        return;
      }

      // Load CSS from local files
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/resources/fullcalendar/main.min.css';
      document.head.appendChild(link);

      // Load core script
      const coreScript = document.createElement('script');
      coreScript.src = '/resources/fullcalendar/main.min.js';
      await new Promise((resolve) => {
        coreScript.onload = resolve;
        document.head.appendChild(coreScript);
      });

      // Wait for FullCalendar to be available
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.FullCalendar) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      setFullCalendar(() => window.FullCalendar);
      setDayGridPlugin(() => window.FullCalendarDayGrid);
      setTimeGridPlugin(() => window.FullCalendarTimeGrid);
      setInteractionPlugin(() => window.FullCalendarInteraction);
      setFullCalendarLoaded(true);
    };

    loadFullCalendar();
  }, []);

  // ============================================
  // TOAST HELPERS
  // ============================================
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // ============================================
  // DATA LOADING
  // ============================================
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await calendarApi.getEvents({ types: filters });
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      showToast('Failed to load calendar events', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  const loadStats = useCallback(async () => {
    try {
      const data = await calendarApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    if (FullCalendarLoaded) {
      loadEvents();
      loadStats();
    }
  }, [FullCalendarLoaded, loadEvents, loadStats]);

  // ============================================
  // EVENT HANDLERS
  // ============================================
  const handleDateClick = (info) => {
    setCurrentEditingId(null);
    setFormData({
      title: '',
      entryType: 'interment',
      startDate: moment(info.date).format('YYYY-MM-DD'),
      startTime: moment(info.date).format('HH:mm'),
      endDate: moment(info.date).format('YYYY-MM-DD'),
      endTime: moment(info.date).add(30, 'minutes').format('HH:mm'),
      location: '',
      description: '',
      status: 'pending',
      assignedTo: '',
      reference: ''
    });
    setModalOpen(true);
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setDetailsModalOpen(true);
  };

  const handleEventDrop = async (info) => {
    const eventId = info.event.id;
    const newStart = info.event.start.toISOString();
    const newEnd = info.event.end ? info.event.end.toISOString() : null;

    try {
      await calendarApi.updateEvent(eventId, { start: newStart, end: newEnd });
      showToast('Entry moved successfully', 'success');
    } catch (error) {
      info.revert();
      showToast('Failed to move entry', 'error');
    }
  };

  const handleEventResize = async (info) => {
    const eventId = info.event.id;
    const newEnd = info.event.end ? info.event.end.toISOString() : null;

    try {
      await calendarApi.updateEvent(eventId, { end: newEnd });
      showToast('Entry duration updated', 'success');
    } catch (error) {
      info.revert();
      showToast('Failed to update duration', 'error');
    }
  };

  const handleFilterChange = (type) => {
    setFilters(prev => {
      const newFilters = prev.includes(type)
        ? prev.filter(f => f !== type)
        : [...prev, type];
      return newFilters;
    });
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (calendarRef.current && calendarRef.current.getApi) {
      const calendar = calendarRef.current.getApi();
      calendar.changeView(view);
    }
  };

  // ============================================
  // FORM HANDLERS
  // ============================================
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEntry = async () => {
    if (!formData.title || !formData.startDate || !formData.startTime) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    const startDateTime = moment(`${formData.startDate} ${formData.startTime}`).toISOString();
    const endDateTime = formData.endDate && formData.endTime
      ? moment(`${formData.endDate} ${formData.endTime}`).toISOString()
      : null;

    const eventData = {
      ...formData,
      start: startDateTime,
      end: endDateTime
    };

    try {
      if (currentEditingId) {
        await calendarApi.updateEvent(currentEditingId, eventData);
        showToast('Entry updated successfully', 'success');
      } else {
        await calendarApi.createEvent(eventData);
        showToast('New entry created successfully', 'success');
      }
      setModalOpen(false);
      loadEvents();
      loadStats();
    } catch (error) {
      showToast('Error saving entry: ' + error.message, 'error');
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedEvent) return;

    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await calendarApi.deleteEvent(selectedEvent.id);
        showToast('Entry deleted successfully', 'success');
        setDetailsModalOpen(false);
        loadEvents();
        loadStats();
      } catch (error) {
        showToast('Error deleting entry: ' + error.message, 'error');
      }
    }
  };

  const handleEditEntry = () => {
    if (!selectedEvent) return;
    
    const start = moment(selectedEvent.start);
    const end = selectedEvent.end ? moment(selectedEvent.end) : null;

    setFormData({
      title: selectedEvent.title,
      entryType: selectedEvent.extendedProps?.entryType || 'interment',
      startDate: start.format('YYYY-MM-DD'),
      startTime: start.format('HH:mm'),
      endDate: end ? end.format('YYYY-MM-DD') : '',
      endTime: end ? end.format('HH:mm') : '',
      location: selectedEvent.extendedProps?.location || '',
      description: selectedEvent.extendedProps?.description || '',
      status: selectedEvent.extendedProps?.status || 'pending',
      assignedTo: selectedEvent.extendedProps?.assignedTo || '',
      reference: selectedEvent.extendedProps?.reference || ''
    });

    setCurrentEditingId(selectedEvent.id);
    setDetailsModalOpen(false);
    setModalOpen(true);
  };

  const handleSaveSettings = async () => {
    try {
      setSettings(settings);
      showToast('Settings saved successfully', 'success');
      setSettingsModalOpen(false);
    } catch (error) {
      showToast('Error saving settings', 'error');
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderEventContent = (eventInfo) => {
    const entryType = eventInfo.event.extendedProps?.entryType || 'interment';
    const typeConfig = CONFIG.ENTRY_TYPES[entryType] || CONFIG.ENTRY_TYPES.interment;
    
    return (
      <div className="calendar-event" style={{ backgroundColor: typeConfig.color }}>
        <div className="event-time">
          {moment(eventInfo.event.start).format(settings.timeFormat24 ? 'HH:mm' : 'h:mm A')}
        </div>
        <div className="event-title">{eventInfo.event.title}</div>
      </div>
    );
  };

  const filteredStats = {
    total: events.length,
    today: events.filter(e => moment(e.start).isSame(new Date(), 'day')).length,
    thisWeek: events.filter(e => moment(e.start).isSameOrAfter(moment().startOf('week'))).length,
    byType: {
      interment: events.filter(e => e.entryType === 'interment').length,
      exhumation: events.filter(e => e.entryType === 'exhumation').length,
      memorial: events.filter(e => e.entryType === 'memorial').length,
      maintenance: events.filter(e => e.entryType === 'maintenance').length
    }
  };

  const upcomingEvents = events
    .filter(e => moment(e.start).isAfter(new Date()))
    .slice(0, 5);

  // Don't render until FullCalendar is loaded
  if (!FullCalendarLoaded || !FullCalendar || !dayGridPlugin || !timeGridPlugin || !interactionPlugin) {
    return <LoadingCalendar />;
  }

  const FullCalendarComponent = FullCalendar.default || FullCalendar;

  return (
    <div className="calendar-page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <header className="calendar-header">
        <div className="header-content">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <i className="fas fa-bars" />
          </button>
          <div className="logo-section">
            <div className="logo-icon">
              <i className="fas fa-dove" />
            </div>
            <h1>{tenantData?.name || 'Rest Point Calendar'}</h1>
          </div>
          <div className="header-actions">
            <button className="header-btn" title="Notifications">
              <i className="fas fa-bell" />
              <span className="notification-badge">3</span>
            </button>
            <button className="add-event-btn" onClick={() => handleDateClick({ date: new Date() })}>
              <i className="fas fa-plus" />
              <span>New Entry</span>
            </button>
          </div>
        </div>
      </header>

      <div className="calendar-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
              <i className="fas fa-times" />
            </button>
          </div>

          <div className="sidebar-content">
            {/* Entry Type Filters */}
            <div className="filter-section">
              <h4>Entry Types</h4>
              <div className="filter-list">
                {Object.entries(CONFIG.ENTRY_TYPES).map(([key, config]) => (
                  <label key={key} className="filter-item">
                    <input
                      type="checkbox"
                      checked={filters.includes(key)}
                      onChange={() => handleFilterChange(key)}叔
                    />
                    <span className="filter-color" style={{ backgroundColor: config.color }} />
                    <span className="filter-label">{config.label}</span>
                    <span className="filter-count">
                      {filteredStats.byType[key] || 0}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-section">
              <h4>Quick Stats</h4>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-value">{filteredStats.total}</span>
                  <span className="stat-label">Total Entries</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{filteredStats.today}</span>
                  <span className="stat-label">Today</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{filteredStats.thisWeek}</span>
                  <span className="stat-label">This Week</span>
                </div>
              </div>
            </div>

            {/* Upcoming Entries */}
            <div className="upcoming-section">
              <h4>Upcoming</h4>
              <div className="upcoming-list">
                {upcomingEvents.length === 0 ? (
                  <div className="upcoming-item">No upcoming entries</div>
                ) : (
                  upcomingEvents.map(event => (
                    <div
                      key={event.id}
                      className="upcoming-item"
                      onClick={() => {
                        setSelectedEvent({ ...event, id: event.id });
                        setDetailsModalOpen(true);
                      }}
                    >
                      <div className="event-title">{event.title}</div>
                      <div className="event-time">
                        {moment(event.start).format('MMM Do, h:mm A')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Calendar Navigation */}
          <div className="calendar-nav">
            <div className="nav-left">
              <button className="nav-btn" onClick={() => {
                const calendar = calendarRef.current?.getApi();
                calendar?.prev();
              }}>
                <i className="fas fa-chevron-left" />
              </button>
              <button className="nav-btn" onClick={() => {
                const calendar = calendarRef.current?.getApi();
                calendar?.next();
              }}>
                <i className="fas fa-chevron-right" />
              </button>
              <button className="today-btn" onClick={() => {
                const calendar = calendarRef.current?.getApi();
                calendar?.today();
              }}>
                Today
              </button>
            </div>
            <h2 className="calendar-title">
              {moment(currentDate).format('MMMM YYYY')}
            </h2>
            <div className="nav-right">
              <div className="view-switcher">
                <button
                  className={`view-btn ${currentView === 'dayGridMonth' ? 'active' : ''}`}
                  onClick={() => handleViewChange('dayGridMonth')}
                >
                  Month
                </button>
                <button
                  className={`view-btn ${currentView === 'dayGridWeek' ? 'active' : ''}`}
                  onClick={() => handleViewChange('dayGridWeek')}
                >
                  Week
                </button>
                <button
                  className={`view-btn ${currentView === 'dayGridDay' ? 'active' : ''}`}
                  onClick={() => handleViewChange('dayGridDay')}
                >
                  Day
                </button>
                <button
                  className={`view-btn ${currentView === 'listWeek' ? 'active' : ''}`}
                  onClick={() => handleViewChange('listWeek')}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Container */}
          <div className="calendar-wrapper">
            <FullCalendarComponent
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={settings.defaultView}
              headerToolbar={false}
              defaultDate={currentDate}
              navLinks={true}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={settings.showWeekends}
              slotDuration="00:30:00"
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              nowIndicator={true}
              height="100%"
              events={events.map(e => ({
                ...e,
                className: e.entryType,
                extendedProps: {
                  entryType: e.entryType,
                  location: e.location,
                  description: e.description,
                  status: e.status,
                  assignedTo: e.assignedTo,
                  reference: e.reference
                }
              }))}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventContent={renderEventContent}
              datesSet={(info) => setCurrentDate(info.start)}
            />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <button className="nav-item active">
          <i className="fas fa-calendar-alt" />
          <span>Calendar</span>
        </button>
        <button className="nav-item" onClick={() => handleDateClick({ date: new Date() })}>
          <i className="fas fa-plus-circle" />
          <span>Add</span>
        </button>
        <button className="nav-item" onClick={() => handleViewChange('listWeek')}>
          <i className="fas fa-list" />
          <span>List</span>
        </button>
        <button className="nav-item" onClick={() => setSettingsModalOpen(true)}>
          <i className="fas fa-cog" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Rest of your modals remain the same... */}
      {/* Event Modal */}
      {modalOpen && (
        <div className="modal-overlay active" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{currentEditingId ? 'Edit Entry' : 'New Rest Point Entry'}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>
                  <i className="fas fa-user" />
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  placeholder="Enter full name"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="fas fa-hashtag" />
                    Reference Number
                  </label>
                  <input
                    type="text"
                    name="reference"
                    className="form-control"
                    placeholder="Auto-generated"
                    value={formData.reference}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-tag" />
                    Entry Type <span className="required">*</span>
                  </label>
                  <select
                    name="entryType"
                    className="form-control"
                    value={formData.entryType}
                    onChange={handleFormChange}
                  >
                    {Object.entries(CONFIG.ENTRY_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="fas fa-calendar-day" />
                    Arrival Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="form-control"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-clock" />
                    Arrival Time <span className="required">*</span>
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    className="form-control"
                    value={formData.startTime}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="fas fa-calendar-check" />
                    Departure Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    className="form-control"
                    value={formData.endDate}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-hourglass-end" />
                    Departure Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    className="form-control"
                    value={formData.endTime}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-map-marker-alt" />
                  Location / Plot Number
                </label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  placeholder="e.g., Section A, Plot 12"
                  value={formData.location}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-align-left" />
                  Additional Notes
                </label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="3"
                  placeholder="Any additional information..."
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="fas fa-tasks" />
                    Status
                  </label>
                  <select
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-user-tie" />
                    Assigned To
                  </label>
                  <input
                    type="text"
                    name="assignedTo"
                    className="form-control"
                    placeholder="Optional"
                    value={formData.assignedTo}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveEntry}>
                <i className="fas fa-save" />
                {currentEditingId ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {detailsModalOpen && selectedEvent && (
        <div className="modal-overlay active" onClick={() => setDetailsModalOpen(false)}>
          <div className="modal event-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div
                className="event-type-badge"
                style={{
                  background: CONFIG.ENTRY_TYPES[selectedEvent.extendedProps?.entryType || 'interment']?.color || '#1E293B'
                }}
              />
              <h2 className="modal-title">{selectedEvent.title}</h2>
              <button className="modal-close" onClick={() => setDetailsModalOpen(false)}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <div className="detail-item">
                  <i className="fas fa-hashtag" />
                  <span className="detail-label">Reference:</span>
                  <span className="detail-value">{selectedEvent.extendedProps?.reference || selectedEvent.id}</span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <i className="fas fa-tag" />
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">
                    {CONFIG.ENTRY_TYPES[selectedEvent.extendedProps?.entryType]?.label || 'Interment'}
                  </span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <i className="fas fa-calendar-alt" />
                  <span className="detail-label">Arrival:</span>
                  <span className="detail-value">
                    {moment(selectedEvent.start).format('MMMM Do, YYYY [at] h:mm A')}
                  </span>
                </div>
              </div>
              {selectedEvent.end && (
                <div className="detail-row">
                  <div className="detail-item">
                    <i className="fas fa-calendar-check" />
                    <span className="detail-label">Departure:</span>
                    <span className="detail-value">
                      {moment(selectedEvent.end).format('MMMM Do, YYYY [at] h:mm A')}
                    </span>
                  </div>
                </div>
              )}
              <div className="detail-row">
                <div className="detail-item">
                  <i className="fas fa-map-marker-alt" />
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{selectedEvent.extendedProps?.location || 'Not specified'}</span>
                </div>
              </div>
              {selectedEvent.extendedProps?.description && (
                <div className="detail-row">
                  <div className="detail-item">
                    <i className="fas fa-align-left" />
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{selectedEvent.extendedProps.description}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-danger" onClick={handleDeleteEntry}>
                <i className="fas fa-trash" />
                Delete
              </button>
              <button type="button" className="btn btn-primary" onClick={handleEditEntry}>
                <i className="fas fa-edit" />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsModalOpen && (
        <div className="modal-overlay active" onClick={() => setSettingsModalOpen(false)}>
          <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Settings</h2>
              <button className="modal-close" onClick={() => setSettingsModalOpen(false)}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="modal-body">
              <div className="settings-section">
                <h4>Display Preferences</h4>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Default View</span>
                    <span className="setting-desc">Choose your preferred calendar view</span>
                  </div>
                  <select
                    className="form-control setting-select"
                    value={settings.defaultView}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultView: e.target.value }))}
                  >
                    <option value="dayGridMonth">Month</option>
                    <option value="dayGridWeek">Week</option>
                    <option value="dayGridDay">Day</option>
                    <option value="listWeek">List</option>
                  </select>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Show Weekends</span>
                    <span className="setting-desc">Display Saturday and Sunday</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.showWeekends}
                      onChange={(e) => setSettings(prev => ({ ...prev, showWeekends: e.target.checked }))}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">24-Hour Time Format</span>
                    <span className="setting-desc">Use 24-hour clock instead of AM/PM</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.timeFormat24}
                      onChange={(e) => setSettings(prev => ({ ...prev, timeFormat24: e.target.checked }))}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h4>Notifications</h4>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Daily Reminders</span>
                    <span className="setting-desc">Get notified of today's entries</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.dailyReminders}
                      onChange={(e) => setSettings(prev => ({ ...prev, dailyReminders: e.target.checked }))}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSettingsModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveSettings}>
                <i className="fas fa-check" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
