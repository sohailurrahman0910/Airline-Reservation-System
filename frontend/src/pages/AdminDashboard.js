import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plane, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { StatsGrid } from '../components/admin/StatsGrid';
import { FlightForm, INITIAL_FORM } from '../components/admin/FlightForm';
import { FlightTable } from '../components/admin/FlightTable';
import { BookingsTable } from '../components/admin/BookingsTable';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [flightForm, setFlightForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  const handleFlightSubmit = useCallback(async (e) => {
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
      setFlightForm(INITIAL_FORM);
      loadData();
    } catch (error) {
      console.error('Error creating flight:', error);
    }
  }, [flightForm, loadData]);

  const handleDeleteFlight = useCallback(async (flightId) => {
    if (!window.confirm('Are you sure you want to delete this flight?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/flights/${flightId}`, { withCredentials: true });
      loadData();
    } catch (error) {
      console.error('Error deleting flight:', error);
    }
  }, [loadData]);

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

        {stats && <StatsGrid stats={stats} />}

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
              <FlightForm
                flightForm={flightForm}
                setFlightForm={setFlightForm}
                onSubmit={handleFlightSubmit}
                onCancel={() => setShowFlightForm(false)}
              />
            )}

            <FlightTable flights={flights} onDelete={handleDeleteFlight} />
          </div>
        )}

        {activeTab === 'bookings' && <BookingsTable bookings={bookings} />}
      </div>
    </div>
  );
};

export default AdminDashboard;