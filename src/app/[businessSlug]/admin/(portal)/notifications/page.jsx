'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Search,
  Filter,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Mail,
  MessageSquare,
  Smartphone,
  Eye,
  Calendar,
  User,
  Hash,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Inbox,
  Info,
  Sliders,
  Settings,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  LoadingSpinner,
  EmptyState,
  Badge,
  ModernDropdown,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useModalAlert } from '@/components/ui/ModalAlert';
import { notificationApi } from '@/services/api/modules';
import { formatDate } from '@/utils/formatters';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const modalAlert = useModalAlert();

  // Search, filter & pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Navigation view tab
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'preferences'

  // Drawer / modal details state
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Notification Preferences Query
  const {
    data: preferencesData,
    isLoading: isPreferencesLoading,
    refetch: refetchPreferences,
  } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationApi.getPreferences(),
  });

  const [localPrefs, setLocalPrefs] = useState([]);

  React.useEffect(() => {
    if (preferencesData?.data) {
      setLocalPrefs(preferencesData.data);
    }
  }, [preferencesData]);

  // Update Preferences Mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (prefs) => notificationApi.updatePreferences({ preferences: prefs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      addToast({
        title: 'Preferences Updated',
        description: 'Business notification triggers saved successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update preferences';
      addToast({ title: 'Error', description: msg, variant: 'danger' });
    },
  });

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Query: Notifications list
  const queryParams = useMemo(() => {
    const params = {
      page,
      limit: pageSize,
      sortBy: selectedSort,
    };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (selectedStatus !== 'ALL') params.status = selectedStatus;
    if (selectedChannel !== 'ALL') params.channel = selectedChannel;
    return params;
  }, [page, pageSize, selectedSort, debouncedSearch, selectedStatus, selectedChannel]);

  const {
    data: listData,
    isLoading: isListLoading,
    isFetching: isListFetching,
    isError: isListError,
    error: listError,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['notifications', queryParams],
    queryFn: () => notificationApi.list(queryParams),
    keepPreviousData: true,
  });

  // Query: Summary Metrics
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['notifications-summary'],
    queryFn: () => notificationApi.getSummary(),
  });

  const summary = summaryData?.data || {
    total_notifications: 0,
    pending_notifications: 0,
    sent_notifications: 0,
    failed_notifications: 0,
    unread_notifications: 0,
  };

  const notifications = listData?.data || [];
  const meta = listData?.meta || { total: 0, totalPages: 1, page: 1, limit: pageSize };

  // Mutation: Process Queue
  const processQueueMutation = useMutation({
    mutationFn: () => notificationApi.processQueue(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-summary'] });
      const count = res.data?.processed_count ?? 0;
      addToast({
        title: 'Queue Processed',
        description: count > 0
          ? `Dispatched ${count} pending notification job${count === 1 ? '' : 's'}.`
          : 'All pending notification jobs are currently up to date.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to process notification queue';
      addToast({
        title: 'Queue Processing Failed',
        description: msg,
        variant: 'danger',
      });
    },
  });

  // Mutation: Mark All As Read
  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-summary'] });
      addToast({
        title: 'Marked All as Read',
        description: `Successfully acknowledged notifications.`,
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to mark notifications as read';
      addToast({
        title: 'Error',
        description: msg,
        variant: 'danger',
      });
    },
  });

  // Mutation: Mark single notification as read
  const markSingleMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-summary'] });
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification((prev) => (prev ? { ...prev, status: 'DELIVERED' } : null));
      }
      addToast({
        title: 'Notification Acknowledged',
        description: 'Marked as read/delivered',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to mark as read';
      addToast({
        title: 'Error',
        description: msg,
        variant: 'danger',
      });
    },
  });

  // Mutation: Retry eligible failed job
  const retryMutation = useMutation({
    mutationFn: (id) => notificationApi.retry(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-summary'] });
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification((prev) => (prev ? { ...prev, status: res.data?.status || 'SENT', retry_count: res.data?.retry_count } : null));
      }
      addToast({
        title: 'Job Retried',
        description: res.data?.status === 'SENT' ? 'Notification successfully delivered.' : 'Notification re-queued for dispatch.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to retry notification';
      addToast({
        title: 'Retry Failed',
        description: msg,
        variant: 'danger',
      });
    },
  });

  const handleRefresh = () => {
    refetchList();
    refetchSummary();
    addToast({ title: 'Refreshed', description: 'Notification data is up to date', variant: 'success' });
  };

  const handleOpenDetail = (notification) => {
    setSelectedNotification(notification);
    setIsDetailDrawerOpen(true);
    // If notification is in SENT status (unread), mark it as read automatically
    if (notification.status === 'SENT') {
      markSingleMutation.mutate(notification.id);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedStatus('ALL');
    setSelectedChannel('ALL');
    setSelectedSort('newest');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedStatus !== 'ALL' ||
    selectedChannel !== 'ALL' ||
    selectedSort !== 'newest';

  // Status helper mapping
  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Delivered
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3 text-blue-600" />
            Sent
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Failed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            <XCircle className="w-3 h-3 text-stone-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  // Channel helper icon & label
  const getChannelBadge = (channel) => {
    switch (channel) {
      case 'WHATSAPP':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/70 border border-emerald-100 px-2 py-0.5 rounded-md">
            <MessageSquare className="w-3 h-3 text-emerald-600" />
            WhatsApp
          </span>
        );
      case 'IN_APP':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50/70 border border-purple-100 px-2 py-0.5 rounded-md">
            <Smartphone className="w-3 h-3 text-purple-600" />
            In-App
          </span>
        );
      case 'EMAIL':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 bg-stone-100/80 border border-stone-200 px-2 py-0.5 rounded-md">
            <Mail className="w-3 h-3 text-stone-500" />
            Email
          </span>
        );
    }
  };

  // Derive notification human type from subject, template name or relation
  const getNotificationCategory = (n) => {
    if (n.template_name) {
      const templateMap = {
        customer_enquiry_ack: 'Enquiry Acknowledgement',
        admin_enquiry_alert: 'New Enquiry Alert',
        new_enquiry_alert__admin: 'New Enquiry Alert',
        booking_confirmation: 'Booking Confirmation',
        consultation_reminder: 'Consultation Reminder',
        pending_balance_reminder: 'Balance Payment Reminder',
        event_preparation_reminder: 'Event Preparation',
        subscription_expiry_reminder: 'Subscription Expiry',
        consultation_follow_up: 'Consultation Follow-up',
        special_bridal_packages: 'Bridal Campaign',
      };
      if (templateMap[n.template_name]) return templateMap[n.template_name];
    }
    const s = (n.subject || '').toLowerCase();
    if (s.includes('payment') || s.includes('receipt') || s.includes('paid')) return 'Payment Receipt';
    if (s.includes('booking confirm')) return 'Booking Confirmation';
    if (s.includes('booking reminder') || s.includes('upcoming bridal')) return 'Booking Reminder';
    if (s.includes('consultation')) return 'Consultation Reminder';
    if (s.includes('quotation') || s.includes('quote')) return 'Quotation';
    if (s.includes('low stock') || s.includes('inventory')) return 'Inventory Alert';
    if (s.includes('enquiry')) return 'Enquiry Notification';
    if (n.booking_id) return 'Booking Notification';
    if (n.consultation_id) return 'Consultation Notice';
    return 'General Notification';
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900">
            Notifications &amp; Dispatches
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5 sm:mt-1 leading-relaxed">
            Monitor email delivery, booking reminders, payment receipts, and client alerts.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-2xs font-semibold text-xs py-2 px-2.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1 text-stone-500 shrink-0 ${isListFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            isLoading={processQueueMutation.isPending}
            onClick={() => processQueueMutation.mutate()}
            className="border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-2xs font-semibold text-xs py-2 px-2.5"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-stone-500 shrink-0" />
            <span>Process</span>
          </Button>

          <Button
            size="sm"
            isLoading={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-2xs transition-all text-xs py-2 px-2.5 disabled:opacity-50"
            disabled={summary.unread_notifications === 0}
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span>Mark All Read</span>
          </Button>

          <Button
            variant={activeTab === 'preferences' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(activeTab === 'preferences' ? 'history' : 'preferences')}
            className={`font-semibold text-xs py-2 px-2.5 ${activeTab === 'preferences' ? 'bg-stone-900 text-white hover:bg-stone-800' : 'border-stone-300 text-stone-700'}`}
          >
            <Sliders className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span>{activeTab === 'preferences' ? 'Logs' : 'Settings'}</span>
          </Button>
        </div>
      </div>

      {activeTab === 'preferences' ? (
        /* Notification Preferences Setting Matrix */
        <Card className="p-6 border border-stone-200/80 shadow-sm bg-white space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-600" />
                Studio Notification Preferences
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Configure which transactional emails and automated reminders your studio sends to clients and administrators.
              </p>
            </div>
            <Button
              size="sm"
              isLoading={updatePreferencesMutation.isPending}
              onClick={() => updatePreferencesMutation.mutate(localPrefs)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
            >
              Save Preferences
            </Button>
          </div>

          <div className="space-y-4">
            {[
              { key: 'NEW_ENQUIRY', label: 'New Enquiry Alert & Acknowledgment', desc: 'Send confirmation email to bride and notification to studio team' },
              { key: 'ENQUIRY_FOLLOW_UP', label: 'Automated Enquiry Follow-ups', desc: 'Trigger 24-hour, 3-day, and 7-day automated follow-up sequence' },
              { key: 'BOOKING_CONFIRMED', label: 'Booking Confirmation Notification', desc: 'Send booking summary, advance paid, and preparation instructions' },
              { key: 'CONSULTATION_SCHEDULED', label: 'Consultation Reminders', desc: 'Send reminders 24 hours and 2 hours prior to makeup trials' },
              { key: 'PAYMENT_RECORDED', label: 'Payment Receipts', desc: 'Dispatch receipt acknowledging payments and updated outstanding balance' },
              { key: 'BALANCE_PAYMENT_REMINDER', label: 'Balance Payment Reminders', desc: 'Remind brides of outstanding balances 7 days and 2 days before event' },
              { key: 'EVENT_PREPARATION_REMINDER', label: '2-Day Event Preparation Checklist', desc: 'Send styling checklist and call-time reminder 48 hours prior to event' },
              { key: 'LOW_STOCK_ALERT', label: 'Cosmetics Low-Stock Alerts', desc: 'Alert studio manager when inventory falls to or below threshold' },
              { key: 'UPCOMING_EVENT_REMINDER', label: '24-Hour Event Reminder', desc: 'Send appointment reminder day before event' },
              { key: 'SUBSCRIPTION_REMINDER', label: 'Varnam Subscription & Billing Alerts', desc: 'Notify studio owner on renewal, expiry, or payment statuses' },
            ].map((item) => {
              const pref = localPrefs.find((p) => p.event_key === item.key) || {
                event_key: item.key,
                channel: 'EMAIL',
                enabled: true,
                send_to_artist: true,
                send_to_customer: true,
              };

              const updatePref = (field, val) => {
                setLocalPrefs((prev) => {
                  const idx = prev.findIndex((p) => p.event_key === item.key);
                  if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = { ...copy[idx], [field]: val };
                    return copy;
                  } else {
                    return [...prev, { ...pref, [field]: val }];
                  }
                });
              };

              return (
                <div
                  key={item.key}
                  className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-stone-900">{item.label}</div>
                    <div className="text-xs text-stone-500">{item.desc}</div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                      <input
                        type="checkbox"
                        checked={pref.enabled}
                        onChange={(e) => updatePref('enabled', e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                      />
                      Active
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                      <input
                        type="checkbox"
                        checked={pref.send_to_artist}
                        disabled={!pref.enabled}
                        onChange={(e) => updatePref('send_to_artist', e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 disabled:opacity-40"
                      />
                      Admin Email
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                      <input
                        type="checkbox"
                        checked={pref.send_to_customer}
                        disabled={!pref.enabled}
                        onChange={(e) => updatePref('send_to_customer', e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 disabled:opacity-40"
                      />
                      Bride Email
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <>

      {/* 2. Notification Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Total Notifications */}
        <Card className="p-3 sm:p-5 border border-stone-200/80 shadow-2xs bg-white hover:border-stone-300 transition-all rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">
              Total
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {isSummaryLoading ? '...' : (summary.total_notifications ?? 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5 leading-tight">All dispatches</p>
          </div>
        </Card>

        {/* Pending Notifications */}
        <Card className="p-3 sm:p-5 border border-stone-200/80 shadow-2xs bg-white hover:border-stone-300 transition-all rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider">
              Pending
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-black text-amber-900 tracking-tight">
              {isSummaryLoading ? '...' : (summary.pending_notifications ?? 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-amber-700/80 mt-0.5 leading-tight">Awaiting queue</p>
          </div>
        </Card>

        {/* Successfully Sent */}
        <Card className="p-3 sm:p-5 border border-stone-200/80 shadow-2xs bg-white hover:border-stone-300 transition-all rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Delivered
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-black text-emerald-900 tracking-tight">
              {isSummaryLoading ? '...' : (summary.sent_notifications ?? 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-emerald-700/80 mt-0.5 leading-tight">Delivered</p>
          </div>
        </Card>

        {/* Failed Notifications */}
        <Card className="p-3 sm:p-5 border border-stone-200/80 shadow-2xs bg-white hover:border-stone-300 transition-all rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-rose-700 uppercase tracking-wider">
              Failed
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-black text-rose-900 tracking-tight">
              {isSummaryLoading ? '...' : (summary.failed_notifications ?? 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-rose-700/80 mt-0.5 leading-tight">Errors</p>
          </div>
        </Card>

        {/* Unread / Unacknowledged */}
        <Card className="p-3 sm:p-5 border border-orange-200/80 shadow-2xs bg-gradient-to-br from-white to-orange-50/50 hover:border-orange-300 transition-all col-span-2 lg:col-span-1 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-[#EA580C] uppercase tracking-wider">
              Unread
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-black text-[#C2410C] tracking-tight">
              {isSummaryLoading ? '...' : (summary.unread_notifications ?? 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 leading-tight">Action needed</p>
          </div>
        </Card>
      </div>

      {/* 3. Search, Filters, and Sorting Bar */}
      <Card className="p-4 border border-stone-200/80 shadow-sm bg-white">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by subject, recipient email, or message contents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-stone-50/70 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="w-36">
              <ModernDropdown
                value={selectedStatus}
                onChange={(val) => {
                  setSelectedStatus(val);
                  setPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'QUEUED', label: 'Pending (Queue)' },
                  { value: 'SENT', label: 'Sent (Unread)' },
                  { value: 'DELIVERED', label: 'Delivered (Read)' },
                  { value: 'FAILED', label: 'Failed' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
              />
            </div>

            {/* Channel Filter */}
            <div className="w-32">
              <ModernDropdown
                value={selectedChannel}
                onChange={(val) => {
                  setSelectedChannel(val);
                  setPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'All Channels' },
                  { value: 'EMAIL', label: 'Email' },
                  { value: 'WHATSAPP', label: 'WhatsApp' },
                  { value: 'IN_APP', label: 'In-App' },
                ]}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="w-36">
              <ModernDropdown
                value={selectedSort}
                onChange={(val) => setSelectedSort(val)}
                options={[
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' },
                  { value: 'scheduled', label: 'Scheduled Date' },
                ]}
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-stone-500 hover:text-stone-800 text-xs px-2.5"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 4. Notifications List / Table */}
      {isListLoading ? (
        <Card className="p-12 border border-stone-200/80 shadow-sm bg-white">
          <LoadingSpinner text="Fetching notification logs from database..." />
        </Card>
      ) : isListError ? (
        <Card className="p-8 border border-rose-200 bg-rose-50/40 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Failed to load notifications</h3>
          <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
            {listError?.response?.data?.message || listError?.message || 'A network or server error occurred while retrieving notification records.'}
          </p>
          <div className="mt-4">
            <Button
              size="sm"
              onClick={() => refetchList()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Retry Request
            </Button>
          </div>
        </Card>
      ) : notifications.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={Filter}
            title="No notifications match your filters"
            description="Try modifying or resetting your search term, status filter, or channel settings."
            action={
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Booking reminders, payment receipts, and other business notifications will appear here when generated."
          />
        )
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const category = getNotificationCategory(n);
            const isUnread = n.status === 'SENT';

            return (
              <Card
                key={n.id}
                onClick={() => handleOpenDetail(n)}
                className={`p-4 sm:p-5 border transition-all cursor-pointer hover:border-orange-300 hover:shadow-md ${
                  isUnread
                    ? 'border-orange-200/90 bg-gradient-to-r from-orange-50/20 via-white to-white'
                    : 'border-stone-200/80 bg-white'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Unread indicator dot */}
                    <div className="pt-1.5 shrink-0">
                      {isUnread ? (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-600"></span>
                        </span>
                      ) : (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-stone-300"></span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Top row: Category tag & badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                          {category}
                        </span>
                        {getStatusBadge(n.status)}
                        {getChannelBadge(n.channel)}
                      </div>

                      {/* Subject */}
                      <h3 className="font-semibold text-stone-900 text-sm sm:text-base leading-snug break-words">
                        {n.subject || 'Notification Dispatch'}
                      </h3>

                      {/* Recipient and reference details */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <span className="text-stone-400">Recipient:</span>
                          <span className="font-medium text-stone-800 break-all">{n.recipient}</span>
                        </div>

                        {n.customers?.full_name && (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-stone-400" />
                            <span className="text-stone-700">{n.customers.full_name}</span>
                          </div>
                        )}

                        {n.bookings?.booking_number && (
                          <div className="flex items-center gap-1 text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded text-[11px]">
                            <Hash className="w-3 h-3 text-orange-500" />
                            <span>Booking #{n.bookings.booking_number}</span>
                          </div>
                        )}

                        {n.enquiries?.customer_name && (
                          <div className="flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                            <span>Enquiry: {n.enquiries.customer_name}</span>
                          </div>
                        )}

                        {n.consultations?.requested_name && (
                          <div className="flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[11px]">
                            <span>Consultation: {n.consultations.requested_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Error snippet if failed */}
                      {n.status === 'FAILED' && n.error_message && (
                        <div className="mt-2 text-xs text-rose-600 bg-rose-50/70 p-2 rounded-lg border border-rose-100 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span className="font-mono text-[11px] truncate">{n.error_message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: Dates & View Detail button */}
                  <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 gap-1.5">
                    <div className="text-right">
                      <div className="text-xs text-stone-600 font-medium flex items-center md:justify-end gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>{formatDate(n.created_at)}</span>
                      </div>
                      <span className="text-[11px] text-stone-400 block mt-0.5">
                        {n.sent_at ? `Sent: ${formatDate(n.sent_at)}` : `Scheduled: ${formatDate(n.scheduled_at)}`}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(n);
                      }}
                      className="text-stone-600 hover:text-orange-600 hover:bg-orange-50 text-xs px-2.5 py-1"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <span className="text-xs text-stone-500">
                Showing page <span className="font-semibold text-stone-800">{meta.page}</span> of{' '}
                <span className="font-semibold text-stone-800">{meta.totalPages}</span> ({meta.total} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  className="text-xs"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {/* 5. Notification Details Drawer / Modal */}
      {isDetailDrawerOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsDetailDrawerOpen(false)}
          />

          {/* Slide-over panel */}
          <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Notification Details</h3>
                  <p className="text-xs text-stone-500">
                    ID: <span className="font-mono text-stone-700">{selectedNotification.id.slice(0, 13)}...</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Status and Type Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(selectedNotification.status)}
                {getChannelBadge(selectedNotification.channel)}
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                  {getNotificationCategory(selectedNotification)}
                </span>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                  Subject Line
                </label>
                <p className="text-base font-bold text-stone-900 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {selectedNotification.subject || 'No subject provided'}
                </p>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                    Recipient Address
                  </span>
                  <span className="text-sm font-medium text-stone-800 break-all">
                    {selectedNotification.recipient}
                  </span>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                    Channel & Retries
                  </span>
                  <span className="text-sm font-medium text-stone-800">
                    {selectedNotification.channel} (Retries: {selectedNotification.retry_count ?? 0}/3)
                  </span>
                </div>
              </div>


              {/* Associated Business Record */}
              {(selectedNotification.customers ||
                selectedNotification.bookings ||
                selectedNotification.enquiries ||
                selectedNotification.consultations) && (
                <div>
                  <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
                    Associated Record
                  </label>
                  <div className="p-3.5 rounded-xl border border-orange-100 bg-orange-50/40 text-xs space-y-2">
                    {selectedNotification.customers && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Customer:</span>
                        <span className="font-semibold text-stone-800">
                          {selectedNotification.customers.full_name} ({selectedNotification.customers.phone || 'No phone'})
                        </span>
                      </div>
                    )}
                    {selectedNotification.bookings && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Booking:</span>
                        <span className="font-semibold text-stone-800">
                          #{selectedNotification.bookings.booking_number} ({selectedNotification.bookings.status})
                        </span>
                      </div>
                    )}
                    {selectedNotification.enquiries && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Enquiry:</span>
                        <span className="font-semibold text-stone-800">
                          {selectedNotification.enquiries.customer_name} ({selectedNotification.enquiries.status})
                        </span>
                      </div>
                    )}
                    {selectedNotification.consultations && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Consultation:</span>
                        <span className="font-semibold text-stone-800">
                          {selectedNotification.consultations.requested_name} ({selectedNotification.consultations.status})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Failure Error Message */}
              {selectedNotification.status === 'FAILED' && selectedNotification.error_message && (
                <div>
                  <label className="text-xs font-semibold text-rose-500 uppercase tracking-wider block mb-1">
                    Failure Reason
                  </label>
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 font-mono break-words">
                    {selectedNotification.error_message}
                  </div>
                </div>
              )}

              {/* Full Message Body Preview */}
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                  Message Content Preview
                </label>
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 max-h-72 overflow-y-auto text-xs text-stone-800 leading-relaxed font-sans">
                  {selectedNotification.message_body?.includes('<') ? (
                    <div
                      className="prose prose-xs max-w-none text-stone-700"
                      dangerouslySetInnerHTML={{ __html: selectedNotification.message_body }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-stone-800">
                      {selectedNotification.message_body || 'No message content recorded.'}
                    </pre>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-1.5 text-stone-500">
                <div className="flex items-center justify-between">
                  <span>Created:</span>
                  <span className="font-medium text-stone-700">{formatDate(selectedNotification.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Scheduled:</span>
                  <span className="font-medium text-stone-700">{formatDate(selectedNotification.scheduled_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sent At:</span>
                  <span className="font-medium text-stone-700">
                    {selectedNotification.sent_at ? formatDate(selectedNotification.sent_at) : 'Not dispatched yet'}
                  </span>
                </div>
                {selectedNotification.provider_message_id && (
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-[11px]">
                    <span>Provider ID:</span>
                    <span className="font-mono text-stone-600 truncate max-w-[200px]">
                      {selectedNotification.provider_message_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-stone-200 bg-stone-50/60 flex items-center justify-between">
              {selectedNotification.status === 'SENT' ? (
                <Button
                  size="sm"
                  isLoading={markSingleMutation.isPending}
                  onClick={() => markSingleMutation.mutate(selectedNotification.id)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  Mark as Read / Delivered
                </Button>
              ) : selectedNotification.status === 'FAILED' ? (
                <Button
                  size="sm"
                  isLoading={retryMutation.isPending}
                  onClick={() => retryMutation.mutate(selectedNotification.id)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Retry Delivery
                </Button>
              ) : (
                <div className="text-xs text-stone-400 italic">
                  Status: {selectedNotification.status}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailDrawerOpen(false)}
                className="border-stone-300 text-stone-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
