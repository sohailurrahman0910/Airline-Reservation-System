import React from 'react';
import { Check } from 'lucide-react';

export const BookingSummary = ({ seats, selectedSeats, calculateTotal, onBook, bookingLoading, error }) => (
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
      onClick={onBook}
      data-testid="confirm-booking-button"
      disabled={selectedSeats.length === 0 || bookingLoading}
      className="w-full bg-blue-600 text-white rounded-sm px-6 py-3 font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {bookingLoading ? 'Processing...' : 'Continue to Payment'}
    </button>
  </div>
);
