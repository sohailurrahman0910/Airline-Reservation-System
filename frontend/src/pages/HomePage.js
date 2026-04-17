import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Search, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [flights, setFlights] = useState([]);
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    date: '',
  });
  const [loading, setLoading] = useState(false);

  const loadFlights = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (params.origin) queryParams.append('origin', params.origin);
      if (params.destination) queryParams.append('destination', params.destination);
      if (params.date) queryParams.append('date', params.date);

      const { data } = await api.get(`/api/flights?${queryParams.toString()}`);
      setFlights(data);
    } catch (error) {
      console.error('Error loading flights:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadFlights(searchParams);
  };

  const handleFlightSelect = (flightId) => {
    navigate(`/flights/${flightId}/seats`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-sm flex items-center justify-center">
                <Plane size={20} strokeWidth={1.5} />
              </div>
              <span className="text-xl font-bold tracking-tighter">SkyReserve</span>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <>
                  <span className="text-sm text-neutral-500">{user.name}</span>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => navigate('/admin')}
                      data-testid="admin-dashboard-link"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/bookings')}
                    data-testid="my-bookings-link"
                    className="text-sm font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
                  >
                    My Bookings
                  </button>
                  <button
                    onClick={logout}
                    data-testid="logout-button"
                    className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
              {!user && (
                <button
                  onClick={() => navigate('/login')}
                  data-testid="login-button"
                  className="bg-blue-600 text-white rounded-sm px-4 py-2 font-semibold hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div
        className="relative bg-cover bg-center h-96"
        style={{ backgroundImage: `url('https://static.prod-images.emergentagent.com/jobs/76a9827d-09fd-491d-9473-8f95306785ac/images/8a57cb654ab2e35056c52ae522ea721ada87903ea5e4a1f5edad36459b8c814a.png')` }}
      >
        <div className="absolute inset-0 bg-white/70"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-neutral-900 mb-4">
            Book Your Next Flight
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl">
            Search and reserve seats on flights worldwide with our simple booking platform
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="bg-white border border-neutral-200 rounded-sm p-6">
          <form onSubmit={handleSearch} data-testid="flight-search-form" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                From
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  data-testid="search-origin-input"
                  value={searchParams.origin}
                  onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                  className="bg-white border border-neutral-200 rounded-sm pl-10 pr-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all w-full"
                  placeholder="New York"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                To
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  data-testid="search-destination-input"
                  value={searchParams.destination}
                  onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                  className="bg-white border border-neutral-200 rounded-sm pl-10 pr-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all w-full"
                  placeholder="London"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="date"
                  data-testid="search-date-input"
                  value={searchParams.date}
                  onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                  className="bg-white border border-neutral-200 rounded-sm pl-10 pr-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all w-full"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                data-testid="search-flights-button"
                className="w-full bg-blue-600 text-white rounded-sm px-6 py-3 font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Search size={20} />
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter text-neutral-900 mb-8">
            Available Flights
          </h2>

          {loading ? (
            <div className="text-center py-12 text-neutral-500">Loading flights...</div>
          ) : flights.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">No flights found</div>
          ) : (
            <div className="space-y-4">
              {flights.map((flight) => (
                <div
                  key={flight.id}
                  data-testid={`flight-card-${flight.id}`}
                  className="flex flex-col md:flex-row items-center justify-between p-6 border border-neutral-200 bg-white hover:border-neutral-300 transition-colors rounded-sm"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <div className="flex flex-col items-start justify-center">
                      <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1">
                        {flight.origin}
                      </div>
                      <div className="text-3xl font-mono font-bold text-neutral-900">
                        {new Date(flight.departure_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {format(new Date(flight.departure_time), 'MMM dd, yyyy')}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                        {flight.duration}
                      </div>
                      <div className="w-full border-t-2 border-dashed border-neutral-200 relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-neutral-50 px-2">
                          <Plane size={16} className="text-neutral-400" />
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500 mt-2 font-mono">{flight.flight_number}</div>
                    </div>

                    <div className="flex flex-col items-start md:items-end justify-center">
                      <div className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1">
                        {flight.destination}
                      </div>
                      <div className="text-3xl font-mono font-bold text-neutral-900">
                        {new Date(flight.arrival_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {format(new Date(flight.arrival_time), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 md:mt-0 md:ml-8 flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-neutral-900">${flight.price}</div>
                      <div className="text-xs text-neutral-500">per seat</div>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {flight.available_seats} seats left
                    </div>
                    <button
                      onClick={() => handleFlightSelect(flight.id)}
                      data-testid={`select-flight-${flight.id}`}
                      className="bg-blue-600 text-white rounded-sm px-6 py-2 font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Select Seats
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="mt-24 border-t border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-neutral-500">
            © 2026 SkyReserve. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;