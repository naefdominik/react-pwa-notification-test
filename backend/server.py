"""
Simple Python backend for sending push notifications to PWA clients
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from pywebpush import webpush, WebPushException
from dotenv import load_dotenv
from py_vapid import Vapid
import json
import os
from urllib.parse import urlparse

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Store subscriptions in memory (in production, use a database)
subscriptions = []

# VAPID credentials - Load from environment variables
VAPID_PRIVATE_KEY_PEM = os.getenv('VAPID_PRIVATE_KEY')
VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY')
VAPID_EMAIL = os.getenv('VAPID_EMAIL')

# Validate that VAPID keys are set
if not VAPID_PRIVATE_KEY_PEM or not VAPID_PUBLIC_KEY or not VAPID_EMAIL:
    print('\n' + '=' * 60)
    print('ERROR: VAPID keys or email not found!')
    print('=' * 60)
    print('Please create a .env file with VAPID keys and email.')
    print('See backend/README.md for generation instructions.')
    print('=' * 60 + '\n')
    exit(1)

# Unescape newlines in the private key
VAPID_PRIVATE_KEY_PEM = VAPID_PRIVATE_KEY_PEM.replace('\\n', '\n')

# Write private key to temporary file (pywebpush requires file path)
# This file is generated on each server start and ignored by git
import tempfile
temp_key_file = tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False)
temp_key_file.write(VAPID_PRIVATE_KEY_PEM)
temp_key_file.close()
VAPID_KEY_FILE = temp_key_file.name

# Verify the key is valid
try:
    vapid = Vapid.from_file(VAPID_KEY_FILE)
    print(f'✅ VAPID key loaded successfully')
except Exception as e:
    print(f'\nError loading VAPID key: {e}')
    print('Check your VAPID_PRIVATE_KEY in .env file.')
    print('See backend/README.md for generation instructions.\n')
    os.unlink(VAPID_KEY_FILE)
    exit(1)


def get_vapid_claims(subscription_endpoint):
    """
    Generate VAPID claims with the correct audience (aud) for the push service
    The aud claim must be the origin of the push service endpoint
    """
    parsed_url = urlparse(subscription_endpoint)
    audience = f"{parsed_url.scheme}://{parsed_url.netloc}"
    
    return {
        "sub": VAPID_EMAIL,
        "aud": audience
    }


@app.route('/subscribe', methods=['POST'])
def subscribe():
    """
    Endpoint to receive and store push notification subscriptions from clients
    """
    try:
        subscription_data = request.json
        
        # Validate subscription data
        if not subscription_data or 'endpoint' not in subscription_data:
            return jsonify({'error': 'Invalid subscription data'}), 400
        
        # Check if already subscribed
        existing = next((s for s in subscriptions if s['endpoint'] == subscription_data['endpoint']), None)
        
        if existing:
            print(f'Subscription already exists: {subscription_data["endpoint"][:50]}...')
        else:
            subscriptions.append(subscription_data)
            print(f'New subscription added: {subscription_data["endpoint"][:50]}...')
        
        return jsonify({
            'success': True,
            'message': 'Subscription received',
            'total_subscriptions': len(subscriptions)
        }), 201
    
    except Exception as e:
        print(f'Error in subscribe endpoint: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/test-notification', methods=['POST'])
def test_notification():
    """
    Send a test notification to all subscribed clients
    """
    if not subscriptions:
        return jsonify({'error': 'No subscriptions available'}), 400
    
    notification_data = {
        'title': 'Test Notification',
        'body': 'This is a test notification from your Python backend!',
        'icon': '/pwa-192x192.png',
        'data': {
            'timestamp': str(os.times())
        }
    }
    
    return send_notification_to_all(notification_data)


@app.route('/send-notification', methods=['POST'])
def send_custom_notification():
    """
    Send a custom notification to all subscribed clients
    Example request body:
    {
        "title": "Custom Title",
        "body": "Custom message",
        "icon": "/custom-icon.png"
    }
    """
    if not subscriptions:
        return jsonify({'error': 'No subscriptions available'}), 400
    
    try:
        notification_data = request.json
        
        if not notification_data or 'title' not in notification_data or 'body' not in notification_data:
            return jsonify({'error': 'Notification must include title and body'}), 400
        
        return send_notification_to_all(notification_data)
    
    except Exception as e:
        print(f'Error in send_notification endpoint: {str(e)}')
        return jsonify({'error': str(e)}), 500


def send_notification_to_all(notification_data):
    """
    Helper function to send notification to all subscribed clients
    """
    success_count = 0
    failure_count = 0
    failed_subscriptions = []
    
    for subscription in subscriptions[:]:  # Create a copy to allow removal during iteration
        try:
            # Generate VAPID claims with correct audience for this subscription
            vapid_claims = get_vapid_claims(subscription['endpoint'])
            
            # Send push notification (pywebpush requires file path for VAPID key)
            webpush(
                subscription_info=subscription,
                data=json.dumps(notification_data),
                vapid_private_key=VAPID_KEY_FILE,
                vapid_claims=vapid_claims
            )
            success_count += 1
            print(f'Notification sent successfully to: {subscription["endpoint"][:50]}...')
        
        except WebPushException as e:
            failure_count += 1
            print(f'Failed to send notification: {str(e)}')
            
            # Remove invalid subscriptions (e.g., expired or unsubscribed)
            if e.response and e.response.status_code in [404, 410]:
                subscriptions.remove(subscription)
                failed_subscriptions.append(subscription['endpoint'][:50])
                print(f'Removed invalid subscription: {subscription["endpoint"][:50]}...')
        
        except Exception as e:
            failure_count += 1
            print(f'Unexpected error sending notification: {str(e)}')
    
    return jsonify({
        'success': True,
        'message': f'Notification sent to {success_count} client(s)',
        'success_count': success_count,
        'failure_count': failure_count,
        'total_subscriptions': len(subscriptions),
        'failed_subscriptions': failed_subscriptions
    }), 200


@app.route('/subscriptions', methods=['GET'])
def get_subscriptions():
    """
    Get all current subscriptions (for debugging)
    """
    return jsonify({
        'total': len(subscriptions),
        'subscriptions': [
            {
                'endpoint': sub['endpoint'][:50] + '...',
                'has_keys': 'keys' in sub
            }
            for sub in subscriptions
        ]
    })


@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'subscriptions': len(subscriptions)
    })


if __name__ == '__main__':
    print('=' * 60)
    print('PWA Push Notification Backend')
    print('=' * 60)
    print(f'VAPID Public Key: {VAPID_PUBLIC_KEY}')
    print(f'VAPID Email: {VAPID_EMAIL}')
    print(f'Server starting on http://localhost:5001')
    print('=' * 60)
    print('\nMake sure to:')
    print('1. Copy VAPID_PUBLIC_KEY to frontend .env:')
    print(f'   VITE_VAPID_PUBLIC_KEY={VAPID_PUBLIC_KEY}')
    print('2. Update VITE_BACKEND_URL=http://localhost:5001 in frontend .env')
    print('=' * 60)
    
    app.run(debug=True, port=5001)
