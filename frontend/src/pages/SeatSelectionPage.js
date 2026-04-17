import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plane, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SeatSelectionPage = () => {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [flight, setFlight] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadFlightAndSeats();
  }, [flightId, user]);

  const loadFlightAndSeats = async () => {
    try {
      const [flightRes, seatsRes] = await Promise.all([
        axios.get(`${API_URL}/api/flights/${flightId}`),
        axios.get(`${API_URL}/api/flights/${flightId}/seats`),
      ]);
      setFlight(flightRes.data);
      setSeats(seatsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load flight details');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const calculateTotal = () => {
    if (!flight) return 0;
    let total = 0;
    selectedSeats.forEach((seatId) => {
      const seat = seats.find((s) => s.id === seatId);
      if (seat) {
        if (seat.seat_type === 'business') {
          total += flight.price * 2.5;
        } else if (seat.seat_type === 'premium') {
          total += flight.price * 1.5;
        } else {
          total += flight.price;
        }
      }
    });
    return total;
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    setBookingLoading(true);
    setError('');

    try {
      const { data } = await axios.post(
        `${API_URL}/api/bookings`,
        {
          flight_id: flightId,
          seat_ids: selectedSeats,
        },
        { withCredentials: true }
      );
      navigate(`/payment/${data.id}`);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (error && !flight) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-rose-600">{error}</div>
      </div>
    );
  }

  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const rows = Object.keys(seatsByRow).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              data-testid="back-button"
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">Back to Flights</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-sm flex items-center justify-center">
                <Plane size={20} strokeWidth={1.5} />
              </div>
              <span className="text-xl font-bold tracking-tighter">SkyReserve</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {flight && (
          <div className="bg-white border border-neutral-200 rounded-sm p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter text-neutral-900 mb-2">
                  Select Your Seats
                </h1>
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span className="font-mono font-bold">{flight.flight_number}</span>
                  <span>•</span>
                  <span>
                    {flight.origin} → {flight.destination}
                  </span>
                  <span>•</span>
                  <span>{flight.duration}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1">Base Price</div>
                <div className="text-2xl font-mono font-bold text-neutral-900">${flight.price}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-neutral-200 rounded-sm p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tighter text-neutral-900 mb-4">Seat Map</h2>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-neutral-300 rounded-t-lg rounded-b-sm bg-white"></div>
                    <span className="text-neutral-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-600 bg-blue-600 rounded-t-lg rounded-b-sm"></div>
                    <span className="text-neutral-600">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border border-neutral-200 bg-neutral-100 rounded-t-lg rounded-b-sm"></div>
                    <span className="text-neutral-600">Occupied</span>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-sm overflow-x-auto" data-testid="seat-map">
                <div className="space-y-2">
                  {rows.map((row) => {
                    const rowSeats = seatsByRow[row].sort((a, b) => a.column.localeCompare(b.column));
                    return (
                      <div key={row} className="flex items-center gap-2 justify-center">
                        <div className="w-8 text-xs font-mono text-neutral-500 text-right">{row}</div>
                        {rowSeats.slice(0, 3).map((seat) => (
                          <button
                            key={seat.id}
                            data-testid={`seat-${seat.seat_number}`}
                            disabled={!seat.is_available}
                            onClick={() => toggleSeat(seat.id)}
                            className={
                              selectedSeats.includes(seat.id)
                                ? 'w-10 h-10 border-2 border-blue-600 bg-blue-600 text-white rounded-t-lg rounded-b-sm shadow-md flex items-center justify-center font-mono text-xs font-bold transition-all'
                                : seat.is_available
                                ? `w-10 h-10 border-2 rounded-t-lg rounded-b-sm bg-white hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer flex items-center justify-center font-mono text-xs text-neutral-500 ${
                                    seat.seat_type === 'premium' ? 'border-amber-400 bg-amber-50 hover:bg-amber-100' : 'border-neutral-300'
                                  }`
                                : 'w-10 h-10 border border-neutral-200 bg-neutral-100 text-neutral-400 rounded-t-lg rounded-b-sm cursor-not-allowed flex items-center justify-center font-mono text-xs'
                            }
                          >
                            {seat.column}
                          </button>
                        ))}
                        <div className="w-8"></div>
                        {rowSeats.slice(3).map((seat) => (
                          <button
                            key={seat.id}
                            data-testid={`seat-${seat.seat_number}`}
                            disabled={!seat.is_available}
                            onClick={() => toggleSeat(seat.id)}
                            className={
                              selectedSeats.includes(seat.id)
                                ? 'w-10 h-10 border-2 border-blue-600 bg-blue-600 text-white rounded-t-lg rounded-b-sm shadow-md flex items-center justify-center font-mono text-xs font-bold transition-all'
                                : seat.is_available
                                ? `w-10 h-10 border-2 rounded-t-lg rounded-b-sm bg-white hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer flex items-center justify-center font-mono text-xs text-neutral-500 ${
                                    seat.seat_type === 'premium' ? 'border-amber-400 bg-amber-50 hover:bg-amber-100' : 'border-neutral-300'
                                  }`
                                : 'w-10 h-10 border border-neutral-200 bg-neutral-100 text-neutral-400 rounded-t-lg rounded-b-sm cursor-not-allowed flex items-center justify-center font-mono text-xs'
                            }
                          >
                            {seat.column}
                          </button>
                        ))}
                        <div className="w-8 text-xs font-mono text-neutral-500">{row}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-sm">
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-blue-900 mb-2">Seat Classes</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-neutral-900">Economy</div>
                    <div className="text-neutral-600">Base price</div>
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">Premium</div>
                    <div className="text-neutral-600">1.5x base price</div>
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">Business</div>
                    <div className="text-neutral-600">2.5x base price</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-200 rounded-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold tracking-tighter text-neutral-900 mb-4">Booking Summary</h2>

              {error && (
                <div data-testid="booking-error" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-sm text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Selected Seats</div>
                  {selectedSeats.length === 0 ? (
                    <div className="text-sm text-neutral-500">No seats selected</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((seatId) => {
                        const seat = seats.find((s) => s.id === seatId);
                        return (
                          <div
                            key={seatId}
                            data-testid={`selected-seat-${seat?.seat_number}`}
                            className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-sm text-sm font-mono"
                          >
                            {seat?.seat_number}
                            <Check size={14} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-neutral-600">Seats ({selectedSeats.length})</span>
                    <span className="text-sm font-mono text-neutral-900">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Total</span>
                    <span className="text-2xl font-mono font-bold text-neutral-900" data-testid="total-price">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBooking}
                data-testid="confirm-booking-button"
                disabled={selectedSeats.length === 0 || bookingLoading}
                className="w-full bg-blue-600 text-white rounded-sm px-6 py-3 font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;