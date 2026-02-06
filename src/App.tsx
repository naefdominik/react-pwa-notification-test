import { useState, useEffect } from 'react';
import {
  isNotificationSupported,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushSubscribed,
  sendSubscriptionToServer,
  testNotification,
  type PushSubscriptionData
} from './utils/notifications';

// Load VAPID public key from environment variable
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

function App() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check notification support and permission
    if (isNotificationSupported()) {
      setNotificationPermission(Notification.permission);
      
      // Check if already subscribed
      isPushSubscribed().then(setIsSubscribed);
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      setError('');
      setStatus('Requesting permission...');
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        setStatus('Permission granted!');
      } else {
        setStatus('Permission denied');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      setStatus('');
    }
  };

  const handleSubscribe = async () => {
    try {
      setError('');
      
      // Check if VAPID key is configured
      if (!VAPID_PUBLIC_KEY) {
        setError('VAPID public key not configured. Check your .env file.');
        return;
      }
      
      setStatus('Subscribing to notifications...');
      
      // Subscribe to push notifications
      const sub = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);

      // Send subscription to backend
      await sendSubscriptionToServer(sub, BACKEND_URL);
      
      setSubscription(sub);
      setIsSubscribed(true);
      setStatus('Successfully subscribed to notifications!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(message);
      setStatus('');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setError('');
      setStatus('Unsubscribing...');
      
      const success = await unsubscribeFromPushNotifications();
      
      if (success) {
        setIsSubscribed(false);
        setSubscription(null);
        setStatus('Successfully unsubscribed from notifications');
      } else {
        setStatus('Already unsubscribed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(message);
      setStatus('');
    }
  };

  const handleTestNotification = async () => {
    try {
      setError('');
      setStatus('Sending test notification...');
      
      await testNotification(BACKEND_URL);
      
      setStatus('Test notification sent! Check if you received it.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send test notification';
      setError(message);
      setStatus('');
    }
  };

  if (!isNotificationSupported()) {
    return (
      <>
        <h1>PWA Notification Test</h1>
        <div style={{ color: 'red', padding: '20px', border: '1px solid red', borderRadius: '5px' }}>
          <strong>Not Supported:</strong> Your browser does not support push notifications.
        </div>
      </>
    );
  }

  return (
    <>
      <h1>PWA Notification Test</h1>
      <p>Test push notifications triggered from a Python backend.</p>
      
      <div style={{ marginTop: '30px' }}>
        <h2>Status</h2>
        <div style={{ backgroundColor: '#f0f0f0', color: '#000', padding: '15px', borderRadius: '5px', maxWidth: '400px', margin: '0 auto' }}>
          <p><strong>Permission:</strong> {notificationPermission}</p>
          <p><strong>Subscribed:</strong> {isSubscribed ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Actions</h2>
        <div style={{ display: 'flex', margin: '0 auto', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
          <button 
            onClick={handleRequestPermission}
            disabled={notificationPermission === 'granted'}
            style={{ padding: '10px', cursor: 'pointer' }}
          >
            1. Request Permission
          </button>
          
          <button 
            onClick={handleSubscribe}
            disabled={notificationPermission !== 'granted' || isSubscribed}
            style={{ padding: '10px', cursor: 'pointer' }}
          >
            2. Subscribe to Notifications
          </button>
          
          <button 
            onClick={handleTestNotification}
            disabled={!isSubscribed}
            style={{ padding: '10px', cursor: 'pointer' }}
          >
            3. Send Test Notification
          </button>
          
          <button 
            onClick={handleUnsubscribe}
            disabled={!isSubscribed}
            style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#ff6b6b' }}
          >
            Unsubscribe
          </button>
        </div>
      </div>

      {status && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '5px', color: '#155724', maxWidth: '400px', margin: '20px auto 0' }}>
          {status}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '5px', color: '#721c24', maxWidth: '400px', margin: '20px auto 0' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {subscription && (
        <div style={{ marginTop: '30px' }}>
          <h2>Subscription Details</h2>
          <pre style={{ backgroundColor: '#f0f0f0', color: '#000', padding: '15px', borderRadius: '5px', overflow: 'auto', fontSize: '12px', maxWidth: '400px', margin: '0 auto' }}>
            {JSON.stringify(subscription, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
}

export default App;
