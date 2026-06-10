// ============================================
// Rest Point Calendar Manager - Complete Application
// With Backend-like Architecture, URL Routing, Data Persistence & Multi-Tenant Support
// ============================================

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
    STORAGE_KEY: 'restpoint_calendar_data',
    SETTINGS_KEY: 'restpoint_calendar_settings',
    TENANTS_KEY: 'restpoint_tenants',
    CURRENT_TENANT_KEY: 'restpoint_current_tenant',
    API_DELAY: 200
};

// ============================================
// BACKEND SERVICE (Simulated with localStorage)
// ============================================
class BackendService {
    constructor() {
        this.entries = [];
        this.settings = this.getDefaultSettings();
        this.listeners = [];
        this.loadFromStorage();
    }

    getDefaultSettings() {
        return {
            defaultView: 'agendaWeek',
            showWeekends: true,
            timeFormat24: false,
            dailyReminders: true
        };
    }

    loadFromStorage() {
        try {
            const storedData = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (storedData) {
                this.entries = JSON.parse(storedData);
            }
            const storedSettings = localStorage.getItem(CONFIG.SETTINGS_KEY);
            if (storedSettings) {
                this.settings = { ...this.getDefaultSettings(), ...JSON.parse(storedSettings) };
            }
        } catch (e) {
            console.error('Error loading from storage:', e);
            this.entries = [];
            this.settings = this.getDefaultSettings();
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.entries));
            localStorage.setItem(CONFIG.SETTINGS_KEY, JSON.stringify(this.settings));
        } catch (e) {
            console.error('Error saving to storage:', e);
        }
    }

    async delay() {
        return new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    }

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.entries));
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    async getEntries(filters = {}) {
        await this.delay();
        let filtered = [...this.entries];
        if (filters.types && filters.types.length > 0) {
            filtered = filtered.filter(e => filters.types.includes(e.entryType));
        }
        return filtered.sort((a, b) => new Date(a.start) - new Date(b.start));
    }

    async getEntry(id) {
        await this.delay();
        return this.entries.find(e => e.id === id);
    }

    async createEntry(data) {
        await this.delay();
        const entry = {
            id: this.generateId(),
            reference: data.reference || this.generateReference(),
            title: data.title,
            entryType: data.entryType || 'interment',
            start: data.start,
            end: data.end,
            location: data.location || '',
            description: data.description || '',
            status: data.status || 'pending',
            assignedTo: data.assignedTo || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.entries.push(entry);
        this.saveToStorage();
        this.notifyListeners();
        return entry;
    }

    async updateEntry(id, data) {
        await this.delay();
        const index = this.entries.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Entry not found');
        this.entries[index] = { ...this.entries[index], ...data, updatedAt: new Date().toISOString() };
        this.saveToStorage();
        this.notifyListeners();
        return this.entries[index];
    }

    async deleteEntry(id) {
        await this.delay();
        const index = this.entries.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Entry not found');
        this.entries.splice(index, 1);
        this.saveToStorage();
        this.notifyListeners();
        return true;
    }

    async clearAllEntries() {
        await this.delay();
        this.entries = [];
        this.saveToStorage();
        this.notifyListeners();
        return true;
    }

    async importEntries(newEntries) {
        await this.delay();
        newEntries.forEach(entry => {
            entry.id = this.generateId();
            entry.createdAt = new Date().toISOString();
            entry.updatedAt = new Date().toISOString();
            this.entries.push(entry);
        });
        this.saveToStorage();
        this.notifyListeners();
        return this.entries;
    }

    async getSettings() {
        await this.delay();
        return { ...this.settings };
    }

    async updateSettings(newSettings) {
        await this.delay();
        this.settings = { ...this.settings, ...newSettings };
        this.saveToStorage();
        return this.settings;
    }

    async resetSettings() {
        await this.delay();
        this.settings = this.getDefaultSettings();
        this.saveToStorage();
        return this.settings;
    }

    getStats() {
        const now = moment();
        const today = now.startOf('day');
        const weekStart = now.startOf('week');
        return {
            total: this.entries.length,
            today: this.entries.filter(e => moment(e.start).isSame(today, 'day')).length,
            thisWeek: this.entries.filter(e => moment(e.start).isSameOrAfter(weekStart)).length,
            byType: {
                interment: this.entries.filter(e => e.entryType === 'interment').length,
                exhumation: this.entries.filter(e => e.entryType === 'exhumation').length,
                memorial: this.entries.filter(e => e.entryType === 'memorial').length,
                maintenance: this.entries.filter(e => e.entryType === 'maintenance').length
            }
        };
    }

    generateId() {
        return 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateReference() {
        const date = moment().format('YYYYMMDD');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return 'REF-' + date + '-' + random;
    }

    exportData() {
        return JSON.stringify({ entries: this.entries, settings: this.settings }, null, 2);
    }
}

// ============================================
// URL ROUTER
// ============================================
class Router {
    constructor(onRouteChange) {
        this.onRouteChange = onRouteChange;
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('popstate', () => this.handleRoute());
        this.handleRoute();
    }

    handleRoute() {
        const params = this.getQueryParams();
        if (this.onRouteChange) {
            this.onRouteChange(params);
        }
    }

    getQueryParams() {
        const hash = window.location.hash;
        const queryIndex = hash.indexOf('?');
        if (queryIndex === -1) return {};
        
        const queryString = hash.substring(queryIndex + 1);
        const params = {};
        queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        return params;
    }

    navigate(params) {
        const queryString = Object.keys(params)
            .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
            .join('&');
        
        const newHash = queryString ? '?' + queryString : '';
        window.location.hash = newHash;
    }

    updateParams(newParams) {
        const currentParams = this.getQueryParams();
        const mergedParams = { ...currentParams, ...newParams };
        this.navigate(mergedParams);
    }
}

// ============================================
// APPLICATION CONTROLLER
// ============================================
class AppController {
    constructor() {
        this.backend = new BackendService();
        this.router = new Router((params) => this.handleRouteChange(params));
        this.currentFilters = ['interment', 'exhumation', 'memorial', 'maintenance'];
        this.currentEditingId = null;
        
        this.init();
    }

    async init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        // Load settings
        const settings = await this.backend.getSettings();
        this.applySettings(settings);

        // Initialize calendar
        this.initializeCalendar();
        
        // Initialize pickers
        this.initializePickers();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Subscribe to data changes
        this.backend.subscribe(() => this.refreshCalendar());
        
        // Load initial data based on URL
        this.handleRouteChange(this.router.getQueryParams());
        
        // Load sample data if empty
        if (this.backend.entries.length === 0) {
            this.loadSampleData();
        }
        
        // Update UI
        this.updateStats();
        this.updateUpcomingList();
        this.updateFilterCounts();
        
        console.log('Rest Point Calendar initialized');
    }

    applySettings(settings) {
        if (settings.defaultView) {
            $('#defaultView').val(settings.defaultView);
        }
        if (settings.showWeekends !== undefined) {
            $('#showWeekends').prop('checked', settings.showWeekends);
        }
        if (settings.timeFormat24 !== undefined) {
            $('#timeFormat24').prop('checked', settings.timeFormat24);
        }
        if (settings.dailyReminders !== undefined) {
            $('#dailyReminders').prop('checked', settings.dailyReminders);
        }
    }

    initializeCalendar() {
        const settings = this.backend.settings;
        
        $('#calendar').fullCalendar({
            header: { left: '', center: '', right: '' },
            defaultDate: moment().format('YYYY-MM-DD'),
            defaultView: settings.defaultView,
            navLinks: true,
            editable: true,
            eventLimit: true,
            selectable: true,
            selectHelper: true,
            height: '100%',
            contentHeight: '100%',
            allDaySlot: true,
            slotDuration: '00:30:00',
            slotLabelInterval: settings.timeFormat24 ? '02:00' : '01:00',
            slotLabelFormat: settings.timeFormat24 ? 'H:mm' : 'h(:mm)a',
            firstHour: 8,
            minTime: '06:00:00',
            maxTime: '22:00:00',
            nowIndicator: true,
            weekends: settings.showWeekends,
            businessHours: { start: '08:00', end: '18:00', dow: [1, 2, 3, 4, 5, 6] },
            
            eventRender: (event, element) => {
                element.attr('data-event-id', event._id);
                let tooltip = event.title + '\n' + moment(event.start).format('MMM Do, h:mm A');
                if (event.end) tooltip += ' - ' + moment(event.end).format('h:mm A');
                if (event.extendedProps.location) tooltip += '\n📍 ' + event.extendedProps.location;
                element.attr('title', tooltip);
            },
            
            dayClick: (date, jsEvent, view) => this.openCreateModal(date),
            eventClick: (calEvent, jsEvent, view) => this.openDetailsModal(calEvent),
            
            eventDrop: (event, delta, revertFunc) => {
                this.backend.updateEntry(event._id, {
                    start: event.start.toISOString(),
                    end: event.end ? event.end.toISOString() : null
                }).then(() => showToast('Entry moved successfully', 'success'));
            },
            
            eventResize: (event, delta, revertFunc) => {
                this.backend.updateEntry(event._id, {
                    end: event.end ? event.end.toISOString() : null
                }).then(() => showToast('Entry duration updated', 'success'));
            },
            
            viewRender: (view, element) => {
                $('#calendarTitle').text(view.title);
                this.router.updateParams({ view: view.name, date: view.intervalStart.format('YYYY-MM-DD') });
            },
            
            windowResize: (view) => {
                $('#calendar').fullCalendar('option', 'height', $('#calendar').parent().height());
            },
            
            events: (start, end, timezone, callback) => {
                this.backend.getEntries({ types: this.currentFilters }).then(entries => {
                    callback(entries.map(e => ({
                        ...e,
                        className: e.entryType
                    })));
                });
            }
        });
    }

    initializePickers() {
        $('#startTime, #endTime').timepicker({
            'timeFormat': $('#timeFormat24').is(':checked') ? 'H:i' : 'h:mm a',
            'autoclose': true,
            'scrollDefault': 'now',
            'step': 30
        });

        $('#startDate, #endDate').pickadate({
            format: 'mmm dd, yyyy',
            today: '',
            clear: '',
            close: '',
            container: 'body'
        });

        $('#startTime').on('changeTime', function() {
            const startTime = $(this).val();
            if (startTime) {
                const endTime = moment(startTime, $('#timeFormat24').is(':checked') ? 'H:i' : 'h:mm a')
                    .add(30, 'minutes')
                    .format($('#timeFormat24').is(':checked') ? 'H:i' : 'h:mm a');
                $('#endTime').val(endTime);
            }
        });

        $('#startDate').on('change', function() {
            const startDate = $(this).val();
            if (startDate) $('#endDate').val(startDate);
        });
    }

    setupEventListeners() {
        // Navigation
        $('#prevBtn').click(() => $('#calendar').fullCalendar('prev'));
        $('#nextBtn').click(() => $('#calendar').fullCalendar('next'));
        $('#todayBtn').click(() => $('#calendar').fullCalendar('today'));

        // View switcher
        $('.view-btn').click(function() {
            const view = $(this).data('view');
            $('#calendar').fullCalendar('changeView', view);
            $('.view-btn').removeClass('active');
            $(this).addClass('active');
        });

        // Add event button
        $('#addEventBtn').click(() => this.openCreateModal());

        // Sidebar toggle
        $('#menuToggle').click(() => $('#sidebar').addClass('open'));
        $('#sidebarClose').click(() => $('#sidebar').removeClass('open'));

        // Modal controls
        $('#closeModal').click(() => this.closeModal('eventModal'));
        $('#cancelBtn').click(() => this.closeModal('eventModal'));
        $('#saveEventBtn').click(() => this.saveEntry());
        $('#closeDetailsModal').click(() => this.closeModal('eventDetailsModal'));
        $('#deleteEventBtn').click(() => this.deleteEntry());
        $('#editEventBtn').click(() => this.editEntry());

        // Settings
        $('#saveSettingsBtn').click(() => this.saveSettings());
        $('#resetSettingsBtn').click(() => this.resetSettings());
        $('#exportDataBtn').click(() => this.exportData());
        $('#importDataBtn').click(() => $('#importFile').click());
        $('#importFile').change((e) => this.importData(e));
        $('#clearDataBtn').click(() => this.clearAllData());

        // Mobile nav
        $('.nav-item').click(function() {
            const action = $(this).data('action');
            $('.nav-item').removeClass('active');
            $(this).addClass('active');
            
            if (action === 'add') this.openCreateModal();
            else if (action === 'list') {
                $('#calendar').fullCalendar('changeView', 'listWeek');
                $('.view-btn').removeClass('active');
                $('[data-view="listWeek"]').addClass('active');
            }
            else if (action === 'settings') $('#settingsModal').addClass('active');
        }.bind(this));

        // Filter checkboxes
        $('.filter-item input[type="checkbox"]').change(function() {
            const filter = $(this).data('filter');
            if ($(this).is(':checked')) {
                if (!this.currentFilters.includes(filter)) this.currentFilters.push(filter);
            } else {
                this.currentFilters = this.currentFilters.filter(f => f !== filter);
            }
            this.router.updateParams({ filters: this.currentFilters.join(',') });
            this.refreshCalendar();
            this.updateFilterCounts();
        }.bind(this));

        // Close modals on overlay click
        $('.modal-overlay').click(function(e) {
            if (e.target === this) {
                $(this).removeClass('active');
            }
        });

        // Close on Escape
        $(document).keydown(e => {
            if (e.key === 'Escape') {
                $('.modal-overlay').removeClass('active');
            }
        });

        // Touch/swipe support
        let touchStartX = 0;
        $('#calendar').on('touchstart', e => touchStartX = e.originalEvent.touches[0].clientX);
        $('#calendar').on('touchend', e => {
            const diff = touchStartX - e.originalEvent.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                diff > 0 ? $('#calendar').fullCalendar('next') : $('#calendar').fullCalendar('prev');
            }
        });
    }

    handleRouteChange(params) {
        // Apply filters from URL
        if (params.filters) {
            this.currentFilters = params.filters.split(',');
            $('.filter-item input').each(function() {
                const filter = $(this).data('filter');
                $(this).prop('checked', this.currentFilters.includes(filter));
            });
        }

        // Apply view from URL
        if (params.view) {
            $('#calendar').fullCalendar('changeView', params.view);
            $('.view-btn').removeClass('active');
            $('.view-btn[data-view="' + params.view + '"]').addClass('active');
        }

        // Apply date from URL
        if (params.date) {
            $('#calendar').fullCalendar('gotoDate', params.date);
        }

        // Open entry if ID specified
        if (params.entryId) {
            this.backend.getEntry(params.entryId).then(entry => {
                if (entry) this.openDetailsModal(entry);
            });
        }

        this.refreshCalendar();
    }

    refreshCalendar() {
        $('#calendar').fullCalendar('refetchEvents');
        this.updateStats();
        this.updateUpcomingList();
        this.updateFilterCounts();
    }

    updateStats() {
        const stats = this.backend.getStats();
        $('#totalEntries').text(stats.total);
        $('#todayEntries').text(stats.today);
        $('#weekEntries').text(stats.thisWeek);
        $('#intermentCount').text(stats.byType.interment);
        $('#exhumationCount').text(stats.byType.exhumation);
        $('#memorialCount').text(stats.byType.memorial);
        $('#maintenanceCount').text(stats.byType.maintenance);
    }

    updateUpcomingList() {
        const now = moment();
        this.backend.getEntries({ types: this.currentFilters }).then(entries => {
            const upcoming = entries
                .filter(e => moment(e.start).isAfter(now))
                .slice(0, 5);
            
            const $list = $('#upcomingList');
            $list.empty();
            
            if (upcoming.length === 0) {
                $list.html('<div class="upcoming-item"><div class="event-title">No upcoming entries</div></div>');
                return;
            }
            
            upcoming.forEach(entry => {
                const start = moment(entry.start);
                const $item = $(`
                    <div class="upcoming-item" data-entry-id="${entry.id}">
                        <div class="event-title">${escapeHtml(entry.title)}</div>
                        <div class="event-time">${start.format('MMM Do, h:mm A')}</div>
                    </div>
                `);
                $item.click(() => this.openDetailsModal(entry));
                $list.append($item);
            });
        });
    }

    updateFilterCounts() {
        const stats = this.backend.getStats();
        $('#intermentCount').text(stats.byType.interment);
        $('#exhumationCount').text(stats.byType.exhumation);
        $('#memorialCount').text(stats.byType.memorial);
        $('#maintenanceCount').text(stats.byType.maintenance);
    }

    openCreateModal(date) {
        this.currentEditingId = null;
        $('#modalTitle').text('New Rest Point Entry');
        $('#saveEventBtn').html('<i class="fas fa-save"></i> Save Entry');
        $('#eventForm')[0].reset();
        
        if (date) {
            const formattedDate = date.format('MMM DD, YYYY');
            const formattedTime = date.format($('#timeFormat24').is(':checked') ? 'H:mm' : 'h:mm a');
            $('#startDate').val(formattedDate);
            $('#startTime').val(formattedTime);
            $('#endDate').val(formattedDate);
            
            const endTime = moment(date).add(30, 'minutes').format($('#timeFormat24').is(':checked') ? 'H:i' : 'h:mm a');
            $('#endTime').val(endTime);
        }
        
        $('#eventModal').addClass('active');
        setTimeout(() => $('#eventTitle').focus(), 300);
    }

    openDetailsModal(event) {
        this.currentEditingId = event._id;
        
        const typeLabels = {
            interment: 'Interment',
            exhumation: 'Exhumation',
            memorial: 'Memorial Service',
            maintenance: 'Maintenance'
        };
        
        $('#eventTypeBadge').css('background', CONFIG.COLORS[event.entryType === 'interment' ? 'primaryDark' : 
            event.entryType === 'exhumation' ? 'warningYellow' :
            event.entryType === 'memorial' ? 'accentBlue' : 'infoBlue']);
        $('#eventDetailsTitle').text(event.title);
        $('#eventDetailsRef').text(event.extendedProps.reference || event.id);
        $('#eventDetailsType').text(typeLabels[event.entryType] || event.entryType);
        
        const start = moment(event.start);
        const end = event.end ? moment(event.end) : null;
        
        $('#eventDetailsDate').text(start.format('MMMM Do, YYYY [at] h:mm A'));
        
        if (end) {
            $('#eventDetailsDeparture').text(end.format('MMMM Do, YYYY [at] h:mm A'));
            $('#departureRow').show();
        } else {
            $('#departureRow').hide();
        }
        
        if (event.extendedProps.location) {
            $('#eventDetailsLocation').text(event.extendedProps.location);
        } else {
            $('#eventDetailsLocation').text('Not specified');
        }
        
        if (event.extendedProps.notes) {
            $('#eventDetailsNotes').text(event.extendedProps.notes);
            $('#notesRow').show();
        } else {
            $('#notesRow').hide();
        }
        
        $('#eventDetailsModal').addClass('active');
        
        // Update URL
        this.router.updateParams({ entryId: event._id });
    }

    closeModal(modalId) {
        $('#' + modalId).removeClass('active');
        this.router.updateParams({ entryId: '' });
    }

    async saveEntry() {
        const title = $('#eventTitle').val().trim();
        const reference = $('#eventReference').val().trim();
        const entryType = $('#eventType').val();
        const startDate = $('#startDate').val();
        const startTime = $('#startTime').val();
        const endDate = $('#endDate').val();
        const endTime = $('#endTime').val();
        const location = $('#eventLocation').val().trim();
        const description = $('#eventDescription').val().trim();
        const status = $('#eventStatus').val();
        const assignedTo = $('#eventAssigned').val().trim();

        if (!title) {
            showToast('Please enter the full name', 'error');
            return;
        }
        if (!startDate || !startTime) {
            showToast('Please select arrival date and time', 'error');
            return;
        }

        const timeFormat = $('#timeFormat24').is(':checked') ? 'MMM DD, YYYY H:mm' : 'MMM DD, YYYY h:mm a';
        const startDateTime = moment(startDate + ' ' + startTime, timeFormat);
        const endDateTime = endDate && endTime ? moment(endDate + ' ' + endTime, timeFormat) : null;

        if (!startDateTime.isValid()) {
            showToast('Invalid date/time format', 'error');
            return;
        }
        if (endDateTime && endDateTime.isBefore(startDateTime)) {
            showToast('Departure must be after arrival', 'error');
            return;
        }

        const data = {
            title,
            entryType,
            start: startDateTime.toISOString(),
            end: endDateTime ? endDateTime.toISOString() : null,
            location,
            description,
            reference: reference || undefined,
            status,
            assignedTo
        };

        try {
            if (this.currentEditingId) {
                await this.backend.updateEntry(this.currentEditingId, data);
                showToast('Entry updated successfully', 'success');
            } else {
                await this.backend.createEntry(data);
                showToast('New entry created successfully', 'success');
            }
            this.closeModal('eventModal');
            this.refreshCalendar();
        } catch (error) {
            showToast('Error saving entry: ' + error.message, 'error');
        }
    }

    async deleteEntry() {
        if (!this.currentEditingId) return;
        
        if (confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            try {
                await this.backend.deleteEntry(this.currentEditingId);
                showToast('Entry deleted successfully', 'success');
                this.closeModal('eventDetailsModal');
            } catch (error) {
                showToast('Error deleting entry: ' + error.message, 'error');
            }
        }
    }

    editEntry() {
        if (!this.currentEditingId) return;
        
        this.backend.getEntry(this.currentEditingId).then(entry => {
            this.closeModal('eventDetailsModal');
            
            const start = moment(entry.start);
            const end = entry.end ? moment(entry.end) : null;
            const timeFormat = $('#timeFormat24').is(':checked') ? 'H:mm' : 'h:mm a';
            
            $('#modalTitle').text('Edit Entry');
            $('#saveEventBtn').html('<i class="fas fa-check"></i> Update Entry');
            $('#eventTitle').val(entry.title);
            $('#eventReference').val(entry.extendedProps.reference || '');
            $('#eventType').val(entry.entryType);
            $('#startDate').val(start.format('MMM DD, YYYY'));
            $('#startTime').val(start.format(timeFormat));
            $('#endDate').val(end ? end.format('MMM DD, YYYY') : '');
            $('#endTime').val(end ? end.format(timeFormat) : '');
            $('#eventLocation').val(entry.extendedProps.location || '');
            $('#eventDescription').val(entry.extendedProps.notes || '');
            
            this.currentEditingId = entry._id;
            $('#eventModal').addClass('active');
        });
    }

    async saveSettings() {
        const settings = {
            defaultView: $('#defaultView').val(),
            showWeekends: $('#showWeekends').is(':checked'),
            timeFormat24: $('#timeFormat24').is(':checked'),
            dailyReminders: $('#dailyReminders').is(':checked')
        };
        
        try {
            await this.backend.updateSettings(settings);
            showToast('Settings saved successfully', 'success');
            this.closeModal('settingsModal');
            
            // Reinitialize calendar with new settings
            $('#calendar').fullCalendar('destroy');
            this.initializeCalendar();
            this.initializePickers();
        } catch (error) {
            showToast('Error saving settings: ' + error.message, 'error');
        }
    }

    async resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            const settings = await this.backend.resetSettings();
            this.applySettings(settings);
            showToast('Settings reset to defaults', 'success');
        }
    }

    exportData() {
        const data = this.backend.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'restpoint-calendar-' + moment().format('YYYY-MM-DD') + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Data exported successfully', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.entries && Array.isArray(data.entries)) {
                    await this.backend.importEntries(data.entries);
                    showToast('Data imported successfully', 'success');
                } else {
                    showToast('Invalid data format', 'error');
                }
            } catch (error) {
                showToast('Error importing data: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    async clearAllData() {
        if (confirm('Are you sure you want to delete ALL entries? This cannot be undone.')) {
            if (confirm('This is a destructive action. Are you absolutely sure?')) {
                await this.backend.clearAllEntries();
                showToast('All data cleared', 'success');
            }
        }
    }

    loadSampleData() {
        const today = moment();
        const samples = [
            // 3 Interments
            {
                title: 'John Michael Smith',
                entryType: 'interment',
                start: today.clone().hour(9).minute(0).toISOString(),
                end: today.clone().hour(11).minute(0).toISOString(),
                location: 'Section A, Plot 42',
                description: 'Family requests white flowers only',
                status: 'completed'
            },
            {
                title: 'Robert Williams',
                entryType: 'interment',
                start: today.clone().add(1, 'day').hour(10).minute(0).toISOString(),
                end: today.clone().add(1, 'day').hour(11).minute(30).toISOString(),
                location: 'Section C, Plot 18',
                description: 'Military honors requested',
                status: 'pending'
            },
            {
                title: 'Sarah Elizabeth Brown',
                entryType: 'interment',
                start: today.clone().add(2, 'day').hour(14).minute(0).toISOString(),
                end: today.clone().add(2, 'day').hour(15).minute(30).toISOString(),
                location: 'Section B, Plot 7',
                description: 'Private family service',
                status: 'pending'
            },
            // 2 Exhumations
            {
                title: 'Exhumation - Elizabeth Davis',
                entryType: 'exhumation',
                start: today.clone().add(2, 'day').hour(8).minute(0).toISOString(),
                end: today.clone().add(2, 'day').hour(12).minute(0).toISOString(),
                location: 'Section B, Plot 25',
                description: 'Family present for reinterment',
                status: 'in-progress'
            },
            {
                title: 'Exhumation - James Wilson',
                entryType: 'exhumation',
                start: today.clone().add(3, 'day').hour(9).minute(0).toISOString(),
                end: today.clone().add(3, 'day').hour(13).minute(0).toISOString(),
                location: 'Section A, Plot 15',
                description: 'Reinterment at national cemetery',
                status: 'pending'
            },
            // 1 Memorial Service
            {
                title: 'Memorial Service - Mary Johnson',
                entryType: 'memorial',
                start: today.clone().hour(14).minute(0).toISOString(),
                end: today.clone().hour(15).minute(30).toISOString(),
                location: 'Chapel',
                description: 'Reception to follow in community hall',
                status: 'completed'
            },
            // 1 Maintenance
            {
                title: 'Grounds Maintenance',
                entryType: 'maintenance',
                start: today.clone().add(1, 'day').hour(7).minute(0).toISOString(),
                end: today.clone().add(1, 'day').hour(12).minute(0).toISOString(),
                location: 'North Section',
                description: 'Lawn mowing and hedge trimming',
                status: 'pending',
                assignedTo: 'John Smith'
            }
        ];
        
        samples.forEach(sample => this.backend.createEntry(sample));
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    const $toast = $(`
        <div class="toast ${type}">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `);
    
    $('#toastContainer').append($toast);
    
    setTimeout(() => {
        $toast.css('animation', 'slideOutRight 0.3s ease');
        setTimeout(() => $toast.remove(), 300);
    }, 3000);
}

// ============================================
// INITIALIZE APPLICATION
// ============================================
$(document).ready(function() {
    const app = new AppController();
    
    // Add custom styles for animations
    $('<style>').text(`
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @media (max-width: 768px) {
            .nav-btn, .today-btn, .view-btn, .form-control, .radio-option, .btn {
                min-height: 48px;
            }
        }
    `).appendTo('head');
});
