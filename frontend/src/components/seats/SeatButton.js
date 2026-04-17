import React from 'react';

const getSeatClassName = (seat, isSelected) => {
  if (isSelected) {
    return 'w-10 h-10 border-2 border-blue-600 bg-blue-600 text-white rounded-t-lg rounded-b-sm shadow-md flex items-center justify-center font-mono text-xs font-bold transition-all';
  }
  if (!seat.is_available) {
    return 'w-10 h-10 border border-neutral-200 bg-neutral-100 text-neutral-400 rounded-t-lg rounded-b-sm cursor-not-allowed flex items-center justify-center font-mono text-xs';
  }
  const premiumClass = seat.seat_type === 'premium' ? 'border-amber-400 bg-amber-50 hover:bg-amber-100' : 'border-neutral-300';
  return `w-10 h-10 border-2 rounded-t-lg rounded-b-sm bg-white hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer flex items-center justify-center font-mono text-xs text-neutral-500 ${premiumClass}`;
};

export const SeatButton = ({ seat, isSelected, onToggle }) => (
  <button
    data-testid={`seat-${seat.seat_number}`}
    disabled={!seat.is_available}
    onClick={() => onToggle(seat.id)}
    className={getSeatClassName(seat, isSelected)}
  >
    {seat.column}
  </button>
);
