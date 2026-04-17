import React from 'react';

export const BookingsTable = ({ bookings }) => (
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
                {booking.flight?.origin} &rarr; {booking.flight?.destination}
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
);
