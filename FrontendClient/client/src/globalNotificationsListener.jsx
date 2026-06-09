import React, { useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://weltcoverv1-insurancesystem.onrender.com';
const VAPID_PUBLIC_KEY = 'BK5yk-r_qoR6flSHtGZkEYlrBxQ-M4QcLUxLnUDaIQLKJR-MC4JSfwdPFoDCEXhrbBtqvQsob4U0CQn0W6LzW90';
const NOTIFICATION_SOUND = '/notifiy.mp3';

const urlBase64ToUint8Array = (base64String) => {
  const paddingLength = (4 - (base64String.length % 4)) % 4;
  const padding = '='.repeat(paddingLength);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
};

const GlobalNotifications = () => {
  const socketRef = useRef(null);
  const tenantSlugRef = useRef(null);

  // Get tenant slug safely
  const getTenantSlug = useCallback(() => {
    return (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('tenant_slug') ||
      (() => {
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          return user.tenantSlug || user.tenant?.slug || 'default';
        } catch {
          return 'default';
        }
      })()
    );
  }, []);

  // Get auth token safely
  const getAuthToken = useCallback(() => {
    return (
      localStorage.getItem('authToken') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token')
    );
  }, []);

  const playNotificationSound = useCallback(() => {
    new Audio(NOTIFICATION_SOUND)
      .play()
      .catch(() => {
        console.warn('Audio playback failed');
      });
  }, []);

  const showBrowserNotification = useCallback(async (notification) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(
        notification.title || 'New Notification',
        {
          body: notification.message,
          icon: notification.icon || '/logo.png',
          badge: '/logo.png',
          tag: `notification-${notification.id || Date.now()}`,
          data: {
            url: notification.data?.url || '/',
            notificationId: notification.id,
            tenant: tenantSlugRef.current
          },
          vibrate: [200, 100, 200],
          requireInteraction: false
        }
      );
    } catch (error) {
      console.error('Browser notification failed:', error);
      showFallbackNotification(notification);
    }
  }, []);

  const showFallbackNotification = useCallback((notification) => {
    Swal.fire({
      title: notification.title || 'New Notification',
      text: notification.message,
      icon: 'info',
      toast: true,
      position: 'top-end',
      timer: 5000,
      showConfirmButton: false
    });
  }, []);

  const handleNewNotification = useCallback((notification) => {
    console.log('[Notification] Received:', notification);
    
    // Only play sound and show if it matches tenant
    if (notification.tenant_slug === tenantSlugRef.current || !notification.tenant_slug) {
      playNotificationSound();
      
      if (Notification.permission === 'granted') {
        showBrowserNotification(notification);
      } else {
        showFallbackNotification(notification);
      }
    }
  }, [playNotificationSound, showBrowserNotification, showFallbackNotification]);

  const initializeServiceWorker = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers are not supported in this browser.');
        return null;
      }

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      if (registration.waiting) {
        console.log('[SW] Update available');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      registration.addEventListener('updatefound', () => {
        console.log('[SW] New version installing');
      });

      return registration;
    } catch (error) {
      console.error('[SW] Registration failed:', error);
      return null;
    }
  }, []);

  const initializePushNotifications = useCallback(async (registration) => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.info('Notifications blocked by user');
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      const tenantSlug = getTenantSlug();
      const token = getAuthToken();

      const response = await fetch(`${SOCKET_URL}/api/v1/restpoint/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...subscription,
          tenant_slug: tenantSlug
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('[Push] Subscription confirmed for tenant:', tenantSlug);
    } catch (error) {
      console.error('[Push] Subscription error:', error);
    }
  }, [getTenantSlug, getAuthToken]);

  const initializeWebSocket = useCallback(() => {
    const tenantSlug = getTenantSlug();
    const token = getAuthToken();

    tenantSlugRef.current = tenantSlug;

    console.log('[Socket] Initializing for tenant:', tenantSlug);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      auth: {
        token: token,
        tenant_slug: tenantSlug
      },
      query: {
        tenant_slug: tenantSlug
      }
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id, 'Tenant:', tenantSlug);
      
      // Join tenant-specific room
      socket.emit('join_tenant', { tenant_slug: tenantSlug });
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    // Listen for new notifications
    socket.on('new_notification', handleNewNotification);

    // Listen for newly created deceased
    socket.on('deceased_created', (data) => {
      console.log('[Event] Deceased created:', data);
      handleNewNotification({
        id: `deceased_${data.id}`,
        type: 'NEW',
        title: 'New Deceased Added',
        message: `Deceased: ${data.name || 'Unknown'}`,
        tenant_slug: data.tenant_slug,
        data: { url: `/deceased/${data.id}` }
      });
    });

    // Listen for dispatch updates
    socket.on('dispatch_updated', (data) => {
      console.log('[Event] Dispatch updated:', data);
      handleNewNotification({
        id: `dispatch_${data.id}`,
        type: 'TASK',
        title: 'Dispatch Status Updated',
        message: `Status: ${data.status}`,
        tenant_slug: data.tenant_slug,
        data: { url: `/dispatch/${data.id}` }
      });
    });

    // Listen for billing events
    socket.on('billing_event', (data) => {
      console.log('[Event] Billing event:', data);
      handleNewNotification({
        id: `billing_${data.id}`,
        type: 'REMINDER',
        title: 'Billing Notification',
        message: data.message,
        tenant_slug: data.tenant_slug,
        data: { url: '/billing' }
      });
    });

    // Listen for ready for dispatch
    socket.on('ready_for_dispatch', (data) => {
      console.log('[Event] Ready for dispatch:', data);
      handleNewNotification({
        id: `ready_${data.id}`,
        type: 'TASK',
        title: 'Ready for Dispatch',
        message: `${data.name || 'Service'} is ready for dispatch`,
        tenant_slug: data.tenant_slug,
        data: { url: `/dispatch` }
      });
    });

    socketRef.current = socket;

    return () => {
      socket.emit('leave_tenant', { tenant_slug: tenantSlug });
      socket.off('new_notification');
      socket.off('deceased_created');
      socket.off('dispatch_updated');
      socket.off('billing_event');
      socket.off('ready_for_dispatch');
      socket.disconnect();
    };
  }, [getTenantSlug, getAuthToken, handleNewNotification]);

  useEffect(() => {
    const init = async () => {
      const registration = await initializeServiceWorker();
      if (registration) {
        await initializePushNotifications(registration);
      }
      const cleanupWebSocket = initializeWebSocket();

      return () => {
        cleanupWebSocket?.();
      };
    };

    init();

    // Re-initialize on tenant change
    const handleStorageChange = () => {
      const newTenant = getTenantSlug();
      if (newTenant !== tenantSlugRef.current) {
        console.log('[Storage] Tenant changed, reinitializing socket');
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        setTimeout(() => init(), 500);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initializeServiceWorker, initializePushNotifications, initializeWebSocket, getTenantSlug]);

  return null;
};

export default GlobalNotifications;