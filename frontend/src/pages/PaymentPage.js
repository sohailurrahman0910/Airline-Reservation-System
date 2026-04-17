import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Plane, Smartphone, Building2, CheckCircle, ChevronRight, Shield } from 'lucide-react';
import { useAuth, api } from '../contexts/AuthContext';

const BANKS = [
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra Bank' },
  { id: 'pnb', name: 'Punjab National Bank' },
  { id: 'bob', name: 'Bank of Baroda' },
  { id: 'canara', name: 'Canara Bank' },
];

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [success, setSuccess] = useState(false);
  const [txnId, setTxnId] = useState('');

  const loadBooking = useCallback(async () => {
    try {
      const { data } = await api.get('/api/bookings');
      const b = data.find((x) => x.id === bookingId);
      if (b) {
        if (b.payment_status === 'paid') { setSuccess(true); }
        setBooking(b);
      } else {
        setError('Booking not found');
      }
    } catch { setError('Failed to load booking'); }
    finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadBooking();
  }, [bookingId, user, navigate, loadBooking]);

  const processPayment = async () => {
    setError('');
    if (paymentMethod === 'upi' && !upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g. name@upi)');
      return;
    }
    if (paymentMethod === 'netbanking' && !selectedBank) {
      setError('Please select a bank');
      return;
    }
    if (paymentMethod === 'card') {
      if (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) {
        setError('Please fill in all card details');
        return;
      }
    }

    setProcessing(true);
    try {
      const { data } = await api.post('/api/payments/direct', {
        booking_id: bookingId,
        payment_method: paymentMethod,
        payment_details: paymentMethod === 'upi' ? { upi_id: upiId }
          : paymentMethod === 'netbanking' ? { bank: selectedBank }
          : { last4: cardForm.number.slice(-4) },
      });
      setTxnId(data.transaction_id);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (success) {
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
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-6">
            <CheckCircle size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-neutral-900 mb-4" data-testid="payment-success-heading">Payment Successful!</h1>
          <p className="text-neutral-600 mb-2">Your flight has been booked and confirmed.</p>
          {txnId && <p className="text-xs font-mono text-neutral-500 mb-8">Transaction: {txnId.substring(0, 8)}...</p>}
          <button onClick={() => navigate('/bookings')} data-testid="view-bookings-button" className="bg-blue-600 text-white rounded-sm px-8 py-3 font-semibold hover:bg-blue-700 transition-colors">
            View My Bookings
          </button>
        </div>
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-neutral-900 mb-2 text-center">Checkout</h1>
        <p className="text-neutral-500 text-center mb-10">Choose your preferred payment method</p>

        {booking && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Payment Methods - Left */}
            <div className="lg:col-span-3 space-y-6">
              {error && (
                <div data-testid="payment-error" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-sm text-sm">{error}</div>
              )}

              {/* Method Tabs */}
              <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
                <div className="flex border-b border-neutral-200">
                  {[
                    { key: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                    { key: 'upi', label: 'UPI', icon: Smartphone },
                    { key: 'netbanking', label: 'Net Banking', icon: Building2 },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      data-testid={`tab-${key}`}
                      onClick={() => { setPaymentMethod(key); setError(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-colors ${
                        paymentMethod === key
                          ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* Card Form */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-4" data-testid="card-form">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Card Number</label>
                        <input
                          data-testid="card-number-input"
                          type="text"
                          maxLength={19}
                          placeholder="1234 5678 9012 3456"
                          value={cardForm.number}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').substring(0, 16);
                            setCardForm({ ...cardForm, number: v.replace(/(.{4})/g, '$1 ').trim() });
                          }}
                          className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent w-full font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Cardholder Name</label>
                        <input
                          data-testid="card-name-input"
                          type="text"
                          placeholder="John Doe"
                          value={cardForm.name}
                          onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                          className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent w-full"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Expiry</label>
                          <input
                            data-testid="card-expiry-input"
                            type="text"
                            maxLength={5}
                            placeholder="MM/YY"
                            value={cardForm.expiry}
                            onChange={(e) => {
                              let v = e.target.value.replace(/\D/g, '').substring(0, 4);
                              if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
                              setCardForm({ ...cardForm, expiry: v });
                            }}
                            className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent w-full font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">CVV</label>
                          <input
                            data-testid="card-cvv-input"
                            type="password"
                            maxLength={4}
                            placeholder="***"
                            value={cardForm.cvv}
                            onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })}
                            className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent w-full font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI Form */}
                  {paymentMethod === 'upi' && (
                    <div className="space-y-4" data-testid="upi-form">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">UPI ID</label>
                        <input
                          data-testid="upi-id-input"
                          type="text"
                          placeholder="yourname@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent w-full"
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                          <button
                            key={app}
                            data-testid={`upi-app-${app.toLowerCase().replace(' ', '')}`}
                            onClick={() => setUpiId(`user@${app.toLowerCase().replace(' ', '')}`)}
                            className="border border-neutral-200 rounded-sm px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                          >
                            {app}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Net Banking */}
                  {paymentMethod === 'netbanking' && (
                    <div className="space-y-2" data-testid="netbanking-form">
                      <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-3">Select Your Bank</label>
                      {BANKS.map((bank) => (
                        <button
                          key={bank.id}
                          data-testid={`bank-${bank.id}`}
                          onClick={() => setSelectedBank(bank.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 border rounded-sm transition-colors text-left ${
                            selectedBank === bank.id
                              ? 'border-blue-600 bg-blue-50 text-blue-900'
                              : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                          }`}
                        >
                          <span className="text-sm font-medium">{bank.name}</span>
                          <ChevronRight size={16} className={selectedBank === bank.id ? 'text-blue-600' : 'text-neutral-400'} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={processPayment}
                data-testid="proceed-payment-button"
                disabled={processing || booking.payment_status === 'paid'}
                className="w-full bg-blue-600 text-white rounded-sm px-6 py-4 font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>Pay ${booking.total_price?.toFixed(2)}</>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
                <Shield size={14} />
                <span>Payments are secured with 256-bit SSL encryption</span>
              </div>
            </div>

            {/* Order Summary - Right */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-neutral-200 rounded-sm p-6 sticky top-24">
                <h2 className="text-lg font-bold tracking-tighter text-neutral-900 mb-4">Order Summary</h2>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1">Flight</div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {booking.flight?.origin} &rarr; {booking.flight?.destination}
                    </div>
                    <div className="text-xs text-neutral-500 font-mono">{booking.flight?.flight_number}</div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1">Seats</div>
                    <div className="flex flex-wrap gap-1">
                      {booking.seat_numbers?.map((s) => (
                        <span key={s} data-testid={`payment-seat-${s}`} className="bg-blue-600 text-white px-2 py-0.5 rounded-sm font-mono text-xs">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Subtotal ({booking.seat_numbers?.length} seats)</span>
                      <span className="font-mono">${booking.total_price?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Service fee</span>
                      <span className="font-mono text-emerald-600">$0.00</span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-4 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Total</span>
                    <span className="text-2xl font-mono font-bold text-neutral-900" data-testid="payment-total">${booking.total_price?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;