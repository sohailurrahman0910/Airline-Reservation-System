import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Plane } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadBooking();
  }, [bookingId, user]);

  const loadBooking = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/bookings`, { withCredentials: true });
      const currentBooking = data.find((b) => b.id === bookingId);
      if (currentBooking) {
        setBooking(currentBooking);
      } else {
        setError('Booking not found');
      }
    } catch (error) {
      setError('Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    setError('');

    try {
      const originUrl = window.location.origin;
      const { data } = await axios.post(
        `${API_URL}/api/payments/checkout`,
        {
          booking_id: bookingId,
          origin_url: originUrl,
        },
        { withCredentials: true }
      );

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create payment session');
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-rose-600">{error}</div>
      </div>
    );
  }

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
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-neutral-900 mb-4">
            Complete Payment
          </h1>
          <p className="text-lg text-neutral-600">Review your booking and proceed to payment</p>
        </div>

        {booking && (
          <div className="bg-white border border-neutral-200 rounded-sm p-8">
            {error && (
              <div data-testid="payment-error" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-sm text-sm mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Flight Details</div>
                <div className="text-lg font-semibold text-neutral-900">
                  {booking.flight?.origin} → {booking.flight?.destination}
                </div>
                <div className="text-sm text-neutral-600 font-mono">{booking.flight?.flight_number}</div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Selected Seats</div>
                <div className="flex flex-wrap gap-2">
                  {booking.seat_numbers?.map((seatNumber) => (
                    <div
                      key={seatNumber}
                      data-testid={`payment-seat-${seatNumber}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-sm font-mono font-semibold"
                    >
                      {seatNumber}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-neutral-600">Subtotal</span>
                  <span className="text-lg font-mono text-neutral-900">${booking.total_price?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Total Amount</span>
                  <span className="text-3xl font-mono font-bold text-neutral-900" data-testid="payment-total">
                    ${booking.total_price?.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                data-testid="proceed-payment-button"
                disabled={processingPayment || booking.payment_status === 'paid'}
                className="w-full bg-blue-600 text-white rounded-sm px-6 py-4 font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard size={20} />
                {processingPayment ? 'Redirecting to payment...' : booking.payment_status === 'paid' ? 'Already Paid' : 'Pay with Stripe'}
              </button>

              {booking.payment_status === 'paid' && (
                <div className="text-center text-sm text-emerald-600 font-semibold">Booking confirmed!</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;