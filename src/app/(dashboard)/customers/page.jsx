'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CalendarDays,
  Clock,
  Sparkles,
  Edit,
  Trash2,
  Archive,
  Eye,
  X,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Building2,
  FileText,
  CreditCard,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Card, PageHeader, Button, LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import { useModalAlert } from '@/components/ui/ModalAlert';
import { customerApi } from '@/services/api/modules';
import { formatDate, formatINR } from '@/utils/formatters';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useModalAlert();

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Form input state for Create / Edit
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    alternate_phone: '',
    city: '',
    address: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // 1. Fetch Customers List
  const {
    data: listResponse,
    isLoading,
    isError,
    error: listError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['customers', searchTerm, includeArchived],
    queryFn: () =>
      customerApi.list({
        search: searchTerm.trim() || undefined,
        includeArchived,
      }),
  });

  const customers = useMemo(() => {
    return listResponse?.data?.customers || [];
  }, [listResponse]);

  // 2. Fetch Selected Customer Details
  const {
    data: detailResponse,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['customer-detail', selectedCustomerId],
    queryFn: () => customerApi.getById(selectedCustomerId),
    enabled: !!selectedCustomerId,
  });

  const selectedCustomer = detailResponse?.data || null;

  // 3. Create Customer Mutation
  const createMutation = useMutation({
    mutationFn: (data) => customerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddModalOpen(false);
      resetForm();
      showAlert({
        title: 'Client Added',
        message: 'Client added successfully.',
        type: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to add client';
      showAlert({
        title: 'Could Not Add Client',
        message: msg,
        type: 'error',
      });
    },
  });

  // 4. Update Customer Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customerApi.update(id, data),
    onSuccess: (res, variables) => {
      // Invalidate customer queries
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['customers-for-booking'] });
      queryClient.invalidateQueries({ queryKey: ['customers-picker'] });

      // Synchronize related dependent modules immediately
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['consultation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['consultations-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-upcoming-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-enquiries'] });

      setEditingCustomer(null);
      resetForm();
      showAlert({
        title: 'Client Updated',
        message: 'Client details updated and synchronized across all records successfully.',
        type: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update client details';
      showAlert({
        title: 'Could Not Update Client',
        message: msg,
        type: 'error',
      });
    },
  });

  // 5. Archive Customer Mutation
  const archiveMutation = useMutation({
    mutationFn: (id) => customerApi.archive(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-detail', id] });
      showAlert({
        title: 'Client Archived',
        message: 'Client profile has been safely archived.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Error',
        message: err.message || 'Failed to archive client.',
        type: 'error',
      });
    },
  });

  // 6. Delete Customer Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => customerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (selectedCustomerId) {
        setSelectedCustomerId(null);
      }
      showAlert({
        title: 'Client Deleted',
        message: 'Client was permanently removed from records.',
        type: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete client';
      showAlert({
        title: 'Delete Failed',
        message: msg,
        type: 'error',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      alternate_phone: '',
      city: '',
      address: '',
      notes: '',
    });
    setFormErrors({});
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (c) => {
    setFormData({
      full_name: c.full_name || '',
      phone: c.phone || '',
      email: c.email || '',
      alternate_phone: c.alternate_phone || '',
      city: c.city || '',
      address: c.address || '',
      notes: c.notes?.replace('[ARCHIVED]', '').trim() || '',
    });
    setFormErrors({});
    setEditingCustomer(c);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }
    const cleanPhone = formData.phone.trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      errors.phone = 'Valid phone number is required (at least 7 digits)';
    }
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please provide a valid email address';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      alternate_phone: formData.alternate_phone.trim() || undefined,
      city: formData.city.trim() || undefined,
      address: formData.address.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeleteClient = async (c) => {
    const confirmed = await showConfirm({
      title: 'Delete this client?',
      message: `Please confirm that you want to delete ${c.full_name}. Related bookings, payments, and records may be affected. If this client has active bookings, they must be archived instead.`,
      confirmText: 'Delete Client',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(c.id);
    }
  };

  const handleArchiveClient = async (c) => {
    const confirmed = await showConfirm({
      title: 'Archive this client?',
      message: `This will mark ${c.full_name} as archived while keeping all historical booking and revenue records safe.`,
      confirmText: 'Archive Client',
      cancelText: 'Keep Active',
      type: 'warning',
    });

    if (confirmed) {
      archiveMutation.mutate(c.id);
    }
  };

  // Helper for Initials Avatar
  const getInitials = (name) => {
    if (!name) return 'B';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Helper for WhatsApp link
  const getWhatsAppLink = (phone, name) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    const normalized = digits.length === 10 ? `91${digits}` : digits;
    const msg = encodeURIComponent(`Hi ${name}! Connecting with you regarding your bridal booking with our studio.`);
    return `https://wa.me/${normalized}?text=${msg}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header - Fully Responsive with Modern Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center sm:hidden">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#292524] tracking-tight">
              Brides & Clients
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Manage client contact profiles, style preferences, and booking history.
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="w-full sm:w-auto bg-[#F97316] hover:bg-[#C2410C] text-white font-bold shadow-xs hover:shadow-md transition-all active:scale-95 py-2.5 sm:py-2 text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4 mr-1.5 shrink-0" />
          <span>Add New Bride</span>
        </Button>
      </div>

      {/* Filter and Search Bar - Responsive layout */}
      <Card className="p-3 sm:p-4 border-[#F0E7DE] shadow-2xs rounded-2xl bg-white">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by client name, mobile phone or email..."
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

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer px-3 py-2 rounded-xl border border-[#F0E7DE] bg-white hover:bg-stone-50 select-none transition-colors">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="w-3.5 h-3.5 text-[#F97316] rounded border-stone-300 focus:ring-[#F97316]"
              />
              <span>Show Archived</span>
            </label>

            <button
              onClick={() => refetch()}
              title="Refresh list"
              className="p-2 text-stone-500 hover:text-stone-800 rounded-xl border border-[#F0E7DE] bg-white hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#F97316]' : ''}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Main Content Area: Loading / Error / Empty / List */}
      {isLoading ? (
        <LoadingSpinner text="Fetching client records..." />
      ) : isError ? (
        <Card className="p-6 sm:p-8 text-center border-rose-200 bg-rose-50/40 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#292524] text-base mb-1">Unable to load clients</h3>
          <p className="text-xs text-[#78716C] max-w-sm mx-auto mb-4">
            {listError?.message || "We couldn't retrieve your customer records. Please try again."}
          </p>
          <Button size="sm" onClick={() => refetch()} className="bg-[#292524] hover:bg-stone-800 text-white">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </Card>
      ) : customers.length === 0 ? (
        searchTerm ? (
          <EmptyState
            icon={Search}
            title="No matching clients"
            description="Try another name, phone number, or email address."
            action={
              <Button size="sm" variant="outline" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            }
          />
        ) : (
          <div className="py-12 px-4 rounded-3xl border border-dashed border-[#F0E7DE] bg-white/70 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100/80 text-[#F97316] flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-[#292524] mb-1">No clients found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
              Your bridal customer directory is currently empty. Start building your client base by adding bride profiles.
            </p>
            <Button
              size="md"
              onClick={openAddModal}
              className="bg-[#F97316] hover:bg-[#C2410C] text-white font-bold shadow-xs hover:shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Your First Bride
            </Button>
          </div>
        )
      ) : (
        /* Customer Grid - Fully responsive on Mobile & Desktop */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {customers.map((c) => {
            const waLink = getWhatsAppLink(c.phone, c.full_name);
            return (
              <Card
                key={c.id}
                className="p-4 sm:p-5 border-[#F0E7DE] hover:border-[#F97316]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between group rounded-2xl bg-white"
              >
                <div>
                  {/* Top card row: Avatar, Name, Status Badge */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F0E7DE]/70">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 text-[#C2410C] font-extrabold text-sm flex items-center justify-center shrink-0 border border-orange-200/60 shadow-2xs">
                        {getInitials(c.full_name)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#292524] text-sm truncate group-hover:text-[#F97316] transition-colors">
                          {c.full_name}
                        </h4>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          Added {formatDate(c.created_at)}
                        </span>
                      </div>
                    </div>

                    {c.is_archived && (
                      <Badge variant="warning" className="shrink-0 text-[10px]">
                        Archived
                      </Badge>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3.5 space-y-2 text-xs text-stone-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-stone-700 min-w-0">
                        <Phone className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                        <span className="font-medium truncate">{c.phone || 'No phone'}</span>
                      </div>
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 shrink-0 ml-2 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100"
                        >
                          <MessageSquare className="w-3 h-3 fill-current" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    {c.email && (
                      <div className="flex items-center gap-2 text-stone-600 truncate">
                        <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}

                    {c.city && (
                      <div className="flex items-center gap-2 text-stone-600">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{c.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Event or Booking Stats pill */}
                  <div className="mt-4 pt-3 border-t border-[#F0E7DE]/50 flex items-center justify-between text-[11px] text-stone-500">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        {c.bookings_count} Booking{c.bookings_count === 1 ? '' : 's'}
                      </span>
                    </div>

                    {c.upcoming_event_date ? (
                      <span className="text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                        Event: {formatDate(c.upcoming_event_date)}
                      </span>
                    ) : (
                      <span className="text-stone-400">
                        {c.enquiries_count} Enquir{c.enquiries_count === 1 ? 'y' : 'ies'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-[#F0E7DE] flex items-center justify-between gap-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setSelectedCustomerId(c.id)}
                    className="text-stone-700 hover:text-[#F97316] font-bold"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Details
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      title="Edit Client"
                      className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {!c.is_archived && (
                      <button
                        onClick={() => handleArchiveClient(c)}
                        title="Archive Client"
                        className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteClient(c)}
                      title="Delete Client"
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
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

      {/* MODAL 1: Add New Bride / Edit Bride */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#F0E7DE] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-[#FFFDF9] border-b border-[#F0E7DE] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#292524] text-base leading-tight">
                    {editingCustomer ? 'Edit Client Profile' : 'Add New Bride'}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {editingCustomer ? 'Update contact & location details' : 'Create client profile in your studio directory'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                  resetForm();
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deepika Ramesh"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={`w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 ${
                    formErrors.full_name ? 'border-red-400 focus:border-red-500' : 'border-[#F0E7DE] focus:border-[#F97316]'
                  }`}
                />
                {formErrors.full_name && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">{formErrors.full_name}</p>
                )}
              </div>

              {/* Phone & Alternate Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1">
                    Mobile Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 ${
                      formErrors.phone ? 'border-red-400 focus:border-red-500' : 'border-[#F0E7DE] focus:border-[#F97316]'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1">
                    Alternate Phone <span className="text-stone-400 text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9840123456"
                    value={formData.alternate_phone}
                    onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                  />
                </div>
              </div>

              {/* Email Address & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1">
                    Email Address <span className="text-stone-400 text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. bride@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 ${
                      formErrors.email ? 'border-red-400 focus:border-red-500' : 'border-[#F0E7DE] focus:border-[#F97316]'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1">
                    City / Location <span className="text-stone-400 text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Madurai / Chennai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1">
                  Street Address <span className="text-stone-400 text-[10px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 42 Priyanka Avenue, Anna Nagar"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1">
                  Style Notes & Preferences <span className="text-stone-400 text-[10px]">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Skin tone, hair preference, muhurtham timing, special requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-[#F0E7DE] flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                    resetForm();
                  }}
                  className="text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#F97316] hover:bg-[#C2410C] text-white font-bold"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving Client...'
                    : editingCustomer
                    ? 'Save Changes'
                    : 'Add Bride'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Customer Details - Modernized CRM Dossier */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] border border-[#F0E7DE] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* Header with Warm Aesthetic and Client Highlights */}
            <div className="px-5 sm:px-7 py-5 bg-gradient-to-b from-[#FFFDF9] to-white border-b border-[#F0E7DE] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#C2410C] text-white font-extrabold flex items-center justify-center text-base shadow-sm shrink-0">
                  {selectedCustomer ? getInitials(selectedCustomer.full_name) : 'C'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[#292524] text-lg leading-tight truncate">
                      {selectedCustomer?.full_name || 'Client Profile'}
                    </h3>
                    {selectedCustomer?.is_archived && (
                      <Badge variant="warning" className="text-[10px] shrink-0">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                    <span>Client since {selectedCustomer ? formatDate(selectedCustomer.created_at) : '...'}</span>
                    {selectedCustomer?.city && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#F97316]" />
                          {selectedCustomer.city}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-5 custom-scrollbar">
              {isLoadingDetail ? (
                <LoadingSpinner text="Loading client profile..." />
              ) : isErrorDetail || !selectedCustomer ? (
                <div className="text-center py-10">
                  <p className="text-xs text-rose-600 font-semibold mb-3">Failed to load client details.</p>
                  <Button size="xs" onClick={() => refetchDetail()} variant="outline">
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  {/* Action Hero Bar: Direct Call, WhatsApp & Email */}
                  <div className="p-3.5 sm:p-4 bg-gradient-to-r from-orange-50/70 via-[#FFFDF9] to-amber-50/60 rounded-2xl border border-orange-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 sm:gap-5 text-xs font-semibold flex-wrap">
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#F0E7DE] text-stone-800 hover:text-[#F97316] hover:border-orange-300 shadow-2xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#F97316]" />
                        <span>{selectedCustomer.phone}</span>
                      </a>

                      {selectedCustomer.email ? (
                        <a
                          href={`mailto:${selectedCustomer.email}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#F0E7DE] text-stone-700 hover:text-[#F97316] hover:border-orange-300 shadow-2xs transition-colors truncate max-w-[220px]"
                        >
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <span className="truncate">{selectedCustomer.email}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">No email on file</span>
                      )}
                    </div>

                    {getWhatsAppLink(selectedCustomer.phone, selectedCustomer.full_name) && (
                      <a
                        href={getWhatsAppLink(selectedCustomer.phone, selectedCustomer.full_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 fill-current" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    )}
                  </div>

                  {/* High-Level Overview Cards: Contact & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Contact Details Card */}
                    <div className="p-4 rounded-2xl border border-[#F0E7DE] bg-white shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#F0E7DE]/60 pb-2">
                        <span className="text-[10px] font-extrabold text-[#78716C] uppercase tracking-wider">
                          Contact Details
                        </span>
                        <Phone className="w-3.5 h-3.5 text-[#F97316]" />
                      </div>
                      <div className="text-xs space-y-2">
                        <div>
                          <span className="text-stone-400 block text-[10px] font-medium">Primary Mobile</span>
                          <span className="font-bold text-stone-900">{selectedCustomer.phone}</span>
                        </div>
                        {selectedCustomer.alternate_phone && (
                          <div>
                            <span className="text-stone-400 block text-[10px] font-medium">Alternate Phone</span>
                            <span className="font-bold text-stone-800">{selectedCustomer.alternate_phone}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-stone-400 block text-[10px] font-medium">Email Address</span>
                          <span className="font-semibold text-stone-800">
                            {selectedCustomer.email || 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Location Card */}
                    <div className="p-4 rounded-2xl border border-[#F0E7DE] bg-white shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#F0E7DE]/60 pb-2">
                        <span className="text-[10px] font-extrabold text-[#78716C] uppercase tracking-wider">
                          Location & Venue
                        </span>
                        <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                      </div>
                      <div className="text-xs space-y-2">
                        <div>
                          <span className="text-stone-400 block text-[10px] font-medium">City / District</span>
                          <span className="font-bold text-stone-900">
                            {selectedCustomer.city || 'Not provided'}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px] font-medium">Address</span>
                          <span className="font-semibold text-stone-800">
                            {selectedCustomer.address || 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Style Notes & Preferences */}
                  {selectedCustomer.notes && (
                    <div className="p-4 rounded-2xl border border-amber-200/60 bg-amber-50/30 space-y-1.5 shadow-2xs">
                      <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#F97316]" />
                        <span>Style & Preference Notes</span>
                      </div>
                      <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line font-medium pt-0.5">
                        {selectedCustomer.notes.replace('[ARCHIVED]', '').trim()}
                      </p>
                    </div>
                  )}

                  {/* Section A: Booking History */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#292524] text-xs uppercase tracking-wider flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-[#F97316]" />
                        <span>Booking History ({selectedCustomer.bookings?.length || 0})</span>
                      </h4>
                    </div>

                    {selectedCustomer.bookings?.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedCustomer.bookings.map((b) => (
                          <div
                            key={b.id}
                            className="p-4 rounded-2xl border border-[#F0E7DE] bg-white hover:border-orange-200 shadow-2xs transition-colors space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-stone-900">
                                  #{b.booking_number}
                                </span>
                                <Badge
                                  variant={
                                    b.status === 'CONFIRMED'
                                      ? 'success'
                                      : b.status === 'CANCELLED'
                                      ? 'danger'
                                      : 'default'
                                  }
                                  className="text-[10px] px-2 py-0.5"
                                >
                                  {b.status}
                                </Badge>
                                {b.package_name_snapshot && (
                                  <span className="text-[11px] font-semibold text-[#F97316] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/50">
                                    {b.package_name_snapshot}
                                  </span>
                                )}
                              </div>

                              <div className="text-right">
                                <span className="font-extrabold text-[#292524] text-sm block">
                                  {formatINR(b.total_amount_paise)}
                                </span>
                              </div>
                            </div>

                            {/* Booking Events Breakdown */}
                            {b.booking_events?.length > 0 && (
                              <div className="pt-2 border-t border-[#F0E7DE]/50 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-stone-600">
                                {b.booking_events.map((evt) => (
                                  <div key={evt.id} className="flex items-center gap-1.5 truncate">
                                    <Sparkles className="w-3 h-3 text-[#F97316] shrink-0" />
                                    <span className="font-semibold text-stone-800">{evt.event_kind}</span>
                                    <span>•</span>
                                    <span className="text-stone-500">{formatDate(evt.event_date)}</span>
                                    {evt.venue && <span className="truncate text-stone-400">({evt.venue})</span>}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="text-[10px] text-stone-400 pt-0.5">
                              Created on {formatDate(b.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-[#F0E7DE] text-center text-xs text-stone-400">
                        No bookings recorded for this client yet.
                      </div>
                    )}
                  </div>

                  {/* Section B: Associated Enquiries */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-[#292524] text-xs uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#F97316]" />
                      <span>Associated Enquiries ({selectedCustomer.enquiries?.length || 0})</span>
                    </h4>

                    {selectedCustomer.enquiries?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCustomer.enquiries.map((enq) => (
                          <div
                            key={enq.id}
                            className="p-3.5 rounded-2xl border border-[#F0E7DE] bg-white hover:border-orange-200 shadow-2xs transition-colors flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-stone-900">{enq.event_kind}</div>
                              <div className="text-[11px] text-stone-500">
                                Preferred Date: {formatDate(enq.event_date)}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={enq.status === 'CONVERTED' ? 'success' : 'default'}
                                className="text-[10px]"
                              >
                                {enq.status}
                              </Badge>
                              <span className="text-[10px] text-stone-400 block mt-1">
                                {formatDate(enq.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-[#F0E7DE] text-center text-xs text-stone-400">
                        No enquiries linked to this client.
                      </div>
                    )}
                  </div>

                  {/* Section C: Payment Summary */}
                  {selectedCustomer.payment_records?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-[#292524] text-xs uppercase tracking-wider flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#F97316]" />
                        <span>Payment Records ({selectedCustomer.payment_records.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {selectedCustomer.payment_records.map((p) => (
                          <div
                            key={p.id}
                            className="p-3.5 rounded-2xl border border-[#F0E7DE] bg-white shadow-2xs flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-stone-900 block">
                                {p.receipt_number || 'Receipt'}
                              </span>
                              <span className="text-[11px] text-stone-500">
                                {p.payment_method || 'Payment'} • {formatDate(p.created_at)}
                              </span>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="font-extrabold text-emerald-600 block text-sm">
                                {formatINR(p.amount_paise)}
                              </span>
                              <Badge variant="success" className="text-[10px]">
                                {p.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#FFFDF9] border-t border-[#F0E7DE] flex items-center justify-end shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedCustomerId(null)}
                className="text-stone-600 hover:text-stone-900 font-semibold"
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
