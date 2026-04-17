import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plane, Plus, Users, DollarSign, Package, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [flightForm, setFlightForm] = useState({
    flight_number: '',
    origin: '',
    destination: '',
    departure_time: '',
    arrival_time: '',
    price: '',
    aircraft_type: 'Boeing 737',
    total_seats: 180,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [statsRes, flightsRes, bookingsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/flights`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/bookings`, { withCredentials: true }),
      ]);
      setStats(statsRes.data);
      setFlights(flightsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlightSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/api/admin/flights`,
        {
          ...flightForm,
          price: parseFloat(flightForm.price),
          total_seats: parseInt(flightForm.total_seats),
          departure_time: new Date(flightForm.departure_time).toISOString(),
          arrival_time: new Date(flightForm.arrival_time).toISOString(),
        },
        { withCredentials: true }
      );
      setShowFlightForm(false);
      setFlightForm({
        flight_number: '',
        origin: '',
        destination: '',
        departure_time: '',
        arrival_time: '',
        price: '',
        aircraft_type: 'Boeing 737',
        total_seats: 180,
      });
      loadData();
    } catch (error) {
      console.error('Error creating flight:', error);
    }
  };

  const handleDeleteFlight = async (flightId) => {
    if (!window.confirm('Are you sure you want to delete this flight?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/flights/${flightId}`, { withCredentials: true });
      loadData();
    } catch (error) {
      console.error('Error deleting flight:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-sm flex items-center justify-center">
                <Plane size={20} strokeWidth={1.5} />
              </div>
              <span className="text-xl font-bold tracking-tighter">Admin Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-500">{user?.name}</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-neutral-900 mb-8">Control Room</h1>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-neutral-200 rounded-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1">Total Flights</div>
                  <div className="text-3xl font-mono font-bold text-neutral-900" data-testid="stat-total-flights">
                    {stats.total_flights}
                  </div>
                </div>
                <Package size={32} className="text-blue-600" strokeWidth={1.5} />
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1">Total Bookings</div>
                  <div className="text-3xl font-mono font-bold text-neutral-900" data-testid="stat-total-bookings">
                    {stats.total_bookings}
                  </div>
                </div>
                <Users size={32} className="text-blue-600" strokeWidth={1.5} />
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1">Confirmed</div>
                  <div className="text-3xl font-mono font-bold text-emerald-600" data-testid="stat-confirmed-bookings">
                    {stats.confirmed_bookings}
                  </div>
                </div>
                <Users size={32} className="text-emerald-600" strokeWidth={1.5} />
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1">Total Revenue</div>
                  <div className="text-3xl font-mono font-bold text-neutral-900" data-testid="stat-total-revenue">
                    ${stats.total_revenue}
                  </div>
                </div>
                <DollarSign size={32} className="text-blue-600" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-neutral-200 rounded-sm mb-6">
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('overview')}
              data-testid="tab-overview"
              className={`px-6 py-3 font-semibold text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Flights
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              data-testid="tab-bookings"
              className={`px-6 py-3 font-semibold text-sm transition-colors ${
                activeTab === 'bookings'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Bookings
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-neutral-900">Flight Management</h2>
              <button
                onClick={() => setShowFlightForm(!showFlightForm)}
                data-testid="add-flight-button"
                className="bg-blue-600 text-white rounded-sm px-4 py-2 font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Add Flight
              </button>
            </div>

            {showFlightForm && (
              <div className="bg-white border border-neutral-200 rounded-sm p-6 mb-6">
                <h3 className="text-xl font-bold tracking-tighter text-neutral-900 mb-4">Create New Flight</h3>
                <form onSubmit={handleFlightSubmit} data-testid="flight-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Flight Number</label>
                    <input
                      type="text"
                      data-testid="flight-number-input"
                      value={flightForm.flight_number}
                      onChange={(e) => setFlightForm({ ...flightForm, flight_number: e.target.value })}
                      className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Aircraft Type</label>
                    <input
                      type="text"
                      value={flightForm.aircraft_type}
                      onChange={(e) => setFlightForm({ ...flightForm, aircraft_type: e.target.value })}
                      className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Origin</label>
                    <input
                      type="text"
                      data-testid="origin-input"
                      value={flightForm.origin}
                      onChange={(e) => setFlightForm({ ...flightForm, origin: e.target.value })}
                      className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Destination</label>
                    <input
                      type="text"
                      data-testid="destination-input"
                      value={flightForm.destination}
                      onChange={(e) => setFlightForm({ ...flightForm, destination: e.target.value })}
                      className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Departure Time</label>
                    <input
                      type="datetime-local"
                      data-testid="departure-time-input"
                      value={flightForm.departure_time}
                      onChange={(e) => setFlightForm({ ...flightForm, departure_time: e.target.value })}
                      className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Arrival Time</label>
                    <input
                      type="datetime-local"
                      data-testid="arrival-time-input"
                      value={flightForm.arrival_time}
                      onChange={(e) => setFlightForm({ ...flightForm, arrival_time: e.target.value })}
                      className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Price (USD)</label>
                    <input
                      type="number"
                      data-testid="price-input"
                      step="0.01"
                      value={flightForm.price}
                      onChange={(e) => setFlightForm({ ...flightForm, price: e.target.value })}
                      className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">Total Seats</label>
                    <input
                      type="number"
                      value={flightForm.total_seats}
                      onChange={(e) => setFlightForm({ ...flightForm, total_seats: e.target.value })}
                      className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 w-full"
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-4">
                    <button
                      type="submit"
                      data-testid="submit-flight-button"
                      className="bg-blue-600 text-white rounded-sm px-6 py-3 font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Create Flight
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFlightForm(false)}
                      className="border border-neutral-200 text-neutral-900 rounded-sm px-6 py-3 font-semibold hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Flight</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Departure</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Seats</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map((flight) => (
                    <tr key={flight.id} data-testid={`flight-row-${flight.id}`} className="border-b border-neutral-100">
                      <td className="px-6 py-4 font-mono text-sm text-neutral-900">{flight.flight_number}</td>
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        {flight.origin} → {flight.destination}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {format(new Date(flight.departure_time), 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-neutral-900">${flight.price}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {flight.available_seats}/{flight.total_seats}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteFlight(flight.id)}
                          data-testid={`delete-flight-${flight.id}`}
                          className="text-rose-600 hover:text-rose-700 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-neutral-900 mb-6">All Bookings</h2>
            <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Booking ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Flight</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Seats</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} data-testid={`booking-row-${booking.id}`} className="border-b border-neutral-100">
                      <td className="px-6 py-4 font-mono text-xs text-neutral-900">{booking.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4 text-sm text-neutral-900">{booking.user?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        {booking.flight?.origin} → {booking.flight?.destination}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-neutral-600">{booking.seat_numbers?.join(', ')}</td>
                      <td className="px-6 py-4 font-mono text-sm text-neutral-900">${booking.total_price?.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            booking.payment_status === 'paid'
                              ? 'bg-emerald-500 text-white px-2 py-1 rounded-sm text-xs font-semibold'
                              : 'bg-amber-500 text-white px-2 py-1 rounded-sm text-xs font-semibold'
                          }
                        >
                          {booking.payment_status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;