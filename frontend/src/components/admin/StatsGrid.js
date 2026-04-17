import React from 'react';
import { Package, Users, DollarSign } from 'lucide-react';

export const StatsGrid = ({ stats }) => (
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
);
