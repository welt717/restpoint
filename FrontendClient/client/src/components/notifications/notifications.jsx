import React, { useEffect, useState, useRef, useCallback } from "react";
import { Badge, Button, Container, Row, Col, Alert, Modal, Spinner } from "react-bootstrap";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUser } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/restpoint/notification';
const API_NOTIFICATION_URL = 'http://localhost:8000/api/v1/restpoint/notification';

const notificationStyles = {
  EXPIRED: { bg: "#ffeef0", color: "#cf222e" },
  NEW: { bg: "#e6f4ff", color: "#1a73e8" },
  REMINDER: { bg: "#fff8e6", color: "#e6a700" },
  TASK: { bg: "#e6f4ea", color: "#1e8e3e" },
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const Notifications = () => {
  const [state, setState] = useState({
    notifications: [],
    unreadCount: 0,
    error: "",
    selectedNotification: null,
    showDetailModal: false,
    loading: true,
    socketConnected: false,
    deletingIds: [],
    soundEnabled: true,
  });

  const socketRef = useRef(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
// In your Notifications component
useEffect(() => {
  const setupPushNotifications = async () => {
    try {
      // Add timeout for slow connections
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription first
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      // Add error handling for subscription POST
      const headers = {};
      const tenantSlug = localStorage.getItem('tenantSlug');
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
      await axios.post(`${API_BASE_URL}/subscribe`, subscription, {
        timeout: 5000,
        headers
      });
      
    } catch (error) {
      console.error('Push subscription failed:', error);
      // Add user feedback
      Swal.fire('Notifications Disabled', 'Please enable browser notifications', 'info');
    }
  };

  // Add feature detection
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        setupPushNotifications();
      } else {
        console.log('Permission not granted');
      }
    });
  }
}, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const headers = {};
      const tenantSlug = localStorage.getItem('tenantSlug') || 
                        localStorage.getItem('tenant_slug') ||
                        (() => {
                          try {
                            const user = JSON.parse(localStorage.getItem('user') || '{}');
                            return user.tenantSlug || user.tenant?.slug || 'default';
                          } catch {
                            return 'default';
                          }
                        })();
      
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await axios.get(`${API_NOTIFICATION_URL}/notifications?tenant=${tenantSlug}`, { headers });
      const notifications = (response.data && response.data.data) || [];
      const validNotifications = notifications
        .filter((n) => n?.id && n?.message)
        .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

      setState(prev => ({
        ...prev,
        notifications: validNotifications,
        unreadCount: validNotifications.filter((n) => !n.is_read && !n.isRead).length,
        loading: false,
      }));
    } catch (err) {
      console.error('Fetch notifications error:', err);
      setState(prev => ({ ...prev, error: "Failed to load notifications", loading: false }));
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchData = async () => {
      try {
        const headers = {};
        const tenantSlug = localStorage.getItem('tenantSlug') || 
                          localStorage.getItem('tenant_slug') ||
                          (() => {
                            try {
                              const user = JSON.parse(localStorage.getItem('user') || '{}');
                              return user.tenantSlug || user.tenant?.slug || 'default';
                            } catch {
                              return 'default';
                            }
                          })();

        if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_NOTIFICATION_URL}/notifications?tenant=${tenantSlug}`, {
          signal: abortController.signal,
          headers
        });

        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        const notifications = (data && data.data) || [];

        setState(prev => ({
          ...prev,
          notifications: notifications,
          unreadCount: notifications.filter(n => !n.is_read && !n.isRead).length,
          loading: false
        }));
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
          setState(prev => ({ ...prev, error: error.message, loading: false }));
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30 seconds
    
    return () => {
      abortController.abort();
      clearInterval(interval);
    };
  }, []);

  const handleDelete = async (notificationId) => {
    const result = await Swal.fire({
      title: "Delete Notification?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    
    if (!result.isConfirmed) return;
    
    try {
      setState(prev => ({ ...prev, deletingIds: [...prev.deletingIds, notificationId] }));
      const headers = {};
      const tenantSlug = localStorage.getItem('tenantSlug') || 
                        localStorage.getItem('tenant_slug') ||
                        (() => {
                          try {
                            const user = JSON.parse(localStorage.getItem('user') || '{}');
                            return user.tenantSlug || user.tenant?.slug || 'default';
                          } catch {
                            return 'default';
                          }
                        })();

      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await axios.delete(`${API_NOTIFICATION_URL}/notifications/${notificationId}`, { headers });
      await fetchNotifications();
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.error || "Deletion failed", "error");
    } finally {
      setState(prev => ({
        ...prev,
        deletingIds: prev.deletingIds.filter(id => id !== notificationId),
      }));
    }
  };

  const markAllAsRead = async () => {
    try {
      const headers = {};
      const tenantSlug = localStorage.getItem('tenantSlug') || 
                        localStorage.getItem('tenant_slug') ||
                        (() => {
                          try {
                            const user = JSON.parse(localStorage.getItem('user') || '{}');
                            return user.tenantSlug || user.tenant?.slug || 'default';
                          } catch {
                            return 'default';
                          }
                        })();

      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await axios.put(`${API_NOTIFICATION_URL}/notifications/mark-all-read`, null, { headers });
      await fetchNotifications();
    } catch (err) {
      Swal.fire("Error!", "Failed to mark all as read", "error");
    }
  };

  const handleNotificationClick = (notification) => {
    setState(prev => ({
      ...prev,
      selectedNotification: notification,
      showDetailModal: true
    }));
  };

  const NotificationItem = ({ notification }) => {
    const isPushNotification = !notification.id;
    const styleConfig = notificationStyles[notification.type] || notificationStyles.NEW;

    return (
      <div className="mb-3" onClick={() => handleNotificationClick(notification)}>
        <div
          className="rounded p-2 p-md-3 position-relative shadow-sm"
          style={{
            backgroundColor: styleConfig.bg,
            border: `1px solid ${styleConfig.color}50`,
            cursor: "pointer",
            transition: "transform 0.2s",
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Badge pill style={{ 
              backgroundColor: styleConfig.color, 
              color: "white", 
              fontSize: "0.75rem" 
            }}>
              {notification.type}
            </Badge>
            <small className="text-muted" style={{ fontSize: "0.8rem" }}>
              {new Date(notification.createdAt).toLocaleTimeString()}
            </small>
          </div>
          
          <div style={{ color: styleConfig.color, fontSize: "0.9rem" }}>
            {notification.message}
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <div className="text-muted" style={{ fontSize: "0.8rem" }}>
              <FontAwesomeIcon icon={faUser} className="me-1" />
              {notification.creator?.name || "System"}
            </div>
            
            <Button
              variant="link"
              size="sm"
              className="text-danger p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(notification.id);
              }}
              disabled={state.deletingIds.includes(notification.id)}
            >
              {state.deletingIds.includes(notification.id) ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FontAwesomeIcon icon={faTrash} />
              )}
            </Button>
          </div>

          {!notification.isRead && (
            <div className="position-absolute top-0 end-0 mt-1 me-1">
              <Badge pill bg="success" style={{ fontSize: "0.6rem" }}>
                New
              </Badge>
            </div>
          )}

          {isPushNotification && (
            <div className="position-absolute top-0 start-0 mt-1 me-1">
              <Badge pill bg="info" style={{ fontSize: "0.6rem" }}>
                Push
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Container fluid className="vh-100 bg-light p-3">
      <Row className="mb-3">
        <Col>
          <h2 className="d-flex justify-content-between align-items-center">
            Insurance Real-Time Notifications
            <div className="d-flex gap-2">
              <Badge pill bg="danger">
                {state.unreadCount}
              </Badge>
              <Badge pill bg={state.socketConnected ? "success" : "danger"}>
                {state.socketConnected ? "Live" : "Offline"}
              </Badge>
            </div>
          </h2>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col className="d-flex gap-2">
          <Button variant="primary" size="sm" onClick={markAllAsRead}>
            Mark All as Read
          </Button>
        </Col>
      </Row>

      {state.error && <Alert variant="danger" className="py-2">{state.error}</Alert>}

      <Row>
        <Col md={12}>
          {state.loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" size="sm" />
            </div>
          ) : (
            <div className="bg-white rounded-3 shadow-sm p-2" 
                 style={{ maxHeight: "75vh", overflowY: "auto" }}>
              {state.notifications.map(notification => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
              {state.notifications.length === 0 && (
                <div className="text-center text-muted py-3">
                  No notifications available
                </div>
              )}
            </div>
          )}
        </Col>
      </Row>

      <Modal
        show={state.showDetailModal}
        onHide={() => setState(prev => ({ ...prev, showDetailModal: false }))}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Notification Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {state.selectedNotification && (
            <>
              <p><strong>Type:</strong> {state.selectedNotification.type}</p>
              <p><strong>Received:</strong> {new Date(state.selectedNotification.createdAt).toLocaleString()}</p>
              <p><strong>Message:</strong> {state.selectedNotification.message}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setState(prev => ({ ...prev, showDetailModal: false }))}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Notifications;