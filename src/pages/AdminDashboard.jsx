import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Factory,
  AlertTriangle,
  ArrowUpRight,
  ShoppingBag,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  PackageCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Activity,
  Calendar,
  Box,
  Ticket
} from 'lucide-react';
import api from '../api/client';

// Helper to generate smooth cubic Bezier spline passing precisely through all data points
function generateSplinePath(pts) {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const dx = (p1.x - p0.x) * 0.4;
    d += ` C ${p0.x + dx},${p0.y} ${p1.x - dx},${p1.y} ${p1.x},${p1.y}`;
  }
  return d;
}

function generateAreaPath(pts, baselineY) {
  if (!pts || pts.length === 0) return '';
  const line = generateSplinePath(pts);
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${line} L ${last.x},${baselineY} L ${first.x},${baselineY} Z`;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, ordRes, txRes] = await Promise.allSettled([
        api.get('/api/inventory/dashboard/summary', { auth: 'admin' }),
        api.get('/api/orders?limit=10', { auth: 'admin' }),
        api.get('/api/inventory/transactions?limit=15', { auth: 'admin' })
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.success) {
        setSummaryData(sumRes.value.data);
      }
      if (ordRes.status === 'fulfilled' && ordRes.value?.success) {
        setRecentOrders(ordRes.value.data || []);
      }
      if (txRes.status === 'fulfilled' && txRes.value?.success) {
        setRecentTransactions(txRes.value.data || []);
      }
    } catch (e) {
      console.error('Error fetching admin dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute metrics from summaryData
  const totalStockPcs = summaryData?.total_stock_pcs ?? 2450;
  const totalStockLots = Math.round(totalStockPcs / 25);
  const todayProd = summaryData?.today_production || {
    completed_lots: 16,
    planned_lots: 18,
    capacity_lots: 20,
    max_capacity_lots: 24
  };
  const criticalProducts = summaryData?.critical_products || [];
  const warningProducts = summaryData?.warning_products || [];
  const allProducts = summaryData?.all_products || [];

  const totalOutTodayPcs = summaryData?.total_out_pcs ?? 680;
  const channelDist = summaryData?.channel_distribution || {
    shopee: 250,
    tiktok: 180,
    po_b2b: 150,
    offline: 60,
    web: 30,
    waste: 10
  };

  // 7-day trend data from real backend summary or fallback
  const chartDays = (summaryData?.movement_7d && summaryData.movement_7d.length > 0)
    ? summaryData.movement_7d
    : [
      { day: '15 Sep', inQty: 0, outQty: 3 },
      { day: '16 Sep', inQty: 0, outQty: 0 },
      { day: '17 Sep', inQty: 4, outQty: 44 },
      { day: '18 Sep', inQty: 3, outQty: 31 },
      { day: '19 Sep', inQty: 0, outQty: 18 },
      { day: '20 Sep', inQty: 12, outQty: 9 },
      { day: '21 Sep', inQty: 535, outQty: totalOutTodayPcs || 495 }
    ];

  // Dynamic SVG Chart Geometry Calculations
  const chartWidth = 500;
  const chartHeight = 200;
  const padX = 38;
  const usableWidth = chartWidth - padX * 2;
  const baselineY = 170;
  const paddingTop = 30;
  const heightRange = baselineY - paddingTop;
  const nDays = chartDays.length;
  const stepX = nDays > 1 ? usableWidth / (nDays - 1) : usableWidth;

  // Find max value in dataset to determine scale ceiling
  const rawMax = Math.max(50, ...chartDays.map(d => Math.max(d.inQty || 0, d.outQty || 0)));
  const scaleCeiling = rawMax > 400 ? 600 : rawMax > 200 ? 400 : rawMax > 100 ? 200 : 100;

  // Soft root scaling: keeps variation in 0-100 range clearly readable while handling 500+ spikes
  const getYPos = (val) => {
    if (!val || val <= 0) return baselineY;
    const ratio = Math.sqrt(Math.min(val, scaleCeiling)) / Math.sqrt(scaleCeiling);
    return baselineY - ratio * heightRange;
  };
  const inPoints = chartDays.map((d, i) => {
    const x = padX + (nDays > 1 ? (i / (nDays - 1)) * usableWidth : usableWidth / 2);
    const y = getYPos(d.inQty || 0);
    return { x, y, ...d };
  });

  const outPoints = chartDays.map((d, i) => {
    const x = padX + (nDays > 1 ? (i / (nDays - 1)) * usableWidth : usableWidth / 2);
    const y = getYPos(d.outQty || 0);
    return { x, y, ...d };
  });

  const inLinePath = generateSplinePath(inPoints);
  const inAreaPath = generateAreaPath(inPoints, baselineY);

  const outLinePath = generateSplinePath(outPoints);
  const outAreaPath = generateAreaPath(outPoints, baselineY);

  // Clean, consistent, round Y-axis intervals for clear readability
  const yTicks = scaleCeiling >= 500
    ? [0, 50, 200, 400, 600]
    : scaleCeiling >= 300
      ? [0, 50, 150, 300, 400]
      : [0, 25, 50, 100, scaleCeiling];

  // Average daily flow for reference line
  const avgOut = Math.round(chartDays.reduce((acc, d) => acc + (d.outQty || 0), 0) / (nDays || 1));

  // Channel distribution for Donut Chart
  const channelEntries = [
    { label: 'Shopee', count: channelDist.shopee || 0, color: '#F97316' },
    { label: 'TikTok Shop', count: channelDist.tiktok || 0, color: '#EC4899' },
    { label: 'PO B2B', count: channelDist.po_b2b || 0, color: '#2563EB' },
    { label: 'Offline / Lapak', count: channelDist.offline || 0, color: '#059669' },
    { label: 'Website', count: channelDist.web || 0, color: '#6366F1' },
    { label: 'Barang Rusak', count: channelDist.waste || 0, color: '#9CA3AF' }
  ].filter(c => c.count > 0 || c.label === 'Shopee');

  const totalChannelOut = channelEntries.reduce((sum, c) => sum + c.count, 0) || 1;

  // Format currency
  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);

  // Quick capacity calculations
  const normalCapacity = todayProd.capacity_lots || 20;
  const completedLots = todayProd.completed_lots ?? 0;
  const plannedLots = todayProd.planned_lots ?? 0;
  const capacityPercent = Math.min(100, Math.round((completedLots / normalCapacity) * 100));
  const remainingNormalLots = Math.max(0, normalCapacity - completedLots);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 sm:p-7 rounded-card border border-bg-cream-dark/80 shadow-card">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary font-heading tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-btn border border-bg-cream-dark/90 bg-white text-text-secondary hover:text-text-primary hover:bg-bg-cream/60 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <Link
            to="/admin/production"
            className="flex items-center gap-2 px-4 py-2.5 rounded-btn bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Produksi</span>
          </Link>

          <Link
            to="/admin/stock-out"
            className="flex items-center gap-2 px-4 py-2.5 rounded-btn bg-brand-gold hover:bg-brand-gold-dark text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <ArrowUpRight size={15} />
            <span>Stok Keluar</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Stok */}
        <div className="bg-white p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Total Stok Freezer
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-heading text-text-primary">
              {totalStockPcs.toLocaleString('id-ID')}{' '}
              <span className="text-sm font-semibold text-text-secondary">pcs</span>
            </div>
            <div className="mt-1 text-xs font-semibold text-brand-blue">
              ≈ {totalStockLots} Lot
            </div>
          </div>
        </div>

        {/* Card 2: Produksi Hari Ini */}
        <div className="bg-white p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Produksi Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold-dark flex items-center justify-center">
              <Factory size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-heading text-text-primary">
              {completedLots} <span className="text-base font-bold text-text-secondary">/ {normalCapacity} Lot</span>
            </div>
            {/* Gold Progress Indicator */}
            <div className="w-full bg-bg-cream rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className="bg-brand-gold h-full rounded-full transition-all duration-700"
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] font-medium text-text-secondary flex justify-between">
              <span>{capacityPercent}% Tercapai</span>
              <span className="text-brand-gold-dark font-bold">{remainingNormalLots} Lot Sisa</span>
            </div>
          </div>
        </div>

        {/* Card 3: Stok Kritis */}
        <div className="bg-white p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Stok Kritis
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-brand-red flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-heading text-text-primary flex items-baseline gap-1.5">
              <span>{criticalProducts.length}</span>
              <span className="text-sm font-semibold text-text-secondary">Varian</span>
            </div>
            <div className="mt-2">
              {criticalProducts.length > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-brand-red border border-red-200">
                  Perlu Produksi
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Buffer Aman (&gt;70 pcs)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Pengeluaran Hari Ini */}
        <div className="bg-white p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Stok Keluar Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-heading text-text-primary">
              {totalOutTodayPcs.toLocaleString('id-ID')}{' '}
              <span className="text-sm font-semibold text-text-secondary">pcs</span>
            </div>
            <div className="mt-1 text-xs font-semibold text-orange-700">
              {channelEntries.length} saluran
            </div>
          </div>
        </div>

      </div>

      {/* 3. ANALYTICS SECTION (Two-Column SVG Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7-Day Stock Movement (Area/Line Chart) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-card border border-bg-cream-dark/80 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-text-primary font-heading">
                Pergerakan Stok
              </h2>
              <p className="text-xs text-text-secondary">
                7 hari terakhir
              </p>
            </div>
            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-blue"></span>
                <span className="text-text-secondary">Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-gold"></span>
                <span className="text-text-secondary">Stok Keluar</span>
              </div>
            </div>
          </div>

          {/* SVG Line / Area Chart */}
          <div
            className="relative w-full h-60 select-none"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <svg viewBox="0 0 500 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                {/* Brand Blue for 'Masuk' - subtle transparency matching design system */}
                <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4685ac" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#4685ac" stopOpacity="0.0" />
                </linearGradient>
                {/* Brand Gold for 'Stok Keluar' - subtle transparency matching design system */}
                <linearGradient id="gradGold" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#C9A23D" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#C9A23D" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines with Y-Axis Values (Consistent Round Intervals) */}
              {yTicks.map((val) => {
                const y = getYPos(val);
                return (
                  <g key={val}>
                    <line
                      x1={padX}
                      y1={y}
                      x2={chartWidth - padX}
                      y2={y}
                      stroke="#F5F1EB"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#A8A29E"
                      fontWeight="600"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Average Reference Line */}
              {avgOut > 0 && (
                <g key="avg-ref">
                  <line
                    x1={padX}
                    y1={getYPos(avgOut)}
                    x2={chartWidth - padX}
                    y2={getYPos(avgOut)}
                    stroke="#D4B55A"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                  <text
                    x={chartWidth - padX}
                    y={getYPos(avgOut) - 4}
                    textAnchor="end"
                    fontSize="8"
                    fill="#A8862E"
                    fontWeight="600"
                  >
                    Rata-rata: {avgOut} pcs
                  </text>
                </g>
              )}

              {/* Dynamic SVG Curves: In (Brand Blue) */}
              {inAreaPath && <path d={inAreaPath} fill="url(#gradBlue)" />}
              {inLinePath && (
                <path
                  d={inLinePath}
                  fill="none"
                  stroke="#4685ac"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}

              {/* Dynamic SVG Curves: Out (Brand Gold) */}
              {outAreaPath && <path d={outAreaPath} fill="url(#gradGold)" />}
              {outLinePath && (
                <path
                  d={outLinePath}
                  fill="none"
                  stroke="#C9A23D"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}

              {/* Spike Annotation Badge for High-Volume Production */}
              {chartDays.map((d, i) => {
                if ((d.inQty || 0) >= 300) {
                  const pt = inPoints[i];
                  return (
                    <g key={`spike-badge-${d.day}`}>
                      <rect
                        x={pt.x - 52}
                        y={pt.y - 24}
                        width="104"
                        height="18"
                        rx="9"
                        fill="#4685ac"
                        className="shadow-xs"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="700"
                        fill="#FFFFFF"
                      >
                        Produksi Besar (+{d.inQty})
                      </text>
                    </g>
                  );
                }
                return null;
              })}

              {/* Interactive Day Hover Zones */}
              {chartDays.map((d, i) => {
                const inPt = inPoints[i];
                const outPt = outPoints[i];
                const halfStep = stepX / 2;
                return (
                  <rect
                    key={`hover-zone-${d.day}`}
                    x={inPt.x - halfStep}
                    y={0}
                    width={stepX}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint({
                      ...d,
                      index: i,
                      x: inPt.x,
                      inPt,
                      outPt,
                      targetY: Math.min(inPt.y, outPt.y)
                    })}
                  />
                );
              })}

              {/* Dynamic Hover Indicator & Circles - Visible ONLY when hovering */}
              {hoveredPoint && (
                <g key="hover-effects" className="pointer-events-none">
                  {/* Vertical highlight band */}
                  <rect
                    x={hoveredPoint.x - stepX / 2.8}
                    y={paddingTop - 10}
                    width={(stepX / 2.8) * 2}
                    height={baselineY - paddingTop + 20}
                    rx="8"
                    fill="#4685ac"
                    fillOpacity="0.08"
                  />

                  {/* Vertical guideline */}
                  <line
                    x1={hoveredPoint.x}
                    y1={paddingTop - 5}
                    x2={hoveredPoint.x}
                    y2={baselineY + 5}
                    stroke="#4685ac"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    strokeOpacity="0.45"
                  />

                  {/* Circles appearing on hover */}
                  {/* Blue circle on 'Masuk' curve */}
                  <circle
                    cx={hoveredPoint.inPt.x}
                    cy={hoveredPoint.inPt.y}
                    r="4"
                    fill="#FFFFFF"
                    stroke="#4685ac"
                    strokeWidth="2.5"
                    className="drop-shadow-sm"
                  />

                  {/* Gold circle on 'Stok Keluar' curve */}
                  <circle
                    cx={hoveredPoint.outPt.x}
                    cy={hoveredPoint.outPt.y}
                    r="4"
                    fill="#FFFFFF"
                    stroke="#C9A23D"
                    strokeWidth="2.5"
                    className="drop-shadow-sm"
                  />
                </g>
              )}
            </svg>

            {/* Tooltip Overlay positioned precisely above the hovered circle */}
            {hoveredPoint && (() => {
              const isSpike = (hoveredPoint.inQty || 0) >= 300;
              const xPercent = (hoveredPoint.x / chartWidth) * 100;
              const yPercent = (hoveredPoint.targetY / chartHeight) * 100;

              // Horizontal offset & arrow alignment to stay cleanly inside card
              let xTransform = '-50%';
              let arrowLeft = '50%';
              if (hoveredPoint.index === 0) {
                xTransform = '-18%';
                arrowLeft = '18%';
              } else if (hoveredPoint.index === nDays - 1) {
                xTransform = '-82%';
                arrowLeft = '82%';
              }

              return (
                <div
                  className="absolute pointer-events-none z-20 transition-all duration-150 ease-out"
                  style={{
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                    transform: `translate(${xTransform}, -100%)`,
                    marginTop: isSpike ? '-40px' : '-28px'
                  }}
                >
                  <div className="relative bg-[#182230] text-white py-2.5 px-3.5 rounded-2xl shadow-2xl border border-slate-700/80 min-w-[165px] select-none overflow-visible">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-2">
                      <span className="font-bold text-xs text-white tracking-wide">{hoveredPoint.day}</span>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-300 font-medium">
                          <span className="w-2 h-2 rounded-full bg-[#4685ac] inline-block shrink-0" />
                          <span>Masuk</span>
                        </div>
                        <div className="text-sm font-extrabold text-white font-heading mt-0.5">
                          +{hoveredPoint.inQty.toLocaleString('id-ID')}{' '}
                          <span className="text-[10px] font-normal text-gray-400">pcs</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-300 font-medium">
                          <span className="w-2 h-2 rounded-full bg-[#C9A23D] inline-block shrink-0" />
                          <span>Keluar</span>
                        </div>
                        <div className="text-sm font-extrabold text-white font-heading mt-0.5">
                          -{hoveredPoint.outQty.toLocaleString('id-ID')}{' '}
                          <span className="text-[10px] font-normal text-gray-400">pcs</span>
                        </div>
                      </div>
                    </div>

                    {/* Downward Pointer Arrow */}
                    <div
                      className="absolute -bottom-[7px] w-3.5 h-3.5 bg-[#182230] border-r border-b border-slate-700/80 pointer-events-none z-10"
                      style={{ left: arrowLeft, transform: 'translateX(-50%) rotate(45deg)' }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* X-Axis Labels */}
          <div className="flex justify-between text-[11px] font-semibold text-text-secondary/70 pt-3 border-t border-bg-cream px-6">
            {chartDays.map((d) => (
              <span key={d.day}>{d.day}</span>
            ))}
          </div>
        </div>

        {/* Right: Channel Distribution (Donut Chart) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-card border border-bg-cream-dark/80 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-text-primary font-heading">
                Distribusi Pengeluaran
              </h2>
              <p className="text-xs text-text-secondary">Per saluran penjualan</p>
            </div>
            <Link
              to="/admin/stock-out"
              className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-0.5"
            >
              <span>Detail</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {/* SVG Donut Chart & Legend (Atas Bawah) */}
          <div className="flex flex-col items-center justify-center gap-4 py-2">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center my-1">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F5F1EB" strokeWidth="4.5" />
                {/* Segments */}
                {(() => {
                  let accumulatedOffset = 0;
                  return channelEntries.map((c, i) => {
                    const pct = (c.count / totalChannelOut) * 100;
                    const strokeDasharray = `${pct} ${100 - pct}`;
                    const strokeDashoffset = -accumulatedOffset;
                    accumulatedOffset += pct;
                    return (
                      <circle
                        key={c.label}
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={c.color}
                        strokeWidth="4.5"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 hover:opacity-90"
                      />
                    );
                  });
                })()}
              </svg>
              {/* Donut Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-text-secondary leading-none">
                  Total
                </span>
                <span className="text-base font-black font-heading text-text-primary mt-0.5">
                  {totalChannelOut.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-text-secondary leading-none">pcs</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="w-full pt-3 border-t border-bg-cream space-y-2 text-xs font-medium">
              {channelEntries.slice(0, 5).map((c) => {
                const pct = Math.round((c.count / totalChannelOut) * 100);
                return (
                  <div key={c.label} className="flex items-center justify-between py-0.5 px-1 rounded-lg hover:bg-bg-cream/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-text-primary text-[11px] font-semibold">{c.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-text-primary font-bold">{c.count}</span>{' '}
                      <span className="text-[10px] text-text-secondary font-mono">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


        </div>
      </div>

      {/* 4. OPERATIONAL OVERVIEW (Capacity & Stock Attention) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Production Capacity Gauge */}
        <div className="lg:col-span-6 bg-white p-6 rounded-card border border-bg-cream-dark/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Factory className="text-brand-blue" size={20} />
                <h2 className="text-base font-bold text-text-primary font-heading">
                  Kapasitas Produksi
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-brand-gold/15 text-brand-gold-dark border border-brand-gold/30">
                {completedLots} / {normalCapacity} Lot
              </span>
            </div>

            {/* Visual Gauge Progress Bar */}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs font-semibold text-text-secondary">
                <span>0 Lot</span>
                <span className="text-brand-gold-dark font-bold">20 Lot</span>
                <span className="text-text-secondary/70">24 Maks</span>
              </div>

              <div className="w-full bg-bg-cream rounded-full h-4 relative overflow-hidden p-0.5 border border-bg-cream-dark/60">
                <div
                  className="bg-brand-gold h-full rounded-full transition-all duration-700 relative"
                  style={{ width: `${Math.min(100, (completedLots / 24) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-progress" />
                </div>
                {/* 20 Lot normal guideline indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-text-primary/40 z-10"
                  style={{ left: `${(20 / 24) * 100}%` }}
                  title="Target batas normal 20 Lot"
                />
              </div>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-3 gap-3 pt-5 mt-4 border-t border-bg-cream">
            <div className="p-3 bg-bg-cream/40 rounded-2xl border border-bg-cream-dark/50 text-center">
              <div className="text-[10px] uppercase font-bold text-text-secondary">Direncanakan</div>
              <div className="text-lg font-black font-heading text-brand-blue mt-0.5">{plannedLots} Lot</div>
              <div className="text-[10px] text-text-secondary">~{plannedLots * 25} pcs</div>
            </div>
            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-800">Terverifikasi</div>
              <div className="text-lg font-black font-heading text-emerald-700 mt-0.5">{completedLots} Lot</div>
              <div className="text-[10px] text-emerald-800/80">Masuk Freezer</div>
            </div>
            <div className="p-3 bg-bg-cream/40 rounded-2xl border border-bg-cream-dark/50 text-center">
              <div className="text-[10px] uppercase font-bold text-text-secondary">Sisa Kuota Normal</div>
              <div className="text-lg font-black font-heading text-text-primary mt-0.5">{remainingNormalLots} Lot</div>
              <div className="text-[10px] text-text-secondary">Tersedia</div>
            </div>
          </div>
        </div>

        {/* Right: Stock Attention List ("Perlu Perhatian") */}
        <div className="lg:col-span-6 bg-white p-6 rounded-card border border-bg-cream-dark/80 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-brand-gold" size={20} />
              <h2 className="text-base font-bold text-text-primary font-heading">
                Perlu Perhatian
              </h2>
            </div>
            <Link
              to="/admin/inventory"
              className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-0.5"
            >
              <span>Lihat Semua</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-60 pr-1">
            {allProducts.length === 0 ? (
              <div className="text-center py-8 text-xs text-text-secondary">
                Memuat data stok per varian...
              </div>
            ) : (
              allProducts.slice(0, 4).map((p) => {
                const isCritical = p.buffer_status === 'critical' || p.stock_qty < 70;
                const isWarning = p.buffer_status === 'warning' || (p.stock_qty >= 70 && p.stock_qty <= 100);

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-bg-cream-dark/70 hover:border-bg-cream-dark bg-white transition-all"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="text-xs font-bold text-text-primary truncate">{p.name}</div>
                      <div className="text-[10px] font-mono text-text-secondary">{p.sku}</div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-black font-heading text-text-primary">
                          {p.stock_qty} pcs
                        </div>
                        <div className="text-[10px] text-text-secondary">
                          ~{Math.round(p.stock_qty / 25)} Lot
                        </div>
                      </div>

                      {/* Status Badge */}
                      {isCritical ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-brand-red border border-red-200">
                          KRITIS
                        </span>
                      ) : isWarning ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          WASPADA
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          AMAN
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-bg-cream flex justify-between items-center text-xs">
            <span className="text-text-secondary text-[11px]">Min. buffer: <strong>70 pcs</strong></span>
            <Link to="/admin/production" className="text-brand-blue font-bold hover:underline">
              Produksi &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 5. RECENT ACTIVITY (Timeline Card) */}
      <div className="bg-white p-6 sm:p-7 rounded-card border border-bg-cream-dark/80 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="text-brand-blue" size={20} />
            <div>
              <h2 className="text-base font-bold text-text-primary font-heading">
                Aktivitas Terbaru
              </h2>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs text-text-secondary hover:text-text-primary font-semibold flex items-center gap-1"
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="divide-y divide-bg-cream">
          {recentTransactions.slice(0, 6).map((tx) => {
            const isOut = tx.type === 'out';
            return (
              <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOut ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-700'
                      }`}
                  >
                    {isOut ? <ArrowUpRight size={17} /> : <CheckCircle2 size={17} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                      <span>{isOut ? 'Stok Keluar' : 'Produksi Stok Masuk'}</span>
                      {tx.batch_code && (
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                          {tx.batch_code}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-secondary truncate mt-0.5">
                      {tx.product_name} • Saluran: <span className="font-semibold uppercase">{tx.channel || 'Manual'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-black font-heading ${isOut ? 'text-red-600' : 'text-emerald-700'
                      }`}
                  >
                    {isOut ? `-${tx.quantity} pcs` : `+${tx.quantity} pcs`}
                  </div>
                  <div className="text-[10px] text-text-secondary">
                    {tx.created_at
                      ? new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : 'Baru saja'}
                  </div>
                </div>
              </div>
            );
          })}

          {recentTransactions.length === 0 && (
            <div className="py-8 text-center text-xs text-text-secondary">
              Belum ada log transaksi hari ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
