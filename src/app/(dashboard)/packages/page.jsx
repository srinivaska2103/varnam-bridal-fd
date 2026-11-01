'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Search,
  Check,
  X,
  Edit,
  Trash2,
  Archive,
  Eye,
  RefreshCw,
  Sparkles,
  Layers,
  IndianRupee,
  Clock,
  Globe,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, PageHeader, Button, LoadingSpinner, EmptyState, Badge, ModernDropdown } from '@/components/ui';
import { useModalAlert } from '@/components/ui/ModalAlert';
import { packageApi, serviceApi } from '@/services/api/modules';
import { formatINR } from '@/utils/formatters';

// Suggested bridal event categories for packages (compatible with free-text categorization & tags)
const PACKAGE_CATEGORIES = [
  { value: 'Muhurtham', label: 'Muhurtham Bridal', badgeColor: 'bg-rose-500' },
  { value: 'Reception', label: 'Reception Glam', badgeColor: 'bg-pink-500' },
  { value: 'Engagement', label: 'Engagement & Roka', badgeColor: 'bg-purple-500' },
  { value: 'Sangeet', label: 'Sangeet & Haldi', badgeColor: 'bg-amber-500' },
  { value: 'Pre-Wedding', label: 'Pre-Wedding Shoot', badgeColor: 'bg-sky-500' },
  { value: 'Party Makeup', label: 'Party & Guest Combo', badgeColor: 'bg-emerald-500' },
  { value: 'Bridal Combo', label: 'Signature Full Combo', badgeColor: 'bg-orange-500' },
  { value: 'Custom Package', label: 'Custom Luxury Combo', badgeColor: 'bg-stone-500' },
];

const FILTER_CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  ...PACKAGE_CATEGORIES,
];

const FILTER_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active Only', badgeColor: 'bg-emerald-500' },
  { value: 'ARCHIVED', label: 'Archived Only', badgeColor: 'bg-stone-400' },
];

const FILTER_VISIBILITY_OPTIONS = [
  { value: 'ALL', label: 'All Visibilities' },
  { value: 'PUBLIC', label: 'Public Website', badgeColor: 'bg-blue-500' },
  { value: 'PRIVATE', label: 'Internal Only', badgeColor: 'bg-stone-400' },
];

/**
 * Format duration minutes into user-friendly text
 */
function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return null;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} mins`;
  if (hrs > 0) return hrs === 1 ? '1 hour' : `${hrs} hours`;
  return `${mins} mins`;
}

/**
 * Detect or infer category from package name / description / services
 */
function detectPackageCategory(name, desc = '') {
  const text = `${name || ''} ${desc || ''}`.toLowerCase();
  if (text.includes('muhurtham') || text.includes('muhurth')) return 'Muhurtham';
  if (text.includes('reception')) return 'Reception';
  if (text.includes('engagement') || text.includes('roka') || text.includes('nichaya')) return 'Engagement';
  if (text.includes('sangeet') || text.includes('haldi') || text.includes('mehendi') || text.includes('mehndi')) return 'Sangeet';
  if (text.includes('pre-wedding') || text.includes('pre wedding') || text.includes('shoot')) return 'Pre-Wedding';
  if (text.includes('party') || text.includes('family') || text.includes('guest')) return 'Party Makeup';
  if (text.includes('signature') || text.includes('royal') || text.includes('combo') || text.includes('full')) return 'Bridal Combo';
  return 'Custom Package';
}

export default function PackagesPage() {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useModalAlert();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'ARCHIVED'
  const [visibilityFilter, setVisibilityFilter] = useState('ALL'); // 'ALL' | 'PUBLIC' | 'PRIVATE'

  // Modal & Drawer states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [viewingPackageId, setViewingPackageId] = useState(null);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');

  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_rupees: '',
    is_public: false,
    is_active: true,
    display_order: 0,
    services: [], // array of { service_id, service_name_snapshot, quantity, default_price_paise, duration_minutes, notes }
  });
  const [formErrors, setFormErrors] = useState({});

  // 1. Fetch Packages from Backend
  const {
    data: packagesRes,
    isLoading: isLoadingPackages,
    isError: isPackagesError,
    error: packagesError,
    refetch: refetchPackages,
    isFetching: isFetchingPackages,
  } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageApi.list({ limit: 100 }),
  });

  const rawPackages = useMemo(() => {
    return packagesRes?.data?.packages || [];
  }, [packagesRes]);

  // Augment packages with category tag
  const packages = useMemo(() => {
    return rawPackages.map((pkg) => ({
      ...pkg,
      category: detectPackageCategory(pkg.name, pkg.description),
    }));
  }, [rawPackages]);

  // 2. Fetch Available Services for Package Builder & Inclusions
  const {
    data: servicesRes,
    isLoading: isLoadingServices,
  } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceApi.list({ limit: 100 }),
  });

  const availableServices = useMemo(() => {
    const list = servicesRes?.data?.services || [];
    return list;
  }, [servicesRes]);

  // 3. Fetch Single Package Details (for Details modal)
  const {
    data: detailRes,
    isLoading: isLoadingDetail,
  } = useQuery({
    queryKey: ['package-detail', viewingPackageId],
    queryFn: () => packageApi.getById(viewingPackageId),
    enabled: !!viewingPackageId,
  });

  const selectedPackage = useMemo(() => {
    if (!detailRes?.data) return null;
    const p = detailRes.data;
    return {
      ...p,
      category: detectPackageCategory(p.name, p.description),
    };
  }, [detailRes]);

  // 4. Summary Metric Computations
  const metrics = useMemo(() => {
    const total = packages.length;
    const active = packages.filter((p) => p.is_active).length;
    const activePackages = packages.filter((p) => p.is_active && Number(p.price_paise) > 0);
    const avgPricePaise =
      activePackages.length > 0
        ? Math.round(
            activePackages.reduce((acc, curr) => acc + Number(curr.price_paise || 0), 0) /
              activePackages.length
          )
        : 0;

    // Total distinct services included across all packages
    let totalIncludedServicesCount = 0;
    packages.forEach((p) => {
      totalIncludedServicesCount += (p.package_services?.length || 0);
    });

    return {
      total,
      active,
      avgPricePaise,
      totalIncludedServicesCount,
    };
  }, [packages]);

  // 5. Filtering and Searching logic
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && !pkg.is_active) return false;
      if (statusFilter === 'ARCHIVED' && pkg.is_active) return false;

      // Visibility filter
      if (visibilityFilter === 'PUBLIC' && !pkg.is_public) return false;
      if (visibilityFilter === 'PRIVATE' && pkg.is_public) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && pkg.category !== categoryFilter) return false;

      // Search term (name, category, description, included service names)
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchName = (pkg.name || '').toLowerCase().includes(q);
        const matchDesc = (pkg.description || '').toLowerCase().includes(q);
        const matchCat = (pkg.category || '').toLowerCase().includes(q);
        const matchService = (pkg.package_services || []).some((ps) =>
          (ps.service_name_snapshot || '').toLowerCase().includes(q)
        );
        if (!matchName && !matchDesc && !matchCat && !matchService) return false;
      }

      return true;
    });
  }, [packages, statusFilter, visibilityFilter, categoryFilter, searchTerm]);

  // 6. Create Package Mutation
  const createMutation = useMutation({
    mutationFn: (payload) => packageApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setIsCreateModalOpen(false);
      resetForm();
      showAlert({
        title: 'Package Created',
        message: `Package "${res?.data?.name || 'Bridal Combo'}" created successfully.`,
        type: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create package';
      showAlert({
        title: 'Could Not Create Package',
        message: msg,
        type: 'error',
      });
    },
  });

  // 7. Update Package Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => packageApi.update(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-detail', variables.id] });
      setEditingPackage(null);
      resetForm();
      showAlert({
        title: 'Package Updated',
        message: `Package "${res?.data?.name || 'Bridal Combo'}" updated successfully.`,
        type: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update package';
      showAlert({
        title: 'Could Not Update Package',
        message: msg,
        type: 'error',
      });
    },
  });

  // 8. Archive Package Mutation (Soft delete)
  const archiveMutation = useMutation({
    mutationFn: (id) => packageApi.archive(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-detail', id] });
      showAlert({
        title: 'Package Archived',
        message: 'Package marked as inactive and archived.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Archival Failed',
        message: err.response?.data?.message || err.message || 'Could not archive package.',
        type: 'error',
      });
    },
  });

  // 9. Delete Package Mutation (Permanent delete if safe)
  const deleteMutation = useMutation({
    mutationFn: (id) => packageApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      if (viewingPackageId) setViewingPackageId(null);
      showAlert({
        title: 'Package Removed',
        message: 'Package was safely removed from your catalog.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Delete Failed',
        message:
          err.response?.data?.message ||
          err.message ||
          'Could not delete package. It may be referenced by existing bookings or quotations.',
        type: 'error',
      });
    },
  });

  // Form helpers
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_rupees: '',
      is_public: false,
      is_active: true,
      display_order: 0,
      services: [],
    });
    setFormErrors({});
    setServiceSearchTerm('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (pkg) => {
    // Transform attached package_services into form format
    const initialServices = (pkg.package_services || []).map((ps) => {
      const s = ps.services || {};
      return {
        service_id: ps.service_id || s.id || null,
        service_name_snapshot: ps.service_name_snapshot || s.name || 'Artistry Service',
        quantity: ps.quantity || 1,
        default_price_paise: s.default_price_paise !== undefined ? Number(s.default_price_paise) : 0,
        duration_minutes: s.duration_minutes || null,
        notes: ps.notes || '',
      };
    });

    setFormData({
      name: pkg.name || '',
      description: pkg.description || '',
      price_rupees:
        pkg.price_paise !== undefined && Number(pkg.price_paise) > 0
          ? (Number(pkg.price_paise) / 100).toString()
          : '',
      is_public: pkg.is_public || false,
      is_active: pkg.is_active !== undefined ? pkg.is_active : true,
      display_order: pkg.display_order || 0,
      services: initialServices,
    });
    setFormErrors({});
    setServiceSearchTerm('');
    setEditingPackage(pkg);
  };

  // Service selection helpers
  const handleToggleService = (service) => {
    setFormData((prev) => {
      const exists = prev.services.some((s) => s.service_id === service.id);
      if (exists) {
        return {
          ...prev,
          services: prev.services.filter((s) => s.service_id !== service.id),
        };
      } else {
        return {
          ...prev,
          services: [
            ...prev.services,
            {
              service_id: service.id,
              service_name_snapshot: service.name,
              quantity: 1,
              default_price_paise: Number(service.default_price_paise || 0),
              duration_minutes: service.duration_minutes || null,
              notes: '',
            },
          ],
        };
      }
    });
  };

  const handleUpdateQuantity = (serviceId, delta) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((item) => {
        if (item.service_id === serviceId) {
          const newQty = Math.max(1, (item.quantity || 1) + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    }));
  };

  const handleRemoveSelectedService = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.service_id !== serviceId),
    }));
  };

  // Live Price & Duration Summary calculations
  const livePriceSummary = useMemo(() => {
    const totalDefaultPricePaise = formData.services.reduce((acc, curr) => {
      const price = Number(curr.default_price_paise || 0);
      const qty = Number(curr.quantity || 1);
      return acc + price * qty;
    }, 0);

    const totalDurationMinutes = formData.services.reduce((acc, curr) => {
      const mins = Number(curr.duration_minutes || 0);
      const qty = Number(curr.quantity || 1);
      return acc + mins * qty;
    }, 0);

    const packagePricePaise =
      formData.price_rupees !== '' && !isNaN(Number(formData.price_rupees))
        ? Math.round(Number(formData.price_rupees) * 100)
        : null;

    let differencePaise = null;
    let savingsPercentage = null;
    if (packagePricePaise !== null && totalDefaultPricePaise > 0) {
      differencePaise = totalDefaultPricePaise - packagePricePaise;
      if (differencePaise > 0) {
        savingsPercentage = Math.round((differencePaise / totalDefaultPricePaise) * 100);
      }
    }

    return {
      totalDefaultPricePaise,
      totalDurationMinutes,
      packagePricePaise,
      differencePaise,
      savingsPercentage,
    };
  }, [formData.services, formData.price_rupees]);

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Package name must be at least 2 characters';
    }

    // Price is optional: if provided, must be valid non-negative number
    if (formData.price_rupees !== '' && formData.price_rupees !== undefined) {
      const num = Number(formData.price_rupees);
      if (isNaN(num) || num < 0) {
        errors.price_rupees = 'Price must be a valid non-negative number';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const pricePaise =
      formData.price_rupees !== '' && formData.price_rupees !== undefined
        ? Math.max(0, Math.round(Number(formData.price_rupees) * 100))
        : 0;

    const servicesPayload = formData.services.map((s) => ({
      service_id: s.service_id || null,
      service_name_snapshot: s.service_name_snapshot,
      quantity: s.quantity || 1,
      notes: s.notes || null,
    }));

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price_paise: pricePaise,
      currency: 'INR',
      is_public: formData.is_public,
      is_active: formData.is_active,
      display_order: Number(formData.display_order) || 0,
      services: servicesPayload,
    };

    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleArchivePackage = async (pkg) => {
    const confirmed = await showConfirm({
      title: 'Archive this package?',
      message: `"${pkg.name}" will be marked as inactive while preserving all quotation and booking history.`,
      confirmText: 'Archive Package',
      cancelText: 'Cancel',
      type: 'warning',
    });

    if (confirmed) {
      archiveMutation.mutate(pkg.id);
    }
  };

  const handleDeletePackage = async (pkg) => {
    const confirmed = await showConfirm({
      title: 'Delete this package?',
      message: `Please confirm that you want to remove "${pkg.name}". Existing bookings or quotations may reference it.`,
      confirmText: 'Remove Package',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(pkg.id);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setVisibilityFilter('ALL');
  };

  // Filtered services in modal selector
  const selectableServices = useMemo(() => {
    if (!serviceSearchTerm.trim()) return availableServices;
    const q = serviceSearchTerm.trim().toLowerCase();
    return availableServices.filter(
      (s) => (s.name || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
    );
  }, [availableServices, serviceSearchTerm]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Bridal Combos & Packages"
        subtitle="Create and manage bridal makeup packages, bundled services, pricing, and inclusions."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchPackages()}
              disabled={isFetchingPackages}
              title="Refresh Packages"
              className="border-[#F0E7DE] hover:bg-stone-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingPackages ? 'animate-spin' : ''}`} />
            </Button>

            <Button size="sm" onClick={openCreateModal} className="shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Package
            </Button>
          </div>
        }
      />

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Packages */}
        <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-sm hover:border-orange-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Total Packages</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#292524]">{metrics.total}</span>
            <span className="text-[11px] text-stone-400 font-medium">in catalog</span>
          </div>
        </Card>

        {/* Metric 2: Active Packages */}
        <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-sm hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Active Combos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{metrics.active}</span>
            <span className="text-[11px] text-stone-400 font-medium">available</span>
          </div>
        </Card>

        {/* Metric 3: Average Package Price */}
        <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-sm hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Avg. Package Value</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#C2410C] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-[#292524]">
              {metrics.avgPricePaise > 0 ? formatINR(metrics.avgPricePaise) : '₹0'}
            </span>
          </div>
        </Card>

        {/* Metric 4: Total Included Services */}
        <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-sm hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Total Inclusions</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#292524]">{metrics.totalIncludedServicesCount}</span>
            <span className="text-[11px] text-stone-400 font-medium">bundled services</span>
          </div>
        </Card>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#F0E7DE] shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search packages by name, category or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#F0E7DE] bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all text-[#292524]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Category Filter */}
          <div className="w-full sm:w-44">
            <ModernDropdown
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={FILTER_CATEGORY_OPTIONS}
              placeholder="Category"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36">
            <ModernDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={FILTER_STATUS_OPTIONS}
              placeholder="Status"
            />
          </div>

          {/* Visibility Filter */}
          <div className="w-full sm:w-38">
            <ModernDropdown
              value={visibilityFilter}
              onChange={setVisibilityFilter}
              options={FILTER_VISIBILITY_OPTIONS}
              placeholder="Website"
            />
          </div>

          {/* Reset Filters */}
          {(searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || visibilityFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-stone-500 hover:text-stone-800 text-xs px-2.5 h-9 shrink-0"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* 4. Main Package Grid / Loading / Empty State */}
      {isLoadingPackages ? (
        <div className="py-16 flex flex-col items-center justify-center">
          <LoadingSpinner text="Loading bridal packages..." />
        </div>
      ) : isPackagesError ? (
        <Card className="p-8 text-center border-rose-200 bg-rose-50/30 rounded-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-900 text-base">Unable to load packages</h3>
          <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
            {packagesError?.response?.data?.message ||
              packagesError?.message ||
              "We couldn't retrieve your packages. Please check your connection and try again."}
          </p>
          <Button
            size="sm"
            onClick={() => refetchPackages()}
            className="mt-4"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </Card>
      ) : packages.length === 0 ? (
        /* Empty catalog state */
        <Card className="p-12 text-center border-dashed border-2 border-stone-200 rounded-3xl bg-white shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-stone-900 text-lg">No packages configured</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
            Bundle your artistry services into attractive bridal packages for your clients.
            Offer Muhurtham combos, Sangeet glam, and Reception packages with clear savings.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {availableServices.length === 0 && (
              <Link href="/services">
                <Button variant="outline" size="sm" className="border-[#F0E7DE]">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#F97316]" />
                  Add Services First
                </Button>
              </Link>
            )}
            <Button size="sm" onClick={openCreateModal} className="shadow-md">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Your First Package
            </Button>
          </div>
        </Card>
      ) : filteredPackages.length === 0 ? (
        /* Filter / Search Empty State */
        <Card className="p-10 text-center border-stone-200 rounded-2xl bg-white shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">No matching packages</h3>
          <p className="text-xs text-stone-500 mt-1">
            Try changing your search term or adjusting the filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="mt-4 border-[#F0E7DE]"
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        /* Packages Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPackages.map((pkg) => {
            const inclusions = pkg.package_services || [];
            const isInactive = !pkg.is_active;

            // Compute total default service price sum for comparison
            const totalServicePricePaise = inclusions.reduce((acc, curr) => {
              const sp = curr.services?.default_price_paise || 0;
              return acc + Number(sp) * (curr.quantity || 1);
            }, 0);

            // Compute total estimated duration
            const totalDurationMins = inclusions.reduce((acc, curr) => {
              const d = curr.services?.duration_minutes || 0;
              return acc + Number(d) * (curr.quantity || 1);
            }, 0);

            return (
              <Card
                key={pkg.id}
                className={`p-5 flex flex-col justify-between border-[#F0E7DE] rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden bg-white ${
                  isInactive ? 'opacity-75 bg-stone-50/60' : ''
                }`}
              >
                {/* Status Accent Top Line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isInactive ? 'bg-stone-300' : 'bg-[#F97316]'
                  }`}
                />

                <div>
                  {/* Card Header: Category, Status, & Quick Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-[#C2410C] border border-orange-200/60">
                        <Sparkles className="w-2.5 h-2.5 mr-1" />
                        {pkg.category}
                      </span>

                      {pkg.is_public ? (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60" title="Visible on public website">
                          <Globe className="w-2.5 h-2.5 mr-1" />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200" title="Studio Internal Only">
                          <Lock className="w-2.5 h-2.5 mr-1" />
                          Studio
                        </span>
                      )}

                      {isInactive && (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-200 text-stone-600">
                          Archived
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingPackageId(pkg.id)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        title="View Full Package Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(pkg)}
                        className="p-1.5 text-stone-400 hover:text-[#C2410C] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Package"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-bold text-[#292524] text-base leading-snug line-clamp-1 mt-1">
                    {pkg.name}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {pkg.description || 'Complete bridal makeover combo package with curated services.'}
                  </p>

                  {/* Duration pill if available */}
                  {totalDurationMins > 0 && (
                    <div className="mt-2.5 flex items-center gap-1 text-[11px] text-stone-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#F97316]" />
                      <span>Est. Duration: {formatDuration(totalDurationMins)}</span>
                    </div>
                  )}

                  {/* Included Services List */}
                  <div className="mt-3.5 border-t border-[#F0E7DE] pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Included Services ({inclusions.length})
                      </span>
                    </div>

                    {inclusions.length === 0 ? (
                      <p className="text-[11px] text-stone-400 italic">No specific services bundled yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {inclusions.slice(0, 3).map((ps) => (
                          <div
                            key={ps.id}
                            className="flex items-center justify-between text-xs text-[#292524] bg-stone-50/70 px-2.5 py-1.5 rounded-lg border border-stone-100"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 pr-2">
                              <Check className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                              <span className="truncate font-medium text-[11px]">
                                {ps.service_name_snapshot}
                              </span>
                              {ps.quantity > 1 && (
                                <span className="text-stone-500 text-[10px] font-semibold shrink-0">
                                  x{ps.quantity}
                                </span>
                              )}
                            </div>
                            {ps.services?.default_price_paise > 0 && (
                              <span className="text-[10px] text-stone-500 font-semibold shrink-0">
                                {formatINR(ps.services.default_price_paise)}
                              </span>
                            )}
                          </div>
                        ))}

                        {inclusions.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setViewingPackageId(pkg.id)}
                            className="text-[11px] text-[#C2410C] hover:text-[#9A3412] font-medium pt-0.5 flex items-center gap-1 cursor-pointer"
                          >
                            <span>+{inclusions.length - 3} more service{inclusions.length - 3 > 1 ? 's' : ''}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Pricing & Actions */}
                <div className="mt-5 pt-3.5 border-t border-[#F0E7DE] flex items-end justify-between">
                  <div>
                    {totalServicePricePaise > Number(pkg.price_paise) && (
                      <div className="flex items-center gap-1 text-[11px] text-stone-400 line-through">
                        <span>Original: {formatINR(totalServicePricePaise)}</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-[11px] text-stone-500 font-medium">Package:</span>
                      <span className="text-lg font-bold text-[#C2410C]">
                        {Number(pkg.price_paise) > 0 ? formatINR(pkg.price_paise) : 'On Request'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingPackageId(pkg.id)}
                      className="text-xs text-stone-600 hover:text-stone-900 px-2 h-8"
                    >
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(pkg)}
                      className="text-xs border-[#F0E7DE] hover:border-orange-300 text-[#C2410C] px-2.5 h-8"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          5. CREATE / EDIT PACKAGE MODAL
         ========================================================================= */}
      {(isCreateModalOpen || editingPackage) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F0E7DE] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-[#FFFDF9] border-b border-[#F0E7DE] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#292524] text-base leading-tight">
                    {editingPackage ? 'Edit Bridal Package' : 'Create Bridal Package'}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {editingPackage
                      ? 'Update package pricing, services, and public visibility'
                      : 'Bundle multiple artistry services into an attractive bridal combo'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingPackage(null);
                  resetForm();
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {/* SECTION A: Package Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Package Information
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1">
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Muhurtham Grand Combo (Makeup, Hair & Draping)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1">
                    Description & Highlights (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe what makes this package special, complimentary touch-ups, styling details, or trial sessions included."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] resize-none"
                  />
                </div>
              </div>

              {/* SECTION B: Included Services Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    Included Services ({formData.services.length} selected)
                  </h4>
                  <span className="text-[10px] text-stone-500">
                    Select from your catalog
                  </span>
                </div>

                {/* Search services filter in modal */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search available services to include..."
                    value={serviceSearchTerm}
                    onChange={(e) => setServiceSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#F0E7DE] bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 text-[#292524]"
                  />
                </div>

                {/* Available Service Checkboxes */}
                {isLoadingServices ? (
                  <div className="py-4 text-center text-xs text-stone-500">Loading services...</div>
                ) : availableServices.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Add services before creating a package</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Create your artistry services first, then combine them into bridal packages.
                      </p>
                    </div>
                    <Link href="/services">
                      <Button size="sm" variant="outline" className="text-xs border-amber-300">
                        Go to /services
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#F0E7DE] rounded-2xl p-2.5 bg-stone-50/40 custom-scrollbar">
                    {selectableServices.map((service) => {
                      const isSelected = formData.services.some((s) => s.service_id === service.id);
                      return (
                        <div
                          key={service.id}
                          onClick={() => handleToggleService(service)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-orange-50/90 border-[#F97316]/40 text-[#292524]'
                              : 'bg-white border-[#F0E7DE] hover:border-stone-300 text-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                isSelected
                                  ? 'bg-[#F97316] border-[#F97316] text-white'
                                  : 'border-stone-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{service.name}</p>
                              {service.duration_minutes > 0 && (
                                <p className="text-[10px] text-stone-400">
                                  {formatDuration(service.duration_minutes)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-[#C2410C]">
                              {Number(service.default_price_paise) > 0
                                ? formatINR(service.default_price_paise)
                                : 'On Request'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Services Pill list & Quantity controls */}
                {formData.services.length > 0 && (
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-stone-600">
                        Configured Inclusions ({formData.services.length}):
                      </p>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, services: [] }))}
                        className="text-[10px] text-stone-400 hover:text-stone-700 underline"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {formData.services.map((item) => (
                        <div
                          key={item.service_id || item.service_name_snapshot}
                          className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200 text-xs shadow-xs hover:border-orange-200 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-[#292524] truncate block">
                              {item.service_name_snapshot}
                            </span>
                            {item.duration_minutes > 0 && (
                              <span className="text-[10px] text-stone-400 block">
                                {formatDuration(item.duration_minutes)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {/* Quantity controls */}
                            <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-0.5 border border-stone-200/60">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.service_id, -1)}
                                className="w-5 h-5 flex items-center justify-center rounded text-stone-600 hover:bg-white text-xs font-bold cursor-pointer"
                                title="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold px-1.5 text-stone-800">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.service_id, 1)}
                                className="w-5 h-5 flex items-center justify-center rounded text-stone-600 hover:bg-white text-xs font-bold cursor-pointer"
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            <span className="text-xs font-semibold text-stone-700 min-w-16 text-right">
                              {Number(item.default_price_paise) > 0
                                ? formatINR(Number(item.default_price_paise) * (item.quantity || 1))
                                : <span className="text-[11px] text-stone-400 font-normal">On Request</span>}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveSelectedService(item.service_id)}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove service"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION C: Package Pricing & Live Summary Calculator */}
              <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#C2410C] uppercase tracking-wider flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" /> Package Pricing & Live Summary
                  </h4>
                  {livePriceSummary.totalDurationMinutes > 0 && (
                    <span className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#F97316]" />
                      Total Duration: {formatDuration(livePriceSummary.totalDurationMinutes)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#292524]">
                        Final Package Price (₹ Rupees)
                      </label>
                      <span className="text-[10px] text-stone-400 font-medium">Optional</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-stone-400 font-semibold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="e.g. 25000 (Optional / On Request)"
                        value={formData.price_rupees}
                        onChange={(e) => setFormData({ ...formData, price_rupees: e.target.value })}
                        className="w-full text-xs pl-8 pr-3.5 py-2.5 rounded-xl border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 font-semibold text-[#292524]"
                      />
                    </div>
                    {formErrors.price_rupees && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.price_rupees}</p>
                    )}
                  </div>

                  {/* Combined Default Service Price & Savings Display */}
                  <div className="p-3 bg-white rounded-xl border border-orange-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-stone-500 text-[11px]">
                      <span>Combined Default Price:</span>
                      <span className="font-semibold text-stone-700">
                        {livePriceSummary.totalDefaultPricePaise > 0
                          ? formatINR(livePriceSummary.totalDefaultPricePaise)
                          : '₹0'}
                      </span>
                    </div>

                    {livePriceSummary.differencePaise !== null && livePriceSummary.differencePaise > 0 ? (
                      <div className="flex items-center justify-between text-emerald-600 font-bold text-[11px] pt-1 border-t border-stone-100">
                        <span>Client Savings / Combo Discount:</span>
                        <span>
                          {formatINR(livePriceSummary.differencePaise)} ({livePriceSummary.savingsPercentage}%)
                        </span>
                      </div>
                    ) : livePriceSummary.differencePaise !== null && livePriceSummary.differencePaise < 0 ? (
                      <div className="flex items-center justify-between text-amber-600 text-[11px] pt-1 border-t border-stone-100">
                        <span>Premium over standard sum:</span>
                        <span>+{formatINR(Math.abs(livePriceSummary.differencePaise))}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* SECTION D: Visibility & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#F0E7DE] hover:bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="w-4 h-4 text-[#F97316] rounded border-stone-300 focus:ring-[#F97316]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#292524] block">Show on Public Website</span>
                    <span className="text-[10px] text-stone-400 block">
                      Enables prospective brides to browse this combo online
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#F0E7DE] hover:bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#292524] block">Active for Bookings</span>
                    <span className="text-[10px] text-stone-400 block">
                      Available to select when creating quotes and bookings
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#F0E7DE]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingPackage(null);
                    resetForm();
                  }}
                  className="border-[#F0E7DE]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="shadow-sm"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1.5" />
                  )}
                  {editingPackage ? 'Save Changes' : 'Create Package'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. PACKAGE DETAILS MODAL / DRAWER
         ========================================================================= */}
      {viewingPackageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#F0E7DE] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4.5 bg-[#FFFDF9] border-b border-[#F0E7DE] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#292524] text-base leading-tight">
                    Package Details
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Complete inclusions and pricing breakdown
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPackageId(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {isLoadingDetail || !selectedPackage ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner text="Loading package details..." />
                </div>
              ) : (
                <>
                  {/* Title & Badges */}
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-[#C2410C] border border-orange-200">
                        {selectedPackage.category}
                      </span>
                      {selectedPackage.is_public ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          Public Website
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                          Studio Internal
                        </span>
                      )}
                      {selectedPackage.is_active ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-200 text-stone-600">
                          Archived
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#292524]">{selectedPackage.name}</h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      {selectedPackage.description || 'Full wedding package combo.'}
                    </p>
                  </div>

                  {/* Pricing Overview Box */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-stone-500 block">Package Price</span>
                      <span className="text-2xl font-bold text-[#C2410C]">
                        {Number(selectedPackage.price_paise) > 0
                          ? formatINR(selectedPackage.price_paise)
                          : 'On Request'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-stone-500 block">Currency</span>
                      <span className="text-xs font-semibold text-stone-700">
                        {selectedPackage.currency || 'INR'}
                      </span>
                    </div>
                  </div>

                  {/* Inclusions Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5">
                      Included Services ({selectedPackage.package_services?.length || 0})
                    </h4>

                    {(!selectedPackage.package_services || selectedPackage.package_services.length === 0) ? (
                      <p className="text-xs text-stone-400 italic">No services bundled in this package.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedPackage.package_services.map((ps) => {
                          const s = ps.services;
                          return (
                            <div
                              key={ps.id}
                              className="p-3 rounded-xl border border-stone-200 bg-white flex items-center justify-between"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                                  <span className="text-xs font-semibold text-[#292524] truncate">
                                    {ps.service_name_snapshot}
                                  </span>
                                  {ps.quantity > 1 && (
                                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                                      x{ps.quantity}
                                    </span>
                                  )}
                                </div>
                                {s?.duration_minutes > 0 && (
                                  <p className="text-[10px] text-stone-400 mt-0.5 ml-5">
                                    Duration: {formatDuration(s.duration_minutes)}
                                  </p>
                                )}
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-stone-800">
                                  {s?.default_price_paise > 0
                                    ? formatINR(Number(s.default_price_paise) * (ps.quantity || 1))
                                    : 'Included'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions Drawer Footer */}
                  <div className="pt-4 border-t border-[#F0E7DE] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedPackage.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setViewingPackageId(null);
                            handleArchivePackage(selectedPackage);
                          }}
                          className="text-stone-500 hover:text-amber-600 text-xs px-2.5"
                        >
                          <Archive className="w-3.5 h-3.5 mr-1" />
                          Archive
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setViewingPackageId(null);
                          handleDeletePackage(selectedPackage);
                        }}
                        className="text-stone-400 hover:text-rose-600 text-xs px-2.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingPackageId(null)}
                        className="border-[#F0E7DE] text-xs"
                      >
                        Close
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const p = selectedPackage;
                          setViewingPackageId(null);
                          openEditModal(p);
                        }}
                        className="text-xs"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit Package
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
