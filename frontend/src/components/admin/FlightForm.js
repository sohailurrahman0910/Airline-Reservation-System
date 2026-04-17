import React from 'react';

const INITIAL_FORM = {
  flight_number: '',
  origin: '',
  destination: '',
  departure_time: '',
  arrival_time: '',
  price: '',
  aircraft_type: 'Boeing 737',
  total_seats: 180,
};

export const FlightForm = ({ flightForm, setFlightForm, onSubmit, onCancel }) => (
  <div className="bg-white border border-neutral-200 rounded-sm p-6 mb-6">
    <h3 className="text-xl font-bold tracking-tighter text-neutral-900 mb-4">Create New Flight</h3>
    <form onSubmit={onSubmit} data-testid="flight-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          onClick={onCancel}
          className="border border-neutral-200 text-neutral-900 rounded-sm px-6 py-3 font-semibold hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
);

export { INITIAL_FORM };
