'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Plus,
  Search,
  Clock,
  Edit,
  Trash2,
  Archive,
  Eye,
  X,
  AlertTriangle,
  RefreshCw,
  Package,
  CheckCircle2,
  Filter,
  Layers,
  IndianRupee,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Card, PageHeader, Button, LoadingSpinner, EmptyState, Badge, ModernDropdown, ModernTimePicker } from '@/components/ui';
import { useModalAlert } from '@/components/ui/ModalAlert';
import { serviceApi } from '@/services/api/modules';
import { formatINR } from '@/utils/formatters';

// Canonical suggested bridal artistry categories with luxury color accents
const CATEGORY_OPTIONS = [
  { value: 'Bridal Makeup', label: 'Bridal Makeup', badgeColor: 'bg-rose-500' },
  { value: 'Reception Makeup', label: 'Reception Makeup', badgeColor: 'bg-pink-500' },
  { value: 'Engagement Makeup', label: 'Engagement Makeup', badgeColor: 'bg-purple-500' },
  { value: 'Party Makeup', label: 'Party Makeup', badgeColor: 'bg-amber-500' },
  { value: 'HD Makeup', label: 'HD Makeup', badgeColor: 'bg-orange-500' },
  { value: 'Airbrush Makeup', label: 'Airbrush Makeup', badgeColor: 'bg-sky-500' },
  { value: 'Hairstyling', label: 'Hairstyling', badgeColor: 'bg-emerald-500' },
  { value: 'Saree Draping', label: 'Saree Draping', badgeColor: 'bg-teal-500' },
  { value: 'Mehndi', label: 'Mehndi', badgeColor: 'bg-lime-600' },
  { value: 'Other', label: 'Other Party / Event', badgeColor: 'bg-stone-400' },
];

const FILTER_CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  ...CATEGORY_OPTIONS,
];

const FILTER_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active Only', badgeColor: 'bg-emerald-500' },
  { value: 'ARCHIVED', label: 'Archived Only', badgeColor: 'bg-stone-400' },
];

const DURATION_OPTIONS = [
  { value: '', label: '-- Not specified (Flexible) --' },
  { value: '30', label: '30 minutes (Express)' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour (60 mins)' },
  { value: '90', label: '1.5 hours (90 mins)' },
  { value: '120', label: '2 hours (120 mins)' },
  { value: '150', label: '2.5 hours (150 mins)' },
  { value: '180', label: '3 hours (180 mins)' },
  { value: '240', label: '4 hours (240 mins)' },
  { value: '300', label: '5 hours (300 mins)' },
  { value: '360', label: '6 hours (Full day makeover)' },
  { value: 'CUSTOM', label: 'Custom duration (specify hrs/mins)...' },
];

const STATUS_OPTIONS = [
  { value: 'true', label: 'Active (Available)', badgeColor: 'bg-emerald-500' },
  { value: 'false', label: 'Archived (Inactive)', badgeColor: 'bg-stone-400' },
];

/**
 * Format duration minutes into user-friendly string
 * e.g., 60 -> "1 hour", 120 -> "2 hours", 180 -> "3 hours", 300 -> "5 hours"
 */
function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return 'Flexible / On request';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs} hr ${mins} mins`;
  }
  if (hrs > 0) {
    return hrs === 1 ? '1 hour' : `${hrs} hours`;
  }
  return `${mins} mins`;
}

/**
 * Infer category from service name or description (or default to Bridal Makeup)
 */
function detectCategory(name, desc) {
  const text = `${name || ''} ${desc || ''}`.toLowerCase();
  if (text.includes('airbrush')) return 'Airbrush Makeup';
  if (text.includes('hd') || text.includes('high definition')) return 'HD Makeup';
  if (text.includes('reception')) return 'Reception Makeup';
  if (text.includes('engagement') || text.includes('nichayathartham')) return 'Engagement Makeup';
  if (text.includes('party') || text.includes('guest') || text.includes('family')) return 'Party Makeup';
  if (text.includes('hair') || text.includes('hairstyle') || text.includes('updo')) return 'Hairstyling';
  if (text.includes('saree') || text.includes('drape') || text.includes('draping')) return 'Saree Draping';
  if (text.includes('mehndi') || text.includes('mehendi') || text.includes('henna')) return 'Mehndi';
  if (text.includes('bridal') || text.includes('muhurtham') || text.includes('wedding')) return 'Bridal Makeup';
  return 'Bridal Makeup';
}

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useModalAlert();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'ARCHIVED'

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [viewingServiceId, setViewingServiceId] = useState(null);

  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Bridal Makeup',
    description: '',
    default_price_rupees: '',
    duration_minutes: '',
    custom_hours: '',
    custom_minutes: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  // 1. Fetch Services from Backend
  const {
    data: servicesRes,
    isLoading,
    isError,
    error: fetchError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceApi.list({ limit: 100 }),
  });

  const rawServices = useMemo(() => {
    return servicesRes?.data?.services || [];
  }, [servicesRes]);

  // Augment each service with inferred/preset category for smart filtering & display
  const services = useMemo(() => {
    return rawServices.map((s) => ({
      ...s,
      category: detectCategory(s.name, s.description),
    }));
  }, [rawServices]);

  // 2. Fetch Detailed Service Info (for Details Modal)
  const {
    data: detailRes,
    isLoading: isLoadingDetail,
  } = useQuery({
    queryKey: ['service-detail', viewingServiceId],
    queryFn: () => serviceApi.getById(viewingServiceId),
    enabled: !!viewingServiceId,
  });

  const selectedService = useMemo(() => {
    if (!detailRes?.data) return null;
    const s = detailRes.data;
    return {
      ...s,
      category: detectCategory(s.name, s.description),
    };
  }, [detailRes]);

  // 3. Summary Metric Computations
  const metrics = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.is_active).length;
    const categoriesSet = new Set(services.map((s) => s.category));
    const activeWithPrice = services.filter((s) => s.is_active && Number(s.default_price_paise) > 0);
    const avgPricePaise =
      activeWithPrice.length > 0
        ? Math.round(
            activeWithPrice.reduce((acc, curr) => acc + Number(curr.default_price_paise || 0), 0) /
              activeWithPrice.length
          )
        : 0;

    return {
      total,
      active,
      categoriesCount: categoriesSet.size,
      avgPricePaise,
    };
  }, [services]);

  // Unique categories actually present in loaded services
  const availableCategories = useMemo(() => {
    const set = new Set(services.map((s) => s.category));
    return Array.from(set).sort();
  }, [services]);

  // 4. Filtering and Searching logic
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && !s.is_active) return false;
      if (statusFilter === 'ARCHIVED' && s.is_active) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;

      // Search term (name, category, description)
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchDesc = (s.description || '').toLowerCase().includes(q);
        const matchCat = (s.category || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [services, statusFilter, categoryFilter, searchTerm]);

  // 5. Create Service Mutation
  const createMutation = useMutation({
    mutationFn: (payload) => serviceApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsAddModalOpen(false);
      resetForm();
      showAlert({
        title: 'Service Added',
        message: `"${res?.data?.name || 'Service'}" added successfully.`,
        type: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create service';
      showAlert({
        title: 'Could Not Create Service',
        message: msg,
        type: 'error',
      });
    },
  });

  // 6. Update Service Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => serviceApi.update(id, data),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-detail', vars.id] });
      setEditingService(null);
      resetForm();
      showAlert({
        title: 'Service Updated',
        message: 'Service updated successfully.',
        type: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update service';
      showAlert({
        title: 'Update Failed',
        message: msg,
        type: 'error',
      });
    },
  });

  // 7. Archive Service Mutation (Soft delete)
  const archiveMutation = useMutation({
    mutationFn: (id) => serviceApi.archive(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-detail', id] });
      showAlert({
        title: 'Service Archived',
        message: 'Service marked as archived.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Archival Failed',
        message: err.response?.data?.message || err.message || 'Could not archive service.',
        type: 'error',
      });
    },
  });

  // 8. Delete Service Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => serviceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      if (viewingServiceId) setViewingServiceId(null);
      showAlert({
        title: 'Service Removed',
        message: 'Service was safely removed from your catalog.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Delete Failed',
        message:
          err.response?.data?.message ||
          err.message ||
          'Could not delete service. It may be linked to packages or bookings.',
        type: 'error',
      });
    },
  });

  // Form helpers
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Bridal Makeup',
      description: '',
      default_price_rupees: '',
      duration_minutes: '',
      custom_hours: '',
      custom_minutes: '',
      is_active: true,
    });
    setFormErrors({});
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const PRESET_DURATIONS = ['30', '45', '60', '90', '120', '150', '180', '240', '300', '360'];

  const openEditModal = (service) => {
    let durVal = '';
    let customH = '';
    let customM = '';

    if (service.duration_minutes !== null && service.duration_minutes !== undefined && service.duration_minutes !== '') {
      const minsNum = Number(service.duration_minutes);
      if (minsNum > 0) {
        if (PRESET_DURATIONS.includes(minsNum.toString())) {
          durVal = minsNum.toString();
        } else {
          durVal = 'CUSTOM';
          const h = Math.floor(minsNum / 60);
          const m = minsNum % 60;
          customH = h > 0 ? h.toString() : '';
          customM = m > 0 ? m.toString() : '';
        }
      }
    }

    setFormData({
      name: service.name || '',
      category: service.category || 'Bridal Makeup',
      description: service.description || '',
      default_price_rupees:
        service.default_price_paise !== undefined && Number(service.default_price_paise) > 0
          ? (Number(service.default_price_paise) / 100).toString()
          : '',
      duration_minutes: durVal,
      custom_hours: customH,
      custom_minutes: customM,
      is_active: service.is_active !== undefined ? service.is_active : true,
    });
    setFormErrors({});
    setEditingService(service);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Service name must be at least 2 characters';
    }

    // Price is optional: if provided, must be valid non-negative number
    if (formData.default_price_rupees !== '' && formData.default_price_rupees !== undefined) {
      const priceNum = Number(formData.default_price_rupees);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.default_price_rupees = 'Price must be a valid non-negative number';
      }
    }

    // Custom duration validation
    if (formData.duration_minutes === 'CUSTOM') {
      const h = formData.custom_hours !== '' ? Number(formData.custom_hours) : 0;
      const m = formData.custom_minutes !== '' ? Number(formData.custom_minutes) : 0;
      if (isNaN(h) || h < 0 || isNaN(m) || m < 0) {
        errors.custom_duration = 'Duration must be valid numbers';
      } else if (h === 0 && m === 0) {
        errors.custom_duration = 'Please specify at least hours or minutes';
      } else if (m >= 60) {
        errors.custom_duration = 'Minutes should be less than 60';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Optional price conversion
    const pricePaise =
      formData.default_price_rupees !== '' && formData.default_price_rupees !== undefined
        ? Math.max(0, Math.round(Number(formData.default_price_rupees) * 100))
        : 0;

    // Optional duration minutes (integer or null)
    let durationMin = null;
    if (formData.duration_minutes === 'CUSTOM') {
      const h = formData.custom_hours ? parseInt(formData.custom_hours, 10) : 0;
      const m = formData.custom_minutes ? parseInt(formData.custom_minutes, 10) : 0;
      const total = h * 60 + m;
      if (total > 0) durationMin = total;
    } else if (formData.duration_minutes) {
      durationMin = parseInt(formData.duration_minutes, 10);
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      default_price_paise: pricePaise,
      duration_minutes: durationMin,
      is_active: formData.is_active,
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleArchiveService = async (service) => {
    const confirmed = await showConfirm({
      title: 'Archive this service?',
      message: `"${service.name}" will be marked as inactive while preserving historical packages and bookings.`,
      confirmText: 'Archive Service',
      cancelText: 'Cancel',
      type: 'warning',
    });

    if (confirmed) {
      archiveMutation.mutate(service.id);
    }
  };

  const handleDeleteService = async (service) => {
    const linkedPkgsCount = service.package_services?.length || 0;
    const warningExtra =
      linkedPkgsCount > 0
        ? ` Note: This service is currently linked to ${linkedPkgsCount} package(s). You must remove it from packages first or archive it.`
        : '';

    const confirmed = await showConfirm({
      title: 'Remove this service?',
      message: `Please confirm that you want to remove "${service.name}". Existing packages or bookings may reference it.${warningExtra}`,
      confirmText: 'Remove Service',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(service.id);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#F0E7DE]">
        <div>
          <div className="text-xs font-semibold text-[#F97316] tracking-wide uppercase flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Service Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#292524] tracking-tight">
            Artistry Services
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-1">
            Manage your makeup, hairstyling, draping, and beauty service offerings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={openAddModal}
            className="bg-[#F97316] hover:bg-[#C2410C] text-white shadow-xs gap-1.5 cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Services */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                Total Services
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#292524] mt-1">
                {isLoading ? '—' : metrics.total}
              </h3>
              <p className="text-[11px] text-[#78716C] mt-0.5">Catalog entries</p>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center border border-orange-100 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 2: Active Services */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                Active Services
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1">
                {isLoading ? '—' : metrics.active}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Ready for booking</p>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 3: Service Categories */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                Categories
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#292524] mt-1">
                {isLoading ? '—' : metrics.categoriesCount}
              </h3>
              <p className="text-[11px] text-[#78716C] mt-0.5">Specializations</p>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 4: Average Service Price */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                Average Price
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-amber-700 mt-1">
                {isLoading ? '—' : formatINR(metrics.avgPricePaise)}
              </h3>
              <p className="text-[11px] text-[#78716C] mt-0.5">Per artistry session</p>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-[#F0E7DE] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search services by name, category or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-[#FFFDF9] border border-[#F0E7DE] rounded-xl text-xs sm:text-sm text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 p-0.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Category Filter */}
            <div className="w-full sm:w-48">
              <ModernDropdown
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                options={FILTER_CATEGORY_OPTIONS}
                placeholder="All Categories"
                buttonClassName="py-2 bg-[#FFFDF9]"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-36">
              <ModernDropdown
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={FILTER_STATUS_OPTIONS}
                placeholder="All Status"
                buttonClassName="py-2 bg-[#FFFDF9]"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              title="Refresh services"
              className="p-2 text-stone-500 hover:text-stone-800 rounded-xl border border-[#F0E7DE] bg-white hover:bg-stone-50 transition-colors shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#F97316]' : ''}`} />
            </button>

            {/* Clear filters shortcut */}
            {(searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleClearFilters}
                className="text-stone-500 hover:text-stone-800 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Service List Section: Loading / Error / Empty / Grid */}
      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner text="Fetching studio artistry services..." />
        </div>
      ) : isError ? (
        <Card className="p-8 text-center border-rose-200 bg-rose-50/40 rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#292524] text-base mb-1">Unable to load services</h3>
          <p className="text-xs text-[#78716C] max-w-sm mx-auto mb-4">
            {fetchError?.message || "We couldn't retrieve your services. Please try again."}
          </p>
          <Button
            size="sm"
            onClick={() => refetch()}
            className="bg-[#292524] hover:bg-stone-800 text-white cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </Card>
      ) : services.length === 0 ? (
        /* Zero services in studio catalog */
        <EmptyState
          icon={Sparkles}
          title="No services added yet"
          description="Create your first artistry service to manage pricing, estimated duration, and bridal offerings."
          action={
            <Button
              size="sm"
              onClick={openAddModal}
              className="bg-[#F97316] hover:bg-[#C2410C] text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Your First Service
            </Button>
          }
        />
      ) : filteredServices.length === 0 ? (
        /* Filters or search produced zero results */
        <EmptyState
          icon={Search}
          title="No matching services"
          description="Try a different search term or adjust your filters."
          action={
            <Button size="sm" variant="outline" onClick={handleClearFilters} className="cursor-pointer">
              Clear Filters
            </Button>
          }
        />
      ) : (
        /* Responsive Service Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const linkedPackages = (service.package_services || []).map((ps) => ps.packages).filter(Boolean);

            return (
              <Card
                key={service.id}
                className="p-5 border-[#F0E7DE] hover:border-[#F97316]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between group rounded-2xl bg-white"
              >
                <div>
                  {/* Card Header: Category Chip, Status Badge */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#F0E7DE]/70">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-orange-50 text-[#C2410C] border border-orange-200/60">
                      {service.category}
                    </span>

                    <Badge
                      variant={service.is_active ? 'success' : 'default'}
                      className="text-[10px] font-medium"
                    >
                      {service.is_active ? 'Active' : 'Archived'}
                    </Badge>
                  </div>

                  {/* Service Title & Description */}
                  <div className="mt-3">
                    <h4 className="font-bold text-[#292524] text-base leading-snug group-hover:text-[#F97316] transition-colors">
                      {service.name}
                    </h4>
                    <p className="text-xs text-[#78716C] mt-1.5 line-clamp-2 leading-relaxed">
                      {service.description || 'Professional bridal artistry service with custom styling.'}
                    </p>
                  </div>

                  {/* Information: Price & Duration */}
                  <div className="mt-4 p-3 bg-[#FFFDF9] rounded-xl border border-[#F0E7DE] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block tracking-wider">
                        Default Price
                      </span>
                      <span className="text-base font-extrabold text-[#292524]">
                        {Number(service.default_price_paise) > 0
                          ? formatINR(service.default_price_paise)
                          : 'On Request'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block tracking-wider">
                        Est. Duration
                      </span>
                      <span className="text-xs font-semibold text-stone-700 flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-[#F97316]" />
                        {formatDuration(service.duration_minutes)}
                      </span>
                    </div>
                  </div>

                  {/* Package Inclusions Indicator */}
                  {linkedPackages.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-stone-500">
                      <Package className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">
                        Included in {linkedPackages.length} package
                        {linkedPackages.length === 1 ? '' : 's'} (
                        {linkedPackages.map((p) => p.name).join(', ')})
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-[#F0E7DE] flex items-center justify-between gap-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setViewingServiceId(service.id)}
                    className="text-stone-700 hover:text-[#F97316] font-bold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    View Details
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(service)}
                      title="Edit Service"
                      className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {service.is_active && (
                      <button
                        type="button"
                        onClick={() => handleArchiveService(service)}
                        title="Archive Service"
                        className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteService(service)}
                      title="Remove Service"
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT SERVICE                                               */}
      {/* ========================================================================= */}
      {(isAddModalOpen || editingService) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#F0E7DE] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-[#FFFDF9] border-b border-[#F0E7DE] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#292524] text-base leading-tight">
                    {editingService ? 'Edit Artistry Service' : 'Add New Artistry Service'}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {editingService
                      ? 'Update pricing, description and session duration'
                      : 'Define service offerings with pricing and estimated durations'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingService(null);
                  resetForm();
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Service Name */}
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bridal HD Makeover & Saree Draping"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.name}</p>
                )}
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1">Category</label>
                  <ModernDropdown
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    options={CATEGORY_OPTIONS}
                    placeholder="Select category"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1">Status</label>
                  <ModernDropdown
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(val) => setFormData({ ...formData, is_active: val === 'true' })}
                    options={STATUS_OPTIONS}
                    placeholder="Select status"
                  />
                </div>
              </div>

              {/* Pricing & Duration */}
              <div className="p-3.5 bg-stone-50/70 rounded-2xl border border-stone-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#292524]">
                      Default Price (₹ Rupees)
                    </label>
                    <span className="text-[10px] text-stone-400 font-medium">Optional</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-stone-400 font-semibold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 15000 (Optional)"
                      value={formData.default_price_rupees}
                      onChange={(e) => setFormData({ ...formData, default_price_rupees: e.target.value })}
                      className="w-full text-xs pl-8 pr-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                    />
                  </div>
                  {formErrors.default_price_rupees && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">
                      {formErrors.default_price_rupees}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#292524]">
                      Estimated Duration
                    </label>
                    <span className="text-[10px] text-stone-400 font-medium">Optional</span>
                  </div>
                  <ModernDropdown
                    value={formData.duration_minutes}
                    onChange={(val) => {
                      setFormData({
                        ...formData,
                        duration_minutes: val,
                        // if switching away from CUSTOM, clear custom errors
                      });
                      if (formErrors.custom_duration) {
                        setFormErrors((prev) => ({ ...prev, custom_duration: undefined }));
                      }
                    }}
                    options={DURATION_OPTIONS}
                    placeholder="-- Select duration (Optional) --"
                  />

                  {formData.duration_minutes && formData.duration_minutes !== 'CUSTOM' && (
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                      <span>Selected: {formatDuration(Number(formData.duration_minutes))}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, duration_minutes: '' })}
                        className="text-[10px] text-stone-400 hover:text-stone-700 underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Custom Duration Inputs when CUSTOM is selected */}
                  {formData.duration_minutes === 'CUSTOM' && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#F97316]" /> Enter Custom Duration
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              duration_minutes: '',
                              custom_hours: '',
                              custom_minutes: '',
                            })
                          }
                          className="text-[10px] text-stone-400 hover:text-stone-700 underline"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-stone-600 mb-0.5">Hours</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              placeholder="e.g. 2"
                              value={formData.custom_hours}
                              onChange={(e) =>
                                setFormData({ ...formData, custom_hours: e.target.value })
                              }
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 font-semibold text-[#292524]"
                            />
                            <span className="absolute right-2.5 top-1.5 text-[10px] text-stone-400 pointer-events-none">
                              hrs
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-stone-600 mb-0.5">Minutes</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              step="5"
                              placeholder="e.g. 30"
                              value={formData.custom_minutes}
                              onChange={(e) =>
                                setFormData({ ...formData, custom_minutes: e.target.value })
                              }
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 font-semibold text-[#292524]"
                            />
                            <span className="absolute right-2.5 top-1.5 text-[10px] text-stone-400 pointer-events-none">
                              mins
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Summary preview of custom duration */}
                      {(formData.custom_hours || formData.custom_minutes) && (
                        <div className="text-[10px] text-stone-600 font-medium pt-0.5 flex items-center justify-between">
                          <span>
                            Total:{' '}
                            <strong className="text-[#C2410C]">
                              {formatDuration(
                                (Number(formData.custom_hours || 0) * 60) +
                                  Number(formData.custom_minutes || 0)
                              )}
                            </strong>{' '}
                            ({(Number(formData.custom_hours || 0) * 60) + Number(formData.custom_minutes || 0)} mins)
                          </span>
                        </div>
                      )}

                      {formErrors.custom_duration && (
                        <p className="text-[10px] text-rose-500 font-medium">
                          {formErrors.custom_duration}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1">
                  Description & Inclusions (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Includes luxury skin prep, HD airbrush foundation, false lashes, premium hair styling, and accessories placement."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#F0E7DE]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingService(null);
                    resetForm();
                  }}
                  disabled={isSaving}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="bg-[#F97316] hover:bg-[#C2410C] text-white shadow-xs cursor-pointer"
                >
                  {isSaving ? 'Saving Service...' : editingService ? 'Update Service' : 'Save Service'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW SERVICE DETAILS                                             */}
      {/* ========================================================================= */}
      {viewingServiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#F0E7DE] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4.5 bg-[#FFFDF9] border-b border-[#F0E7DE] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#292524] text-base leading-tight">Service Details</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Review pricing, duration, and associated package combinations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingServiceId(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {isLoadingDetail ? (
              <div className="p-8">
                <LoadingSpinner text="Loading service details..." />
              </div>
            ) : selectedService ? (
              <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
                {/* Title & Category */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F0E7DE]">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-orange-50 text-[#C2410C] border border-orange-200/60 mb-1">
                      {selectedService.category}
                    </span>
                    <h3 className="text-lg font-bold text-[#292524]">{selectedService.name}</h3>
                  </div>
                  <Badge variant={selectedService.is_active ? 'success' : 'default'}>
                    {selectedService.is_active ? 'Active' : 'Archived'}
                  </Badge>
                </div>

                {/* Description */}
                <div>
                  <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                    Description & Inclusions
                  </span>
                  <p className="text-stone-700 bg-stone-50/70 p-3 rounded-xl border border-stone-200/70 leading-relaxed">
                    {selectedService.description || 'No detailed description provided for this service.'}
                  </p>
                </div>

                {/* Pricing & Duration stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#FFFDF9] rounded-xl border border-[#F0E7DE]">
                    <span className="text-[10px] uppercase font-semibold text-stone-400 block tracking-wider">
                      Standard Default Price
                    </span>
                    <span className="text-lg font-extrabold text-[#292524] mt-0.5 block">
                      {Number(selectedService.default_price_paise) > 0
                        ? formatINR(selectedService.default_price_paise)
                        : 'On Request'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#FFFDF9] rounded-xl border border-[#F0E7DE]">
                    <span className="text-[10px] uppercase font-semibold text-stone-400 block tracking-wider">
                      Session Duration
                    </span>
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4 text-[#F97316]" />
                      {formatDuration(selectedService.duration_minutes)}
                    </span>
                  </div>
                </div>

                {/* Associated Packages */}
                <div>
                  <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
                    Included in Bridal Packages
                  </span>
                  {selectedService.package_services && selectedService.package_services.length > 0 ? (
                    <div className="space-y-2">
                      {selectedService.package_services.map((ps) => {
                        const pkg = ps.packages;
                        return (
                          <div
                            key={ps.id}
                            className="p-3 bg-white rounded-xl border border-[#F0E7DE] flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-amber-600 shrink-0" />
                              <div>
                                <h5 className="font-bold text-stone-900 text-xs">
                                  {pkg?.name || ps.service_name_snapshot}
                                </h5>
                                <span className="text-[10px] text-stone-400">
                                  Quantity: {ps.quantity} • Package Price: {formatINR(pkg?.price_paise || 0)}
                                </span>
                              </div>
                            </div>
                            <Badge variant={pkg?.is_active ? 'success' : 'default'} className="text-[10px]">
                              {pkg?.is_active ? 'Active' : 'Draft'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-400 text-center text-xs">
                      This service is currently not linked to any composite package.
                    </div>
                  )}
                </div>

                {/* Action Buttons in Details */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#F0E7DE]">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const toEdit = selectedService;
                      setViewingServiceId(null);
                      openEditModal(toEdit);
                    }}
                    className="cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Edit Service
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setViewingServiceId(null)}
                    className="bg-[#292524] text-white hover:bg-stone-800 cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-stone-500">Service not found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
