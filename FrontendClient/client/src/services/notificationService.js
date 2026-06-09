import { io } from 'socket.io-client';

// Socket.io Configuration
const SOCKET_URL =  'http://localhost:5000';

class NotificationService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Initialize socket connection
  connect(userId = null) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection-status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection-status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Notification events
    this.socket.on('notification', (data) => {
      this.handleNotification(data);
    });

    this.socket.on('document-updated', (data) => {
      this.handleNotification({
        type: 'document-update',
        title: 'Document Updated',
        message: data.message,
        data: data
      });
    });

    this.socket.on('payment-received', (data) => {
      this.handleNotification({
        type: 'payment',
        title: 'Payment Received',
        message: `New payment: ${data.amount}`,
        data: data
      });
    });

    this.socket.on('deceased-updated', (data) => {
      this.handleNotification({
        type: 'deceased-update',
        title: 'Record Updated',
        message: data.message,
        data: data
      });
    });

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Handle incoming notifications
  handleNotification(data) {
    // Store notification
    this.storeNotification(data);
    
    // Emit to listeners
    this.emit('notification', data);
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      this.showBrowserNotification(data);
    }
  }

  // Store notification in localStorage
  storeNotification(data) {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      notifications.unshift({
        ...data,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false
      });
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(50);
      }
      
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  // Show browser notification
  showBrowserNotification(data) {
    try {
      new Notification(data.title, {
        body: data.message,
        icon: '/notification-icon.png',
        tag: data.type,
        requireInteraction: false
      });
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Also listen on socket if applicable
    if (this.socket && ['notification', 'document-updated', 'payment-received', 'deceased-updated'].includes(event)) {
      this.socket.on(event, callback);
    }
  }

  // Unsubscribe from events
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
    
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Join a room
  joinRoom(room) {
    if (this.socket?.connected) {
      this.socket.emit('join-room', room);
    }
  }

  // Leave a room
  leaveRoom(room) {
    if (this.socket?.connected) {
      this.socket.emit('leave-room', room);
    }
  }

  // Send notification to other users
  sendNotification(type, data) {
    if (this.socket?.connected) {
      this.socket.emit('notification', { type, ...data });
    }
  }

  // Get stored notifications
  getNotifications(limit = 20) {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      return notifications.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  // Mark notification as read
  markAsRead(notificationId) {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        localStorage.setItem('notifications', JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      notifications.forEach(n => n.read = true);
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  // Get unread count
  getUnreadCount() {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      return 0;
    }
  }

  // Clear all notifications
  clearAll() {
    localStorage.removeItem('notifications');
    this.emit('notifications-cleared');
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Custom hook for React components
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize notifications
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());

    // Subscribe to events
    const handleNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(notificationService.getUnreadCount());
    };

    const handleConnectionStatus = (data) => {
      setIsConnected(data.connected);
    };

    notificationService.on('notification', handleNotification);
    notificationService.on('connection-status', handleConnectionStatus);

    return () => {
      notificationService.off('notification', handleNotification);
      notificationService.off('connection-status', handleConnectionStatus);
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead: (id) => {
      notificationService.markAsRead(id);
      setUnreadCount(notificationService.getUnreadCount());
      setNotifications(notificationService.getNotifications());
    },
    markAllAsRead: () => {
      notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    },
    clearAll: () => {
      notificationService.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    }
  };
};

export default notificationService;