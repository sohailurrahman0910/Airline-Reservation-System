import React from 'react';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export const FlightTable = ({ flights, onDelete }) => (
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
              {flight.origin} &rarr; {flight.destination}
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
                onClick={() => onDelete(flight.id)}
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
);
