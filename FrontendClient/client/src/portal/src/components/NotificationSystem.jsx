import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Phone,
  Users,
  Package,
  ChevronDown,
  Settings,
  Trash2,
} from 'lucide-react';
import { io } from 'socket.io-client';

// Colors
const Colors = {
  primary: '#1db954',
  primaryDark: '#16a34a',
  primaryLight: '#3de07a',
  background: '#0a0e27',
  surface: 'rgba(255, 255, 255, 0.08)',
  surfaceHover: 'rgba(255, 255, 255, 0.12)',
  border: 'rgba(255, 255, 255, 0.15)',
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.45)',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
};

// Styled Components
const NotificationButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: ${Colors.surface};
  border: 1px solid ${Colors.border};
  backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${Colors.surfaceHover};
    transform: scale(1.05);
  }
  
  svg {
    color: ${Colors.textSecondary};
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: ${props => props.type === 'urgent' ? Colors.error : Colors.primary};
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 2px solid ${Colors.background};
  animation: ${props => props.type === 'urgent' ? 'pulse 1s ease-in-out infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
`;

const NotificationPanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: ${props => props.isExpanded ? '100%' : '400px'};
  height: 100vh;
  background: ${Colors.background};
  border-left: 1px solid ${Colors.border};
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
  
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const PanelHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${Colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HeaderTitle = styled.div`
  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: ${Colors.text};
    margin: 0;
  }
  p {
    font-size: 0.75rem;
    color: ${Colors.textMuted};
    margin: 0.125rem 0 0;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const HeaderButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${Colors.surface};
  border: 1px solid ${Colors.border};
  color: ${Colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${Colors.surfaceHover};
    color: ${Colors.text};
  }
`;

const FilterTabs = styled.div`
  display: flex;
  padding: 0.75rem 1.5rem;
  gap: 0.5rem;
  border-bottom: 1px solid ${Colors.border};
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterTab = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? Colors.surfaceHover : 'transparent'};
  border: 1px solid ${props => props.active ? Colors.primary : Colors.border};
  border-radius: 20px;
  color: ${props => props.active ? Colors.primary : Colors.textMuted};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${Colors.primary};
    color: ${Colors.textSecondary};
  }
`;

const NotificationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${Colors.border};
    border-radius: 2px;
  }
`;

const NotificationItem = styled.div`
  padding: 1rem;
  background: ${props => props.unread ? 'rgba(29, 185, 84, 0.05)' : Colors.surface};
  border: 1px solid ${props => props.unread ? 'rgba(29, 185, 84, 0.2)' : Colors.border};
  border-radius: 14px;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: notificationSlide 0.3s ease;
  
  @keyframes notificationSlide {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  &:hover {
    background: ${props => props.unread ? 'rgba(29, 185, 84, 0.08)' : Colors.surfaceHover};
    transform: translateX(-2px);
  }
  
  ${props => props.urgent && `
    border-left: 3px solid ${Colors.error};
  `}
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const NotificationIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${props => {
    switch (props.type) {
      case 'payment': return 'rgba(34, 197, 94, 0.15)';
      case 'document': return 'rgba(59, 130, 246, 0.15)';
      case 'urgent': return 'rgba(239, 68, 68, 0.15)';
      case 'info': return 'rgba(245, 158, 11, 0.15)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 18px;
    height: 18px;
    color: ${props => {
      switch (props.type) {
        case 'payment': return Colors.success;
        case 'document': return Colors.info;
        case 'urgent': return Colors.error;
        case 'info': return Colors.warning;
        default: return Colors.textSecondary;
      }
    }};
  }
`;

const NotificationMeta = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${Colors.text};
  margin: 0;
  line-height: 1.3;
`;

const NotificationTime = styled.span`
  font-size: 0.7rem;
  color: ${Colors.textMuted};
  display: block;
  margin-top: 0.125rem;
`;

const NotificationBody = styled.p`
  font-size: 0.8rem;
  color: ${Colors.textSecondary};
  line-height: 1.4;
  margin: 0;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const ActionButton = styled.button`
  padding: 0.375rem 0.75rem;
  background: ${props => props.primary ? `linear-gradient(135deg, ${Colors.primary} 0%, ${Colors.primaryDark} 100%)` : Colors.surface};
  border: 1px solid ${props => props.primary ? 'transparent' : Colors.border};
  border-radius: 8px;
  color: ${props => props.primary ? '#000' : Colors.textSecondary};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    transform: translateY(-1px);
    background: ${props => props.primary ? `linear-gradient(135deg, ${Colors.primaryLight} 0%, ${Colors.primary} 100%)` : Colors.surfaceHover};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${Colors.textMuted};
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${Colors.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  
  svg {
    width: 28px;
    height: 28px;
    opacity: 0.5;
  }
`;

// Toast notification for popups
const ToastContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Toast = styled.div`
  padding: 1rem 1.25rem;
  background: ${Colors.background};
  border: 1px solid ${Colors.border};
  border-radius: 14px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 360px;
  animation: toastIn 0.3s ease;
  
  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  ${props => props.type === 'urgent' && `
    border-left: 3px solid ${Colors.error};
  `}
`;

const ToastContent = styled.div`
  flex: 1;
`;

const ToastTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${Colors.text};
  margin-bottom: 0.125rem;
`;

const ToastMessage = styled.div`
  font-size: 0.75rem;
  color: ${Colors.textSecondary};
`;

const ToastClose = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: ${Colors.textMuted};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${Colors.surface};
    color: ${Colors.text};
  }
`;

// Main Component
const NotificationSystem = ({ userData, tenantSlug, deceasedId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [toasts, setToasts] = useState([]);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  // Socket.IO connection
  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8009';
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      auth: {
        tenantSlug,
        userId: userData?.id || localStorage.getItem('deceased_id'),
      }
    });

    newSocket.on('connect', () => {
      console.log('🔔 Socket connected:', newSocket.id);
      
      // Join tenant room
      newSocket.emit('join-tenant', {
        tenantSlug,
        userId: deceasedId,
        userRole: 'family'
      });
      
      // Join deceased-specific room
      if (deceasedId) {
        newSocket.emit('join-deceased', {
          tenantSlug,
          deceasedId
        });
      }
    });

    // Listen for notifications
    newSocket.on('notification:payment-received', (data) => {
      addNotification({
        type: 'payment',
        title: 'Payment Received',
        message: `KES ${data.amount} received for ${data.invoiceNumber}`,
        urgent: false,
        data
      });
    });

    newSocket.on('notification:invoice-created', (data) => {
      addNotification({
        type: 'payment',
        title: 'New Invoice',
        message: `Invoice ${data.invoiceNumber} created - KES ${data.total}`,
        urgent: false,
        data
      });
    });

    newSocket.on('notification:document-generated', (data) => {
      addNotification({
        type: 'document',
        title: 'Document Ready',
        message: `Your ${data.documentType} is now available`,
        urgent: false,
        data
      });
    });

    newSocket.on('notification:status-change', (data) => {
      addNotification({
        type: 'info',
        title: 'Status Update',
        message: `Case status has been updated`,
        urgent: false,
        data
      });
    });

    newSocket.on('notification:release-approved', (data) => {
      addNotification({
        type: 'urgent',
        title: 'Release Approved!',
        message: `${data.deceasedName} has been approved for release`,
        urgent: true,
        data
      });
    });

    newSocket.on('alert:invoice-overdue', (data) => {
      addNotification({
        type: 'urgent',
        title: 'Payment Overdue',
        message: `Invoice ${data.invoiceNumber} is ${data.daysOverdue} days overdue`,
        urgent: true,
        data
      });
    });

    newSocket.on('alert:low-stock', (data) => {
      addNotification({
        type: 'info',
        title: 'Stock Alert',
        message: `Low stock: ${data.itemName} (${data.currentStock} remaining)`,
        urgent: false,
        data
      });
    });

    newSocket.on('disconnect', () => {
      console.log('🔔 Socket disconnected');
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      newSocket.close();
    };
  }, [tenantSlug, deceasedId]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast for urgent notifications
    if (notification.urgent) {
      showToast(notification.title, notification.message, notification.type);
    }
  }, []);

  const showToast = (title, message, type = 'info') => {
    const toast = {
      id: Date.now(),
      title,
      message,
      type
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(toast.id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getFilteredNotifications = () => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === activeFilter);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment': return <CreditCard size={18} />;
      case 'document': return <FileText size={18} />;
      case 'urgent': return <AlertCircle size={18} />;
      case 'info': return <Info size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'payment', label: 'Payments' },
    { id: 'document', label: 'Documents' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'info', label: 'Info' },
  ];

  return (
    <>
      {/* Notification Bell Button */}
      <NotificationButton onClick={() => setIsOpen(!isOpen)}>
        <Bell size={20} />
        {unreadCount > 0 && <Badge type={unreadCount > 5 ? 'urgent' : 'normal'}>{unreadCount}</Badge>}
      </NotificationButton>

      {/* Notification Panel */}
      {isOpen && (
        <NotificationPanel isExpanded={isExpanded}>
          <PanelHeader>
            <HeaderLeft>
              <HeaderTitle>
                <h3>Notifications</h3>
                <p>{unreadCount} unread</p>
              </HeaderTitle>
            </HeaderLeft>
            <HeaderActions>
              {unreadCount > 0 && (
                <HeaderButton onClick={markAllAsRead} title="Mark all as read">
                  <CheckCheck size={16} />
                </HeaderButton>
              )}
              {notifications.length > 0 && (
                <HeaderButton onClick={clearAll} title="Clear all">
                  <Trash2 size={16} />
                </HeaderButton>
              )}
              <HeaderButton onClick={() => setIsOpen(false)}>
                <X size={16} />
              </HeaderButton>
            </HeaderActions>
          </PanelHeader>

          <FilterTabs>
            {filters.map(filter => (
              <FilterTab
                key={filter.id}
                active={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </FilterTab>
            ))}
          </FilterTabs>

          <NotificationList>
            {getFilteredNotifications().length === 0 ? (
              <EmptyState>
                <EmptyIcon>
                  <Bell size={28} />
                </EmptyIcon>
                <p>No notifications yet</p>
              </EmptyState>
            ) : (
              getFilteredNotifications().map(notification => (
                <NotificationItem
                  key={notification.id}
                  unread={!notification.read}
                  urgent={notification.urgent}
                  onClick={() => markAsRead(notification.id)}
                >
                  <NotificationHeader>
                    <NotificationIcon type={notification.type}>
                      {getNotificationIcon(notification.type)}
                    </NotificationIcon>
                    <NotificationMeta>
                      <NotificationTitle>{notification.title}</NotificationTitle>
                      <NotificationTime>{getTimeAgo(notification.timestamp)}</NotificationTime>
                    </NotificationMeta>
                  </NotificationHeader>
                  <NotificationBody>{notification.message}</NotificationBody>
                  {!notification.read && (
                    <NotificationActions>
                      <ActionButton onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}>
                        <Check size={14} />
                        Mark read
                      </ActionButton>
                      {notification.type === 'payment' && (
                        <ActionButton primary onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to payments
                        }}>
                          <CreditCard size={14} />
                          Pay now
                        </ActionButton>
                      )}
                      {notification.type === 'document' && (
                        <ActionButton primary onClick={(e) => {
                          e.stopPropagation();
                          // Download document
                        }}>
                          <FileText size={14} />
                          View
                        </ActionButton>
                      )}
                    </NotificationActions>
                  )}
                </NotificationItem>
              ))
            )}
          </NotificationList>
        </NotificationPanel>
      )}

      {/* Toast Notifications */}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast key={toast.id} type={toast.type}>
            <NotificationIcon type={toast.type}>
              {getNotificationIcon(toast.type)}
            </NotificationIcon>
            <ToastContent>
              <ToastTitle>{toast.title}</ToastTitle>
              <ToastMessage>{toast.message}</ToastMessage>
            </ToastContent>
            <ToastClose onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </ToastClose>
          </Toast>
        ))}
      </ToastContainer>
    </>
  );
};

export default NotificationSystem;