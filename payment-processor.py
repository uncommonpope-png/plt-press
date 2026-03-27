#!/usr/bin/env python3
"""
SOULVERSE PAYMENT PROCESSOR
Handles payments via Stripe, Crypto (BTC, ETH, USDT), and PayPal
"""

import json
import os
import hashlib
import secrets
from datetime import datetime
from pathlib import Path

# ==================== CONFIGURATION ====================
PAYMENTS_FILE = Path.home() / "soulverse" / "payments.json"
GAME_PRICE_USD = 49.99

# Crypto addresses (replace with your actual addresses)
CRYPTO_ADDRESSES = {
    'BTC': 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    'ETH': '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    'USDT': '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'  # ERC-20
}

# ==================== PAYMENT MANAGER ====================
class PaymentManager:
    def __init__(self):
        self.payments = self.load_payments()
    
    def load_payments(self):
        if PAYMENTS_FILE.exists():
            with open(PAYMENTS_FILE) as f:
                return json.load(f)
        return {'transactions': [], 'pending': {}}
    
    def save_payments(self):
        PAYMENTS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(PAYMENTS_FILE, 'w') as f:
            json.dump(self.payments, f, indent=2)
    
    def create_payment_intent(self, user_id, email, method):
        """Create a payment intent for the user"""
        payment_id = f"pay_{secrets.token_hex(16)}"
        
        intent = {
            'payment_id': payment_id,
            'user_id': user_id,
            'email': email,
            'method': method,  # 'stripe', 'paypal', 'btc', 'eth', 'usdt'
            'amount': GAME_PRICE_USD,
            'currency': 'USD',
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'expires_at': None
        }
        
        # Set expiration based on method
        if method in ['btc', 'eth', 'usdt']:
            from datetime import timedelta
            intent['expires_at'] = (datetime.now() + timedelta(hours=1)).isoformat()
        
        self.payments['pending'][payment_id] = intent
        self.save_payments()
        
        return intent
    
    def confirm_stripe_payment(self, payment_id, stripe_token):
        """Confirm Stripe payment (in production, verify with Stripe API)"""
        if payment_id not in self.payments['pending']:
            return {'success': False, 'error': 'Payment not found'}
        
        intent = self.payments['pending'][payment_id]
        
        # In production: verify with Stripe API
        # stripe.Charge.create(amount=4999, currency='usd', source=stripe_token)
        
        # For now, simulate success
        intent['status'] = 'completed'
        intent['completed_at'] = datetime.now().isoformat()
        intent['transaction_id'] = f"stripe_{secrets.token_hex(8)}"
        
        self.payments['transactions'].append(intent)
        del self.payments['pending'][payment_id]
        self.save_payments()
        
        return {
            'success': True,
            'transaction_id': intent['transaction_id'],
            'receipt_url': f'https://stripe.com/receipts/{intent["transaction_id"]}'
        }
    
    def confirm_paypal_payment(self, payment_id, paypal_token):
        """Confirm PayPal payment (in production, verify with PayPal API)"""
        if payment_id not in self.payments['pending']:
            return {'success': False, 'error': 'Payment not found'}
        
        intent = self.payments['pending'][payment_id]
        
        # In production: verify with PayPal API
        # paypal.execute_payment(paypal_token)
        
        # For now, simulate success
        intent['status'] = 'completed'
        intent['completed_at'] = datetime.now().isoformat()
        intent['transaction_id'] = f"paypal_{secrets.token_hex(8)}"
        
        self.payments['transactions'].append(intent)
        del self.payments['pending'][payment_id]
        self.save_payments()
        
        return {
            'success': True,
            'transaction_id': intent['transaction_id']
        }
    
    def create_crypto_payment(self, payment_id, crypto_type):
        """Create crypto payment instruction"""
        if payment_id not in self.payments['pending']:
            return None
        
        intent = self.payments['pending'][payment_id]
        
        if crypto_type not in CRYPTO_ADDRESSES:
            return None
        
        # Calculate crypto amount (in production, fetch from exchange API)
        rates = {
            'BTC': 0.0005,  # ~1/2000 BTC per USD
            'ETH': 0.0003,  # ~1/3000 ETH per USD
            'USDT': 1.0     # 1:1 with USD
        }
        
        crypto_amount = GAME_PRICE_USD * rates.get(crypto_type, 1)
        
        return {
            'payment_id': payment_id,
            'crypto_type': crypto_type,
            'amount': crypto_amount,
            'address': CRYPTO_ADDRESSES[crypto_type],
            'expires_at': intent['expires_at'],
            'qr_code': f"crypto:{CRYPTO_ADDRESSES[crypto_type]}?amount={crypto_amount}"
        }
    
    def verify_crypto_payment(self, payment_id, tx_hash):
        """Verify crypto payment on blockchain (in production, verify on-chain)"""
        if payment_id not in self.payments['pending']:
            return {'success': False, 'error': 'Payment not found'}
        
        intent = self.payments['pending'][payment_id]
        
        # In production: verify transaction on blockchain
        # Use blockchain API to confirm tx_hash
        
        # For now, simulate success
        intent['status'] = 'completed'
        intent['completed_at'] = datetime.now().isoformat()
        intent['transaction_id'] = tx_hash
        intent['crypto_tx'] = tx_hash
        
        self.payments['transactions'].append(intent)
        del self.payments['pending'][payment_id]
        self.save_payments()
        
        return {
            'success': True,
            'transaction_id': tx_hash
        }
    
    def get_payment_status(self, payment_id):
        """Get payment status"""
        if payment_id in self.payments['pending']:
            return self.payments['pending'][payment_id]
        
        for tx in self.payments['transactions']:
            if tx['payment_id'] == payment_id:
                return tx
        
        return None
    
    def get_user_payments(self, user_id):
        """Get all payments for a user"""
        user_payments = []
        
        for tx in self.payments['transactions']:
            if tx['user_id'] == user_id:
                user_payments.append(tx)
        
        for payment in self.payments['pending'].values():
            if payment['user_id'] == user_id:
                user_payments.append(payment)
        
        return user_payments

# ==================== WEB SERVER INTEGRATION ====================
from aiohttp import web

payment_manager = PaymentManager()

async def handle_create_payment(request):
    """Create a new payment intent"""
    try:
        data = await request.json()
        user_id = data.get('user_id')
        email = data.get('email')
        method = data.get('method', 'stripe')
        
        intent = payment_manager.create_payment_intent(user_id, email, method)
        
        return web.json_response({
            'success': True,
            'payment_id': intent['payment_id'],
            'amount': intent['amount'],
            'method': intent['method'],
            'expires_at': intent.get('expires_at')
        })
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def handle_confirm_stripe(request):
    """Confirm Stripe payment"""
    try:
        data = await request.json()
        payment_id = data.get('payment_id')
        stripe_token = data.get('token')
        
        result = payment_manager.confirm_stripe_payment(payment_id, stripe_token)
        
        return web.json_response(result)
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def handle_confirm_paypal(request):
    """Confirm PayPal payment"""
    try:
        data = await request.json()
        payment_id = data.get('payment_id')
        paypal_token = data.get('token')
        
        result = payment_manager.confirm_paypal_payment(payment_id, paypal_token)
        
        return web.json_response(result)
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def handle_crypto_payment_info(request):
    """Get crypto payment instructions"""
    try:
        payment_id = request.query.get('payment_id')
        crypto_type = request.query.get('crypto', 'BTC')
        
        payment_info = payment_manager.create_crypto_payment(payment_id, crypto_type)
        
        if not payment_info:
            return web.json_response({'error': 'Payment not found'}, status=404)
        
        return web.json_response(payment_info)
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def handle_verify_crypto(request):
    """Verify crypto payment"""
    try:
        data = await request.json()
        payment_id = data.get('payment_id')
        tx_hash = data.get('tx_hash')
        
        result = payment_manager.verify_crypto_payment(payment_id, tx_hash)
        
        return web.json_response(result)
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def handle_payment_status(request):
    """Get payment status"""
    try:
        payment_id = request.query.get('payment_id')
        
        status = payment_manager.get_payment_status(payment_id)
        
        if not status:
            return web.json_response({'error': 'Payment not found'}, status=404)
        
        return web.json_response(status)
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def handle_user_payments(request):
    """Get all payments for a user"""
    try:
        user_id = request.query.get('user_id')
        
        payments = payment_manager.get_user_payments(user_id)
        
        return web.json_response({
            'success': True,
            'payments': payments,
            'total': len(payments)
        })
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

# ==================== STANDALONE CLI ====================
def cli_main():
    """Command-line interface for payment testing"""
    import sys
    
    pm = PaymentManager()
    
    if len(sys.argv) < 2:
        print("SOULVERSE Payment Processor CLI")
        print("\nUsage:")
        print("  python payment-processor.py create <user_id> <email> <method>")
        print("  python payment-processor.py status <payment_id>")
        print("  python payment-processor.py confirm-stripe <payment_id> <token>")
        print("  python payment-processor.py crypto <payment_id> <BTC|ETH|USDT>")
        print("  python payment-processor.py verify-crypto <payment_id> <tx_hash>")
        print("  python payment-processor.py list <user_id>")
        return
    
    command = sys.argv[1]
    
    if command == 'create':
        if len(sys.argv) < 5:
            print("Usage: create <user_id> <email> <method>")
            return
        
        user_id, email, method = sys.argv[2:5]
        intent = pm.create_payment_intent(user_id, email, method)
        print(f"Created payment intent:")
        print(json.dumps(intent, indent=2))
    
    elif command == 'status':
        if len(sys.argv) < 3:
            print("Usage: status <payment_id>")
            return
        
        payment_id = sys.argv[2]
        status = pm.get_payment_status(payment_id)
        if status:
            print(json.dumps(status, indent=2))
        else:
            print("Payment not found")
    
    elif command == 'confirm-stripe':
        if len(sys.argv) < 4:
            print("Usage: confirm-stripe <payment_id> <token>")
            return
        
        payment_id, token = sys.argv[2:4]
        result = pm.confirm_stripe_payment(payment_id, token)
        print(json.dumps(result, indent=2))
    
    elif command == 'crypto':
        if len(sys.argv) < 4:
            print("Usage: crypto <payment_id> <BTC|ETH|USDT>")
            return
        
        payment_id, crypto_type = sys.argv[2:4]
        info = pm.create_crypto_payment(payment_id, crypto_type)
        if info:
            print(f"Send {info['amount']} {info['crypto_type']} to:")
            print(f"  {info['address']}")
            print(f"\nQR Code: {info['qr_code']}")
            print(f"Expires: {info['expires_at']}")
        else:
            print("Payment not found")
    
    elif command == 'verify-crypto':
        if len(sys.argv) < 4:
            print("Usage: verify-crypto <payment_id> <tx_hash>")
            return
        
        payment_id, tx_hash = sys.argv[2:4]
        result = pm.verify_crypto_payment(payment_id, tx_hash)
        print(json.dumps(result, indent=2))
    
    elif command == 'list':
        if len(sys.argv) < 3:
            print("Usage: list <user_id>")
            return
        
        user_id = sys.argv[2]
        payments = pm.get_user_payments(user_id)
        print(f"Payments for {user_id}:")
        for p in payments:
            status = p.get('status', 'unknown')
            amount = p.get('amount', 0)
            method = p.get('method', 'unknown')
            date = p.get('created_at', 'unknown')
            print(f"  [{status}] ${amount} via {method} - {date}")
    
    else:
        print(f"Unknown command: {command}")

# ==================== MAIN ====================
if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'cli':
        cli_main()
    else:
        # Run as web server
        from aiohttp import web
        
        app = web.Application()
        app.router.add_post('/payments/create', handle_create_payment)
        app.router.add_post('/payments/confirm-stripe', handle_confirm_stripe)
        app.router.add_post('/payments/confirm-paypal', handle_confirm_paypal)
        app.router.add_get('/payments/crypto-info', handle_crypto_payment_info)
        app.router.add_post('/payments/verify-crypto', handle_verify_crypto)
        app.router.add_get('/payments/status', handle_payment_status)
        app.router.add_get('/payments/user', handle_user_payments)
        
        PORT = 8766
        print(f"💰 SOULVERSE Payment Processor starting on port {PORT}...")
        web.run_app(app, host='0.0.0.0', port=PORT)
