import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plane, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SeatButton } from '../components/seats/SeatButton';
import { BookingSummary } from '../components/seats/BookingSummary';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SEAT_MULTIPLIERS = { business: 2.5, premium: 1.5, economy: 1.0 };

const SeatGrid = ({ seatsByRow, rows, selectedSeats, onToggle }) => (
  <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-sm overflow-x-auto" data-testid="seat-map">
    <div className="space-y-2">
      {rows.map((row) => {
        const rowSeats = seatsByRow[row].sort((a, b) => a.column.localeCompare(b.column));
        return (
          <div key={row} className="flex items-center gap-2 justify-center">
            <div className="w-8 text-xs font-mono text-neutral-500 text-right">{row}</div>
            {rowSeats.slice(0, 3).map((seat) => (
              <SeatButton key={seat.id} seat={seat} isSelected={selectedSeats.includes(seat.id)} onToggle={onToggle} />
            ))}
            <div className="w-8"></div>
            {rowSeats.slice(3).map((seat) => (
              <SeatButton key={seat.id} seat={seat} isSelected={selectedSeats.includes(seat.id)} onToggle={onToggle} />
            ))}
            <div className="w-8 text-xs font-mono text-neutral-500">{row}</div>
          </div>
        );
      })}
    </div>
  </div>
);

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

  const loadFlightAndSeats = useCallback(async () => {
    try {
      const [flightRes, seatsRes] = await Promise.all([
        axios.get(`${API_URL}/api/flights/${flightId}`),
        axios.get(`${API_URL}/api/flights/${flightId}/seats`),
      ]);
      setFlight(flightRes.data);
      setSeats(seatsRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load flight details');
    } finally {
      setLoading(false);
    }
  }, [flightId]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadFlightAndSeats();
  }, [flightId, user, navigate, loadFlightAndSeats]);

  const toggleSeat = useCallback((seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  }, []);

  const calculateTotal = useCallback(() => {
    if (!flight) return 0;
    return selectedSeats.reduce((total, seatId) => {
      const seat = seats.find((s) => s.id === seatId);
      if (!seat) return total;
      return total + flight.price * (SEAT_MULTIPLIERS[seat.seat_type] || 1.0);
    }, 0);
  }, [flight, seats, selectedSeats]);

  const handleBooking = useCallback(async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }
    setBookingLoading(true);
    setError('');
    try {
      const { data } = await axios.post(
        `${API_URL}/api/bookings`,
        { flight_id: flightId, seat_ids: selectedSeats },
        { withCredentials: true }
      );
      navigate(`/payment/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  }, [selectedSeats, flightId, navigate]);

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

              <SeatGrid seatsByRow={seatsByRow} rows={rows} selectedSeats={selectedSeats} onToggle={toggleSeat} />

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
            <BookingSummary
              seats={seats}
              selectedSeats={selectedSeats}
              calculateTotal={calculateTotal}
              onBook={handleBooking}
              bookingLoading={bookingLoading}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;