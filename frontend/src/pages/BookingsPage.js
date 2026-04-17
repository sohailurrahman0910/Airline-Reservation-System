import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plane, Calendar, MapPin, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BookingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/bookings`, { withCredentials: true });
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-blue-600 text-white rounded-sm flex items-center justify-center">
                <Plane size={20} strokeWidth={1.5} />
              </div>
              <span className="text-xl font-bold tracking-tighter">SkyReserve</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-500">{user?.name}</span>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  data-testid="admin-link"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                data-testid="home-link"
                className="text-sm font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
              >
                Home
              </button>
              <button
                onClick={logout}
                data-testid="logout-button"
                className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-neutral-900 mb-8">My Bookings</h1>

        {loading ? (
          <div className="text-center py-12 text-neutral-500">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-6">You don't have any bookings yet</p>
            <button
              onClick={() => navigate('/')}
              data-testid="book-flight-button"
              className="bg-blue-600 text-white rounded-sm px-6 py-3 font-semibold hover:bg-blue-700 transition-colors"
            >
              Book a Flight
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} data-testid={`booking-${booking.id}`} className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
                <div className="border-b border-neutral-100 p-4 sm:p-6 flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1">Booking ID</div>
                    <div className="text-sm font-mono text-neutral-900">{booking.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        booking.payment_status === 'paid'
                          ? 'bg-emerald-500 text-white px-3 py-1 rounded-sm text-xs font-semibold'
                          : 'bg-amber-500 text-white px-3 py-1 rounded-sm text-xs font-semibold'
                      }
                      data-testid={`booking-status-${booking.id}`}
                    >
                      {booking.payment_status === 'paid' ? 'Confirmed' : 'Pending Payment'}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {booking.flight && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Flight Details</div>
                          <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                            <MapPin size={18} className="text-neutral-400" />
                            {booking.flight.origin} → {booking.flight.destination}
                          </div>
                          <div className="text-sm text-neutral-600 font-mono mt-1">{booking.flight.flight_number}</div>
                        </div>

                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Departure</div>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-neutral-400" />
                            <span className="text-sm text-neutral-900">
                              {format(new Date(booking.flight.departure_time), 'MMM dd, yyyy • HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Seats</div>
                          <div className="flex flex-wrap gap-2">
                            {booking.seat_numbers?.map((seatNumber) => (
                              <div key={seatNumber} className="bg-blue-600 text-white px-3 py-1 rounded-sm font-mono text-sm">
                                {seatNumber}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Total Amount</div>
                          <div className="flex items-center gap-2">
                            <CreditCard size={16} className="text-neutral-400" />
                            <span className="text-2xl font-mono font-bold text-neutral-900">${booking.total_price?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {booking.payment_status !== 'paid' && (
                    <div className="mt-6 pt-6 border-t border-neutral-200">
                      <button
                        onClick={() => navigate(`/payment/${booking.id}`)}
                        data-testid={`complete-payment-${booking.id}`}
                        className="bg-blue-600 text-white rounded-sm px-6 py-2 font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Complete Payment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;