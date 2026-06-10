// ============================================
// Rest Point Calendar Manager - JavaScript
// ============================================

// Entry type colors mapping
const TypeColors = {
    interment: '#2D3748',
    exhumation: '#ED8936',
    memorial: '#805AD5',
    maintenance: '#4299E1'
};

// Entry type labels
const TypeLabels = {
    interment: 'Interment',
    exhumation: 'Exhumation',
    memorial: 'Memorial Service',
    maintenance: 'Maintenance'
};

// Event storage
let events = [];
let currentEditingEvent = null;

$(document).ready(function() {
    // Initialize the calendar
    initializeCalendar();
    
    // Initialize date/time pickers
    initializePickers();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load sample events
    loadSampleEvents();
    
    // Update calendar title
    updateCalendarTitle();
    
    // Setup mobile navigation
    setupMobileNav();
});

// ============================================
// Calendar Initialization
// ============================================
function initializeCalendar() {
    $('#calendar').fullCalendar({
        header: {
            left: '',
            center: '',
            right: ''
        },
        defaultDate: moment().format('YYYY-MM-DD'),
        defaultView: 'agendaWeek',
        navLinks: true,
        editable: true,
        eventLimit: true,
        selectable: true,
        selectHelper: true,
        height: '100%',
        contentHeight: '100%',
        allDaySlot: true,
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00',
        firstHour: 8,
        minTime: '06:00:00',
        maxTime: '22:00:00',
        nowIndicator: true,
        businessHours: {
            start: '08:00',
            end: '18:00',
            dow: [1, 2, 3, 4, 5, 6]
        },
        
        // Event rendering
        eventRender: function(event, element) {
            element.attr('data-event-id', event._id);
            
            // Add tooltip with full details
            let tooltip = event.title;
            tooltip += '\n' + moment(event.start).format('MMM Do, h:mm A');
            if (event.end) {
                tooltip += ' - ' + moment(event.end).format('h:mm A');
            }
            if (event.extendedProps.location) {
                tooltip += '\n📍 ' + event.extendedProps.location;
            }
            element.attr('title', tooltip);
        },
        
        // Day click handler
        dayClick: function(date, jsEvent, view) {
            openCreateEventModal(date);
        },
        
        // Event click handler
        eventClick: function(calEvent, jsEvent, view) {
            openEventDetailsModal(calEvent);
        },
        
        // Event drop handler (drag and drop)
        eventDrop: function(event, delta, revertFunc) {
            updateEventInStorage(event);
            showToast('Entry moved successfully', 'success');
        },
        
        // Event resize handler
        eventResize: function(event, delta, revertFunc) {
            updateEventInStorage(event);
            showToast('Entry duration updated', 'success');
        },
        
        // View display
        viewRender: function(view, element) {
            updateCalendarTitle();
        },
        
        // Window resize
        windowResize: function(view) {
            $('#calendar').fullCalendar('option', 'height', $('#calendar').parent().height());
        },
        
        // Load events
        events: function(start, end, timezone, callback) {
            const filteredEvents = events.map(event => ({
                ...event,
                className: event.entryType || 'interment'
            }));
            callback(filteredEvents);
        }
    });
}

// ============================================
// Date/Time Pickers Initialization
// ============================================
function initializePickers() {
    // Time pickers
    $('#startTime, #endTime').timepicker({
        'timeFormat': 'h:mm a',
        'autoclose': true,
        'scrollDefault': 'now',
        'step': 30
    });
    
    // Date pickers
    $('#startDate, #endDate').pickadate({
        format: 'mmm dd, yyyy',
        today: '',
        clear: '',
        close: '',
        container: 'body'
    });
    
    // Time change handler - auto-update end time
    $('#startTime').on('changeTime', function() {
        const startTime = $(this).val();
        if (startTime) {
            const endTime = incrementTime(startTime, 30);
            $('#endTime').val(endTime);
        }
    });
    
    // Date change handler - sync end date with start date
    $('#startDate').on('change', function() {
        const startDate = $(this).val();
        if (startDate) {
            $('#endDate').val(startDate);
        }
    });
}

// ============================================
// Event Listeners Setup
// ============================================
function setupEventListeners() {
    // Navigation buttons
    $('#prevBtn').click(function() {
        $('#calendar').fullCalendar('prev');
    });
    
    $('#nextBtn').click(function() {
        $('#calendar').fullCalendar('next');
    });
    
    $('#todayBtn').click(function() {
        $('#calendar').fullCalendar('today');
    });
    
    // View switcher
    $('.view-btn').click(function() {
        const view = $(this).data('view');
        $('#calendar').fullCalendar('changeView', view);
        
        $('.view-btn').removeClass('active');
        $(this).addClass('active');
    });
    
    // Add event button
    $('#addEventBtn').click(function() {
        openCreateEventModal();
    });
    
    // Modal controls
    $('#closeModal').click(closeEventModal);
    $('#cancelBtn').click(closeEventModal);
    $('#saveEventBtn').click(saveEvent);
    
    $('#closeDetailsModal').click(closeDetailsModal);
    $('#deleteEventBtn').click(deleteEvent);
    $('#editEventBtn').click(editEvent);
    
    // Close modal on overlay click
    $('.modal-overlay').click(function(e) {
        if (e.target === this) {
            closeEventModal();
            closeDetailsModal();
        }
    });
    
    // Close modal on Escape key
    $(document).keydown(function(e) {
        if (e.key === 'Escape') {
            closeEventModal();
            closeDetailsModal();
        }
    });
}

// ============================================
// Mobile Navigation
// ============================================
function setupMobileNav() {
    $('.nav-item').click(function() {
        const action = $(this).data('action');
        
        $('.nav-item').removeClass('active');
        $(this).addClass('active');
        
        switch(action) {
            case 'calendar':
                // Already on calendar view
                break;
            case 'add':
                openCreateEventModal();
                break;
            case 'list':
                $('#calendar').fullCalendar('changeView', 'listWeek');
                $('.view-btn').removeClass('active');
                $('.view-btn[data-view="listWeek"]').addClass('active');
                break;
            case 'settings':
                showToast('Settings coming soon', 'info');
                break;
        }
    });
}

// ============================================
// Modal Functions
// ============================================
function openCreateEventModal(date) {
    currentEditingEvent = null;
    $('#modalTitle').text('New Rest Point Entry');
    $('#saveEventBtn').html('<i class="fas fa-save"></i> Save Entry');
    $('#eventForm')[0].reset();
    
    // Set default entry type
    $('input[name="eventType"][value="interment"]').prop('checked', true);
    
    if (date) {
        const formattedDate = date.format('MMM DD, YYYY');
        const formattedTime = date.format('h:mm a');
        const endTime = incrementTime(formattedTime, 30);
        
        $('#startDate').val(formattedDate);
        $('#startTime').val(formattedTime);
        $('#endDate').val(formattedDate);
        $('#endTime').val(endTime);
    } else {
        const today = moment();
        $('#startDate').val(today.format('MMM DD, YYYY'));
        $('#startTime').val(moment().startOf('hour').add(1, 'hour').format('h:mm a'));
        $('#endDate').val(today.format('MMM DD, YYYY'));
        $('#endTime').val(moment().startOf('hour').add(2, 'hour').format('h:mm a'));
    }
    
    $('#eventModal').addClass('active');
    
    // Focus on title input
    setTimeout(() => $('#eventTitle').focus(), 300);
}

function closeEventModal() {
    $('#eventModal').removeClass('active');
    $('#eventForm')[0].reset();
    currentEditingEvent = null;
}

function openEventDetailsModal(event) {
    currentEditingEvent = event;
    
    const type = event.entryType || 'interment';
    const color = TypeColors[type];
    
    $('#eventTypeBadge').css('background', color);
    $('#eventDetailsTitle').text(event.title);
    
    // Reference number
    const ref = event.extendedProps.reference || event._id.substring(0, 8).toUpperCase();
    $('#eventDetailsRef').text('REF-' + ref);
    
    const startDate = moment(event.start);
    const endDate = event.end ? moment(event.end) : null;
    
    $('#eventDetailsDate').text(startDate.format('MMMM Do, YYYY [at] h:mm A'));
    
    if (endDate) {
        $('#eventDetailsDeparture').text(endDate.format('MMMM Do, YYYY [at] h:mm A'));
        $('#departureRow').show();
    } else {
        $('#departureRow').hide();
    }
    
    // Location
    if (event.extendedProps.location) {
        $('#eventDetailsLocation').text(event.extendedProps.location);
    } else {
        $('#eventDetailsLocation').text('Not specified');
    }
    
    // Notes
    if (event.extendedProps.notes) {
        $('#eventDetailsNotes').text(event.extendedProps.notes);
        $('#notesRow').show();
    } else {
        $('#notesRow').hide();
    }
    
    $('#eventDetailsModal').addClass('active');
}

function closeDetailsModal() {
    $('#eventDetailsModal').removeClass('active');
    currentEditingEvent = null;
}

// ============================================
// Event CRUD Operations
// ============================================
function saveEvent() {
    const title = $('#eventTitle').val().trim();
    const reference = $('#eventReference').val().trim();
    const startDate = $('#startDate').val();
    const startTime = $('#startTime').val();
    const endDate = $('#endDate').val();
    const endTime = $('#endTime').val();
    const location = $('#eventLocation').val().trim();
    const description = $('#eventDescription').val().trim();
    const entryType = $('input[name="eventType"]:checked').val();
    
    // Validation
    if (!title) {
        showToast('Please enter the full name', 'error');
        $('#eventTitle').focus();
        return;
    }
    
    if (!startDate || !startTime) {
        showToast('Please select arrival date and time', 'error');
        return;
    }
    
    // Parse dates
    const startDateTime = moment(startDate + ' ' + startTime, 'MMM DD, YYYY h:mm a');
    const endDateTime = endDate && endTime ? 
        moment(endDate + ' ' + endTime, 'MMM DD, YYYY h:mm a') : null;
    
    if (!startDateTime.isValid()) {
        showToast('Invalid date/time format', 'error');
        return;
    }
    
    if (endDateTime && endDateTime.isBefore(startDateTime)) {
        showToast('Departure must be after arrival', 'error');
        return;
    }
    
    // Generate reference if not provided
    const ref = reference || generateReference();
    
    const eventData = {
        id: currentEditingEvent ? currentEditingEvent._id : generateId(),
        title: title,
        start: startDateTime.toISOString(),
        end: endDateTime ? endDateTime.toISOString() : null,
        entryType: entryType,
        extendedProps: {
            reference: ref,
            location: location,
            notes: description
        }
    };
    
    if (currentEditingEvent) {
        // Update existing event
        updateEventInStorage(eventData);
        showToast('Entry updated successfully', 'success');
    } else {
        // Create new event
        events.push(eventData);
        showToast('New entry created successfully', 'success');
    }
    
    // Refresh calendar
    $('#calendar').fullCalendar('refetchEvents');
    closeEventModal();
}

function deleteEvent() {
    if (!currentEditingEvent) return;
    
    if (confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
        events = events.filter(e => e.id !== currentEditingEvent._id);
        $('#calendar').fullCalendar('removeEvents', currentEditingEvent._id);
        showToast('Entry deleted successfully', 'success');
        closeDetailsModal();
    }
}

function editEvent() {
    if (!currentEditingEvent) return;
    
    closeDetailsModal();
    
    // Populate form with event data
    const start = moment(currentEditingEvent.start);
    const end = currentEditingEvent.end ? moment(currentEditingEvent.end) : null;
    
    $('#modalTitle').text('Edit Entry');
    $('#saveEventBtn').html('<i class="fas fa-check"></i> Update Entry');
    
    $('#eventTitle').val(currentEditingEvent.title);
    $('#eventReference').val(currentEditingEvent.extendedProps.reference || '');
    $('#startDate').val(start.format('MMM DD, YYYY'));
    $('#startTime').val(start.format('h:mm a'));
    
    if (end) {
        $('#endDate').val(end.format('MMM DD, YYYY'));
        $('#endTime').val(end.format('h:mm a'));
    } else {
        $('#endDate').val('');
        $('#endTime').val('');
    }
    
    $('#eventLocation').val(currentEditingEvent.extendedProps.location || '');
    $('#eventDescription').val(currentEditingEvent.extendedProps.notes || '');
    
    // Set entry type
    $(`input[name="eventType"][value="${currentEditingEvent.entryType || 'interment'}"]`).prop('checked', true);
    
    $('#eventModal').addClass('active');
}

function updateEventInStorage(eventData) {
    const index = events.findIndex(e => e.id === eventData._id || e.id === eventData.id);
    if (index !== -1) {
        events[index] = {
            id: eventData._id || eventData.id,
            title: eventData.title,
            start: eventData.start,
            end: eventData.end,
            entryType: eventData.entryType,
            extendedProps: eventData.extendedProps
        };
    }
}

// ============================================
// Utility Functions
// ============================================
function incrementTime(time, minutes) {
    return moment(time, 'h:mm a')
        .add(minutes, 'minutes')
        .format('h:mm a');
}

function generateId() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateReference() {
    const date = moment().format('YYYYMMDD');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return date + '-' + random;
}

function updateCalendarTitle() {
    const view = $('#calendar').fullCalendar('getView');
    const title = view.title;
    $('#calendarTitle').text(title);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Toast Notifications
// ============================================
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
// Sample Events
// ============================================
function loadSampleEvents() {
    const today = moment();
    
    const sampleEvents = [
        {
            id: generateId(),
            title: 'John Michael Smith',
            start: today.clone().hour(9).minute(0).toISOString(),
            end: today.clone().hour(11).minute(0).toISOString(),
            entryType: 'interment',
            extendedProps: {
                reference: generateReference(),
                location: 'Section A, Plot 42',
                notes: 'Family requests white flowers only'
            }
        },
        {
            id: generateId(),
            title: 'Memorial Service - Mary Johnson',
            start: today.clone().hour(14).minute(0).toISOString(),
            end: today.clone().hour(15).minute(30).toISOString(),
            entryType: 'memorial',
            extendedProps: {
                reference: generateReference(),
                location: 'Chapel',
                notes: 'Reception to follow in community hall'
            }
        },
        {
            id: generateId(),
            title: 'Grounds Maintenance',
            start: today.clone().add(1, 'day').hour(7).minute(0).toISOString(),
            end: today.clone().add(1, 'day').hour(12).minute(0).toISOString(),
            entryType: 'maintenance',
            extendedProps: {
                reference: generateReference(),
                location: 'North Section',
                notes: 'Lawn mowing and hedge trimming'
            }
        },
        {
            id: generateId(),
            title: 'Robert Williams',
            start: today.clone().add(1, 'day').hour(10).minute(0).toISOString(),
            end: today.clone().add(1, 'day').hour(11).minute(30).toISOString(),
            entryType: 'interment',
            extendedProps: {
                reference: generateReference(),
                location: 'Section C, Plot 18',
                notes: 'Military honors requested'
            }
        },
        {
            id: generateId(),
            title: 'Exhumation - Elizabeth Davis',
            start: today.clone().add(2, 'day').hour(8).minute(0).toISOString(),
            end: today.clone().add(2, 'day').hour(12).minute(0).toISOString(),
            entryType: 'exhumation',
            extendedProps: {
                reference: generateReference(),
                location: 'Section B, Plot 25',
                notes: 'Family present for reinterment at different location'
            }
        },
        {
            id: generateId(),
            title: 'Annual Remembrance Service',
            start: today.clone().add(3, 'day').hour(15).minute(0).toISOString(),
            end: today.clone().add(3, 'day').hour(17).minute(0).toISOString(),
            entryType: 'memorial',
            extendedProps: {
                reference: generateReference(),
                location: 'Main Chapel',
                notes: 'Open to all families. Refreshments provided.'
            }
        }
    ];
    
    events = sampleEvents;
    $('#calendar').fullCalendar('refetchEvents');
}

// ============================================
// Touch/Swipe Support for Mobile
// ============================================
let touchStartX = 0;
let touchEndX = 0;

$('#calendar').on('touchstart', function(e) {
    touchStartX = e.originalEvent.touches[0].clientX;
});

$('#calendar').on('touchend', function(e) {
    touchEndX = e.originalEvent.changedTouches[0].clientX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next
            $('#calendar').fullCalendar('next');
        } else {
            // Swipe right - prev
            $('#calendar').fullCalendar('prev');
        }
    }
}

// ============================================
// Add CSS for animations
// ============================================
const customStyles = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    /* Better touch targets for mobile */
    @media (max-width: 768px) {
        .nav-btn, .today-btn, .view-btn {
            min-height: 44px;
            min-width: 44px;
        }
        
        .form-control {
            min-height: 48px;
        }
        
        .radio-option {
            min-height: 48px;
        }
        
        .btn {
            min-height: 48px;
        }
    }
`;

$('<style>').text(customStyles).appendTo('head');