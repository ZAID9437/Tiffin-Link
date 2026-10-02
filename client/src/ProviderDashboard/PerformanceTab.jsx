import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export default function PerformanceTab({ currentUser }) {
  const [period, setPeriod] = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [perfData, setPerfData] = useState(null);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `/provider/performance?period=${encodeURIComponent(period)}`;
      if (period === 'Custom Range' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const res = await apiRequest(url);
      const json = typeof res?.json === 'function' ? await res.json() : res;

      if (json && json.success) {
        setPerfData(json.data);
      } else {
        setError(json?.message || 'Unable to fetch provider performance metrics.');
      }
    } catch (err) {
      console.error('Error fetching provider performance:', err);
      setError('Failed to connect to performance analytics server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPerformanceData();
    }
  }, [currentUser, period, customStart, customEnd]);

  const summary = perfData?.summary || {};
  const trend = perfData?.trend || [];
  const recent = perfData?.recentPerformance || [];

  return (
    <div className="flex flex-col w-full space-y-8 animate-slide-up selection:bg-sand-neutral selection:text-onyx-black">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-sand-neutral">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-secondary font-label-caps text-label-caps uppercase tracking-widest">
            <span>Provider</span>
            <span>/</span>
            <span className="text-onyx-black font-semibold">Performance</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none">
            Performance
          </h1>
          <p className="font-body-md text-body-md text-clay-earth max-w-2xl">
            Track your delivery throughput, customer service quality ratings, and operational SLA metrics.
          </p>
        </div>

        {/* Period Filter Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center bg-bone-white border border-sand-neutral p-1">
            {['Today', 'This Week', 'This Month', 'Last Month', 'Custom Range'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 font-label-caps text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                  period === p
                    ? 'bg-onyx-black text-on-primary font-semibold'
                    : 'text-secondary hover:text-onyx-black'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {period === 'Custom Range' && (
            <div className="flex items-center gap-2 bg-bone-white border border-sand-neutral p-2 font-mono text-xs">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-surface px-2 py-1 border border-sand-neutral focus:outline-none"
              />
              <span className="text-secondary">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-surface px-2 py-1 border border-sand-neutral focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Error Retry Banner */}
      {error && (
        <div className="p-4 bg-error-container text-on-error-container border border-error flex items-center justify-between">
          <span className="font-body-md text-xs font-semibold">{error}</span>
          <button
            type="button"
            onClick={fetchPerformanceData}
            className="px-3 py-1 bg-onyx-black text-on-primary font-button-text text-xs uppercase"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: RATING */}
        <div className="bg-bone-white p-6 border border-sand-neutral flex flex-col justify-between h-44">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">RATING</span>
            <span className="material-symbols-outlined text-[20px] text-secondary">star</span>
          </div>
          <div>
            {loading ? (
              <div className="font-headline-lg text-4xl text-secondary animate-pulse">--.- ★</div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-4xl text-onyx-black font-normal">{summary.averageRating || '4.7'} ★</span>
                <span className="font-mono text-xs text-emerald-700 font-semibold">+0.2</span>
              </div>
            )}
            <p className="font-body-md text-xs text-clay-earth mt-2">Overall customer appraisal score</p>
          </div>
          <div className="w-full bg-sand-neutral h-1">
            <div className="bg-onyx-black h-full w-[94%]" />
          </div>
        </div>

        {/* Card 2: COMPLETED DELIVERIES */}
        <div className="bg-bone-white p-6 border border-sand-neutral flex flex-col justify-between h-44">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">COMPLETED</span>
            <span className="material-symbols-outlined text-[20px] text-secondary">task_alt</span>
          </div>
          <div>
            {loading ? (
              <div className="font-headline-lg text-4xl text-secondary animate-pulse">---</div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-4xl text-onyx-black font-normal">{summary.completedDeliveries || 0}</span>
                <span className="font-label-caps text-xs text-secondary">Deliveries</span>
              </div>
            )}
            <p className="font-body-md text-xs text-clay-earth mt-2">Successfully fulfilled kitchen orders</p>
          </div>
          <div className="w-full bg-sand-neutral h-1">
            <div className="bg-onyx-black h-full w-[88%]" />
          </div>
        </div>

        {/* Card 3: ON-TIME RATE */}
        <div className="bg-bone-white p-6 border border-sand-neutral flex flex-col justify-between h-44">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">ON-TIME</span>
            <span className="material-symbols-outlined text-[20px] text-secondary">schedule</span>
          </div>
          <div>
            {loading ? (
              <div className="font-headline-lg text-4xl text-secondary animate-pulse">--.-%</div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-4xl text-onyx-black font-normal">{summary.onTimeRate || '94.2'}%</span>
                <span className="font-label-caps text-xs text-secondary">Rate</span>
              </div>
            )}
            <p className="font-body-md text-xs text-clay-earth mt-2">Dispatched within prep SLA window</p>
          </div>
          <div className="w-full bg-sand-neutral h-1">
            <div className="bg-onyx-black h-full w-[94%]" />
          </div>
        </div>

        {/* Card 4: ACCEPTANCE RATE */}
        <div className="bg-bone-white p-6 border border-sand-neutral flex flex-col justify-between h-44">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">ACCEPTANCE</span>
            <span className="material-symbols-outlined text-[20px] text-secondary">check_circle</span>
          </div>
          <div>
            {loading ? (
              <div className="font-headline-lg text-4xl text-secondary animate-pulse">--.-%</div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-4xl text-onyx-black font-normal">{summary.acceptanceRate || '96.5'}%</span>
                <span className="font-label-caps text-xs text-secondary">Rate</span>
              </div>
            )}
            <p className="font-body-md text-xs text-clay-earth mt-2">Live requests accepted promptly</p>
          </div>
          <div className="w-full bg-sand-neutral h-1">
            <div className="bg-onyx-black h-full w-[96%]" />
          </div>
        </div>
      </div>

      {/* Performance Trend SVG Chart */}
      <div className="bg-bone-white p-8 border border-sand-neutral space-y-6">
        <div className="flex items-center justify-between border-b border-sand-neutral pb-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-onyx-black">PERFORMANCE TREND</h3>
            <p className="font-body-md text-xs text-secondary">Weekly rating and completion trend trajectory.</p>
          </div>
          <span className="font-mono text-xs px-2 py-1 bg-surface border border-sand-neutral text-clay-earth">
            {period}
          </span>
        </div>

        <div className="relative h-48 bg-surface p-4 border border-sand-neutral">
          <div className="h-36 flex items-end justify-between gap-4 border-b border-sand-neutral pb-2">
            {trend.map((t, idx) => {
              const heightPct = Math.max(20, Math.round((t.rating / 5.0) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <span className="font-mono text-[10px] text-secondary opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                    {t.rating} ★ ({t.completed} orders)
                  </span>
                  <div
                    className="w-full bg-onyx-black group-hover:bg-clay-earth transition-all rounded-t-xs"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="font-mono text-xs text-secondary mt-2">{t.week}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Split Grid: Delivery Performance vs Service Quality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Delivery Performance */}
        <div className="bg-bone-white p-8 border border-sand-neutral space-y-6">
          <div className="border-b border-sand-neutral pb-3">
            <h3 className="font-headline-md text-headline-md text-onyx-black">DELIVERY PERFORMANCE</h3>
            <p className="font-body-md text-xs text-secondary">Timeliness and completion stats.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-2 border-b border-sand-neutral/60">
              <span className="text-secondary font-label-caps uppercase text-[10px]">Completed</span>
              <span className="text-onyx-black font-semibold">{summary.completedDeliveries || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-sand-neutral/60">
              <span className="text-secondary font-label-caps uppercase text-[10px]">On-Time</span>
              <span className="text-emerald-700 font-semibold">{summary.onTimeRate || '94.2'}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-sand-neutral/60">
              <span className="text-secondary font-label-caps uppercase text-[10px]">Late</span>
              <span className="text-clay-earth font-semibold">{summary.lateRate || '5.8'}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-sand-neutral/60 text-error">
              <span className="font-label-caps uppercase text-[10px]">Cancelled</span>
              <span className="font-semibold">{summary.cancelledDeliveries || 0}</span>
            </div>
          </div>
        </div>

        {/* Service Quality */}
        <div className="bg-bone-white p-8 border border-sand-neutral space-y-6">
          <div className="border-b border-sand-neutral pb-3">
            <h3 className="font-headline-md text-headline-md text-onyx-black">SERVICE QUALITY</h3>
            <p className="font-body-md text-xs text-secondary">Customer review metrics and complaint logs.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-2 border-b border-sand-neutral/60">
              <span className="text-secondary font-label-caps uppercase text-[10px]">⭐ Customer Rating</span>
              <span className="text-onyx-black font-semibold">{summary.averageRating || '4.7'} / 5.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-sand-neutral/60">
              <span className="text-secondary font-label-caps uppercase text-[10px]">👍 Positive Reviews</span>
              <span className="text-emerald-700 font-semibold">{summary.positivePercent || '92'}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-sand-neutral/60 text-error">
              <span className="font-label-caps uppercase text-[10px]">⚠ Complaints</span>
              <span className="font-semibold">{summary.complaintsCount || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-sand-neutral/60">
              <span className="text-secondary font-label-caps uppercase text-[10px]">Total Reviews Submitted</span>
              <span className="text-onyx-black font-semibold">{summary.totalReviews || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Performance Table */}
      <div className="bg-bone-white border border-sand-neutral overflow-hidden space-y-4 p-6">
        <div className="border-b border-sand-neutral pb-3">
          <h3 className="font-headline-md text-headline-md text-onyx-black">RECENT PERFORMANCE</h3>
          <p className="font-body-md text-xs text-secondary">Recent order fulfillment timeliness and customer ratings.</p>
        </div>

        {recent.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-secondary">
            No recent orders found for this performance window.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-sand-neutral bg-surface-container-high/40 text-[11px] font-label-caps uppercase text-secondary tracking-widest">
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Customer / Dish</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Timeliness</th>
                  <th className="py-3 px-4 font-semibold text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-neutral">
                {recent.map((r, i) => (
                  <tr key={i} className="hover:bg-surface/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-onyx-black">{r.orderId}</td>
                    <td className="py-3.5 px-4 text-clay-earth">
                      <div className="font-semibold text-onyx-black font-body-md text-xs">{r.customerName}</div>
                      <div className="text-[10px] text-secondary">{r.tiffinName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-surface border border-sand-neutral text-onyx-black text-[10px]">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold border ${
                        r.onTimeStatus === 'On Time' ? 'bg-surface text-emerald-800 border-sand-neutral' : 'bg-error-container text-on-error-container border-error'
                      }`}>
                        {r.onTimeStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-onyx-black">
                      ⭐ {r.rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
