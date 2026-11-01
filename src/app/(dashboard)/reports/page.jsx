'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar,
  FileDown,
  RefreshCw,
  Wallet,
  Scale,
  CalendarDays,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ChevronRight,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart as PieIcon,
  HelpCircle,
  Eye,
  Filter,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Card,
  Button,
  LoadingSpinner,
  Badge,
  ModernDatePicker,
} from '@/components/ui';
import { useModalAlert } from '@/components/ui/ModalAlert';
import { reportApi } from '@/services/api/modules';
import { formatINR } from '@/utils/formatters';

// Palette definitions for clean financial dashboard
const METHOD_COLORS = {
  CASH: '#10B981',
  UPI: '#F97316',
  BANK_TRANSFER: '#3B82F6',
  CARD_OFFLINE: '#8B5CF6',
  OTHER: '#64748B',
};

const STATUS_COLORS = {
  CONFIRMED: '#F97316',
  COMPLETED: '#10B981',
  PLANNING: '#3B82F6',
  READY: '#06B6D4',
  IN_PROGRESS: '#F59E0B',
  CANCELLED: '#EF4444',
  POSTPONED: '#94A3B8',
};

const EXPENSE_PALETTE = [
  '#F97316',
  '#EC4899',
  '#8B5CF6',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#14B8A6',
];

const QUICK_FILTERS = [
  { id: 'ALL', label: 'All Time' },
  { id: 'TODAY', label: 'Today' },
  { id: 'THIS_WEEK', label: 'This Week' },
  { id: 'THIS_MONTH', label: 'This Month' },
  { id: 'THIS_YEAR', label: 'This Year' },
  { id: 'CUSTOM', label: 'Custom Range' },
];

export default function ReportsPage() {
  const modalAlert = useModalAlert();

  // Filter State
  const [quickFilter, setQuickFilter] = useState('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Transaction Ledger Filter & Search
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL'); // ALL, PAYMENT, EXPENSE, REFUND

  // Compute ISO boundaries based on quick selection
  const dateParams = useMemo(() => {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (quickFilter === 'TODAY') {
      const ymd = toYMD(today);
      return { startDate: ymd, endDate: ymd };
    }

    if (quickFilter === 'THIS_WEEK') {
      const dayOfWeek = today.getDay();
      const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { startDate: toYMD(monday), endDate: toYMD(sunday) };
    }

    if (quickFilter === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { startDate: toYMD(firstDay), endDate: toYMD(lastDay) };
    }

    if (quickFilter === 'THIS_YEAR') {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      return { startDate: toYMD(firstDay), endDate: toYMD(lastDay) };
    }

    if (quickFilter === 'CUSTOM') {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
      };
    }

    return {};
  }, [quickFilter, customStartDate, customEndDate]);

  // Fetch Report Data from Real PostgreSQL Backend
  const {
    data: reportResponse,
    isLoading,
    isRefetching,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: ['financial-report', dateParams],
    queryFn: () => reportApi.getFinancialReport(dateParams),
    staleTime: 1000 * 30,
  });

  const reportData = reportResponse?.data?.data || reportResponse?.data || {};
  const summary = reportData.summary || {};
  const performance = reportData.performance || {};
  const breakdowns = reportData.breakdowns || {};
  const charts = reportData.charts || {};
  const transactions = reportData.recent_transactions || [];
  const allTransactions = reportData.all_transactions || transactions;

  const fmt = (paise) => formatINR(paise || 0);

  // Filtered transactions for the ledger
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      if (txTypeFilter !== 'ALL' && tx.type !== txTypeFilter) return false;
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase().trim();
        const partyMatch = tx.party?.toLowerCase().includes(q);
        const refMatch = tx.reference?.toLowerCase().includes(q);
        const methodMatch = tx.method?.toLowerCase().includes(q);
        if (!partyMatch && !refMatch && !methodMatch) return false;
      }
      return true;
    });
  }, [allTransactions, txTypeFilter, txSearch]);

  // 1. Chart: Payment Methods
  const paymentMethodChartData = useMemo(() => {
    const raw = breakdowns.payments_by_method || {};
    return Object.entries(raw).map(([key, val]) => ({
      name: key.replace('_', ' '),
      key,
      value: Math.round(Number(val) / 100),
    }));
  }, [breakdowns.payments_by_method]);

  // 2. Chart: Booking Status Breakdown
  const bookingStatusChartData = useMemo(() => {
    const raw = breakdowns.booking_statuses || {};
    return Object.entries(raw)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '),
        statusKey: status,
        count: Number(count),
      }));
  }, [breakdowns.booking_statuses]);

  // 3. Chart: Expense Categories
  const expenseCategoryChartData = useMemo(() => {
    const raw = breakdowns.expenses_by_category || {};
    return Object.entries(raw).map(([cat, val]) => ({
      name: cat,
      amount: Math.round(Number(val) / 100),
    }));
  }, [breakdowns.expenses_by_category]);

  // Export Financial Statement as CSV
  const handleExportStatement = () => {
    try {
      const bizName = reportData.business?.name || 'Bridal Studio';
      const periodLabel = dateParams.startDate && dateParams.endDate
        ? `${dateParams.startDate}_to_${dateParams.endDate}`
        : 'All_Time';

      const rows = [
        ['Financial & Studio Report Statement'],
        ['Studio Name', bizName],
        ['Generated Date', new Date().toLocaleString()],
        ['Reporting Period', periodLabel],
        [''],
        ['FINANCIAL AUDIT SUMMARY'],
        ['Total Agreed Booking Value', `INR ${(Number(summary.total_net_booking_value_paise || 0) / 100).toFixed(2)}`],
        ['Payments Collected', `INR ${(Number(summary.payments_collected_paise || 0) / 100).toFixed(2)}`],
        ['Refunds Processed', `INR ${(Number(summary.refunds_processed_paise || 0) / 100).toFixed(2)}`],
        ['Net Cash Collected', `INR ${(Number(summary.net_cash_collected_paise || 0) / 100).toFixed(2)}`],
        ['Operational Studio Expenses', `INR ${(Number(summary.total_expenses_paise || 0) / 100).toFixed(2)}`],
        ['Net Cash Flow / Profit', `INR ${(Number(summary.net_cash_movement_paise || 0) / 100).toFixed(2)}`],
        ['Outstanding Customer Balances', `INR ${(Number(summary.total_outstanding_balance_paise || 0) / 100).toFixed(2)}`],
        [''],
        ['TRANSACTION LEDGER'],
        ['Date', 'Type', 'Reference / Receipt', 'Party / Customer', 'Method', 'Amount (INR)', 'Status'],
      ];

      allTransactions.forEach((tx) => {
        rows.push([
          new Date(tx.date).toLocaleDateString(),
          tx.type,
          tx.reference,
          tx.party,
          tx.method,
          (Number(tx.amount_paise) / 100).toFixed(2),
          tx.status,
        ]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((cell) => `"${cell}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${bizName.replace(/\s+/g, '_')}_Financial_Statement_${periodLabel}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      modalAlert.showSuccess(
        'Statement Exported',
        'Your comprehensive financial CSV statement has been downloaded successfully.'
      );
    } catch (err) {
      modalAlert.showError('Export Failed', err.message || 'Unable to generate statement file.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header with Interactive Quick-Filters Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">Financial & Studio Reports</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              Track booking value, collected revenue, expenses, outstanding balances, and studio profitability.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="border-stone-300 text-stone-700 hover:bg-stone-50 shadow-xs"
              title="Refresh financial data from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin text-orange-600' : 'text-stone-500'}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleExportStatement}
              disabled={isLoading || !allTransactions.length}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm transition-all"
            >
              <FileDown className="w-4 h-4 mr-1.5" />
              Export Statement
            </Button>
          </div>
        </div>

        {/* Interactive Period Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-stone-100/90 rounded-2xl w-fit border border-stone-200/60 shadow-xs">
          {QUICK_FILTERS.map((f) => {
            const active = quickFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setQuickFilter(f.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200/80 font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Custom Range Picker Drawer */}
        {quickFilter === 'CUSTOM' && (
          <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200/80 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-150">
            <span className="font-semibold text-stone-800 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-orange-600" /> Select Range:
            </span>
            <div className="w-44">
              <ModernDatePicker
                value={customStartDate}
                onChange={(val) => setCustomStartDate(val)}
                placeholder="Start Date"
              />
            </div>
            <span className="text-stone-400 font-semibold">to</span>
            <div className="w-44">
              <ModernDatePicker
                value={customEndDate}
                onChange={(val) => setCustomEndDate(val)}
                placeholder="End Date"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-stone-500 hover:text-stone-800 font-medium underline ml-2 cursor-pointer"
              >
                Reset Dates
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <Card className="p-16 text-center border border-stone-200/80 shadow-sm bg-white">
          <LoadingSpinner text="Computing financial statements & reconciliations..." />
        </Card>
      ) : isError ? (
        <Card className="p-8 text-center border border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-rose-900">Failed to load financial reports</h3>
          <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">
            {error?.response?.data?.message || error?.message || 'Database error occurred while aggregating financial metrics.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="mt-4 border-rose-300 text-rose-800 hover:bg-rose-100"
          >
            Retry Loading
          </Button>
        </Card>
      ) : (
        <>
          {/* 2. Modern Financial Summary Cards (7 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5 sm:gap-4">
            {/* Card 1: Booking Value */}
            <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-orange-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Booking Value</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center text-orange-600 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-3 tracking-tight">
                  {fmt(summary.total_net_booking_value_paise)}
                </div>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-medium">Agreed contracts</p>
            </Card>

            {/* Card 2: Collected */}
            <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-emerald-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Collected</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-3 tracking-tight">
                  {fmt(summary.payments_collected_paise)}
                </div>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-medium">Recorded receipts</p>
            </Card>

            {/* Card 3: Refunds */}
            <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-rose-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Refunds</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center text-rose-600 transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-3 tracking-tight">
                  {Number(summary.refunds_processed_paise) > 0 ? `-${fmt(summary.refunds_processed_paise)}` : '₹0'}
                </div>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-medium">Processed client refunds</p>
            </Card>

            {/* Card 4: Expenses */}
            <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-rose-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Expenses</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center text-rose-600 transition-colors">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-3 tracking-tight">
                  {fmt(summary.total_expenses_paise)}
                </div>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-medium">Studio expenditures</p>
            </Card>

            {/* Card 5: Outstanding Balance */}
            <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-amber-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Outstanding</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center text-amber-600 transition-colors">
                    <Scale className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-3 tracking-tight">
                  {fmt(summary.total_outstanding_balance_paise)}
                </div>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-medium">Due from clients</p>
            </Card>

            {/* Card 6: Net Cash Flow */}
            <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-stone-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">Net Cash Flow</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${Number(summary.net_cash_movement_paise) >= 0 ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-100'}`}>
                    {Number(summary.net_cash_movement_paise) >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <div className={`text-xl sm:text-2xl font-extrabold mt-3 tracking-tight ${Number(summary.net_cash_movement_paise) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {fmt(summary.net_cash_movement_paise)}
                </div>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-medium">Receipts − Expenses</p>
            </Card>

            {/* Card 7: Estimated Net Profit */}
            <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-orange-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Cash Profit</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center text-orange-600 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-orange-700 mt-3 tracking-tight">
                  {fmt(summary.net_cash_movement_paise)}
                </div>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-medium">Cash-basis estimate</p>
            </Card>
          </div>

          {/* 3. Financial Audit Reconciliation Summary */}
          <Card className="p-6 border border-stone-200/80 shadow-sm bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-3 mb-4 gap-2">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Financial Audit Summary</h3>
                <p className="text-xs text-stone-500">Official studio reconciliation statement for this period</p>
              </div>
              <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg font-mono font-medium w-fit">
                Currency: INR (₹)
              </span>
            </div>

            <div className="space-y-3.5 divide-y divide-stone-100 text-sm">
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="text-stone-800 font-semibold">Total Agreed Booking Value</div>
                  <div className="text-xs text-stone-400">Contracts created and scheduled within this period</div>
                </div>
                <span className="font-bold text-stone-900 text-base tabular-nums">{fmt(summary.total_net_booking_value_paise)}</span>
              </div>

              <div className="flex items-center justify-between py-1 pt-3">
                <div>
                  <div className="text-stone-800 font-semibold">Payments Collected</div>
                  <div className="text-xs text-stone-400">Customer manual and digital receipts logged with recorded status</div>
                </div>
                <span className="font-bold text-emerald-700 text-base tabular-nums">{fmt(summary.payments_collected_paise)}</span>
              </div>

              <div className="flex items-center justify-between py-1 pt-3">
                <div>
                  <div className="text-stone-800 font-semibold">Refunds Processed</div>
                  <div className="text-xs text-stone-400">Total client refund disbursements processed in period</div>
                </div>
                <span className="font-bold text-rose-600 text-base tabular-nums">
                  {Number(summary.refunds_processed_paise) > 0 ? `-${fmt(summary.refunds_processed_paise)}` : '₹0'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 pt-3">
                <div>
                  <div className="text-stone-800 font-semibold">Operational Studio Expenses</div>
                  <div className="text-xs text-stone-400">Cosmetics restocking, bridal travel, rent, staff & utilities</div>
                </div>
                <span className="font-bold text-rose-600 text-base tabular-nums">
                  {Number(summary.total_expenses_paise) > 0 ? `-${fmt(summary.total_expenses_paise)}` : '₹0'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 pt-3">
                <div>
                  <div className="text-stone-800 font-semibold">Outstanding Customer Payments</div>
                  <div className="text-xs text-stone-400">Uncollected balances across all active confirmed appointments</div>
                </div>
                <span className="font-bold text-amber-700 text-base tabular-nums">{fmt(summary.total_outstanding_balance_paise)}</span>
              </div>

              {/* Highlight Profit Banner */}
              <div className="flex items-center justify-between py-3.5 text-base font-bold bg-stone-50 px-5 rounded-2xl mt-3 border border-stone-200">
                <div>
                  <div className="text-stone-900 font-bold">Estimated Cash Profit</div>
                  <div className="text-xs font-normal text-stone-500">Payments Collected − Refunds − Expenses Paid</div>
                </div>
                <span className={`text-xl font-extrabold tabular-nums ${Number(summary.net_cash_movement_paise) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {fmt(summary.net_cash_movement_paise)}
                </span>
              </div>
            </div>
          </Card>

          {/* 4. Interactive Analytics Charts (2x2 Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart A: Revenue vs Expenses Timeline */}
            <Card className="p-5 border border-stone-200/80 shadow-sm bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Revenue vs Expenses Timeline</h4>
                  <p className="text-xs text-stone-500">Chronological daily receipts against operational outflows</p>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-stone-600 font-medium">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    <span className="text-stone-600 font-medium">Expenses</span>
                  </div>
                </div>
              </div>

              {charts.timeline && charts.timeline.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.timeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} />
                      <Tooltip
                        formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, '']}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e7e5e4',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        }}
                      />
                      <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Collected Revenue" />
                      <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <BarChart3 className="w-8 h-8 text-stone-300 mb-2" />
                  <p className="text-xs font-semibold text-stone-600">No timeline transactions in this period</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Recorded payments and expenses will plot here.</p>
                </div>
              )}
            </Card>

            {/* Chart B: Payment Collection by Method */}
            <Card className="p-5 border border-stone-200/80 shadow-sm bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Payment Collection Breakdown</h4>
                  <p className="text-xs text-stone-500">Distribution of collected payments by transaction method</p>
                </div>
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Total: {fmt(summary.payments_collected_paise)}
                </div>
              </div>

              {paymentMethodChartData.length > 0 ? (
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {paymentMethodChartData.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={METHOD_COLORS[entry.key] || EXPENSE_PALETTE[idx % EXPENSE_PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e7e5e4',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <CreditCard className="w-8 h-8 text-stone-300 mb-2" />
                  <p className="text-xs font-semibold text-stone-600">No payment receipts recorded</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">UPI, Cash, and Bank Transfers will chart here.</p>
                </div>
              )}
            </Card>

            {/* Chart C: Booking Status Distribution */}
            <Card className="p-5 border border-stone-200/80 shadow-sm bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Booking Status Breakdown</h4>
                  <p className="text-xs text-stone-500">Distribution of client bridal bookings in this reporting period</p>
                </div>
                <div className="text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">
                  Total: {performance.total_bookings || 0}
                </div>
              </div>

              {bookingStatusChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bookingStatusChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f1" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#57534e' }} width={80} />
                      <Tooltip
                        formatter={(val) => [val, 'Bookings']}
                        contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" fill="#F97316" radius={[0, 4, 4, 0]}>
                        {bookingStatusChartData.map((entry, idx) => (
                          <Cell
                            key={`bar-${idx}`}
                            fill={STATUS_COLORS[entry.statusKey] || '#F97316'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <Calendar className="w-8 h-8 text-stone-300 mb-2" />
                  <p className="text-xs font-semibold text-stone-600">No bookings created in this period</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Booking status counts will appear here.</p>
                </div>
              )}
            </Card>

            {/* Chart D: Expense Categories Breakdown */}
            <Card className="p-5 border border-stone-200/80 shadow-sm bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Operational Expense Categories</h4>
                  <p className="text-xs text-stone-500">Makeup products, travel, staff, rent, and supplies</p>
                </div>
                <div className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Total: {fmt(summary.total_expenses_paise)}
                </div>
              </div>

              {expenseCategoryChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={expenseCategoryChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f1" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#57534e' }} width={90} />
                      <Tooltip
                        formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Expenditure']}
                        contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Bar dataKey="amount" fill="#EC4899" radius={[0, 4, 4, 0]}>
                        {expenseCategoryChartData.map((_, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={EXPENSE_PALETTE[idx % EXPENSE_PALETTE.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <IndianRupee className="w-8 h-8 text-stone-300 mb-2" />
                  <p className="text-xs font-semibold text-stone-600">No operational expenses logged</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Categorized studio expenses will plot here.</p>
                </div>
              )}
            </Card>
          </div>

          {/* 5. Booking and Revenue Performance KPIs (6 KPIs) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            <Card className="p-4 border border-stone-200/80 shadow-sm bg-white">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Bookings</span>
              <div className="text-2xl font-extrabold text-stone-900 mt-1">{performance.total_bookings || 0}</div>
              <p className="text-[11px] text-stone-400 mt-1">In selected range</p>
            </Card>

            <Card className="p-4 border border-stone-200/80 shadow-sm bg-white">
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">Confirmed</span>
              <div className="text-2xl font-extrabold text-orange-600 mt-1">{performance.confirmed_bookings || 0}</div>
              <p className="text-[11px] text-stone-400 mt-1">Ready & planning</p>
            </Card>

            <Card className="p-4 border border-stone-200/80 shadow-sm bg-white">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Completed</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">{performance.completed_bookings || 0}</div>
              <p className="text-[11px] text-stone-400 mt-1">Events concluded</p>
            </Card>

            <Card className="p-4 border border-stone-200/80 shadow-sm bg-white">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Cancelled</span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">{performance.cancelled_bookings || 0}</div>
              <p className="text-[11px] text-stone-400 mt-1">Voided appointments</p>
            </Card>

            <Card className="p-4 border border-stone-200/80 shadow-sm bg-white">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Avg Contract</span>
              <div className="text-xl font-extrabold text-stone-900 mt-1">{fmt(performance.avg_booking_value_paise)}</div>
              <p className="text-[11px] text-stone-400 mt-1">Per active booking</p>
            </Card>

            <Card className="p-4 border border-stone-200/80 shadow-sm bg-white">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Collection Rate</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">{performance.payment_collection_rate || 0}%</div>
              <p className="text-[11px] text-stone-400 mt-1">Collected / Contract</p>
            </Card>
          </div>

          {/* 6. Recent Financial Activity Ledger (Interactive Search & Tabs) */}
          <Card className="border border-stone-200/80 shadow-sm bg-white overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Recent Financial Activity</h3>
                <p className="text-xs text-stone-500">Live transaction ledger connecting customer payments and studio expenses</p>
              </div>

              {/* Ledger Filter Tabs & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter transactions..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setTxTypeFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${txTypeFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setTxTypeFilter('PAYMENT')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${txTypeFilter === 'PAYMENT' ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'}`}
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => setTxTypeFilter('EXPENSE')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${txTypeFilter === 'EXPENSE' ? 'bg-rose-50 text-rose-700 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'}`}
                  >
                    Expenses
                  </button>
                </div>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-10 text-center">
                <Clock className="w-10 h-10 text-stone-300 mx-auto mb-2.5" />
                <h4 className="text-sm font-bold text-stone-800">No financial activity matches your filter</h4>
                <p className="text-xs text-stone-500 mt-1">
                  Try clearing the search term or switching the reporting period.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-stone-50/75 border-b border-stone-200 text-stone-500 text-[11px] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Reference / Receipt</th>
                        <th className="py-3 px-3">Party / Client</th>
                        <th className="py-3 px-3">Method</th>
                        <th className="py-3 px-3 text-right">Amount</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      {filteredTransactions.map((tx) => {
                        const isIncome = tx.type === 'PAYMENT';
                        const isExpense = tx.type === 'EXPENSE';

                        return (
                          <tr key={tx.id} className="hover:bg-stone-50/60 transition-colors">
                            {/* Date */}
                            <td className="py-3 px-4 text-xs text-stone-600 font-mono whitespace-nowrap">
                              {new Date(tx.date).toLocaleDateString()}
                            </td>

                            {/* Type */}
                            <td className="py-3 px-3">
                              {isIncome ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <ArrowUpRight className="w-3 h-3 text-emerald-600" /> Payment
                                </span>
                              ) : isExpense ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                  <ArrowDownRight className="w-3 h-3 text-rose-600" /> Expense
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Refund
                                </span>
                              )}
                            </td>

                            {/* Reference */}
                            <td className="py-3 px-3 text-xs font-mono text-stone-800">
                              {tx.reference}
                            </td>

                            {/* Party */}
                            <td className="py-3 px-3 text-xs font-semibold text-stone-900">
                              <div>{tx.party}</div>
                              {tx.booking_number && (
                                <span className="text-[10px] text-stone-400 font-mono">
                                  Booking: {tx.booking_number}
                                </span>
                              )}
                            </td>

                            {/* Method */}
                            <td className="py-3 px-3 text-xs text-stone-600">
                              <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px] font-medium border border-stone-200/60">
                                {tx.method}
                              </span>
                            </td>

                            {/* Amount */}
                            <td className="py-3 px-3 text-right tabular-nums font-bold text-xs">
                              <span className={isIncome ? 'text-emerald-700' : 'text-rose-600'}>
                                {isIncome ? `+${fmt(tx.amount_paise)}` : `-${fmt(tx.amount_paise)}`}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-center">
                              <span className="text-[11px] font-medium text-stone-600 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Transaction Cards */}
                <div className="md:hidden divide-y divide-stone-100">
                  {filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'PAYMENT';

                    return (
                      <div key={tx.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-stone-900 text-sm">{tx.party}</div>
                            <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                              {tx.reference} • {new Date(tx.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className={`font-bold text-sm tabular-nums ${isIncome ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {isIncome ? `+${fmt(tx.amount_paise)}` : `-${fmt(tx.amount_paise)}`}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-stone-400 font-medium">{tx.method}</span>
                          <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {tx.type} • {tx.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
