// Notification utilities for PWA push notifications

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Check if notifications are supported in the browser
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Convert a base64 string to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 * @param vapidPublicKey - The VAPID public key from the server
 */
export async function subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscriptionData> {
  if (!isNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;

  // Check if already subscribed
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    // Subscribe to push notifications
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as BufferSource
    });
  }

  // Convert subscription to JSON and extract data
  const subscriptionJson = subscription.toJSON();
  
  if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
    throw new Error('Invalid subscription data');
  }

  return {
    endpoint: subscriptionJson.endpoint,
    keys: {
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth
    }
  };
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    return await subscription.unsubscribe();
  }

  return false;
}

/**
 * Check if currently subscribed to push notifications
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

/**
 * Send subscription to backend server
 */
export async function sendSubscriptionToServer(
  subscription: PushSubscriptionData,
  serverUrl: string
): Promise<void> {
  const response = await fetch(`${serverUrl}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subscription)
  });

  if (!response.ok) {
    throw new Error(`Failed to send subscription to server: ${response.statusText}`);
  }
}

/**
 * Test notification by requesting one from the server
 */
export async function testNotification(serverUrl: string): Promise<void> {
  const response = await fetch(`${serverUrl}/test-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger test notification: ${response.statusText}`);
  }
}
