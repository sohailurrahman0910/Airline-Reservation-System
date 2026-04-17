import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Plane } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('checking');
  const [bookingId, setBookingId] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [searchParams, user]);

  const pollPaymentStatus = async (sessionId, currentAttempt = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (currentAttempt >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const { data } = await axios.get(`${API_URL}/api/payments/checkout/status/${sessionId}`, {
        withCredentials: true,
      });

      if (data.payment_status === 'paid') {
        setStatus('success');
        setBookingId(data.booking_id);
        return;
      } else if (data.status === 'expired') {
        setStatus('error');
        return;
      }

      setAttempts(currentAttempt + 1);
      setTimeout(() => pollPaymentStatus(sessionId, currentAttempt + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-sm flex items-center justify-center">
                <Plane size={20} strokeWidth={1.5} />
              </div>
              <span className="text-xl font-bold tracking-tighter">SkyReserve</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {status === 'checking' && (
          <div className="text-center" data-testid="payment-checking">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 text-blue-600 rounded-full mb-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter text-neutral-900 mb-2">Verifying Payment</h1>
            <p className="text-neutral-600">Please wait while we confirm your payment...</p>
            <p className="text-sm text-neutral-500 mt-2">Attempt {attempts + 1} of 5</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center" data-testid="payment-success">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-6">
              <CheckCircle size={48} strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-neutral-900 mb-4">Payment Successful!</h1>
            <p className="text-lg text-neutral-600 mb-8">Your flight has been booked successfully</p>

            <div className="bg-white border border-neutral-200 rounded-sm p-6 mb-8">
              <div className="text-sm text-neutral-600 mb-2">Booking ID</div>
              <div className="text-xl font-mono font-bold text-neutral-900">{bookingId}</div>
            </div>

            <button
              onClick={() => navigate('/bookings')}
              data-testid="view-bookings-button"
              className="bg-blue-600 text-white rounded-sm px-8 py-3 font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
            >
              View My Bookings
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center" data-testid="payment-error">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-100 text-rose-600 rounded-full mb-6">
              <span className="text-4xl">✕</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter text-neutral-900 mb-2">Payment Failed</h1>
            <p className="text-neutral-600 mb-8">There was an issue processing your payment</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white rounded-sm px-8 py-3 font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}

        {status === 'timeout' && (
          <div className="text-center" data-testid="payment-timeout">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 text-amber-600 rounded-full mb-6">
              <span className="text-4xl">⏱</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter text-neutral-900 mb-2">Verification Timeout</h1>
            <p className="text-neutral-600 mb-8">Please check your email for confirmation or contact support</p>
            <button
              onClick={() => navigate('/bookings')}
              className="bg-blue-600 text-white rounded-sm px-8 py-3 font-semibold hover:bg-blue-700 transition-colors"
            >
              View My Bookings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;